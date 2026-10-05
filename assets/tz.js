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

  const BASE = { d: 1200, m: 320 };

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
    let scroller = window;
    const offs = [];         // снятие обработчиков

    function layoutOf(el) { return el.closest('.tz-l').classList.contains('tz-d') ? 'd' : 'm'; }

    function setup() {
      offs.splice(0).forEach(f => f());
      items.forEach(it => it.anim && it.anim.cancel());
      items = [];
      scroller = scrollParent(tz);
      // скролл-контейнер тоже мог смениться (десктоп ↔ телефон)
      const width = tz.getBoundingClientRect().width;
      tz.querySelectorAll('.tz-el[data-sbs], .tz-el[data-fix]').forEach(el => {
        if (!el.offsetParent) return; // раскладка скрыта
        const w = el.querySelector('.tz-w');
        const k = width / BASE[layoutOf(el)];
        const it = { el, w, k };
        if (el.dataset.fix) it.fix = JSON.parse(el.dataset.fix);
        if (el.dataset.sbs) {
          const sbs = JSON.parse(el.dataset.sbs);
          it.kind = sbs.event;
          it.sbs = sbs;
          it.steps = parseSteps(sbs.opts, sbs.event);
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
    }

    function scrollStep(it, st, vh, fixY) {
      const trg = isNaN(it.sbs.trg) ? 1 : it.sbs.trg;
      let T = it.sbs.trgofst * it.k;
      if (trg === 0.5 || trg === 1) {
        T += vh * trg;
        if (T > it.top && T <= vh * trg) T = it.top;
      }
      const pos = st + T;
      const s = { op: 1, tx: 0, ty: 0, sx: 1, sy: 1, ro: 0 };
      let start = it.top;
      it.steps.forEach((step, i) => {
        const dist = step.di * it.k;
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
    const ro = 'ResizeObserver' in window ? new ResizeObserver(() => {
      const w = tz.getBoundingClientRect().width;
      if (Math.abs(w - lastW) > 0.5) { lastW = w; onResize(); }
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
    const onLoad = () => onScroll();
    tz.querySelectorAll('img').forEach(img => { if (!img.complete) img.addEventListener('load', onLoad, { once: true }); });
    lastW = tz.getBoundingClientRect().width;
    setup();

    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
      if (vio) vio.disconnect();
      clearTimeout(rt);
      offs.splice(0).forEach(f => f());
      items.forEach(it => it.anim && it.anim.cancel());
      if (raf) cancelAnimationFrame(raf);
    };
  }

  window.tzMount = tzMount;
})();
