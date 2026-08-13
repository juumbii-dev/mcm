const http = require('http');
const fs = require('fs');
const path = require('path');
const { initDatabase } = require('./lib/db');
const handleAuth = require('./api/db-auth');
const handleBookings = require('./api/db-bookings');
const handlePsychologists = require('./api/db-psychologists');

const port = process.env.PORT || 8000;
const root = __dirname;

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function serveFile(res, filePath) {
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
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/auth') {
    await handleAuth(req, res);
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

  const normalizedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.join(root, normalizedPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(res, filePath);
    return;
  }

  if (filePath.endsWith('.html') || filePath.endsWith('.css') || filePath.endsWith('.js')) {
    serveFile(res, path.join(root, 'index.html'));
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
