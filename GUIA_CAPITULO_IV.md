# Guía de correspondencia — Capítulo IV del Avance 3

El documento del equipo propone cinco workflows y un frontend estático que despliega GitHub Pages. Esta versión amplía la presentación y navegación del portal para que el hotel tenga un flujo de acceso, registro de usuarios, reservas y consulta de reservas propias. Mantiene la lógica `frontend/js/reservas.js`, sus diez pruebas y los cinco workflows.

## 4.1 Caso a automatizar

- Cambios de la interfaz del Hotel Andino, especialmente la consulta de habitaciones y las reservas.
- Módulos de frontend: `app.js` (interfaz), `auth.js` (registro y sesión local), `datos.js` (almacenamiento local) y `reservas.js` (reglas de negocio).
- Para este avance, el backend y la base de datos están pendientes, tal como declara el documento de origen.

## 4.1.2 Estructura del repositorio

Añadir `frontend/js/auth.js` a la estructura mostrada en la Figura 4.1. `frontend/index.html` incluye las pantallas de inicio de sesión, registro, inicio, habitaciones, reservar, mis reservas y administración.

## 4.1.3 Gestión de cambios

- Registrar commits reales en ramas `feature/...`.
- Crear un Pull Request hacia `develop` o `main` con `Refs #3` o `Refs #8`.
- **No recrear** resultados históricos de V1 y V2 si no se ejecutaron realmente.
- V3 conserva las diez pruebas del módulo de reservas; verificar que estas pasen en GitHub.

## 4.1.4 CI

- `ci-html.yml`: validación de `frontend/index.html`.
- `ci-lint.yml`: análisis de archivos JavaScript, incluido `auth.js`.
- `ci-pruebas.yml`: diez pruebas del módulo de reservas en Node.js 20 y 22.
- `ci-trazabilidad.yml`: estructura y referencia al issue en cada PR.

Los workflows fueron preparados para usar `npm install` porque el ZIP inicial no lleva un archivo lock de npm. Cuando generes uno con `npm install` y lo agregues al repositorio, es recomendable restaurar `npm ci` en los scripts y actualizar los fragmentos del documento.

## 4.1.5 CD

- `cd-pages.yml`: verifica pruebas y publica `frontend/` en GitHub Pages.
- Configurar GitHub → Settings → Pages → Source: GitHub Actions.
- GitHub Pages no aloja el backend ni una base de datos; las cuentas y reservas del prototipo se guardan únicamente en el navegador del visitante. Por tanto, el acceso es demostrativo, no un sistema apto para clientes reales.

## Evidencias pendientes para el Word

1. Captura de la estructura final en Code (incluir `auth.js`).
2. Captura de la interfaz del hotel: acceso, panel, reservar y mis reservas.
3. Salida real de `npm test`, `npm run lint` y `npm run validate:html`.
4. Pull Request con referencia al issue real.
5. Ejecuciones de los cuatro CI y el CD en GitHub Actions.
6. Página publicada realmente en GitHub Pages.

**Corrección importante de numeración:** gestión de reservas es el issue real #8, no #9. Ajustar el Capítulo IV y los ejemplos de Pull Requests.
