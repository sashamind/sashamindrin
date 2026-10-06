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
  // кейсы, перенесённые из Тильды, живут прямо на странице, но их скрипты
  // по-прежнему ждут смену языка сообщением — шлём его и себе
  if (document.querySelector('.panel-detail [data-tz]')) window.postMessage({ lang }, location.origin);

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

  updateTitle(); // имя кейса во вкладке тоже двуязычное
}

langToggle.addEventListener('click', () => {
  applyLang(currentLang === 'en' ? 'ru' : 'en');
  if (roleRestart) roleRestart();  // роли — на новом языке, с «дизайнера»
  replayIntro();
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
// hidden: true — кейс временно убран из списка: его карточка лежит в
// <template id="hiddenCards"> в index.html. По прямой ссылке (/слаг/) он
// по-прежнему открывается. Вернуть в список — снять флаг и перенести
// карточку обратно в сетку.
const projectsData = [
  { id: 'project-1',  folder: 'ba',               color: '#c0392b', titleEn: 'Ba',                titleRu: 'Ба',                    year: '2026', tags: ['logos', 'branding', 'motion', 'interactive'],               descEn: '«Ba» is a restaurant built on the model of a Japanese ramen shop — but with Russian soul.<br><br>Task: Create a logo concept for a restaurant.', descRu: '«Ба» — ресторан по модели японского рамен-шопа, но с русской душой.<br><br>Задача: Создать концепцию логотипа для заведения.' },
  { id: 'project-6',  folder: 'nitka',            color: '#1abc9c', titleEn: 'Nitka',             titleRu: 'Нитка',                 year: '2020', tags: ['logos', 'branding', 'motion'],               descEn: 'Nitka is an author’s project and a big dream about the revival of the Russian tea tradition.<br><br>Task: Create the identity for a tea brand — from the mark and packaging to illustrations and promo animation.', descRu: 'Нитка — авторский проект и большая мечта о возрождении русской чайной традиции.<br><br>Задача: Создать айдентику чайного бренда — от знака и упаковки до иллюстраций и промо-анимации.' },
  { id: 'project-2',  folder: 'tula-marathon', hidden: true,    color: '#e67e22', titleEn: 'Tula Marathon',     titleRu: 'Тульский марафон',      year: '2026', tags: ['logos', 'motion'],                 descEn: 'Logo redesign concept and identity for the Tula Marathon.', descRu: 'Концепция редизайна логотипа и айдентика Тульского марафона.' },
  { id: 'project-3',  folder: 'tula-running-club', hidden: true,color: '#f1c40f', titleEn: 'Tula Running Club', titleRu: 'Тульский беговой клуб', year: '2025', tags: ['logos', 'branding', 'illustration'],descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-21', folder: 'puppai',            color: '#7c5cbf', titleEn: 'PuppAI',            titleRu: 'PuppAI',                year: '2026', tags: ['logos', 'branding', 'motion'],     descEn: 'Logo concept for a pet behaviour and health monitoring service.', descRu: 'Концепция логотипа для сервиса мониторинга поведения и здоровья домашних питомцев.' },
  { id: 'project-4',  folder: 'punk-delicious',   color: '#e91e8c', titleEn: 'Punk Delicious',    titleRu: 'Панк делишс',           year: '2025', tags: ['logos', 'branding', 'motion'],               descEn: 'Logo and identity concept for a restaurant.', descRu: 'Концепция логотипа и айдентики для ресторана.' },
  { id: 'project-5',  folder: 'coffee-cult', hidden: true,      color: '#a0522d', titleEn: 'Coffee Cult',       titleRu: 'Кофе культ',            year: '2025', tags: ['logos', 'illustration'],           descEn: 'Redesign concept for a coffee brand.', descRu: 'Концепция редизайна кофейного бренда.' },
  { id: 'project-7',  folder: 'volna', hidden: true,            color: '#3498db', titleEn: 'Volna',             titleRu: 'Волна',                 year: '2022', tags: ['logos', 'illustration', 'art'],    descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-8',  folder: 'tula-region',      color: '#2c3e8c', titleEn: 'Tula Region',       titleRu: 'Тульский регион',       year: '2024', tags: ['logos', 'branding', 'motion', 'interactive'],              descEn: 'Logo and identity concept for promoting tourism in the Tula Region.<br><br>Task: Rework the historical coat of arms of the region, distilling its key metaphors into a new, more streamlined symbol.', descRu: 'Концепция логотипа и айдентики для продвижения туризма в Тульской области.<br><br>Задача: Переосмыслить исторический герб региона: выделить ключевые метафоры и собрать из них новый, более лаконичный символ.' },
  { id: 'project-9',  folder: 'rassvet', hidden: true,          color: '#e8a87c', titleEn: 'Rassvet',           titleRu: 'Рассвет',               year: '2023', tags: ['logos', 'art'],                    descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-10', folder: 'azaza', hidden: true,            color: '#9b59b6', titleEn: 'Azaza',             titleRu: 'Азаза',                 year: '2021', tags: ['logos', 'branding', 'motion'],     descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-11', folder: 'zernovaya', hidden: true,        color: '#8fbc45', titleEn: 'Zernovaya',         titleRu: 'Зерновая',              year: '2021', tags: ['logos', 'branding'],               descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-12', folder: 'soyuz', hidden: true,            color: '#c0392b', titleEn: 'Soyuz',             titleRu: 'Союз',                  year: '2022', tags: ['logos', 'motion', 'art'],          descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-13', folder: 'strana-sveta', hidden: true,     color: '#7fd6e8', titleEn: 'Strana Sveta',      titleRu: 'Страна света',          year: '2022', tags: ['motion', 'art'],                   descEn: 'Projection mapping concept for a Saint Petersburg facade — finalist of the Strana Sveta festival.', descRu: 'Концепция проекционного маппинга на фасад в Санкт-Петербурге — финалист фестиваля «Страна света».' },
  { id: 'project-19', folder: 'justtalk',         color: '#5b8cff', titleEn: 'Justtalk',          titleRu: 'Джасттолк',             year: '2025', tags: ['logos', 'branding', 'motion'],     descEn: '<a href=\'https://justtalk.ai/\' target=\'_blank\' rel=\'noopener\'>JustTalk</a> is a service for practising English through realistic conversations with AI.<br><br>Task: Develop a logo concept.', descRu: '<a href=\'https://justtalk.ai/\' target=\'_blank\' rel=\'noopener\'>JustTalk</a> — сервис для практики английского языка через реалистичные разговоры с ИИ.<br><br>Задача: Разработать концепцию логотипа.' },
  { id: 'project-14', folder: 'russian-tea-house', hidden: true, color: '#d35400', titleEn: 'Russian Tea House', titleRu: 'Дом русского чаепития', year: '2021', tags: ['logos', 'branding', 'illustration'],descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-15', folder: 'mumble-podcast', hidden: true,   color: '#27ae60', titleEn: 'Mumble Podcast',    titleRu: 'Мамбл подкаст',         year: '2019', tags: ['logos', 'motion', 'interactive'],  descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-16', folder: 'volunteer-71', hidden: true,     color: '#8e44ad', titleEn: 'Volunteer 71',      titleRu: 'Волонтер 71',           year: '2016', tags: ['logos', 'branding', 'web'],        descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-17', folder: '212f', hidden: true,             color: '#2980b9', titleEn: '212F',              titleRu: '212F',                  year: '2019', tags: ['logos', 'art', 'illustration'],    descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-18', folder: 'terpsichore', hidden: true,      color: '#e74c3c', titleEn: 'Terpsichore',       titleRu: 'Терпсихора',            year: '2023', tags: ['logos', 'motion', 'art'],          descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-20', folder: 'soroka', hidden: true,           color: '#c0a060', titleEn: 'Soroka',            titleRu: 'Сорока',                year: '2019', tags: ['logos', 'branding'],               descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
];

let activeProjectId = null;

function applyLangSections(container, lang) {
  container.querySelectorAll('.lang-en').forEach(el => el.style.display = lang === 'en' ? '' : 'none');
  container.querySelectorAll('.lang-ru').forEach(el => el.style.display = lang === 'ru' ? '' : 'none');
}

// Пустое состояние: пока не выбран проект — короткая справка обо мне,
// ниже — простая линейная стрелка к списку слева.
function renderEmpty() {
  activeProjectId = null;
  if (caseExpand) caseExpand.hidden = true;
  setCaseFull(false);
  updateTitle();
  if (scrollFxCleanup) { scrollFxCleanup(); scrollFxCleanup = null; }
  if (guyCleanup) { guyCleanup(); guyCleanup = null; }
  dropIframeNav(); // панель очищается — iframe прошлого кейса исчезает
  document.querySelectorAll('.card[data-id]').forEach(c => c.classList.remove('active'));
  const panel = document.getElementById('panelDetail');
  if (!panel) return;
  panel.classList.remove('panel-iframe');
  panel.style.minHeight = '';
  panel.innerHTML = `
    <div class="pd-empty">
      <div class="pd-intro">
        <svg class="pd-guy" viewBox="-70 -66 140 202" aria-hidden="true">
          <path class="g-head" />
          <path class="g-brim" />
          <path class="g-eye" /><path class="g-eye" />
          <path class="g-body" />
        </svg>
        <p class="pd-intro-text"><a class="pd-intro-name" href="about.html"><span class="pd-name-anim" data-name="ru" aria-hidden="true"></span><span class="pd-name-anim" data-name="en" aria-hidden="true"></span><span class="pd-name-text" data-en="Sasha Mindrin" data-ru="Саша Миндрин">Sasha Mindrin</span></a><span class="pd-name-comma">,</span><span class="pd-intro-rest"><span class="pd-role"><span class="pd-role-sizer" aria-hidden="true">designer.</span><span class="pd-role-word">designer<span class="pd-role-dot">.</span></span></span></span></p>
      </div>

      <div class="pd-point">
        <svg class="pd-arrow" viewBox="0 0 88 24" fill="none" aria-hidden="true">
          <line x1="87" y1="12" x2="7" y2="12" stroke="currentColor" stroke-width="0.75"/>
          <polyline points="17,3.5 6.5,12 17,20.5" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="pd-hint-row">
          <svg class="pd-up" viewBox="0 0 12 24" fill="none" aria-hidden="true"><line x1="6" y1="23" x2="6" y2="2" stroke="currentColor" stroke-width="0.75"/><polyline points="1.5,7 6,1.5 10.5,7" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div class="pd-empty-text" data-en="projects" data-ru="проекты">проекты</div>
          <svg class="pd-up" viewBox="0 0 12 24" fill="none" aria-hidden="true"><line x1="6" y1="23" x2="6" y2="2" stroke="currentColor" stroke-width="0.75"/><polyline points="1.5,7 6,1.5 10.5,7" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </div>
    </div>
  `;
  panel.scrollTop = 0;
  startPulse();
  scheduleHintFlash(panel.querySelector('.pd-point'));
  mountNameAnim(panel.querySelector('.pd-intro-text'));
  const stopGuy = mountGuy(panel.querySelector('.pd-guy'));
  const stopRole = mountRole(panel.querySelector('.pd-role'));
  guyCleanup = () => { if (stopGuy) stopGuy(); if (stopRole) stopRole(); };
  centerIntro();
  if (document.documentElement.classList.contains('intro-play')) drawGuyFirst();
}

// ─── Чувачок с именем — ровно по центру экрана ───
// Панель начинается под шапкой и тегами, поэтому её середина ниже
// середины экрана. Считаем, насколько сдвинуть блок, чтобы его центр
// встал в центр окна (на телефоне — на 66% высоты), и сдвигаем через position: relative; top (transform
// занят анимацией появления). На десктопе стрелка «проекты» стоит
// под именем и едет вместе с ним; на телефоне она над именем и остаётся
// на месте.
function centerIntro() {
  const intro = document.querySelector('.pd-intro');
  if (!intro) return;
  const point = document.querySelector('.pd-point');
  const narrow = window.matchMedia('(max-width: 768px)').matches;
  intro.style.top = '';
  if (point) point.style.top = '';
  const r = intro.getBoundingClientRect();
  const panel = document.getElementById('panelDetail');
  // считаем от положения при нулевой прокрутке панели и страницы
  const scroll = (panel ? panel.scrollTop : 0) + window.scrollY;
  // вычесть сдвиг анимации появления (translateY), если она ещё идёт
  const t = getComputedStyle(intro).transform;
  const ty = t && t !== 'none' ? new DOMMatrix(t).m42 : 0;
  // на телефоне чуть ниже середины — сверху там уже лента кейсов и подсказка
  const target = window.innerHeight * (narrow ? 0.66 : 0.5);
  const shift = Math.round(target - (r.top - ty + scroll + r.height / 2));
  intro.style.top = shift + 'px';
  if (point && !narrow) point.style.top = shift + 'px';
}
let centerT = null;
window.addEventListener('resize', () => { clearTimeout(centerT); centerT = setTimeout(centerIntro, 120); });

// ─── Подсказка «проекты» на телефоне ───
// Через 3 с после того, как подсказка появилась (после заставки, если
// она идёт), надпись со стрелками один раз загорается белым. Не отдельной
// вспышкой, а внутри обычного пульса строки (css, только в мобильной
// вёрстке): со следующего цикла цвет к пику яркости плавно уходит в белый и
// так же плавно возвращается. Цвет привязан к тому же таймлайну, что и
// пульс, поэтому идёт с ним кадр в кадр.
let hintFlashT = null;
function flashHint(point) {
  const row = point.querySelector('.pd-hint-row');
  const pulse = row && row.getAnimations().find(a => a.animationName === 'hintPulse');
  if (!pulse || pulse.startTime == null) return; // десктоп или движение отключено
  const period = pulse.effect.getTiming().duration;
  const now = document.timeline.currentTime;
  const start = pulse.startTime + Math.ceil((now - pulse.startTime) / period) * period;
  row.querySelectorAll('.pd-empty-text, .pd-up').forEach(el => {
    const base = getComputedStyle(el).color;
    const flash = el.animate([
      { color: base, easing: 'ease-in-out' },
      { color: '#fff', offset: 0.5, easing: 'ease-in-out' },
      { color: base },
    ], { duration: period });
    flash.startTime = start;
  });
}
function scheduleHintFlash(point) {
  clearTimeout(hintFlashT);
  if (!point) return;
  const wait = () => {
    if (!point.isConnected) return;
    if (document.documentElement.classList.contains('intro-play')) { hintFlashT = setTimeout(wait, 250); return; }
    hintFlashT = setTimeout(() => { if (point.isConnected) flashHint(point); }, 3000);
  };
  wait();
}

// ─── Сменяющееся «кто я» после имени ───
// «дизайнер» висит 3 с, затем по очереди остальные роли, по 1.8 с, и
// снова «дизайнер». Роль стоит строкой под именем, по центру. Смена одним
// движением по горизонтали: новое слово въезжает справа и выталкивает
// старое влево. Место под слово — по самому длинному. Отсчёт идёт после
// заставки (endIntro перезапускает его с «дизайнера»).
const ROLES = {
  ru: ['дизайнер', 'художник', 'моушн', 'иллюстратор', 'креатор'],
  en: ['designer', 'artist', 'motion', 'illustrator', 'creator']
};
const ROLE_FIRST = 3000, ROLE_NEXT = 1800, ROLE_SWAP = 450;
let roleRestart = null;
function mountRole(box) {
  if (!box) return null;
  let word = box.querySelector('.pd-role-word');
  let i = 0, t = null;
  function fit() {
    // ширина места — по самому длинному слову текущего языка
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
    box.appendChild(probe);
    let w = 0;
    ROLES[currentLang].forEach(r => { probe.textContent = r; w = Math.max(w, probe.offsetWidth); });
    probe.remove();
    box.style.width = Math.ceil(w) + 'px';
  }
  function show(k, animate) {
    // точка висит после слова и не участвует в центрировании
    const text = ROLES[currentLang][k] + '<span class="pd-role-dot">.</span>';
    box.querySelectorAll('.pd-role-word.is-out').forEach(el => el.remove());
    if (!animate) { word.innerHTML = text; word.className = 'pd-role-word'; return; }
    // новое слово кладём поверх старого, чуть выше, и сдвигаем оба разом
    const next = document.createElement('span');
    next.className = 'pd-role-word is-pre';
    next.innerHTML = text;
    box.appendChild(next);
    next.offsetWidth;  // зафиксировать положение «сверху» до перехода
    next.classList.remove('is-pre');
    word.classList.add('is-out');
    const old = word;
    word = next;
    setTimeout(() => old.remove(), ROLE_SWAP + 30);
  }
  function tick() {
    if (document.documentElement.classList.contains('intro-play')) return;  // перезапустит endIntro
    i = (i + 1) % ROLES[currentLang].length;
    show(i, true);
    t = setTimeout(tick, (i === 0 ? ROLE_FIRST : ROLE_NEXT) + ROLE_SWAP);
  }
  function restart() {
    clearTimeout(t); i = 0; fit(); show(0, false);
    t = setTimeout(tick, ROLE_FIRST);
  }
  roleRestart = restart;
  restart();
  return () => { clearTimeout(t); if (roleRestart === restart) roleRestart = null; };
}

// ─── Чувачок над именем ───
// Собран из четырёх линий: голова-«С» с разрывом справа, козырёк, глаза-
// чёрточки, плечи-дуга. Голова считается шаром: поворот на угол yaw
// сдвигает козырёк в сторону взгляда, а глаза едут по сфере — анфас их
// два, в полупрофиль дальний уходит за край и остаётся один. Наклон pitch
// чуть поднимает или опускает козырёк с глазами. Голова поворачивается за
// курсором или к тапу; появившись и заскучав, оглядывается сам.
let guyCleanup = null;
function mountGuy(svg) {
  if (!svg) return null;
  const head = svg.querySelector('.g-head'), brim = svg.querySelector('.g-brim');
  const eyes = svg.querySelectorAll('.g-eye'), body = svg.querySelector('.g-body');
  const RX = 42, RY = 54;
  // Линии не идеально ровные, а будто от руки: каждую строим точками и
  // сдвигаем поперёк плавной волной (две синусоиды со своими фазами на
  // каждую линию). Волна привязана к положению на линии, поэтому при
  // поворотах головы кривизна не дрожит, а едет вместе с рисунком.
  const wob = (amp, p1, p2) => t => amp * (0.62 * Math.sin(2 * Math.PI * 1.1 * t + p1) + 0.38 * Math.sin(2 * Math.PI * 2.3 * t + p2));
  function wobbly(fn, n, w) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, [x, y] = fn(t);
      const [xa, ya] = fn(Math.max(0, t - 0.01)), [xb, yb] = fn(Math.min(1, t + 0.01));
      let nx = -(yb - ya), ny = xb - xa; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
      const o = w(t);
      pts.push([x + nx * o, y + ny * o]);
    }
    // сглаживаем: кривые через середины отрезков
    let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += ` Q${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`;
    }
    const e = pts[pts.length - 1];
    return d + ` L${e[0].toFixed(2)} ${e[1].toFixed(2)}`;
  }
  // козырёк — ровный, остальное заметно «от руки»
  const W = { head: wob(4.2, 0.7, 2.1), brim: wob(0, 0, 0), eye: wob(0.9, 1.2, 3.0), body: wob(4, 4.1, 1.3) };
  // голова — эллипс без куска справа (от 20° вниз по кругу до −16°)
  const a0 = 20 * Math.PI / 180, span = 2 * Math.PI - 36 * Math.PI / 180;
  head.setAttribute('d', wobbly(t => { const a = a0 + span * t; return [RX * Math.cos(a), RY * Math.sin(a)]; }, 36, W.head));
  const seg = (x1, y1, x2, y2) => t => [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
  const bez = (p0, p1, p2, p3) => t => { const u = 1 - t; return [0, 1].map(k => u*u*u*p0[k] + 3*u*u*t*p1[k] + 3*u*t*t*p2[k] + t*t*t*p3[k]); };
  const DEF_YAW = -50, EYE_A = 32, EYE_R = 30;
  let yaw = DEF_YAW, pitch = 0, tYaw = DEF_YAW, tPitch = 0, raf = null;
  let blinkUntil = 0, blinkT = null;  // моргание: до этого момента глаза закрыты
  function draw() {
    // pitch — наклон в градусах: вверх (−) козырёк и глаза поднимаются, вниз (+) опускаются
    const f = yaw * Math.PI / 180, sp = Math.sin(pitch * Math.PI / 180);
    const bx = Math.sin(f) * 24;
    // в повороте козырёк виден под углом — чуть короче; анфас — полный.
    // Передний край (в сторону взгляда) в повороте выступает чуть дальше
    const bh = 54 * (1 - 0.22 * Math.abs(Math.sin(f)));
    const peak = 8 * Math.sin(f);
    const brimX = [bx - bh + Math.min(peak, 0), bx + bh + Math.max(peak, 0)];
    const by = -12 + sp * 22;
    brim.setAttribute('d', wobbly(seg(brimX[0], by, brimX[1], by), 10, W.brim));
    [-EYE_A, EYE_A].forEach((a, i) => {
      const t = (a * Math.PI / 180) + f, vis = Math.cos(t);
      const x = EYE_R * Math.sin(t), half = 5 * Math.max(0.35, vis);
      const e = eyes[i];

      const ey = 7 + sp * 30;
      e.setAttribute('d', wobbly(seg(x - half, ey, x + half, ey), 4, W.eye));
      // глаз, ушедший за край головы, гаснет
      const shut = performance.now() < blinkUntil;
      e.style.opacity = shut ? 0 : Math.max(0, Math.min(1, (vis - 0.3) / 0.25)).toFixed(3);
    });
    const sx = -Math.sin(f) * 4;
    const L = bez([-62 + sx, 132], [-62 + sx, 92], [-36 + sx, 72], [sx, 72]);
    const R = bez([sx, 72], [36 + sx, 72], [62 + sx, 92], [62 + sx, 132]);
    body.setAttribute('d', wobbly(t => t < 0.5 ? L(t * 2) : R(t * 2 - 1), 28, W.body));
  }
  function loop() {
    yaw += (tYaw - yaw) * 0.12; pitch += (tPitch - pitch) * 0.12;
    draw();
    raf = (Math.abs(tYaw - yaw) > 0.05 || Math.abs(tPitch - pitch) > 0.05 || performance.now() < blinkUntil + 50) ? requestAnimationFrame(loop) : null;
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  // Моргает сам по себе раз в 2.5–6 с: глаза-чёрточки на миг пропадают,
  // иногда дважды подряд.
  function blink(n) {
    blinkUntil = performance.now() + 110; kick();
    if (n > 1) { blinkT = setTimeout(() => blink(n - 1), 230); return; }
    blinkT = setTimeout(() => blink(Math.random() < 0.25 ? 2 : 1), 2500 + Math.random() * 3500);
  }
  blinkT = setTimeout(() => blink(1), 3000);
  // Куда смотреть по точке указателя: центр — примерно на уровне глаз
  function lookAt(e) {
    const r = svg.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height * 0.3;
    const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.35)));
    const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight * 0.4)));
    tYaw = nx * 70; tPitch = ny * 24; kick();
  }
  // Поведение одно для мыши и тача. Как только чувачок дорисован, он сам
  // оглядывается (влево, вправо, обратно) и в это время на указатель не
  // реагирует. Потом следит за курсором / поворачивается к тапу. Если 3 с
  // нет ни движения, ни тапа — снова сам вертит головой, пока не позовут.
  const LOOK_IN = [[-20, -4], [40, 2], [DEF_YAW, 0]];  // [yaw, pitch] первого огляда
  const LOOK_STEP = 800, IDLE_AFTER = 3000;
  let lockUntil = Infinity;  // до конца первого огляда указатель не слушаем
  let lastActive = 0, idleT = null, introT2 = null;
  function idleStep() {
    clearTimeout(idleT);
    const now = performance.now();
    if (now >= lockUntil && now - lastActive < IDLE_AFTER) {
      // зовут — ждём, когда указатель затихнет
      idleT = setTimeout(idleStep, IDLE_AFTER - (now - lastActive) + 20);
      return;
    }
    let next;
    do { next = -60 + Math.random() * 120; } while (Math.abs(next - tYaw) < 25);
    tYaw = next; tPitch = -6 + Math.random() * 12; kick();
    idleT = setTimeout(idleStep, 1600 + Math.random() * 1000);
  }
  function lookAround() {
    clearTimeout(idleT); clearTimeout(introT2);
    lockUntil = performance.now() + LOOK_IN.length * LOOK_STEP;
    lastActive = 0;
    LOOK_IN.forEach(([y, p], i) => {
      introT2 = setTimeout(() => { tYaw = y; tPitch = p; kick(); }, i * LOOK_STEP);
    });
    idleT = setTimeout(idleStep, LOOK_IN.length * LOOK_STEP + 1200);
  }
  function onPointer(e) {
    if (performance.now() < lockUntil) return;
    lastActive = performance.now();
    lookAt(e);
  }
  draw();
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ev = fine ? 'pointermove' : 'pointerdown';
  window.addEventListener(ev, onPointer, { passive: true });
  // огляд — после прорисовки (на заставке её запускает drawGuyFirst),
  // без заставки — сразу
  guyOnDrawn = lookAround;
  if (!document.documentElement.classList.contains('intro-play')) lookAround();
  return () => {
    clearTimeout(idleT); clearTimeout(introT2); clearTimeout(blinkT);
    if (guyOnDrawn === lookAround) guyOnDrawn = null;
    window.removeEventListener(ev, onPointer);
    if (raf) cancelAnimationFrame(raf);
  };
}

