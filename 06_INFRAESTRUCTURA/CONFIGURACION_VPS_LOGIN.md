# Documentación de Configuración y Solución de Login (VPS)

Este documento detalla cómo se configuró el servidor VPS para resolver los problemas de inicio de sesión y asegurar la estabilidad del sistema.

## 1. El Problema Original
Al principio, no podías loguearte en el VPS (aunque en local sí funcionaba). Esto se debió a 3 causas principales:
1.  **Tablas Incompletas:** La base de datos en el VPS tenía una versión antigua del esquema y faltaban columnas críticas (ej: `password_plano` en la tabla de cajeros), lo que generaba errores internos.
2.  **Falta de Usuario:** El usuario `ADMIN` no existía físicamente en la base de datos de producción.
3.  **Conexión Frontend-Backend:** El frontend intentaba conectarse a `localhost:8000` (tu PC) en lugar de conectarse internamente al servidor.

## 2. La Solución Implementada (Estado Actual)

### A. Base de Datos (PostgreSQL)
*   **Esquema Corregido:** Ejecutamos comandos manuales para inyectar las columnas faltantes (`password_plano`, `sucursal_id`, etc.) directamente en el VPS.
*   **Independencia:** Los datos viven en un "Volumen de Docker" (`postgres_data`).
    *   *¿Qué significa esto?* Que aunque borres el código, actualices con Git, o reinicies el servidor, **tus usuarios y ventas NO se borran**. Están en una caja fuerte separada.

### B. backend (Django)
*   **Archivo `docker-compose.prod.yml`:**
    *   Configurado para conectar al host `postgres` internalmente.
    *   `DEBUG=False` para seguridad.
    *   Usa variables de entorno para contraseñas, no están escritas en el código.

### C. Frontend (React) + Nginx
*   **Conexión Relativa:** Configurado para que las peticiones se hagan a `/api`. Nginx se encarga de redirigir `/api` al backend y el resto a la página web.
*   **Persistencia:** Al desplegar, se genera una carpeta `build` estática que Nginx sirve rapidísimo.

## 3. Seguridad al Usar Git

**¿Por qué es seguro usar `git pull` ahora?**

1.  **Código vs. Datos:** Git solo actualiza los archivos de texto (código fuente). Git **NO** toca la base de datos PostgreSQL. Tu usuario `ADMIN` vive en la base de datos, por lo que Git no puede borrarlo ni desconfigurarlo.
2.  **Archivos Ignorados:** Hemos configurado el archivo `.gitignore` para que Git ignore:
    *   `media/`: Tus fotos de productos no se tocarán.
    *   `*.sql`: Tus copias de seguridad no se tocarán.
    *   `.env`: Tus contraseñas secretas no se tocarán.

## 4. Credenciales de Acceso (VPS)

El sistema está configurado actualmente con:

*   **URL:** `https://aglogistics.tech`
*   **Usuario Administrador:** `ADMIN`
*   **Contraseña:** `guerrero2026`
*   **Base de Datos:** `fabrica` (Usuario `postgres`)

---
*Este documento sirve como referencia de la arquitectura actual. Cualquier cambio futuro en el código se aplicará sobre esta base sólida sin afectar la capacidad de iniciar sesión.*
