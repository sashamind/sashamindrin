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

  if (activePostId) renderPost(activePostId);
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


// ─── Posts data ───
const postsData = [
  {
    id: 'post-1',
    titleEn: 'Identity is not a logo',
    titleRu: 'Айдентика — это не логотип',
    year: '2026',
    tags: ['branding', 'theory'],
    descEn: 'On the difference between a mark and a system.',
    descRu: 'О разнице между знаком и системой.',
    bodyEn: `<p>A logo is a signature — a single mark that names. Identity is the system around it: the typeface, the palette, the rhythm of a layout, the weight of a stroke. These elements create recognition before a logo is even seen.</p><p>The best identity systems are built on constraints. One typeface. Two colours. A fixed set of proportions. Constraints force consistency, and consistency builds recognition over time.</p><p>A logo can change and the brand survives — if the system holds.</p>`,
    bodyRu: `<p>Логотип — это подпись, один знак, который называет. Айдентика — это система вокруг него: шрифт, палитра, ритм вёрстки, вес штриха. Эти элементы создают узнаваемость ещё до того, как логотип виден.</p><p>Лучшие айдентики строятся на ограничениях. Один шрифт. Два цвета. Фиксированный набор пропорций. Ограничения вынуждают к последовательности, а последовательность формирует узнаваемость.</p><p>Логотип может измениться — и бренд выживет, если система держится.</p>`,
  },
  {
    id: 'post-2',
    titleEn: 'Typography is voice',
    titleRu: 'Типографика — это голос',
    year: '2026',
    tags: ['typography', 'theory'],
    descEn: 'How type carries tone before words are read.',
    descRu: 'Как шрифт передаёт интонацию прежде, чем слова прочитаны.',
    bodyEn: `<p>Type carries tone. Before a reader processes the words, they feel the weight, the rhythm, the spacing. A condensed sans in tight tracking reads as urgent. A wide serif with generous leading reads as considered, even slow.</p><p>Choosing a typeface is choosing a register. It is the first editorial decision in any design system, and it shapes everything that follows.</p><p>The mistake is treating typography as decoration — something applied after the real decisions are made. Typography is the first decision.</p>`,
    bodyRu: `<p>Шрифт несёт интонацию. Прежде чем читатель осмыслит слова, он чувствует вес, ритм, интерлиньяж. Узкий гротеск с плотным кёрнингом читается как срочность. Широкая антиква с воздушным интерлиньяжем — как обдуманность, даже медлительность.</p><p>Выбор шрифта — это выбор регистра. Это первое редакционное решение в любой дизайн-системе, и оно определяет всё, что следует за ним.</p><p>Ошибка — воспринимать типографику как украшение, нечто применяемое после принятия настоящих решений. Типографика и есть первое решение.</p>`,
  },
  {
    id: 'post-3',
    titleEn: 'Why colour is a decision',
    titleRu: 'Почему цвет — это решение',
    year: '2025',
    tags: ['branding', 'colour'],
    descEn: 'Against borrowed palettes and trend-chasing.',
    descRu: 'Против заимствованных палитр и погони за трендами.',
    bodyEn: `<p>Colour is rarely chosen — it is usually borrowed. From a trend, from a competitor, from what feels safe. This produces brands that look contemporary for eighteen months and dated for the next ten years.</p><p>A colour decision should be grounded in the brand's territory, not in current taste. What materials does this brand work with? What light does it live in? What mood does it need to project over a decade?</p><p>The strongest brand colours often feel wrong at first. They require conviction to defend.</p>`,
    bodyRu: `<p>Цвет редко выбирают — его обычно заимствуют. У тренда, у конкурента, у того, что кажется безопасным. Это создаёт бренды, которые выглядят современно полтора года и устаревшими следующие десять.</p><p>Решение о цвете должно опираться на территорию бренда, а не на текущий вкус. С какими материалами работает этот бренд? В каком свете он существует? Какое настроение ему нужно проецировать на протяжении десятилетия?</p><p>Самые сильные цвета бренда часто поначалу кажутся неправильными. Их нужно уметь отстоять.</p>`,
  },
  {
    id: 'post-4',
    titleEn: 'The grid',
    titleRu: 'Сетка',
    year: '2025',
    tags: ['typography', 'theory'],
    descEn: 'What a grid actually does — and what it rules out.',
    descRu: 'Что сетка на самом деле делает — и что она исключает.',
    bodyEn: `<p>A grid is not decoration. It is a decision made in advance about where things can go. Its value is not in what it shows but in what it rules out.</p><p>A strict grid produces work that feels considered. A broken grid — where elements step outside the structure deliberately — produces tension. Both require the grid to exist first.</p><p>Without a grid, layout is not freedom. It is guessing dressed as intuition.</p>`,
    bodyRu: `<p>Сетка — не украшение. Это решение, принятое заранее, о том, где могут располагаться элементы. Её ценность не в том, что она показывает, а в том, что она исключает.</p><p>Строгая сетка создаёт работу, которая ощущается продуманной. Сломанная сетка — где элементы намеренно выходят за рамки — создаёт напряжение. Оба варианта требуют, чтобы сетка сначала существовала.</p><p>Без сетки вёрстка — не свобода. Это угадывание, одетое в интуицию.</p>`,
  },
  {
    id: 'post-5',
    titleEn: 'Motion as part of the system',
    titleRu: 'Моушн как часть системы',
    year: '2024',
    tags: ['motion', 'branding'],
    descEn: 'When animation is a brand element, not a decoration.',
    descRu: 'Когда анимация — это элемент бренда, а не украшение.',
    bodyEn: `<p>Animation became a brand element the moment interfaces became capable of it. But most motion in branding is decorative — it draws attention to itself rather than communicating something.</p><p>Motion should behave like any other brand element: consistently, with purpose. The easing of a transition, the timing of a reveal, the direction of movement — these carry personality the way colour or weight does.</p><p>A brand that moves arbitrarily is a brand without a voice in time.</p>`,
    bodyRu: `<p>Анимация стала элементом бренда в тот момент, когда интерфейсы позволили её реализовать. Но большинство моушна в брендинге декоративно — он обращает внимание на себя, а не коммуницирует что-то.</p><p>Моушн должен вести себя как любой другой элемент бренда: последовательно и целенаправленно. Замедление перехода, тайминг появления, направление движения — всё это несёт характер так же, как цвет или вес штриха.</p><p>Бренд, который движется произвольно — это бренд без голоса во времени.</p>`,
  },
  {
    id: 'post-6',
    titleEn: 'How recognition works',
    titleRu: 'Как работает узнаваемость',
    year: '2024',
    tags: ['branding', 'theory'],
    descEn: 'Recognition is not memory. It is prediction.',
    descRu: 'Узнаваемость — это не память. Это предсказание.',
    bodyEn: `<p>Recognition is not memory. It is prediction. A familiar visual system tells the viewer what to expect before they read anything. That expectation — met consistently — becomes trust.</p><p>This is why the most successful brand systems are often the most constrained. Fewer variables mean more predictability. More predictability means faster recognition. Faster recognition means less cognitive load on the viewer.</p><p>Good design does not demand attention. It rewards it.</p>`,
    bodyRu: `<p>Узнаваемость — это не память. Это предсказание. Знакомая визуальная система говорит зрителю, чего ожидать, прежде чем он что-либо прочитал. Это ожидание — последовательно оправдываемое — становится доверием.</p><p>Вот почему самые успешные брендинговые системы часто самые ограниченные. Меньше переменных — больше предсказуемости. Больше предсказуемости — быстрее узнавание. Быстрее узнавание — меньше когнитивная нагрузка на зрителя.</p><p>Хороший дизайн не требует внимания. Он его вознаграждает.</p>`,
  },
];

let activePostId = null;

function renderPost(id) {
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
        <h2 class="pd-title">
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
        <p>${t === 'en' ? post.descEn : post.descRu}</p>
      </div>
      <div class="pd-body">
        ${t === 'en' ? post.bodyEn : post.bodyRu}
      </div>
    </div>
  `;

  panel.scrollTop = 0;
}


// ─── Tag filter ───
let activeTag = null;
const allItems = Array.from(document.querySelectorAll('.post-item[data-id]'));

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
  allItems.forEach(item => {
    const post = postsData.find(p => p.id === item.dataset.id);
    const visible = !activeTag || (post && post.tags.includes(activeTag));
    item.style.display = visible ? '' : 'none';
    if (visible && !firstVisible) firstVisible = item;
  });

  if (activeTag) {
    const activeItem = document.querySelector('.post-item.active');
    if (activeItem && activeItem.style.display === 'none' && firstVisible) {
      renderPost(firstVisible.dataset.id);
    }
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

allItems.forEach(item => {
  item.addEventListener('click', () => renderPost(item.dataset.id));
});


// ─── Init ───
applyLang(currentLang);
renderPost(postsData[0].id);
