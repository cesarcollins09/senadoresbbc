(() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const shortDate = date => new Intl.DateTimeFormat('es-VE', { day:'numeric', month:'short', year:'numeric', timeZone:'America/Caracas' }).format(new Date(date.length === 10 ? `${date}T12:00:00-04:00` : date));
  const dateParts = date => {
    const value = new Date(`${date}T12:00:00-04:00`);
    return { day: String(value.getUTCDate()).padStart(2,'0'), month: new Intl.DateTimeFormat('es-VE',{month:'short',timeZone:'America/Caracas'}).format(value).replace('.',''), weekday: new Intl.DateTimeFormat('es-VE',{weekday:'short',timeZone:'America/Caracas'}).format(value).replace('.','') };
  };
  const sourceLink = (url, label) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>`;
  const load = async file => {
    const response = await fetch(`/data/${file}.json`);
    if (!response.ok) throw new Error(`No se pudo cargar ${file}`);
    return response.json();
  };
  const assetUrl = path => '/' + String(path).replace(/^\//, '');
  const initials = name => name.split(/\s+/).slice(0,2).map(word => word[0]).join('');
  const avatar = player => `<span class="player-avatar" aria-hidden="true"><span>${escape(initials(player.displayName))}</span>${player.photo ? `<img src="${escape(assetUrl(player.photo))}" alt="" loading="lazy" width="60" height="60">` : ''}</span>`;
  const hand = value => ({ R:'Derecha', L:'Izquierda', S:'Ambas', B:'Ambas' }[value] || 'No publicado');

  async function initRoster() {
    const data = await load('roster');
    const players = data.players;
    let category = 'all', query = '', limit = 12;
    const roles = [['all','Todos'],['P','Lanzadores'],['C','Receptores'],['IF','Cuadro'],['OF','Jardineros']];
    const inRole = (player, role) => role === 'all' || player.position.split('/').includes(role);
    const roleContainer = document.querySelector('#role-filters');
    const grid = document.querySelector('#roster-grid');
    const count = document.querySelector('#roster-count');
    const more = document.querySelector('#more-players');
    document.querySelector('#roster-total').textContent = players.length;
    document.querySelector('#roster-updated').textContent = `Consultado el ${shortDate(data.fetchedAt)} · Portal LMBP ${data.season}`;
    roleContainer.innerHTML = roles.map(([role,label]) => `<button data-role="${role}" class="${role==='all'?'selected':''}" aria-pressed="${role==='all'}">${label}<small>${players.filter(p=>inRole(p,role)).length}</small></button>`).join('');
    const render = () => {
      const filtered = players.filter(player => inRole(player,category) && (/^#?\d+$/.test(query) ? String(player.number ?? '') === query.replace(/^#/, '') : normalize(`${player.displayName} ${player.name} ${player.number ?? ''} ${player.positionLabel} ${player.position}`).includes(query)));
      grid.innerHTML = filtered.length ? filtered.slice(0,limit).map(player => `<button class="player-card" data-player="${player.id}" aria-label="Ver ficha de ${escape(player.displayName)}">${avatar(player)}<span class="player-name"><strong>${escape(player.displayName)}</strong><small>${escape(player.positionLabel)}</small></span><span class="player-number">${player.number===null?'—':`#${escape(player.number)}`}</span></button>`).join('') : '<p class="roster-empty">No encontramos jugadores con esa búsqueda. Prueba otro nombre, número o filtro de posición.</p>';
      count.textContent = `Mostrando ${Math.min(limit,filtered.length)} de ${filtered.length} jugadores`;
      more.hidden = filtered.length <= limit;
      more.textContent = `Ver más jugadores (${filtered.length-limit})`;
    };
    roleContainer.addEventListener('click', event => {
      const button = event.target.closest('[data-role]');
      if (!button) return;
      category = button.dataset.role; limit = 12;
      roleContainer.querySelectorAll('button').forEach(b => { b.classList.toggle('selected',b===button); b.setAttribute('aria-pressed',String(b===button)); });
      render();
    });
    document.querySelector('#roster-search').addEventListener('input', event => { query = normalize(event.target.value.trim()); limit = 12; render(); });
    more.addEventListener('click', () => { const previous=grid.querySelectorAll('.player-card').length; limit+=12; render(); grid.querySelectorAll('.player-card')[previous]?.focus({preventScroll:true}); });
    grid.addEventListener('click', event => {
      const button = event.target.closest('[data-player]');
      if (!button) return;
      const player = players.find(p=>String(p.id)===button.dataset.player);
      const facts = [['Número',player.number===null?'No publicado':`#${player.number}`],['Posición',player.positionLabel],['Batea',hand(player.bats)],['Lanza',hand(player.throws)]];
      if (player.birthdate) facts.push(['Nacimiento',shortDate(player.birthdate)]);
      showDialog(`<div class="dialog-body"><span class="eyebrow red-text">ROSTER OFICIAL · SENADORES DE CARACAS</span><div class="player-dialog-heading">${avatar(player)}<div><h2 id="dialog-title">${escape(player.displayName)}</h2><small>${escape(player.positionLabel)}</small></div></div><dl class="player-facts">${facts.map(([label,value])=>`<div><dt>${label}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl><a class="button navy" href="${escape(player.profileUrl)}" target="_blank" rel="noopener noreferrer">Ficha del jugador en LMBP ${icon('out')}</a><p class="dialog-source">Datos y retrato: LMBP. Consulta del ${shortDate(data.fetchedAt)}. El roster puede cambiar entre temporadas.</p></div>`);
    });
    grid.addEventListener('error', event => { if(event.target.tagName==='IMG') event.target.remove(); }, true);
    render();
  }

  const teamLogo = team => team.logo ? `<img src="${escape(assetUrl(team.logo))}" alt="" loading="lazy" width="40" height="40">` : `<span class="team-emblem" aria-hidden="true">${escape(team.code)}</span>`;
  const teamRow = (team, location, winner) => `<span class="game-team ${winner?'winner':''}">${teamLogo(team)}<span class="team-name"><b>${escape(team.displayName || team.shortName)}</b><small>${location}</small></span><span class="runs">${Number.isFinite(team.score)?team.score:'—'}</span></span>`;
  function statusFor(game) {
    if (game.status === 'Final') return { text:'Final', kind:'final' };
    if (game.status === 'Postponed') return { text:'Pospuesto', kind:'suspended' };
    if (game.isHistoricalUnresolved) return { text:'Sin cierre reportado', kind:'suspended' };
    if (game.status === 'Scheduled') return { text:'Programado', kind:'upcoming' };
    return { text:'Estado por confirmar', kind:'' };
  }
  function gameMarkup(game) {
    const date = dateParts(game.date);
    const state = statusFor(game);
    const final = game.status === 'Final';
    const winnerHome = final && game.home.score > game.away.score;
    const winnerAway = final && game.away.score > game.home.score;
    return `<button class="game-row" data-game="${game.id}" aria-label="Ver partido del ${escape(shortDate(game.date))}: ${escape(game.away.shortName)} contra ${escape(game.home.shortName)}"><span class="game-day"><strong>${date.day}</strong><span>${date.month}</span><small>${date.weekday}</small></span><span class="game-teams">${teamRow(game.away,'Visitante',winnerAway)}${teamRow(game.home,'Local',winnerHome)}</span><span class="game-info"><b class="game-status ${state.kind}">${state.text}</b><span>${escape(game.stadium)}</span></span>${icon('arrow')}</button>`;
  }
  function gameDialog(game, data) {
    const state = statusFor(game);
    const final = game.status === 'Final';
    const originalStatus = ({Scheduled:'Programado', 'In Progress':'En progreso', Postponed:'Pospuesto', Final:'Final'}[game.status] || game.status);
    const historicalNote = game.isHistoricalUnresolved ? `<p class="match-detail">Este encuentro figura en el archivo de ${data.season} con estado «${escape(originalStatus)}», sin resultado final publicado en la fuente.</p>` : '';
    showDialog(`<div class="dialog-body"><span class="eyebrow red-text">LIGA MAYOR · TEMPORADA ${data.season}</span><h2 id="dialog-title">${escape(game.away.shortName)} vs. ${escape(game.home.shortName)}</h2><div class="match-dialog-status"><span class="game-status">${state.text}</span><span>${shortDate(game.date)}</span></div><div class="match-dialog-teams">${teamRow(game.away,'Visitante',final&&game.away.score>game.home.score)}${teamRow(game.home,'Local',final&&game.home.score>game.away.score)}</div><p class="match-detail">${escape(game.stadium)}<br>${game.time?`Hora del encuentro: ${escape(game.time)} · Venezuela`:'Hora no publicada'}</p>${historicalNote}<a class="button navy" href="${escape(game.boxscoreUrl)}" target="_blank" rel="noopener noreferrer">${final?'Ver boxscore oficial':'Consultar partido en LMBP'} ${icon('out')}</a><p class="dialog-source">Fuente: LMBP. Consulta del ${shortDate(data.fetchedAt)}. Horarios expresados en hora de Venezuela (UTC−4).</p></div>`);
  }
  async function initCalendar() {
    const data = await load('calendar');
    const games = data.games.filter(g=>g.gameType==='R').sort((a,b)=>b.dateTime.localeCompare(a.dateTime));
    const grid = document.querySelector('#games-list');
    const monthSelect = document.querySelector('#calendar-month');
    const more = document.querySelector('#more-games');
    const finalsCheckbox = document.querySelector('#calendar-finals');
    let venue = 'all', limit = 8;
    const lastFinal = games.find(g=>g.status==='Final');
    const months = [...new Set(games.map(game=>game.date.slice(0,7)))].sort().reverse();
    monthSelect.innerHTML = '<option value="all">Todos los meses</option>'+months.map(month=>{const label=new Intl.DateTimeFormat('es-VE',{month:'long',year:'numeric',timeZone:'America/Caracas'}).format(new Date(`${month}-15T12:00:00-04:00`));return `<option value="${month}">${label[0].toUpperCase()+label.slice(1)}</option>`;}).join('');
    if (lastFinal) monthSelect.value = lastFinal.date.slice(0,7);
    document.querySelector('#calendar-updated').textContent = `Consultado el ${shortDate(data.fetchedAt)} · Hora de Venezuela`;
    const render = () => {
      const filtered = games.filter(game=>(monthSelect.value==='all'||game.date.startsWith(monthSelect.value)) && (venue==='all'||(venue==='home'?game.home.code==='SEN':game.away.code==='SEN')) && (!finalsCheckbox.checked||game.status==='Final'));
      grid.innerHTML = filtered.length ? filtered.slice(0,limit).map(gameMarkup).join('') : `<div class="data-message">No hay ${finalsCheckbox.checked?'resultados finales':'encuentros'} con estos filtros.${finalsCheckbox.checked?' Puedes desactivar «Solo finalizados» para consultar la programación registrada.':''}</div>`;
      document.querySelector('#games-count').textContent = `Mostrando ${Math.min(limit,filtered.length)} de ${filtered.length} partidos`;
      more.hidden = filtered.length <= limit;
    };
    monthSelect.addEventListener('change',()=>{limit=8;render();});
    finalsCheckbox.addEventListener('change',()=>{limit=8;render();});
    document.querySelectorAll('[data-venue]').forEach(button=>button.addEventListener('click',()=>{venue=button.dataset.venue;limit=8;document.querySelectorAll('[data-venue]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});render();}));
    more.addEventListener('click',()=>{const previous=grid.querySelectorAll('[data-game]').length;limit+=8;render();grid.querySelectorAll('[data-game]')[previous]?.focus({preventScroll:true});});
    grid.addEventListener('click',event=>{const button=event.target.closest('[data-game]');if(button)gameDialog(games.find(g=>String(g.id)===button.dataset.game),data);});
    document.querySelectorAll('[data-season-view]').forEach(button=>button.addEventListener('click',()=>{
      const upcoming=button.dataset.seasonView==='upcoming';
      document.querySelector('#archive-calendar').hidden=upcoming;
      document.querySelector('#upcoming-calendar').hidden=!upcoming;
      document.querySelectorAll('[data-season-view]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});
    }));
    document.querySelector('#upcoming-calendar').innerHTML = `<div class="upcoming-state">${icon('calendar-icon')}<h3>El próximo capítulo está por anunciarse</h3><p>El calendario de ${data.nextSeason} no tiene encuentros publicados en la consulta del ${shortDate(data.fetchedAt)}. Revisa los canales oficiales para conocer las nuevas fechas.</p><a class="text-link" href="${escape(data.sourceUrl)}" target="_blank" rel="noopener noreferrer">Consultar calendario en LMBP ${icon('out')}</a></div>`;
    render();
  }

  async function initHighlight() {
    const data = await load('calendar');
    const lastFinal = data.games.filter(game => game.gameType === 'R' && game.status === 'Final').sort((a,b) => b.dateTime.localeCompare(a.dateTime))[0];
    if(lastFinal && document.querySelector('#game-highlight')){
      const highlight=document.querySelector('#game-highlight');
      highlight.hidden=false;
      highlight.innerHTML=`<div class="highlight-context"><span class="eyebrow red-text">ÚLTIMO RESULTADO PUBLICADO</span><strong>Temporada ${data.season}</strong><small>${shortDate(lastFinal.date)}</small></div><div><div class="highlight-match"><span class="highlight-team">${teamLogo(lastFinal.away)}<span>${escape(lastFinal.away.displayName)}</span></span><strong class="highlight-score">${lastFinal.away.score}<span class="highlight-separator">–</span>${lastFinal.home.score}</strong><span class="highlight-team">${teamLogo(lastFinal.home)}<span>${escape(lastFinal.home.displayName)}</span></span></div><span class="highlight-note">Final · ${escape(lastFinal.stadium)}</span></div><a href="/calendario/" class="text-link highlight-action">Todos los resultados ${icon('arrow')}</a>`;
    }
  }

  async function initSocial() {
    const data=await load('instagram');
    const grid=document.querySelector('#social-grid');
    let limit=4;
    const more=document.querySelector('#more-social');
    const render=()=>{
      grid.innerHTML=data.assets.slice(0,limit).map(asset=>`<a class="social-card" href="${escape(asset.postUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Ver en Instagram: ${escape(asset.title)}"><span class="social-photo"><img src="${escape(assetUrl(asset.image))}" alt="${escape(asset.alt)}" loading="lazy" width="${asset.width}" height="${asset.height}"><span class="social-badge">${icon(asset.kind==='reel'?'play':'instagram')}</span></span><span class="social-caption"><time datetime="${asset.date}">${shortDate(asset.date)}</time><strong>${escape(asset.title)}</strong><span>${asset.kind==='reel'?'Ver reel':'Ver publicación'} ${icon('out')}</span></span></a>`).join('');
      more.hidden=limit>=data.assets.length;
    };
    more.addEventListener('click',()=>{limit=data.assets.length;render();grid.querySelectorAll('a')[4]?.focus({preventScroll:true});});
    render();
  }
  let userScrolled = false;
  window.addEventListener('wheel',()=>{userScrolled=true;},{passive:true,once:true});
  window.addEventListener('touchmove',()=>{userScrolled=true;},{passive:true,once:true});
  window.addEventListener('keydown',event=>{
    if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)) userScrolled=true;
  });
  const mounts = [
    ['#roster-grid', initRoster, 'https://www.lmbp.net/equipo/senadores'],
    ['#games-list', initCalendar, 'https://www.lmbp.net/equipo/senadores/resultados'],
    ['#social-grid', initSocial, 'https://www.instagram.com/senadores_bbc/'],
    ['#game-highlight', initHighlight, null]
  ].filter(([selector]) => document.querySelector(selector));
  Promise.allSettled([...mounts.map(([,mount]) => mount()), newsReady]).then(results => {
    results.slice(0,mounts.length).forEach((result, i) => {
      if (result.status === 'rejected' && mounts[i][2]) {
        document.querySelector(mounts[i][0]).innerHTML = `<p class="data-message">No pudimos cargar esta sección. Puedes consultar ${sourceLink(mounts[i][2], 'la fuente oficial')}.</p>`;
      }
    });
    const target = document.getElementById(location.hash.slice(1));
    if (target && !userScrolled) {
      document.documentElement.classList.add('restore-anchor');
      target.scrollIntoView({block:'start'});
      requestAnimationFrame(() => document.documentElement.classList.remove('restore-anchor'));
    }
  });
})();
