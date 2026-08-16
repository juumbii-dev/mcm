const { initDatabase, findUserById, listUsers, updateUser, deleteUser } = require('../lib/db');

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
    res.statusCode = 200;
    res.end(JSON.stringify({ users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isAdmin: user.isAdmin,
    })) }));
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
