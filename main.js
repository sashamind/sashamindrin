/* main.js — Sasha Mindrin portfolio */

// ─── Theme: auto by time of day ───
const body = document.body;
const modeToggle = document.getElementById('modeToggle');
const modeIcon = document.getElementById('modeIcon');
const modeLabel = document.getElementById('modeLabel');

function isDayTime() {
  const h = new Date().getHours();
  return h >= 7 && h < 20;
}

function applyTheme(dark) {
  if (dark) {
    body.classList.add('dark');
    body.classList.remove('light');
    modeIcon.textContent = '☀';
    if (modeLabel) modeLabel.textContent = currentLang === 'en' ? 'night mode' : 'ночной режим';
  } else {
    body.classList.add('light');
    body.classList.remove('dark');
    modeIcon.textContent = '☾';
    if (modeLabel) modeLabel.textContent = currentLang === 'en' ? 'day mode' : 'дневной режим';
  }
}

let manualOverride = false;
let darkMode = !isDayTime();
applyTheme(darkMode);

modeToggle.addEventListener('click', () => {
  manualOverride = true;
  darkMode = !darkMode;
  applyTheme(darkMode);
});

// Update theme every minute in case of auto switch
setInterval(() => {
  if (!manualOverride) {
    const shouldBeDark = !isDayTime();
    if (shouldBeDark !== darkMode) {
      darkMode = shouldBeDark;
      applyTheme(darkMode);
    }
  }
}, 60000);


// ─── Language toggle ───
let currentLang = 'en';
const langToggle = document.getElementById('langToggle');

function applyLang(lang) {
  currentLang = lang;
  langToggle.textContent = lang === 'en' ? 'RU' : 'EN';
  document.documentElement.lang = lang;

  // Translate all elements with data-en / data-ru
  document.querySelectorAll('[data-en]').forEach(el => {
    const text = lang === 'en' ? el.dataset.en : el.dataset.ru;
    if (!text) return;
    // Use innerHTML to support <br> tags
    if (text.includes('<')) {
      el.innerHTML = text;
    } else {
      el.textContent = text;
    }
  });

  // Update mode label text
  applyTheme(darkMode);
}

langToggle.addEventListener('click', () => {
  applyLang(currentLang === 'en' ? 'ru' : 'en');
});