/* main.js — Sasha Mindrin portfolio */

// ─── Language ───
function detectLang() {
  const saved = localStorage.getItem('lang');
  if (saved) return saved;
  const browser = (navigator.language || navigator.userLanguage || '').toLowerCase();
  return browser.startsWith('ru') ? 'ru' : 'en';
}
let currentLang = detectLang();
const langToggle = document.getElementById('langToggle');

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  langToggle.textContent = lang === 'en' ? 'RU' : 'EN';
  document.documentElement.lang = lang;

  const iframeEl = document.querySelector('.panel-detail iframe');
  if (iframeEl) {
    try { iframeEl.contentWindow.postMessage({ lang }, '*'); } catch (_) {}
  }

  document.querySelectorAll('[data-en]').forEach(el => {
    const text = lang === 'en' ? el.dataset.en : el.dataset.ru;
    if (!text) return;
    if (text.includes('<')) {
      el.innerHTML = text;
    } else {
      el.textContent = text;
    }
  });

  const projectBody = document.getElementById('projectBody');
  if (projectBody) applyLangSections(projectBody, lang);
}

langToggle.addEventListener('click', () => {
  applyLang(currentLang === 'en' ? 'ru' : 'en');
});


// ─── Burger menu ───
const burgerBtn = document.getElementById('burgerBtn');
const navMenu = document.getElementById('navMenu');
const navOverlay = document.getElementById('navOverlay');

function toggleMenu(open) {
  navMenu.classList.toggle('open', open);
  navOverlay.classList.toggle('open', open);
  burgerBtn.textContent = open ? 'close' : 'menu';
}

burgerBtn.addEventListener('click', () => toggleMenu(!navMenu.classList.contains('open')));
navOverlay.addEventListener('click', () => toggleMenu(false));


// ─── Scroll: transparent header ───
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 0);
});


