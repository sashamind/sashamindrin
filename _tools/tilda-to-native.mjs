// Переводит кейс из экспорта Тильды (shh-creative/pageNNN.html) в свой
// фрагмент projects/<слаг>.html — без фрейма и без скриптов Тильды.
//
// Положения элементов не высчитываются из атрибутов, а снимаются с живой
// страницы: её открывает headless Chrome в двух рабочих ширинах Тильды —
// 1200 (десктоп) и 320 (телефон), — и движок Тильды сам раскладывает всё
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
const LAYOUTS = [{ key: 'd', width: 1200 }, { key: 'm', width: 320 }];

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
  const res = W >= 1200 ? 1200 : 320;
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
        opacity: acs ? acs.opacity : '1',
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
        e.radius = img ? getComputedStyle(img).borderRadius : '';
        e.filter = img ? getComputedStyle(img).filter : '';
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
      await send('Emulation.setDeviceMetricsOverride', { width: L.width, height: 900, deviceScaleFactor: 1, mobile: L.width < 500 });
      await send('Page.navigate', { url: URL_BASE + page + '?tz=' + Date.now() });
      await sleep(6000);
      result[L.key] = await ev(CAPTURE);
    }
    return result;
  });
}

// ─── сборка фрагмента ───
const BASES = { d: 1200, m: 320 };
const fmt = n => +n.toFixed(3);
// пиксели макета → cqw от ширины кейса
const cq = (px, base) => (Math.abs(px) < 0.01 ? '0' : `${fmt(px * 100 / base)}cqw`);

// Тексты: пиксельные значения в инлайн-стилях Тильды (font-size и т.п.)
// тоже переводим в cqw, иначе при масштабе кегль внутри span не менялся бы.
function scaleInlinePx(html, base) {
  return html.replace(/(font-size|line-height|letter-spacing)\s*:\s*(-?[\d.]+)px/g, (_, p, v) => `${p}:${cq(+v, base)}`);
}

