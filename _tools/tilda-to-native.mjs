// Переводит кейс из экспорта Тильды (shh-creative/pageNNN.html) в свой
// фрагмент projects/<слаг>.html — без фрейма и без скриптов Тильды.
//
// Положения элементов не высчитываются из атрибутов, а снимаются с живой
// страницы: её открывает headless Chrome в двух рабочих ширинах Тильды —
// 1200 (десктоп) и 390 (телефон), — и движок Тильды сам раскладывает всё
// по своим правилам. Снятые пиксели переводятся в cqw от ширины кейса,
// поэтому раскладка масштабируется под поле так же, как раньше масштабировался
// фрейм. Анимации Тильды (step-by-step при прокрутке и наведении, «фикс»)
// переносятся как данные, проигрывает их assets/tz.js.
//
//   node _tools/tilda-to-native.mjs <pageNNN.html> <слаг> [--dry]
//
// Нужен локальный сервер на 8765 (python3 -m http.server 8765) и Chrome.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [page, slug] = process.argv.slice(2);
const DRY = process.argv.includes('--dry');
if (!page || !slug) { console.error('usage: tilda-to-native.mjs <pageNNN.html> <slug>'); process.exit(1); }

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL_BASE = 'http://127.0.0.1:8765/shh-creative/';
// высота окна при съёмке: блоки «на весь экран» (100vh) и всё, что Тильда
// центрует по высоте, снимаются под типичное поле кейса — панель ноутбука
// (1080×700 → 1200×780) и телефон. Мобильную снимаем сразу в 390 — самой
// ходовой ширине: Тильда свёрстана под 320, но на 390 не растягивает её, а
// раздвигает, и подогнанные на телефоне размеры совпадают именно там
const LAYOUTS = [{ key: 'd', width: 1200, height: 780 }, { key: 'm', width: 390, height: 844 }];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function withChrome(fn) {
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`,
    `--user-data-dir=/tmp/tz-prof-${port}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  try {
    let ws;
    for (let i = 0; i < 50 && !ws; i++) {
      try {
        const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
        const p = list.find(x => x.type === 'page');
        if (p) ws = new WebSocket(p.webSocketDebuggerUrl);
      } catch {}
      if (!ws) await sleep(200);
    }
    await new Promise(r => (ws.onopen = r));
    let id = 0; const pending = new Map();
    ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async expr => {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 500));
      return r.result.result.value;
    };
    await send('Runtime.enable'); await send('Page.enable');
    return await fn({ send, ev });
  } finally { try { proc.kill('SIGKILL'); } catch {} }
}

