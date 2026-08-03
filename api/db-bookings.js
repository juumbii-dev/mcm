const { initDatabase, listBookings, createBooking } = require('../lib/db');

async function handleBookings(req, res) {
  await initDatabase();

  if (req.method === 'GET') {
    const bookings = await listBookings();
    res.statusCode = 200;
    res.end(JSON.stringify(bookings));
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const booking = await createBooking({
          psychologistId: Number(data.psychologistId),
          name: data.name,
          email: data.email,
          slot: data.slot,
          notes: data.notes || '',
        });
        res.statusCode = 201;
        res.end(JSON.stringify(booking));
      } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message || 'Booking failed' }));
      }
    });
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

module.exports = handleBookings;
