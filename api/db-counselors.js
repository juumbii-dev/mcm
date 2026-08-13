const { initDatabase, listCounselors } = require('../lib/db');

async function handleCounselors(req, res) {
  await initDatabase();
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const counselors = await listCounselors();
  res.statusCode = 200;
  res.end(JSON.stringify(counselors));
}

module.exports = handleCounselors;
