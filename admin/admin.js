(() => {
  'use strict';
  const button = document.querySelector('#open-editor');
  const title = document.querySelector('#connection-title');
  const description = document.querySelector('#connection-description');
  let ready = false;

  // No CMS, OAuth request, or login is loaded until connection.json is explicitly enabled.
  async function checkConnection() {
    try {
      const response = await fetch('/admin/connection.json', { cache: 'no-store' });
      if (!response.ok) return;
      const connection = await response.json();
      if (connection.enabled !== true || connection.configurationFile !== '/admin/config.yml') return;
      const configResponse = await fetch(connection.configurationFile, { cache: 'no-store' });
      if (!configResponse.ok) throw new Error('Falta el archivo de conexión del editor.');
      // config.yml is deliberately JSON notation, which is valid YAML.
      const config = JSON.parse(await configResponse.text());
      const backend = config.backend || {};
      if (backend.name !== 'github' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(backend.repo || '') || !backend.branch || /NO_CONFIGURADO|REEMPLAZAR|PENDIENTE/i.test(JSON.stringify(backend))) throw new Error('La conexión del editor todavía está incompleta.');
      const authURL = new URL(backend.base_url);
      if (authURL.protocol !== 'https:' || authURL.hostname.endsWith('.invalid') || !backend.auth_endpoint) throw new Error('Falta configurar el servicio de acceso del editor.');
      ready = true;
      title.textContent = 'Editor preparado';
      description.textContent = 'Inicia sesión con una cuenta de GitHub autorizada para gestionar el contenido del equipo.';
      button.disabled = false;
      button.textContent = 'Abrir editor';
    } catch (error) {
      title.textContent = 'Conexión pendiente';
      description.textContent = 'El editor aún no se puede abrir. La persona encargada de la configuración debe completar y verificar la conexión.';
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error('No se pudo cargar el editor.'));
      document.head.appendChild(script);
    });
  }

  button.addEventListener('click', async () => {
    if (!ready) return;
    button.disabled = true;
    button.textContent = 'Abriendo editor…';
    try {
      window.CMS_MANUAL_INIT = true;
      await loadScript('https://unpkg.com/decap-cms@3.17.3/dist/decap-cms.js');
      await loadScript('/admin/widgets.js');
      document.querySelector('#admin-welcome').hidden = true;
      document.body.classList.add('cms-open');
      window.CMS.init();
    } catch (error) {
      document.querySelector('#admin-welcome').hidden = false;
      document.body.classList.remove('cms-open');
      title.textContent = 'No se pudo abrir el editor';
      description.textContent = 'Revisa la conexión a internet y vuelve a intentarlo. Si el problema continúa, consulta a la persona encargada del sitio.';
      button.disabled = false;
      button.textContent = 'Reintentar';
    }
  });
  checkConnection();
})();
