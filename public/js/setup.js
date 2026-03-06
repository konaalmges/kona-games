// KONA GAMES – Setup
const MAX = 6;
let allCats = [], selected = [], activeFilter = 'all';

const filterMap = {
  sports:    ['sports','football','saudi-football','champions-league','players'],
  knowledge: ['geography','science','history','culture','nature'],
  fun:       ['movies','music','gaming','art'],
  religion:  ['religion'],
  food:      ['food'],
};

async function init() {
  const r = await fetch('/api/categories');
  allCats = await r.json();
  renderCats();
  renderPreview();
}

function setFilter(f, el) {
  activeFilter = f;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('search').value = '';
  renderCats();
}

function renderCats() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  let list = allCats.filter(c => {
    const mq = !q || c.name.includes(q) || c.id.includes(q);
    const mf = activeFilter === 'all' || (filterMap[activeFilter] || []).includes(c.id);
    return mq && mf;
  });
  document.getElementById('sect-label').textContent = `${list.length} فئة متاحة`;
  document.getElementById('cats-grid').innerHTML = list.map(c => {
    const sel = !!selected.find(s => s.id === c.id);
    const off = !sel && selected.length >= MAX;
    return `<div class="cat-card${sel?' selected':''}${off?' disabled':''}" onclick="toggleCat('${c.id}')">
      <div class="cat-check">✓</div>
      <div class="cat-img">${c.emoji}</div>
      <div class="cat-name">${c.name}</div>
    </div>`;
  }).join('');
}

function toggleCat(id) {
  const cat = allCats.find(c => c.id === id);
  const idx = selected.findIndex(c => c.id === id);
  if (idx >= 0) selected.splice(idx, 1);
  else {
    if (selected.length >= MAX) { showToast('اختر 6 فئات فقط 🎯', 'err'); return; }
    selected.push(cat);
  }
  renderCats(); renderPreview(); updateBtn();
}

function removeSelected(id) {
  selected = selected.filter(c => c.id !== id);
  renderCats(); renderPreview(); updateBtn();
}

function renderPreview() {
  const pill = document.getElementById('count-pill');
  pill.textContent = `${selected.length} / ${MAX}`;
  pill.classList.toggle('full', selected.length === MAX);

  let html = selected.map(c => `
    <div class="preview-item">
      <button class="preview-rm" onclick="removeSelected('${c.id}')">✕</button>
      <span class="pe">${c.emoji}</span>${c.name}
    </div>`).join('');
  for (let i = selected.length; i < MAX; i++)
    html += `<div class="preview-empty">＋</div>`;
  document.getElementById('preview-grid').innerHTML = html;
}

function updateBtn() {
  document.getElementById('start-btn').disabled = selected.length !== MAX;
}

async function startGame() {
  if (selected.length !== MAX) return;
  const gameName = document.getElementById('game-name').value.trim() || 'Kona Night';
  const t1 = document.getElementById('t1-name').value.trim() || 'Team 1';
  const t2 = document.getElementById('t2-name').value.trim() || 'Team 2';

  const btn = document.getElementById('start-btn');
  btn.textContent = '⏳ جاري التحميل...';
  btn.disabled = true;

  const questions = {};
  for (const cat of selected) {
    const r = await fetch(`/api/questions/${cat.id}`);
    questions[cat.id] = await r.json();
  }

  const state = {
    gameName, startTime: Date.now(),
    teams: [
      { name: t1, score: 0, powers: { x2: false, steal: false, skip: false } },
      { name: t2, score: 0, powers: { x2: false, steal: false, skip: false } },
    ],
    categories: selected, questions,
    currentTeam: 0, usedCells: {}, currentQ: null,
  };

  sessionStorage.setItem('konaState', JSON.stringify(state));
  location.href = '/game.html';
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'show ' + type;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.className = '', 2500);
}

init();
