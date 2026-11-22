const http = require('http');
const fs = require('fs');
const path = require('path');

function loadLocalEnvironment() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

loadLocalEnvironment();

const { initDatabase } = require('./lib/db');
const handleAuth = require('./api/db-auth');
const handleAdmin = require('./api/db-admin');
const handleBookings = require('./api/db-bookings');
const handlePsychologists = require('./api/db-psychologists');
const handleTherapistProfiles = require('./api/db-therapist-profiles');
const handleChat = require('./api/db-chat');
const handleAblyToken = require('./api/ably-token');

const port = process.env.PORT || 8000;
const root = __dirname;

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function serveFile(res, filePath, statusCode = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(statusCode, { 'Content-Type': contentType });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/auth') {
    await handleAuth(req, res);
    return;
  }

  if (url.pathname === '/api/admin/users') {
    await handleAdmin(req, res);
    return;
  }

  if (url.pathname === '/api/bookings' || url.pathname.startsWith('/api/bookings/')) {
    await handleBookings(req, res);
    return;
  }

  if (url.pathname === '/api/psychologists' || url.pathname.startsWith('/api/psychologists/')) {
    await handlePsychologists(req, res);
    return;
  }

  if (url.pathname === '/api/therapist-profiles' || url.pathname.startsWith('/api/therapist-profiles/')) {
    await handleTherapistProfiles(req, res);
    return;
  }

  if (url.pathname === '/api/chat' || url.pathname.startsWith('/api/chat/')) {
    await handleChat(req, res);
    return;
  }

  if (url.pathname === '/api/ably/token') {
    await handleAblyToken(req, res);
    return;
  }

  const routeAliases = {
    '/chat': '/pages/chat.html',
    '/therapist-login': '/pages/therapist-login.html',
    '/therapist-signup': '/pages/therapist-signup.html',
    '/therapist/profile': '/pages/therapist-profile.html',
    '/therapist/messages': '/pages/therapist-messages.html',
    '/admin-dashboard': '/pages/admin-dashboard.html',
    '/admin': '/pages/admin.html',
  };
  const chatMatch = url.pathname.match(/^\/chat\/(\d+)$/);
  const normalizedPath = chatMatch
    ? '/pages/chat-thread.html'
    : (routeAliases[url.pathname] || (url.pathname === '/' ? '/index.html' : url.pathname));
  const filePath = path.join(root, normalizedPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(res, filePath);
    return;
  }

  if (filePath.endsWith('.html') || filePath.endsWith('.css') || filePath.endsWith('.js')) {
    serveFile(res, path.join(root, 'index.html'));
    return;
  }

  if (!url.pathname.startsWith('/api/')) {
    serveFile(res, path.join(root, 'pages', '404.html'), 404);
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(port, async () => {
  try {
    await initDatabase();
    console.log(`Server running at http://localhost:${port}`);
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    console.log(`Server running at http://localhost:${port}`);
  }
});
