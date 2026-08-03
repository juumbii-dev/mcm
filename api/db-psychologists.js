const { initDatabase, listPsychologists, getPsychologistById } = require('../lib/db');

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
