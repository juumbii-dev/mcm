let psychologistScorer = null;

window.setPsychologistScorer = (scorer) => {
  psychologistScorer = scorer;
};

function renderPsychologistCards(container, psychologists) {
  const items = psychologists
    .map((psychologist) => ({ psychologist, score: psychologistScorer ? psychologistScorer(psychologist) : null }))
    .filter(({ score }) => score !== false)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const detailPrefix = window.location.pathname.includes('/pages/') ? '' : 'pages/';
  container.innerHTML = items.length
    ? items.map(({ psychologist, score }) => `
          <article class="psych-card">
            <div class="avatar">${psychologist.name.charAt(0)}</div>
            ${score !== null ? `<span class="match-badge">${score}% тохирол</span>` : ''}
            <h3>${psychologist.name}</h3>
            <p>${psychologist.specialty} · ${psychologist.focus}</p>
            <div class="meta-row">
              <span>⭐ ${psychologist.rating.toFixed(1)}</span>
              <span>₮${psychologist.price.toLocaleString()}</span>
            </div>
            <a href="${detailPrefix}psychologist.html?id=${psychologist.id}" class="text-link">Дэлгэрэнгүй</a>
          </article>
        `).join('')
    : '<p class="empty-state">Одоогоор зөвлөхийн мэдээлэл байхгүй байна.</p>';
  return items.length;
}

