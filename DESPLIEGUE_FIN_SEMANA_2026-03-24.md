# 🚀 DESPLIEGUE VPS - FIN DE SEMANA 2026-03-24

## 📋 Resumen de Cambios a Desplegar

### Frontend
- ✅ Botón "Precio Especial" en Cargue (amarillo, informativo)

### Backend
- ✅ Nuevo campo `intentos_anulacion` en modelo VentaRuta (requiere migración)
- ✅ Validación: máximo 1 anulación por venta
- ✅ Fix: Edición de ventas actualiza Nequi/Daviplata/Vencidas en Cargue

---

## 🔧 PASOS DE DESPLIEGUE

### Paso 1: Conectar al VPS y actualizar código
```bash
ssh root@76.13.96.225
cd ~/crm-fabrica

# Actualizar código (hace merge automático)
git pull --no-rebase origin main
```

**Verificar que se bajó todo:**
```bash
git log -3
# Deberías ver:
# - feat(backend): Límite anulaciones + Fix edición ventas
# - feat(frontend): Botón Precio Especial en Cargue
```

**Si hay conflictos durante el merge:**
```bash
# Ver qué archivos tienen conflicto
git status

# Resolver conflictos manualmente, luego:
git add .
git commit -m "Merge remote changes"

# O si quieres cancelar el merge:
git merge --abort
```

**Si git abre un editor (nano/vim) para el mensaje de merge:**
```bash
# Git te pedirá confirmar el mensaje de commit
# En nano (editor por defecto):
# 1. Ctrl + O (guardar)
# 2. Enter (confirmar nombre)
# 3. Ctrl + X (salir)

# En vim (si aparece):
# 1. Presiona ESC
# 2. Escribe :wq
# 3. Enter
```

---

### Paso 2: Aplicar Migración (Base de Datos)
**⚠️ IMPORTANTE:** Como agregamos el campo `intentos_anulacion`, hay que migrar la BD.

```bash
# 1. Aplicar migración
docker exec crm_backend_prod python manage.py migrate

# 2. Reiniciar backend
docker compose -f docker-compose.prod.yml up -d --build backend

# 3. Reiniciar Nginx (IMPORTANTE: siempre después de actualizar backend)
docker compose -f docker-compose.prod.yml restart nginx
```

**Verificar que migró correctamente:**
```bash
docker compose -f docker-compose.prod.yml logs backend | grep "Applying"
# Deberías ver: "Applying api.XXXX_ventaruta_intentos_anulacion... OK"
```

---

### Paso 3: Actualizar Frontend
```bash
# Reconstruir frontend
docker compose -f docker-compose.prod.yml up -d --build frontend

# Reiniciar Nginx (IMPORTANTE: siempre después de actualizar frontend)
docker compose -f docker-compose.prod.yml restart nginx
```

---

### Paso 4: Verificar que todo funciona
```bash
# Ver logs en tiempo real (Ctrl+C para salir)
docker compose -f docker-compose.prod.yml logs -f

# Verificar que todos los contenedores estén corriendo
docker ps
# Deberías ver: crm_frontend_prod, crm_backend_prod, crm_db_prod, crm_nginx_prod
```

**Probar en navegador:**
- https://aglogistics.tech

---

## ✅ CHECKLIST DE PRUEBAS EN PRODUCCIÓN

### Frontend - Módulo Cargue
- [ ] Abrir módulo de Cargue
- [ ] Verificar que aparece botón amarillo "💰 Precio Especial" (si hay diferencias)
- [ ] Hacer clic en el botón y verificar modal con detalles
- [ ] Verificar que NO modifica los totales (solo informativo)

### Backend - Límite de Anulaciones
- [ ] Desde app móvil: Crear una venta
- [ ] Anular la venta (debe funcionar - 1ra anulación)
- [ ] Intentar anular de nuevo (debe bloquear - 2da anulación)
- [ ] Verificar mensaje: "Esta venta ya fue anulada anteriormente..."

