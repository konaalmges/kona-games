// ═══════════════════════════════════════════════════
// KONA GAMES – AI Content Generator
// شغّله مرة واحدة لتوليد الفئات والأسئلة تلقائياً
// node generate-content.js
// ═══════════════════════════════════════════════════
const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── إعدادات ──
const TARGET_CATEGORIES = 30;   // عدد الفئات المستهدف
const QUESTIONS_PER_DIFF = 8;   // أسئلة لكل مستوى صعوبة
const DATA_PATH = path.join(__dirname, 'data', 'questions.json');

// ── الفئات المقترحة (30 فئة) ──
const CATEGORY_LIST = [
  // موجودة
  { id:'geography',  name:'جغرافيا',            emoji:'🌍' },
  { id:'sports',     name:'رياضة',               emoji:'⚽' },
  { id:'culture',    name:'ثقافة عامة',           emoji:'🧠' },
  { id:'history',    name:'تاريخ',               emoji:'📜' },
  { id:'movies',     name:'أفلام ومسلسلات',       emoji:'🎬' },
  { id:'science',    name:'علوم وتقنية',          emoji:'🔬' },
  { id:'religion',   name:'دين',                 emoji:'🕌' },
  { id:'food',       name:'طعام',                emoji:'🍕' },
  { id:'music',      name:'موسيقى',              emoji:'🎵' },
  { id:'gaming',     name:'ألعاب',               emoji:'🎮' },
  { id:'art',        name:'فن ورسم',             emoji:'🎨' },
  { id:'nature',     name:'طبيعة',              emoji:'🌿' },
  // جديدة
  { id:'space',      name:'الفضاء',              emoji:'🚀' },
  { id:'animals',    name:'حيوانات',             emoji:'🦁' },
  { id:'cars',       name:'سيارات',              emoji:'🚗' },
  { id:'medicine',   name:'طب وصحة',             emoji:'🏥' },
  { id:'economy',    name:'اقتصاد ومال',         emoji:'💰' },
  { id:'lang',       name:'لغة عربية',           emoji:'📖' },
  { id:'celebs',     name:'مشاهير',              emoji:'⭐' },
  { id:'travel',     name:'سياحة وسفر',          emoji:'✈️' },
  { id:'anime',      name:'أنمي ومانغا',         emoji:'🎌' },
  { id:'football',   name:'كرة القدم',           emoji:'🏆' },
  { id:'social',     name:'تواصل اجتماعي',       emoji:'📱' },
  { id:'memes',      name:'ميمز وإنترنت',        emoji:'😂' },
  { id:'saudi',      name:'المملكة العربية السعودية', emoji:'🇸🇦' },
  { id:'gulf',       name:'الخليج العربي',        emoji:'🌊' },
  { id:'inventions', name:'اختراعات وابتكارات',   emoji:'💡' },
  { id:'math',       name:'رياضيات',             emoji:'➕' },
  { id:'psychology', name:'علم النفس',           emoji:'🧠' },
  { id:'cooking',    name:'طبخ وأكل سعودي',      emoji:'🍖' },
];

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }]
    });
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'anthropic-version': '2023-06-01',
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) { reject(new Error(json.error.message)); return; }
          resolve(json.content[0].text);
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function generateQuestionsForCategory(cat, existingQ = { easy:[], medium:[], hard:[] }) {
  const needEasy   = Math.max(0, QUESTIONS_PER_DIFF - existingQ.easy.length);
  const needMedium = Math.max(0, QUESTIONS_PER_DIFF - existingQ.medium.length);
  const needHard   = Math.max(0, QUESTIONS_PER_DIFF - existingQ.hard.length);

  if (needEasy + needMedium + needHard === 0) {
    console.log(`  ⏭ ${cat.name} — لا يحتاج أسئلة جديدة`);
    return existingQ;
  }

  const prompt = `أنت تساعد في بناء لعبة اختبار ثقافي عربية اسمها "Kona Games".

المطلوب: اكتب أسئلة وجوابها لفئة "${cat.name}" ${cat.emoji}

الكميات المطلوبة:
- ${needEasy} سؤال easy (سهل جداً - للمبتدئين)
- ${needMedium} سؤال medium (متوسط)
- ${needHard} سؤال hard (صعب - للمتقدمين)

القواعد:
- الأسئلة والأجوبة بالعربية فقط
- الجواب قصير جداً (كلمة أو جملة قصيرة)
- لا تكرر أسئلة
- الأسئلة متنوعة ومثيرة للاهتمام
- مناسبة للسعوديين والخليجيين

أجب فقط بـ JSON بهذا الشكل الدقيق بدون أي نص إضافي أو backticks:
{
  "easy": [{"q":"السؤال","a":"الجواب"}],
  "medium": [{"q":"السؤال","a":"الجواب"}],
  "hard": [{"q":"السؤال","a":"الجواب"}]
}`;

  const text = await callClaude(prompt);
  const clean = text.replace(/```json|```/g, '').trim();
  const generated = JSON.parse(clean);

  return {
    easy:   [...existingQ.easy,   ...(generated.easy   || [])].slice(0, QUESTIONS_PER_DIFF + 5),
    medium: [...existingQ.medium, ...(generated.medium || [])].slice(0, QUESTIONS_PER_DIFF + 5),
    hard:   [...existingQ.hard,   ...(generated.hard   || [])].slice(0, QUESTIONS_PER_DIFF + 5),
  };
}

async function main() {
  console.log('🚀 KONA GAMES – Content Generator');
  console.log(`📦 هدف: ${TARGET_CATEGORIES} فئة × ${QUESTIONS_PER_DIFF} سؤال لكل مستوى\n`);

  // تحميل الداتا الحالية
  let data = { categories: [] };
  if (fs.existsSync(DATA_PATH)) {
    data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  }

  const existingMap = {};
  data.categories.forEach(c => { existingMap[c.id] = c; });

  const categories = CATEGORY_LIST.slice(0, TARGET_CATEGORIES);
  const result = { categories: [] };

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    process.stdout.write(`[${i+1}/${categories.length}] ⏳ ${cat.name}...`);

    const existing = existingMap[cat.id];
    const existingQ = existing?.questions || { easy:[], medium:[], hard:[] };

    try {
      const questions = await generateQuestionsForCategory(cat, existingQ);
      result.categories.push({
        id:        cat.id,
        name:      cat.name,
        emoji:     cat.emoji,
        questions,
      });
      console.log(` ✅ easy:${questions.easy.length} med:${questions.medium.length} hard:${questions.hard.length}`);

      // حفظ كل فئة فور الانتهاء منها (backup)
      fs.writeFileSync(DATA_PATH, JSON.stringify(result, null, 2), 'utf8');

    } catch(e) {
      console.log(` ❌ خطأ: ${e.message}`);
      // احتفظ بالأسئلة القديمة لو موجودة
      if (existing) result.categories.push(existing);
    }

    // تأخير بين الطلبات لتجنب rate limit
    if (i < categories.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(result, null, 2), 'utf8');
  const total = result.categories.reduce((s,c) => s + c.questions.easy.length + c.questions.medium.length + c.questions.hard.length, 0);
  console.log(`\n✅ تم! ${result.categories.length} فئة و ${total} سؤال`);
  console.log('📁 محفوظ في data/questions.json');
}

main().catch(err => {
  console.error('❌ خطأ عام:', err.message);
  process.exit(1);
});
