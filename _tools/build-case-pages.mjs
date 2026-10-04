// Собирает страницы кейсов: <слаг>/index.html для каждого проекта из
// projectsData в main.js, плюс sitemap.xml.
//
// Сайт статический (GitHub Pages), а у каждого кейса должен быть свой адрес
// со своими заголовком и описанием — иначе поисковики видят только главную.
// Каждая страница — копия index.html (с её <base href="/">, так что
// относительные пути работают), шапка своя, остальное делает main.js.
//
// Запускать после любой правки index.html или projectsData:
//   node _tools/build-case-pages.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://sashamind.com/';
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const js = read('main.js');
const arr = js.match(/const projectsData = (\[[\s\S]*?\n\]);/);
if (!arr) throw new Error('projectsData не найден в main.js');
const projects = new Function(`return ${arr[1]}`)();

const index = read('index.html');

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const plain = s => s.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
// длинное описание — до конца последнего предложения, что влезает в n знаков
const cut = (s, n) => {
  if (s.length <= n) return s;
  const end = s.slice(0, n).search(/[.!?»](?=\s)[^.!?»]*$/);
  return end > 0 ? s.slice(0, end + 1) : s.slice(0, s.lastIndexOf(' ', n)).replace(/[\s,.:;—-]+$/, '') + '…';
};

const KIND = {
  logos:        ['logo', 'логотип'],
  branding:     ['identity', 'айдентика'],
  motion:       ['motion design', 'моушн-дизайн'],
  web:          ['website', 'сайт'],
  interactive:  ['interactive', 'интерактив'],
  art:          ['art project', 'арт-проект'],
  illustration: ['illustration', 'иллюстрация'],
};
const list = (items, and) => items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ${and} ${items.at(-1)}`;
const PLACEHOLDER = /appear here|появится здесь/i;

function describe(p) {
  const kindsEn = list(p.tags.map(t => KIND[t]?.[0]).filter(Boolean), 'and');
  const kindsRu = list(p.tags.map(t => KIND[t]?.[1]).filter(Boolean), 'и');
  const en = PLACEHOLDER.test(p.descEn)
    ? `${p.titleEn}: ${kindsEn} by Sasha Mindrin (Alexander Mindrin), identity and motion designer from Tula, ${p.year}.`
    : `${cut(plain(p.descEn), 170)} ${kindsEn[0].toUpperCase() + kindsEn.slice(1)} by Sasha Mindrin, ${p.year}.`;
  const ru = PLACEHOLDER.test(p.descRu)
    ? `${p.titleRu}: ${kindsRu}. Проект Саши (Александра) Миндрина, дизайнера айдентики и моушна из Тулы, ${p.year}.`
    : `${cut(plain(p.descRu), 170)} ${kindsRu[0].toUpperCase() + kindsRu.slice(1)}, Саша Миндрин, ${p.year}.`;
  return { en, ru };
}

// заменяет ровно одно вхождение — если шапка index.html поменялась, падаем
function swap(html, re, to) {
  if (!re.test(html)) throw new Error(`в index.html не найдено: ${re}`);
  return html.replace(re, to);
}

let built = 0;
for (const p of projects) {
  const url = `${SITE}${p.folder}/`;
  const name = p.titleEn === p.titleRu ? p.titleEn : `${p.titleEn} / ${p.titleRu}`;
  const title = `${name} — Sasha Mindrin`;
  const d = describe(p);

  let h = index;
  h = swap(h, /<!DOCTYPE html>\n/, `<!DOCTYPE html>\n<!-- Сгенерировано _tools/build-case-pages.mjs из index.html — руками не править. -->\n`);
  // <base href="/"> уже есть в index.html — относительные пути работают и здесь
  if (!h.includes('<base href="/" />')) throw new Error('в index.html нет <base href="/">');
  h = swap(h, /<title>.*?<\/title>/, `<title>${esc(title)}</title>`);
  h = swap(h, /(<meta name="description" lang="en" content=")[^"]*/, `$1${esc(d.en)}`);
  h = swap(h, /(<meta name="description" lang="ru" content=")[^"]*/, `$1${esc(d.ru)}`);
  h = swap(h, /(<link rel="canonical" href=")[^"]*/, `$1${url}`);
  h = swap(h, /(<meta property="og:type" content=")[^"]*/, `$1article`);
  h = swap(h, /(<meta property="og:url" content=")[^"]*/, `$1${url}`);
  h = swap(h, /(<meta property="og:title" content=")[^"]*/, `$1${esc(title)}`);
  h = swap(h, /(<meta property="og:description" content=")[^"]*/, `$1${esc(d.en)}`);
  h = swap(h, /(<meta name="twitter:title" content=")[^"]*/, `$1${esc(title)}`);
  h = swap(h, /(<meta name="twitter:description" content=")[^"]*/, `$1${esc(d.en)}`);
  // превью для соцсетей и мессенджеров — своё у каждого кейса (assets/projects/<слаг>/og.jpg)
  const og = fs.existsSync(path.join(ROOT, 'assets/projects', p.folder, 'og.jpg')) ? `${SITE}assets/projects/${p.folder}/og.jpg` : `${SITE}og-image.png`;
  h = swap(h, /(<meta property="og:image" content=")[^"]*/, `$1${og}`);
  h = swap(h, /(<meta name="twitter:image" content=")[^"]*/, `$1${og}`);
  // заставка с именем — только на главной
  h = swap(h, /  <script>if \(!location\.hash[^\n]*<\/script>\n/, '');

  const work = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.titleEn,
    alternateName: p.titleRu,
    url,
    dateCreated: p.year,
    description: d.en,
    keywords: p.tags.map(t => KIND[t]?.[0]).filter(Boolean).join(', '),
    creator: { '@id': `${SITE}#person` },
    image: og,
  };
  h = swap(h, /(\n<\/head>)/, `\n  <script type="application/ld+json">\n  ${JSON.stringify(work, null, 2).replace(/\n/g, '\n  ')}\n  </script>$1`);

  // текст для тех, кто не выполняет JS; main.js сразу заменит его кейсом
  const desc = PLACEHOLDER.test(p.descEn) ? d.en : plain(p.descEn);
  h = swap(h, /<div class="panel-detail" id="panelDetail"><\/div>/,
    `<div class="panel-detail" id="panelDetail"><div class="sr-only"><h1>${esc(p.titleEn)} (${esc(p.titleRu)})</h1><p>${esc(desc)}</p><p>${esc(d.ru)}</p></div></div>`);

  fs.mkdirSync(path.join(ROOT, p.folder), { recursive: true });
  fs.writeFileSync(path.join(ROOT, p.folder, 'index.html'), h);
  built++;
}

const today = new Date().toISOString().slice(0, 10);
const urls = ['', 'about.html', 'contact.html', ...projects.map(p => `${p.folder}/`)];
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url>\n    <loc>${SITE}${u}</loc>\n    <lastmod>${today}</lastmod>\n  </url>\n`).join('') +
  `</urlset>\n`);

console.log(`страниц кейсов: ${built}, адресов в sitemap: ${urls.length}`);