// ─── Projects ───
const projectsData = [
  { id: 'project-1',  folder: 'ba',               color: '#c0392b', titleEn: 'Ba',                titleRu: 'Ба',                    year: '2026', tags: ['logos', 'branding'],               descEn: '«Ba» is a restaurant built on the model of a Japanese ramen shop — but with Russian soul.<br><br>Task: Create an identity for a place where Japanese form meets Russian substance:<br><br>shchi in five varieties instead of ramen<br>fermented vegetables instead of tsukemono<br>salted fish instead of sashimi<br>salo instead of wagyu<br>vodka instead of sake', descRu: '«Ба» — ресторан по модели японского рамен-шопа, но с русской душой.<br><br>Задача: Создать айдентику для заведения, где японская форма встречает русское содержание:<br><br>вместо рамена — щи (5 видов)<br>вместо цукэмоно — квашения<br>вместо сашими — солёная рыба<br>вместо вагю — сало<br>вместо саке — водка' },
  { id: 'project-2',  folder: 'tula-marathon',    color: '#e67e22', titleEn: 'Tula Marathon',     titleRu: 'Тульский марафон',      year: '2026', tags: ['logos', 'motion'],                 descEn: 'Identity and motion for the Tula Marathon.', descRu: 'Айдентика и моушн Тульского марафона.' },
  { id: 'project-3',  folder: 'tula-running-club',color: '#f1c40f', titleEn: 'Tula Running Club', titleRu: 'Тульский беговой клуб', year: '2025', tags: ['logos', 'branding', 'illustration'],descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-21', folder: 'puppai',            color: '#7c5cbf', titleEn: 'PuppAI',            titleRu: 'PuppAI',                year: '2026', tags: ['logos', 'web', 'interactive'],     descEn: 'Logo and identity for a pet behaviour and health monitoring service.', descRu: 'Логотип и айдентика для сервиса мониторинга поведения и здоровья домашних питомцев.' },
  { id: 'project-4',  folder: 'punk-delicious',   color: '#e91e8c', titleEn: 'Punk Delicious',    titleRu: 'Панк делишс',           year: '2025', tags: ['logos', 'branding'],               descEn: 'Logo and identity for a restaurant.', descRu: 'Логотип и айдентика для ресторана.' },
  { id: 'project-5',  folder: 'coffee-cult',      color: '#a0522d', titleEn: 'Coffee Cult',       titleRu: 'Кофе культ',            year: '2025', tags: ['logos', 'illustration'],           descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-6',  folder: 'nitka',            color: '#1abc9c', titleEn: 'Nitka',             titleRu: 'Нитка',                 year: '2020', tags: ['logos', 'branding'],               descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-7',  folder: 'volna',            color: '#3498db', titleEn: 'Volna',             titleRu: 'Волна',                 year: '2022', tags: ['logos', 'illustration', 'art'],    descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-8',  folder: 'tula-region',      color: '#2c3e8c', titleEn: 'Tula Region',       titleRu: 'Тульский регион',       year: '2024', tags: ['branding', 'motion'],              descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-9',  folder: 'rassvet',          color: '#e8a87c', titleEn: 'Rassvet',           titleRu: 'Рассвет',               year: '2023', tags: ['logos', 'art'],                    descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-10', folder: 'azaza',            color: '#9b59b6', titleEn: 'Azaza',             titleRu: 'Азаза',                 year: '2021', tags: ['logos', 'branding', 'motion'],     descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-11', folder: 'zernovaya',        color: '#8fbc45', titleEn: 'Zernovaya',         titleRu: 'Зерновая',              year: '2021', tags: ['logos', 'branding'],               descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-12', folder: 'soyuz',            color: '#c0392b', titleEn: 'Soyuz',             titleRu: 'Союз',                  year: '2022', tags: ['logos', 'motion', 'art'],          descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-19', folder: 'justtalk',         color: '#5b8cff', titleEn: 'Justtalk',          titleRu: 'Джасттолк',             year: '2025', tags: ['logos', 'web', 'interactive'],     descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-14', folder: 'russian-tea-house', color: '#d35400', titleEn: 'Russian Tea House', titleRu: 'Дом русского чаепития', year: '2021', tags: ['logos', 'branding', 'illustration'],descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-15', folder: 'mumble-podcast',   color: '#27ae60', titleEn: 'Mumble Podcast',    titleRu: 'Мамбл подкаст',         year: '2019', tags: ['logos', 'motion', 'interactive'],  descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-16', folder: 'volunteer-71',     color: '#8e44ad', titleEn: 'Volunteer 71',      titleRu: 'Волонтер 71',           year: '2016', tags: ['logos', 'branding', 'web'],        descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-17', folder: '212f',             color: '#2980b9', titleEn: '212F',              titleRu: '212F',                  year: '2019', tags: ['logos', 'art', 'illustration'],    descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-18', folder: 'terpsichore',      color: '#e74c3c', titleEn: 'Terpsichore',       titleRu: 'Терпсихора',            year: '2023', tags: ['logos', 'motion', 'art'],          descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-20', folder: 'soroka',           color: '#c0a060', titleEn: 'Soroka',            titleRu: 'Сорока',                year: '2019', tags: ['logos', 'branding'],               descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
];

let activeProjectId = null;

function applyLangSections(container, lang) {
  container.querySelectorAll('.lang-en').forEach(el => el.style.display = lang === 'en' ? '' : 'none');
  container.querySelectorAll('.lang-ru').forEach(el => el.style.display = lang === 'ru' ? '' : 'none');
}

// Пустое состояние: пока не выбран проект — минималистичная ASCII-анимация
// и подпись «выберите проект».
let asciiRAF = null;

function stopAscii() {
  if (asciiRAF) { cancelAnimationFrame(asciiRAF); asciiRAF = null; }
}

function startAscii(pre) {
  stopAscii();
  const COLS = 46, ROWS = 15;
  const ramp = ' .·:-=+*#'; // от разреженного к плотному, в духе ascii-генератора
  const ASPECT = 0.5;        // символ выше, чем шире — сжимаем ось X

  // расстояние от точки до отрезка (с поправкой на пропорции символа)
  function distSeg(px, py, ax, ay, bx, by) {
    const vx = bx - ax, vy = by - ay;
    const wx = px - ax, wy = py - ay;
    const c2 = vx * vx * ASPECT * ASPECT + vy * vy;
    let tt = c2 ? (wx * vx * ASPECT * ASPECT + wy * vy) / c2 : 0;
    tt = Math.max(0, Math.min(1, tt));
    const dx = (px - (ax + tt * vx)) * ASPECT, dy = py - (ay + tt * vy);
    return Math.hypot(dx, dy);
  }

  // отрезки стрелки: влево (десктоп) или вверх (мобильный)
  function segments(dir) {
    const cx = (COLS - 1) / 2, cy = (ROWS - 1) / 2;
    if (dir === 'up') {
      const tipY = ROWS * 0.24, tailY = ROWS * 0.80, W = COLS * 0.16;
      return [[cx, tipY, cx, tailY], [cx, tipY, cx - W, tipY + W * 0.8], [cx, tipY, cx + W, tipY + W * 0.8]];
    }
    const tipX = COLS * 0.16, tailX = COLS * 0.84, H = ROWS * 0.30;
    return [[tipX, cy, tailX, cy], [tipX, cy, tipX + H / ASPECT, cy - H], [tipX, cy, tipX + H / ASPECT, cy + H]];
  }

  let t = 0, last = 0;
  function frame(now) {
    asciiRAF = requestAnimationFrame(frame);
    if (now - last < 60) return;        // ~16 fps — спокойно и легко
    last = now;
    t += 0.05;
    const dir = window.innerWidth <= 768 ? 'up' : 'left';
    const segs = segments(dir);
    let out = '';
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        let d = Infinity;
        for (const s of segs) d = Math.min(d, distSeg(x, y, s[0], s[1], s[2], s[3]));
        const base = Math.max(0, 1 - d / 1.15);          // толщина линии
        // бегущая по стрелке волна плотности — «течёт» к острию
        const along = dir === 'up' ? y : x;
        const wave = 0.55 + 0.45 * Math.sin(along * 0.6 + t * 2.4);
        const inten = base * wave;
        out += inten <= 0.06 ? ' ' : ramp[Math.max(1, Math.min(ramp.length - 1, Math.floor(inten * ramp.length)))];
      }
      out += '\n';
    }
    pre.textContent = out;
  }
  asciiRAF = requestAnimationFrame(frame);
}

