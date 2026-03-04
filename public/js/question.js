// ═══════════════════════════════════════════════
// KONA GAMES – Question v7.0
// ─ 4 مميزات لكل فريق، مرة واحدة طول اللعبة
// ─ تُستخدم بعد ظهور السؤال فقط
// ─ أي فريق يضغطها في أي وقت (استراتيجية)
// ─ تنفذ فوراً بدون popup
// ─ الدور يتبدل تلقائياً، أي فريق يجاوب
// ═══════════════════════════════════════════════

let S = null;
let secs = 60, running = true, timerID = null;
let revealed = false, awarded = false;
let questionPts = 0;    // النقاط الحالية قابلة للتضاعف بـ x2
let shieldActive = [false, false]; // هل الحصانة فعّالة لكل فريق هذا السؤال

// ── تعريف المميزات ──
const POWERS = {
  x2:     { emoji: '⭐', label: 'نقطة ×2',     desc: 'نقاط السؤال تتضاعف لفريقك' },
  time:   { emoji: '⏰', label: '+٣٠ ث',        desc: 'يضيف 30 ثانية للتايمر' },
  random: { emoji: '🔮', label: 'سؤال جديد',    desc: 'يغير السؤال بسؤال عشوائي' },
  shield: { emoji: '🛡️', label: 'حصانة',        desc: 'لو خسرت ما تنزل نقاطك' },
  steal:  { emoji: '🚨', label: 'سرقة',         desc: 'تسرق نقاط آخر سؤال للخصم' },
  block:  { emoji: '🚫', label: 'منع',           desc: 'الخصم ما يختار سؤال الجولة الجاية' },
};

// ── القدرات الافتراضية لكل فريق ──
const DEFAULT_POWERS = ['x2', 'time', 'random', 'shield', 'steal', 'block'];

function load() {
  const raw = sessionStorage.getItem('konaState');
  if (!raw) { location.href = '/'; return; }
  S = JSON.parse(raw);
  if (!S.currentQ) { location.href = '/game.html'; return; }
  if (!S.usedPowers)   S.usedPowers   = { 0: [], 1: [] };
  if (!S.lastEarnedPts) S.lastEarnedPts = { 0: 0, 1: 0 };
  // كل فريق يبدأ بـ 4 مميزات من الـ6، نحدد أيها موجودة
  if (!S.teamPowers) {
    S.teamPowers = {
      0: ['x2', 'random', 'time'],
      1: ['x2', 'random', 'time'],
    };
  }
  questionPts = S.currentQ.pts;
}

function save() { sessionStorage.setItem('konaState', JSON.stringify(S)); }

// ── Render ──
function renderUI() {
  const { q, pts, ci, diff } = S.currentQ;
  const cat = S.categories[ci];

  // Hero
  document.getElementById('q-hero-img').style.backgroundImage = `url('${getCatImage(cat.id)}')`;
  document.getElementById('q-hero-emoji').textContent = cat.emoji;
  document.getElementById('q-hero-name').textContent  = cat.name;
  document.getElementById('q-pts').textContent        = questionPts + ' نقطة';

  // Difficulty
  const dm = { easy:{l:'سهل',c:'diff-easy'}, medium:{l:'متوسط',c:'diff-medium'}, hard:{l:'صعب',c:'diff-hard'} };
  const d = dm[diff] || dm.easy;
  const db = document.getElementById('q-diff-badge');
  db.textContent = d.l; db.className = 'diff-badge ' + d.c;

  // Question text
  document.getElementById('q-text').textContent = q.q;

  // Multiple choice
  const ce = document.getElementById('q-choices');
  if (q.choices && q.choices.length) {
    const letters = ['أ','ب','ج','د'];
    ce.innerHTML = q.choices.map((c,i) =>
      `<button class="choice-btn" data-idx="${i}" onclick="choiceClick(this,${i===q.correct})">
        <span class="choice-letter">${letters[i]}</span>${c}
      </button>`).join('');
  } else { ce.innerHTML = ''; }

  // Teams
  [0,1].forEach(i => {
    document.getElementById(`sname-${i}`).textContent  = S.teams[i].name;
    document.getElementById(`sscore-${i}`).textContent = S.teams[i].score.toLocaleString();
    document.getElementById(`stc-${i}`).classList.toggle('active', S.currentTeam === i);
  });
  document.getElementById('t1-lbl').textContent = S.teams[0].name;
  document.getElementById('t2-lbl').textContent = S.teams[1].name;

  // Render power buttons
  renderPowers();
}

