/* main.js — Sasha Mindrin portfolio */

// ─── Language ───
let currentLang = localStorage.getItem('lang') || 'en';
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


// ─── Scroll: transparent header ───
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 0);
});


// ─── Projects ───
const projectsData = [
  { id: 'project-1',  folder: 'ba',                color: '#c0392b', titleEn: 'Ba',               titleRu: 'Ба',                     year: '2024', type: 'identity',     descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-2',  folder: 'tula-marathon',     color: '#e67e22', titleEn: 'Tula Marathon',    titleRu: 'Тульский марафон',       year: '2024', type: 'motion',       descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-3',  folder: 'tula-running-club', color: '#f1c40f', titleEn: 'Tula Running Club',titleRu: 'Тульский беговой клуб', year: '2023', type: 'branding',     descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-4',  folder: 'punk-delicious',    color: '#e91e8c', titleEn: 'Punk Delicious',   titleRu: 'Панк делишс',           year: '2023', type: 'identity',     descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-5',  folder: 'coffee-cult',       color: '#a0522d', titleEn: 'Coffee Cult',      titleRu: 'Кофе культ',            year: '2023', type: 'illustration', descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-6',  folder: 'nitka',             color: '#1abc9c', titleEn: 'Nitka',            titleRu: 'Нитка',                 year: '2022', type: 'motion',       descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-7',  folder: 'volna',             color: '#3498db', titleEn: 'Volna',            titleRu: 'Волна',                 year: '2022', type: 'branding',     descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-8',  folder: 'tula-region',       color: '#2c3e8c', titleEn: 'Tula Region',      titleRu: 'Тульский регион',       year: '2021', type: 'identity',     descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-9',  folder: 'rassvet',           color: '#e8a87c', titleEn: 'Rassvet',          titleRu: 'Рассвет',               year: '2021', type: 'illustration', descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-10', folder: 'azaza',             color: '#9b59b6', titleEn: 'Azaza',            titleRu: 'Азаза',                 year: '2021', type: 'identity',     descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-11', folder: 'zernovaya',         color: '#8fbc45', titleEn: 'Zernovaya',        titleRu: 'Зерновая',              year: '2021', type: 'branding',     descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-12', folder: 'soyuz',             color: '#c0392b', titleEn: 'Soyuz',            titleRu: 'Союз',                  year: '2020', type: 'motion',       descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-13', folder: 'project-13',        color: '#16a085', titleEn: 'Project 13',       titleRu: 'Проект 13',             year: '2020', type: 'identity',     descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-14', folder: 'project-14',        color: '#d35400', titleEn: 'Project 14',       titleRu: 'Проект 14',             year: '2020', type: 'motion',       descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-15', folder: 'project-15',        color: '#27ae60', titleEn: 'Project 15',       titleRu: 'Проект 15',             year: '2020', type: 'illustration', descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-16', folder: 'project-16',        color: '#8e44ad', titleEn: 'Project 16',       titleRu: 'Проект 16',             year: '2019', type: 'branding',     descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-17', folder: 'project-17',        color: '#2980b9', titleEn: 'Project 17',       titleRu: 'Проект 17',             year: '2019', type: 'identity',     descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
  { id: 'project-18', folder: 'project-18',        color: '#e74c3c', titleEn: 'Project 18',       titleRu: 'Проект 18',             year: '2019', type: 'motion',       descEn: 'Description will appear here.', descRu: 'Описание появится здесь.' },
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
          <div class="pd-meta-item">
            <span class="pd-meta-key" data-en="type" data-ru="тип">${t === 'en' ? 'type' : 'тип'}</span>
            <span class="pd-meta-val">${project.type}</span>
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

document.querySelectorAll('.card[data-id]').forEach(card => {
  card.addEventListener('click', () => renderProject(card.dataset.id));
  card.addEventListener('mouseenter', () => card.classList.add('hovered'));
  card.addEventListener('mouseleave', () => card.classList.remove('hovered'));

  const id = card.dataset.id;
  const project = projectsData.find(p => p.id === id);
  if (!project) return;

  card.style.setProperty('--card-color', project.color);

  const inner = card.querySelector('.card-inner');
  const base = `assets/projects/${project.folder}/thumb`;

  tryLoad(`${base}.png`)
    .catch(() => tryLoad(`${base}.svg`))
    .then(img => {
      img.className = 'card-thumb';
      inner.appendChild(img);
      const icon = inner.querySelector('.card-icon');
      if (icon) icon.style.display = 'none';
    })
    .catch(() => {});
});


// ─── Init ───
applyLang(currentLang);
renderProject(projectsData[0].id);
