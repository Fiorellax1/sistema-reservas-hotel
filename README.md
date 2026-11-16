# Hotel Andino — Sistema de Reservas

Aplicación web del Hotel Andino con registro e inicio de sesión, panel principal, catálogo de habitaciones, consulta de disponibilidad, reservas y sección **Mis reservas**. Incluye un panel de gestión para el personal y automatización de pruebas/publicación con GitHub Actions.

## Cómo abrirlo en tu computadora

1. Instala **Visual Studio Code** y la extensión **Live Server**.
2. Abre la carpeta completa de este proyecto (no solo `frontend/`).
3. Haz clic derecho en `frontend/index.html` y selecciona **Open with Live Server**.
4. Selecciona **Regístrate**, crea una cuenta y accede al panel.
5. Abre **Reservar**, selecciona fechas, confirma una habitación y consulta **Mis reservas**.
6. Cierra sesión, vuelve a ingresar con tu correo y contraseña y comprueba que tus reservas permanecen guardadas en ese navegador.

Para acceder al **Panel de administración**, registra una nueva cuenta y abre la opción **¿Trabajas en el hotel?**. En el campo de código del personal introduce `ANDINO2026`. Este mecanismo se proporciona exclusivamente para probar las funciones de gestión en esta versión local; **no es seguridad real** y no debe usarse en un hotel en producción.

También puedes usar un servidor estático local:

```bash
python -m http.server 5500 --directory frontend
```

Abre `http://localhost:5500` en el navegador. No abras el HTML con doble clic: los módulos JavaScript requieren un servidor local.

## Qué funciona

- Registro de cuentas e inicio/cierre de sesión en el navegador.
- Catálogo y búsqueda de habitaciones por fecha.
- Registro, listado y cancelación de las reservas de la cuenta activa.
- Restricción de superposición de reservas confirmadas.
- Panel del personal: listado de clientes y reservas, registro de habitaciones y huéspedes.
- Datos conservados mediante almacenamiento local del navegador.

## Limitación importante

La interfaz está diseñada como un portal de hotel, pero este entregable **no dispone de servidor de autenticación ni base de datos compartida**. Los usuarios, la sesión y las reservas se guardan en `localStorage`; no se sincronizan entre navegadores o dispositivos y pueden modificarse desde las herramientas del navegador. Aunque las contraseñas se transforman con SHA-256 y sal por usuario antes de almacenarse, esto **no sustituye** una autenticación segura en un backend. No introduzcas nombres, correos, contraseñas o documentos reales al probar esta versión.

Para operar con clientes reales habría que implementar un backend con sesiones seguras, contraseñas con un algoritmo específico como Argon2/bcrypt, autorización del lado servidor y base de datos centralizada. El Capítulo IV del documento define expresamente el backend como pendiente y el CD solo para frontend estático.

## Estructura

- `frontend/index.html`: pantallas de acceso y portal.
- `frontend/css/styles.css`: estilos, incluido diseño adaptable a celular.
- `frontend/js/auth.js`: cuentas/sesiones del prototipo estático.
- `frontend/js/app.js`: navegación, formularios y presentación.
- `frontend/js/datos.js`: almacenamiento local de habitaciones, clientes y reservas.
- `frontend/js/reservas.js`: reglas de negocio de reservas y disponibilidad.
- `test/reservas.test.js`: diez pruebas unitarias del módulo del Capítulo IV.
- `scripts/`: verificación de estructura y referencias a issues.
- `.github/workflows/`: cuatro workflows de integración continua y uno de despliegue en GitHub Pages.
- `backend/README.md`: backend futuro, conforme al documento de Avance 3.

## Pruebas y CI/CD

Instala Node.js 20 o 22 y, desde la carpeta raíz, ejecuta:

```bash
npm test
npm install
npm run lint
npm run validate:html
```

`npm test` usa la herramienta de pruebas integrada de Node.js y verifica el módulo de reservas. Para instalar ESLint y html-validate se necesita conexión a internet. Los workflows de GitHub Actions se ejecutan al subir código a las ramas o crear Pull Requests descritos en el Capítulo IV. El CD publica `frontend/` en GitHub Pages después de ejecutar las pruebas.

**Ajuste técnico al Word:** los workflows usan `npm install` en lugar de `npm ci`, porque no hay un `package-lock.json` generado y comprobado en el entorno de preparación. Cuando hagas `npm install` en tu PC, guarda el `package-lock.json` en Git y podrás volver a usar `npm ci` en los workflows para instalaciones reproducibles. El capítulo debe registrar esa diferencia y la nueva interfaz de acceso.

## Referencias de issues

En el repositorio GitHub del equipo, consulta de disponibilidad corresponde al issue **#3** y gestión de reservas al **#8**. En los Pull Requests puedes incluir `Refs #3` o `Refs #8` para pasar el control de trazabilidad sin cerrar las actividades automáticamente.

No se incluyen capturas o ejecuciones de GitHub Actions fabricadas. Las evidencias deben obtenerse después de ejecutar los workflows reales.

## Verificaciones del proyecto
El sistema incluye validacion HTML, ESLint, pruebas unitarias de reservas y comprobacion de estructura y trazabilidad mediante GitHub Actions.
