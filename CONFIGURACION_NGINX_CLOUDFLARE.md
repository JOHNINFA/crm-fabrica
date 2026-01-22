# 📋 Configuración de Nginx con Cloudflare Flexible SSL

## ✅ Estado Actual
**Commit funcionando:** `4bedfaf` (Revert del commit problemático)  
**Dominio:** https://aglogistics.tech  
**SSL:** Cloudflare Flexible SSL (Cloudflare maneja HTTPS, VPS recibe HTTP)

---

## 🔧 Configuración de Nginx

### Upstream Backend
```nginx
upstream django {
    server backend:8000;
}
```
- **Importante:** El nombre `backend` debe coincidir con el nombre del servicio en `docker-compose.prod.yml`
- Puerto 8000 es donde Gunicorn escucha dentro del contenedor

### Servidor HTTP (Puerto 80)
```nginx
server {
    listen 80;
    server_name aglogistics.tech www.aglogistics.tech;
    
    # NO REDIRIGIR A HTTPS
    # Cloudflare maneja el HTTPS, nosotros recibimos HTTP
    # return 301 https://$server_name$request_uri;  # ❌ COMENTADO
}
```

**⚠️ CRÍTICO:** NO descomentar la redirección HTTPS o causará bucle infinito con Cloudflare Flexible.

### Rutas Configuradas

#### 1. API Backend (`/api/`)
```nginx
location /api/ {
    proxy_pass http://django;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    proxy_connect_timeout 120;
    proxy_send_timeout 120;
    proxy_read_timeout 120;
}
```

#### 2. Admin de Django (`/admin/`)
```nginx
location /admin/ {
    proxy_pass http://django;
    # ... (mismos headers que /api/)
}
```

#### 3. Archivos Estáticos de React
```nginx
location ~ ^/static/(js|css|media)/ {
    root /var/www/frontend;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### 4. Archivos Estáticos de Django
```nginx
location /static/ {
    alias /var/www/static/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

#### 5. Media Files (Fotos de productos, vencidos)
```nginx
location /media/ {
    alias /var/www/media/;
    expires 7d;
    add_header Cache-Control "public";
}
```

#### 6. Frontend React (SPA)
```nginx
location / {
    root /var/www/frontend;
    try_files $uri $uri/ /index.html;
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
}
```

---

## 🐳 Docker Compose - Servicios Relacionados

### Servicio Backend
```yaml
backend:
  container_name: crm_backend_prod
  expose:
    - "8000"  # NO usar 'ports', solo 'expose' (interno)
  networks:
    - crm_network
```

### Servicio Nginx
```yaml
nginx:
  container_name: crm_nginx
  ports:
    - "80:80"
    - "443:443"  # Reservado para futuro
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - static_volume:/var/www/static:ro
    - ./media:/var/www/media:ro
    - frontend_build:/var/www/frontend:ro
  depends_on:
    - backend
  networks:
    - crm_network
```

**⚠️ IMPORTANTE:** Ambos contenedores deben estar en la misma red (`crm_network`) para que nginx pueda comunicarse con el backend usando el nombre `backend:8000`.

---

## 🌐 Configuración de Cloudflare

### DNS
- **Tipo:** A
- **Nombre:** @ (o aglogistics.tech)
- **Contenido:** 76.13.96.225 (IP del VPS)
- **Proxy:** ✅ Activado (nube naranja)

### SSL/TLS
- **Modo:** Flexible
- **Cloudflare → Usuario:** HTTPS ✅
- **Cloudflare → VPS:** HTTP (puerto 80)

### Reglas de Página (Opcional)
- Always Use HTTPS: ✅ Activado
- Automatic HTTPS Rewrites: ✅ Activado

---

## 🚀 Comandos de Despliegue

### Actualizar Nginx
```bash
# Si cambias nginx.conf
docker compose -f docker-compose.prod.yml restart nginx
```

### Reconstruir Todo
```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

### Ver Logs
```bash
# Logs de nginx
docker logs crm_nginx --tail 50

# Logs del backend
docker logs crm_backend_prod --tail 50

# Logs en tiempo real
docker logs crm_nginx -f
```

### Probar Conectividad
```bash
# Desde nginx hacia backend
docker exec crm_nginx wget -O- http://backend:8000/api/categorias/

# Desde el VPS hacia el backend
curl http://localhost:8000/api/categorias/
```

---

## ❌ Problemas Comunes

### Error 502 Bad Gateway
**Causa:** Nginx no puede comunicarse con el backend.

**Soluciones:**
1. Verificar que el backend esté corriendo: `docker ps`
2. Verificar que estén en la misma red: `docker network inspect crm-fabrica_default`
3. Reiniciar nginx: `docker compose -f docker-compose.prod.yml restart nginx`
4. Verificar nombre del upstream en nginx.conf coincide con el servicio en docker-compose

### Bucle de Redirección Infinito
**Causa:** Nginx está redirigiendo HTTP → HTTPS cuando Cloudflare ya lo hace.

**Solución:** Comentar la línea `return 301 https://...` en nginx.conf

### Mixed Content (HTTP en HTTPS)
**Causa:** El frontend intenta cargar recursos HTTP en una página HTTPS.

**Solución:** Asegurar que todas las URLs en el frontend sean relativas (`/api/...`) o HTTPS.

---

## 📝 Notas Importantes

1. **Puerto 443 bloqueado:** Hostinger bloquea el puerto 443, por eso usamos Cloudflare Flexible SSL.
2. **No usar HTTPS directo:** El VPS solo escucha en puerto 80, Cloudflare maneja el HTTPS.
3. **Nombres de servicios:** En nginx.conf usar `backend:8000`, NO `crm_backend_prod:8000`.
4. **Volúmenes compartidos:** Los archivos estáticos y media deben estar montados en nginx para servirse directamente.

---

## 🔄 Historial de Commits

- `4bedfaf` - ✅ **FUNCIONANDO** - Revert del commit problemático
- `6b3c874` - ❌ Roto - Agregó CSRF_TRUSTED_ORIGINS que causó conflictos
- `12be677` - ✅ Configuración inicial de Cloudflare Flexible SSL
- `a9219fd` - Guías de despliegue

**Commit actual en producción:** `4bedfaf`
