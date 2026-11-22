(function () {
  const apiBase = window.location.origin === 'null' || window.location.origin === 'file:' ? 'http://localhost:8000' : window.location.origin;
  const auth = () => {
    try { return JSON.parse(localStorage.getItem('mindconnect-auth') || 'null'); } catch { return null; }
  };
  const token = () => auth()?.token;
  const request = async (path, options = {}) => {
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Хүсэлт амжилтгүй боллоо');
    return data;
  };

  const onboarding = document.getElementById('therapist-onboarding');
  if (onboarding) {
    let step = 1;
    const steps = [...onboarding.querySelectorAll('[data-onboarding-step]')];
    const progress = onboarding.querySelector('#onboarding-progress');
    const next = onboarding.querySelector('#onboarding-next');
    const back = onboarding.querySelector('#onboarding-back');
    const submit = onboarding.querySelector('#onboarding-submit');
    const show = () => {
      steps.forEach((item) => { item.hidden = Number(item.dataset.onboardingStep) !== step; });
      progress.textContent = `ONBOARDING ${step} / 6`;
      back.hidden = step === 1;
      next.hidden = step === 6;
      submit.hidden = step !== 6;
    };
    const validate = () => {
      const fields = steps[step - 1].querySelectorAll('input, textarea');
      for (const field of fields) if (!field.checkValidity()) { field.reportValidity(); return false; }
      return true;
    };
    next.addEventListener('click', () => { if (validate() && step < 6) { step += 1; show(); } });
    back.addEventListener('click', () => { if (step > 1) { step -= 1; show(); } });
    onboarding.querySelector('form').addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!validate()) return;
      const form = new FormData(event.currentTarget);
      const payload = Object.fromEntries(form.entries());
      payload.action = 'register';
      payload.experience = Number(payload.experience || 0);
      const message = onboarding.querySelector('#onboarding-message');
      try {
        const result = await request('/api/auth', { method: 'POST', body: JSON.stringify(payload) });
        localStorage.setItem('mindconnect-auth', JSON.stringify(result));
        message.textContent = 'Хүсэлт амжилттай илгээгдлээ.';
        window.location.href = 'therapist-profile.html';
      } catch (error) {
        message.textContent = error.message;
      }
    });
    show();
  }

  const profile = document.getElementById('therapist-profile');
  if (profile) {
    if (!token()) { window.location.href = 'therapist-login.html'; return; }
    request('/api/auth').then(({ user }) => {
      profile.querySelector('#therapist-summary').innerHTML = `
        <div class="info-card"><h2>${user.name}</h2><p>${user.bio || 'Профайлын танилцуулгаа нэмнэ үү.'}</p>
        <p><strong>Төлөв:</strong> ${user.isActive ? 'Хянагдаж байна' : 'Идэвхгүй'}</p>
        <p><strong>Мэргэшил:</strong> ${user.expertise || 'Оруулаагүй'}</p></div>`;
    }).catch(() => { window.location.href = 'therapist-login.html'; });
  }

  const admin = document.getElementById('admin-dashboard');
  if (admin) {
    request('/api/admin/users').then(({ users }) => {
      const rows = users.filter((user) => user.role === 'counselor');
      admin.querySelector('#admin-application-list').innerHTML = rows.length ? rows.map((user) => `
        <article class="info-card" style="margin-top:1rem"><h3>${user.name}</h3><p>${user.email}</p>
        <p>Төлөв: ${user.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}</p>
        <button class="btn btn-secondary" data-user-id="${user.id}" data-active="${!user.isActive}">${user.isActive ? 'Идэвхгүй болгох' : 'Батлах'}</button></article>`).join('') : '<p class="empty-state">Одоогоор хүсэлт алга.</p>';
      admin.querySelectorAll('[data-user-id]').forEach((button) => button.addEventListener('click', async () => {
        await request('/api/admin/users', { method: 'POST', body: JSON.stringify({ id: Number(button.dataset.userId), isActive: button.dataset.active === 'true' }) });
        window.location.reload();
      }));
    }).catch((error) => { admin.querySelector('#admin-application-list').textContent = error.message; });
  }
})();
