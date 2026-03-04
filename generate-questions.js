// ============================================
// Kona Games - Question Generator using Claude API
// شغّل: node generate-questions.js
// ============================================

const https = require('https');
const fs = require('fs');

const CATEGORIES = [
  { id: 'geography',  name: 'جغرافيا',           emoji: '🌍' },
  { id: 'sports',     name: 'رياضة',              emoji: '⚽' },
  { id: 'culture',    name: 'ثقافة عامة',          emoji: '🧠' },
  { id: 'history',    name: 'تاريخ',              emoji: '📜' },
  { id: 'movies',     name: 'أفلام ومسلسلات',     emoji: '🎬' },
  { id: 'science',    name: 'علوم وتقنية',         emoji: '🔬' },
  { id: 'religion',   name: 'دين',                emoji: '🕌' },
  { id: 'food',       name: 'طعام',               emoji: '🍕' },
  { id: 'music',      name: 'موسيقى',             emoji: '🎵' },
  { id: 'gaming',     name: 'ألعاب',              emoji: '🎮' },
  { id: 'art',        name: 'فن ورسم',            emoji: '🎨' },
  { id: 'nature',     name: 'طبيعة',              emoji: '🌿' },
];

const TARGET_PER_LEVEL = 30; // 30 سؤال لكل مستوى = 90 سؤال لكل فئة

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY || ''
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.content[0].text);
        } catch(e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function generateForCategory(cat) {
  console.log(`\n⏳ جاري توليد أسئلة: ${cat.name}...`);

  const prompt = `أنت مساعد لتوليد أسئلة تريفيا عربية للعبة Kona Games.

المطلوب: اكتب ${TARGET_PER_LEVEL} سؤال لكل مستوى (سهل، متوسط، صعب) لفئة "${cat.name}".

القواعد:
- الأسئلة باللغة العربية الفصحى المبسطة
- الأسئلة ممتعة ومتنوعة وغير مكررة
- السهل: أسئلة يعرفها الجميع
- المتوسط: تحتاج تفكير بسيط
- الصعب: معلومات أعمق
- الجواب قصير وواضح

أعطني النتيجة JSON فقط بدون أي نص إضافي، بهذا الشكل بالضبط:
{
  "easy": [
    {"q": "السؤال؟", "a": "الجواب"},
    ...
  ],
  "medium": [...],
  "hard": [...]
}`;

  try {
    const response = await callClaude(prompt);
    // Extract JSON
    const match = response.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found');
    const data = JSON.parse(match[0]);
    console.log(`  ✅ سهل: ${data.easy?.length || 0} | متوسط: ${data.medium?.length || 0} | صعب: ${data.hard?.length || 0}`);
    return data;
  } catch(e) {
    console.error(`  ❌ خطأ في ${cat.name}:`, e.message);
    return { easy: [], medium: [], hard: [] };
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('🚀 Kona Games - Question Generator');
  console.log('====================================');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY غير موجود!');
    console.log('');
    console.log('الحل: افتح Command Prompt وشغّل:');
    console.log('  set ANTHROPIC_API_KEY=your_key_here');
    console.log('  node generate-questions.js');
    process.exit(1);
  }

  // Load existing questions
  const existingData = JSON.parse(fs.readFileSync('./data/questions.json', 'utf8'));

  for (const cat of CATEGORIES) {
    const newQs = await generateForCategory(cat);
    const existing = existingData.categories.find(c => c.id === cat.id);

    if (existing) {
      // Merge: add new questions to existing ones
      existing.questions.easy   = [...existing.questions.easy,   ...(newQs.easy   || [])];
      existing.questions.medium = [...existing.questions.medium, ...(newQs.medium || [])];
      existing.questions.hard   = [...existing.questions.hard,   ...(newQs.hard   || [])];
    }

    // Wait 1 second between calls to avoid rate limits
    await sleep(1000);
  }

  // Save
  fs.writeFileSync('./data/questions.json', JSON.stringify(existingData, null, 2));
  console.log('\n\n✅ تم! الأسئلة محفوظة في data/questions.json');

  // Summary
  console.log('\n📊 الإحصائيات:');
  existingData.categories.forEach(cat => {
    const total = cat.questions.easy.length + cat.questions.medium.length + cat.questions.hard.length;
    console.log(`  ${cat.emoji} ${cat.name}: ${total} سؤال`);
  });
}

main().catch(console.error);
