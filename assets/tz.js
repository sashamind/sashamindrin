// Проигрыватель анимаций для кейсов, перенесённых из Тильды
// (_tools/tilda-to-native.mjs). Повторяет поведение tilda-animation-sbs и
// «фикса» из tilda-animation-ext, но без их движка:
//   • scroll — шаги идут по мере прокрутки: каждый шаг занимает di px,
//     начинается, когда верх элемента пересёк линию срабатывания;
//   • hover  — шаги по времени (ti мс), при уходе курсора — назад;
//     на сенсорном экране — по тапу;
//   • fix    — элемент держится на месте dist px прокрутки.
// Все пиксели макета умножаются на масштаб кейса (ширина / ширина макета),
// потому что сама раскладка масштабируется вместе с полем.
// main.js вызывает tzMount(корень кейса) и при смене кейса — возвращённую
// функцию очистки.
(function () {
  'use strict';

  const BASE = { d: 1200, m: 390 };

  // Шаги Тильды → её внутренний вид: задержки (dd/dt) превращаются в
  // отдельные шаги-паузы, сдвиги и поворот — в приращения к прошлому шагу.
  function parseSteps(opts, kind) {
    const raw = opts.map(o => Object.assign({}, o));
    for (let i = 1; i < raw.length; i++) {
      const n = raw[i];
      if (parseInt(n.dd, 10) || parseInt(n.dt, 10)) {
        const pause = Object.assign({}, raw[i - 1]);
        if (n.dt !== undefined) pause.ti = n.dt; else pause.di = n.dd;
        raw.splice(i, 0, pause); i++;
      }
    }
    const steps = raw.map(o => ({
      mx: parseInt(o.mx, 10) || 0,
      my: parseInt(o.my, 10) || 0,
      sx: isNaN(parseFloat(o.sx)) ? 1 : parseFloat(o.sx),
      sy: isNaN(parseFloat(o.sy)) ? 1 : parseFloat(o.sy),
      op: isNaN(parseFloat(o.op)) ? 1 : parseFloat(o.op),
      ro: parseInt(o.ro, 10) || 0,
      di: parseFloat(o.di) || 0,
      ti: parseFloat(o.ti) || 0,
      ea: o.ea,
    }));
    if (kind === 'scroll') {
      let x = steps[0].mx, y = steps[0].my, r = steps[0].ro;
      steps.forEach(s => {
        s.mx -= x; x += s.mx;
        s.my -= y; y += s.my;
        s.ro -= r; r += s.ro;
      });
    }
    return steps;
  }

  const EASE = { easeIn: 'ease-in', easeOut: 'ease-out', easeInOut: 'ease-in-out', bounceFin: 'cubic-bezier(0.34,1.61,0.7,1)' };

  // Ключевые кадры наведения — как в t_animationSBS__generateKeyframes:
  // абсолютные значения на каждом шаге, доля времени по ti.
  function hoverKeyframes(steps, k) {
    const total = steps.reduce((a, s) => a + s.ti, 0);
    let t = 0, x = 0, y = 0, r = 0;
    const frames = steps.map((s, i) => {
      if (i > 0) { x += s.mx; y += s.my; r += s.ro; }
      else { x = s.mx; y = s.my; r = s.ro; }
      t += s.ti;
      const f = {
        offset: total ? t / total : (i === steps.length - 1 ? 1 : 0),
        opacity: s.op,
        transform: `translate(${(x * k).toFixed(2)}px, ${(y * k).toFixed(2)}px) rotate(${r}deg) scale(${s.sx}, ${s.sy})`,
      };
      const next = steps[i + 1];
      f.easing = next && next.ea && EASE[next.ea] ? EASE[next.ea] : 'linear';
      return f;
    });
    // шаг 1 с нулевым временем и нулевой прозрачностью значит «спрятан,
    // пока не навели» — первый кадр тоже прозрачный
    if (steps[1] && steps[1].ti === 0 && steps[1].op === 0) frames[0].opacity = 0;
    // одинаковые offset подряд WAAPI не любит — разводим на волосок
    for (let i = 1; i < frames.length; i++) {
      if (frames[i].offset <= frames[i - 1].offset) frames[i].offset = Math.min(1, frames[i - 1].offset + 1e-4);
    }
    frames[frames.length - 1].offset = 1;
    return { frames, duration: Math.max(total, 1) };
  }

  function scrollParent(el) {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const oy = getComputedStyle(p).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight + 1) return p;
    }
    return window;
  }

  function tzMount(root) {
    const tz = root.querySelector('[data-tz]');
    if (!tz) return null;
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia && matchMedia('(hover: hover)').matches;
    let items = [];          // элементы видимой раскладки с анимацией
    let followers = [];      // элементы, повторяющие прозрачность другого
    let scroller = window;
    const offs = [];         // снятие обработчиков


    function setup() {
      offs.splice(0).forEach(f => f());
      items.forEach(it => it.anim && it.anim.cancel());
      items = [];
      scroller = scrollParent(tz);
      // скролл-контейнер тоже мог смениться (десктоп ↔ телефон)
      const width = tz.getBoundingClientRect().width;
      // раскладка — по ширине кейса, как в контейнерных запросах стилей
      const key = width >= 800 ? 'd' : 'm';
      const K = key.toUpperCase();
      followers = [];
      tz.querySelectorAll('.tz-el').forEach(el => {
        const w = el.querySelector('.tz-w');
        w.style.opacity = ''; w.style.transform = '';
        // data-tz-follow-d / -m="<id>": элемент проявляется и гаснет ровно
        // вместе с другим (например, подпись под анимацией), а не по своей
        // высоте на странице — собственная анимация в этой раскладке не нужна
        const lead = el.dataset['tzFollow' + K];
        if (lead && el.offsetParent && !reduce) {
          const leader = el.closest('.tz-ab').querySelector(`.tz-el[data-id="${lead}"] > .tz-w`);
          // своя прозрачность элемента (например, приглушённый слой) сохраняется
          if (leader) { followers.push({ w, leader, base: parseFloat(getComputedStyle(w).opacity) || 0 }); return; }
        }
        const sbsData = el.dataset['sbs' + K], fixData = el.dataset['fix' + K];
        if (!sbsData && !fixData) return;
        if (!el.offsetParent) return; // в этой раскладке элемента нет
        const k = width / BASE[key];
        const it = { el, w, k };
        // data-tz-hold на блоке: его прокрутка-анимация ждёт, пока верх
        // блока не дойдёт до верха окна — сначала блок виден целиком.
        // Значение — доля высоты окна, на которую старт наступает раньше
        it.hold = el.closest('[data-tz-hold]');
        if (it.hold) it.holdEarly = parseFloat(it.hold.dataset.tzHold) || 0;
        if (fixData) it.fix = JSON.parse(fixData);
        if (sbsData) {
          const sbs = JSON.parse(sbsData);
          it.kind = sbs.event;
          it.sbs = sbs;
          it.steps = parseSteps(sbs.opts, sbs.event);
          // z — растяжение раскладки Тильдой (upscale=window): сдвиги и
          // длины шагов заданы в её исходных пикселях и растягиваются вместе с ней
          it.k = k * (sbs.z || 1);
        }
        if (reduce) { w.style.opacity = ''; w.style.transform = ''; return; }
        if (it.kind === 'hover') setupHover(it);
        items.push(it);
      });
      measure();
      update();
    }

    function setupHover(it) {
      const { frames, duration } = hoverKeyframes(it.steps, it.k);
      it.anim = it.w.animate(frames, { duration, fill: 'both' });
      it.anim.pause();
      it.anim.currentTime = 0;
      const ab = it.el.closest('.tz-ab');
      const ids = it.sbs.trgels ? it.sbs.trgels.split(',') : [];
      const triggers = ids.length
        ? ids.map(id => ab.querySelector(`.tz-el[data-id="${id}"]`)).filter(Boolean)
        : [it.el];
      const play = dir => {
        if (dir > 0 && it.anim.playbackRate < 0) it.anim.reverse();
        else if (dir < 0 && it.anim.playbackRate > 0) it.anim.reverse();
        else it.anim.play();
      };
      triggers.forEach(t => {
        t.style.cursor = 'default';
        if (canHover) {
          const on = () => play(1), off = () => play(-1);
          t.addEventListener('mouseenter', on);
          t.addEventListener('mouseleave', off);
          offs.push(() => { t.removeEventListener('mouseenter', on); t.removeEventListener('mouseleave', off); });
        } else {
          let active = false;
          const tap = () => { active = !active; play(active ? 1 : -1); };
          t.addEventListener('click', tap);
          offs.push(() => t.removeEventListener('click', tap));
        }
      });
    }

    // верх элемента относительно начала прокрутки — без учёта трансформаций,
    // их несёт внутренняя обёртка
    function measure() {
      const st = scroller === window ? window.scrollY : scroller.scrollTop;
      const top0 = scroller === window ? 0 : scroller.getBoundingClientRect().top;
      items.forEach(it => {
        const r = it.el.getBoundingClientRect();
        it.top = r.top - top0 + st;
        it.h = r.height;
        if (it.hold) it.holdTop = it.hold.getBoundingClientRect().top - top0 + st;
      });
    }

    function viewH() { return scroller === window ? window.innerHeight : scroller.clientHeight; }

    function update() {
      raf = 0;
      // верхушки меряем каждый кадр: раскладка вокруг кейса может сдвинуться
      // (разворот на весь экран, догрузка картинок выше), а это дёшево
      measure();
      const st = scroller === window ? window.scrollY : scroller.scrollTop;
      const vh = viewH();
      items.forEach(it => {
        let ty = 0;
        if (it.fix) {
          const trg = it.fix.trg;
          let T = it.fix.trgofst * it.k;
          if (trg === 0.5 || trg === 1) {
            T += vh * trg - it.h * trg;
            if (T > it.top && T <= vh * trg) T = it.top;
          }
          ty = Math.min(Math.max(st + T - it.top, 0), it.fix.dist * it.k);
        }
        if (it.kind === 'scroll') scrollStep(it, st, vh, ty);
        else if (it.fix) it.w.style.transform = ty ? `translateY(${ty.toFixed(2)}px)` : '';
      });
      followers.forEach(f => {
        const o = f.leader.style.opacity;
        f.w.style.opacity = o === '' ? '' : String(f.base * parseFloat(o));
      });
    }

    function scrollStep(it, st, vh, fixY) {
      const trg = isNaN(it.sbs.trg) ? 1 : it.sbs.trg;
      let T = it.sbs.trgofst * it.k;
      if (trg === 0.5 || trg === 1) {
        T += vh * trg;
        if (T > it.top && T <= vh * trg) T = it.top;
      }
      // у верхнего края Safari и iPhone пружинят: прокрутка на миг уходит
      // в минус, и элемент проваливался до шага 0 (у «Ба» — огромный силуэт)
      const pos = Math.max(st, 0) + T;
      const s = { op: 1, tx: 0, ty: 0, sx: 1, sy: 1, ro: 0 };
      let start = it.top;
      let held = !it.hold;
      it.steps.forEach((step, i) => {
        const dist = step.di * it.k;
        // начальные мгновенные шаги (исходный вид) — как обычно,
        // а первый шаг с длиной ждёт, пока блок не встанет к верху окна
        if (!held && dist > 0) { start = Math.max(start, it.holdTop - it.holdEarly * vh + T); held = true; }
        const end = start + dist;
        let p = 0;
        if (pos >= end) p = 1;
        else if (pos >= start) p = dist === 0 ? 1 : (pos - start) / dist;
        if (p > 0) {
          s.op += p * (step.op - s.op);
          s.tx += p * step.mx;
          s.ty += p * step.my;
          s.sx += p * (step.sx - s.sx);
          s.sy += p * (step.sy - s.sy);
          s.ro += p * step.ro;
        }
        start = end;
      });
      const s1 = it.steps[1];
      if (s1 && s1.di === 0 && s1.op === 0 && pos < it.top) s.op = 0;
      it.w.style.opacity = s.op.toFixed(3);
      let tr = '';
      if (s.tx || s.ty || fixY) tr += `translate(${(s.tx * it.k).toFixed(2)}px, ${(s.ty * it.k + fixY).toFixed(2)}px)`;
      if (s.sx !== 1 || s.sy !== 1) tr += ` scale(${s.sx}, ${s.sy})`;
      if (s.ro) tr += ` rotate(${s.ro}deg)`;
      it.w.style.transform = tr;
    }

    let raf = 0;
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    // масштаб и видимая раскладка зависят от ширины самого кейса, а она
    // меняется не только с окном (разворот на весь экран) — следим за ней
    let rt = 0, lastW = 0;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(setup, 150); };
    // Скрипты кейсов (интерактив, лента и т.п.) пересчитываются по resize
    // окна — во фрейме ширина кейса и была окном. Здесь ширина кейса меняется
    // и без окна (разворот на весь экран), поэтому сообщаем им сами.
    const ro = 'ResizeObserver' in window ? new ResizeObserver(() => {
      const w = tz.getBoundingClientRect().width;
      if (Math.abs(w - lastW) > 0.5) {
        const first = !lastW;
        lastW = w; onResize();
        if (!first) window.dispatchEvent(new Event('resize'));
      }
    }) : null;
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onResize);
    if (ro) ro.observe(tz);
    // видео грузятся и играют, только когда рядом с экраном: в кейсе их
    // бывает десяток, и сразу все они тянули бы мегабайты на телефоне
    const vio = 'IntersectionObserver' in window ? new IntersectionObserver(en => {
      en.forEach(e => {
        const v = e.target;
        if (e.isIntersecting) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
        else v.pause();
      });
    }, { rootMargin: '300px 0px' }) : null;
    tz.querySelectorAll('video').forEach(v => { if (vio) vio.observe(v); else v.play(); });
    // видео, наложенные «экраном», — через холст (см. screenVideo ниже)
    const screenOffs = [];
    root.querySelectorAll('video').forEach(v => { const stop = screenVideo(v); if (stop) screenOffs.push(stop); });
    const onLoad = () => onScroll();
    tz.querySelectorAll('img').forEach(img => { if (!img.complete) img.addEventListener('load', onLoad, { once: true }); });
    lastW = tz.getBoundingClientRect().width;
    setup();

    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
      if (vio) vio.disconnect();
      screenOffs.forEach(f => f());
      clearTimeout(rt);
      offs.splice(0).forEach(f => f());
      items.forEach(it => it.anim && it.anim.cancel());
      if (raf) cancelAnimationFrame(raf);
    };
  }

  // Видео, наложенное «экраном» (белое на чёрном поверх фона кейса).
  // Safari рисует <video> отдельным аппаратным слоем и на нём не работает
  // mix-blend-mode — ни постоянно, ни когда ролик упирается в край области
  // прокрутки или его проявляет анимация: проступает чёрный прямоугольник.
  // Поэтому кадры перерисовываются на прозрачный холст, где яркость
  // становится непрозрачностью: чёрное — прозрачное, белое — белое, цвет
  // сохраняется. Над тёмным фоном это и есть «экран», а всё, что лежит под
  // роликом (буквы, линии), остаётся видно. Само видео остаётся на месте
  // невидимым — его так же запускает и останавливает прокрутка.
  function screenVideo(v) {
    const host = v.closest('.tz-el');
    const isScreen = el => el && getComputedStyle(el).mixBlendMode === 'screen';
    if (!isScreen(v) && !isScreen(host)) return null;
    const box = v.parentElement;
    if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
    const c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
    box.appendChild(c);
    v.style.opacity = '0';
    v.style.mixBlendMode = 'normal';
    if (host) host.style.mixBlendMode = 'normal';
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const fit = getComputedStyle(v).objectFit;
    const MAX = 720; // попиксельная обработка: холст не больше этого по стороне
    let raf = 0, dead = false;
    function draw() {
      const bw = box.clientWidth, bh = box.clientHeight;
      if (!bw || !bh || v.readyState < 2 || !v.videoWidth) return;
      const k0 = Math.min((window.devicePixelRatio || 1), MAX / Math.max(bw, bh));
      const cw = Math.max(1, Math.round(bw * k0)), ch = Math.max(1, Math.round(bh * k0));
      if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
      const k = (fit === 'contain' ? Math.min : Math.max)(cw / v.videoWidth, ch / v.videoHeight);
      const dw = v.videoWidth * k, dh = v.videoHeight * k;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(v, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      const img = ctx.getImageData(0, 0, cw, ch), d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const m = r > g ? (r > b ? r : b) : (g > b ? g : b);
        if (m === 0) { d[i + 3] = 0; continue; }
        const f = 255 / m;
        d[i] = r * f; d[i + 1] = g * f; d[i + 2] = b * f; d[i + 3] = m;
      }
      ctx.putImageData(img, 0, 0);
    }
    function loop() {
      raf = 0;
      if (dead || !v.isConnected) return;
      draw();
      if (!v.paused && !v.ended) raf = requestAnimationFrame(loop);
    }
    const kick = () => { if (!raf && !dead) raf = requestAnimationFrame(loop); };
    ['play', 'playing', 'loadeddata', 'seeked'].forEach(t => v.addEventListener(t, kick));
    const ro = 'ResizeObserver' in window ? new ResizeObserver(kick) : null;
    if (ro) ro.observe(box);
    kick();
    return () => {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      ['play', 'playing', 'loadeddata', 'seeked'].forEach(t => v.removeEventListener(t, kick));
    };
  }

  // Скрипты кейсов, написанные под прокрутку окна, конвертер переводит на
  // эти помощники: на десктопе прокручивается панель, на телефоне — окно.
  // Подписки снимаются вместе с кейсом (tzMount → очистка).
  let scrollSubs = [];
  function caseScroller() {
    const p = document.getElementById('panelDetail');
    if (p) {
      const oy = getComputedStyle(p).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight + 1) return p;
    }
    return null;
  }
  window.tzScrollY = function () {
    const p = caseScroller();
    return p ? p.scrollTop : (window.scrollY || 0);
  };
  window.tzOnScroll = function (fn, opts) {
    const wrapped = e => fn(e);
    document.addEventListener('scroll', wrapped, { passive: true, capture: true });
    scrollSubs.push(wrapped);
  };
  function dropScrollSubs() {
    scrollSubs.forEach(f => document.removeEventListener('scroll', f, { capture: true }));
    scrollSubs = [];
  }

  window.tzMount = function (root) {
    const off = tzMount(root);
    return () => { if (off) off(); dropScrollSubs(); };
  };
})();
