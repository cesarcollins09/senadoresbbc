// Conserva los enlaces de la antigua portada por secciones.
const legacyRoutes = { noticias:'/noticias/', calendario:'/calendario/', equipo:'/equipo/', historia:'/historia/', estadio:'/entradas/#estadio', videos:'/videos/', comunidad:'/comunidad/' };
function redirectLegacySection() {
  if (document.body.dataset.page === 'inicio' && legacyRoutes[location.hash.slice(1)]) location.replace(legacyRoutes[location.hash.slice(1)]);
}
redirectLegacySection();
window.addEventListener('hashchange', redirectLegacySection);
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#${name}"/></svg>`;
let news = [];
const grid = document.querySelector('#news-grid');
const editorialEscape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const newsImage = value => typeof value === 'string' && value.startsWith('/assets/') ? value : '/assets/news-winter.jpg';
const newsSource = value => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : 'https://www.lmbp.net/noticias'; } catch { return 'https://www.lmbp.net/noticias'; } };
function applyNewsFilter(category) {
  document.querySelectorAll('.news-card').forEach(card => { card.hidden = category !== 'all' && card.dataset.category !== category; });
}
async function initNews() {
  if (!grid) return;
  try {
    const response = await fetch('/data/news.json');
    if (!response.ok) throw new Error('News unavailable');
    const data = await response.json();
    news = data.news;
    const items = document.body.dataset.page === 'inicio' ? news.slice(0,3) : news;
    grid.innerHTML = items.map(n => `<button class="news-card" data-news="${editorialEscape(n.id)}" data-category="${editorialEscape(n.category)}"><span class="news-image"><img src="${editorialEscape(newsImage(n.image))}" alt="${editorialEscape(n.alt)}" loading="lazy" width="600" height="340"><span class="news-category">${editorialEscape(n.label)}</span></span><span class="news-date">${editorialEscape(n.date)} · FUENTE: ${editorialEscape(n.sourceName || 'LMBP')}</span><h3>${editorialEscape(n.title)}</h3><p>${editorialEscape(n.summary)}</p><span class="text-link">Leer la nota ${icon('arrow')}</span></button>`).join('') || '<p class="data-message">Pronto compartiremos nuevas noticias del equipo.</p>';
    applyNewsFilter(document.querySelector('[data-filter].selected')?.dataset.filter || 'all');
  } catch {
    grid.innerHTML = '<p class="data-message">No pudimos cargar las noticias. <a href="https://www.lmbp.net/noticias" target="_blank" rel="noopener noreferrer">Consultar LMBP ↗</a></p>';
  }
}
const newsReady = initNews();
document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => {
      const active = b === button;
      b.classList.toggle('selected', active);
      b.setAttribute('aria-pressed', String(active));
    });
    applyNewsFilter(button.dataset.filter);
  });
});

const dialog = document.querySelector('#content-dialog');
const content = document.querySelector('#dialog-content');
let lastFocus;
function showDialog(html, video = false) {
  lastFocus = document.activeElement;
  if (navigation.contains(lastFocus) && mobileQuery.matches) lastFocus = menuToggle;
  content.innerHTML = html;
  dialog.classList.toggle('video-dialog', video);
  document.body.classList.add('modal-open');
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
}
function hideDialog() { dialog.close(); }
document.querySelector('.dialog-close').addEventListener('click', hideDialog);
dialog.addEventListener('click', e => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) hideDialog();
  }
});
dialog.addEventListener('close', () => {
  content.innerHTML = '';
  document.body.classList.remove('modal-open');
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
});

