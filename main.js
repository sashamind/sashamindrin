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


// ─── Theme ───
const body = document.body;
const modeToggle = document.getElementById('modeToggle');
const modeIcon = document.getElementById('modeIcon');

function isDayTime() {
  const h = new Date().getHours();
  return h >= 7 && h < 20;
}

function applyTheme(dark) {
  if (dark) {
    body.classList.add('dark');
    body.classList.remove('light');
    modeIcon.textContent = '☀';
  } else {
    body.classList.add('light');
    body.classList.remove('dark');
    modeIcon.textContent = '☾';
  }
}

const savedTheme = localStorage.getItem('theme');
let manualOverride = savedTheme !== null;
let darkMode = savedTheme !== null ? savedTheme === 'dark' : !isDayTime();
applyTheme(darkMode);

modeToggle.addEventListener('click', () => {
  manualOverride = true;
  darkMode = !darkMode;
  localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  applyTheme(darkMode);
});

setInterval(() => {
  if (!manualOverride) {
    const shouldBeDark = !isDayTime();
    if (shouldBeDark !== darkMode) {
      darkMode = shouldBeDark;
      applyTheme(darkMode);
    }
  }
}, 60000);


// ─── Scroll: transparent header ───
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 0);
});


// ─── Init ───
applyLang(currentLang);
