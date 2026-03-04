const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h2 style="font-family:sans-serif;text-align:center;margin-top:100px">404 - الصفحة غير موجودة</h2>');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
}

function serveJSON(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ===================== API ROUTES =====================

  // GET /api/categories - get all categories
  if (pathname === '/api/categories' && req.method === 'GET') {
    const data = JSON.parse(fs.readFileSync('./data/questions.json', 'utf8'));
    const cats = data.categories.map(c => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      questionCount: {
        easy: c.questions.easy.length,
        medium: c.questions.medium.length,
        hard: c.questions.hard.length
      }
    }));
    return serveJSON(res, cats);
  }

  // GET /api/questions/:categoryId - get questions for a category (randomized)
  if (pathname.startsWith('/api/questions/') && req.method === 'GET') {
    const catId = pathname.split('/')[3];
    const data = JSON.parse(fs.readFileSync('./data/questions.json', 'utf8'));
    const cat = data.categories.find(c => c.id === catId);
    if (!cat) return serveJSON(res, { error: 'Category not found' }, 404);

    // Pick 2 random questions from each difficulty
    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
    const result = {
      easy:   shuffle(cat.questions.easy).slice(0, 8),
      medium: shuffle(cat.questions.medium).slice(0, 8),
      hard:   shuffle(cat.questions.hard).slice(0, 8),
    };
    return serveJSON(res, result);
  }

  // POST /api/admin/question - add a question (admin)
  if (pathname === '/api/admin/question' && req.method === 'POST') {
    const body = await readBody(req);
    const { categoryId, difficulty, question, answer } = body;
    if (!categoryId || !difficulty || !question || !answer) {
      return serveJSON(res, { error: 'Missing fields' }, 400);
    }
    const dataPath = './data/questions.json';
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const cat = data.categories.find(c => c.id === categoryId);
    if (!cat) return serveJSON(res, { error: 'Category not found' }, 404);
    cat.questions[difficulty].push({ q: question, a: answer });
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return serveJSON(res, { success: true });
  }

  // DELETE /api/admin/question - delete a question
  if (pathname === '/api/admin/question' && req.method === 'DELETE') {
    const body = await readBody(req);
    const { categoryId, difficulty, index } = body;
    const dataPath = './data/questions.json';
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const cat = data.categories.find(c => c.id === categoryId);
    if (!cat) return serveJSON(res, { error: 'Category not found' }, 404);
    cat.questions[difficulty].splice(index, 1);
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return serveJSON(res, { success: true });
  }

  // ===================== STATIC FILES =====================

  // Root → index.html
  if (pathname === '/') {
    return serveFile(res, path.join(__dirname, 'public', 'index.html'));
  }

  // Admin panel
  if (pathname === '/admin' || pathname === '/admin/') {
    return serveFile(res, path.join(__dirname, 'admin', 'index.html'));
  }

  // Static files from public/
  const filePath = path.join(__dirname, 'public', pathname);
  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log('\n');
  console.log('  ██╗  ██╗ ██████╗ ███╗   ██╗ █████╗ ');
  console.log('  ██║ ██╔╝██╔═══██╗████╗  ██║██╔══██╗');
  console.log('  █████╔╝ ██║   ██║██╔██╗ ██║███████║');
  console.log('  ██╔═██╗ ██║   ██║██║╚██╗██║██╔══██║');
  console.log('  ██║  ██╗╚██████╔╝██║ ╚████║██║  ██║');
  console.log('  ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝');
  console.log('  ██████╗  █████╗ ███╗   ███╗███████╗███████╗');
  console.log('  ██╔════╝██╔══██╗████╗ ████║██╔════╝██╔════╝');
  console.log('  ██║     ███████║██╔████╔██║█████╗  ███████╗');
  console.log('  ██║     ██╔══██║██║╚██╔╝██║██╔══╝  ╚════██║');
  console.log('  ╚██████╗██║  ██║██║ ╚═╝ ██║███████╗███████║');
  console.log('\n');
  console.log(`  🚀 السيرفر شغال: http://localhost:${PORT}`);
  console.log(`  🔧 لوحة الأدمين: http://localhost:${PORT}/admin`);
  console.log('  ❌ إيقاف: Ctrl + C\n');
});