const ticketsHTML = `<div class="dialog-body"><span class="eyebrow red-text">NOS VEMOS EN EL UNIVERSITARIO</span><h2 id="dialog-title">Tu lugar está<br>en las gradas.</h2><p>La información de entradas y abonos de la próxima campaña se anunciará a través de los canales de Senadores de Caracas.</p><div class="calendar-state">${icon('cap')}<h3>Prepara tu próxima visita</h3><p>Revisa las publicaciones del equipo para confirmar fechas, disponibilidad y el punto de venta autorizado de cada encuentro.</p><a class="button red" href="https://linktr.ee/senadores_bbc" target="_blank" rel="noopener noreferrer">Canales oficiales del equipo ${icon('out')}</a></div><div class="channel-list"><a href="https://www.instagram.com/senadores_bbc/" target="_blank" rel="noopener noreferrer">Instagram ↗</a><a href="https://www.google.com/maps/search/?api=1&query=Estadio+Universitario+de+Caracas" target="_blank" rel="noopener noreferrer">Cómo llegar al estadio ↗</a></div></div>`;
const creditsHTML = `<div class="dialog-body credits-links"><span class="eyebrow red-text">FUENTES Y CRÉDITOS</span><h2 id="dialog-title">Un sitio con<br>identidad caraqueña.</h2><p>Propuesta de experiencia digital para Senadores de Caracas, inspirada en la estructura de contenidos del <a href="https://www.mlb.com/es/marlins" target="_blank" rel="noopener noreferrer">portal de los Marlins</a>.</p><p>Noticias y datos deportivos: <a href="https://www.lmbp.net/equipo/senadores" target="_blank" rel="noopener noreferrer">Liga Mayor de Béisbol Profesional</a>. La información es una selección editorial consultada en octubre de 2026; cada nota enlaza su publicación de origen.</p><p>Roster, resultados y líderes ofensivos y de pitcheo consultados en LMBP; cada sección muestra la temporada y fecha de consulta. Retratos y logotipo: LMBP. Fotografías de portada: Prensa Senadores de Caracas / LMBP. Galería social: imágenes públicas del <a href="https://www.instagram.com/senadores_bbc/" target="_blank" rel="noopener noreferrer">Instagram oficial @senadores_bbc</a>, con enlace a cada publicación. Historia del club: <a href="https://www.lmbp.net/noticia/senadores-se-proclamo-campeon-de-la-lmbp-2024" target="_blank" rel="noopener noreferrer">tercer campeonato, 2024</a>. Videos: transmisiones de LMBP TV en YouTube.</p><p>Fotografía histórica del Estadio Universitario: Hector Yanez, 2005, dominio público, vía <a href="https://commons.wikimedia.org/wiki/File:Universitario-caracas.jpg" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>. Insignia: <a href="https://commons.wikimedia.org/wiki/File:Senadores_de_Caracas_cap_insignia.svg" target="_blank" rel="noopener noreferrer">Senadores de Caracas / Wikimedia Commons</a>. Tipografías Barlow y Barlow Condensed, de Jeremy Tribby (SIL Open Font License).</p></div>`;
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
  closeMenu();
  if (button.dataset.open === 'tickets') showDialog(ticketsHTML);
  if (button.dataset.open === 'credits') showDialog(creditsHTML);
}));
if (grid) grid.addEventListener('click', event => {
  const button = event.target.closest('[data-news]');
  if (!button) return;
  const n = news.find(item => item.id === button.dataset.news);
  if (!n) return;
  showDialog(`<img class="dialog-image" src="${editorialEscape(newsImage(n.image))}" alt="${editorialEscape(n.alt)}"><div class="dialog-body"><span class="eyebrow red-text">${editorialEscape(n.date)} · ${editorialEscape(n.label)}</span><h2 id="dialog-title">${editorialEscape(n.title)}</h2>${n.paragraphs.map(p => `<p>${editorialEscape(p)}</p>`).join('')}<a class="button navy" href="${editorialEscape(newsSource(n.url))}" target="_blank" rel="noopener noreferrer">Leer publicación original ${icon('out')}</a><p class="dialog-source">Resumen editorial. Fuente: ${editorialEscape(n.sourceName || 'LMBP')} · ${editorialEscape(n.sourceTitle)}. Fotografía: ${editorialEscape(n.imageCredit || n.sourceName || 'LMBP')}.</p></div>`);
});
document.querySelectorAll('[data-video]').forEach(button => button.addEventListener('click', () => {
  showDialog(`<div class="dialog-body"><span class="eyebrow red-text">LMBP TV · TRANSMISIÓN DE ARCHIVO</span><h2 id="dialog-title">${button.dataset.title}</h2><div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${button.dataset.video}?autoplay=1&rel=0" title="${button.dataset.title}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div><a class="video-fallback" href="https://www.youtube.com/watch?v=${button.dataset.video}" target="_blank" rel="noopener noreferrer">Ver la transmisión en YouTube ↗</a><p class="dialog-source">Video publicado por LMBP TV. La disponibilidad del reproductor depende de YouTube.</p></div>`, true);
}));

const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menú');
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  navigation.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
});
navigation.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navigation.classList.contains('open')) { closeMenu(); menuToggle.focus(); }
});
document.addEventListener('click', e => { if (!e.target.closest('.nav-inner')) closeMenu(); });
const mobileQuery = window.matchMedia('(max-width: 850px)');
mobileQuery.addEventListener('change', () => closeMenu());

// El contenido siempre permanece visible; el observador solo aporta movimiento.
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const motionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        motionObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06 });
  document.querySelectorAll('.section-heading, .heritage-inner, .team-section, .stadium-section').forEach(section => {
    section.classList.add('motion-reveal');
    motionObserver.observe(section);
  });
}
