const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  : null;

const localDbPath = path.join(__dirname, '..', 'data', 'local-db.json');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function normalizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role || 'client',
    psychologistId: user.psychologist_id || user.psychologistId || null,
    bio: user.bio || null,
    experience: user.experience !== undefined && user.experience !== null ? Number(user.experience) : 0,
    expertise: user.expertise || null,
    qualifications: user.qualifications || null,
    city: user.city || null,
    age: user.age !== undefined && user.age !== null ? Number(user.age) : null,
    created_at: user.created_at,
  };
}

async function readLocalDb() {
  try {
    const content = await fs.readFile(localDbPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function writeLocalDb(db) {
  await fs.mkdir(path.dirname(localDbPath), { recursive: true });
  await fs.writeFile(localDbPath, JSON.stringify(db, null, 2), 'utf8');
}

async function createLocalDb() {
  const now = new Date().toISOString();
  const seedDb = {
    users: [],
    psychologists: [
      {
        id: 1,
        name: 'А. Мягмар',
        specialty: 'Сэтгэл судлаач',
        focus: 'Хүүхэд, гэр бүлийн асуудал',
        rating: 4.9,
        price: 45000,
        city: 'Улаанбаатар',
        experience: 8,
        availability: ['10:00', '12:00', '14:00', '16:00'],
      },
      {
        id: 2,
        name: 'Б. Нандин',
        specialty: 'Сэтгэл зүйч',
        focus: 'Стресс, anxiety',
        rating: 4.8,
        price: 35000,
        city: 'Дархан',
        experience: 6,
        availability: ['09:00', '11:00', '13:00', '15:00'],
      },
      {
        id: 3,
        name: 'Г. Төгс',
        specialty: 'Сэтгэл зүйч',
        focus: 'Хосуудын харилцаа',
        rating: 5.0,
        price: 55000,
        city: 'Эрдэнэт',
        experience: 10,
        availability: ['11:00', '13:00', '17:00', '19:00'],
      },
    ],
    bookings: [],
    created_at: now,
  };
  await writeLocalDb(seedDb);
  return seedDb;
}

async function initDatabase() {
  if (pool) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'client',
        psychologist_id INTEGER REFERENCES psychologists(id),
        bio TEXT,
        experience INTEGER DEFAULT 0,
        expertise TEXT,
        qualifications TEXT,
        city TEXT,
        age INTEGER,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS psychologists (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        specialty TEXT NOT NULL,
        focus TEXT NOT NULL,
        rating NUMERIC(2, 1) DEFAULT 0,
        price INTEGER DEFAULT 0,
        city TEXT NOT NULL,
        experience INTEGER DEFAULT 0,
        availability JSONB NOT NULL DEFAULT '[]'::jsonb
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        psychologist_id INTEGER NOT NULL REFERENCES psychologists(id),
        user_name TEXT NOT NULL,
        user_email TEXT NOT NULL,
        date DATE NOT NULL,
        slot TEXT NOT NULL,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const existing = await pool.query('SELECT 1 FROM psychologists LIMIT 1');
    if (existing.rowCount === 0) {
      await pool.query(`
        INSERT INTO psychologists (id, name, specialty, focus, rating, price, city, experience, availability)
        VALUES
          (1, 'А. Мягмар', 'Сэтгэл судлаач', 'Хүүхэд, гэр бүлийн асуудал', 4.9, 45000, 'Улаанбаатар', 8, '["10:00", "12:00", "14:00", "16:00"]'::jsonb),
          (2, 'Б. Нандин', 'Сэтгэл зүйч', 'Стресс, anxiety', 4.8, 35000, 'Дархан', 6, '["09:00", "11:00", "13:00", "15:00"]'::jsonb),
          (3, 'Г. Төгс', 'Сэтгэл зүйч', 'Хосуудын харилцаа', 5.0, 55000, 'Эрдэнэт', 10, '["11:00", "13:00", "17:00", "19:00"]'::jsonb)
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    return;
  }

  const db = await readLocalDb();
  if (!db) {
    await createLocalDb();
  }
}

async function getLocalDb() {
  const db = await readLocalDb();
  if (!db) {
    return await createLocalDb();
  }
  return db;
}

async function findUserByEmail(email) {
  if (pool) {
    const result = await pool.query('SELECT id, name, email, phone, role, psychologist_id, bio, experience, expertise, qualifications, city, age, created_at FROM users WHERE email = $1', [email]);
    return result.rows[0] ? normalizeUser(result.rows[0]) : null;
  }

  const db = await getLocalDb();
  const user = db.users.find((user) => user.email === email) || null;
  return user ? normalizeUser(user) : null;
}

async function createUser({ name, email, phone, passwordHash, role = 'client', psychologistId = null, bio = null, experience = 0, expertise = null, qualifications = null, city = null, age = null }) {
  if (pool) {
    const result = await pool.query(
      'INSERT INTO users (name, email, phone, role, psychologist_id, bio, experience, expertise, qualifications, city, age, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id, name, email, phone, role, psychologist_id, bio, experience, expertise, qualifications, city, age, created_at',
      [name, email, phone, role, psychologistId, bio, experience, expertise, qualifications, city, age, passwordHash]
    );
    return normalizeUser(result.rows[0]);
  }

  const db = await getLocalDb();
  const id = db.users.length > 0 ? Math.max(...db.users.map((u) => u.id)) + 1 : 1;
  const user = {
    id,
    name,
    email,
    phone,
    role,
    psychologist_id: psychologistId,
    bio,
    experience,
    expertise,
    qualifications,
    city,
    age,
    created_at: new Date().toISOString(),
    password_hash: passwordHash,
  };
  db.users.push(user);
  await writeLocalDb(db);
  return normalizeUser(user);
}

async function findUserByCredentials(email, passwordHash) {
  if (pool) {
    const result = await pool.query(
      'SELECT id, name, email, phone, role, psychologist_id, bio, experience, expertise, qualifications, city, age, created_at FROM users WHERE email = $1 AND password_hash = $2',
      [email, passwordHash]
    );
    return result.rows[0] ? normalizeUser(result.rows[0]) : null;
  }

  const db = await getLocalDb();
  const user = db.users.find((user) => user.email === email && user.password_hash === passwordHash) || null;
  return user ? normalizeUser(user) : null;
}

async function updateUser(id, { name, email, phone, role, psychologistId, passwordHash, bio, experience, expertise, qualifications, city, age }) {
  if (pool) {
    const fields = [];
    const values = [];
    let idx = 1;
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }
    if (bio !== undefined) { fields.push(`bio = $${idx++}`); values.push(bio); }
    if (experience !== undefined) { fields.push(`experience = $${idx++}`); values.push(Number(experience)); }
    if (expertise !== undefined) { fields.push(`expertise = $${idx++}`); values.push(expertise); }
    if (qualifications !== undefined) { fields.push(`qualifications = $${idx++}`); values.push(qualifications); }
    if (city !== undefined) { fields.push(`city = $${idx++}`); values.push(city); }
    if (age !== undefined) { fields.push(`age = $${idx++}`); values.push(age !== null ? Number(age) : null); }
    if (role !== undefined) { fields.push(`role = $${idx++}`); values.push(role); }
    if (psychologistId !== undefined) { fields.push(`psychologist_id = $${idx++}`); values.push(psychologistId); }
    if (passwordHash !== undefined) { fields.push(`password_hash = $${idx++}`); values.push(passwordHash); }
    if (fields.length === 0) return null;
    values.push(id);
    const q = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, email, phone, role, psychologist_id, bio, experience, expertise, qualifications, city, age, created_at`;
    const result = await pool.query(q, values);
    return result.rows[0] ? normalizeUser(result.rows[0]) : null;
  }

  const db = await getLocalDb();
  const user = db.users.find((u) => u.id === Number(id));
  if (!user) return null;
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (bio !== undefined) user.bio = bio;
  if (experience !== undefined) user.experience = Number(experience);
  if (expertise !== undefined) user.expertise = expertise;
  if (qualifications !== undefined) user.qualifications = qualifications;
  if (city !== undefined) user.city = city;
  if (age !== undefined) user.age = age !== null ? Number(age) : null;
  if (role !== undefined) user.role = role;
  if (psychologistId !== undefined) user.psychologist_id = psychologistId;
  if (passwordHash !== undefined) user.password_hash = passwordHash;
  await writeLocalDb(db);
  return normalizeUser(user);
}

async function listPsychologists() {
  if (pool) {
    const result = await pool.query('SELECT id, name, specialty, focus, rating, price, city, experience, availability FROM psychologists ORDER BY id');
    return result.rows.map((row) => ({ ...row, availability: row.availability || [] }));
  }

  const db = await getLocalDb();
  return db.psychologists.map((row) => ({ ...row, availability: row.availability || [] }));
}

async function getPsychologistById(id) {
  if (pool) {
    const result = await pool.query(
      'SELECT id, name, specialty, focus, rating, price, city, experience, availability FROM psychologists WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  const db = await getLocalDb();
  return db.psychologists.find((row) => row.id === id) || null;
}

async function getBookingById(id) {
  if (pool) {
    const result = await pool.query(
      'SELECT id, psychologist_id, user_name, user_email, date, slot, notes, status, created_at FROM bookings WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  const db = await getLocalDb();
  return db.bookings.find((booking) => booking.id === id) || null;
}

async function updateBooking(id, data) {
  const booking = await getBookingById(id);
  if (!booking) {
    throw new Error('Booking not found');
  }

  const updatedDate = data.date !== undefined ? data.date : booking.date;
  const updatedSlot = data.slot !== undefined ? data.slot : booking.slot;
  const updatedNotes = data.notes !== undefined ? data.notes : booking.notes;

  if (pool) {
    const result = await pool.query(
      'UPDATE bookings SET date = $1, slot = $2, notes = $3 WHERE id = $4 RETURNING id, psychologist_id, user_name, user_email, date, slot, notes, status, created_at',
      [updatedDate, updatedSlot, updatedNotes, id]
    );
    return result.rows[0];
  }

  const db = await getLocalDb();
  const index = db.bookings.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error('Booking not found');
  }

  db.bookings[index] = {
    ...db.bookings[index],
    date: updatedDate,
    slot: updatedSlot,
    notes: updatedNotes,
  };

  await writeLocalDb(db);
  return db.bookings[index];
}

async function deleteBooking(id) {
  if (pool) {
    await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
    return;
  }

  const db = await getLocalDb();
  const index = db.bookings.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error('Booking not found');
  }

  db.bookings.splice(index, 1);
  await writeLocalDb(db);
}

async function listBookings(filter = {}) {
  if (pool) {
    let query = 'SELECT id, psychologist_id, user_name, user_email, date, slot, notes, status, created_at FROM bookings';
    const clauses = [];
    const values = [];
    if (filter.userEmail) {
      clauses.push(`user_email = $${values.length + 1}`);
      values.push(filter.userEmail);
    }
    if (filter.psychologistId) {
      clauses.push(`psychologist_id = $${values.length + 1}`);
      values.push(filter.psychologistId);
    }
    if (clauses.length) {
      query += ` WHERE ${clauses.join(' AND ')}`;
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  const db = await getLocalDb();
  return db.bookings
    .filter((booking) => {
      if (filter.userEmail && booking.user_email !== filter.userEmail) return false;
      if (filter.psychologistId && booking.psychologist_id !== filter.psychologistId) return false;
      return true;
    })
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function createBooking({ psychologistId, name, email, date, slot, notes }) {
  if (pool) {
    const result = await pool.query(
      'INSERT INTO bookings (psychologist_id, user_name, user_email, date, slot, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, psychologist_id, user_name, user_email, date, slot, notes, status, created_at',
      [psychologistId, name, email, date, slot, notes]
    );
    return result.rows[0];
  }

  const db = await getLocalDb();
  const id = db.bookings.length > 0 ? Math.max(...db.bookings.map((b) => b.id)) + 1 : 1;
  const booking = {
    id,
    psychologist_id: psychologistId,
    user_name: name,
    user_email: email,
    date,
    slot,
    notes,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  db.bookings.push(booking);
  await writeLocalDb(db);
  return booking;
}

module.exports = {
  initDatabase,
  hashPassword,
  findUserByEmail,
  createUser,
  findUserByCredentials,
  listPsychologists,
  getPsychologistById,
  getBookingById,
  listBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  updateUser,
};