// Выполняется внутри страницы Тильды: снимает артборды и элементы.
const CAPTURE = String.raw`(async () => {
  const W = window.innerWidth;
  // исходная разметка — для текстов и html-элементов берём её, а не живой
  // DOM, в который скрипты Тильды уже надописали обёртки
  const src = new DOMParser().parseFromString(await (await fetch(location.href)).text(), 'text/html');
  const res = W >= 1200 ? 1200 : 320; // 390 — тоже мобильная раскладка Тильды
  function animOpts(el) {
    const ev = el.getAttribute('data-animate-sbs-event');
    if (!ev) return null;
    let opts = null;
    if (res === 1200) opts = el.getAttribute('data-animate-sbs-opts');
    else if (el.getAttribute('data-animate-mobile') === 'y') {
      for (const r of [320, 480, 640, 960]) { opts = el.getAttribute('data-animate-sbs-opts-res-' + r); if (opts) break; }
      opts = opts || el.getAttribute('data-animate-sbs-opts');
    }
    if (!opts) return null;
    return {
      event: ev,
      opts: JSON.parse(opts.replace(/'/g, '"')),
      trg: parseFloat(el.getAttribute('data-animate-sbs-trg')),
      trgofst: parseInt(el.getAttribute('data-animate-sbs-trgofst'), 10) || 0,
      trgels: el.getAttribute('data-animate-sbs-trgels') || '',
      loop: el.getAttribute('data-animate-sbs-loop') || '',
    };
  }
  const pick = (cs, props) => Object.fromEntries(props.map(p => [p, cs.getPropertyValue(p)]));
  const out = [];
  for (const ab of document.querySelectorAll('.t396__artboard')) {
    const rec = ab.getAttribute('data-artboard-recid');
    const abr = ab.getBoundingClientRect();
    const carrier = ab.querySelector('.t396__carrier');
    const abInfo = {
      rec, height: abr.height,
      overflow: getComputedStyle(ab).overflow,
      bg: getComputedStyle(ab).backgroundColor,
      carrierBg: carrier ? pick(getComputedStyle(carrier), ['background-image', 'background-color', 'background-size', 'background-position']) : null,
      filterBg: (() => { const f = ab.querySelector('.t396__filter'); return f ? pick(getComputedStyle(f), ['background-image', 'background-color']) : null; })(),
      els: [], warn: [],
    };
    for (const el of ab.querySelectorAll('.t396__elem')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none') continue;
      const id = el.getAttribute('data-elem-id');
      const type = el.getAttribute('data-elem-type');
      const r = el.getBoundingClientRect();
      const atom = el.querySelector('.tn-atom');
      const acs = atom ? getComputedStyle(atom) : null;
      const srcEl = src.querySelector('.tn-elem__' + rec + id) || src.querySelector('[data-elem-id="' + id + '"]');
      const srcAtom = srcEl && srcEl.querySelector('.tn-atom');
      const e = {
        id, type,
        x: r.left - abr.left, y: r.top - abr.top, w: r.width, h: r.height,
        z: parseInt(cs.zIndex, 10) || 0,
        // свои классы элемента (не Тильды) — на них завязаны наши стили и
        // скрипты, например pf-reveal (проявление при прокрутке)
        cls: [...el.classList].filter(c => !/^(t396__|tn-elem|tn-|t-)/.test(c)).join(' '),
        // прозрачность самого элемента учитываем, только если она не временная
        // (anim-hidden Тильда держит, пока не запустит анимации) и ею не
        // управляют наши классы
        opacity: String((acs ? +acs.opacity : 1) * (el.classList.contains('t396__elem--anim-hidden') || [...el.classList].some(c => !/^(t396__|tn-elem|tn-|t-)/.test(c)) ? 1 : +cs.opacity)),
        blend: cs.mixBlendMode !== 'normal' ? cs.mixBlendMode : (acs && acs.mixBlendMode !== 'normal' ? acs.mixBlendMode : ''),
        rotate: acs && acs.transform !== 'none' ? acs.transform : '',
        href: atom && atom.tagName === 'A' ? atom.getAttribute('href') : '',
        anim: animOpts(el),
        fix: el.getAttribute('data-animate-fix') ? { trg: parseFloat(el.getAttribute('data-animate-fix')) || 0, dist: parseInt(el.getAttribute('data-animate-fix-dist'), 10) || 0, trgofst: parseInt(el.getAttribute('data-animate-fix-trgofst'), 10) || 0 } : null,
      };
      if (el.getAttribute('data-animate-style')) abInfo.warn.push('appear-анимация у ' + id + ': ' + el.getAttribute('data-animate-style'));
      if (type === 'image') {
        const img = el.querySelector('img');
        e.src = img ? (img.getAttribute('data-original') || img.getAttribute('src')) : '';
        // кроме картинки в атоме могут быть наши вставки (например, края-градиенты)
        e.extra = srcAtom ? [...srcAtom.children].filter(c => c.tagName !== 'IMG').map(c => c.outerHTML).join('') : '';
        e.radius = img ? getComputedStyle(img).borderRadius : '';
        e.filter = img ? getComputedStyle(img).filter : '';
        e.imgTransform = img && getComputedStyle(img).transform !== 'none' ? getComputedStyle(img).transform : '';
        if (img && getComputedStyle(img).mixBlendMode !== 'normal' && !e.blend) e.blend = getComputedStyle(img).mixBlendMode;
      } else if (type === 'text') {
        e.html = srcAtom ? srcAtom.innerHTML.trim() : (atom ? atom.innerHTML : '');
        e.tag = atom ? atom.tagName.toLowerCase() : 'div';
        e.font = pick(acs, ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'color', 'text-align', 'text-transform', 'text-decoration-line']);
      } else if (type === 'shape') {
        e.box = pick(acs, ['background-color', 'background-image', 'background-size', 'background-position', 'background-repeat', 'border-radius', 'border-top-width', 'border-style', 'border-color', 'box-shadow']);
      } else if (type === 'video') {
        const v = el.querySelector('[data-mp4video]');
        e.mp4 = v ? v.getAttribute('data-mp4video') : '';
        e.radius = acs ? acs.borderRadius : '';
      } else if (type === 'vector') {
        e.html = srcAtom ? srcAtom.innerHTML.trim() : '';
      } else if (type === 'html') {
        e.html = srcAtom ? srcAtom.innerHTML.trim() : '';
      } else if (type === 'button') {
        e.html = srcAtom ? srcAtom.innerHTML.trim() : '';
        e.font = pick(acs, ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'color', 'background-color', 'border-radius', 'border-top-width', 'border-style', 'border-color']);
      } else {
        abInfo.warn.push('неизвестный тип ' + type + ' у ' + id);
      }
      abInfo.els.push(e);
    }
    out.push(abInfo);
  }
  return out;
})()`;

