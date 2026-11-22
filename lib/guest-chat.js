const crypto = require('crypto');

function getGuestSecret() {
  const secret = process.env.CHAT_GUEST_SECRET || process.env.ABLY_API_KEY;
  if (!secret) throw new Error('CHAT_GUEST_SECRET эсвэл ABLY_API_KEY тохируулагдаагүй байна');
  return secret;
}

function sign(value) {
  return crypto.createHmac('sha256', getGuestSecret()).update(value).digest('base64url');
}

function createGuestToken(conversationId) {
  const expiresAt = Date.now() + 2 * 60 * 60 * 1000;
  const payload = `${conversationId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function verifyGuestToken(token, conversationId) {
  if (!token) return false;
  const [tokenConversationId, expiresAt, signature] = String(token).split('.');
  const payload = `${tokenConversationId}.${expiresAt}`;
  if (!tokenConversationId || !expiresAt || !signature || Number(tokenConversationId) !== Number(conversationId) || Number(expiresAt) < Date.now()) return false;
  const expected = sign(payload);
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

module.exports = { createGuestToken, verifyGuestToken };
