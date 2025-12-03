# 🚀 Plan de Migración: Normalización de Base de Datos CargueID

**Fecha Inicio:** 3 de Diciembre 2025, 05:50 AM
**Estado:** 🟡 EN PROGRESO
**Objetivo:** Normalizar tablas CargueID1-ID6 para eliminar redundancia

---

## 📋 FASES DE MIGRACIÓN

### ✅ FASE 0: Preparación y Respaldo
- [x] Análisis de estructura actual
- [x] Análisis de impacto en módulos
- [x] Documentación completa
- [ ] **PENDIENTE:** Crear respaldo de base de datos

### ✅ FASE 1: Crear Nuevos Modelos (COMPLETADA)
- [x] Crear modelo `CargueProductos`
- [x] Crear modelo `CargueResumen`
- [x] Crear modelo `CarguePagos`
- [x] Crear modelo `CargueCumplimiento`
- [x] Crear migraciones Django
- [x] Aplicar migraciones
- [x] Crear script de migración de datos

### ✅ FASE 2: Migrar Datos Existentes (COMPLETADA)
- [x] Script de migración ejecutado
- [x] 54 productos migrados
- [x] 4 resúmenes creados
- [x] 0 errores
- [x] Verificación de integridad de datos

### ✅ FASE 3: Crear Vista SQL Temporal (COMPLETADA)
- [x] Crear vista `api_cargueid1_view`
- [x] Crear vista `api_cargueid2_view`
- [x] Crear vista `api_cargueid3_view`
- [x] Crear vista `api_cargueid4_view`
- [x] Crear vista `api_cargueid5_view`
- [x] Crear vista `api_cargueid6_view`
- [x] Verificar que vistas funcionan correctamente

### ⏳ FASE 4: Actualizar Backend
- [ ] Crear serializers para nuevos modelos
- [ ] Crear endpoint unificado `/api/cargue-completo/`
- [ ] Actualizar `obtener_cargue` (App Móvil)
- [ ] Actualizar `guardar_sugerido` (App Móvil)
- [ ] Actualizar Servicio de IA
- [ ] Actualizar sincronización Planeación

### ⏳ FASE 5: Pruebas Exhaustivas
- [ ] Probar App Móvil (lectura)
- [ ] Probar App Móvil (escritura)
- [ ] Probar Frontend Web (todos los IDs)
- [ ] Probar Planeación
- [ ] Probar Servicio de IA
- [ ] Verificar inventario

### ⏳ FASE 6: Limpieza
- [ ] Eliminar vistas SQL temporales
- [ ] Marcar tablas antiguas como deprecated
- [ ] (Opcional) Eliminar tablas antiguas después de 1 semana
- [ ] Actualizar documentación

---

## 📝 REGISTRO DE CAMBIOS

### 2025-12-03 05:50 - Fase 1 Iniciada

#### Paso 1.1: Crear Modelos Normalizados
**Archivo:** `api/models.py`
**Acción:** Agregados 4 nuevos modelos después de CargueID6

#### Paso 1.2: Crear Migraciones Django
**Comando:** `python3 manage.py makemigrations --name crear_tablas_normalizadas_cargue`
**Resultado:** ✅ Migración 0053 creada correctamente

#### Paso 1.3: Aplicar Migraciones
**Comando:** `python3 manage.py migrate`
**Resultado:** ✅ Tablas creadas en PostgreSQL:
- `api_cargue_productos`
- `api_cargue_resumen`
- `api_cargue_pagos`
- `api_cargue_cumplimiento`

#### Paso 1.4: Crear Script de Migración
**Archivo:** `migrar_datos_cargue.py`
**Estado:** ✅ Script creado, listo para ejecutar

### 2025-12-03 06:00 - ✅ Fase 1 COMPLETADA

**Duración:** ~10 minutos
**Resultado:** EXITOSO

**Tablas creadas:**
- ✅ `api_cargue_productos` (con índices optimizados)
- ✅ `api_cargue_resumen` (con unique_together)
- ✅ `api_cargue_pagos` (con índices)
- ✅ `api_cargue_cumplimiento` (con unique_together)

**Próximo Paso:** Ejecutar `migrar_datos_cargue.py` para poblar las nuevas tablas

---

## 🔧 COMANDOS IMPORTANTES

### Crear Migración
```bash
python3 manage.py makemigrations
```

### Aplicar Migración
```bash
python3 manage.py migrate
```

### Revisar SQL de Migración
```bash
python3 manage.py sqlmigrate api <numero_migracion>
```

### Crear Respaldo de BD
```bash
pg_dump -U postgres -d fabrica > backup_antes_normalizacion_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar BD (si algo sale mal)
```bash
psql -U postgres -d fabrica < backup_antes_normalizacion_YYYYMMDD_HHMMSS.sql
```

---

## ⚠️ NOTAS IMPORTANTES

1. **NO eliminar tablas antiguas** hasta que TODO esté probado
2. **Mantener vistas SQL** hasta confirmar que todo funciona
3. **Probar con datos reales** antes de producción
4. **Tener respaldo** antes de cada fase
5. **Frontend NO cambia visualmente** - solo backend

---

## 📊 PROGRESO GENERAL

```
FASE 0: ████████████████████ 100% ✅
FASE 1: ████████████████████ 100% ✅
FASE 2: ████████████████████ 100% ✅
FASE 3: ████████████████████ 100% ✅
FASE 4: ░░░░░░░░░░░░░░░░░░░░   0% ⏳
FASE 5: ░░░░░░░░░░░░░░░░░░░░   0% ⏳
FASE 6: ░░░░░░░░░░░░░░░░░░░░   0% ⏳

TOTAL:  ██████████░░░░░░░░░░  50%
```

---

## 🆘 EN CASO DE EMERGENCIA (Rollback)

Si algo sale mal en cualquier fase:

1. **Detener servidor:**
   ```bash
   # Ctrl+C en ambas terminales (Django y React)
   ```

2. **Restaurar base de datos:**
   ```bash
   psql -U postgres -d fabrica < backup_antes_normalizacion_*.sql
   ```

3. **Revertir migraciones:**
   ```bash
   python3 manage.py migrate api <numero_migracion_anterior>
   ```

4. **Reiniciar servidor:**
   ```bash
   python3 manage.py runserver 0.0.0.0:8000
   ```

---

**Última Actualización:** 2025-12-03 05:50 AM
**Próximo Paso:** Crear modelo CargueProductos en api/models.py
