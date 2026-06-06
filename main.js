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

  document.querySelectorAll('[data-en]').forEach(el => {
    const text = lang === 'en' ? el.dataset.en : el.dataset.ru;
    if (!text) return;
    if (text.includes('<')) {
      el.innerHTML = text;
    } else {
      el.textContent = text;
    }
  });

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
  { id: 'project-1',  folder: 'ba',               color: '#c0392b', titleEn: 'Ba',                titleRu: 'Ба',                    year: '2026', tags: ['logos', 'branding'],               descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-2',  folder: 'tula-marathon',    color: '#e67e22', titleEn: 'Tula Marathon',     titleRu: 'Тульский марафон',      year: '2026', tags: ['logos', 'motion'],                 descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-3',  folder: 'tula-running-club',color: '#f1c40f', titleEn: 'Tula Running Club', titleRu: 'Тульский беговой клуб', year: '2025', tags: ['logos', 'branding', 'illustration'],descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-21', folder: 'puppai',            color: '#7c5cbf', titleEn: 'PuppAI',            titleRu: 'PuppAI',                year: '2026', tags: ['logos', 'web', 'interactive'],     descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-4',  folder: 'punk-delicious',   color: '#e91e8c', titleEn: 'Punk Delicious',    titleRu: 'Панк делишс',           year: '2025', tags: ['logos', 'branding'],               descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
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

function renderProject(id) {
  const project = projectsData.find(p => p.id === id);
  if (!project) return;
  activeProjectId = id;

  document.querySelectorAll('.card[data-id]').forEach(c => {
    c.classList.toggle('active', c.dataset.id === id);
  });

  const panel = document.getElementById('panelDetail');
  if (!panel) return;

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
        <p data-en="${project.descEn}" data-ru="${project.descRu}">
          ${t === 'en' ? project.descEn : project.descRu}
        </p>
      </div>
      <div class="pd-gallery">
        <div class="pd-img"></div>
        <div class="pd-row">
          <div class="pd-img"></div>
          <div class="pd-img"></div>
        </div>
        <div class="pd-img pd-img--tall"></div>
      </div>
    </div>
  `;

  panel.scrollTop = 0;
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


// ─── Init ───
applyLang(currentLang);
renderProject(projectsData[0].id);
