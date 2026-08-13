const { initDatabase, hashPassword, findUserByEmail, createUser, findUserByCredentials, updateUser } = require('../lib/db');

async function handleAuth(req, res) {
  await initDatabase();
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', async () => {
    try {
      const data = JSON.parse(body);
      console.log('AUTH_PAYLOAD', data && data.action);
      if (data.action === 'register') {
        const { name, email, phone, password, role, psychologistId } = data;
        if (!name || !email || !password) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Name, email and password are required' }));
          return;
        }

        const normalizedEmail = email.toLowerCase();
        const existing = await findUserByEmail(normalizedEmail);
        if (existing) {
          res.statusCode = 409;
          res.end(JSON.stringify({ error: 'User already exists' }));
          return;
        }

        const user = await createUser({
          name,
          email: normalizedEmail,
          phone: phone || '',
          role: role || 'client',
          psychologistId: role === 'counselor' ? Number(psychologistId) || null : null,
          passwordHash: hashPassword(password),
        });

        res.statusCode = 201;
        res.end(JSON.stringify({ user, token: `token-${user.id}` }));
        return;
      }

      if (data.action === 'login') {
        const normalizedEmail = data.email.toLowerCase();
        const user = await findUserByCredentials(normalizedEmail, hashPassword(data.password));
        if (!user) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
          return;
        }

        res.statusCode = 200;
        res.end(JSON.stringify({ user, token: `token-${user.id}` }));
        return;
      }

      if (data.action === 'update') {
        const { id, name, email, phone, role, psychologistId, password } = data;
        if (!id) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'User id required' }));
          return;
        }
        const update = {};
        if (name !== undefined) update.name = name;
        if (email !== undefined) update.email = email.toLowerCase();
        if (phone !== undefined) update.phone = phone;
        if (role !== undefined) update.role = role;
        if (psychologistId !== undefined) update.psychologistId = role === 'counselor' ? Number(psychologistId) || null : null;
        if (password) update.passwordHash = hashPassword(password);

        const user = await updateUser(Number(id), update);
        if (!user) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'User not found' }));
          return;
        }

        res.statusCode = 200;
        res.end(JSON.stringify({ user, token: `token-${user.id}` }));
        return;
      }

      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid action' }));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error.message || 'Database error' }));
    }
  });
}

module.exports = handleAuth;
