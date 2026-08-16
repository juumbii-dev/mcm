const crypto = require('crypto');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  : null;

let inMemoryDb = null;

const localDbPath = process.env.MINDCONNECT_DB_PATH || path.join(os.tmpdir(), 'mindconnect-local-db.json');

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
    avatar: user.avatar || null,
    gender: user.gender || null,
    profession: user.profession || null,
    maritalStatus: user.marital_status || user.maritalStatus || null,
    interests: user.interests || null,
    issues: user.issues || null,
    isActive: user.is_active !== undefined ? Boolean(user.is_active) : true,
    isAdmin: Boolean(user.is_admin || user.role === 'admin'),
    created_at: user.created_at,
  };
}

async function readLocalDb() {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  try {
    const content = await fs.readFile(localDbPath, 'utf8');
    const parsed = JSON.parse(content);
    inMemoryDb = parsed;
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    if (error.code === 'EROFS' || error.code === 'EPERM') {
      return inMemoryDb || null;
    }
    throw error;
  }
}

async function writeLocalDb(db) {
  inMemoryDb = db;

  try {
    await fs.mkdir(path.dirname(localDbPath), { recursive: true });
    await fs.writeFile(localDbPath, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    if (error.code !== 'EROFS' && error.code !== 'EPERM') {
      throw error;
    }
  }
}

async function createLocalDb() {
  const now = new Date().toISOString();
  const adminPasswordHash = hashPassword('admin123');
  const seedDb = {
    users: [
      {
        id: 1,
        name: 'Admin',
        email: 'admin@mindconnect.mn',
        phone: '',
        role: 'admin',
        psychologist_id: null,
        bio: 'Platform administrator',
        avatar: null,
        experience: 0,
        expertise: 'Admin',
        qualifications: null,
        city: null,
        age: null,
        gender: null,
        profession: null,
        marital_status: null,
        interests: null,
        issues: null,
        is_active: true,
        is_admin: true,
        created_at: now,
        password_hash: adminPasswordHash,
      },
    ],
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
        avatar TEXT,
        experience INTEGER DEFAULT 0,
        expertise TEXT,
        qualifications TEXT,
        city TEXT,
        age INTEGER,
        gender TEXT,
        profession TEXT,
        marital_status TEXT,
        interests TEXT,
        issues TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

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
            (1, 'А. Мягмар', 'Зөвлөх', 'Хүүхэд, гэр бүлийн асуудал', 4.9, 45000, 'Улаанбаатар', 8, '["10:00", "12:00", "14:00", "16:00"]'::jsonb),
              (2, 'Б. Нандин', 'Зөвлөх', 'Стресс, anxiety', 4.8, 35000, 'Дархан', 6, '["09:00", "11:00", "13:00", "15:00"]'::jsonb),
              (3, 'Г. Төгс', 'Зөвлөх', 'Хосуудын харилцаа', 5.0, 55000, 'Эрдэнэт', 10, '["11:00", "13:00", "17:00", "19:00"]'::jsonb)
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@mindconnect.mn']);
    if (adminCheck.rowCount === 0) {
      await pool.query(
        `INSERT INTO users (name, email, phone, role, psychologist_id, bio, avatar, experience, expertise, qualifications, city, age, gender, profession, marital_status, interests, issues, is_active, is_admin, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        ['Admin', 'admin@mindconnect.mn', '', 'admin', null, 'Platform administrator', null, 0, 'Admin', null, null, null, null, null, null, null, null, true, true, hashPassword('admin123')]
      );
    }

    return;
  }

  const db = await readLocalDb();
  if (!db) {
    await createLocalDb();
    return;
  }

  const hasAdmin = db.users.some((user) => user.email && user.email.toLowerCase() === 'admin@mindconnect.mn');
  if (!hasAdmin) {
    db.users.push({
      id: db.users.length ? Math.max(...db.users.map((u) => Number(u.id || 0))) + 1 : 1,
      name: 'Admin',
      email: 'admin@mindconnect.mn',
      phone: '',
      role: 'admin',
      psychologist_id: null,
      bio: 'Platform administrator',
      avatar: null,
      experience: 0,
      expertise: 'Admin',
      qualifications: null,
      city: null,
      age: null,
      gender: null,
      profession: null,
      marital_status: null,
      interests: null,
      issues: null,
      is_active: true,
      is_admin: true,
      created_at: new Date().toISOString(),
      password_hash: hashPassword('admin123'),
    });
    await writeLocalDb(db);
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
    const result = await pool.query('SELECT id, name, email, phone, role, psychologist_id, bio, avatar, experience, expertise, qualifications, city, age, gender, profession, marital_status, interests, issues, created_at FROM users WHERE email = $1', [email]);
    return result.rows[0] ? normalizeUser(result.rows[0]) : null;
  }

  const db = await getLocalDb();
  const user = db.users.find((user) => user.email === email) || null;
  return user ? normalizeUser(user) : null;
}

async function createUser({ name, email, phone, passwordHash, role = 'client', psychologistId = null, bio = null, avatar = null, experience = 0, expertise = null, qualifications = null, city = null, age = null, gender = null, profession = null, marital_status = null, interests = null, issues = null }) {
  if (pool) {
    const result = await pool.query(
      'INSERT INTO users (name, email, phone, role, psychologist_id, bio, avatar, experience, expertise, qualifications, city, age, gender, profession, marital_status, interests, issues, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING id, name, email, phone, role, psychologist_id, bio, avatar, experience, expertise, qualifications, city, age, gender, profession, marital_status, interests, issues, created_at',
      [name, email, phone, role, psychologistId, bio, avatar || null, experience, expertise, qualifications, city, age, gender, profession, marital_status, interests, issues, passwordHash]
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
    avatar: avatar || null,
    experience,
    expertise,
    qualifications,
    city,
    age,
    gender,
    profession,
    marital_status,
    interests,
    issues,
    is_active: true,
    is_admin: role === 'admin',
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
      'SELECT id, name, email, phone, role, psychologist_id, bio, avatar, experience, expertise, qualifications, city, age, gender, profession, marital_status, interests, issues, is_active, is_admin, created_at FROM users WHERE email = $1 AND password_hash = $2',
      [email, passwordHash]
    );
    const user = result.rows[0];
    if (!user || user.is_active === false) return null;
    return normalizeUser(user);
  }

  const db = await getLocalDb();
  const user = db.users.find((user) => user.email === email && user.password_hash === passwordHash) || null;
  if (!user || user.is_active === false) return null;
  return user ? normalizeUser(user) : null;
}

async function findUserById(id) {
  if (pool) {
    const result = await pool.query(
      'SELECT id, name, email, phone, role, psychologist_id, bio, avatar, experience, expertise, qualifications, city, age, gender, profession, marital_status, interests, issues, is_active, is_admin, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] ? normalizeUser(result.rows[0]) : null;
  }

  const db = await getLocalDb();
  const user = db.users.find((user) => user.id === Number(id)) || null;
  return user ? normalizeUser(user) : null;
}

async function updateUser(id, { name, email, phone, role, psychologistId, passwordHash, bio, experience, expertise, qualifications, city, age, avatar, gender, profession, marital_status, interests, issues, isActive, isAdmin }) {
  if (pool) {
    const fields = [];
    const values = [];
    let idx = 1;
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }
    if (bio !== undefined) { fields.push(`bio = $${idx++}`); values.push(bio); }
    if (avatar !== undefined) { fields.push(`avatar = $${idx++}`); values.push(avatar); }
    if (experience !== undefined) { fields.push(`experience = $${idx++}`); values.push(Number(experience)); }
    if (expertise !== undefined) { fields.push(`expertise = $${idx++}`); values.push(expertise); }
    if (qualifications !== undefined) { fields.push(`qualifications = $${idx++}`); values.push(qualifications); }
    if (city !== undefined) { fields.push(`city = $${idx++}`); values.push(city); }
    if (age !== undefined) { fields.push(`age = $${idx++}`); values.push(age !== null ? Number(age) : null); }
    if (gender !== undefined) { fields.push(`gender = $${idx++}`); values.push(gender); }
    if (profession !== undefined) { fields.push(`profession = $${idx++}`); values.push(profession); }
    if (marital_status !== undefined) { fields.push(`marital_status = $${idx++}`); values.push(marital_status); }
    if (interests !== undefined) { fields.push(`interests = $${idx++}`); values.push(interests); }
    if (issues !== undefined) { fields.push(`issues = $${idx++}`); values.push(issues); }
    if (role !== undefined) { fields.push(`role = $${idx++}`); values.push(role); }
    if (psychologistId !== undefined) { fields.push(`psychologist_id = $${idx++}`); values.push(psychologistId); }
    if (isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(Boolean(isActive)); }
    if (isAdmin !== undefined) { fields.push(`is_admin = $${idx++}`); values.push(Boolean(isAdmin)); }
    if (passwordHash !== undefined) { fields.push(`password_hash = $${idx++}`); values.push(passwordHash); }
    if (fields.length === 0) return null;
    values.push(id);
    const q = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, email, phone, role, psychologist_id, bio, avatar, experience, expertise, qualifications, city, age, gender, profession, marital_status, interests, issues, is_active, is_admin, created_at`;
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
  if (avatar !== undefined) user.avatar = avatar;
  if (experience !== undefined) user.experience = Number(experience);
  if (expertise !== undefined) user.expertise = expertise;
  if (qualifications !== undefined) user.qualifications = qualifications;
  if (city !== undefined) user.city = city;
  if (age !== undefined) user.age = age !== null ? Number(age) : null;
  if (gender !== undefined) user.gender = gender;
  if (profession !== undefined) user.profession = profession;
  if (marital_status !== undefined) user.marital_status = marital_status;
  if (interests !== undefined) user.interests = interests;
  if (issues !== undefined) user.issues = issues;
  if (role !== undefined) user.role = role;
  if (psychologistId !== undefined) user.psychologist_id = psychologistId;
  if (isActive !== undefined) user.is_active = Boolean(isActive);
  if (isAdmin !== undefined) user.is_admin = Boolean(isAdmin);
  if (passwordHash !== undefined) user.password_hash = passwordHash;
  await writeLocalDb(db);
  return normalizeUser(user);
}

async function listUsers() {
  if (pool) {
    const result = await pool.query(
      'SELECT id, name, email, phone, role, psychologist_id, bio, avatar, experience, expertise, qualifications, city, age, gender, profession, marital_status, interests, issues, is_active, is_admin, created_at FROM users ORDER BY id'
    );
    return result.rows.map((row) => normalizeUser(row));
  }

  const db = await getLocalDb();
  return db.users.map((row) => normalizeUser(row));
}

async function listPsychologists() {
  if (pool) {
    const result = await pool.query('SELECT id, name, specialty, focus, rating, price, city, experience, availability FROM psychologists ORDER BY id');
    const base = result.rows.map((row) => ({ ...row, availability: row.availability || [] }));
    const existingIds = new Set(base.map((row) => Number(row.id)));

    const counselors = await pool.query(
      `SELECT id, name, bio, expertise, city, experience, is_active, role, psychologist_id
       FROM users
       WHERE role = 'counselor'`
    );

    const dynamic = counselors.rows
      .filter((row) => row.is_active !== false)
      .filter((row) => !row.psychologist_id || !existingIds.has(Number(row.psychologist_id)))
      .map((row) => ({
        id: row.psychologist_id ? Number(row.psychologist_id) : -Number(row.id),
        name: row.name,
        specialty: 'Зөвлөх',
        focus: row.bio || row.expertise || 'Профайл мэдээлэл шинэчлэгдэж байна',
        rating: 5.0,
        price: 0,
        city: row.city || 'Улаанбаатар',
        experience: row.experience !== undefined && row.experience !== null ? Number(row.experience) : 0,
        availability: ['10:00', '12:00', '14:00', '16:00'],
      }));

    return [...base, ...dynamic];
  }

  const db = await getLocalDb();
  const base = db.psychologists.map((row) => ({ ...row, availability: row.availability || [] }));
  const existingIds = new Set(base.map((row) => Number(row.id)));
  const dynamic = db.users
    .filter((user) => user.role === 'counselor')
    .filter((user) => user.is_active !== false)
    .filter((user) => !user.psychologist_id || !existingIds.has(Number(user.psychologist_id)))
    .map((user) => ({
      id: user.psychologist_id ? Number(user.psychologist_id) : -Number(user.id),
      name: user.name,
      specialty: 'Зөвлөх',
      focus: user.bio || user.expertise || 'Профайл мэдээлэл шинэчлэгдэж байна',
      rating: 5.0,
      price: 0,
      city: user.city || 'Улаанбаатар',
      experience: user.experience !== undefined && user.experience !== null ? Number(user.experience) : 0,
      availability: ['10:00', '12:00', '14:00', '16:00'],
    }));
  return [...base, ...dynamic];
}

async function getPsychologistById(id) {
  if (pool) {
    if (Number(id) < 0) {
      const userResult = await pool.query(
        `SELECT id, name, bio, expertise, city, experience, is_active
         FROM users
         WHERE id = $1 AND role = 'counselor'`,
        [Math.abs(Number(id))]
      );
      const user = userResult.rows[0];
      if (!user || user.is_active === false) return null;
      return {
        id: -Number(user.id),
        name: user.name,
        specialty: 'Зөвлөх',
        focus: user.bio || user.expertise || 'Профайл мэдээлэл шинэчлэгдэж байна',
        rating: 5.0,
        price: 0,
        city: user.city || 'Улаанбаатар',
        experience: user.experience !== undefined && user.experience !== null ? Number(user.experience) : 0,
        availability: ['10:00', '12:00', '14:00', '16:00'],
      };
    }

    const result = await pool.query(
      'SELECT id, name, specialty, focus, rating, price, city, experience, availability FROM psychologists WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  const db = await getLocalDb();
  if (Number(id) < 0) {
    const user = db.users.find((row) => row.id === Math.abs(Number(id)) && row.role === 'counselor');
    if (!user || user.is_active === false) return null;
    return {
      id: -Number(user.id),
      name: user.name,
      specialty: 'Зөвлөх',
      focus: user.bio || user.expertise || 'Профайл мэдээлэл шинэчлэгдэж байна',
      rating: 5.0,
      price: 0,
      city: user.city || 'Улаанбаатар',
      experience: user.experience !== undefined && user.experience !== null ? Number(user.experience) : 0,
      availability: ['10:00', '12:00', '14:00', '16:00'],
    };
  }
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

async function deleteUser(id) {
  if (pool) {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }

  const db = await getLocalDb();
  const index = db.users.findIndex((user) => user.id === Number(id));
  if (index === -1) {
    return false;
  }

  db.users.splice(index, 1);
  await writeLocalDb(db);
  return true;
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
  listUsers,
  getPsychologistById,
  getBookingById,
  listBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  findUserById,
  updateUser,
  deleteUser,
};
