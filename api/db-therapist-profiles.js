const {
  initDatabase,
  listTherapistProfiles,
  getTherapistProfileById,
} = require('../lib/db');

async function handleTherapistProfiles(req, res) {
  try {
    await initDatabase();

    const url = new URL(req.url, `http://${req.headers.host}`);
    const match = url.pathname.match(/^\/api\/therapist-profiles\/([^/]+)$/);
    const profileId = match?.[1] || url.searchParams.get('id');
    const profile = profileId
      ? await getTherapistProfileById(profileId)
      : await listTherapistProfiles();

    if (profileId && !profile) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Therapist profile not found' }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(profile ?? []));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error.message || 'Therapist profiles unavailable' }));
  }
}

module.exports = handleTherapistProfiles;
