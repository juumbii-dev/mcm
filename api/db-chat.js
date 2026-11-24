const {
  initDatabase,
  findUserById,
  listConversations,
  createConversation,
  listChatMessages,
  createChatMessage,
} = require('../lib/db');
const { verifyGuestToken } = require('../lib/guest-chat');

function getTokenUserId(req) {
  const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization) || '';
  const cookie = String(req.headers.cookie || '').match(/(?:^|;\s*)app-session=([^;]+)/);
  const match = String(authHeader).match(/^Bearer\s+token-(\d+)$/) ||
    (cookie && String(decodeURIComponent(cookie[1])).match(/^token-(\d+)$/));
  return match ? Number(match[1]) : null;
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function getGuestToken(req) {
  const header = req.headers && (req.headers['x-guest-token'] || req.headers['X-Guest-Token']);
  const cookie = String(req.headers.cookie || '').match(/(?:^|;\s*)guest-chat-token=([^;]+)/);
  return String(header || (cookie && decodeURIComponent(cookie[1])) || '');
}

async function handleChat(req, res) {
  await initDatabase();
  const userId = getTokenUserId(req);
  const url = new URL(req.url, 'http://localhost');
  const conversationId = url.pathname.match(/^\/api\/chat\/conversations\/(\d+)$/)?.[1];

  if (req.method === 'GET' && !conversationId) {
    if (!userId || !(await findUserById(userId))) {
      sendJson(res, 401, { error: 'Зөвлөхийн inbox-д нэвтрэх шаардлагатай' });
      return;
    }
    sendJson(res, 200, { conversations: await listConversations(userId) });
    return;
  }

  if (req.method === 'GET' && conversationId) {
    const guest = !userId && verifyGuestToken(getGuestToken(req), conversationId);
    if ((!userId || !(await findUserById(userId))) && !guest) {
      sendJson(res, 401, { error: 'Нэвтрэх шаардлагатай' });
      return;
    }
    const result = await listChatMessages(Number(conversationId), userId, {
      allowGuest: guest,
    });
    if (!result) {
      sendJson(res, 404, { error: 'Яриа олдсонгүй' });
      return;
    }
    sendJson(res, 200, result);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/chat/conversations') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const therapistId = Number(data.therapistId);
        const clientId = data.clientId === undefined ? userId : Number(data.clientId);
        if (!therapistId) {
          sendJson(res, 400, { error: 'Зөвлөхийн мэдээлэл дутуу байна' });
          return;
        }
        const conversation = await createConversation({ therapistId, clientId });
        const result = { conversation };
        if (!clientId) {
          result.guestToken = require('../lib/guest-chat').createGuestToken(conversation.id);
        }
        sendJson(res, 201, result);
      } catch (error) {
        sendJson(res, 500, { error: error.message || 'Яриа үүсгэхэд алдаа гарлаа' });
      }
    });
    return;
  }

  if (req.method === 'POST' && conversationId) {
    const guest = !userId && verifyGuestToken(getGuestToken(req), conversationId);
    if ((!userId || !(await findUserById(userId))) && !guest) {
      sendJson(res, 401, { error: 'Realtime chat ашиглана уу' });
      return;
    }
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const text = String(data.body || '').trim();
        const conversation = await listChatMessages(Number(conversationId), userId, {
          allowGuest: guest,
        });
        if (!conversation) {
          sendJson(res, 404, { error: 'Яриа олдсонгүй' });
          return;
        }
        if (!text) {
          sendJson(res, 400, { error: 'Мессеж хоосон байна' });
          return;
        }
        const message = await createChatMessage({
          conversationId: Number(conversationId),
          senderId: guest ? null : userId,
          body: text,
        });
        sendJson(res, 201, { message });
      } catch (error) {
        sendJson(res, 500, { error: error.message || 'Мессеж илгээхэд алдаа гарлаа' });
      }
    });
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
}

module.exports = handleChat;
