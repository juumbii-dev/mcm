const { initDatabase, findUserById, listUsers, listPsychologists, updatePsychologist, updateUser, deleteUser, createUser, hashPassword, findUserByEmail } = require('../lib/db');

const PSYCHOLOGIST_STATUSES = ['pending', 'needs-info', 'approved', 'rejected'];

async function handleAdmin(req, res) {
  await initDatabase();

  if (req.method === 'GET') {
    const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization) || '';
    const tokenMatch = (authHeader || '').toString().match(/^Bearer\s+token-(\d+)$/);
    if (!tokenMatch) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Unauthorized: missing or invalid token' }));
      return;
    }

    const currentUser = await findUserById(Number(tokenMatch[1]));
    if (!currentUser || !currentUser.isAdmin) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'Forbidden: admin access required' }));
      return;
    }

    const users = await listUsers();
    const counselors = await listPsychologists({ includeInactive: true });
    res.statusCode = 200;
    res.end(JSON.stringify({ users, counselors }));
    return;
  }

  if (req.method === 'POST') {
    const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization) || '';
    const tokenMatch = (authHeader || '').toString().match(/^Bearer\s+token-(\d+)$/);
    if (!tokenMatch) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Unauthorized: missing or invalid token' }));
      return;
    }

    const currentUser = await findUserById(Number(tokenMatch[1]));
    if (!currentUser || !currentUser.isAdmin) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'Forbidden: admin access required' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        if (data.action === 'createAdmin') {
          const name = String(data.name || '').trim();
          const email = String(data.email || '').trim().toLowerCase();
          const password = String(data.password || '');
          if (!name || !email || password.length < 8) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Нэр, имэйл болон хамгийн багадаа 8 тэмдэгттэй нууц үг шаардлагатай' }));
            return;
          }
          if (await findUserByEmail(email)) {
            res.statusCode = 409;
            res.end(JSON.stringify({ error: 'Энэ имэйлээр account бүртгэлтэй байна' }));
            return;
          }
          const user = await createUser({
            name,
            email,
            role: 'admin',
            isActive: true,
            isAdmin: true,
            passwordHash: hashPassword(password),
          });
          res.statusCode = 201;
          res.end(JSON.stringify({ ok: true, user }));
          return;
        }

        if (data.action === 'changePassword') {
          const targetId = Number(data.id);
          const newPassword = typeof data.newPassword === 'string' ? data.newPassword : '';
          if (!targetId || newPassword.length < 8 || newPassword.length > 72) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Хэрэглэгчийн дугаар болон 8-72 тэмдэгттэй шинэ нууц үг шаардлагатай' }));
            return;
          }
          const user = await updateUser(targetId, { passwordHash: hashPassword(newPassword) });
          if (!user) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Хэрэглэгч олдсонгүй' }));
            return;
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, user }));
          return;
        }

        if (data.psychologistId !== undefined) {
          const status = data.status === undefined ? undefined : String(data.status);
          if (status !== undefined && !PSYCHOLOGIST_STATUSES.includes(status)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid status' }));
            return;
          }
          const psychologist = await updatePsychologist(data.psychologistId, {
            status,
            isVisible: data.isVisible,
          });
          if (!psychologist) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Counselor not found' }));
            return;
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, counselor: psychologist }));
          return;
        }

        const userId = Number(data.id);
        if (!userId) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'User id required' }));
          return;
        }

        const update = {};
        if (data.name !== undefined) update.name = String(data.name).trim();
        if (data.email !== undefined) update.email = String(data.email).trim().toLowerCase();
        if (data.role !== undefined) update.role = data.role;
        if (data.isActive !== undefined) update.isActive = Boolean(data.isActive);
        if (data.isAdmin !== undefined) update.isAdmin = Boolean(data.isAdmin);

        const user = await updateUser(userId, update);
        if (!user) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'User not found' }));
          return;
        }

        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true, user }));
      } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message || 'Admin update failed' }));
      }
    });
    return;
  }

  if (req.method === 'DELETE') {
    const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization) || '';
    const tokenMatch = (authHeader || '').toString().match(/^Bearer\s+token-(\d+)$/);
    if (!tokenMatch) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Unauthorized: missing or invalid token' }));
      return;
    }

    const currentUser = await findUserById(Number(tokenMatch[1]));
    if (!currentUser || !currentUser.isAdmin) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'Forbidden: admin access required' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const userId = Number(data.id);
        if (!userId) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'User id required' }));
          return;
        }

        const deleted = await deleteUser(userId);
        if (!deleted) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'User not found' }));
          return;
        }

        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true, deleted: true }));
      } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message || 'Admin delete failed' }));
      }
    });
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

module.exports = handleAdmin;
