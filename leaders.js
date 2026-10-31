(() => {
  const grid = document.querySelector('#leaders-grid');
  if (!grid) return;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const initials = name => name.split(/\s+/).slice(0,2).map(word => word[0]).join('');
  const avatar = player => `<span class="leader-avatar" aria-hidden="true"><span>${escape(initials(player.displayName || player.name))}</span>${player.photo ? `<img src="${escape(player.photo)}" alt="" width="60" height="60" loading="lazy">` : ''}</span>`;
  async function renderLeaders() {
    const response = await fetch('/data/leaders.json');
    if (!response.ok) throw new Error('No se pudieron cargar los líderes');
    const data = await response.json();
    document.querySelector('#leaders-season').textContent = `Temporada ${data.season} · ${data.scope}`;
    grid.innerHTML = data.departments.map(department => `<article class="leaders-panel ${escape(department.id)}" aria-labelledby="leader-heading-${escape(department.id)}"><header class="leaders-panel-heading"><div><span class="eyebrow">${department.id === 'hitting' ? 'EN EL PLATO' : 'DESDE LA LOMITA'}</span><h3 id="leader-heading-${escape(department.id)}">${escape(department.title)}</h3></div>${icon(department.id === 'hitting' ? 'chart' : 'cap')}</header><ul class="leaders-list">${department.leaders.map(leader => `<li class="leader-entry">${avatar(leader.players[0])}<div class="leader-details"><span class="leader-stat-name">${escape(leader.label)}</span>${leader.players.map(player => `<a class="leader-name" href="${escape(player.profileUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Ver ficha de ${escape(player.displayName || player.name)} en LMBP">${escape(player.displayName || player.name)}</a>`).join('')}${leader.players.length > 1 ? '<span class="leader-tie">Liderato compartido</span>' : ''}</div><div class="leader-value"><strong>${escape(leader.value)}</strong><small>${escape(leader.abbr)}</small></div></li>`).join('')}</ul></article>`).join('');
    const date = new Intl.DateTimeFormat('es-VE', {day:'numeric',month:'short',year:'numeric',timeZone:'America/Caracas'}).format(new Date(data.fetchedAt));
    document.querySelector('#leaders-updated').textContent = `Consultado el ${date}`;
    if (data.qualificationNote) {
      const note = document.createElement('p');
      note.className = 'leaders-criteria';
      note.textContent = data.qualificationNote;
      grid.after(note);
    }
    grid.addEventListener('error', event => { if (event.target.tagName === 'IMG') event.target.remove(); }, true);
  }
  renderLeaders().catch(() => {
    grid.innerHTML = '<p class="data-message">No pudimos cargar los líderes. Consulta las <a href="https://www.lmbp.net/equipo/senadores/estadisticas" target="_blank" rel="noopener noreferrer">estadísticas oficiales en LMBP ↗</a>.</p>';
  });
})();