function renderPowers() {
  [0,1].forEach(team => {
    const container = document.getElementById(`qpow-${team}`);
    if (!container) return;
    const myPowers = S.teamPowers[team] || [];
    container.innerHTML = myPowers.map(type => {
      const p = POWERS[type];
      const used = S.usedPowers[team]?.includes(type);
      // مميزات الـ x2 تظهر فقط قبل الكشف، الباقي في أي وقت
      const dimmed = used || (type === 'x2' && revealed) || (type === 'time' && revealed) || (type === 'random' && revealed);
      return `
        <div class="qpow-btn${used?' qpow-used':''}"
             id="qp-${team}-${type}"
             onclick="${used||dimmed?'':` tryPower(${team},'${type}')`}"
             title="${p.desc}">
          <span class="qpow-emoji">${p.emoji}</span>
          <span class="qpow-label">${p.label}</span>
        </div>`;
    }).join('');
  });
}

// ── استخدام الميزة ──
function tryPower(team, type) {
  if (!S.usedPowers) S.usedPowers = { 0:[], 1:[] };
  if (S.usedPowers[team]?.includes(type)) return;

  // تأكد ما تُستخدم قبل ظهور السؤال
  if (!revealed && type !== 'x2' && type !== 'time' && type !== 'random' && type !== 'shield' && type !== 'steal' && type !== 'block') return;

  const p = POWERS[type];
  S.usedPowers[team].push(type);

  if (type === 'x2') {
    // نقاط السؤال تتضاعف للفريق اللي استخدمها
    S.currentQ.x2Team = team;
    questionPts = S.currentQ.pts * 2;
    document.getElementById('q-pts').textContent = questionPts + ' نقطة ⭐';
    flash(`${S.teams[team].name}: ⭐ النقاط أصبحت ${questionPts}!`, '#ffd700');
    showToast(`⭐ النقاط ضاعفت لـ ${S.teams[team].name}!`);

  } else if (type === 'time') {
    secs = Math.min(secs + 30, 120);
    updateTimer(); updateBar();
    document.getElementById('t-display').classList.remove('warning');
    document.getElementById('t-fill').classList.remove('danger');
    flash(`${S.teams[team].name}: ⏰ +30 ثانية!`, '#00e5cc');
    showToast(`⏰ تمت إضافة 30 ثانية لـ ${S.teams[team].name}!`);

  } else if (type === 'random') {
    // يغير السؤال بسؤال جديد من نفس الفئة والصعوبة
    const { ci, diff } = S.currentQ;
    const cat = S.categories[ci];
    const qList = S.questions[cat.id][diff];
    // اختر سؤال مختلف عن الحالي
    const current = S.currentQ.q;
    const others = qList.filter(q => q.q !== current.q);
    if (others.length > 0) {
      const newQ = others[Math.floor(Math.random() * others.length)];
      S.currentQ.q = newQ;
      document.getElementById('q-text').textContent = newQ.q;
      // تحديث الخيارات لو موجودة
      const ce = document.getElementById('q-choices');
      if (newQ.choices && newQ.choices.length) {
        const letters = ['أ','ب','ج','د'];
        ce.innerHTML = newQ.choices.map((c,i) =>
          `<button class="choice-btn" onclick="choiceClick(this,${i===newQ.correct})">
            <span class="choice-letter">${letters[i]}</span>${c}
          </button>`).join('');
      } else { ce.innerHTML = ''; }
      flash(`${S.teams[team].name}: 🔮 سؤال جديد!`, '#cc88ff');
      showToast(`🔮 ${S.teams[team].name} غيّر السؤال!`);
    } else {
      showToast('🔮 ما في سؤال بديل متاح!');
      S.usedPowers[team].pop(); // لم تُستخدم
    }

  } else if (type === 'shield') {
    shieldActive[team] = true;
    flash(`${S.teams[team].name}: 🛡️ حصانة فعّالة!`, '#00e676');
    showToast(`🛡️ ${S.teams[team].name} محمي هذا السؤال!`);

  } else if (type === 'steal') {
    const enemy = 1 - team;
    const pts = S.lastEarnedPts?.[enemy] || 0;
    if (pts > 0) {
      S.teams[team].score  += pts;
      S.teams[enemy].score  = Math.max(0, S.teams[enemy].score - pts);
      updateScores();
      flash(`${S.teams[team].name}: 🚨 سرق ${pts} نقطة!`, '#ff3d5a');
      showToast(`🚨 ${S.teams[team].name} سرق ${pts} نقطة من ${S.teams[enemy].name}!`);
    } else {
      showToast(`🚨 ما في نقاط تسرقها بعد!`);
      S.usedPowers[team].pop();
    }

  } else if (type === 'block') {
    S.teams[1-team].blocked = true;
    flash(`${S.teams[team].name}: 🚫 ${S.teams[1-team].name} ممنوع!`, '#ff8040');
    showToast(`🚫 ${S.teams[1-team].name} ممنوع من اختيار سؤال الجولة الجاية!`);
  }

  save();
  renderPowers();
}

