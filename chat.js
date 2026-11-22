(function () {
  const apiBase = window.location.origin === 'null' || window.location.origin === 'file:' ? 'http://localhost:8000' : window.location.origin;
  const auth = () => { try { return JSON.parse(localStorage.getItem('mindconnect-auth') || 'null'); } catch { return null; } };
  const profiles = {
    'Д. Нарантуяа': { photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop&auto=format', categories: ['personal', 'couples'], specialties: ['Стресс ба сэтгэлийн зовниул', 'Харилцааны бэрхшээл', 'Өөрийгөө хайрлах'], experience: 9, price: 80000, format: 'Онлайн' },
    'Б. Энхжаргал': { photo: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=200&h=200&fit=crop&auto=format', categories: ['couples', 'family', 'personal'], specialties: ['Гэр бүлийн зөрчил', 'Харилцааны бэрхшээл', 'Гэрлэлт цуцлалт'], experience: 15, price: 100000, format: 'Биечлэн' },
    'Г. Батбаяр': { photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&auto=format', categories: ['personal', 'other'], specialties: ['Ажил мэргэжлийн бэрхшээл', 'Гүйцэтгэлийн дасгалжуулалт', 'Урам зориг ба өөртөө итгэх'], experience: 7, price: 70000, format: 'Онлайн' },
    'О. Цэцэгмаа': { photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&auto=format', age: 51, city: 'Баянгол, Улаанбаатар', categories: ['personal', 'teen'], specialties: ['Гэмт хэрэг ба хүчирхийлэл', 'Гэмтлийн дараах стресс (PTSD)', 'Паник дарамт ба халдлага', 'Донтолтоос гарах'], experience: 18, price: 120000, format: 'Онлайн', bio: '18 жилийн туршлагатай О. Цэцэгмаа нь гэмтэл, хүчирхийлэл, паник халдлага болон донтолтоос гарах чиглэлд нарийн мэргэшсэн эмч.' },
    'Т. Мөнхбаяр': { photo: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop&auto=format', categories: ['teen', 'personal'], specialties: ['Нийгмийн түгшүүр ба фоби', 'Хоол тэжээлийн эмгэг', 'Нойрны эмгэг'], experience: 11, price: 90000, format: 'Онлайн' },
    'Н. Солонго': { photo: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=200&h=200&fit=crop&auto=format', categories: ['personal', 'couples'], specialties: ['Дотно харилцааны асуудал', 'Өөрийгөө хайрлах', 'Амьдралын зорилго'], experience: 4, price: 60000, format: 'Онлайн' }
  };
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let allTherapists = [];
  const profileModal = document.getElementById('chat-profile-modal');
  const profileContent = document.getElementById('chat-profile-content');
  const request = async (path, options = {}) => {
    const response = await fetch(`${apiBase}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth()?.token || ''}`, ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Хүсэлт амжилтгүй боллоо');
    return data;
  };
  const startConversation = async (therapistId) => {
    const result = await request('/api/chat/conversations', { method: 'POST', body: JSON.stringify({ therapistId: Number(therapistId) }) });
    if (result.guestToken) sessionStorage.setItem(`mindconnect-guest-chat-${result.conversation.id}`, result.guestToken);
    window.location.href = `/chat/${result.conversation.id}`;
  };
  const therapists = document.getElementById('chat-therapists');
  if (therapists) {
    const render = () => {
      const category = document.getElementById('chat-category').value;
      const specialty = document.getElementById('chat-specialty').value;
      const items = allTherapists.filter((item) => {
        const profile = profiles[item.name] || {};
        return (!category || profile.categories?.includes(category)) && (!specialty || profile.specialties?.includes(specialty));
      });
      document.querySelector('.chat-list-label').textContent = `${items.length} ЗӨВЛӨХ ОЛДЛОО`;
      therapists.innerHTML = items.length ? items.map((item) => {
        const profile = profiles[item.name] || {};
        const tags = (profile.specialties || [item.focus || item.specialty]).slice(0, 3);
        return `<article class="chat-therapist-card">
          <div class="chat-card-head"><img src="${esc(profile.photo || '')}" alt="${esc(item.name)}" /><div><h3>${esc(item.name)} <span class="verified">✓</span></h3><p>Сэтгэл зүйч</p><strong>${profile.experience || item.experience || 0} жил · ${Number(profile.price || item.price || 0).toLocaleString('mn-MN')}₮</strong></div></div>
          <div class="chat-tags">${tags.map((tag) => `<span>${esc(tag)}</span>`).join('')}</div>
          <div class="chat-availability"><span>ЧАТЛАХ ЦАГ</span><strong>Чатлах цаг тохиролцоно</strong></div>
          <div class="chat-card-actions"><button type="button" data-detail-id="${item.id}">Дэлгэрэнгүй</button><a href="psychologist.html?id=${item.id}">Цаг сонгох</a><button type="button" class="chat-start-button" data-therapist-id="${item.id}">Шууд чатлах</button></div>
        </article>`;
      }).join('') : '<p class="chat-empty">Шүүлтүүрт тохирох зөвлөх олдсонгүй.</p>';
      therapists.querySelectorAll('[data-therapist-id]').forEach((button) => button.addEventListener('click', async () => {
        try { await startConversation(button.dataset.therapistId); } catch (error) { alert(error.message); }
      }));
      therapists.querySelectorAll('[data-detail-id]').forEach((button) => button.addEventListener('click', () => showProfile(button.dataset.detailId)));
    };
    fetch(`${apiBase}/api/psychologists`).then((response) => response.json()).then((items) => {
      allTherapists = items.filter((item) => profiles[item.name]);
      const specialtySelect = document.getElementById('chat-specialty');
      [...new Set(allTherapists.flatMap((item) => profiles[item.name].specialties))].forEach((specialty) => specialtySelect.insertAdjacentHTML('beforeend', `<option value="${esc(specialty)}">${esc(specialty)}</option>`));
      render();
    }).catch(() => { therapists.innerHTML = '<p class="chat-empty">Зөвлөхийн мэдээлэл ачаалж чадсангүй.</p>'; });
    ['chat-category', 'chat-specialty', 'chat-day', 'chat-time'].forEach((id) => document.getElementById(id).addEventListener('change', render));
  }
  const showProfile = (id) => {
    const item = allTherapists.find((therapist) => String(therapist.id) === String(id));
    if (!item || !profileModal || !profileContent) return;
    const profile = profiles[item.name] || {};
    const tags = profile.specialties || [item.focus || item.specialty];
    const price = Number(profile.price || item.price || 0).toLocaleString('mn-MN');
    const location = profile.city || item.city || 'Баянгол, Улаанбаатар';
    const format = profile.format || 'Онлайн';
    const tabContent = {
      overview: `<div class="chat-profile-about"><div><h3>Миний тухай</h3><p>${esc(profile.bio || item.bio || `${item.name} нь үйлчлүүлэгчдэдээ аюулгүй, дэмжлэг үзүүлэх орчинг бүрдүүлэн ажилладаг мэргэжлийн сэтгэл зүйч юм.`)}</p></div><aside><span>БОЛОВСРОЛ</span><strong>Сэтгэл судлал</strong><p>Монгол Улсын Их Сургууль</p><p>Хэл: Монгол</p></aside></div>`,
      specialties: `<div class="chat-profile-tab-panel"><div class="chat-profile-specialty-tags">${tags.map((tag) => `<span>${esc(tag)}</span>`).join('')}</div></div>`,
      location: `<div class="chat-profile-tab-panel"><h3>Үйлчилгээний байршил</h3><p>${esc(location)}</p><p class="chat-profile-highlight">${esc(format)} · ${format === 'Онлайн' ? 'Google Meet' : 'Клиник / оффис'}</p></div>`,
      price: `<div class="chat-profile-price-panel"><div class="chat-price-card"><span>Нэг удаагийн уулзалт</span><strong>${price}₮</strong><small>60 минут</small></div><div class="chat-payment-card"><strong>Төлбөрийн сонголт</strong><p>QPay, SocialPay болон дансны QR-аар төлөх боломжтой.</p><span>МЭДЭЭЛЭЛ ХАРАХ&nbsp; →</span></div></div>`
    };
    profileContent.innerHTML = `
      <div class="chat-profile-intro">
        <img src="${esc(profile.photo || '')}" alt="${esc(item.name)}" />
        <div>
          <h2 id="chat-profile-name">${esc(item.name)} <span class="verified">✓ Баталгаажсан</span></h2>
          <strong>Сэтгэл зүйч</strong>
          <p>${profile.age ? `${profile.age} нас · ` : ''}${profile.experience || item.experience || 0} жилийн туршлага</p>
          <p>✦ ${esc(profile.city || item.city || 'Баянгол, Улаанбаатар')}</p>
          <div class="chat-profile-tags">${tags.map((tag) => `<span>${esc(tag)}</span>`).join('')}</div>
        </div>
      </div>
      <div class="chat-profile-summary"><div><span>ЧАТЛАХ БОЛОМЖТОЙ</span><strong>Чатлах цаг тохиролцоно</strong></div><div><span>ҮЙЛЧИЛГЭЭНИЙ ҮНЭ</span><strong>${price}₮</strong><small>60 минут</small></div><div><span>ХЭЛБЭР</span><strong>${esc(format)}</strong></div></div>
      <div class="chat-profile-tabs"><button class="active" type="button" data-profile-tab="overview">Танилцуулга</button><button type="button" data-profile-tab="specialties">Мэргэшил</button><button type="button" data-profile-tab="location">Байршил</button><button type="button" data-profile-tab="price">Үнэ, төлбөр</button></div>
      <div id="chat-profile-tab-content">${tabContent.overview}</div>
      <button type="button" class="chat-profile-start chat-start-button" data-therapist-id="${item.id}">Нэвтрэхгүйгээр шууд чатлах</button>`;
    profileModal.hidden = false;
    const tabContentElement = profileContent.querySelector('#chat-profile-tab-content');
    profileContent.querySelectorAll('[data-profile-tab]').forEach((tab) => tab.addEventListener('click', () => {
      profileContent.querySelectorAll('[data-profile-tab]').forEach((button) => button.classList.toggle('active', button === tab));
      tabContentElement.innerHTML = tabContent[tab.dataset.profileTab];
    }));
    profileModal.querySelector('[data-therapist-id]').addEventListener('click', async (event) => {
      try { await startConversation(event.currentTarget.dataset.therapistId); } catch (error) { alert(error.message); }
    });
  };
  profileModal?.querySelectorAll('[data-close-profile]').forEach((button) => button.addEventListener('click', () => { profileModal.hidden = true; }));
  const list = document.getElementById('conversation-list');
  if (list) request('/api/chat/conversations').then(({ conversations }) => {
    list.innerHTML = conversations.length ? conversations.map((item) => `<a class="info-card" style="display:block;margin-top:1rem" href="/chat/${item.id}"><h3>Яриа #${item.id}</h3><p>Сүүлд шинэчлэгдсэн: ${new Date(item.last_message_at).toLocaleString('mn-MN')}</p></a>`).join('') : '<p class="empty-state">Одоогоор чат алга.</p>';
  }).catch((error) => { list.textContent = error.message; });

  const thread = document.getElementById('chat-thread');
  if (thread) {
    const id = new URLSearchParams(window.location.search).get('id') || window.location.pathname.match(/\/chat\/(\d+)$/)?.[1];
    const messages = thread.querySelector('#chat-messages');
    const status = thread.querySelector('#chat-status');
    const token = auth()?.token;
    const guestToken = sessionStorage.getItem(`mindconnect-guest-chat-${id}`);
    const chatToken = token || guestToken;
    if (!chatToken || !id || (!window.AblyPubSub && !window.Ably)) {
      if (status) status.textContent = !chatToken ? 'Chat session олдсонгүй. Дахин “Шууд чатлах” товч дарна уу.' : 'Realtime chat ачаалж чадсангүй.';
    } else {
      const currentUser = auth()?.user || {};
      const channelName = `mindconnect:chat:${id}`;
      const clientId = `mindconnect-user-${currentUser.id || `guest-${id}`}`;
      const escapeMessage = (item) => `<p class="chat-message ${Number(item.senderId) === Number(currentUser.id) ? 'mine' : ''}"><strong>${esc(item.senderName || 'Оролцогч')}</strong><span>${esc(item.body)}</span><small>${new Date(item.createdAt || Date.now()).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}</small></p>`;
      const appendMessage = (item) => {
        messages.insertAdjacentHTML('beforeend', escapeMessage(item));
        messages.scrollTop = messages.scrollHeight;
      };
      const realtimeOptions = {
        authUrl: `${apiBase}/api/ably/token?conversationId=${encodeURIComponent(id)}`,
        authHeaders: token
          ? { Authorization: `Bearer ${token}` }
          : { 'X-Guest-Chat-Token': guestToken },
        clientId,
      };
      const realtime = window.AblyPubSub
        ? window.AblyPubSub.createClient(realtimeOptions)
        : new window.Ably.Realtime(realtimeOptions);
      const channel = realtime.channels.get(channelName);
      channel.subscribe((message) => {
        const data = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
        appendMessage(data);
      });
      realtime.connection.on((stateChange) => {
        if (status) status.textContent = stateChange.current === 'connected'
          ? 'Шууд холболт идэвхтэй'
          : `Холболтын төлөв: ${stateChange.current}`;
      });
      thread.querySelector('#chat-message-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const input = event.currentTarget.elements.body;
        const body = String(input.value || '').trim();
        if (!body) return;
        channel.publish('chat-message', {
          body,
          senderId: currentUser.id,
          senderName: currentUser.name || currentUser.email || 'Үйлчлүүлэгч',
          createdAt: new Date().toISOString(),
        }).then(() => { input.value = ''; }).catch((error) => {
          if (status) status.textContent = error.message || 'Мессеж илгээж чадсангүй.';
        });
      });
    }
  }
})();
