document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

  const pagePrefix = window.location.pathname.includes('/pages/') ? '' : 'pages/';

  // Insert counselor login link before the first nav item (if not already present)
  if (nav && !nav.querySelector('.nav-counselor')) {
    const firstLink = nav.querySelector('a');
    const counselorLink = document.createElement('a');
    counselorLink.href = `${pagePrefix}counselor-login.html`;
    counselorLink.className = 'nav-counselor';
    counselorLink.textContent = 'Зөвлөх нэвтрэх';
    if (firstLink) nav.insertBefore(counselorLink, firstLink);
    else nav.appendChild(counselorLink);
  }

  const authLink = document.querySelector('.nav-cta');
  const apiBase = (window.location.origin === 'null' || window.location.origin === 'file:')
    ? 'http://localhost:8000'
    : window.location.origin;
  const authState = JSON.parse(localStorage.getItem('mindconnect-auth') || 'null');
  const isLoggedIn = !!(authState && authState.user);

  const renderAuthState = () => {
    const state = JSON.parse(localStorage.getItem('mindconnect-auth') || 'null');
    const loginHref = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
    const nav = document.querySelector('.site-nav');

    if (state?.user && nav) {
      const counselorLink = nav.querySelector('.nav-counselor-dashboard');
      // show counselor dashboard link for users with counselor role or an associated psychologistId
      if ((state.user.role === 'counselor' || state.user.psychologistId) && !counselorLink) {
        const dashboardLink = document.createElement('a');
        dashboardLink.href = `${pagePrefix}counselor-dashboard.html`;
        dashboardLink.className = 'nav-counselor-dashboard';
        dashboardLink.textContent = 'Зөвлөх самбар';
        nav.insertBefore(dashboardLink, nav.querySelector('.nav-cta'));
      }
      if (state.user.role !== 'counselor' && !state.user.psychologistId && counselorLink) {
        counselorLink.remove();
      }
    }

    // Hide any register links/buttons when logged in
    const registerSelectors = ['a[href$="register.html"]', 'a[href$="/register.html"]', 'a.btn-secondary[href*="register"]', 'a.form-link[href*="register"]'];
    registerSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (state?.user) el.style.display = 'none';
        else el.style.display = '';
      });
    });

    if (state?.user && authLink) {
      authLink.className = 'nav-cta auth-pill';
      authLink.innerHTML = `
        <span class="auth-pill__label">${state.user.name}</span>
        <span class="auth-pill__meta">Бүртгэлтэй · ${state.user.email}</span>
        <button class="auth-logout-btn" type="button">Гарах</button>
      `;
      authLink.href = '#';
    } else if (authLink) {
      authLink.className = 'nav-cta';
      authLink.innerHTML = 'Нэвтрэх';
      // mark this as the public login link so we can style it differently
      authLink.classList.add('login-link');
      authLink.href = loginHref;
    }
  };

  renderAuthState();

  document.addEventListener('click', (event) => {
    if (event.target.closest('.auth-logout-btn')) {
      event.preventDefault();
      localStorage.removeItem('mindconnect-auth');
      renderAuthState();
      window.location.reload();
    }
  });

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(registerForm);
      const payload = {
        action: 'register',
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password'),
        role: formData.get('role') || 'client',
        psychologistId: formData.get('psychologistId') ? Number(formData.get('psychologistId')) : null,
      };

      const response = await fetch(`${apiBase}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.ok) {
        localStorage.setItem('mindconnect-auth', JSON.stringify(result));
        window.location.href = '/index.html';
      } else {
        alert(result.error || 'Бүртгэл амжилтгүй боллоо');
      }
    });
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(loginForm);
      const payload = {
        action: 'login',
        email: formData.get('email'),
        password: formData.get('password')
      };

      const response = await fetch(`${apiBase}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.ok) {
        localStorage.setItem('mindconnect-auth', JSON.stringify(result));
        window.location.href = '/index.html';
      } else {
        alert(result.error || 'Нэвтрэлт амжилтгүй боллоо');
      }
    });
  }

  const psychologistList = document.getElementById('psychologist-list');
  if (psychologistList) {
    const response = await fetch(`${apiBase}/api/psychologists`);
    const psychologists = await response.json();
    let visiblePsychologists = psychologists;

    if (authState?.user?.role === 'counselor' && authState.user.psychologistId) {
      visiblePsychologists = psychologists.filter((psychologist) => psychologist.id === authState.user.psychologistId);
    }

    psychologistList.innerHTML = visiblePsychologists.length
      ? visiblePsychologists.map((psychologist) => `
          <article class="psych-card">
            <div class="avatar">${psychologist.name.charAt(0)}</div>
            <h3>${psychologist.name}</h3>
            <p>${psychologist.specialty} · ${psychologist.focus}</p>
            <div class="meta-row">
              <span>⭐ ${psychologist.rating.toFixed(1)}</span>
              <span>₮${psychologist.price.toLocaleString()}</span>
            </div>
            <a href="pages/psychologist.html?id=${psychologist.id}" class="text-link">Дэлгэрэнгүй</a>
          </article>
        `).join('')
      : '<p style="color: var(--muted);">Одоогоор зөвлөхийн мэдээлэл байхгүй байна.</p>';
  }

  const detailContainer = document.getElementById('psychologist-detail');
  if (detailContainer) {
    const params = new URLSearchParams(window.location.search);
    const psychologistId = params.get('id') || '1';
    const response = await fetch(`${apiBase}/api/psychologists/${psychologistId}`);
    const psychologist = await response.json();

    const today = new Date();
    let selectedSlotInitial = psychologist.availability[0] || '';
    let selectedDateInitial = today.toISOString().substring(0, 10);
    const bookingInfoEl = document.getElementById('page-selected-info');
    let savedBooking = null;

    if (isLoggedIn) {
      if (authState.user.role === 'counselor' && authState.user.psychologistId === Number(psychologistId)) {
        const res = await fetch(`${apiBase}/api/bookings?psychologistId=${psychologistId}`);
        const counselorBookings = await res.json();
        savedBooking = counselorBookings[0] || null;
      }

      if (!savedBooking && authState.user.email) {
        const res = await fetch(`${apiBase}/api/bookings?userEmail=${encodeURIComponent(authState.user.email)}`);
        const clientBookings = await res.json();
        savedBooking = clientBookings.find((booking) => Number(booking.psychologist_id) === Number(psychologistId)) || null;
      }

      if (savedBooking) {
        selectedDateInitial = savedBooking.date || selectedDateInitial;
        selectedSlotInitial = savedBooking.slot || selectedSlotInitial;
        if (bookingInfoEl) {
          bookingInfoEl.textContent = `Таны захиалга: ${selectedDateInitial} ${selectedSlotInitial}`;
        }
      }
    }

    const nameFieldHtml = isLoggedIn
      ? `<input type="hidden" name="name" value="${(authState.user.name || '').replace(/"/g, '&quot;')}" />`
      : `<input type="text" name="name" placeholder="Нэр (заавал биш)" />`;

    const emailFieldHtml = isLoggedIn
      ? `<input type="hidden" name="email" value="${(authState.user.email || '').replace(/"/g, '&quot;')}" />`
      : `<input type="email" name="email" placeholder="Имэйл (заавал биш)" />`;

    // phone field for non-logged-in users; required if name left blank
    const phoneFieldHtml = isLoggedIn
      ? ''
      : `<input type="tel" name="phone" placeholder="Утасны дугаар (заавал нэр үгүй бол)" />`;

    detailContainer.innerHTML = `
      <article class="info-card">
        <div class="avatar">${psychologist.name.charAt(0)}</div>
        <h3>${psychologist.name}</h3>
        <p>${psychologist.specialty} · ${psychologist.focus}</p>
        <ul>
          <li>Туршлага: ${psychologist.experience} жил</li>
          <li>Үйлчилгээний үнэ: ₮${psychologist.price.toLocaleString()}</li>
          <li>Үнэлгээ: ${psychologist.rating.toFixed(1)}/5</li>
          <li>Хот: ${psychologist.city}</li>
        </ul>
      </article>
      <article class="booking-card">
        <h3>Цаг сонгох</h3>
        <div class="date-row">
          <label for="selected-date">Огноо</label>
          <input type="date" name="selectedDate" id="selected-date" value="${selectedDateInitial}" min="${selectedDateInitial}" />
        </div>
        <div class="booking-grid">
          ${psychologist.availability.map((slot) => `<button class="slot" data-slot="${slot}">${slot}</button>`).join('')}
        </div>
        <p class="selected-slot-text">Сонгосон цаг: <strong id="selected-slot-text">${selectedSlotInitial}</strong></p>
        <p class="booking-note">Нэр, имэйл шаардлагагүй. Цаг сонгоход захиалга бүртгэгдэнэ.</p>
        <form id="booking-form" style="margin-top: 1rem;">
          ${nameFieldHtml}
          ${emailFieldHtml}
          ${phoneFieldHtml}
          <input type="hidden" name="psychologistId" value="${psychologist.id}" />
          <input type="hidden" name="selectedSlot" id="selected-slot" value="${selectedSlotInitial}" />
          <textarea name="notes" rows="4" placeholder="Тэмдэглэл"></textarea>
          <button class="btn btn-primary" type="submit">Баталгаажуулах</button>
        </form>

        <div class="edit-row" style="margin-top:0.75rem; display:flex; gap:0.75rem; align-items:center;">
          <button id="edit-time-btn" class="btn" disabled>Цаг өөрчлөх</button>
          <span class="edit-note">Та зөвхөн 6 цагийн өмнө цаг өөрчлөх боломжтой</span>
        </div>

        <div id="booking-confirmation" style="margin-top:1rem; display:none;">
          <p id="confirmation-text"></p>
        </div>
      </article>
    `;

    const selectedDateInfo = document.getElementById('page-selected-info');
    const updateSelectedInfo = () => {
      const selectedDate = document.getElementById('selected-date')?.value;
      const selectedSlot = document.getElementById('selected-slot-text')?.textContent || '';
      if (selectedDate && selectedSlot) {
        selectedDateInfo.textContent = `Сонгосон өдөр: ${selectedDate}, цаг: ${selectedSlot}`;
      } else {
        selectedDateInfo.textContent = 'Сонгосон өдөр, цаг хараахан байхгүй.';
      }
    };

    // Slot click behavior: update hidden input and displayed text
    document.querySelectorAll('.slot').forEach((slot) => {
      slot.addEventListener('click', () => {
        document.querySelectorAll('.slot').forEach((item) => item.classList.remove('active'));
        slot.classList.add('active');
        document.getElementById('selected-slot').value = slot.dataset.slot;
        document.getElementById('selected-slot-text').textContent = slot.dataset.slot;
        updateSelectedInfo();
      });
    });

    const activeSlotBtn = Array.from(document.querySelectorAll('.slot')).find((button) => button.dataset.slot === selectedSlotInitial);
    if (activeSlotBtn) {
      document.querySelectorAll('.slot').forEach((item) => item.classList.remove('active'));
      activeSlotBtn.classList.add('active');
    }

    document.getElementById('selected-date')?.addEventListener('change', updateSelectedInfo);

    updateSelectedInfo();

    // Attach edit button behavior (available after booking when enabled)
    const editBtn = document.getElementById('edit-time-btn');
    editBtn?.addEventListener('click', () => {
      const selectedText = document.getElementById('selected-slot-text')?.textContent || '';
      if (!selectedText) return;

      const parts = selectedText.trim().split(':');
      if (parts.length < 2) return;
      const hh = parseInt(parts[0], 10);
      const mm = parseInt(parts[1], 10) || 0;

      const now = new Date();
      let scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0);
      if (scheduled.getTime() <= now.getTime()) {
        scheduled.setDate(scheduled.getDate() + 1);
      }

      const hoursUntil = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntil < 6) {
        alert('Та зөвхөн 6-аас дээш цагийн өмнө цаг өөрчлөх боломжтой.');
        return;
      }

      const firstSlot = document.querySelector('.slot');
      firstSlot?.focus();
    });

    const bookingForm = document.getElementById('booking-form');
    bookingForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(bookingForm);
      const enteredName = isLoggedIn ? (authState.user.name || '') : (formData.get('name') || '');
      const enteredEmail = isLoggedIn ? (authState.user.email || '') : (formData.get('email') || '');
      const enteredPhone = isLoggedIn ? '' : (formData.get('phone') || '');

      // require phone if no name provided
      if (!enteredName && !enteredPhone) {
        alert('Нэр оруулаагүй бол утасны дугаараа заавал оруулна уу.');
        return;
      }

      const payload = {
        psychologistId: Number(formData.get('psychologistId')),
        name: enteredName,
        email: enteredEmail,
        date: formData.get('selectedDate') || selectedDateInitial,
        slot: formData.get('selectedSlot') || psychologist.availability[0] || '',
        notes: ((formData.get('notes') || '') + (enteredPhone ? `\nУтас: ${enteredPhone}` : '')).trim()
      };

      const response = await fetch(`${apiBase}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      // Show confirmation to customer including scheduled time and allow editing
      const conf = document.getElementById('booking-confirmation');
      const confText = document.getElementById('confirmation-text');
      confText.textContent = `Захиалга амжилттай бүртгэгдлээ. ID: ${result.id}. Таны захиалсан цаг: ${payload.slot}`;
      conf.style.display = 'block';

      // Show confirmation and enable edit button
      document.getElementById('edit-time-btn').disabled = false;
      updateSelectedInfo();
    });
  }

  const homeAppointment = document.getElementById('upcoming-appointment');
  const updateHomeAppointment = async () => {
    if (!authState?.user || !homeAppointment) return;

    const chooseBooking = (bookings) => {
      const now = new Date();
      const normalized = bookings.map((booking) => {
        const dateTime = booking.date && booking.slot
          ? new Date(`${booking.date}T${booking.slot}:00`)
          : null;
        return { ...booking, dateTime };
      });

      const upcoming = normalized
        .filter((booking) => booking.dateTime && booking.dateTime >= now)
        .sort((a, b) => a.dateTime - b.dateTime);
      if (upcoming.length) return upcoming[0];

      const recent = normalized
        .filter((booking) => booking.dateTime)
        .sort((a, b) => b.dateTime - a.dateTime);
      return recent[0] || normalized[0] || null;
    };

    let bookings = [];
    if (authState.user.role === 'counselor' && authState.user.psychologistId) {
      const res = await fetch(`${apiBase}/api/bookings?psychologistId=${authState.user.psychologistId}`);
      bookings = await res.json();
    } else if (authState.user.email) {
      const res = await fetch(`${apiBase}/api/bookings?userEmail=${encodeURIComponent(authState.user.email)}`);
      bookings = await res.json();
    }

    const booking = chooseBooking(bookings);
    if (booking?.date && booking?.slot) {
      homeAppointment.textContent = `Таны дараагийн захиалга: ${booking.date} ${booking.slot}`;
    } else {
      homeAppointment.textContent = authState.user.role === 'counselor'
        ? 'Одоогоор таны зөвлөхийн захиалга байхгүй байна.'
        : 'Одоогоор танд аливаа захиалга байхгүй байна.';
    }
  };

  await updateHomeAppointment();

  const counselorDashboard = document.getElementById('counselor-dashboard');
  if (counselorDashboard) {
    const authState = JSON.parse(localStorage.getItem('mindconnect-auth') || 'null');
    if (!authState?.user || (authState.user.role !== 'counselor' && !authState.user.psychologistId)) {
      counselorDashboard.innerHTML = '<p>Та зөвлөхийн эрхгүй байна. Нэвтрэх эсвэл зөвлөмж залгаарай.</p>';
      return;
    }

    const dashboardHeading = document.getElementById('dashboard-heading');
    dashboardHeading.textContent = `Тавтай морил, ${authState.user.name}`;

    // Render counselor profile panel
    const profileEl = document.getElementById('counselor-profile');
    if (profileEl) {
      const avatar = authState.user.avatar || '';
      const avatarHtml = avatar
        ? `<img src="${avatar}" alt="avatar" style="width:88px;height:88px;object-fit:cover;border-radius:8px;"/>`
        : `<div style="width:88px;height:88px;display:flex;align-items:center;justify-content:center;background:var(--muted);color:white;border-radius:8px;font-size:28px">${(authState.user.name||'')[0]||''}</div>`;

      const infoHtml = `
        <div style="display:flex;gap:1rem;align-items:flex-start">
          ${avatarHtml}
          <div>
            <div style="font-weight:600">${authState.user.name || '—'}</div>
            <div style="color:var(--muted);margin-top:0.25rem">${authState.user.profession || authState.user.expertise || ''}</div>
            <div style="margin-top:0.5rem;color:var(--muted)">Туршлага: ${authState.user.experience || 0} жил · Хот: ${authState.user.city || '—'}</div>
            <div style="margin-top:0.5rem;max-width:50ch">${authState.user.bio || ''}</div>
          </div>
        </div>
      `;
      profileEl.innerHTML = infoHtml;
    }

    // Setup edit form for counselor profile on dashboard
    const editToggle = document.getElementById('counselor-edit-toggle');
    const editForm = document.getElementById('counselor-edit-form');
    const cancelBtn = document.getElementById('counselor-edit-cancel');
    const nameField = document.getElementById('counselor-name');
    const bioField = document.getElementById('counselor-bio');
    const expField = document.getElementById('counselor-experience');
    const expertiseField = document.getElementById('counselor-expertise');
    const cityField = document.getElementById('counselor-city');
    const avatarField = document.getElementById('counselor-avatar');
    const avatarPreview = document.getElementById('counselor-avatar-preview');

    if (editToggle && editForm) {
      editToggle.addEventListener('click', () => {
        // prefill
        nameField.value = authState.user.name || '';
        bioField.value = authState.user.bio || '';
        expField.value = authState.user.experience || '';
        expertiseField.value = authState.user.expertise || '';
        cityField.value = authState.user.city || '';
        if (authState.user.avatar) {
          avatarPreview.src = authState.user.avatar;
          avatarPreview.style.display = 'block';
        } else {
          avatarPreview.style.display = 'none';
        }
        editForm.style.display = editForm.style.display === 'none' ? 'block' : 'none';
      });
    }

    if (cancelBtn) cancelBtn.addEventListener('click', () => { editForm.style.display = 'none'; });

    let avatarData = null;
    if (avatarField) {
      avatarField.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          avatarData = reader.result;
          avatarPreview.src = avatarData;
          avatarPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      });
    }

    if (editForm) {
      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          action: 'update',
          id: authState.user.id,
          name: nameField.value || authState.user.name,
          bio: bioField.value || null,
          experience: expField.value ? Number(expField.value) : 0,
          expertise: expertiseField.value || null,
          city: cityField.value || null,
        };
        if (avatarData) payload.avatar = avatarData;
        const resp = await fetch(`${apiBase}/api/auth`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await resp.json().catch(() => ({}));
        if (resp.ok) {
          localStorage.setItem('mindconnect-auth', JSON.stringify(result));
          alert('Профайл шинэчлэгдлээ');
          // update UI
          const newState = JSON.parse(localStorage.getItem('mindconnect-auth') || 'null');
          authState.user = newState.user; // update local variable
          dashboardHeading.textContent = `Тавтай морил, ${authState.user.name}`;
          if (profileEl) {
            profileEl.querySelector('div').innerHTML = `
              <div style="font-weight:600">${authState.user.name || '—'}</div>
              <div style="color:var(--muted);margin-top:0.25rem">${authState.user.profession || authState.user.expertise || ''}</div>
              <div style="margin-top:0.5rem;color:var(--muted)">Туршлага: ${authState.user.experience || 0} жил · Хот: ${authState.user.city || '—'}</div>
              <div style="margin-top:0.5rem;max-width:50ch">${authState.user.bio || ''}</div>
            `;
          }
          editForm.style.display = 'none';
        } else {
          alert(result.error || 'Профайл шинэчлэхэд алдаа гарлаа');
        }
      });
    }

    const bookingsContainer = document.getElementById('booking-list');
    const bookingTemplate = (booking) => `
      <article class="booking-item">
        <div class="booking-meta">
          <div><strong>ID:</strong> ${booking.id}</div>
          <div><strong>Зөвлөх:</strong> ${booking.psychologist_id}</div>
          <div><strong>Хэрэглэгч:</strong> ${booking.user_name || 'Anonymous'}</div>
          <div><strong>Имэйл:</strong> ${booking.user_email || '–'}</div>
          <div><strong>Огноо:</strong> ${booking.date || '–'}</div>
          <div><strong>Цаг:</strong> ${booking.slot || '–'}</div>
        </div>
        <div class="booking-notes"><strong>Тэмдэглэл:</strong> ${booking.notes || '–'}</div>
        <div class="booking-actions">
          <button class="btn btn-secondary booking-edit" data-booking-id="${booking.id}">Засах</button>
          <button class="btn btn-danger booking-delete" data-booking-id="${booking.id}">Устгах</button>
        </div>
        <div class="booking-edit-form" id="edit-form-${booking.id}" style="display:none; margin-top: 0.75rem;">
          <label>Огноо<input type="date" name="edit-date" value="${booking.date || ''}" /></label>
          <label>Цаг<input type="text" name="edit-slot" value="${booking.slot || ''}" placeholder="HH:MM" /></label>
          <label>Тэмдэглэл<textarea name="edit-notes">${booking.notes || ''}</textarea></label>
          <div style="margin-top:0.5rem; display:flex; gap:0.5rem;">
            <button class="btn btn-primary booking-save" data-booking-id="${booking.id}">Хадгалах</button>
            <button class="btn booking-cancel" data-booking-id="${booking.id}">Цуцлах</button>
          </div>
        </div>
      </article>
    `;

    const loadBookings = async () => {
      const query = authState.user.psychologistId ? `?psychologistId=${authState.user.psychologistId}` : '';
      const response = await fetch(`${apiBase}/api/bookings${query}`);
      const bookings = await response.json();
      bookingsContainer.innerHTML = bookings.map(bookingTemplate).join('');
      attachBookingActions();
    };

    const attachBookingActions = () => {
      document.querySelectorAll('.booking-delete').forEach((button) => {
        button.addEventListener('click', async () => {
          const bookingId = button.dataset.bookingId;
          if (!confirm('Энэ захиалгыг устгах уу?')) return;
          await fetch(`${apiBase}/api/bookings/${bookingId}`, { method: 'DELETE' });
          await loadBookings();
        });
      });

      document.querySelectorAll('.booking-edit').forEach((button) => {
        button.addEventListener('click', () => {
          const bookingId = button.dataset.bookingId;
          const form = document.getElementById(`edit-form-${bookingId}`);
          if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
        });
      });

      document.querySelectorAll('.booking-cancel').forEach((button) => {
        button.addEventListener('click', () => {
          const bookingId = button.dataset.bookingId;
          const form = document.getElementById(`edit-form-${bookingId}`);
          if (form) form.style.display = 'none';
        });
      });

      document.querySelectorAll('.booking-save').forEach((button) => {
        button.addEventListener('click', async () => {
          const bookingId = button.dataset.bookingId;
          const form = document.getElementById(`edit-form-${bookingId}`);
          if (!form) return;
          const date = form.querySelector('input[name="edit-date"]').value;
          const slot = form.querySelector('input[name="edit-slot"]').value;
          const notes = form.querySelector('textarea[name="edit-notes"]').value;
          await fetch(`${apiBase}/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, slot, notes }),
          });
          await loadBookings();
        });
      });
    };

    await loadBookings();
  }

  const profilePage = document.getElementById('profile-page');
  if (profilePage) {
    const state = JSON.parse(localStorage.getItem('mindconnect-auth') || 'null');
    if (!state?.user) {
      window.location.href = `${pagePrefix}login.html`;
      return;
    }

    const form = document.getElementById('profile-form');
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');
    const bioInput = document.getElementById('profile-bio');
    const pwdInput = document.getElementById('profile-password');
    const avatarInput = document.getElementById('profile-avatar');
    const avatarPreview = document.getElementById('profile-avatar-preview');
    const counselorFields = document.getElementById('counselor-fields');
    const clientFields = document.getElementById('client-fields');
    const psychologistSelect = document.getElementById('profile-psychologistId');
    const experienceInput = document.getElementById('profile-experience');
    const expertiseInput = document.getElementById('profile-expertise');
    const qualificationsInput = document.getElementById('profile-qualifications');
    const cityInput = document.getElementById('profile-city');
    const ageInput = document.getElementById('profile-age');
    const genderSelect = document.getElementById('profile-gender');
    const professionInput = document.getElementById('profile-profession');
    const maritalSelect = document.getElementById('profile-marital_status');
    const interestsInput = document.getElementById('profile-interests');
    const issuesInput = document.getElementById('profile-issues');
    const bookingsEl = document.getElementById('profile-bookings');

    nameInput.value = state.user.name || '';
    emailInput.value = state.user.email || '';
    phoneInput.value = state.user.phone || '';
    bioInput.value = state.user.bio || '';
    // avatar preview
    if (avatarPreview) {
      if (state.user.avatar) {
        avatarPreview.src = state.user.avatar;
        avatarPreview.style.display = 'block';
      } else {
        avatarPreview.style.display = 'none';
      }
    }
    if (state.user.role === 'counselor') {
      counselorFields.style.display = 'block';
      clientFields.style.display = 'none';
      if (state.user.psychologistId) psychologistSelect.value = state.user.psychologistId;
      experienceInput.value = state.user.experience || '';
      expertiseInput.value = state.user.expertise || '';
      qualificationsInput.value = state.user.qualifications || '';
      } else {
      clientFields.style.display = 'block';
      counselorFields.style.display = 'none';
      cityInput.value = state.user.city || '';
      ageInput.value = state.user.age || '';
      genderSelect.value = state.user.gender || '';
      professionInput.value = state.user.profession || '';
      maritalSelect.value = state.user.maritalStatus || state.user.marital_status || '';
      interestsInput.value = state.user.interests || '';
      issuesInput.value = state.user.issues || '';
    }

    let avatarDataUrl = null;
    if (avatarInput) {
      avatarInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          avatarDataUrl = reader.result;
          if (avatarPreview) {
            avatarPreview.src = avatarDataUrl;
            avatarPreview.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      });
    }

    const loadProfileBookings = async () => {
      let bookings = [];
      if (state.user.role === 'counselor' && state.user.psychologistId) {
        const res = await fetch(`${apiBase}/api/bookings?psychologistId=${state.user.psychologistId}`);
        bookings = await res.json();
      } else if (state.user.email) {
        const res = await fetch(`${apiBase}/api/bookings?userEmail=${encodeURIComponent(state.user.email)}`);
        bookings = await res.json();
      }

      if (!bookings || !bookings.length) {
        bookingsEl.innerHTML = '<p>Захиалга олдсонгүй.</p>';
        return;
      }
      bookingsEl.innerHTML = bookings.map(b => `
        <article class="info-card booking-item" style="margin-bottom:0.75rem;">
          <div><strong>Огноо:</strong> ${b.date || '–'}</div>
          <div><strong>Цаг:</strong> ${b.slot || '–'}</div>
          <div><strong>Зөвлөх:</strong> ${b.psychologist_id || '–'}</div>
          <div><strong>Хэрэглэгч:</strong> ${b.user_name || '–'}</div>
          <div style="margin-top:0.5rem; display:flex; gap:0.5rem;">
            <button class="btn btn-secondary profile-booking-edit" data-booking-id="${b.id}">Засах</button>
            <button class="btn btn-danger profile-booking-delete" data-booking-id="${b.id}">Устгах</button>
          </div>
          <div class="booking-edit-form" id="profile-edit-form-${b.id}" style="display:none; margin-top:0.75rem;">
            <label>Огноо<input type="date" name="edit-date" value="${b.date || ''}" /></label>
            <label>Цаг<input type="text" name="edit-slot" value="${b.slot || ''}" placeholder="HH:MM" /></label>
            <label>Тэмдэглэл<textarea name="edit-notes">${b.notes || ''}</textarea></label>
            <div style="margin-top:0.5rem; display:flex; gap:0.5rem;">
              <button class="btn btn-primary profile-booking-save" data-booking-id="${b.id}">Хадгалах</button>
              <button class="btn profile-booking-cancel" data-booking-id="${b.id}">Цуцлах</button>
            </div>
          </div>
        </article>
      `).join('');

      // attach handlers for edit/delete
      document.querySelectorAll('.profile-booking-delete').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.bookingId;
          if (!confirm('Энэ захиалгыг устгах уу?')) return;
          const resp = await fetch(`${apiBase}/api/bookings/${id}`, { method: 'DELETE' });
          if (resp.status === 204) {
            await loadProfileBookings();
          } else {
            const body = await resp.json().catch(() => ({}));
            alert(body.error || 'Устгахад алдаа гарлаа');
          }
        });
      });

      document.querySelectorAll('.profile-booking-edit').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.bookingId;
          const form = document.getElementById(`profile-edit-form-${id}`);
          if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
        });
      });

      document.querySelectorAll('.profile-booking-cancel').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const id = btn.dataset.bookingId;
          const form = document.getElementById(`profile-edit-form-${id}`);
          if (form) form.style.display = 'none';
        });
      });

      document.querySelectorAll('.profile-booking-save').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.bookingId;
          const form = document.getElementById(`profile-edit-form-${id}`);
          if (!form) return;
          const date = form.querySelector('input[name="edit-date"]').value;
          const slot = form.querySelector('input[name="edit-slot"]').value;
          const notes = form.querySelector('textarea[name="edit-notes"]').value;
          const resp = await fetch(`${apiBase}/api/bookings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, slot, notes }),
          });
          const body = await resp.json().catch(() => ({}));
          if (resp.ok) {
            await loadProfileBookings();
          } else {
            alert(body.error || 'Засах үед алдаа гарлаа');
          }
        });
      });
    };

    loadProfileBookings();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // simple client-side validation
      const emailVal = emailInput.value && emailInput.value.trim();
      const nameVal = nameInput.value && nameInput.value.trim();
      if (!emailVal || !/^\S+@\S+\.\S+$/.test(emailVal)) {
        alert('Зөв имэйл хаяг оруулна уу.');
        return;
      }
      if (!nameVal) {
        if (!confirm('Нэр хоосон байна. Үргэлжлүүлэх үү?')) return;
      }

      const payload = {
        action: 'update',
        id: state.user.id,
        name: nameInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        bio: bioInput.value || null,
      };
      if (pwdInput.value) {
        if (pwdInput.value.length < 6) {
          alert('Нууц үг дор хаяж 6 тэмдэгт байх шаардлагатай.');
          return;
        }
        payload.password = pwdInput.value;
      }
      if (state.user.role === 'counselor') {
        payload.role = 'counselor';
        payload.psychologistId = psychologistSelect.value ? Number(psychologistSelect.value) : null;
        payload.experience = experienceInput.value ? Number(experienceInput.value) : 0;
        payload.expertise = expertiseInput.value || null;
        payload.qualifications = qualificationsInput.value || null;
        if (avatarDataUrl) payload.avatar = avatarDataUrl;
      } else {
        payload.city = cityInput.value || null;
        payload.age = ageInput.value ? Number(ageInput.value) : null;
        payload.gender = genderSelect.value || null;
        payload.profession = professionInput.value || null;
        payload.marital_status = maritalSelect.value || null;
        payload.interests = interestsInput.value || null;
        payload.issues = issuesInput.value || null;
      }

      const res = await fetch(`${apiBase}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        localStorage.setItem('mindconnect-auth', JSON.stringify(result));
        alert('Мэдээлэл амжилттай хадгалагдлаа.');
        // refresh state and header
        renderAuthState();
      } else {
        alert(result.error || 'Мэдээлэл хадгалах үед алдаа гарлаа');
      }
    });
  }
});
