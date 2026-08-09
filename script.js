document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

  const authLink = document.querySelector('.nav-cta');
  const apiBase = (window.location.origin === 'null' || window.location.origin === 'file:')
    ? 'http://localhost:8000'
    : window.location.origin;

  const renderAuthState = () => {
    const state = JSON.parse(localStorage.getItem('mindconnect-auth') || 'null');
    const loginHref = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';

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
        password: formData.get('password')
      };

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.ok) {
        localStorage.setItem('mindconnect-auth', JSON.stringify(result));
        window.location.href = '../index.html';
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

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.ok) {
        localStorage.setItem('mindconnect-auth', JSON.stringify(result));
        window.location.href = '../index.html';
      } else {
        alert(result.error || 'Нэвтрэлт амжилтгүй боллоо');
      }
    });
  }

  const psychologistList = document.getElementById('psychologist-list');
  if (psychologistList) {
    const response = await fetch(`${apiBase}/api/psychologists`);
    const psychologists = await response.json();
    psychologistList.innerHTML = psychologists.map((psychologist) => `
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
    `).join('');
  }

  const detailContainer = document.getElementById('psychologist-detail');
  if (detailContainer) {
    const params = new URLSearchParams(window.location.search);
    const psychologistId = params.get('id') || '1';
    const response = await fetch(`${apiBase}/api/psychologists/${psychologistId}`);
    const psychologist = await response.json();
    const selectedSlotInitial = psychologist.availability[0] || '';

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
        <div class="booking-grid">
          ${psychologist.availability.map((slot) => `<button class="slot" data-slot="${slot}">${slot}</button>`).join('')}
        </div>
        <p class="selected-slot-text">Сонгосон цаг: <strong id="selected-slot-text">${selectedSlotInitial}</strong></p>
        <p class="booking-note">Нэр, имэйл шаардлагагүй. Цаг сонгоход захиалга бүртгэгдэнэ.</p>
        <form id="booking-form" style="margin-top: 1rem;">
          <input type="text" name="name" placeholder="Нэр (заавал биш)" />
          <input type="email" name="email" placeholder="Имэйл (заавал биш)" />
          <input type="hidden" name="psychologistId" value="${psychologist.id}" />
          <input type="hidden" name="selectedSlot" id="selected-slot" value="${selectedSlotInitial}" />
          <textarea name="notes" rows="4" placeholder="Тэмдэглэл"></textarea>
          <button class="btn btn-primary" type="submit">Баталгаажуулах</button>
        </form>
      </article>
    `;

    document.querySelectorAll('.slot').forEach((slot) => {
      slot.addEventListener('click', () => {
        document.querySelectorAll('.slot').forEach((item) => item.classList.remove('active'));
        slot.classList.add('active');
        document.getElementById('selected-slot').value = slot.dataset.slot;
        document.getElementById('selected-slot-text').textContent = slot.dataset.slot;
      });
    });

    const bookingForm = document.getElementById('booking-form');
    bookingForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(bookingForm);
      const payload = {
        psychologistId: Number(formData.get('psychologistId')),
        name: formData.get('name') || '',
        email: formData.get('email') || '',
        slot: formData.get('selectedSlot') || psychologist.availability[0] || '',
        notes: formData.get('notes')
      };

      const response = await fetch(`${apiBase}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      alert(`Захиалга амжилттай бүртгэгдлээ. ID: ${result.id}`);
    });
  }
});