// ─── Имя, прописанное линией ───
// Две Lottie (ru/en) в кадре 1920×1080, надпись в нём — узкая полоска
// у центра. Кадрируем svg по ней через viewBox и масштабируем так, чтобы
// имя было ростом с текст абзаца. Видна та, что совпадает с языком
// страницы (css по html[lang]). Пока Lottie не загрузилась, стоит
// обычный текст — он же остаётся, если загрузка не удалась.
const NAME_CROP = { ru: [848, 515, 220, 32], en: [831, 510, 237, 30] };
const NAME_SCALE = 0.42;
let nameAnims = null;
let introT = null;  // запасной таймер конца заставки — один на все повторы
let lottieLib = null;
function loadLottieLib() {
  if (window.lottie) return Promise.resolve(window.lottie);
  if (!lottieLib) {
    lottieLib = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js';
      s.onload = () => resolve(window.lottie);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return lottieLib;
}

// Чувачок на заставке: линии спрятаны (штрих отмотан на всю длину) и
// прорисовываются по очереди — голова, козырёк, глаза, плечи.
function guyEls() { return document.querySelectorAll('.pd-guy path, .pd-guy line'); }
function hideGuy() {
  guyEls().forEach(el => {
    const L = el.getTotalLength() + 2;
    el.style.transition = 'none';
    el.style.strokeDasharray = L;
    el.style.strokeDashoffset = L;
  });
}
function showGuy() {
  guyEls().forEach(el => { el.style.transition = el.style.strokeDasharray = el.style.strokeDashoffset = ''; });
}
function drawGuyIn() {
  return new Promise(resolve => {
    const els = [...guyEls()];
    if (!els.length || !els[0].style.strokeDasharray) { showGuy(); resolve(); return; }
    const DUR = 0.55, STEP = 0.14;
    els.forEach((el, i) => {
      el.getBoundingClientRect();  // зафиксировать исходное состояние
      el.style.transition = `stroke-dashoffset ${DUR}s ease-in-out ${(i * STEP).toFixed(2)}s`;
      el.style.strokeDashoffset = 0;
    });
    setTimeout(() => { showGuy(); resolve(); }, (DUR + (els.length - 1) * STEP) * 1000 + 60);
  });
}
// Заставка: сначала прорисовывается чувачок, за ним прописывается имя,
// затем проявляется остальное. guyDrawn — обещание «чувачок дорисован»
// для текущего захода заставки; имя ждёт его, сколько бы ни грузилась Lottie.
let guyDrawn = Promise.resolve();
let introRun = 0;  // номер захода: устаревшие ожидания не запускают имя
let guyOnDrawn = null;  // ставит mountGuy: «дорисован — начинай оглядываться»
function drawGuyFirst() {
  hideGuy();
  guyDrawn = drawGuyIn();
  const run = ++introRun;
  guyDrawn.then(() => { if (run === introRun && guyOnDrawn) guyOnDrawn(); });
  return run;
}
function playNameAfterGuy(a, run) {
  a.goToAndStop(0, true);
  guyDrawn.then(() => {
    if (run !== introRun || !document.documentElement.classList.contains('intro-play')) return;
    a.goToAndPlay(0, true);
    // запасной выход, если complete не придёт: длина имени + запас
    clearTimeout(introT);
    introT = setTimeout(endIntro, a.getDuration() * 1000 + 1500);
  });
}

function endIntro() {
  const root = document.documentElement;
  showGuy();
  if (root.classList.contains('intro-play') && roleRestart) roleRestart();
  if (!root.classList.contains('intro-play')) return;
  root.classList.add('intro-reveal');
  root.classList.remove('intro-play');
  setTimeout(() => root.classList.remove('intro-reveal'), 2000);
}

function mountNameAnim(p) {
  if (nameAnims) nameAnims.forEach(a => a.destroy());
  nameAnims = null;
  if (!p) { endIntro(); return; }
  // страховка: что бы ни случилось с загрузкой, страница не останется пустой
  // При первом открытии (пустой кэш) библиотека и файлы имени грузятся
  // долго; запас — 7 с. Если страховка всё же сработала, страница уже
  // показана, и догрузившееся имя не проигрывается заново, а сразу встаёт
  // в последний кадр (см. DOMLoaded ниже).
  const safety = setTimeout(endIntro, 7000);
  loadLottieLib().then(lottie => {
    if (!p.isConnected) return;
    const anims = [];
    let ready = 0;
    p.querySelectorAll('.pd-name-anim').forEach(box => {
      const lang = box.dataset.name;
      const [x, y, w, h] = NAME_CROP[lang];
      box.style.width = (w * NAME_SCALE).toFixed(1) + 'px';
      box.style.height = (h * NAME_SCALE).toFixed(1) + 'px';
      const a = lottie.loadAnimation({
        container: box, renderer: 'svg', loop: false, autoplay: false,
        path: `assets/lottie/name-${lang}.json`
      });
      a.lang = lang;
      a.addEventListener('DOMLoaded', () => {
        const svg = box.querySelector('svg');
        svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        if (++ready < 2) return;
        p.classList.add('has-anim');
        centerIntro();
        // загрузилось — дальше заставку закрывает конец прорисовки имени
        clearTimeout(safety);
        // заставка ещё идёт? (проверяем сейчас, а не при запуске)
        const intro = document.documentElement.classList.contains('intro-play');
        anims.forEach(b => {
          // на заставке имя на текущем языке прописывается, когда дорисован
          // чувачок; второе сразу стоит целиком
          if (intro && b.lang === currentLang) playNameAfterGuy(b, introRun);
          else b.goToAndStop(b.totalFrames - 1, true);
        });
      });
      a.addEventListener('complete', () => {
        if (a.lang !== currentLang) return;
        clearTimeout(safety);
        endIntro();
      });
      a.addEventListener('data_failed', () => { clearTimeout(safety); endIntro(); });
      anims.push(a);
    });
    nameAnims = anims;
  }).catch(() => { clearTimeout(safety); endIntro(); });
}

// Заставка заново: всё прячется, чувачок рисуется, за ним прописывается
// имя на текущем языке, затем остальное проявляется, как при первом открытии. Работает, только
// пока на панели пустая главная с именем.
function startIntro() {
  const root = document.documentElement;
  root.classList.remove('intro-reveal');
  root.classList.add('intro-play');
}
function replayIntro() {
  const p = document.querySelector('.pd-intro-text.has-anim');
  if (!nameAnims || !p || !p.isConnected) return;
  startIntro();
  const run = drawGuyFirst();
  nameAnims.forEach(a => {
    if (a.lang === currentLang) playNameAfterGuy(a, run);
    else a.goToAndStop(a.totalFrames - 1, true);
  });
  (clearTimeout(introT), introT = setTimeout(endIntro, 8000));  // запасной выход, если имя не доиграет
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

// ─── Ссылки на проекты ───
// У каждого кейса свой адрес: sashamind.com/coffee-cult/. Слаг совпадает с
// папкой кейса. Сервер статический, поэтому под каждый адрес лежит готовая
// страница <слаг>/index.html — копия главной со своими заголовком и
// описанием для поисковиков (собирает _tools/build-case-pages.mjs).
// Старые ссылки вида #/coffee-cult тоже открываются и переписываются в новый вид.
const SITE_TITLE = 'Sasha Mindrin — Identity & Motion Designer';
// корень сайта: на страницах кейсов задан <base href="/">, на главной — её папка
const SITE_ROOT = new URL('./', document.baseURI).pathname;

function slugFromLocation() {
  const path = location.pathname.startsWith(SITE_ROOT) ? location.pathname.slice(SITE_ROOT.length) : '';
  let raw = path.replace(/(^|\/)index\.html$/, '').replace(/\/+$/, '');
  if (!raw) raw = (location.hash || '').replace(/^#\/?/, '').replace(/\/+$/, '');
  try { raw = decodeURIComponent(raw); } catch (_) { /* битый percent-encoding */ }
  return raw.trim().toLowerCase();
}

function projectFromLocation() {
  const slug = slugFromLocation();
  if (!slug) return null;
  return projectsData.find(p => p.folder === slug) || null;
}

function projectUrl(project) {
  return project ? `${SITE_ROOT}${project.folder}/` : SITE_ROOT;
}

// pushState/replaceState: они не перезагружают страницу и не вызывают
// popstate, так что собственный переход не приводит к повторной отрисовке.
function writeUrl(project, replace) {
  const target = projectUrl(project);
  if (location.pathname === target && !location.hash) return;
  const url = target + location.search;
  if (replace) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
}

function updateTitle() {
  const project = projectsData.find(p => p.id === activeProjectId);
  const name = project ? (currentLang === 'en' ? project.titleEn : project.titleRu) : null;
  document.title = name ? `${name} — Sasha Mindrin` : SITE_TITLE;
}

// Адрес изменился снаружи: кнопка «назад», вставленная ссылка, правка строки.
function syncFromLocation() {
  const project = projectFromLocation();
  if (project) {
    if (project.id !== activeProjectId) renderProject(project.id, { updateUrl: false });
    if (location.hash) writeUrl(project, true); // старая ссылка с # — к новому виду
  } else if (activeProjectId !== null) {
    renderEmpty();
  }
}

window.addEventListener('popstate', syncFromLocation);
window.addEventListener('hashchange', syncFromLocation);

// ─── Загрузка проекта ───
// Разметка индикатора одна на оба вида кейсов: инлайновый показывает его
// в теле панели, iframe-кейс — поверх всей панели.
function loadingMarkup(lang) {
  const ru = 'проект загружается', en = 'loading project';
  return `
    <div class="pf-loading">
      <svg class="pf-spinner" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="0.75" opacity="0.18"/>
        <circle class="pf-spinner-arc" cx="20" cy="20" r="18" stroke="currentColor"
                stroke-width="0.75" stroke-linecap="round"/>
      </svg>
      <span data-en="${en}" data-ru="${ru}">${lang === 'en' ? en : ru}</span>
    </div>
  `;
}

// Ждём картинки, которые грузятся сразу; lazy подтянутся при скролле и
// держать ради них индикатор незачем. Таймаут — чтобы одна застрявшая
// картинка не оставила кейс под заглушкой навсегда.
function waitForEagerImages(root, timeout = 8000) {
  const imgs = Array.from(root.querySelectorAll('img'))
    .filter(img => img.loading !== 'lazy');
  if (!imgs.length) return Promise.resolve();
  const settled = imgs.map(img =>
    img.complete && img.naturalWidth
      ? Promise.resolve()
      : new Promise(res => {
          img.addEventListener('load', res, { once: true });
          img.addEventListener('error', res, { once: true });
        })
  );
  return Promise.race([
    Promise.all(settled),
    new Promise(res => setTimeout(res, timeout)),
  ]);
}

async function renderProject(id, { updateUrl = true, replaceUrl = false } = {}) {
  endIntro(); // кейс открыли во время заставки — показываем всё сразу
  const project = projectsData.find(p => p.id === id);
  if (!project) return;
  activeProjectId = id;
  if (caseExpand) caseExpand.hidden = false;
  if (updateUrl) writeUrl(project, replaceUrl);
  updateTitle();
  stopPulse();
  if (scrollFxCleanup) { scrollFxCleanup(); scrollFxCleanup = null; }
  if (guyCleanup) { guyCleanup(); guyCleanup = null; }
  dropIframeNav(); // окно прошлого кейса выгружается вместе с iframe
  showNav(); // при выборе проекта навигация остаётся показанной

  document.querySelectorAll('.card[data-id]').forEach(c => {
    c.classList.toggle('active', c.dataset.id === id);
  });

  const panel = document.getElementById('panelDetail');
  if (!panel) return;
  panel.classList.remove('panel-iframe');
  panel.style.minHeight = '';

  // Пока кейс грузится — только индикатор. Название и описание из
  // projectsData не показываем заранее: у кейсов в iframe своя шапка, и
  // промелькнувшая «заглушка» перед ними только сбивала с толку.
  panel.innerHTML = loadingMarkup(currentLang);
  panel.scrollTop = 0;
  // Lottie прошлого кейса (у перенесённых из Тильды их много, часть по
  // кругу) продолжали бы крутиться в памяти — гасим те, чьё место исчезло
  if (window.lottie && lottie.getRegisteredAnimations) {
    lottie.getRegisteredAnimations().forEach(a => { if (a.wrapper && !a.wrapper.isConnected) a.destroy(); });
  }

  try {
    // no-cache: браузер обязан перепроверить свежесть у сервера, иначе
    // GitHub Pages/браузер могут отдавать старую версию страницы проекта.
    const res = await fetch(`projects/${project.folder}.html`, { cache: 'no-cache' });
    if (!res.ok) throw new Error();
    const html = (await res.text()).trim();

    // Пока грузились, могли переключиться на другой кейс — не затираем его.
    if (activeProjectId !== id) return;

    if (html.startsWith('<iframe')) {
      // Страница проекта несёт собственную шапку (pf-header) с названием,
      // годом и описанием — панель её не дублирует.
      panel.classList.add('panel-iframe');
      panel.innerHTML = html;
      fitCaseIframe();

      // Панель отдана странице целиком, поэтому индикатор кладём поверх неё
      // и снимаем, когда iframe отрапортует load: до этого там пустота.
      const overlay = document.createElement('div');
      overlay.className = 'pf-loading-overlay';
      overlay.innerHTML = loadingMarkup(currentLang);
      panel.appendChild(overlay);

      const hide = () => {
        overlay.classList.add('is-done');
        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
      };
      const guard = setTimeout(hide, 15000); // страница не ответила — не держим заглушку

      const iframe = panel.querySelector('iframe');
      if (iframe) {
        iframe.addEventListener('load', () => {
          clearTimeout(guard);
          hookIframeNav(iframe);
          hide();
        });
      } else {
        clearTimeout(guard);
        hide();
      }
    } else {
      // Собираем фрагмент вне документа и ждём его первые картинки: иначе
      // индикатор пропадал бы на пустом месте, до появления содержимого.
      const holder = document.createElement('div');
      holder.innerHTML = html;
      // <lottie-player> считает src от адреса страницы, а не от <base>, —
      // на /puppai/ искал бы /puppai/shh-creative/…; даём ему полный адрес
      holder.querySelectorAll('lottie-player[src]').forEach(el => {
        el.setAttribute('src', new URL(el.getAttribute('src'), document.baseURI).href);
      });
      await waitForEagerImages(holder);
      if (activeProjectId !== id) return;

      // шапка из projectsData и содержимое кейса появляются вместе
      panel.innerHTML = projectHeaderMarkup(project, currentLang);
      const body = document.getElementById('projectBody');
      while (holder.firstChild) body.appendChild(holder.firstChild);
      applyLangSections(body, currentLang);
      await runCaseScripts(body);
      if (activeProjectId !== id) return;
      // кейсы, перенесённые из Тильды, несут свои анимации — их ведёт assets/tz.js
      const fxOff = initScrollFx(body);
      const tzOff = window.tzMount ? window.tzMount(body) : null;
      scrollFxCleanup = (fxOff || tzOff) ? () => { if (fxOff) fxOff(); if (tzOff) tzOff(); } : null;
    }
  } catch {
    // кейс не загрузился — хотя бы название и описание, а не пустая панель
    if (activeProjectId !== id) return;
    panel.innerHTML = projectHeaderMarkup(project, currentLang);
  }
}

// Скрипты, вставленные через innerHTML, браузер не выполняет. Кейсы,
// перенесённые из Тильды, несут свои (Lottie, интерактив), поэтому
// пересоздаём их по порядку: внешний ждём до загрузки — следующие на него
// опираются.
async function runCaseScripts(root) {
  for (const old of Array.from(root.querySelectorAll('script'))) {
    // пока ждали внешний скрипт, кейс могли сменить: тогда остальные не
    // запускаем — иначе они отработали бы второй раз на разметке нового
    // кейса (скрипты ищут элементы по id во всём документе)
    if (!root.isConnected) return;
    const s = document.createElement('script');
    for (const a of old.attributes) s.setAttribute(a.name, a.value);
    if (old.src) {
      // ждём сколько нужно: следующие скрипты без него упадут; потолок —
      // только на случай, если запрос повиснет совсем
      await new Promise(res => {
        s.onload = s.onerror = res;
        setTimeout(res, 30000);
        old.replaceWith(s);
      });
    } else {
      // в блоке: const/let верхнего уровня не столкнутся с прошлым запуском,
      // когда кейс открывают второй раз
      s.textContent = `{\n${old.textContent}\n}`;
      old.replaceWith(s);
    }
  }
}

// Шапка встроенного кейса: название, год, описание и пустое тело, куда
// кладётся сам кейс. У кейсов в iframe шапка своя, внутри страницы.
function projectHeaderMarkup(project, t) {
  return `
    <div class="project-detail">
      <div class="pd-header">
        <h1 class="pd-title" data-en="${project.titleEn}" data-ru="${project.titleRu}">
          ${t === 'en' ? project.titleEn : project.titleRu}
        </h1>
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
      <div class="pd-body" id="projectBody"></div>
    </div>
  `;
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
  card.addEventListener('click', e => {
    // карточка — ссылка на страницу кейса: с Cmd/Ctrl/Shift пусть открывается
    // в новой вкладке, обычный клик — переход без перезагрузки
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    renderProject(card.dataset.id);
    scrollToCard(card);
  });
  card.addEventListener('mouseenter', () => {
    stopPulse(); // мышь дошла до списка — подсказка больше не нужна
    card.classList.add('hovered');
  });
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


// ─── Подсказка «сюда можно нажать» ───
// Пока проект не выбран и мышь ещё не заходила в список, плитки слева
// вразнобой дышат яркостью. Первое же наведение (или открытый кейс)
// подсказку снимает — навсегда, повторять её уже незачем.
let pulseStopped = false;

function startPulse() {
  if (pulseStopped) return;
  const grid = document.querySelector('.cards-grid');
  if (!grid) return;
  allCards.forEach(card => {
    if (card.style.getPropertyValue('--pulse-dur')) return;
    // у каждой плитки свой период и отрицательная задержка: цикл
    // начинается с середины, поэтому сетка не дышит в такт
    card.style.setProperty('--pulse-dur', (3.4 + Math.random() * 3.8).toFixed(2) + 's');
    card.style.setProperty('--pulse-delay', (-Math.random() * 7).toFixed(2) + 's');
  });
  grid.classList.add('pulsing');
}

function stopPulse() {
  pulseStopped = true;
  const grid = document.querySelector('.cards-grid');
  if (grid) grid.classList.remove('pulsing');
}


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
    // подмена кейса — побочный эффект фильтра, а не переход: не копим историю
    renderProject(firstVisible.dataset.id, { replaceUrl: true });
  }
}

// теги, под которые не осталось ни одного показанного кейса, убираем вместе
// с точкой-разделителем перед ними
document.querySelectorAll('.tag-btn:not([data-tag="all"])').forEach(btn => {
  if (projectsData.some(p => !p.hidden && p.tags.includes(btn.dataset.tag))) return;
  const sep = btn.previousElementSibling;
  if (sep && sep.classList.contains('tag-sep')) sep.remove();
  btn.remove();
});

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

// ─── Подгонка кейса-iframe под ширину поля ───
// Страницы кейсов собраны в Tilda, и рабочие у них только две вёрстки:
// десктопная (сетка 1200) и мобильная (до 480). Промежуточные Tilda-вёрстки
// недоделаны — на ноутбуке, где поле кейса ~1000 px, текст вылезал, а блоки
// обрезались. Поэтому промежуточные ширины не отдаём Tilda: страница
// рисуется в рабочей ширине и пропорционально масштабируется под поле —
//   уже 480 — как есть (мобильная);  480–800 — мобильная 479 px, крупнее;
//   800–1200 — десктопная 1200 px, мельче;  1200 и шире — как есть.
function fitCaseIframe() {
  const panel = document.getElementById('panelDetail');
  const ifr = panel && panel.classList.contains('panel-iframe') && panel.querySelector('iframe.project-iframe');
  if (!ifr) return;
  ifr.style.cssText = '';                                  // сначала — естественный размер
  const r = ifr.getBoundingClientRect(), w = r.width, h = r.height;
  let base = 0;
  if (w >= 480 && w < 800) base = 479;
  else if (w >= 800 && w < 1200) base = 1200;
  if (!base || !w || !h) return;
  const k = w / base;
  ifr.style.cssText = `position:absolute;left:0;top:0;width:${base}px;height:${(h / k).toFixed(1)}px;` +
    `transform:scale(${k.toFixed(5)});transform-origin:0 0;`;
  if (getComputedStyle(panel).position === 'static') panel.style.position = 'relative';
  // на телефонной раскладке панель в потоке: держим ей высоту, раз iframe вынут
  panel.style.minHeight = h + 'px';
}
if ('ResizeObserver' in window) {
  const pd = document.getElementById('panelDetail');
  let fitT = 0;
  if (pd) new ResizeObserver(() => { cancelAnimationFrame(fitT); fitT = requestAnimationFrame(fitCaseIframe); }).observe(pd);
}
window.addEventListener('resize', () => requestAnimationFrame(fitCaseIframe));

// прошлый кейс выгружен — его окно больше не читаем, иначе мёртвый источник
// висит в navAllAtTop()
function dropIframeNav() {
  for (let i = navSources.length - 1; i >= 0; i--) {
    if (navSources[i].kind === 'iframe') navSources.splice(i, 1);
  }
}

// ─── Кейс на весь экран ───
// Шапка, теги, список слева и подвал убираются — кейс занимает окно
// целиком, как если открыть его страницу отдельным адресом.
const caseExpand = document.getElementById('caseExpand');

function setCaseFull(on) {
  document.body.classList.toggle('case-full', on);
  if (!caseExpand) return;
  // подпись двуязычная и меняется вместе с состоянием, поэтому правим
  // сами data-атрибуты — applyLang потом читает их как у всех остальных
  caseExpand.dataset.en = on ? 'close' : 'expand';
  caseExpand.dataset.ru = on ? 'свернуть' : 'развернуть';
  caseExpand.textContent = currentLang === 'en' ? caseExpand.dataset.en : caseExpand.dataset.ru;
}

if (caseExpand) {
  caseExpand.addEventListener('click', () => {
    setCaseFull(!document.body.classList.contains('case-full'));
    caseExpand.blur();
  });
}

// Esc работает, пока фокус не внутри iframe — поэтому кнопка видна и в
// развёрнутом состоянии: из него всегда есть выход мышью
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.body.classList.contains('case-full')) setCaseFull(false);
});

