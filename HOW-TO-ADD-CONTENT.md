# 🎮 كيف تضيف فئات وأسئلة جديدة

## الطريقة التلقائية (عبر AI) 🤖

### الخطوات:
```
node generate-content.js
```

هذا السكريبت يتصل بـ Claude AI ويولد:
- **30 فئة** تلقائياً
- **8+ أسئلة** لكل مستوى صعوبة (سهل / متوسط / صعب)
- يحفظ كل شي في `data/questions.json`

> ⚠️ يحتاج اتصال إنترنت وـ API key من Anthropic
> احصل عليه من: https://console.anthropic.com

### إضافة API Key:
```
# Windows
set ANTHROPIC_API_KEY=sk-ant-xxxx

# Mac/Linux  
export ANTHROPIC_API_KEY=sk-ant-xxxx
```

---

## الطريقة اليدوية ✏️

افتح `data/questions.json` وأضف أسئلة بهذا الشكل:
```json
{
  "id": "mycat",
  "name": "اسم الفئة",
  "emoji": "🎯",
  "questions": {
    "easy":   [{"q": "السؤال؟", "a": "الجواب"}],
    "medium": [{"q": "السؤال؟", "a": "الجواب"}],
    "hard":   [{"q": "السؤال؟", "a": "الجواب"}]
  }
}
```

---

## إضافة صور للفئات الجديدة 🖼️

افتح `public/js/cats-images.js` وأضف:
```js
mycat: 'https://images.unsplash.com/photo-XXXX?w=800&q=85',
```