function renderEmpty() {
  activeProjectId = null;
  if (scrollFxCleanup) { scrollFxCleanup(); scrollFxCleanup = null; }
  dropIframeNav(); // панель очищается — iframe прошлого кейса исчезает
  document.querySelectorAll('.card[data-id]').forEach(c => c.classList.remove('active'));
  const panel = document.getElementById('panelDetail');
  if (!panel) return;
  panel.classList.remove('panel-iframe');
  panel.innerHTML = `
    <div class="pd-empty">
      <pre class="pd-ascii" aria-hidden="true"></pre>
      <div class="pd-empty-text" data-en="select a project" data-ru="выберите проект">выберите проект</div>
    </div>
  `;
  panel.scrollTop = 0;
  const pre = panel.querySelector('.pd-ascii');
  if (pre) startAscii(pre);
}

// ─── Появление/исчезновение по скроллу (data-fx="scroll") ───
// Прозрачность зависит от того, насколько элемент близок к центру
// экрана: полная в центральной полосе, плавно гаснет к краям.
// Скролл слушаем в capture-фазе на document — так ловится и внутренний
// скролл панели (десктоп), и скролл body (мобильный), без привязки к
// конкретному контейнеру.
let scrollFxCleanup = null;
function initScrollFx(root) {
  const els = Array.from(root.querySelectorAll('[data-fx="scroll"]'));
  if (!els.length) return null;
  let raf = 0;
  const update = () => {
    raf = 0;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const flat = vh * 0.08; // узкая зона полной видимости у центра
    const fade = vh * 0.27; // быстрое затухание: элемент виден только в центральной полосе,
                            // у центра проявляется и полностью гаснет, не дойдя до краёв экрана
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      const dist = Math.abs(r.top + r.height / 2 - vh / 2);
      const k = Math.min(1, Math.max(0, (dist - flat) / fade));
      el.style.opacity = (1 - k).toFixed(3); // к краям гаснет в ноль
    });
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
  document.addEventListener('scroll', onScroll, { passive: true, capture: true });
  window.addEventListener('resize', onScroll);
  root.querySelectorAll('img').forEach(img => {
    if (!img.complete) img.addEventListener('load', onScroll, { once: true });
  });
  update();
  return () => {
    document.removeEventListener('scroll', onScroll, { capture: true });
    window.removeEventListener('resize', onScroll);
    if (raf) cancelAnimationFrame(raf);
  };
}

