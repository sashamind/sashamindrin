/* texts.js — Sasha Mindrin portfolio */

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

  const si = document.getElementById('searchInput');
  if (si) si.placeholder = lang === 'en' ? 'search...' : 'поиск...';

  const postBody = document.getElementById('postBody');
  if (postBody) applyLangSections(postBody, lang);
}

langToggle.addEventListener('click', () => {
  applyLang(currentLang === 'en' ? 'ru' : 'en');
});

function applyLangSections(container, lang) {
  container.querySelectorAll('.lang-en').forEach(el => el.style.display = lang === 'en' ? '' : 'none');
  container.querySelectorAll('.lang-ru').forEach(el => el.style.display = lang === 'ru' ? '' : 'none');
}


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


// ─── Posts data ───
const postsData = [
  {
    id: 'post-0',
    slug: 'two-sides-of-form-1',
    titleEn: 'On the two sides of form.',
    titleRu: 'О двух сторонах формы.',
    year: '2026',
    tags: ['theory'],
    descEn: 'A stone, talking heads, starships, and the problems that follow.',
    descRu: 'Камень, говорящие головы, звездолеты и возникающие проблемы.',
  },
  {
    id: 'post-1',
    slug: 'identity-not-logo',
    titleEn: 'Identity is not a logo',
    titleRu: 'Айдентика — это не логотип',
    year: '2026',
    tags: ['branding', 'theory'],
    descEn: 'On the difference between a mark and a system.',
    descRu: 'О разнице между знаком и системой.',
  },
  {
    id: 'post-2',
    slug: 'typography-is-voice',
    titleEn: 'Typography is voice',
    titleRu: 'Типографика — это голос',
    year: '2026',
    tags: ['typography', 'theory'],
    descEn: 'How type carries tone before words are read.',
    descRu: 'Как шрифт передаёт интонацию прежде, чем слова прочитаны.',
  },
  {
    id: 'post-3',
    slug: 'why-colour-is-a-decision',
    titleEn: 'Why colour is a decision',
    titleRu: 'Почему цвет — это решение',
    year: '2025',
    tags: ['branding', 'colour'],
    descEn: 'Against borrowed palettes and trend-chasing.',
    descRu: 'Против заимствованных палитр и погони за трендами.',
  },
  {
    id: 'post-4',
    slug: 'the-grid',
    titleEn: 'The grid',
    titleRu: 'Сетка',
    year: '2025',
    tags: ['typography', 'theory'],
    descEn: 'What a grid actually does — and what it rules out.',
    descRu: 'Что сетка на самом деле делает — и что она исключает.',
  },
  {
    id: 'post-5',
    slug: 'motion-as-part-of-the-system',
    titleEn: 'Motion as part of the system',
    titleRu: 'Моушн как часть системы',
    year: '2024',
    tags: ['motion', 'branding'],
    descEn: 'When animation is a brand element, not a decoration.',
    descRu: 'Когда анимация — это элемент бренда, а не украшение.',
  },
  {
    id: 'post-6',
    slug: 'how-recognition-works',
    titleEn: 'How recognition works',
    titleRu: 'Как работает узнаваемость',
    year: '2024',
    tags: ['branding', 'theory'],
    descEn: 'Recognition is not memory. It is prediction.',
    descRu: 'Узнаваемость — это не память. Это предсказание.',
  },
];

let activePostId = null;

async function renderPost(id) {
  const post = postsData.find(p => p.id === id);
  if (!post) return;
  activePostId = id;

  document.querySelectorAll('.post-item[data-id]').forEach(item => {
    item.classList.toggle('active', item.dataset.id === id);
  });

  const panel = document.getElementById('panelDetail');
  if (!panel) return;

  const t = currentLang;
  panel.innerHTML = `
    <div class="project-detail">
      <div class="pd-header">
        <div class="pd-header-top">
          <h2 class="pd-title" data-en="${post.titleEn}" data-ru="${post.titleRu}">
            ${t === 'en' ? post.titleEn : post.titleRu}
          </h2>
          <div class="pd-meta">
            <div class="pd-meta-item">
              <span class="pd-meta-key" data-en="year" data-ru="год">${t === 'en' ? 'year' : 'год'}</span>
              <span class="pd-meta-val">${post.year}</span>
            </div>
          </div>
        </div>
        <div class="pd-desc">
          <p data-en="${post.descEn}" data-ru="${post.descRu}">${t === 'en' ? post.descEn : post.descRu}</p>
        </div>
      </div>
      <div class="pd-body" id="postBody">
        <div class="post-loading">···</div>
      </div>
    </div>
  `;

  panel.scrollTop = 0;

  try {
    const res = await fetch(`posts/${post.slug}.html`);
    if (!res.ok) throw new Error();
    const html = await res.text();
    const body = document.getElementById('postBody');
    if (body) {
      body.innerHTML = html;
      applyLangSections(body, currentLang);
    }
  } catch {
    const body = document.getElementById('postBody');
    if (body) body.innerHTML = `<p class="post-empty">Content coming soon.</p>`;
  }
}


// ─── Tag filter + Search ───
let activeTag = null;
let currentSearch = '';
const allItems = Array.from(document.querySelectorAll('.post-item[data-id]'));

const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', () => {
    currentSearch = searchInput.value.toLowerCase().trim();
    applyFilter();
  });
}

function applyFilter() {
  let firstVisible = null;
  allItems.forEach(item => {
    const post = postsData.find(p => p.id === item.dataset.id);
    if (!post) { item.style.display = 'none'; return; }
    const title = (currentLang === 'en' ? post.titleEn : post.titleRu).toLowerCase();
    const matchesTag = !activeTag || post.tags.includes(activeTag);
    const matchesSearch = !currentSearch || title.includes(currentSearch);
    const visible = matchesTag && matchesSearch;
    item.style.display = visible ? '' : 'none';
    if (visible && !firstVisible) firstVisible = item;
  });

  const activeItem = document.querySelector('.post-item.active');
  if (firstVisible && (!activeItem || activeItem.style.display === 'none')) {
    renderPost(firstVisible.dataset.id);
  }
}

function filterByTag(tag) {
  activeTag = (tag === 'all' || activeTag === tag) ? null : tag;

  document.querySelectorAll('.tag-btn').forEach(btn => {
    if (btn.dataset.tag === 'all') {
      btn.classList.toggle('active', activeTag === null);
    } else {
      btn.classList.toggle('active', btn.dataset.tag === activeTag);
    }
  });

  applyFilter();
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

allItems.forEach(item => {
  item.addEventListener('click', () => renderPost(item.dataset.id));
});


// ─── Init ───
applyLang(currentLang);
renderPost(postsData[0].id);