### Backend - Fix Edición de Ventas
- [ ] Desde app móvil: Crear una venta con método EFECTIVO
- [ ] Editar la venta y cambiar método a NEQUI
- [ ] Ir al CRM Web → Cargue → Verificar que NEQUI se refleja en el resumen
- [ ] Agregar productos vencidos en la edición
- [ ] Verificar que las vencidas aparecen en el resumen de Cargue

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### 🛑 Problema: Pantalla blanca o "403 Forbidden"
**Causa:** Nginx no encuentra los archivos nuevos del frontend.

**Solución:**
```bash
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
docker compose -f docker-compose.prod.yml restart nginx
```

---

### 🛑 Problema: Error "FATAL: password authentication failed"
**Causa:** Se mezclaron las claves de desarrollo y producción.

**Solución:**
```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

---

### 🛑 Problema: Error de migración "column already exists"
**Causa:** La migración ya se aplicó antes.

**Solución:**
```bash
# Marcar migración como aplicada sin ejecutarla
docker exec crm_backend_prod python manage.py migrate --fake api
```

---

### 🛑 Problema: Sitio caído (Connection Timed Out)
**Causa:** El servidor de producción se detuvo.

**Solución:**
```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml restart nginx
```

---

### 🛑 Problema: Backend no responde (500 Internal Server Error)
**Causa:** Backend crasheó o no se reinició correctamente.

**Solución:**
```bash
# Ver logs del backend
docker compose -f docker-compose.prod.yml logs backend

# Reiniciar backend
docker compose -f docker-compose.prod.yml restart backend
```

---

### 🛑 Problema: Cambios no se ven (caché del navegador)
**Causa:** El navegador tiene caché viejo.

**Solución:**
```bash
# En el navegador: Ctrl + Shift + R (forzar recarga sin caché)
# O abrir en modo incógnito
```

---

## 🔄 SI TODO FALLA (Opción Nuclear)

Si nada de lo anterior funciona, reconstruir todo desde cero:

```bash
# 1. Detener todo
docker compose -f docker-compose.prod.yml down

# 2. Reconstruir sin caché
docker compose -f docker-compose.prod.yml build --no-cache

# 3. Levantar todo
docker compose -f docker-compose.prod.yml up -d

# 4. Reiniciar Nginx (por si acaso)
docker compose -f docker-compose.prod.yml restart nginx

# 5. Verificar logs
docker compose -f docker-compose.prod.yml logs -f
```

**⚠️ NOTA:** Esta opción tarda más (5-10 minutos) porque reconstruye todo sin usar caché.

---

## 📊 COMANDOS ÚTILES

### Ver logs en tiempo real
```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Ver logs de un servicio específico
```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f nginx
```

### Ver estado de contenedores
```bash
docker ps
```

### Reiniciar un servicio específico
```bash
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart frontend
docker compose -f docker-compose.prod.yml restart nginx
```

### Entrar a un contenedor (debugging)
```bash
docker exec -it crm_backend_prod bash
docker exec -it crm_frontend_prod sh
```

---

## ⏱️ TIEMPO ESTIMADO

- Paso 1 (Conectar y actualizar): 2 minutos
- Paso 2 (Migración): 3 minutos
- Paso 3 (Frontend): 5 minutos
- Paso 4 (Nginx): 1 minuto
- Paso 5 (Verificación): 5 minutos
- **Total: ~15-20 minutos**

---

## 📝 NOTAS FINALES

- ✅ Hacer backup de la BD antes de migrar (opcional pero recomendado)
- ✅ Desplegar en horario de bajo tráfico (fin de semana)
- ✅ Tener a mano este documento durante el despliegue
- ✅ Probar TODAS las funcionalidades del checklist
- ✅ Si algo falla, NO entrar en pánico - seguir la sección de solución de problemas

---

**Fecha de creación:** 2026-03-24  
**Última actualización:** 2026-03-24  
**Responsable:** John  
**Estado:** Listo para despliegue
