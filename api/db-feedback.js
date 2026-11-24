const { initDatabase, findUserById, createClientFeedback } = require('../lib/db');

function getTokenUserId(req) {
  const header = req.headers && (req.headers.authorization || req.headers.Authorization) || '';
  const cookie = String(req.headers.cookie || '').match(/(?:^|;\s*)app-session=([^;]+)/);
  const match = String(header).match(/^Bearer\s+token-(\d+)$/) ||
    (cookie && String(decodeURIComponent(cookie[1])).match(/^token-(\d+)$/));
  return match ? Number(match[1]) : null;
}

async function handleFeedback(req, res) {
  await initDatabase();
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const clientId = getTokenUserId(req);
  if (!clientId || !(await findUserById(clientId))) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Нэвтрэх шаардлагатай' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', async () => {
    try {
      const data = JSON.parse(body || '{}');
      const rating = Number(data.rating);
      const comment = String(data.comment || '').trim();
      if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 3) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Үнэлгээ болон санал шаардлагатай' }));
        return;
      }

      const feedback = await createClientFeedback({
        therapistId: data.therapistId ? Number(data.therapistId) : null,
        clientId,
        rating,
        comment,
      });
      res.statusCode = 201;
      res.end(JSON.stringify({ feedback }));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error.message || 'Feedback хадгалж чадсангүй' }));
    }
  });
}

module.exports = handleFeedback;
