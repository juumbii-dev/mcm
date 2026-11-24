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
    const statusLabels = { approved: 'Баталгаажсан', pending: 'Хүлээгдэж буй', 'needs-info': 'Нэмэлт мэдээлэл хэрэгтэй', rejected: 'Татгалзсан' };
    const formatUpdatedAt = (value) => (value ? new Date(value).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—');
    request('/api/admin/users').then(({ counselors = [] }) => {
      const list = admin.querySelector('#admin-application-list');
      if (!counselors.length) {
        list.innerHTML = '<p class="empty-state">Одоогоор зөвлөх бүртгэл алга.</p>';
        return;
      }
      list.innerHTML = `
        <table style="width:100%;border-collapse:collapse;margin-top:1rem">
          <thead><tr style="text-align:left;border-bottom:1px solid #444">
            <th style="padding:.6rem">Нэр</th><th style="padding:.6rem">Статус</th><th style="padding:.6rem">Сайтад идэвхтэй харагдах</th><th style="padding:.6rem">Туршлага</th><th style="padding:.6rem">Шинэчлэгдсэн огноо</th>
          </tr></thead>
          <tbody>${counselors.map((counselor) => `
            <tr style="border-bottom:1px solid #333">
              <td style="padding:.6rem"><strong>${counselor.name}</strong></td>
              <td style="padding:.6rem"><select data-status-id="${counselor.id}">${Object.entries(statusLabels).map(([value, label]) => `<option value="${value}" ${counselor.status === value ? 'selected' : ''}>${label}</option>`).join('')}</select></td>
              <td style="padding:.6rem"><input type="checkbox" data-visible-id="${counselor.id}" ${counselor.isVisible ? 'checked' : ''}></td>
              <td style="padding:.6rem">${counselor.experience || 0}</td>
              <td style="padding:.6rem">${formatUpdatedAt(counselor.updated_at)}</td>
            </tr>`).join('')}
          </tbody>
        </table>`;

      const save = async (id, payload) => {
        await request('/api/admin/users', { method: 'POST', body: JSON.stringify({ psychologistId: Number(id), ...payload }) });
        window.location.reload();
      };
      list.querySelectorAll('[data-status-id]').forEach((select) => select.addEventListener('change', () => save(select.dataset.statusId, { status: select.value })));
      list.querySelectorAll('[data-visible-id]').forEach((input) => input.addEventListener('change', () => save(input.dataset.visibleId, { isVisible: input.checked })));
    }).catch((error) => { admin.querySelector('#admin-application-list').textContent = error.message; });
  }
})();