document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

  const consultationModal = document.getElementById('consultation-modal');
  if (consultationModal) {
    const consultationState = { step: 1, topic: '', specialties: [], specialty: '', format: '', gender: 'any', age: 'any', location: 'Улаанбаатар' };
    const panels = consultationModal.querySelectorAll('[data-consultation-step]');
    const progressSteps = consultationModal.querySelectorAll('[data-progress-step]');
    const nextButtons = consultationModal.querySelectorAll('[data-next-step]');
    const showConsultationStep = (step) => {
      consultationState.step = step;
      panels.forEach((panel) => { panel.hidden = Number(panel.dataset.consultationStep) !== step; });
      progressSteps.forEach((item) => item.classList.toggle('active', Number(item.dataset.progressStep) <= step));
    };
    const closeConsultation = () => { consultationModal.hidden = true; document.body.classList.remove('modal-open'); };
    const updateNextButtons = () => {
      nextButtons.forEach((button) => {
        const enabled = consultationState.step === 1
          ? !!consultationState.topic
          : consultationState.step === 2
            ? consultationState.specialties.length > 0
            : !!consultationState.format || consultationState.step === 3;
        button.disabled = !enabled;
      });
    };
    document.querySelectorAll('[data-open-consultation]').forEach((button) => button.addEventListener('click', () => {
      consultationState.step = 1;
      consultationState.topic = '';
      consultationState.specialties = [];
      consultationState.specialty = '';
      consultationState.format = '';
      consultationModal.querySelectorAll('[data-topic], [data-specialty]').forEach((item) => item.classList.remove('selected'));
      consultationModal.hidden = false;
      document.body.classList.add('modal-open');
      showConsultationStep(1);
      updateNextButtons();
    }));
    consultationModal.querySelectorAll('[data-close-consultation]').forEach((button) => button.addEventListener('click', closeConsultation));
    consultationModal.querySelectorAll('[data-previous-step]').forEach((button) => button.addEventListener('click', () => showConsultationStep(Math.max(1, consultationState.step - 1))));
    consultationModal.querySelectorAll('[data-topic]').forEach((button) => button.addEventListener('click', () => {
      consultationState.topic = button.dataset.topic;
      consultationModal.querySelectorAll('[data-topic]').forEach((item) => item.classList.toggle('selected', item === button));
      updateNextButtons();
    }));
    consultationModal.querySelectorAll('[data-specialty]').forEach((button) => button.addEventListener('click', () => {
      const value = button.dataset.specialty;
      consultationState.specialties = consultationState.specialties.includes(value)
        ? consultationState.specialties.filter((item) => item !== value)
        : [...consultationState.specialties, value];
      consultationState.specialty = consultationState.specialties.join(', ');
      button.classList.toggle('selected', consultationState.specialties.includes(value));
      updateNextButtons();
    }));
    consultationModal.querySelectorAll('[data-preference]').forEach((field) => field.addEventListener('change', () => { consultationState[field.dataset.preference] = field.value; }));
    nextButtons.forEach((button) => button.addEventListener('click', () => {
      if (button.disabled) return;
      showConsultationStep(Math.min(4, consultationState.step + 1));
      updateNextButtons();
    }));
    consultationModal.querySelectorAll('[data-format]').forEach((button) => button.addEventListener('click', () => { consultationState.format = button.dataset.format; consultationModal.querySelector('.location-field').hidden = consultationState.format !== 'in-person'; }));
    consultationModal.querySelector('[data-finish-consultation]')?.addEventListener('click', () => { const query = new URLSearchParams(consultationState); window.location.href = `pages/psychologists.html?${query.toString()}`; });
  }

  const pagePrefix = window.location.pathname.includes('/pages/') ? '' : 'pages/';

  // Insert admin and counselor links in nav (if not already present)
  if (nav && !nav.querySelector('.nav-admin')) {
    const firstLink = nav.querySelector('a');
    const adminLink = document.createElement('a');
    adminLink.href = `${pagePrefix}admin-login.html`;
    adminLink.className = 'nav-admin';
    adminLink.textContent = 'Admin';
    adminLink.setAttribute('aria-label', 'Admin');
    adminLink.title = 'Admin';
    if (firstLink) nav.insertBefore(adminLink, firstLink);
    else nav.appendChild(adminLink);
  }

  if (nav && !nav.querySelector('.nav-counselor')) {
    const firstLink = nav.querySelector('a');
    const counselorLink = document.createElement('a');
    counselorLink.href = `${pagePrefix}counselor-login.html`;
    counselorLink.className = 'nav-counselor';
    counselorLink.textContent = 'Зөвлөхөөр бүртгүүлэх';
    counselorLink.setAttribute('aria-label', 'Зөвлөхөөр бүртгүүлэх');
    counselorLink.title = 'Зөвлөхөөр бүртгүүлэх';
    if (firstLink) nav.insertBefore(counselorLink, firstLink);
    else nav.appendChild(counselorLink);
  }

  const authLink = document.querySelector('.nav-cta');
  const apiBase = (window.location.origin === 'null' || window.location.origin === 'file:')
    ? 'http://localhost:8000'
    : window.location.origin;
  const getStoredAuth = () => {
    try {
      return JSON.parse(localStorage.getItem('mindconnect-auth') || 'null');
    } catch (e) {
      return null;
    }
  };
  const isCounselorSession = () => {
    const state = getStoredAuth();
    return !!(state?.user && (state.user.role === 'counselor' || state.user.psychologistId));
  };
  const notifyAuthUpdated = () => {
    window.dispatchEvent(new CustomEvent('mindconnect-auth-updated'));
  };
  const authState = getStoredAuth();
  const isLoggedIn = !!(authState && authState.user);
  const isAdminUser = () => !!(getStoredAuth()?.user && getStoredAuth().user.isAdmin);

  if (window.location.pathname.endsWith('/counselor-login.html') || window.location.pathname.endsWith('counselor-login.html')) {
    if (isCounselorSession()) {
      window.location.replace(`${pagePrefix}profile.html`);
      return;
    }
  }

  if (window.location.pathname.endsWith('/admin-login.html') || window.location.pathname.endsWith('admin-login.html')) {
    if (getStoredAuth()?.user && (getStoredAuth().user.role === 'admin' || getStoredAuth().user.isAdmin)) {
      window.location.replace(`${pagePrefix}admin.html`);
      return;
    }
  }

  const renderAuthState = () => {
    const state = getStoredAuth();
    const loginHref = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
    const nav = document.querySelector('.site-nav');

    if (nav) {
      const counselorEntry = nav.querySelector('.nav-counselor');
      if (state?.user) {
        if (counselorEntry) counselorEntry.style.display = 'none';
      } else if (counselorEntry) {
        counselorEntry.style.display = '';
      }
    }

    if (nav) {
      const counselorMenu = nav.querySelector('.nav-counselor');
      const publicCounselorsMenu = Array.from(nav.querySelectorAll('a')).find((a) => a.textContent && a.textContent.trim() === 'Зөвлөхүүд');
      const counselorProfileMenu = nav.querySelector('.nav-counselor-dashboard');
      const adminMenu = nav.querySelector('.nav-admin');

      if (adminMenu) {
        adminMenu.style.display = '';
      }

      if (publicCounselorsMenu) {
        const isPsychologistsPage = window.location.pathname.endsWith('/psychologists.html') || window.location.pathname.endsWith('psychologists.html');
        if (isPsychologistsPage) {
          publicCounselorsMenu.style.display = '';
        } else {
          const hideCounselorMenu = !!(state?.user && (state.user.role === 'counselor' || state.user.psychologistId));
          publicCounselorsMenu.style.display = hideCounselorMenu ? 'none' : '';
        }
      }

      if (counselorProfileMenu) {
        const shouldShow = !!(state?.user && !(state.user.role === 'counselor' || state.user.psychologistId));
        counselorProfileMenu.style.display = shouldShow ? '' : 'none';
      }

      if (counselorMenu) {
        const hideRegisterEntry = !!state?.user;
        counselorMenu.style.display = hideRegisterEntry ? 'none' : '';
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

    // Hide parent page sections (hero, filters) and the 'Нүүр хуудас' link when a counselor is logged in
    try {
      const hero = document.querySelector('.page-hero');
      const filters = document.querySelector('.filter-bar');
      const homeLinks = Array.from(document.querySelectorAll('a[href$="index.html"], a[href$="/index.html"], a[href$="../index.html"]'));
      const shouldHideParent = !!(state?.user && state.user.role === 'counselor');

      const isPsychologistsPage = window.location.pathname.endsWith('/psychologists.html') || window.location.pathname.endsWith('psychologists.html');

      [hero, filters].forEach((el) => {
        if (!el) return;
        if (shouldHideParent && !isPsychologistsPage) {
          if (el._origDisplay === undefined) el._origDisplay = el.style.display || '';
          el.style.display = 'none';
        } else {
          if (el._origDisplay !== undefined) el.style.display = el._origDisplay;
          else el.style.display = '';
        }
      });

      homeLinks.forEach((a) => {
        if (shouldHideParent && !isPsychologistsPage) {
          if (a._origDisplay === undefined) a._origDisplay = a.style.display || '';
          a.style.display = 'none';
        } else {
          if (a._origDisplay !== undefined) a.style.display = a._origDisplay;
          else a.style.display = '';
        }
      });
    } catch (e) {
      console.error('renderAuthState parent-hide error', e);
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

  const redirectAfterAuth = (result) => {
    const user = result && result.user ? result.user : null;
    const isCounselorLogin = !!(user && (user.role === 'counselor' || user.psychologistId));
    const isAdminLogin = !!(user && (user.role === 'admin' || user.isAdmin));
    const target = isCounselorLogin
      ? (window.location.pathname.endsWith('therapist-login.html') ? 'therapist-profile.html' : (window.location.pathname.includes('/pages/') ? 'profile.html' : 'pages/profile.html'))
      : isAdminLogin
        ? (window.location.pathname.includes('/pages/') ? 'admin.html' : 'pages/admin.html')
        : '/index.html';
    window.location.href = target;
  };

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
        bio: formData.get('bio') || null,
        experience: formData.get('experience') !== undefined && formData.get('experience') !== null && formData.get('experience') !== '' ? Number(formData.get('experience')) : 0,
        expertise: formData.get('expertise') || null,
        city: formData.get('city') || null,
        qualifications: formData.get('qualifications') || null,
      };

      const response = await fetch(`${apiBase}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.ok) {
        localStorage.setItem('mindconnect-auth', JSON.stringify(result));
        notifyAuthUpdated();
        redirectAfterAuth(result);
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
        notifyAuthUpdated();
        redirectAfterAuth(result);
      } else {
        alert(result.error || 'Нэвтрэлт амжилтгүй боллоо');
      }
    });
  }

  const psychologistList = document.getElementById('psychologist-list');
  if (psychologistList) {
    window.refreshPsychologistList = async () => {
      const response = await fetch(`${apiBase}/api/psychologists`);
      return renderPsychologistCards(psychologistList, await response.json());
    };
    await window.refreshPsychologistList();
  }

  const detailContainer = document.getElementById('psychologist-detail');
  if (detailContainer) {
    const params = new URLSearchParams(window.location.search);
    const psychologistId = params.get('id') || '1';
    const response = await fetch(`${apiBase}/api/psychologists/${psychologistId}`);
    const psychologist = await response.json();

    const pageTitle = document.querySelector('.page-title');
    const pageSubtitle = document.querySelector('.page-subtitle');
    if (pageTitle) pageTitle.textContent = psychologist.name || 'Зөвлөх';
    if (pageSubtitle) pageSubtitle.textContent = `Зөвлөх · ${psychologist.experience || 0} жил туршлага · ${psychologist.city || 'Улаанбаатар'}`;

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
      <article class="psych-profile-summary">
        <div class="psych-profile-avatar">${(psychologist.name || 'З').charAt(0)}</div>
        <div class="psych-profile-copy">
          <p class="eyebrow">Зөвлөхийн профайл</p>
          <h2>${psychologist.name || 'Зөвлөх'}</h2>
          <p>${psychologist.experience || 0} жил туршлага · ${psychologist.city || 'Улаанбаатар'}</p>
          <div class="psych-profile-meta"><span>★ ${(psychologist.rating || 0).toFixed(1)}</span><span>${psychologist.focus || 'Мэргэжлийн зөвлөгөө'}</span><strong>₮${(psychologist.price || 0).toLocaleString()}</strong></div>
          <p class="psych-profile-bio">${psychologist.bio || 'Үйлчлүүлэгч бүрт тохирсон дэмжлэг үзүүлэхэд анхаардаг.'}</p>
        </div>
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

  // Hero renderer: show counselor profile in homepage hero when logged-in counselor-like user
  const renderHeroForCounselor = () => {
    try {
      const heroCopy = document.querySelector('.hero-copy');
      const heroVisual = document.querySelector('.hero-visual');
      if (!heroCopy) return;

      // cache original html on first run
      if (!heroCopy._originalHtml) heroCopy._originalHtml = heroCopy.innerHTML;
      if (heroVisual && heroVisual._originalDisplay === undefined) heroVisual._originalDisplay = heroVisual.style.display || '';

      const stored = getStoredAuth();
      const u = stored && stored.user ? stored.user : null;
      const isCounselorLike = !!(u && (u.role === 'counselor' || u.psychologistId || u.expertise || u.qualifications));

      if (!isCounselorLike) {
        // restore original hero
        if (heroCopy._originalHtml) heroCopy.innerHTML = heroCopy._originalHtml;
        if (heroVisual) heroVisual.style.display = heroVisual._originalDisplay;
        return;
      }

      // build avatar
      const heroAvatar = u && u.avatar
        ? `<img src="${u.avatar}" alt="avatar" style="width:120px;height:120px;object-fit:cover;border-radius:12px;"/>`
        : `<div style="width:120px;height:120px;border-radius:12px;background:var(--muted);color:white;display:flex;align-items:center;justify-content:center;font-size:40px">${(u && u.name||'')[0]||''}</div>`;

      heroCopy.innerHTML = `
        <div class="hero-badges">
          <span class="pill">Зөвлөхийн профайл</span>
        </div>
        <div style="display:flex;gap:1.25rem;align-items:flex-start;flex-wrap:wrap">
          <div style="flex:0 0 auto">${heroAvatar}</div>
          <div style="min-width:0">
            <h2 style="margin:0;font-size:1.6rem">${u.name || '—'}</h2>
            <div style="color:var(--muted);margin-top:0.25rem">${u.expertise || u.profession || ''}</div>
            <div style="margin-top:0.5rem;color:var(--muted)">Туршлага: ${u.experience || 0} жил · Хот: ${u.city || '—'}</div>
            <p style="margin-top:0.6rem;max-width:60ch">${u.bio || 'Товч танилцуулга оруулаагүй байна.'}</p>
            <div class="hero-actions hero-actions--jobs" style="margin-top:0.75rem">
              <a class="btn btn-primary" href="pages/profile.html">Профайл харах</a>
              <a class="btn btn-secondary" href="pages/profile.html">Профайл засах</a>
            </div>
          </div>
        </div>
      `;

      if (heroVisual) heroVisual.style.display = 'none';
    } catch (e) {
      console.error('renderHeroForCounselor error', e);
    }
  };

  // initial render and listen for storage changes (other tabs)
  renderHeroForCounselor();
  window.addEventListener('storage', (e) => {
    if (e.key === 'mindconnect-auth') renderHeroForCounselor();
  });
  window.addEventListener('mindconnect-auth-updated', () => {
    renderAuthState();
    renderHeroForCounselor();
  });

  // Refresh commonly updated UI parts after auth/profile changes
  const refreshAllViews = async () => {
    try {
      // If we have a token, ask server for the canonical user object to pick up server-side changes
      const stored = getStoredAuth();
      if (stored && stored.token) {
        try {
          const meResp = await fetch(`${apiBase}/api/auth`, { headers: { Authorization: `Bearer ${stored.token}` } });
          if (meResp.ok) {
            const meJson = await meResp.json().catch(() => ({}));
            if (meJson && meJson.user) {
              localStorage.setItem('mindconnect-auth', JSON.stringify({ user: meJson.user, token: stored.token }));
            }
          }
        } catch (e) { /* ignore network errors */ }
      }
    } catch (e) { /* ignore */ }
    try { renderAuthState(); } catch (e) { /* ignore */ }
    try { renderHeroForCounselor(); } catch (e) { /* ignore */ }
    try { await updateHomeAppointment(); } catch (e) { /* ignore */ }
    try {
      const pl = document.getElementById('psychologist-list');
      if (pl) {
        const res = await fetch(`${apiBase}/api/psychologists`);
        renderPsychologistCards(pl, await res.json());
      }
    } catch (e) { /* ignore */ }
  };

  // Poll server periodically to pick up any server-side profile changes
  try {
    setInterval(() => {
      const stored = JSON.parse(localStorage.getItem('mindconnect-auth') || 'null');
      if (stored && stored.token) {
        refreshAllViews().catch(() => {});
      }
    }, 15000);
  } catch (e) { /* ignore */ }

  const adminPage = document.getElementById('admin-page');
  if (adminPage) {
    const stored = getStoredAuth();
    if (!stored?.user || !stored.user.isAdmin) {
      window.location.href = `${pagePrefix}login.html`;
      return;
    }

    const counselorTable = document.getElementById('admin-counselor-list');
    const clientTable = document.getElementById('admin-client-list');

    const renderUserRow = (user) => `
      <tr>
        <td><input type="text" data-name-field="${user.id}" value="${(user.name || '').replace(/"/g, '&quot;')}" /></td>
        <td><input type="email" data-email-field="${user.id}" value="${(user.email || '').replace(/"/g, '&quot;')}" /></td>
        <td>
          <label style="display:flex;align-items:center;gap:0.5rem;">
            <input type="checkbox" data-active-field="${user.id}" ${user.isActive ? 'checked' : ''} />
            ${user.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
          </label>
        </td>
        <td>
          <button class="btn btn-secondary admin-save" data-user-id="${user.id}">Хадгалах</button>
          <button class="btn btn-danger admin-toggle" data-user-id="${user.id}" data-state="${user.isActive ? 'disable' : 'enable'}">${user.isActive ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}</button>
          <button class="btn btn-danger admin-delete" data-user-id="${user.id}">Устгах</button>
        </td>
      </tr>
    `;

    const loadAdminUsers = async () => {
      const response = await fetch(`${apiBase}/api/admin/users`, {
        headers: { Authorization: `Bearer ${stored.token}` },
      });
      const result = await response.json();
      if (!response.ok) {
        counselorTable.innerHTML = `<tr><td colspan="4"><p>Ошибка: ${result.error || 'Не удалось загрузить пользователей'}</p></td></tr>`;
        clientTable.innerHTML = `<tr><td colspan="4"><p>Ошибка: ${result.error || 'Не удалось загрузить пользователей'}</p></td></tr>`;
        return;
      }

      const users = (result.users || []).filter((user) => user.role !== 'admin');
      const counselors = users.filter((user) => user.role === 'counselor');
      const clients = users.filter((user) => user.role === 'client');

      counselorTable.innerHTML = counselors.length
        ? counselors.map(renderUserRow).join('')
        : '<tr><td colspan="4">Зөвлөх байхгүй байна.</td></tr>';
      clientTable.innerHTML = clients.length
        ? clients.map(renderUserRow).join('')
        : '<tr><td colspan="4">Үйлчлүүлэгч байхгүй байна.</td></tr>';

      document.querySelectorAll('.admin-save').forEach((button) => {
        button.addEventListener('click', async () => {
          const userId = Number(button.dataset.userId);
          const nameField = document.querySelector(`input[data-name-field="${userId}"]`);
          const emailField = document.querySelector(`input[data-email-field="${userId}"]`);
          const isActiveField = document.querySelector(`input[data-active-field="${userId}"]`);
          const payload = {
            id: userId,
            name: nameField ? nameField.value : '',
            email: emailField ? emailField.value : '',
            isActive: !!(isActiveField && isActiveField.checked),
          };
          const response = await fetch(`${apiBase}/api/admin/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stored.token}` },
            body: JSON.stringify(payload),
          });
          const result = await response.json().catch(() => ({}));
          if (response.ok) {
            alert('Мэдээлэл шинэчлэгдлээ.');
            await loadAdminUsers();
          } else {
            alert(result.error || 'Шинэчлэх үед алдаа гарлаа');
          }
        });
      });

      document.querySelectorAll('.admin-toggle').forEach((button) => {
        button.addEventListener('click', async () => {
          const userId = Number(button.dataset.userId);
          const nextState = button.dataset.state === 'enable';
          const response = await fetch(`${apiBase}/api/admin/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stored.token}` },
            body: JSON.stringify({ id: userId, isActive: nextState }),
          });
          const result = await response.json().catch(() => ({}));
          if (response.ok) {
            await loadAdminUsers();
          } else {
            alert(result.error || 'Төлөв өөрчлөх үед алдаа гарлаа');
          }
        });
      });

      document.querySelectorAll('.admin-delete').forEach((button) => {
        button.addEventListener('click', async () => {
          const userId = Number(button.dataset.userId);
          const shouldDelete = window.confirm('Энэ хэрэглэгчийг устгах уу?');
          if (!shouldDelete) return;

          const response = await fetch(`${apiBase}/api/admin/users`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stored.token}` },
            body: JSON.stringify({ id: userId }),
          });
          const result = await response.json().catch(() => ({}));
          if (response.ok) {
            alert('Хэрэглэгчийг устгалаа.');
            await loadAdminUsers();
          } else {
            alert(result.error || 'Устгах үед алдаа гарлаа');
          }
        });
      });
    };

    loadAdminUsers();
  }

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
          <div style="min-width:0">
            <div style="font-weight:700;font-size:1.1rem">${authState.user.name || '—'}</div>
            <div style="color:var(--muted);margin-top:0.25rem">${authState.user.profession || authState.user.expertise || ''}</div>
            <div style="margin-top:0.5rem;color:var(--muted)">Email: ${authState.user.email || '—'}</div>
            <div style="margin-top:0.25rem;color:var(--muted)">Туршлага: ${authState.user.experience || 0} жил · Хот: ${authState.user.city || '—'}</div>
            <div style="margin-top:0.25rem;color:var(--muted)">Мэргэжил: ${authState.user.expertise || '—'}</div>
            <div style="margin-top:0.25rem;color:var(--muted)">Мэргэшсэн чиглэл / Сонголтууд: ${authState.user.qualifications || '—'}</div>
            <div style="margin-top:0.25rem;color:var(--muted)">Нас: ${authState.user.age || '—'} · Хүйс: ${authState.user.gender || '—'} · Гэр бүлийн байдал: ${authState.user.maritalStatus || authState.user.marital_status || '—'}</div>
            <div style="margin-top:0.5rem;max-width:64ch">${authState.user.bio || ''}</div>
            <div style="margin-top:0.5rem;color:var(--muted)"><strong>Сонирхол:</strong> ${authState.user.interests || '—'}</div>
            <div style="margin-top:0.25rem;color:var(--muted)"><strong>Сэтгэл зүйн асуудлын төрөл:</strong> ${authState.user.issues || '—'}</div>
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
        // attach Authorization header using stored token
        const stored = JSON.parse(localStorage.getItem('mindconnect-auth') || 'null');
        const headers = { 'Content-Type': 'application/json' };
        if (stored && stored.token) headers.Authorization = `Bearer ${stored.token}`;
        const resp = await fetch(`${apiBase}/api/auth`, {
          method: 'POST', headers, body: JSON.stringify(payload)
        });
        const result = await resp.json().catch(() => ({}));
        if (resp.ok) {
          localStorage.setItem('mindconnect-auth', JSON.stringify(result));
          notifyAuthUpdated();
          alert('Профайл шинэчлэгдлээ');
          // update UI
          const newState = getStoredAuth();
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
          // refresh common UI areas (hero, nav, appointments, lists)
          try { await refreshAllViews(); } catch (e) { /* ignore */ }
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
    const state = getStoredAuth();
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

    const hydrateProfileForm = (user) => {
      if (!user) return;
      nameInput.value = user.name || '';
      emailInput.value = user.email || '';
      phoneInput.value = user.phone || '';
      bioInput.value = user.bio || '';
      if (avatarPreview) {
        if (user.avatar) {
          avatarPreview.src = user.avatar;
          avatarPreview.style.display = 'block';
        } else {
          avatarPreview.style.display = 'none';
        }
      }
      if (user.role === 'counselor' || user.psychologistId) {
        counselorFields.style.display = 'block';
        clientFields.style.display = 'none';
        if (user.psychologistId && psychologistSelect) psychologistSelect.value = String(user.psychologistId);
        experienceInput.value = user.experience || '';
        expertiseInput.value = user.expertise || '';
        qualificationsInput.value = user.qualifications || '';
      } else {
        clientFields.style.display = 'block';
        counselorFields.style.display = 'none';
        cityInput.value = user.city || '';
        ageInput.value = user.age || '';
        genderSelect.value = user.gender || '';
        professionInput.value = user.profession || '';
        maritalSelect.value = user.maritalStatus || user.marital_status || '';
        interestsInput.value = user.interests || '';
        issuesInput.value = user.issues || '';
      }
    };

    const syncProfileFromServer = async () => {
      const stored = getStoredAuth();
      if (!stored || !stored.token) return stored && stored.user ? stored.user : null;
      try {
        const meResp = await fetch(`${apiBase}/api/auth`, {
          headers: { Authorization: `Bearer ${stored.token}` }
        });
        if (!meResp.ok) return stored.user;
        const meJson = await meResp.json().catch(() => ({}));
        if (meJson && meJson.user) {
          localStorage.setItem('mindconnect-auth', JSON.stringify({ user: meJson.user, token: stored.token }));
          return meJson.user;
        }
      } catch (e) {
        console.warn('Profile sync failed', e);
      }
      return stored.user;
    };

    const activeUser = await syncProfileFromServer();
    if (!activeUser) {
      window.location.href = `${pagePrefix}login.html`;
      return;
    }
    hydrateProfileForm(activeUser);

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
      const currentUserState = getStoredAuth();
      const activeProfileUser = currentUserState && currentUserState.user ? currentUserState.user : state.user;
      let bookings = [];
      if (activeProfileUser.role === 'counselor' && activeProfileUser.psychologistId) {
        const res = await fetch(`${apiBase}/api/bookings?psychologistId=${activeProfileUser.psychologistId}`);
        bookings = await res.json();
      } else if (activeProfileUser.email) {
        const res = await fetch(`${apiBase}/api/bookings?userEmail=${encodeURIComponent(activeProfileUser.email)}`);
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

      const currentUserState = getStoredAuth();
      const activeProfileUser = currentUserState && currentUserState.user ? currentUserState.user : state.user;
      const payload = {
        action: 'update',
        id: activeProfileUser.id,
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
      if (activeProfileUser.role === 'counselor' || activeProfileUser.psychologistId) {
        payload.role = 'counselor';
        payload.psychologistId = activeProfileUser.psychologistId || (psychologistSelect && psychologistSelect.value ? Number(psychologistSelect.value) : null);
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

      const stored = JSON.parse(localStorage.getItem('mindconnect-auth') || 'null');
      const headers = { 'Content-Type': 'application/json' };
      if (stored && stored.token) headers.Authorization = `Bearer ${stored.token}`;
      const res = await fetch(`${apiBase}/api/auth`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        localStorage.setItem('mindconnect-auth', JSON.stringify(result));
        notifyAuthUpdated();
        alert('Мэдээлэл амжилттай хадгалагдлаа.');
        // refresh state and header (and other UI areas)
        try { await refreshAllViews(); } catch (e) { /* ignore */ }
      } else {
        alert(result.error || 'Мэдээлэл хадгалах үед алдаа гарлаа');
      }
    });
  }
});
