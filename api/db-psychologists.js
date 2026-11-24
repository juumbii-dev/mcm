const {
  initDatabase,
  findUserById,
  listPsychologists,
  getPsychologistById,
  updatePsychologistProfile,
} = require('../lib/db');

function getTokenUserId(req) {
  const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization) || '';
  const match = String(authHeader).match(/^Bearer\s+token-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

async function handlePsychologists(req, res) {
  await initDatabase();
  const { pathname } = new URL(req.url, 'http://localhost');

  if (pathname === '/api/psychologists') {
    const psychologists = await listPsychologists();
    res.statusCode = 200;
    res.end(JSON.stringify(psychologists));
    return;
  }

  const match = pathname.match(/^\/api\/psychologists\/([^/]+)$/);
  if (match) {
    const id = Number(match[1]);
    if (req.method === 'PUT') {
      const userId = getTokenUserId(req);
      const user = userId ? await findUserById(userId) : null;
      if (!user || (!user.isAdmin && Number(user.psychologist_id) !== id)) {
        res.statusCode = user ? 403 : 401;
        res.end(JSON.stringify({ error: 'Энэ профайлыг өөрчлөх эрхгүй байна' }));
        return;
      }

      try {
        const data = await readBody(req);
        const psychologist = await updatePsychologistProfile(id, data);
        if (!psychologist) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Psychologist not found' }));
          return;
        }
        res.statusCode = 200;
        res.end(JSON.stringify({ psychologist }));
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: error.message || 'Invalid profile data' }));
      }
      return;
    }

    const psychologist = await getPsychologistById(id);
    if (!psychologist) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Psychologist not found' }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify(psychologist));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not found' }));
}

module.exports = handlePsychologists;
