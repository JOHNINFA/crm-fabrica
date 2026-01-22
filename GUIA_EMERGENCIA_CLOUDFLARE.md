# 🚨 GUÍA DE EMERGENCIA: Desactivar Cloudflare y Volver a HTTP

Esta guía explica qué hacer si **Cloudflare falla** o si decides dejar de usarlo, para que tu sitio vuelva a estar en línea (aunque sea solo por HTTP inseguro) en el proveedor Hostinger.

---

## ⚠️ Situación Actual (Contexto)
*   **Problema de origen:** El proveedor (Hostinger) tiene bloqueado el tráfico de entrada al puerto **443 (HTTPS)** desde internet.
*   **Solución actual:** Usamos Cloudflare en modo **Flexible**. Cloudflare recibe el tráfico seguro (HTTPS) de los usuarios y se comunica con tu servidor por el puerto **80 (HTTP)**, el cual sí funciona.

---

## 🛠️ Pasos para "Desconectar" Cloudflare en Emergencia

Si necesitas quitar Cloudflare, sigue estos pasos:

### 1. Cambiar los Nameservers en Hostinger
Esto hace que el dominio deje de pasar por Cloudflare y apunte directo a tu VPS.

1.  Entra a tu panel de **Hostinger**.
2.  Ve a la sección **Dominios** -> `aglogistics.tech`.
3.  Busca la opción **DNS / Nameservers**.
4.  Haz clic en **Cambiar Nameservers**.
5.  Elige la opción **"Usar los nameservers de Hostinger"** (o escribe los predeterminados):
    *   `ns1.dns-parking.com`
    *   `ns2.dns-parking.com`
6.  Guarda los cambios.
    *   *Nota: Esto puede tardar entre 15 minutos y 24 horas en propagarse.*

---

### 2. Verificar que Nginx acepte HTTP
Tu configuración actual de Nginx (`nginx.conf`) **YA está lista** para esto.

Actualmente, tienes configurado Nginx para escuchar en el puerto 80 y **NO** redirigir forzosamente a HTTPS.
*   **No necesitas cambiar nada en el código** si solo quieres que funcione por HTTP.

### 3. Cómo acceder al sitio
Una vez se propaguen los DNS (paso 1), podrás entrar a tu web así:

*   ✅ **http://aglogistics.tech** (Funcionará, pero dirá "No seguro").
*   ❌ **https://aglogistics.tech** (Dará error "Connection Timed Out" hasta que Hostinger arregle el bloqueo del puerto 443).

---

## 🔄 ¿Y si Hostinger arregla el puerto 443 en el futuro?
Si sigues usando Cloudflare y Hostinger arregla el problema, puedes mejorar la seguridad:

1.  Entra a **Cloudflare**.
2.  Ve a **SSL/TLS**.
3.  Cambia el modo de **"Flexible"** a **"Completo (estricto)"**.
    *   Esto cifrará la conexión también entre Cloudflare y tu servidor.

---

**Resumen Rápido:**
*   Si Cloudflare cae -> Cambia Nameservers en Hostinger a los "default".
*   Tu web funcionará solo en `http://` (sin S).