async function renderProject(id) {
  const project = projectsData.find(p => p.id === id);
  if (!project) return;
  activeProjectId = id;
  stopAscii();
  if (scrollFxCleanup) { scrollFxCleanup(); scrollFxCleanup = null; }
  dropIframeNav(); // окно прошлого кейса выгружается вместе с iframe
  showNav(); // при выборе проекта навигация остаётся показанной

  document.querySelectorAll('.card[data-id]').forEach(c => {
    c.classList.toggle('active', c.dataset.id === id);
  });

  const panel = document.getElementById('panelDetail');
  if (!panel) return;
  panel.classList.remove('panel-iframe');

  const t = currentLang;
  panel.innerHTML = `
    <div class="project-detail">
      <div class="pd-header">
        <h2 class="pd-title" data-en="${project.titleEn}" data-ru="${project.titleRu}">
          ${t === 'en' ? project.titleEn : project.titleRu}
        </h2>
        <div class="pd-meta">
          <div class="pd-meta-item">
            <span class="pd-meta-key" data-en="year" data-ru="год">${t === 'en' ? 'year' : 'год'}</span>
            <span class="pd-meta-val">${project.year}</span>
          </div>
        </div>
      </div>
      <div class="pd-desc">
        <div data-en="${project.descEn}" data-ru="${project.descRu}">
          ${t === 'en' ? project.descEn : project.descRu}
        </div>
      </div>
      <div class="pd-body" id="projectBody">
        <div class="post-loading">···</div>
      </div>
    </div>
  `;

  panel.scrollTop = 0;

  try {
    // no-cache: браузер обязан перепроверить свежесть у сервера, иначе
    // GitHub Pages/браузер могут отдавать старую версию страницы проекта.
    const res = await fetch(`projects/${project.folder}.html`, { cache: 'no-cache' });
    if (!res.ok) throw new Error();
    const html = (await res.text()).trim();

    if (html.startsWith('<iframe')) {
      // Страница проекта несёт собственную шапку (pf-header) с названием,
      // годом и описанием — панель её не дублирует.
      panel.classList.add('panel-iframe');
      panel.innerHTML = html;
      const iframe = panel.querySelector('iframe');
      if (iframe) iframe.addEventListener('load', () => hookIframeNav(iframe));
    } else {
      const body = document.getElementById('projectBody');
      if (body) {
        body.innerHTML = html;
        applyLangSections(body, currentLang);
        scrollFxCleanup = initScrollFx(body);
      }
    }
  } catch {
    const body = document.getElementById('projectBody');
    if (body) body.innerHTML = '';
  }
}

const tryLoad = src => new Promise((res, rej) => {
  const img = new Image();
  img.onload = () => res(img);
  img.onerror = rej;
  img.src = src;
});

const allCards = Array.from(document.querySelectorAll('.card[data-id]'));

function scrollToCard(card) {
  if (window.innerWidth > 768) return;
  const grid = document.querySelector('.cards-grid');
  if (!grid) return;
  const visibleCards = allCards.filter(c => c.style.display !== 'none');
  const visibleIndex = visibleCards.indexOf(card);
  const scrollTo = visibleIndex <= 1 ? 0 : visibleCards[visibleIndex - 1].offsetLeft;
  grid.scrollTo({ left: scrollTo, behavior: 'smooth' });
}

document.querySelectorAll('.card[data-id]').forEach(card => {
  card.addEventListener('click', () => {
    renderProject(card.dataset.id);
    scrollToCard(card);
  });
  card.addEventListener('mouseenter', () => card.classList.add('hovered'));
  card.addEventListener('mouseleave', () => card.classList.remove('hovered'));

  const id = card.dataset.id;
  const project = projectsData.find(p => p.id === id);
  if (!project) return;

  card.style.setProperty('--card-color', project.color);

  const inner = card.querySelector('.card-inner');
  const base = `assets/projects/${project.folder}/thumb`;

  card.classList.add('loading');

  tryLoad(`${base}.png`)
    .catch(() => tryLoad(`${base}.svg`))
    .then(img => {
      img.className = 'card-thumb';
      inner.appendChild(img);
      const icon = inner.querySelector('.card-icon');
      if (icon) icon.style.display = 'none';
    })
    .catch(() => {})
    .finally(() => card.classList.remove('loading'));
});


// ─── Tag filter ───
let activeTag = null;

function filterByTag(tag) {
  activeTag = (tag === 'all' || activeTag === tag) ? null : tag;

  document.querySelectorAll('.tag-btn').forEach(btn => {
    if (btn.dataset.tag === 'all') {
      btn.classList.toggle('active', activeTag === null);
    } else {
      btn.classList.toggle('active', btn.dataset.tag === activeTag);
    }
  });

  let firstVisible = null;
  allCards.forEach(card => {
    const project = projectsData.find(p => p.id === card.dataset.id);
    const visible = !activeTag || (project && project.tags.includes(activeTag));
    card.style.display = visible ? '' : 'none';
    if (visible && !firstVisible) firstVisible = card;
  });

  const activeCard = document.querySelector('.card.active');
  if (activeCard && activeCard.style.display === 'none' && firstVisible) {
    renderProject(firstVisible.dataset.id);
  }
}

document.querySelectorAll('.tag-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    filterByTag(btn.dataset.tag);
    btn.blur();
    if (window.innerWidth <= 768) {
      const hero = document.querySelector('.hero');
      if (hero) {
        const scrollTo = btn.offsetLeft - (hero.offsetWidth / 2) + (btn.offsetWidth / 2);
        hero.scrollTo({ left: Math.max(0, scrollTo), behavior: 'smooth' });
      }
    }
  });
});


