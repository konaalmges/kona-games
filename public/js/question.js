// KONA GAMES – Question Logic
let S = null;
let secs = 0, running = true, timerID = null;
let revealed = false;
let activePower = null;

function load() {
  const raw = sessionStorage.getItem('konaState');
  if (!raw) { location.href = '/'; return; }
  S = JSON.parse(raw);
  if (!S.currentQ) { location.href = '/game.html'; return; }
  activePower = S.currentQ.activePower || null;
}
function save() { sessionStorage.setItem('konaState', JSON.stringify(S)); }

function renderUI() {
  const { q, pts, ci } = S.currentQ;
  const cat = S.categories[ci];

  document.getElementById('q-cat').innerHTML = `${cat.emoji} ${cat.name}`;

  // Show modified points if x2 power active
  let displayPts = pts;
  if (activePower && activePower.type === 'x2') displayPts = pts * 2;
  document.getElementById('q-pts').textContent = `${displayPts} نقطة`;

  document.getElementById('q-text').textContent = q.q;

  // Question image
  if (q.img_q) {
    const img = document.getElementById('q-img');
    img.src = `/images/${q.img_q}`;
    img.style.display = 'block';
  }

  // Side panel
  [0,1].forEach(i => {
    document.getElementById(`sname-${i}`).textContent  = S.teams[i].name;
    document.getElementById(`sscore-${i}`).textContent = S.teams[i].score;
    document.getElementById(`stc-${i}`).classList.toggle('active', S.currentTeam === i);
  });

  document.getElementById('t1-lbl').textContent = S.teams[0].name;
  document.getElementById('t2-lbl').textContent = S.teams[1].name;

  // Show active power badge
  if (activePower) {
    const labels = { x2:'✕2 نقاط مضاعفة!', steal:'🎯 سرقة نقاط', skip:'⏭️ تخطي' };
    document.getElementById('powers-bar').style.display = 'flex';
    document.getElementById('active-power-badge').textContent = labels[activePower.type] || '';
  }
}

// ── Timer ──
function startTimer() {
  secs = 0; running = true; updateTimerDisplay();
  timerID = setInterval(() => {
    if (!running) return;
    secs++;
    updateTimerDisplay();
    document.getElementById('t-fill').style.width = Math.min((secs/120)*100, 100) + '%';
  }, 1000);
}

function updateTimerDisplay() {
  const m = String(Math.floor(secs/60)).padStart(2,'0');
  const s = String(secs%60).padStart(2,'0');
  document.getElementById('t-display').textContent = `${m}:${s}`;
}

function toggleTimer() {
  running = !running;
  document.getElementById('pause-btn').textContent = running ? '⏸' : '▶';
}

function resetTimer() {
  secs = 0; running = true;
  document.getElementById('pause-btn').textContent = '⏸';
  document.getElementById('t-fill').style.width = '0%';
  updateTimerDisplay();
}

// ── Reveal Answer ──
function revealAnswer() {
  if (revealed) return;
  revealed = true;
  running = false;
  clearInterval(timerID);

  const q = S.currentQ.q;
  const answerBox = document.getElementById('q-answer');
  answerBox.textContent = '✔ ' + q.a;
  answerBox.style.display = 'block';

  // Answer image
  if (q.img_a) {
    const img = document.getElementById('q-answer-img');
    img.src = `/images/${q.img_a}`;
    img.style.display = 'block';
  }

  document.getElementById('reveal-btn').style.display = 'none';
  document.getElementById('award-row').style.display  = 'flex';
}

// ── Award Points ──
function award(team) {
  const { pts, key } = S.currentQ;
  const ap = activePower;

  if (team === 1 || team === 2) {
    const teamIdx = team - 1;
    let earnedPts = pts;

    // X2 power: double the points
    if (ap && ap.type === 'x2' && ap.team === teamIdx) {
      earnedPts = pts * 2;
      S.teams[teamIdx].powers.x2 = true;
      showToast(`✕2 نقاط مضاعفة! +${earnedPts} 🎉`, 'ok');
    }

    // Steal power: +100 from other team
    if (ap && ap.type === 'steal' && ap.team === teamIdx) {
      const otherIdx = 1 - teamIdx;
      const stolen = Math.min(100, S.teams[otherIdx].score);
      S.teams[otherIdx].score = Math.max(0, S.teams[otherIdx].score - stolen);
      S.teams[teamIdx].score += earnedPts + stolen;
      S.teams[teamIdx].powers.steal = true;
      S.usedCells[key] = team;
      S.currentTeam = teamIdx;
      S.currentQ = null; save();
      location.href = '/game.html'; return;
    }

    S.teams[teamIdx].score += earnedPts;
    S.usedCells[key] = team;
    S.currentTeam = teamIdx;
  } else {
    // No one answered
    S.usedCells[key] = 0;
    S.currentTeam = 1 - S.currentTeam;
  }

  S.currentQ = null; save();

  const total = S.categories.length * 6;
  if (Object.keys(S.usedCells).length >= total) {
    location.href = '/end.html';
  } else {
    location.href = '/game.html';
  }
}

function goBack() {
  S.currentQ = null; save();
  location.href = '/game.html';
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'show ' + type;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.className = '', 2800);
}

load(); renderUI(); startTimer();
