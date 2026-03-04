// ═══════════════════════════════
// KONA GAMES – Setup v5.0
// ═══════════════════════════════
const MAX = 6;
let allCats = [];
let selected = [];
let activeFilter = 'all';

const filterMap = {
  knowledge: ['geography','science','history','culture'],
  fun:       ['movies','music','gaming','art','food'],
  sports:    ['sports','nature'],
  religion:  ['religion'],
};

async function init() {
  const r = await fetch('/api/categories');
  allCats = await r.json();
  renderCats(); renderPreview();
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
    const matchQ = !q || c.name.includes(q) || c.id.includes(q);
    const matchF = activeFilter === 'all' || (filterMap[activeFilter] || []).includes(c.id);
    return matchQ && matchF;
  });

  document.getElementById('sect-label').textContent = `${list.length} فئة متاحة`;
  document.getElementById('cats-grid').innerHTML = list.map(c => {
    const isSel = !!selected.find(s => s.id === c.id);
    const isOff = !isSel && selected.length >= MAX;
    const img = getCatImage(c.id);
    return `
      <div class="cat-card${isSel?' selected':''}${isOff?' disabled':''}"
           data-id="${c.id}" onclick="toggleCat('${c.id}')">
        <div class="cat-img-layer" style="background-image:url('${img}')"></div>
        <div class="cat-overlay"></div>
        <div class="cat-card-inner">
          <span class="cat-emoji-badge">${c.emoji}</span>
          <div class="cat-name">${c.name}</div>
        </div>
      </div>`;
  }).join('');
}

function toggleCat(id) {
  const cat = allCats.find(c => c.id === id);
  const idx = selected.findIndex(c => c.id === id);
  if (idx >= 0) { selected.splice(idx, 1); }
  else {
    if (selected.length >= MAX) { showToast('اختر 6 فئات فقط 🎯'); return; }
    selected.push(cat);
  }
  renderCats(); renderPreview(); updateStartBtn();
}

function removeSelected(id) {
  selected = selected.filter(c => c.id !== id);
  renderCats(); renderPreview(); updateStartBtn();
}

function renderPreview() {
  const pill = document.getElementById('sel-pill');
  pill.textContent = `${selected.length} / ${MAX}`;
  pill.classList.toggle('full', selected.length === MAX);

  let html = selected.map(c => {
    const img = getCatImage(c.id);
    return `
      <div class="preview-item">
        <div class="pi-img" style="background-image:url('${img}')"></div>
        <div class="pi-overlay"></div>
        <button class="preview-remove" onclick="removeSelected('${c.id}')">✕</button>
        <div class="pi-content">
          <span class="p-emoji">${c.emoji}</span>
          ${c.name}
        </div>
      </div>`;
  }).join('');

  for (let i = selected.length; i < MAX; i++)
    html += `<div class="preview-empty">＋</div>`;

  document.getElementById('preview-grid').innerHTML = html;
}

function updateStartBtn() {
  document.getElementById('start-btn').disabled = selected.length !== MAX;
}

async function startGame() {
  if (selected.length !== MAX) return;
  const gameName = document.getElementById('game-name').value.trim() || 'Kona Night';
  const t1 = document.getElementById('t1-name').value.trim() || 'Team Alpha';
  const t2 = document.getElementById('t2-name').value.trim() || 'Team Beta';

  const btn = document.getElementById('start-btn');
  btn.textContent = '⏳ جاري التحميل...';
  btn.disabled = true;

  const questions = {};
  for (const cat of selected) {
    const r = await fetch(`/api/questions/${cat.id}`);
    questions[cat.id] = await r.json();
  }

  sessionStorage.setItem('konaState', JSON.stringify({
    gameName,
    teams: [{ name: t1, score: 0 }, { name: t2, score: 0 }],
    categories: selected,
    questions,
    currentTeam: 0,
    usedCells: {},
    usedPowers: { 0: [], 1: [] },
    currentQ: null,
    startTime: Date.now(),
  }));
  location.href = '/game.html';
}

function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'show ' + type;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.className = '', 2500);
}

init();