// Ссылки на файлы экспорта — от корня сайта, раз фрагмент живёт в портфолио.
function fixPaths(s) {
  return s.replace(/(["'(])(images|media|files)\//g, '$1shh-creative/$2/');
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

function elementHtml(e, key, base) {
  const st = [`left:${cq(e.x, base)}`, `top:${cq(e.y, base)}`, `width:${cq(e.w, base)}`];
  if (e.type !== 'image' && e.type !== 'text') st.push(`height:${cq(e.h, base)}`);
  if (e.z) st.push(`z-index:${e.z}`);
  if (e.blend) st.push(`mix-blend-mode:${e.blend}`);
  const inner = [];
  if (e.opacity !== '1') inner.push(`opacity:${e.opacity}`);
  if (e.rotate) inner.push(`transform:${e.rotate}`);
  let body = '';
  switch (e.type) {
    case 'image': {
      const ist = [];
      if (e.radius && e.radius !== '0px') ist.push(`border-radius:${e.radius}`);
      if (e.filter && e.filter !== 'none') ist.push(`filter:${e.filter}`);
      body = `<img src="${fixPaths('"' + e.src).slice(1)}" alt="" loading="lazy" decoding="async"${ist.length ? ` style="${ist.join(';')}"` : ''} />`;
      break;
    }
    case 'text':
      body = `<div class="tz-txt" style="${fontDecl(e.font, base)}">${fixPaths(scaleInlinePx(e.html, base))}</div>`;
      break;
    case 'shape': {
      const b = e.box; const bs = [];
      if (b['background-color'] !== 'rgba(0, 0, 0, 0)') bs.push(`background-color:${b['background-color']}`);
      if (b['background-image'] !== 'none') bs.push(`background-image:${fixPaths(b['background-image']).replace(/url\("?http:\/\/127\.0\.0\.1:8765\//g, 'url("')}`, `background-size:${b['background-size']}`, `background-position:${b['background-position']}`, `background-repeat:${b['background-repeat']}`);
      if (b['border-radius'] !== '0px') bs.push(`border-radius:${b['border-radius']}`);
      if (parseFloat(b['border-top-width'])) bs.push(`border:${b['border-top-width']} ${b['border-style']} ${b['border-color']}`);
      if (b['box-shadow'] !== 'none') bs.push(`box-shadow:${b['box-shadow']}`);
      body = `<div class="tz-shape" style="${bs.join(';')}"></div>`;
      break;
    }
    case 'video':
      body = `<video src="${fixPaths('"' + e.mp4).slice(1)}" muted loop playsinline preload="none"${e.radius && e.radius !== '0px' ? ` style="border-radius:${e.radius}"` : ''}></video>`;
      break;
    case 'html':
    case 'button':
      body = fixPaths(e.html);
      break;
  }
  if (e.href) body = `<a href="${e.href}" target="_blank" rel="noopener">${body}</a>`;
  const data = [];
  if (e.anim) data.push(`data-sbs='${JSON.stringify(e.anim).replace(/'/g, '&#39;')}'`);
  if (e.fix && e.fix.dist) data.push(`data-fix='${JSON.stringify(e.fix)}'`);
  return `  <div class="tz-el tz-${e.type}" data-id="${e.id}" style="${st.join(';')}"${data.length ? ' ' + data.join(' ') : ''}>` +
    `<div class="tz-w"${inner.length ? ` style="${inner.join(';')}"` : ''}>${body}</div></div>`;
}

function build(cap) {
  const warn = [];
  const parts = [];
  for (const L of LAYOUTS) {
    const base = BASES[L.key];
    parts.push(`<div class="tz-l tz-${L.key}">`);
    for (const ab of cap[L.key]) {
      // скрытый блок (у Тильды высота 0) — например, старый подвал с контактами
      if (ab.height < 1) { warn.push(`[${L.key}] артборд ${ab.rec} скрыт — пропущен`); continue; }
      warn.push(...ab.warn.map(w => `[${L.key}] ${w}`));
      const bg = [];
      if (ab.bg && ab.bg !== 'rgba(0, 0, 0, 0)') bg.push(`background-color:${ab.bg}`);
      if (ab.overflow === 'visible') bg.push('overflow:visible');
      if (ab.carrierBg && ab.carrierBg['background-image'] !== 'none') warn.push(`[${L.key}] у артборда ${ab.rec} фоновая картинка — не перенесена`);
      parts.push(`<div class="tz-ab" data-rec="${ab.rec}" style="height:${cq(ab.height, base)};${bg.join(';')}">`);
      for (const e of ab.els) parts.push(elementHtml(e, L.key, base));
      parts.push('</div>');
    }
    parts.push('</div>');
  }
  return { html: parts.join('\n'), warn };
}

// Шрифты текстов: у портфолио свои, поэтому нужные подключаем во фрагменте.
// Google-шрифты — ссылкой, TildaSans — локальными файлами (с CDN Тильды не
// тянем: от Тильды и уходим).
const FONT_LINKS = {
  Montserrat: '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" />',
  'PT Sans': '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" />',
  TildaSans: '<link rel="stylesheet" href="assets/fonts/tildasans/tildasans.css" />',
};
const SYSTEM_FONTS = /^(arial|helvetica|sans-serif|serif|monospace|inter|raleway|ui-monospace)$/i;
function fontLinks(cap, warn) {
  const fams = new Set();
  for (const L of LAYOUTS) for (const ab of cap[L.key]) for (const e of ab.els) {
    if (e.font) fams.add(e.font['font-family'].split(',')[0].replace(/["']/g, '').trim());
    if (e.html) for (const m of e.html.matchAll(/font-family:\s*'?"?([^,;'"]+)/g)) fams.add(m[1].trim());
  }
  const out = [];
  for (const f of fams) {
    if (FONT_LINKS[f]) out.push(FONT_LINKS[f]);
    else if (!SYSTEM_FONTS.test(f)) warn.push('шрифт без подключения: ' + f);
  }
  return out.join('\n');
}

const cap = await capture();
fs.writeFileSync(path.join('/tmp', `tz-${slug}.json`), JSON.stringify(cap, null, 1));
const { html, warn } = build(cap);
const fonts = fontLinks(cap, warn);
const counts = LAYOUTS.map(L => `${L.key}: ${cap[L.key].map(a => a.els.length).join('+')} эл.`).join(', ');
const out = `<!-- Собрано _tools/tilda-to-native.mjs из shh-creative/${page}. Раскладку правим
     здесь; повторный запуск скрипта перезапишет файл. -->
${fonts}
<div class="pf-tz" data-tz>
${html}
</div>
`;
if (DRY) console.log(out.slice(0, 3000));
else fs.writeFileSync(path.join(ROOT, 'projects', `${slug}.html`), out);
console.log(`${slug}: ${counts}`);
warn.forEach(w => console.log('  ! ' + w));