async function capture() {
  return withChrome(async ({ send, ev }) => {
    const result = {};
    for (const L of LAYOUTS) {
      await send('Emulation.setDeviceMetricsOverride', { width: L.width, height: L.height, deviceScaleFactor: 1, mobile: L.width < 500 });
      await send('Page.navigate', { url: URL_BASE + page + '?tz=' + Date.now() });
      await sleep(9000);
      result[L.key] = await ev(CAPTURE);
    }
    return result;
  });
}

// ─── сборка фрагмента ───
// Каждый элемент в разметке один раз; где он стоит в десктопной и мобильной
// раскладке, задают два набора правил под контейнерными запросами. Так у
// html-элементов со скриптами (Lottie и т.п.) нет двойников с теми же id.
// Блоки, которые не из Тильды (свои секции с собственными стилями и
// скриптами), переносятся как есть, в том же порядке.
const BASES = { d: 1200, m: 390 };
const QUERY = { d: '@container tz (min-width: 800px)', m: '@container tz (max-width: 799.98px)' };
const fmt = n => +n.toFixed(3);
// пиксели макета → cqw от ширины кейса
const cq = (px, base) => (Math.abs(px) < 0.01 ? '0' : `${fmt(px * 100 / base)}cqw`);

// пиксельные значения в инлайн-стилях текстов Тильды — тоже в cqw,
// иначе при масштабе кегль внутри span не менялся бы
function scaleInlinePx(html, base) {
  return html.replace(/(font-size|line-height|letter-spacing)\s*:\s*(-?[\d.]+)px/g, (_, p, v) => `${p}:${cq(+v, base)}`);
}

