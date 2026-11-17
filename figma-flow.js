(function () {
  const app = document.getElementById('figma-app');
  if (!app) return;

  const readAuth = () => {
    try {
      return JSON.parse(localStorage.getItem('mindconnect-auth') || 'null');
    } catch (e) {
      return null;
    }
  };
  const authUser = (readAuth() || {}).user || null;
  // Counselor accounts keep the original home/list views.
  if (authUser && (authUser.role === 'counselor' || authUser.psychologistId || authUser.expertise || authUser.qualifications)) return;

  document.body.classList.add('figma-home');

  const apiBase = (window.location.origin === 'null' || window.location.origin === 'file:')
    ? 'http://localhost:8000'
    : window.location.origin;

  // ── Data (Figma reference) ────────────────────────────────────────────────

  const CATEGORIES = [
    { id: 'personal', label: 'Хувь хүний зөвлөгөө', icon: '🌱', desc: 'Өөрийгөө таньж, хөгжүүлэх замналд' },
    { id: 'couples', label: 'Хосын харилцааны зөвлөгөө', icon: '🫂', desc: 'Хосын хамтын ойлголцол, холбоо' },
    { id: 'teen', label: 'Өсвөр насны зөвлөгөө', icon: '🌟', desc: 'Залуучуудад зориулсан дэмжлэг' },
    { id: 'family', label: 'Хүүхдийн зөвлөгөө', icon: '🏡', desc: 'Хүүхдийн хөгжил, сэтгэл зүй' },
    { id: 'other', label: 'Бусад', icon: '✦', desc: 'Өөр чиглэлийн туслалцаа' }
  ];

  const SPECIALIZATIONS = [
    'Харилцааны бэрхшээл', 'Амьдралын зорилго', 'Ганцаардал / Тусгаарлагдал', 'Өөрийгөө хайрлах',
    'Нийгмийн түгшүүр ба фоби', 'Буруутгал ба ичгүүр', 'Гэмтлийн дараах стресс (PTSD)', 'Паник дарамт ба халдлага',
    'Хяналтын асуудал', 'Уучлал', 'Асрагчийн стресс', 'Жирэмслэлт ба төрөлт', 'Гэрлэлт цуцлалт',
    'Стресс ба сэтгэлийн зовниул', 'Донтолтоос гарах', 'ЛГБТК+ асуудал', 'Гэр бүлийн зөрчил',
    'Гэмт хэрэг ба хүчирхийлэл', 'Алдагдал ба гашуудал', 'Дотно харилцааны асуудал', 'Хоол тэжээлийн эмгэг',
    'Нойрны эмгэг', 'Эцэг эхийн асуудал', 'Урам зориг ба өөртөө итгэх', 'Уур хилэн удирдах',
    'Ажил мэргэжлийн бэрхшээл', 'Хоёр туйлт эмгэг', 'Амьдралын өөрчлөлттэй зохицох',
    'Гүйцэтгэлийн дасгалжуулалт', 'Энэрлийн ядаргаа', 'Анхаарал ба ADHD'
  ];

  const GENDERS = [
    { id: 'female', label: 'Эмэгтэй', icon: '♀' },
    { id: 'male', label: 'Эрэгтэй', icon: '♂' },
    { id: 'any', label: 'Хамаагүй', icon: '✦' }
  ];

  const AGE_GROUPS = [
    { id: '25-35', label: '25–35 нас' },
    { id: '35-45', label: '35–45 нас' },
    { id: '45-55', label: '45–55 нас' },
    { id: '55+', label: '55+ нас' }
  ];

  const AIMAGS = [
    'Архангай', 'Баян-Өлгий', 'Баянхонгор', 'Булган', 'Говь-Алтай',
    'Говьсүмбэр', 'Дархан-Уул', 'Дорноговь', 'Дорнод', 'Дундговь',
    'Завхан', 'Орхон', 'Өвөрхангай', 'Өмнөговь', 'Сүхбаатар',
    'Сэлэнгэ', 'Төв', 'Увс', 'Ховд', 'Хөвсгөл', 'Хэнтий',
    'Улаанбаатар'
  ];

  const UB_DISTRICTS = ['Багануур', 'Багахангай', 'Баянгол', 'Баянзүрх', 'Налайх', 'Сонгинохайрхан', 'Сүхбаатар', 'Хан-Уул', 'Чингэлтэй'];
  const OTHER_DISTRICTS = ['Төв', 'Зүүн', 'Баруун', 'Хойд', 'Өмнөд'];

  const PAYMENT_METHODS = [
    { id: 'qpay', label: 'QPay', icon: '📱' },
    { id: 'socialpay', label: 'SocialPay', icon: '💳' },
    { id: 'bank', label: 'Банкны шилжүүлэг', icon: '🏦' }
  ];

  const DAY_NAMES = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];

  // Display profiles of the design's therapists. The database holds the bookable rows (same names);
  // fields the database has no columns for (photo, gender, age, categories, formats, sessions) live here.
  const PROFILES = {
    'Д. Нарантуяа': {
      gender: 'female', age: 38, ageGroup: '35-45',
      photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop&auto=format',
      specializations: ['Стресс ба сэтгэлийн зовниул', 'Харилцааны бэрхшээл', 'Өөрийгөө хайрлах', 'Нийгмийн түгшүүр ба фоби', 'Уур хилэн удирдах', 'Урам зориг ба өөртөө итгэх'],
      categories: ['personal', 'couples'], format: ['online', 'inperson'],
      experience: 9, rating: 4.9, sessions: 342, price: 80000,
      bio: 'Сэтгэл зүйч Д. Нарантуяа нь 9 жилийн туршлагатай бөгөөд стресс, харилцааны бэрхшээл, өөрийгөө хайрлах сэдвүүдээр мэргэшсэн. Тэрбээр үйлчлүүлэгчдэдээ аюулгүй, дэмжлэг үзүүлэх орчинг бүрдүүлэхийг эрхэмлэдэг.'
    },
    'Б. Энхжаргал': {
      gender: 'female', age: 44, ageGroup: '35-45',
      photo: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=200&h=200&fit=crop&auto=format',
      specializations: ['Гэр бүлийн зөрчил', 'Гэрлэлт цуцлалт', 'Харилцааны бэрхшээл', 'Эцэг эхийн асуудал', 'Гэмтлийн дараах стресс (PTSD)', 'Алдагдал ба гашуудал'],
      categories: ['couples', 'family', 'personal'], format: ['inperson'],
      experience: 15, rating: 4.8, sessions: 521, price: 100000,
      bio: '15 жилийн туршлагатай Б. Энхжаргал нь гэр бүл, хосын харилцааны зөрчил, гэмт хэргийн дараах сэтгэл зүйн нөхөн сэргэлтийн чиглэлээр мэргэшсэн.'
    },
    'Г. Батбаяр': {
      gender: 'male', age: 36, ageGroup: '35-45',
      photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&auto=format',
      specializations: ['Ажил мэргэжлийн бэрхшээл', 'Гүйцэтгэлийн дасгалжуулалт', 'Урам зориг ба өөртөө итгэх', 'Стресс ба сэтгэлийн зовниул', 'Анхаарал ба ADHD', 'Амьдралын зорилго'],
      categories: ['personal', 'other'], format: ['online', 'inperson'],
      experience: 7, rating: 4.7, sessions: 198, price: 70000,
      bio: 'Г. Батбаяр нь ажил мэргэжлийн хөгжил, ADHD болон гүйцэтгэлийн дасгалжуулалтад чиглэсэн арга барилыг ашиглан үйлчлүүлэгчдэдээ тодорхой зорилгодоо хүрэхэд тусалдаг.'
    },
    'О. Цэцэгмаа': {
      gender: 'female', age: 51, ageGroup: '45-55',
      photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&auto=format',
      specializations: ['Гэмт хэрэг ба хүчирхийлэл', 'Гэмтлийн дараах стресс (PTSD)', 'Паник дарамт ба халдлага', 'Донтолтоос гарах', 'Ганцаардал / Тусгаарлагдал', 'Буруутгал ба ичгүүр'],
      categories: ['personal', 'teen'], format: ['online'],
      experience: 18, rating: 4.95, sessions: 680, price: 120000,
      bio: '18 жилийн туршлагатай О. Цэцэгмаа нь гэмтэл, хүчирхийлэл, паник халдлага болон донтолтоос гарах чиглэлд нарийн мэргэшсэн эмч.'
    },
    'Т. Мөнхбаяр': {
      gender: 'male', age: 42, ageGroup: '35-45',
      photo: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop&auto=format',
      specializations: ['Нийгмийн түгшүүр ба фоби', 'Хоол тэжээлийн эмгэг', 'Нойрны эмгэг', 'Хоёр туйлт эмгэг', 'ЛГБТК+ асуудал'],
      categories: ['teen', 'personal'], format: ['online', 'inperson'],
      experience: 11, rating: 4.75, sessions: 305, price: 90000,
      bio: 'Т. Мөнхбаяр нь өсвөр насны болон залуучуудын сэтгэл зүйн асуудал, ЛГБТК+ иргэдийн дэмжлэг болон хоол тэжээлийн эмгэгт чиглэсэн мэргэжилтэн.'
    },
    'Н. Солонго': {
      gender: 'female', age: 29, ageGroup: '25-35',
      photo: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=200&h=200&fit=crop&auto=format',
      specializations: ['Дотно харилцааны асуудал', 'Өөрийгөө хайрлах', 'Амьдралын зорилго', 'Амьдралын өөрчлөлттэй зохицох', 'Уучлал', 'Энэрлийн ядаргаа'],
      categories: ['personal', 'couples'], format: ['online'],
      experience: 4, rating: 4.6, sessions: 87, price: 60000,
      bio: 'Н. Солонго нь залуу хос болон хувь хүний хөгжилд анхаардаг бөгөөд өөрийгөө хайрлах, амьдралын утга учрыг олоход нь туслах арга барилыг ашигладаг.'
    }
  };

  // ── State ─────────────────────────────────────────────────────────────────

  const initialState = () => ({
    step: 0, category: '', specs: [], gender: 'any', ageGroup: '', format: '', aimag: '', district: '',
    screen: 'match', therapist: null, note: '',
    slots: [], offered: [], selectedSlot: null,
    cancelHours: 2, rescheduleHours: 24, paymentHoursBefore: 24, noRefundHours: 2, refundHours: 3,
    meetingLink: null, payment: '', submitting: false, error: ''
  });

  let s = initialState();
  let therapists = [];
  let status = 'loading';

  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const formatPrice = (n) => `${Number(n || 0).toLocaleString('mn-MN')}₮`;

  // ── Matching ──────────────────────────────────────────────────────────────

  // Only therapists that have a design profile are offered; the database row supplies the bookable id and times.
  const toTherapist = (p) => {
    const profile = PROFILES[p.name];
    if (!profile) return null;
    return {
      ...profile,
      id: p.id,
      name: p.name,
      availability: Array.isArray(p.availability) ? p.availability.slice().sort() : []
    };
  };

  const computeMatch = (t) => {
    let score = 0;
    let total = 0;
    total += 20; if (t.categories.includes(s.category)) score += 20;
    if (s.specs.length > 0) {
      total += 40;
      const matched = s.specs.filter((spec) => t.specializations.includes(spec)).length;
      score += Math.round((matched / s.specs.length) * 40);
    }
    total += 15; if (s.gender === 'any' || t.gender === s.gender) score += 15;
    if (s.ageGroup) { total += 10; if (t.ageGroup === s.ageGroup) score += 10; }
    total += 15; if (t.format.includes(s.format)) score += 15;
    return Math.round((score / total) * 100);
  };

  const getMatches = () => therapists
    .map((t) => ({ t, score: computeMatch(t) }))
    .filter((m) => m.score >= 50)
    .sort((a, b) => b.score - a.score);

  const resultStep = () => (s.format === 'inperson' ? 5 : 4);

  // Next 7 days, up to 4 random times per day taken from the therapist's real availability.
  const buildSlots = (t, taken) => {
    const slots = [];
    for (let d = 1; d <= 7; d += 1) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const label = `${DAY_NAMES[date.getDay()]}, ${date.getMonth() + 1}/${date.getDate()}`;
      t.availability
        .filter((time) => !taken.has(`${dateStr}|${time}`))
        .filter(() => Math.random() > 0.45)
        .slice(0, 4)
        .forEach((time) => slots.push({ date: dateStr, time, label, key: `${dateStr}-${time}` }));
    }
    return slots;
  };

  const endTime = (time) => {
    const [h, m] = String(time || '00:00').split(':').map(Number);
    return `${String(h + 1).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
  };

  const groupByDate = (slots) => slots.reduce((acc, slot) => {
    (acc[slot.date] = acc[slot.date] || []).push(slot);
    return acc;
  }, {});

  // ── UI pieces ─────────────────────────────────────────────────────────────

  const avatar = (t, size) => `<img class="fa-avatar fa-avatar-${size}" src="${esc(t.photo)}" alt="${esc(t.name)}" />`;
  const card = (inner, cls = '') => `<div class="fa-card ${cls}">${inner}</div>`;
  const label = (text) => `<p class="fa-label">${text}</p>`;
  const title = (inner) => `<h2 class="fa-title">${inner}</h2>`;
  const notif = (heading, inner) => `<div class="fa-notif"><div class="fa-notif-head"><span>🔔</span><span>${heading}</span></div><div class="fa-notif-body">${inner}</div></div>`;
  const btn = (text, act, opts = {}) => {
    const { variant = 'primary', disabled = false, val = '', size = '', auto = false, extra = '' } = opts;
    const cls = `fa-btn fa-btn-${variant}${size ? ` fa-btn-${size}` : ''}${auto ? ' fa-btn-auto' : ''}${extra ? ` ${extra}` : ''}`;
    return `<button type="button" class="${cls}" data-act="${act}" data-val="${esc(val)}"${disabled ? ' disabled' : ''}>${text}</button>`;
  };
  const tag = (text, active) => `<span class="fa-tag${active ? ' active' : ''}">${esc(text)}</span>`;
  const therapistBanner = (t) => `<div class="fa-banner"><span>👤</span><span>Сэтгэлзүйчийн харагдац — ${esc(t.name)}</span></div>`;

  const stepIndicator = (current, total) => {
    let html = '';
    for (let i = 0; i < total; i += 1) {
      const kind = i < current ? 'done' : i === current ? 'current' : 'todo';
      const inner = kind === 'done' ? '✓' : kind === 'current' ? String(i + 1) : '';
      html += `<div class="fa-step"><div class="fa-dot fa-dot-${kind}">${inner}</div>${i < total - 1 ? `<div class="fa-line${i < current ? ' done' : ''}"></div>` : ''}</div>`;
    }
    return `<div class="fa-steps">${html}</div>`;
  };

  // ── Match flow screens ────────────────────────────────────────────────────

  const canNext = () => {
    if (s.step === 0) return !!s.category;
    if (s.step === 1) return s.specs.length > 0;
    if (s.step === 3) return !!s.format;
    if (s.step === 4 && s.format === 'inperson') return !!s.aimag && !!s.district;
    return true;
  };

  const stepCategory = () => `
    <div class="fa-hero">
      <h1 class="fa-h1">Та ямар зөвлөгөө<br /><em>хүсч байна вэ?</em></h1>
      <p class="fa-sub">Өөртөө тохирох чиглэлийг сонгоно уу</p>
    </div>
    <div class="fa-grid">
      ${CATEGORIES.map((cat) => `
        <button type="button" class="fa-cat${s.category === cat.id ? ' selected' : ''}" data-act="category" data-val="${cat.id}">
          <span class="fa-cat-icon">${cat.icon}</span>
          <span><span class="fa-cat-title">${cat.label}</span><span class="fa-cat-desc">${cat.desc}</span></span>
          ${s.category === cat.id ? '<span class="fa-cat-check">✓</span>' : ''}
        </button>`).join('')}
    </div>
    <button type="button" class="fa-continue" data-act="next"${s.category ? '' : ' disabled'}>Үргэлжлүүлэх →</button>`;

  const stepSpecs = () => `
    <div class="fa-head">
      ${title('Ямар чиглэлээр мэргэшсэн<br /><em class="sage">байвал сайн бэ?</em>')}
      <p class="fa-sub sm">Нэг буюу хэд хэдийг сонгож болно</p>
    </div>
    <div class="fa-chips">
      ${SPECIALIZATIONS.map((spec) => `<button type="button" class="fa-chip${s.specs.includes(spec) ? ' selected' : ''}" data-act="spec" data-val="${esc(spec)}">${s.specs.includes(spec) ? '✓ ' : ''}${esc(spec)}</button>`).join('')}
    </div>
    ${s.specs.length > 0 ? `<p class="fa-count">${s.specs.length} сэдэв сонгогдлоо</p>` : ''}
    <div class="fa-row">${btn('← Буцах', 'prev', { variant: 'secondary' })}${btn('Үргэлжлүүлэх →', 'next', { variant: 'sage', disabled: !canNext() })}</div>`;

  const stepGender = () => `
    <div class="fa-head">
      ${title('Сэтгэлзүйчийн<br /><em>хүйс, насыг</em> сонгох уу?')}
      <p class="fa-sub sm">Заавал биш — хүссэн тохиолдолд сонгоно уу</p>
    </div>
    ${card(`${label('Хүйс')}<div class="fa-grid-3">${GENDERS.map((g) => `
      <button type="button" class="fa-opt${s.gender === g.id ? ' selected' : ''}" data-act="gender" data-val="${g.id}"><span class="fa-opt-icon">${g.icon}</span><span class="fa-opt-text">${g.label}</span></button>`).join('')}</div>`, 'fa-mb')}
    ${card(`${label('Насны хүрээ (заавал биш)')}<div class="fa-grid-2">${AGE_GROUPS.map((ag) => `
      <button type="button" class="fa-opt fa-opt-age${s.ageGroup === ag.id ? ' selected' : ''}" data-act="age" data-val="${ag.id}">${s.ageGroup === ag.id ? '✓ ' : ''}${ag.label}</button>`).join('')}</div>`, 'fa-mb-lg')}
    <div class="fa-row">${btn('← Буцах', 'prev', { variant: 'secondary' })}${btn('Үргэлжлүүлэх →', 'next')}</div>`;

  const stepFormat = () => {
    const options = [
      { id: 'online', label: 'Онлайн уулзалт', desc: 'Видео дуудлагаар, дурын газраас', icon: '💻' },
      { id: 'inperson', label: 'Биечлэн уулзалт', desc: 'Клиник буюу оффист биечлэн', icon: '🏢' }
    ];
    return `
      <div class="fa-head">${title('Хэрхэн уулзах<br /><em class="sage">хүсч байна вэ?</em>')}</div>
      <div class="fa-grid fa-grid-lg fa-mb-lg">
        ${options.map((opt) => `
          <button type="button" class="fa-fmt fa-fmt-${opt.id}${s.format === opt.id ? ' selected' : ''}" data-act="format" data-val="${opt.id}">
            <span class="fa-fmt-icon">${opt.icon}</span>
            <span><span class="fa-fmt-title">${opt.label}</span><span class="fa-fmt-desc">${opt.desc}</span></span>
            ${s.format === opt.id ? '<span class="fa-fmt-check">✓</span>' : ''}
          </button>`).join('')}
      </div>
      <div class="fa-row">${btn('← Буцах', 'prev', { variant: 'secondary' })}${btn(s.format === 'inperson' ? 'Байршил сонгох →' : 'Тохирох сэтгэлзүйч хайх →', 'next', { variant: 'sage', disabled: !s.format })}</div>`;
  };

  const stepLocation = () => {
    const districts = s.aimag === 'Улаанбаатар' ? UB_DISTRICTS : OTHER_DISTRICTS;
    return `
      <div class="fa-head">
        ${title('Та хаана<br /><em>байрладаг вэ?</em>')}
        <p class="fa-sub sm">Ойр орчмын сэтгэлзүйчийг олоход ашиглана</p>
      </div>
      ${card(`${label('Аймаг / Нийслэл')}<div class="fa-chips fa-chips-sm">${AIMAGS.map((a) => `<button type="button" class="fa-chip fa-chip-sm${s.aimag === a ? ' selected earth' : ''}" data-act="aimag" data-val="${esc(a)}">${esc(a)}</button>`).join('')}</div>`, 'fa-mb')}
      ${s.aimag ? card(`${label(s.aimag === 'Улаанбаатар' ? 'Дүүрэг' : 'Сум / Дүүрэг')}<div class="fa-chips fa-chips-sm">${districts.map((d) => `<button type="button" class="fa-chip fa-chip-sm${s.district === d ? ' selected warm' : ''}" data-act="district" data-val="${esc(d)}">${esc(d)}</button>`).join('')}</div>`, 'fa-mb-lg') : ''}
      <div class="fa-row">${btn('← Буцах', 'prev', { variant: 'secondary' })}${btn('Тохирох сэтгэлзүйч хайх →', 'next', { disabled: !s.aimag || !s.district })}</div>`;
  };

  const resultsScreen = () => {
    if (status === 'loading') return `<div class="fa-hero"><p class="fa-sub">Сэтгэлзүйчдийг ачаалж байна...</p></div>`;
    const matches = getMatches();
    const header = `
      <div class="fa-hero fa-hero-results">
        <div class="fa-spark">✦</div>
        <h2 class="fa-h2">Таны хувьд <em>тохирох</em><br />сэтгэлзүйчид</h2>
        <p class="fa-sub sm">${status === 'error' ? 'Сэтгэлзүйчдийн мэдээллийг ачаалж чадсангүй' : matches.length > 0 ? `${matches.length} сэтгэлзүйч олдлоо — 50%+ тохирол` : 'Тохирох сэтгэлзүйч олдсонгүй'}</p>
      </div>`;
    const empty = matches.length === 0
      ? card(`<p class="fa-muted-center">Шалгуураа өөрчлөн дахин хайна уу.</p><div class="fa-mt">${btn('Дахин эхлэх', 'reset')}</div>`, 'fa-empty')
      : '';
    const cards = matches.map(({ t, score }) => `
      ${card(`
        <div class="fa-th-head">
          ${avatar(t, 'md')}
          <div class="fa-th-main">
            <div class="fa-th-top">
              <div>
                <h3 class="fa-th-name">${esc(t.name)}</h3>
                <p class="fa-th-sub">${t.age} нас · ${t.experience} жилийн туршлага</p>
              </div>
              <div class="fa-score ${score >= 80 ? 'hi' : score >= 65 ? 'mid' : 'lo'}"><div class="fa-score-num">${score}%</div><div class="fa-score-cap">тохирол</div></div>
            </div>
            <div class="fa-th-meta"><span class="fa-rating">★ ${t.rating}</span><span>${t.sessions} сессий</span><span>${formatPrice(t.price)}/цаг</span></div>
          </div>
        </div>
        <div class="fa-tags">${t.specializations.slice(0, 4).map((x) => tag(x, s.specs.includes(x))).join('')}${t.specializations.length > 4 ? tag(`+${t.specializations.length - 4}`, false) : ''}</div>
        <div class="fa-actions">${btn('Дэлгэрэнгүй', 'start', { variant: 'ghost', size: 'sm', auto: true, val: t.id })}${btn('Цаг захиалах →', 'start', { size: 'sm', val: t.id })}</div>`)}`).join('');
    return `${header}${empty}<div class="fa-grid fa-grid-lg">${cards}</div><div class="fa-mt-lg">${btn('Дахин хайх', 'reset', { variant: 'secondary' })}</div>`;
  };

  const matchFlow = () => {
    const total = s.format === 'inperson' ? 5 : 4;
    const body = s.step === 0 ? stepCategory()
      : s.step === 1 ? stepSpecs()
        : s.step === 2 ? stepGender()
          : s.step === 3 ? stepFormat()
            : s.step === 4 && s.format === 'inperson' ? stepLocation()
              : resultsScreen();
    return `${s.step > 0 && s.step < resultStep() ? stepIndicator(s.step, total) : ''}${body}`;
  };

  // ── Booking screens ───────────────────────────────────────────────────────

  const backLink = (screen) => `<button type="button" class="fa-back" data-act="goto" data-val="${screen}">← Буцах</button>`;

  const profileScreen = (t) => `
    ${backLink('match')}
    ${card(`
      <div class="fa-th-head">
        ${avatar(t, 'lg')}
        <div>
          <h2 class="fa-profile-name">${esc(t.name)}</h2>
          <p class="fa-th-sub">${t.age} нас · ${t.experience} жилийн туршлага · ★ ${t.rating}</p>
          <p class="fa-price">${formatPrice(t.price)} / цаг</p>
        </div>
      </div>
      <p class="fa-bio">${esc(t.bio)}</p>`, 'fa-mb')}
    ${card(`${label('Мэргэшлийн чиглэлүүд')}<div class="fa-tags">${t.specializations.map((x) => tag(x, s.specs.includes(x))).join('')}</div>`, 'fa-mb')}
    ${card(`${label('Уулзалтын хэлбэр')}<div class="fa-formats">${t.format.map((f) => `<span class="fa-format">${f === 'online' ? '💻 Онлайн' : '🏢 Биечлэн'}</span>`).join('')}</div>`, 'fa-mb-lg')}
    ${btn('Цаг захиалах хүсэлт илгээх →', 'goto', { val: 'booking-request' })}`;

  const requestScreen = (t) => `
      ${backLink('profile')}
      <div class="fa-head">
        ${title('Цаг захиалах<br /><em>хүсэлт илгээх</em>')}
        <p class="fa-sub sm">Та хүсэлтээ илгээсний дараа сэтгэлзүйч бололцоот цагаа санал болгоно</p>
      </div>
      ${card(`
        <div class="fa-th-head fa-th-head-sm">
          ${avatar(t, 'sm')}
          <div><div class="fa-th-name sm">${esc(t.name)}</div><div class="fa-th-sub xs">${formatPrice(t.price)} / цаг</div></div>
        </div>
        ${label('Нэмэлт тэмдэглэл (заавал биш)')}
        <textarea class="fa-input" rows="4" data-field="note" placeholder="Жишээ нь: Ажил мэргэжлийн стресс, гэр бүлийн маргаан зэрэг сэдвүүдийн талаар ярилцмаар байна...">${esc(s.note)}</textarea>`, 'fa-mb')}
      ${notif('Сэтгэлзүйчид илгээгдэх мэдэгдэл', `
        <span class="fa-muted">Шинэ цаг захиалах хүсэлт ирлээ!</span><br />
        <strong>${esc(t.name)}</strong> та руу хүсэлт ирсэн байна.<br />
        Үйлчлүүлэгч: <strong>Та (үйлчлүүлэгч)</strong><br />
        Чиглэл: <strong>${esc(s.specs.slice(0, 2).join(', ') || 'Заагдаагүй')}</strong><br />
        Хэлбэр: <strong>${s.format === 'online' ? 'Онлайн' : 'Биечлэн'}</strong>`)}
      ${btn('Хүсэлт илгээх ✓', 'send-request')}`;

  const availabilityScreen = (t) => {
    const grouped = groupByDate(s.slots);
    const days = Object.keys(grouped).map((date) => card(`
      <p class="fa-day">${grouped[date][0].label}</p>
      <div class="fa-slots">${grouped[date].map((slot) => `<button type="button" class="fa-slot${s.offered.includes(slot.key) ? ' sage' : ''}" data-act="offer" data-val="${slot.key}">${slot.time}</button>`).join('')}</div>`)).join('');
    return `
      ${therapistBanner(t)}
      <div class="fa-head">
        ${title('Бололцоот цагаа<br /><em class="sage">санал болгох</em>')}
        <p class="fa-sub sm">Үйлчлүүлэгчид санал болгох цагуудаа сонгоно уу</p>
      </div>
      ${s.slots.length === 0 ? card('<p class="fa-muted-center">Энэ зөвлөхийн сул цаг одоогоор бүртгэгдээгүй байна.</p>', 'fa-mb') : `<div class="fa-grid fa-mb-lg">${days}</div>`}
      ${s.offered.length > 0 ? `<p class="fa-count">${s.offered.length} цаг сонгогдлоо</p>` : ''}
      ${notif('Үйлчлүүлэгчид илгээгдэх мэдэгдэл', `<strong>${esc(t.name)}</strong> таны хүсэлтэд хариу өгсөн байна.<br />Та доорх бололцоот цагуудаас сонгон захиалгаа баталгаажуулна уу.`)}
      ${btn('Санал болгох цагуудыг илгээх →', 'goto', { val: 'client-select-time', variant: 'sage', disabled: s.offered.length === 0 })}`;
  };

  const selectTimeScreen = (t) => {
    const offered = s.slots.filter((slot) => s.offered.includes(slot.key));
    const grouped = groupByDate(offered);
    const days = Object.keys(grouped).map((date) => card(`
      <p class="fa-day">${grouped[date][0].label}</p>
      <div class="fa-slots">${grouped[date].map((slot) => {
        const active = s.selectedSlot && s.selectedSlot.key === slot.key;
        return `<button type="button" class="fa-slot lg${active ? ' earth' : ''}" data-act="pick-slot" data-val="${slot.key}">${active ? '✓ ' : ''}${slot.time}</button>`;
      }).join('')}</div>`)).join('');
    const sel = s.selectedSlot;
    return `
      <div class="fa-head">
        ${title('<em>Цаг сонгох</em>')}
        <p class="fa-sub sm">${esc(t.name)} санал болгосон цагуудаас нэгийг сонгоно уу</p>
      </div>
      <div class="fa-grid fa-mb-lg">${days}</div>
      ${btn(sel ? `${sel.label} — ${sel.time} цагийг сонгох →` : 'Цаг сонгоно уу', 'goto', { val: 'therapist-confirm', disabled: !sel })}`;
  };

  const slider = (labelText, key, min, max) => `
    <div>
      <div class="fa-range-top"><span class="fa-range-label">${labelText}</span><span class="fa-range-val"><span data-bind="${key}">${s[key]}</span> цаг</span></div>
      <input type="range" class="fa-range" min="${min}" max="${max}" value="${s[key]}" data-range="${key}" />
    </div>`;

  const stepper = (labelText, desc, color, key) => `
    <div class="fa-rule">
      <div class="fa-rule-text"><div class="fa-rule-label">${labelText}</div><div class="fa-rule-desc" style="color:${color}">${desc}</div></div>
      <div class="fa-stepper">
        <button type="button" data-act="adjust" data-val="${key}:-1">-</button>
        <span>${s[key]}</span>
        <button type="button" data-act="adjust" data-val="${key}:1">+</button>
      </div>
    </div>`;

  const confirmScreen = (t) => {
    const sel = s.selectedSlot || {};
    return `
      ${therapistBanner(t)}
      <div class="fa-head">${title('Цагийг<br /><em class="sage">баталгаажуулах</em>')}</div>
      ${card(`${label('Үйлчлүүлэгчийн сонгосон цаг')}
        <div class="fa-when"><div class="fa-when-icon">📅</div><div><div class="fa-when-title">${esc(sel.label)}</div><div class="fa-th-sub">${esc(sel.time)} — ${endTime(sel.time)} (60 мин)</div></div></div>`, 'fa-mb')}
      ${card(`${label('Миний төлбөрийн нөхцөл')}
        <div class="fa-grid fa-grid-lg">
          ${slider('Цуцлах боломжтой хугацаа (цагаас өмнө)', 'cancelHours', 1, 48)}
          ${slider('Дахин товлох боломжтой хугацаа (цагаас өмнө)', 'rescheduleHours', 1, 72)}
          ${slider('Төлбөр хийх ёстой хугацаа (цагаас өмнө)', 'paymentHoursBefore', 1, 72)}
          <div class="fa-rules">
            <p class="fa-rules-title">Буцаан олголтын дүрэм</p>
            ${stepper(`Эхлэхээс ${s.noRefundHours} цагийн дотор цуцлавал`, 'Төлбөр буцаахгүй', '#e57373', 'noRefundHours')}
            ${stepper(`Эхлэхээс ${s.refundHours}+ цагийн өмнө цуцлавал`, 'Бүтэн төлбөр буцаана', '#7a9e8e', 'refundHours')}
          </div>
        </div>`, 'fa-mb')}
      ${notif('Баталгаажилтын мэдэгдэл — Үйлчлүүлэгчид илгээгдэнэ', `
        Таны цаг захиалга баталгаажлаа! 🎉<br />
        <strong>${esc(t.name)}</strong> — ${esc(sel.label)}, ${esc(sel.time)}–${endTime(sel.time)}<br />
        Хэлбэр: <strong>${s.format === 'online' ? 'Онлайн видео дуудлага' : 'Биечлэн'}</strong><br />
        Төлбөр: <strong>${formatPrice(t.price)}</strong> — захиалгаас <span data-bind="paymentHoursBefore">${s.paymentHoursBefore}</span> цагийн өмнө хийнэ үү.<br />
        Цуцлах хугацаа: эхлэхээс <strong><span data-bind="cancelHours">${s.cancelHours}</span> цагийн өмнө</strong>.`)}
      ${s.error ? `<p class="fa-error">${esc(s.error)}</p>` : ''}
      ${btn(s.submitting ? 'Хадгалж байна...' : 'Баталгаажуулах ✓', 'confirm', { variant: 'sage', disabled: s.submitting })}`;
  };

  const confirmedScreen = (t) => {
    const sel = s.selectedSlot || {};
    const rows = [
      { icon: '📅', label: 'Огноо', value: sel.label || '' },
      { icon: '🕐', label: 'Цаг', value: `${sel.time} — ${endTime(sel.time)}` },
      { icon: s.format === 'online' ? '💻' : '🏢', label: 'Хэлбэр', value: s.format === 'online' ? 'Онлайн видео дуудлага' : 'Биечлэн' },
      { icon: '💰', label: 'Төлбөр', value: `${formatPrice(t.price)} — ${s.paymentHoursBefore} цагийн өмнө` },
      { icon: '⏰', label: 'Цуцлах', value: `Эхлэхээс ${s.cancelHours} цагийн өмнө` }
    ];
    return `
      <div class="fa-hero fa-hero-results">
        <div class="fa-bigcheck">✓</div>
        ${title('Цаг захиалга<br /><em class="sage">баталгаажлаа!</em>')}
        <p class="fa-sub sm">Дараах дэлгэрэнгүй мэдээллийг хадгалж аваарай</p>
      </div>
      ${card(`
        <div class="fa-th-head fa-th-head-sm">
          ${avatar(t, 'xs')}
          <div><div class="fa-th-name">${esc(t.name)}</div><div class="fa-th-sub">Сэтгэл зүйч</div></div>
        </div>
        ${rows.map((r) => `<div class="fa-info-row"><span class="fa-info-icon">${r.icon}</span><span class="fa-info-label">${r.label}</span><span class="fa-info-value">${esc(r.value)}</span></div>`).join('')}`, 'fa-mb')}
      <div class="fa-mb-lg">${btn('Төлбөр & уулзалтын холбоос →', 'goto', { val: 'payment-meeting' })}</div>`;
  };

  const paymentScreen = (t) => {
    const sel = s.selectedSlot || {};
    const link = `meet.setgelzuich.mn/room/${t.id}-${sel.date}-${String(sel.time || '').replace(':', '')}`;
    return `
      <div class="fa-head">${title('Төлбөр &<br /><em>уулзалтын холбоос</em>')}</div>
      ${card(`${label('Төлбөрийн хэрэгсэл')}
        <div class="fa-grid">
          ${PAYMENT_METHODS.map((pm) => `
            <button type="button" class="fa-pay${s.payment === pm.id ? ' selected' : ''}" data-act="pay" data-val="${pm.id}"><span>${pm.icon}</span><span class="fa-pay-label">${pm.label}</span>${s.payment === pm.id ? '<span class="fa-pay-check">✓</span>' : ''}</button>`).join('')}
          <div class="fa-total"><span>Нийт дүн</span><strong>${formatPrice(t.price)}</strong></div>
        </div>`, 'fa-mb')}
      ${s.format === 'online' ? card(`${label('Уулзалтын холбоос илгээх эсэх?')}
        <div class="fa-grid-2 fa-mb-sm">
          <button type="button" class="fa-yn${s.meetingLink === true ? ' yes' : ''}" data-act="meeting" data-val="true"><span>📹</span>Тийм, илгээх</button>
          <button type="button" class="fa-yn${s.meetingLink === false ? ' no' : ''}" data-act="meeting" data-val="false"><span>✗</span>Үгүй, илгээхгүй</button>
        </div>
        ${s.meetingLink === true ? `<div class="fa-link"><p class="fa-link-title">Автоматаар үүссэн уулзалтын холбоос</p><p class="fa-link-url">🔗 ${esc(link)}</p><p class="fa-link-time">Эхлэх: ${esc(sel.label)} ${esc(sel.time)} &nbsp;·&nbsp; Дуусах: ${endTime(sel.time)}</p></div>` : ''}`, 'fa-mb') : ''}
      ${notif('Үйлчлүүлэгчид илгээгдэх эцсийн мэдэгдэл', `
        Таны захиалга бүрэн баталгаажлаа! ✅<br />
        <strong>${esc(t.name)}</strong> — ${esc(sel.label)}, ${esc(sel.time)}–${endTime(sel.time)}<br />
        ${s.meetingLink && s.format === 'online' ? `Уулзалтын холбоос: <em>meet.setgelzuich.mn/...</em><br />` : ''}
        Төлбөр: <strong>${formatPrice(t.price)}</strong> — амжилттай хүлээн авлаа.`)}
      ${btn(s.payment ? 'Дуусгах ✓' : 'Төлбөрийн хэрэгсэл сонгоно уу', 'reset', { disabled: !s.payment })}`;
  };

  const bookingFlow = () => {
    const t = s.therapist;
    if (!t) return '';
    switch (s.screen) {
      case 'profile': return profileScreen(t);
      case 'booking-request': return requestScreen(t);
      case 'therapist-availability': return availabilityScreen(t);
      case 'client-select-time': return selectTimeScreen(t);
      case 'therapist-confirm': return confirmScreen(t);
      case 'booking-confirmed': return confirmedScreen(t);
      case 'payment-meeting': return paymentScreen(t);
      default: return '';
    }
  };

  // ── Rendering ─────────────────────────────────────────────────────────────

  app.innerHTML = '<div class="fa"><div class="fa-appt" hidden></div><div class="fa-view"></div></div>';
  const view = app.querySelector('.fa-view');
  const apptBox = app.querySelector('.fa-appt');

  const render = () => {
    const inBooking = s.screen !== 'match' && s.therapist;
    view.innerHTML = inBooking
      ? `<div class="fa-chip-row">${avatar(s.therapist, 'chip')}<span>${esc(s.therapist.name)}</span></div>${bookingFlow()}`
      : matchFlow();
  };

  const updateBindings = () => {
    view.querySelectorAll('[data-bind]').forEach((el) => { el.textContent = s[el.dataset.bind]; });
  };

  const reset = () => {
    s = initialState();
    render();
    window.scrollTo({ top: Math.max(0, app.offsetTop - 80), behavior: 'smooth' });
  };

  const startBooking = async (id) => {
    const t = therapists.find((item) => String(item.id) === String(id));
    if (!t) return;
    const taken = new Set();
    try {
      const bookings = await fetch(`${apiBase}/api/bookings?psychologistId=${t.id}`).then((r) => r.json());
      (Array.isArray(bookings) ? bookings : []).forEach((b) => taken.add(`${b.date}|${b.slot}`));
    } catch (e) {
      // Booked-slot filtering is best-effort; the flow still works without it.
    }
    s.therapist = t;
    s.slots = buildSlots(t, taken);
    s.offered = [];
    s.selectedSlot = null;
    s.screen = 'profile';
    render();
    window.scrollTo({ top: Math.max(0, app.offsetTop - 80), behavior: 'smooth' });
  };

  const confirmBooking = async () => {
    const t = s.therapist;
    const sel = s.selectedSlot;
    if (!t || !sel || s.submitting) return;
    s.submitting = true;
    s.error = '';
    render();
    const notes = [
      s.note.trim(),
      s.specs.length ? `Чиглэл: ${s.specs.join(', ')}` : '',
      `Хэлбэр: ${s.format === 'online' ? 'Онлайн' : 'Биечлэн'}`
    ].filter(Boolean).join('\n');
    try {
      const response = await fetch(`${apiBase}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psychologistId: Number(t.id),
          name: authUser ? (authUser.name || '') : 'Зочин',
          email: authUser ? (authUser.email || '') : '',
          date: sel.date,
          slot: sel.time,
          notes
        })
      });
      if (!response.ok) throw new Error('Захиалга хадгалах үед алдаа гарлаа. Дахин оролдоно уу.');
      s.screen = 'booking-confirmed';
    } catch (error) {
      s.error = error.message || 'Захиалга хадгалах үед алдаа гарлаа. Дахин оролдоно уу.';
    }
    s.submitting = false;
    render();
  };

  const toggle = (list, value) => (list.includes(value) ? list.filter((x) => x !== value) : list.concat(value));

  const actions = {
    category: (v) => { s.category = v; },
    spec: (v) => { s.specs = toggle(s.specs, v); },
    gender: (v) => { s.gender = v; },
    age: (v) => { s.ageGroup = s.ageGroup === v ? '' : v; },
    format: (v) => { s.format = v; s.aimag = ''; s.district = ''; },
    aimag: (v) => { s.aimag = v; s.district = ''; },
    district: (v) => { s.district = v; },
    next: () => {
      if (!canNext()) return;
      const last = s.format === 'inperson' ? 4 : 3;
      s.step = s.step === last ? resultStep() : s.step + 1;
    },
    prev: () => { s.step = Math.max(0, s.step - 1); },
    reset,
    goto: (v) => { s.screen = v; s.error = ''; },
    offer: (v) => { s.offered = toggle(s.offered, v); },
    'pick-slot': (v) => { s.selectedSlot = s.slots.find((slot) => slot.key === v) || null; },
    adjust: (v) => {
      const [key, delta] = v.split(':');
      s[key] = Math.max(1, s[key] + Number(delta));
    },
    meeting: (v) => { s.meetingLink = v === 'true'; },
    pay: (v) => { s.payment = v; },
    'send-request': () => { s.screen = 'therapist-availability'; }
  };

  app.addEventListener('click', (event) => {
    const el = event.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const act = el.dataset.act;
    const val = el.dataset.val;
    if (act === 'start') { startBooking(val); return; }
    if (act === 'confirm') { confirmBooking(); return; }
    if (act === 'reset') { reset(); return; }
    if (actions[act]) {
      actions[act](val);
      render();
    }
  });

  app.addEventListener('input', (event) => {
    const field = event.target.dataset.field;
    const range = event.target.dataset.range;
    if (field) {
      s[field] = event.target.value;
    } else if (range) {
      s[range] = Number(event.target.value);
      updateBindings();
    }
  });

  // The legacy "Зөвлөгөө сонгох" modal is replaced by this flow on pages where it is mounted.
  document.querySelectorAll('[data-open-consultation]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopImmediatePropagation();
      reset();
    });
  });

  // Mirror the logged-in user's upcoming appointment (filled by script.js) above the flow.
  const appointmentSource = document.getElementById('upcoming-appointment');
  if (appointmentSource) {
    const syncAppointment = () => {
      const text = (appointmentSource.textContent || '').trim();
      const show = text.startsWith('Таны дараагийн захиалга');
      apptBox.hidden = !show;
      if (show) apptBox.innerHTML = notif('Таны захиалга', esc(text));
    };
    new MutationObserver(syncAppointment).observe(appointmentSource, { childList: true, characterData: true, subtree: true });
    syncAppointment();
  }

  render();

  fetch(`${apiBase}/api/psychologists`)
    .then((response) => response.json())
    .then((list) => {
      therapists = (Array.isArray(list) ? list : []).map(toTherapist).filter(Boolean);
      status = 'ready';
    })
    .catch(() => { status = 'error'; })
    .then(render);
})();
