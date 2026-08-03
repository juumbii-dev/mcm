const { initDatabase, hashPassword, findUserByEmail, createUser, findUserByCredentials } = require('../lib/db');

async function handleAuth(req, res) {
  await initDatabase();
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', async () => {
    try {
      const data = JSON.parse(body);
      if (data.action === 'register') {
        const { name, email, phone, password } = data;
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

      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid action' }));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error.message || 'Database error' }));
    }
  });
}

module.exports = handleAuth;