function flash(msg, color) {
  const el = document.getElementById('power-flash');
  if (!el) return;
  el.textContent = msg;
  el.style.background = color + '22';
  el.style.borderColor = color + '55';
  el.style.color = color;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.style.display = 'none', 2500);
}

function updateScores() {
  [0,1].forEach(i => {
    document.getElementById(`sscore-${i}`).textContent = S.teams[i].score.toLocaleString();
  });
}

// ── Multiple Choice ──
function choiceClick(btn, isCorrect) {
  if (revealed) return;
  document.querySelectorAll('.choice-btn').forEach(b => b.classList.add('revealed'));
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    document.querySelectorAll('.choice-btn').forEach((b,i) => {
      if (i === S.currentQ.q.correct) b.classList.add('correct');
    });
  }
  revealAnswer(true);
}

// ── Timer ──
function startTimer() {
  secs = 60; running = true; updateTimer(); updateBar();
  timerID = setInterval(() => {
    if (!running) return;
    secs--;
    updateTimer(); updateBar();
    if (secs <= 15) {
      document.getElementById('t-display').classList.add('warning');
      document.getElementById('t-fill').classList.add('danger');
    }
    if (secs <= 0) {
      secs = 0; running = false; clearInterval(timerID);
      if (!revealed) revealAnswer();
      showToast('⏰ انتهى الوقت!');
    }
  }, 1000);
}

function updateTimer() {
  const m = String(Math.floor(secs/60)).padStart(2,'0');
  const s = String(secs%60).padStart(2,'0');
  document.getElementById('t-display').textContent = `${m}:${s}`;
}
function updateBar() {
  document.getElementById('t-fill').style.width = (secs/60*100) + '%';
}
function toggleTimer() {
  running = !running;
  document.getElementById('pause-btn').textContent = running ? '⏸' : '▶';
}
function resetTimer() {
  clearInterval(timerID);
  document.getElementById('t-display').classList.remove('warning');
  document.getElementById('t-fill').classList.remove('danger');
  document.getElementById('pause-btn').textContent = '⏸';
  startTimer();
}

// ── Reveal ──
function revealAnswer(fromChoice) {
  if (revealed) return;
  revealed = true;
  if (!fromChoice) { running = false; clearInterval(timerID); }
  const el = document.getElementById('q-answer');
  el.textContent = '✔ ' + S.currentQ.q.a;
  el.style.display = 'block';
  document.getElementById('reveal-btn').style.display = 'none';
  document.getElementById('award-row').style.display  = 'flex';
  renderPowers(); // تعطيل بعض المميزات بعد الكشف
}

// ── Award ──
function award(winner) {
  if (awarded) return;
  awarded = true;

  const { key } = S.currentQ;
  if (!S.lastEarnedPts) S.lastEarnedPts = { 0:0, 1:0 };

  // حساب النقاط مع مراعاة x2 والحصانة
  const x2Team = S.currentQ.x2Team; // الفريق اللي ضاعف

  if (winner === 1) {
    const pts = (x2Team === 0) ? questionPts : S.currentQ.pts;
    S.teams[0].score += pts;
    S.lastEarnedPts[0] = pts;
    S.usedCells[key] = 1;
  } else if (winner === 2) {
    const pts = (x2Team === 1) ? questionPts : S.currentQ.pts;
    S.teams[1].score += pts;
    S.lastEarnedPts[1] = pts;
    S.usedCells[key] = 2;
  } else {
    // لا أحد — الحصانة تحمي من إضافة صفر (ما في خصم هنا فالحصانة ما تلزم)
    S.usedCells[key] = 0;
  }

  // شيلد: لو الفريق خسر بس عنده حصانة، ما ينزل على صفر (حماية من الناتج السلبي)
  [0,1].forEach(i => {
    if (S.teams[i].score < 0 && shieldActive[i]) S.teams[i].score = 0;
  });

  // الدور يتبدل تلقائياً
  S.currentTeam = 1 - S.currentTeam;
  S.currentQ = null;
  save();

  const total = S.categories.length * 6;
  location.href = Object.keys(S.usedCells).length >= total ? '/end.html' : '/game.html';
}

function goBack() {
  S.currentQ = null; save();
  location.href = '/game.html';
}

function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'show ' + type;
  clearTimeout(t._t); t._t = setTimeout(() => t.className='', 2800);
}

load(); renderUI(); startTimer();
