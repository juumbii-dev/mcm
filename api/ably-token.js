const { findUserById, listConversations } = require('../lib/db');
const { verifyGuestToken } = require('../lib/guest-chat');

function getTokenUserId(req) {
  const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization) || '';
  const match = String(authHeader).match(/^Bearer\s+token-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

async function requestAblyToken(conversationId, userId) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey || !apiKey.includes(':')) {
    throw new Error('ABLY_API_KEY тохируулагдаагүй байна');
  }

  const [keyName, keySecret] = apiKey.split(':', 2);
  const response = await fetch(`https://rest.ably.io/keys/${encodeURIComponent(keyName)}/requestToken`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyName}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      keyName,
      clientId: `mindconnect-user-${userId}`,
      timestamp: Date.now(),
      capability: JSON.stringify({
        [`mindconnect:chat:${conversationId}`]: ['publish', 'subscribe', 'presence'],
      }),
      ttl: 60 * 60 * 1000,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Ably token хүсэлт амжилтгүй боллоо (${response.status}): ${details}`);
  }
  return response.json();
}

module.exports = async function handleAblyToken(req, res) {
  try {
    const userId = getTokenUserId(req);
    const requestUrl = new URL(req.url, 'http://localhost');
    const conversationId = Number(requestUrl.searchParams.get('conversationId'));
    const guestToken = req.headers && (req.headers['x-guest-chat-token'] || req.headers['X-Guest-Chat-Token']);
    if (!conversationId || (!userId && !verifyGuestToken(guestToken, conversationId))) {
      sendJson(res, 401, { error: 'Нэвтрэх эсвэл guest chat session шаардлагатай' });
      return;
    }

    await require('../lib/db').initDatabase();
    if (userId && !(await findUserById(userId))) {
      sendJson(res, 401, { error: 'Хэрэглэгч олдсонгүй' });
      return;
    }

    if (userId) {
      const conversations = await listConversations(userId);
      if (!conversations.some((conversation) => Number(conversation.id) === conversationId)) {
        sendJson(res, 403, { error: 'Энэ chat session-д хандах эрхгүй байна' });
        return;
      }
    }

    sendJson(res, 200, await requestAblyToken(conversationId, userId || `guest-${conversationId}`));
  } catch (error) {
    sendJson(res, 503, { error: error.message || 'Ably token үүсгэж чадсангүй' });
  }
};