// ─── Мобильная навигация: авто-скрытие тегов+полосы по направлению скролла ───
// Скролл-контекстов несколько (страница, панель, окно iframe-кейса), а
// навигация одна — поэтому состояние общее, а не своё на каждый обработчик.
// Иначе контекст, стоящий у нуля, «показывал» навигацию поверх того, который
// в этот момент реально уезжал вниз.
const NAV_HIDE_PX = 3;     // вниз — прячем практически с первого движения
const NAV_SHOW_PX = 24;    // вверх — только на осознанном движении
const NAV_SETTLE_MS = 350; // пока схлопывание меняет высоту документа

const navSources = [];   // { getY, lastY, kind }
let navHidden = false;
let navAccum = 0;        // движение в одну сторону, копится до порога
let navHiddenAt = -Infinity;

function navReadY(s) {
  try { return s.getY() || 0; } catch (_) { return 0; }
}

function showNav() {
  navAccum = 0;
  if (!navHidden) return;
  navHidden = false;
  document.body.classList.remove('nav-hidden');
}

function hideNav() {
  navAccum = 0;
  if (navHidden) return;
  navHidden = true;
  navHiddenAt = performance.now();
  document.body.classList.add('nav-hidden');
}

// показываем только когда ВСЕ контексты у верха — иначе страница, стоящая
// на нуле, перебивала скролл внутри кейса
function navAllAtTop() {
  return navSources.every(s => navReadY(s) <= 2);
}

function makeNavScroll(getY, kind) {
  const src = { getY, lastY: 0, kind };
  src.lastY = navReadY(src);
  navSources.push(src);
  return function () {
    const y = navReadY(src);
    const dy = y - src.lastY;
    src.lastY = y;
    if (window.innerWidth > 768) { showNav(); return; }
    // схлопывание навигации укорачивает документ: у нижней кромки браузер
    // подтягивает позицию вверх — это не «пользователь вернулся наверх»
    const settling = performance.now() - navHiddenAt < NAV_SETTLE_MS;
    if (y <= 2 && navAllAtTop()) { if (!settling) showNav(); return; }
    if (!dy) return;
    // смена направления обнуляет накопитель — дрожание не дёргает навигацию
    navAccum = (navAccum > 0) === (dy > 0) ? navAccum + dy : dy;
    if (!navHidden) {
      if (navAccum >= NAV_HIDE_PX) hideNav();   // прячем без задержки
    } else if (settling) {
      navAccum = 0;
    } else if (navAccum <= -NAV_SHOW_PX) {
      showNav();
    }
  };
}

function setNavVars() {
  const h = document.querySelector('header');
  const hero = document.querySelector('.hero');
  const strip = document.querySelector('.panel-list');
  const footer = document.querySelector('footer');
  if (h) document.documentElement.style.setProperty('--hh', h.offsetHeight + 'px');
  if (hero) document.documentElement.style.setProperty('--hero-h', hero.offsetHeight + 'px');
  if (footer) document.documentElement.style.setProperty('--footer-h', footer.offsetHeight + 'px');
  if (strip && window.innerWidth <= 768)
    document.documentElement.style.setProperty('--strip-h', strip.offsetHeight + 'px');
}
setNavVars();
window.addEventListener('resize', () => { setNavVars(); if (window.innerWidth > 768) showNav(); });

const winNavScroll = makeNavScroll(
  () => window.scrollY || document.documentElement.scrollTop, 'window');
window.addEventListener('scroll', winNavScroll, { passive: true });

// панель со своим скроллом (десктоп; на мобильном overflow: visible)
const panelEl = document.getElementById('panelDetail');
if (panelEl) {
  panelEl.addEventListener('scroll', makeNavScroll(() => panelEl.scrollTop, 'panel'),
    { passive: true });
}

// кейсы-iframe скроллятся внутри себя — вешаем ту же логику на их окно
function hookIframeNav(iframe) {
  try {
    const w = iframe.contentWindow;
    w.addEventListener('scroll',
      makeNavScroll(() => w.scrollY || w.document.documentElement.scrollTop, 'iframe'),
      { passive: true });
  } catch (e) { /* другой origin — пропускаем */ }
}

// прошлый кейс выгружен — его окно больше не читаем, иначе мёртвый источник
// висит в navAllAtTop()
function dropIframeNav() {
  for (let i = navSources.length - 1; i >= 0; i--) {
    if (navSources[i].kind === 'iframe') navSources.splice(i, 1);
  }
}


// ─── Init ───
renderEmpty();
applyLang(currentLang);
