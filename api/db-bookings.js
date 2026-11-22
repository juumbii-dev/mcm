const { initDatabase, listBookings, createBooking, updateBooking, deleteBooking } = require('../lib/db');

async function handleBookings(req, res) {
  try {
    await initDatabase();
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error.message || 'Database init failed' }));
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const bookingId = url.pathname.split('/').pop();

  if (req.method === 'GET') {
    const userEmail = url.searchParams.get('userEmail');
    const psychologistId = url.searchParams.get('psychologistId');
    const filter = {};
    if (userEmail) filter.userEmail = userEmail;
    if (psychologistId) filter.psychologistId = Number(psychologistId);
    const bookings = await listBookings(filter);
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
        const isFigmaBooking = data.therapist !== undefined || data.time !== undefined;
        const booking = await createBooking({
          psychologistId: Number(data.psychologistId ?? data.therapist),
          name: data.name || 'Зочин',
          email: data.email || '',
          date: data.date,
          slot: data.slot ?? data.time,
          notes: data.notes ?? data.note ?? '',
          format: data.format || null,
          paymentMethod: data.paymentMethod || null,
          meetingLink: data.meetingLink || null,
        });
        res.statusCode = 201;
        res.end(JSON.stringify(isFigmaBooking ? { ...booking, bookingId: booking.id } : booking));
      } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message || 'Booking failed' }));
      }
    });
    return;
  }

  if (req.method === 'PUT' && bookingId && !isNaN(Number(bookingId))) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const booking = await updateBooking(Number(bookingId), {
          date: data.date,
          slot: data.slot,
          notes: data.notes,
          status: data.status,
          format: data.format,
          paymentMethod: data.paymentMethod,
          meetingLink: data.meetingLink,
        });
        res.statusCode = 200;
        res.end(JSON.stringify(booking));
      } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message || 'Booking update failed' }));
      }
    });
    return;
  }

  if (req.method === 'DELETE' && bookingId && !isNaN(Number(bookingId))) {
    try {
      await deleteBooking(Number(bookingId));
      res.statusCode = 204;
      res.end();
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error.message || 'Booking delete failed' }));
    }
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

module.exports = handleBookings;
