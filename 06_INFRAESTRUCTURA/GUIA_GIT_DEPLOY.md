# Guía Avanzada: Despliegue con Git (Push -> Pull)

Esta guía explica cómo actualizar tu servidor VPS descargando los cambios directamente desde GitHub, en lugar de subir archivos sueltos manualmente.

## 🔄 El Nuevo Flujo de Trabajo

1.  **En tu PC (Local):**
    *   Haces cambios.
    *   Guardas: `git add .` y `git commit -m "mensaje"`
    *   Subes a la nube: `git push origin main`

2.  **En el VPS (Servidor):**
    *   Bajas los cambios: `git pull origin main`
    *   Actualizas el sistema: `docker compose up -d --build`

---

## 🛠️ Configuración Inicial (Solo se hace una vez)

Para que esto funcione, debemos decirle al VPS que la carpeta `crm-fabrica` está conectada a tu GitHub.

**Paso 1: Conéctate al VPS**
Abre una terminal nueva y entra:
```bash
ssh root@76.13.96.225
```

**Paso 2: Inicializar Git en el VPS**
Una vez dentro del VPS, ejecuta estos comandos uno por uno:

```bash
cd ~/crm-fabrica

# 1. Iniciar git si no existe
git init

# 2. Conectar con tu repositorio (Si te pide usuario/pass al hacer pull, los pones)
git remote add origin https://github.com/JOHNINFA/crm-fabrica.git

# 3. Descargar la información (sin tocar tus archivos aún)
git fetch origin

# 4. Forzar que el VPS sea idéntico a GitHub (¡CUIDADO!)
# Esto sobrescribirá archivos de código, pero NO tus datos de base de datos ni carpeta media.
git reset --hard origin/main
```

*Nota: Si tienes archivos en el VPS que NO están en GitHub (como `.env` o backups locales), `git reset --hard` podría borrarlos si no están protegidos. Asegúrate de que `media/` y `.env` estén seguros.*

---

## 🚀 Cómo actualizar día a día

Cada vez que quieras actualizar el VPS con lo último que subiste a GitHub:

1.  Conectar: `ssh root@76.13.96.225`
2.  Ir a carpeta: `cd ~/crm-fabrica`
3.  Bajar cambios: `git pull origin main`
4.  Aplicar cambios:
    *   Si es solo **Frontend**: `docker compose -f docker-compose.prod.yml up -d --build frontend`
    *   Si es **Backend**: `docker compose -f docker-compose.prod.yml up -d --build backend`
    *   Si tienes duda, actualiza **todo**: `docker compose -f docker-compose.prod.yml up -d --build`

## ⚠️ Diferencias con el método manual (SCP)
*   **Ventaja:** Es mucho más seguro y ordenado. No olvidarás subir un archivo pequeño.
*   **Requisito:** Debes recordar hacer `git push` en tu local antes de intentar actualizar el VPS.