// ссылки на файлы экспорта — от корня сайта, раз фрагмент живёт в портфолио;
// vw в стилях — от ширины кейса (cqw), как было во фрейме
function fixPaths(s) {
  return s.replace(/(["'(=])(images|media|files)\//g, '$1shh-creative/$2/')
    .replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (m, a, css) => `<style${a}>${css.replace(/(\d*\.?\d+)vw\b/g, '$1cqw')}</style>`);
}

// Скрипты кейсов слушали прокрутку окна. В портфолио на десктопе
// прокручивается панель, поэтому прокрутку и её позицию берём у
// помощников из assets/tz.js — они знают, что сейчас прокручивается.
function fixScripts(html) {
  return html.replace(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g, (m, attrs = '', js) => {
    if (/\bsrc=/.test(attrs)) return m;
    const out = js
      .replace(/window\.addEventListener\(\s*(['"])scroll\1\s*,/g, 'tzOnScroll(')
      .replace(/window\.(scrollY|pageYOffset)\b/g, 'tzScrollY()');
    return `<script${attrs}>${out}</script>`;
  });
}

function fontDecl(f, base) {
  const px = v => (v && v.endsWith('px') ? cq(parseFloat(v), base) : v);
  let s = `font-family:${f['font-family']};font-size:${px(f['font-size'])};font-weight:${f['font-weight']};` +
    `line-height:${px(f['line-height'])};color:${f['color']};text-align:${f['text-align']};`;
  if (f['font-style'] && f['font-style'] !== 'normal') s += `font-style:${f['font-style']};`;
  if (f['letter-spacing'] && f['letter-spacing'] !== 'normal' && f['letter-spacing'] !== '0px') s += `letter-spacing:${px(f['letter-spacing'])};`;
  if (f['text-transform'] && f['text-transform'] !== 'none') s += `text-transform:${f['text-transform']};`;
  return s;
}

function shapeDecl(b) {
  const bs = [];
  if (b['background-color'] !== 'rgba(0, 0, 0, 0)') bs.push(`background-color:${b['background-color']}`);
  if (b['background-image'] !== 'none') bs.push(`background-image:${fixPaths(b['background-image']).replace(/url\("?http:\/\/127\.0\.0\.1:8765\/shh-creative\//g, 'url("shh-creative/')}`, `background-size:${b['background-size']}`, `background-position:${b['background-position']}`, `background-repeat:${b['background-repeat']}`);
  if (b['border-radius'] !== '0px') bs.push(`border-radius:${b['border-radius']}`);
  if (parseFloat(b['border-top-width'])) bs.push(`border:${b['border-top-width']} ${b['border-style']} ${b['border-color']}`);
  if (b['box-shadow'] !== 'none') bs.push(`box-shadow:${b['box-shadow']}`);
  return bs.join(';');
}

// правила одного элемента в одной раскладке
function elementCss(sel, e, base) {
  const r = [];
  const st = [`display:block`, `left:${cq(e.x, base)}`, `top:${cq(e.y, base)}`, `width:${cq(e.w, base)}`];
  if (e.type !== 'image' && e.type !== 'text') st.push(`height:${cq(e.h, base)}`);
  st.push(`z-index:${e.z || 'auto'}`);
  st.push(`mix-blend-mode:${e.blend || 'normal'}`);
  r.push(`${sel}{${st.join(';')}}`);
  const inner = [];
  if (e.opacity !== '1') inner.push(`opacity:${e.opacity}`);
  if (e.rotate) inner.push(`transform:${e.rotate}`);
  if (inner.length) r.push(`${sel}>.tz-w{${inner.join(';')}}`);
  if (e.type === 'image') {
    const ist = [];
    if (e.radius && e.radius !== '0px') ist.push(`border-radius:${e.radius}`);
    if (e.filter && e.filter !== 'none') ist.push(`filter:${e.filter}`);
    if (e.imgTransform) ist.push(`transform:${e.imgTransform}`);
    if (e.blend) ist.push(`mix-blend-mode:${e.blend}`);
    if (ist.length) r.push(`${sel} img{${ist.join(';')}}`);
  }
  if (e.type === 'text') r.push(`${sel} .tz-txt{${fontDecl(e.font, base)}}`);
  if (e.type === 'shape') r.push(`${sel} .tz-shape{${shapeDecl(e.box)}}`);
  if (e.type === 'video' && e.radius && e.radius !== '0px') r.push(`${sel} video{border-radius:${e.radius}}`);
  return r.join('\n');
}

function elementBody(e) {
  switch (e.type) {
    case 'image': return `<img src="${fixPaths('"' + e.src).slice(1)}" alt="" loading="lazy" decoding="async" />${e.extra || ''}`;
    case 'text': return `<div class="tz-txt">${fixPaths(e.html)}</div>`;
    case 'shape': return `<div class="tz-shape"></div>`;
    case 'video': return `<video src="${fixPaths('"' + e.mp4).slice(1)}" muted loop playsinline preload="none"></video>`;
    default: return fixScripts(fixPaths(e.html || ''));
  }
}

function buildArtboard(rec, cap, warn) {
  const css = { d: [], m: [] };
  const els = new Map(); // id → { d, m }
  let any = false;
  for (const L of LAYOUTS) {
    const ab = cap[L.key].find(a => a.rec === rec);
    const base = BASES[L.key];
    const sel = `.pf-tz [data-ab="${rec}"]`;
    if (!ab || ab.height < 1) { css[L.key].push(`${sel}{display:none}`); continue; }
    any = true;
    warn.push(...ab.warn.map(w => `[${L.key}] ${w}`));
    const bg = ab.bg && ab.bg !== 'rgba(0, 0, 0, 0)' ? ab.bg : 'transparent';
    css[L.key].push(`${sel}{display:block;height:${cq(ab.height, base)};background-color:${bg};overflow:${ab.overflow === 'visible' ? 'visible' : 'hidden'}}`);
    if (ab.carrierBg && ab.carrierBg['background-image'] !== 'none') warn.push(`[${L.key}] у артборда ${rec} фоновая картинка — не перенесена`);
    for (const e of ab.els) {
      if (!els.has(e.id)) els.set(e.id, {});
      els.get(e.id)[L.key] = e;
      css[L.key].push(elementCss(`.pf-tz .tz-e-${rec}-${e.id}`, e, base));
    }
  }
  if (!any) { warn.push(`артборд ${rec} скрыт в обеих раскладках — пропущен`); return { html: '', css: '' }; }
  const html = [`<div class="tz-ab" id="rec${rec}" data-ab="${rec}">`];
  for (const [id, v] of els) {
    const e = v.d || v.m;
    const data = [];
    for (const L of LAYOUTS) {
      const x = v[L.key];
      if (x && x.anim) data.push(`data-sbs-${L.key}='${JSON.stringify(x.anim).replace(/'/g, '&#39;')}'`);
      if (x && x.fix && x.fix.dist) data.push(`data-fix-${L.key}='${JSON.stringify(x.fix)}'`);
      if (!x) css[L.key].push(`.pf-tz .tz-e-${rec}-${id}{display:none}`);
    }
    // классы tn-elem / tn-atom оставлены, чтобы наши правила и скрипты,
    // написанные под разметку Тильды (#recNNN .tn-elem.pf-reveal и т.п.),
    // находили элементы и здесь; стилей Тильды во фрагменте нет
    const cls = ['tz-el', `tz-${e.type}`, `tz-e-${rec}-${id}`, 'tn-elem', `tn-elem__${rec}${id}`, e.cls].filter(Boolean).join(' ');
    html.push(`  <div class="${cls}" data-id="${id}"${data.length ? ' ' + data.join(' ') : ''}><div class="tz-w tn-atom">${elementBody(e)}</div></div>`);
  }
  html.push('</div>');
  const cssOut = LAYOUTS.map(L => `${QUERY[L.key]} {\n${css[L.key].join('\n')}\n}`).join('\n');
  return { html: html.join('\n'), css: cssOut };
}

// Порядок блоков и всё, что не из Тильды, берём из исходного файла.
function sourceRecords(srcHtml) {
  const startAll = srcHtml.indexOf('<!--allrecords-->');
  const endAll = srcHtml.indexOf('<!--footer-->') >= 0 ? srcHtml.indexOf('<!--footer-->') : srcHtml.indexOf('<!--/allrecords-->');
  const starts = [...srcHtml.matchAll(/<div id="(rec[^"]+)"/g)].filter(m => m.index > startAll && m.index < endAll);
  return starts.map((m, i) => {
    const a = m.index, b = i + 1 < starts.length ? starts[i + 1].index : endAll;
    let seg = srcHtml.slice(a, b);
    const isZero = /data-record-type="396"/.test(seg.slice(0, 400));
    if (!isZero) {
      // лишние закрывающие div в хвосте последнего блока — от обёрток страницы
      let bal = (seg.match(/<div\b/g) || []).length - (seg.match(/<\/div>/g) || []).length;
      while (bal < 0) { seg = seg.replace(/<\/div>\s*$/, ''); bal++; }
    }
    return { id: m[1], isZero, rec: m[1].replace(/^rec/, ''), html: seg };
  });
}

// свои стили из <head> (без оформления скроллбара и правил для .tn-elem —
// таких элементов во фрагменте больше нет)
function headCss(srcHtml) {
  const head = srcHtml.slice(0, srcHtml.indexOf('<body'));
  const blocks = [...head.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]);
  return blocks.map(css => css
    .replace(/::-webkit-scrollbar[^{]*\{[^}]*\}/g, '')
    .replace(/(^|\})\s*\*\s*\{[^}]*\}/g, '$1')
  ).join('\n').trim();
}

// внешние библиотеки из <head>, кроме скриптов Тильды (они лежат в js/),
// — например, lottie-web: скрипты кейса рассчитывают, что он уже есть
function headLibs(srcHtml) {
  const head = srcHtml.slice(0, srcHtml.indexOf('<body'));
  // lottie-web — с нашего сайта: с CDN на медленной сети скрипты кейса
  // успевали запуститься раньше библиотеки и падали
  const LOCAL = { 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js': 'assets/vendor/lottie-5.12.2.min.js' };
  return [...head.matchAll(/<script[^>]*\bsrc="(https?:[^"]+)"[^>]*><\/script>/g)]
    .map(m => `<script src="${LOCAL[m[1]] || m[1]}"></script>`).join('\n');
}

// свои скрипты после <!--/allrecords--> (не Тильды)
function tailScripts(srcHtml) {
  const tail = srcHtml.slice(srcHtml.indexOf('<!--/allrecords-->'));
  return [...tail.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .filter(m => !/\bsrc=/.test(m[1] || '') && !/t_onReady|tilda|t396|dataLayer|lazyload/i.test(m[2]))
    .map(m => fixScripts(m[0])).join('\n');
}

// Шрифты текстов: у портфолио свои, поэтому нужные подключаем во фрагменте.
const FONT_LINKS = {
  Montserrat: '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" />',
  'PT Sans': '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" />',
};
// Raleway кейсы подключают сами (@import в своих стилях) — ровно тем набором
// начертаний, под который свёрстаны; более полный набор менял бы курсив
const SYSTEM_FONTS = /^(arial|helvetica|sans-serif|serif|monospace|inter|ui-monospace|raleway)$/i;
function fontLinks(cap, extraHtml, warn) {
  const fams = new Set();
  for (const L of LAYOUTS) for (const ab of cap[L.key]) for (const e of (ab.height < 1 ? [] : ab.els)) {
    if (e.font) fams.add(e.font['font-family'].split(',')[0].replace(/["']/g, '').trim());
    if (e.html) for (const m of e.html.matchAll(/font-family:\s*'?"?([^,;'"]+)/g)) fams.add(m[1].trim());
  }
  for (const m of extraHtml.matchAll(/font-family:\s*'?"?([^,;'"]+)/g)) fams.add(m[1].trim());
  const out = [];
  for (const f of fams) {
    if (FONT_LINKS[f]) out.push(FONT_LINKS[f]);
    else if (!SYSTEM_FONTS.test(f)) warn.push('шрифт без подключения: ' + f);
  }
  return out.join('\n');
}

const srcHtml = fs.readFileSync(path.join(ROOT, 'shh-creative', page), 'utf8');
const cap = await capture();
// страница не успела отрисоваться — не затираем готовый фрагмент пустым
for (const L of LAYOUTS) if (!cap[L.key].length) { console.error(`[${L.key}] артборды не найдены — страница не загрузилась? Файл не записан.`); process.exit(1); }
fs.writeFileSync(path.join('/tmp', `tz-${slug}.json`), JSON.stringify(cap, null, 1));
const warn = [];
const body = [], css = [];
for (const r of sourceRecords(srcHtml)) {
  if (r.isZero) {
    const b = buildArtboard(r.rec, cap, warn);
    body.push(b.html); css.push(b.css);
  } else {
    body.push(fixScripts(fixPaths(r.html)));
  }
}
const extra = headCss(srcHtml);
const tail = tailScripts(srcHtml);
const fonts = fontLinks(cap, body.join('\n') + extra, warn);
const counts = LAYOUTS.map(L => `${L.key}: ${cap[L.key].map(a => a.els.length).join('+')} эл.`).join(', ');
const out = `<!-- Собрано _tools/tilda-to-native.mjs из shh-creative/${page}. Повторный
     запуск скрипта перезапишет файл. -->
${headLibs(srcHtml)}
${fonts}
<style>
${css.filter(Boolean).join('\n')}
${extra ? '/* свои стили страницы Тильды */\n' + extra : ''}
</style>
<div class="pf-tz" data-tz>
${body.filter(Boolean).join('\n')}
</div>
${tail}
`;
if (DRY) console.log(out.slice(0, 3000));
else fs.writeFileSync(path.join(ROOT, 'projects', `${slug}.html`), out);
console.log(`${slug}: ${counts}`);
warn.forEach(w => console.log('  ! ' + w));
