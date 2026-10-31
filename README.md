# Senadores de Caracas

Sitio público: [senadoresbbc.pages.dev](https://senadoresbbc.pages.dev).

Repositorio: [cesarcollins09/senadoresbbc](https://github.com/cesarcollins09/senadoresbbc), propiedad de **cesarcollins09**. La persona designada para editar contenido es **Dromario427**. La invitación de colaboración con permiso **Write** fue enviada y está pendiente de aceptación.

## Contenido editable

- `data/news.json`: noticias.
- `data/roster.json`: jugadores y cuerpo del equipo.
- `data/calendar.json`: calendario y resultados.
- `data/instagram.json`: imágenes y enlaces de publicaciones.
- `data/leaders.json`: líderes de ofensiva y pitcheo.
- `assets/`: imágenes, retratos, logos y tipografías. Las cargas del editor se guardarán en `assets/uploads/`.

Estos archivos y carpetas deben permanecer en la raíz del repositorio, rama `main`.

## Estado del editor y la publicación

El panel `/admin/` está preparado y **deshabilitado**. La aplicación de acceso de GitHub ya está registrada y el Worker independiente está desplegado. Falta guardar su clave privada, verificar el inicio de sesión y configurar los secretos de GitHub Actions para publicar en el proyecto existente de Cloudflare Pages **senadoresbbc**.

La web pública actual se publicó mediante carga directa. Un cambio en GitHub todavía no actualiza esa web. El workflow de `.github/workflows/pages-deployment.yml` bloquea la publicación mientras el editor siga deshabilitado o no exista una configuración real y válida.

`admin/config.yml` ya contiene el repositorio y el origen OAuth reales, en notación JSON válida como YAML. `admin/config.template.yml` conserva la plantilla. `admin/connection.json` permanece deshabilitado hasta verificar OAuth y la publicación automática.

Las credenciales pertenecen a los secretos del Worker y de GitHub Actions. No deben guardarse en archivos del sitio ni en este repositorio. El servicio OAuth se mantiene fuera de esta fuente estática.
