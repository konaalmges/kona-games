// KONA GAMES – Board Logic
const PTS = [100, 100, 300, 300, 500, 500];
let S = null;
let pendingPower = null; // { team, type }

function load() {
  const raw = sessionStorage.getItem('konaState');
  if (!raw) { location.href = '/'; return; }
  S = JSON.parse(raw);
}
function save() { sessionStorage.setItem('konaState', JSON.stringify(S)); }

// ── Build Board ──
function buildBoard() {
  const grid = document.getElementById('board');
  const n = S.categories.length;
  grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  grid.innerHTML = '';

  // Category headers
  S.categories.forEach(c => {
    const h = document.createElement('div');
    h.className = 'cat-header';
    h.innerHTML = `<span class="h-emoji">${c.emoji}</span><span>${c.name}</span>`;
    grid.appendChild(h);
  });

  // Cells
  PTS.forEach((pts, ri) => {
    S.categories.forEach((cat, ci) => {
      const key = `${ci}-${ri}`;
      const cell = document.createElement('div');
      cell.className = 'board-cell';
      cell.id = `cell-${key}`;
      cell.style.animationDelay = `${(ri * n + ci) * 0.025}s`;

      const used = S.usedCells[key];
      if (used !== undefined) {
        cell.classList.add('used');
        if      (used === 1) { cell.classList.add('won-t1'); cell.textContent = '✓'; }
        else if (used === 2) { cell.classList.add('won-t2'); cell.textContent = '✓'; }
        else                 { cell.textContent = '—'; }
      } else {
        cell.textContent = pts;
        cell.onclick = () => openQ(ci, ri, pts);
      }
      grid.appendChild(cell);
    });
  });
}

// ── Open Question ──
function openQ(ci, ri, pts) {
  const key = `${ci}-${ri}`;
  if (S.usedCells[key] !== undefined) return;

  // Handle skip power
  if (pendingPower && pendingPower.type === 'skip') {
    const team = pendingPower.team;
    S.teams[team].powers.skip = true;
    S.usedCells[key] = 0;
    pendingPower = null;
    clearPowerHighlight();
    save(); buildBoard(); updateUI();
    showToast('تم تخطي السؤال ⏭️', 'ok');
    return;
  }

  const cat = S.categories[ci];
  const diffMap = { 0:'easy', 1:'easy', 2:'medium', 3:'medium', 4:'hard', 5:'hard' };
  const diff = diffMap[ri];
  const qList = S.questions[cat.id][diff];
  const idx = ri % 2 === 1 ? 1 : 0;
  const q = qList[idx] || qList[0];

  // pass active power to question page
  S.currentQ = { ci, ri, pts, key, diff, q, activePower: pendingPower };
  pendingPower = null;
  clearPowerHighlight();
  save();
  location.href = '/question.html';
}

// ── Update UI ──
function updateUI() {
  document.getElementById('hdr-title').textContent = S.gameName || 'KONA GAMES';

  [0,1].forEach(i => {
    document.getElementById(`tname-${i}`).textContent  = S.teams[i].name;
    document.getElementById(`tscore-${i}`).textContent = S.teams[i].score;
    document.getElementById(`tc-${i}`).classList.toggle('active', S.currentTeam === i);

    // Power states
    ['x2','steal','skip'].forEach(p => {
      const el = document.getElementById(`pow-${i}-${p}`);
      if (!el) return;
      el.classList.toggle('used-power', !!S.teams[i].powers[p]);
    });
  });

  // Progress
  const total = S.categories.length * PTS.length;
  const used  = Object.keys(S.usedCells).length;
  const pct   = Math.round((used / total) * 100);
  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('prog-lbl').textContent  = `${used} / ${total} سؤال`;
  document.getElementById('hdr-pct').textContent   = pct + '%';
}

// ── Score adjust (manual, +100 steps) ──
function adj(team, delta) {
  S.teams[team].score = Math.max(0, S.teams[team].score + delta);
  save(); updateUI();
  const el = document.getElementById(`tscore-${team}`);
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}

// ── Switch turn ──
function switchTurn() {
  S.currentTeam = 1 - S.currentTeam;
  save(); updateUI();
  showToast(`دور ${S.teams[S.currentTeam].name} ⚡`);
}

// ── Powers ──
function selectPower(team, type) {
  // Only current team can use power
  if (team !== S.currentTeam) { showToast('مو دورك! 🚫', 'err'); return; }
  // Already used?
  if (S.teams[team].powers[type]) { showToast('استخدمت هذه الميزة من قبل ❌', 'err'); return; }

  if (pendingPower && pendingPower.team === team && pendingPower.type === type) {
    // deselect
    pendingPower = null;
    clearPowerHighlight();
    showToast('تم إلغاء الميزة');
    return;
  }

  pendingPower = { team, type };

  const labels = {
    x2:    'اختر السؤال وستتضاعف نقاطه ✕2',
    steal: 'اختر السؤال لتسرق 100 نقطة إضافية 🎯',
    skip:  'اختر سؤالاً لتخطيه ⏭️',
  };

  clearPowerHighlight();
  const el = document.getElementById(`pow-${team}-${type}`);
  if (el) el.classList.add('active-power');
  showToast(labels[type]);
}

function clearPowerHighlight() {
  document.querySelectorAll('.power').forEach(el => el.classList.remove('active-power'));
}

function confirmExit() {
  if (confirm('تأكيد الخروج من اللعبة؟')) location.href = '/';
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'show ' + type;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.className = '', 2800);
}

function checkDone() {
  const total = S.categories.length * PTS.length;
  if (Object.keys(S.usedCells).length >= total) {
    setTimeout(() => location.href = '/end.html', 500);
  }
}

load(); updateUI(); buildBoard(); checkDone();
