# PENDIENTE — Límite de Intentos Login y Seguridad de Contraseñas

## Estado: PENDIENTE — No implementado (requiere Redis)

---

## Qué se quiere hacer

### 1. Rate Limiting (Límite de intentos de login)
- Máximo **5 intentos fallidos por IP**
- Bloqueo de **15 minutos** tras superar el límite
- Respuesta HTTP 429 con mensaje: "Demasiados intentos. Espera 15 minutos e intenta de nuevo."

### 2. Eliminar contraseñas en texto plano
- Eliminar campo `password_plano` del modelo `Cajero`
- Eliminar comparación `usuario.password == password` (texto plano) en `auth_login`
- Solo permitir comparación con hash SHA256

---

## Por qué no se implementó

Al intentar usar `django-ratelimit==4.1.0`, el backend falló con:

```
SystemCheckError:
?: (django_ratelimit.E003) cache backend django.core.cache.backends.locmem.LocMemCache
   is not a shared cache
   HINT: Use a supported cache backend
```

**Causa:** `django-ratelimit` requiere un cache compartido (Redis o Memcached). El proyecto actualmente usa el cache en memoria de Django (`LocMemCache`) que no es compatible.

---

## Solución requerida

Agregar **Redis** al `docker-compose.prod.yml`:

```yaml
redis:
  image: redis:7-alpine
  container_name: crm_redis
  restart: unless-stopped
  networks:
    - crm_network
```

Y configurar en `settings.py`:

```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://redis:6379',
    }
}
```

Luego agregar a `requirements.txt`:
```
django-ratelimit==4.1.0
```

Y en `INSTALLED_APPS`:
```python
'django_ratelimit',
```

Y en `api/views.py` en `auth_login`:
```python
from django_ratelimit.core import is_ratelimited
if is_ratelimited(request, group='auth_login', key='ip', rate='5/15m', method='POST', increment=True):
    return Response({
        'success': False,
        'error': 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.'
    }, status=429)
```

---

## Advertencia para el tema de contraseñas en texto plano

Antes de eliminar `password_plano` y la comparación en texto plano:
- Verificar qué usuarios tienen contraseña solo en texto plano (sin hash)
- Resetear sus contraseñas desde Gestión de Usuarios antes de hacer el cambio
- Hacer el cambio en una ventana de mantenimiento
- **NO hacer `docker compose down -v`** — eso borra la BD

---

## Archivos a tocar

| Archivo | Cambio |
|---|---|
| `docker-compose.prod.yml` | Agregar servicio Redis |
| `backend_crm/settings.py` | Configurar CACHES + agregar `django_ratelimit` a INSTALLED_APPS |
| `requirements.txt` | Agregar `django-ratelimit==4.1.0` |
| `api/views.py` | Agregar check `is_ratelimited` en `auth_login` |
| `api/models.py` | Eliminar campo `password_plano` (con migración) |

---

## Flujo obligatorio antes de subir al VPS

1. Agregar Redis al `docker-compose.yml` **local**
2. Probar login normal — debe seguir funcionando
3. Probar 6 intentos fallidos seguidos — debe bloquear al 6to con HTTP 429
4. Solo si todo pasa en local → subir al VPS

**Lección aprendida:** se intentó directamente en VPS y generó error de cache que tumbó el backend.

---

*Creado: Abril 2026*