// сузили окно до мобильного, а кейс развёрнут — кнопка выхода там скрыта,
// поэтому снимаем режим сами, иначе из него не выбраться
window.addEventListener('resize', () => {
  if (window.innerWidth <= 768 && document.body.classList.contains('case-full')) setCaseFull(false);
});


const siteHome = document.getElementById('siteHome');
if (siteHome) {
  siteHome.addEventListener('click', e => {
    // мы уже на главной — не перезагружаем её, а просто снимаем кейс
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    setCaseFull(false);
    history.pushState(null, '', SITE_ROOT + location.search);
    startIntro();  // имя прописывается заново, остальное — следом
    renderEmpty();
    applyLang(currentLang);
  });
}


// ─── Init ───
// Пришли по ссылке на кейс — открываем его. Адрес уже верный и трогать
// его не нужно, иначе в историю попадёт лишняя запись.
const initialProject = projectFromLocation();
if (initialProject) {
  endIntro();
  // старая ссылка с # — подменяем адрес на новый, без лишней записи в истории
  renderProject(initialProject.id, { updateUrl: !!location.hash, replaceUrl: true });
  const card = document.querySelector(`.card[data-id="${initialProject.id}"]`);
  if (card) scrollToCard(card); // на мобильном лента карточек длиннее экрана
} else {
  renderEmpty();
}
applyLang(currentLang);
