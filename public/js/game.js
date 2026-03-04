// ═══════════════════════════════
// KONA GAMES – Board v7.0
// ═══════════════════════════════
const PTS = [200, 200, 300, 300, 400, 400, 600, 600];
const POWERS = {
  x2:     { emoji:'⭐', label:'نقطة ×2' },
  time:   { emoji:'⏰', label:'+٣٠ث' },
  random: { emoji:'🔮', label:'سؤال جديد' },
  shield: { emoji:'🛡️', label:'حصانة' },
  steal:  { emoji:'🚨', label:'سرقة' },
  block:  { emoji:'🚫', label:'منع' },
};
let S = null;

function load() {
  const raw = sessionStorage.getItem('konaState');
  if (!raw) { location.href='/'; return; }
  S = JSON.parse(raw);
  if (!S.usedPowers)  S.usedPowers  = { 0:[], 1:[] };
  if (!S.teamPowers)  S.teamPowers  = { 0:['x2','random','time'], 1:['x2','random','time'] };
  if (!S.lastEarnedPts) S.lastEarnedPts = { 0:0, 1:0 };
}

function save() { sessionStorage.setItem('konaState', JSON.stringify(S)); }

function buildBoard() {
  const grid = document.getElementById('board');
  const n = S.categories.length;
  grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  grid.innerHTML = '';

  // خلفية البورد تتغير حسب الفئات المختارة
  const boardBg = document.getElementById('board-bg');
  if (boardBg) {
    // استخدم صورة أول فئة كخلفية طاغية
    const bgImg = getCatImage(S.categories[0].id);
    boardBg.style.backgroundImage = `url('${bgImg}')`;
    boardBg.classList.add('loaded');
  }

  S.categories.forEach(c => {
    const h = document.createElement('div');
    h.className = 'cat-header';
    h.innerHTML = `
      <div class="cat-header-img" style="background-image:url('${getCatImage(c.id)}')"></div>
      <div class="cat-header-overlay"></div>
      <div class="cat-header-inner">
        <span class="h-emoji">${c.emoji}</span>
        <span>${c.name}</span>
      </div>`;
    grid.appendChild(h);
  });

  PTS.forEach((pts, ri) => {
    S.categories.forEach((cat, ci) => {
      const key = `${ci}-${ri}`;
      const cell = document.createElement('div');
      cell.className = 'board-cell';
      cell.id = `cell-${key}`;
      cell.style.animationDelay = `${(ri*n+ci)*0.03}s`;
      const used = S.usedCells[key];
      if (used !== undefined) {
        cell.classList.add('used');
        cell.textContent = used===1 ? '✓' : used===2 ? '✓' : '—';
        if (used===1) cell.classList.add('won-t1');
        if (used===2) cell.classList.add('won-t2');
      } else {
        cell.textContent = pts;
        cell.onclick = () => openQ(ci, ri, pts);
      }
      grid.appendChild(cell);
    });
  });
}

function openQ(ci, ri, pts) {
  const key = `${ci}-${ri}`;
  if (S.usedCells[key] !== undefined) return;
  // فحص الحظر
  if (S.teams[S.currentTeam]?.blocked) {
    showToast(`🚫 ${S.teams[S.currentTeam].name} ممنوع هذه الجولة!`, 'warn');
    S.teams[S.currentTeam].blocked = false;
    S.currentTeam = 1 - S.currentTeam;
    save(); updateUI(); return;
  }
  const cat = S.categories[ci];
  const diffs = { 0:'easy',1:'easy',2:'easy',3:'medium',4:'medium',5:'medium',6:'hard',7:'hard' };
  const qIdx  = { 0:0, 1:1, 2:2, 3:0, 4:1, 5:2, 6:0, 7:1 };
  const diff = diffs[ri];
  const qList = S.questions[cat.id][diff];
  const q = qList[qIdx[ri]] || qList[0];
  S.currentQ = { ci, ri, pts, key, diff, q };
  save(); location.href = '/question.html';
}

function renderPowerStatus() {
  [0,1].forEach(team => {
    const container = document.getElementById(`bpow-${team}`);
    if (!container) return;
    const myPowers = S.teamPowers?.[team] || [];
    container.innerHTML = myPowers.map(type => {
      const p = POWERS[type] || {};
      const used = S.usedPowers[team]?.includes(type);
      return `<div class="bpow-chip${used?' bpow-used':''}" title="${p.label||''}">
        ${p.emoji||''} <span>${p.label||''}</span>
      </div>`;
    }).join('');
  });
}

function updateUI() {
  document.getElementById('hdr-title').innerHTML = `<em>${S.gameName||'KONA GAMES'}</em>`;
  [0,1].forEach(i => {
    document.getElementById(`tname-${i}`).textContent  = S.teams[i].name;
    document.getElementById(`tscore-${i}`).textContent = S.teams[i].score.toLocaleString();
    document.getElementById(`tc-${i}`).classList.toggle('active', S.currentTeam===i);
  });
  renderPowerStatus();
  const total = S.categories.length * PTS.length;
  const used  = Object.keys(S.usedCells).length;
  const pct   = Math.round(used/total*100);
  document.getElementById('prog-fill').style.width  = pct+'%';
  document.getElementById('prog-label').textContent = `${used} / ${total} سؤال`;
  document.getElementById('hdr-progress').textContent = pct+'%';
}

function adj(team, delta) {
  S.teams[team].score = Math.max(0, S.teams[team].score+delta);
  save(); updateUI();
  const el = document.getElementById(`tscore-${team}`);
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}

function switchTurn() {
  S.currentTeam = 1-S.currentTeam;
  save(); updateUI();
  showToast(`دور ${S.teams[S.currentTeam].name} ⚡`);
}

function confirmExit() {
  if (confirm('تأكيد الخروج؟')) location.href='/';
}

function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent=msg; t.className='show '+type;
  clearTimeout(t._t); t._t=setTimeout(()=>t.className='',3000);
}

load(); updateUI(); buildBoard();
// فحص نهاية اللعبة
if (Object.keys(S.usedCells).length >= S.categories.length*PTS.length)
  setTimeout(()=>location.href='/end.html',600);
