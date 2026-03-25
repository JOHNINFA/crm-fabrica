# 📋 RESUMEN COMPLETO DE CAMBIOS PENDIENTES
**Fecha**: 2026-03-24
**Estado**: Listos para revisión y despliegue

---

## 🎯 CAMBIOS DE HOY (Sesión Actual con Kiro)

### 1. App Móvil - Productos Vencidos: Stock en Tiempo Real ⚡ ✅
**Archivos**: 
- `AP GUERRERO/components/Ventas/VentasScreen.js`
- `AP GUERRERO/components/Ventas/DevolucionesVencidas.js`

**Problema detectado**:
- Al agregar productos vencidos, el stock disponible NO se actualizaba en tiempo real
- El usuario veía "Stock disponible: 101" aunque agregara 1 vencido (debería mostrar 100)
- El stock solo se ajustaba al confirmar la venta completa
- Dentro del modal de vencidas, el stock tampoco se actualizaba mientras escribías cantidades
- El modal se veía diferente según dónde se abriera (pantalla completa vs flotante)

**Cambios implementados**:

1. **Ajuste de stock local inmediato** (`handleGuardarVencidas`):
   - ✅ Actualiza `stockCargue` al guardar productos vencidos
   - ✅ Restaura stock de vencidas anteriores (si se estaban editando)
   - ✅ Descuenta nuevas vencidas del stock disponible
   - ✅ Permite ver el stock real disponible al instante

2. **Stock en tiempo real dentro del modal** (`DevolucionesVencidas.js`):
   - ✅ El "Stock disponible" resta la cantidad que estás escribiendo EN ESE MOMENTO
   - ✅ Si stock es 100 y pones 1 vencido → muestra "Stock disponible: 99"
   - ✅ Si cambias a 5 vencidos → muestra "Stock disponible: 95"
   - ✅ Si borras todo → vuelve a mostrar "Stock disponible: 100"

3. **Modal flotante unificado**:
   - ✅ Ahora siempre se ve como modal flotante con fondo oscuro
   - ✅ Bordes redondeados (20px)
   - ✅ NO se encoge cuando sale el teclado
   - ✅ Animación suave (fade)
   - ✅ Consistencia visual total (venta normal = editar venta)

4. **Mejoras visuales**:
   - ✅ Tamaño de texto del stock aumentado: `fontSize: 11` → `fontSize: 13`
   - ✅ Peso de fuente aumentado: `fontWeight: '600'` → `fontWeight: '700'`
   - ✅ Mejor legibilidad en ambos contextos

5. **Optimizaciones de rendimiento**:
   - ✅ `React.memo`: Componente solo se re-renderiza cuando cambian props
   - ✅ `useMemo` para productos: Solo se cargan cuando modal es visible
   - ✅ `useMemo` para stocks: Pre-cálculo de todos los stocks en una pasada
   - ✅ `useCallback` para renderProducto: Función de render optimizada
   - ✅ Modal abre más rápido desde "Adjuntar vencidas" en editar venta

**Beneficios**:
- Feedback visual instantáneo del stock disponible
- Usuario puede tomar decisiones informadas en tiempo real
- Mejor rendimiento al abrir el modal
- Experiencia visual consistente en toda la app
- Evita confusión sobre cuánto stock queda disponible

**Riesgo**: Bajo - Solo mejora UX, no modifica lógica de negocio

---

### 2. App Móvil - Límite de Anulaciones por Venta 🔒 ✅
**Archivos**: 
- `AP GUERRERO/components/Ventas/VentasScreen.js`
- `api/models.py`
- `api/views.py`

**Problema detectado**:
- Sin límite, vendedores pueden anular/recrear ventas repetidamente
- Dificulta auditoría y puede ocultar errores

**Cambios implementados**:
- 🔒 Límite de **1 anulación por venta**
- ✅ Validación en app móvil (antes de enviar)
- ✅ Validación en backend (doble seguridad)
- ✅ Nuevo campo: `intentos_anulacion` (IntegerField, default=0)
- ✅ Mensaje claro sugiriendo usar "Editar" después del límite
- ✅ Funciona offline (validación local + sincronización)

**Beneficios**:
- Previene abuso de anulaciones
- Facilita auditoría (máximo 1 anulación por venta)
- Promueve uso de "Editar" (mejor trazabilidad)
- Permite corregir errores honestos (1 vez)

**Migración requerida**:
```bash
python manage.py makemigrations
python manage.py migrate
```

**Riesgo**: Bajo - Solo agrega validación, no modifica lógica existente

---

### 3. App Móvil - Optimización de Timeouts para Conexión Intermitente ✅
**Archivos**: `AP GUERRERO/components/Ventas/VentasScreen.js`

**Problema detectado**:
- Con conexión intermitente, timeouts largos (25-30s) causaban esperas sin feedback
- Botón "CONFIRMAR PEDIDO" quedaba bloqueado mucho tiempo
- Error aparecía en toast pequeño que desaparecía rápido

**Cambios implementados**:
- ⚡ Marcar pedido entregado: 25s → **8s**
- ⚡ Reportar novedad (no entregado): 25s → **8s**
- ⚡ Abrir turno: 25s → **10s**
- ⚡ Cargar stock de cargue: 30s → **15s**
- ⚡ Precargar clientes: 25s → **15s**
- ⚡ Anular venta (background): 30s → **12s**
- 💬 Alert claro en vez de toast pequeño

**Beneficios**:
- Falla rápido (8-15s) en vez de esperar 25-30s
- Feedback visual claro con Alert
- Sistema offline sigue funcionando perfectamente
- Mejor experiencia con señal intermitente

**Riesgo**: Bajo - Solo reduce timeouts y mejora mensajes, no modifica lógica offline

---

### 4. App Móvil - Feedback Visual en Botones (ClienteSelector) ✅
**Archivo**: `AP GUERRERO/components/Ventas/ClienteSelector.js`

**Problema detectado**:
- `activeOpacity={0.9}` hacía que los botones casi no cambiaran de color al tocarlos
- Usuario no veía feedback visual claro
- Pensaba que no funcionó y tocaba dos veces

**Cambios implementados**:
- ⚡ `activeOpacity` cambiado de **0.9** a **0.6** (3 instancias)
- ⚡ Agregado `delayPressIn={0}` para respuesta instantánea
- ✅ Botones afectados:
  - Botón "Pasar al siguiente" (skip-forward)
  - Botón "Ver todos los clientes" (chevron-forward)
  - Botón "Cerrar" en modal de lista completa

**Beneficios**:
- Feedback visual claro e inmediato
- Botón se oscurece notablemente al tocar (40% de opacidad vs 10% anterior)
- Usuario sabe que su toque fue registrado
- Reduce toques dobles accidentales

**Riesgo**: Ninguno - Solo mejora visual, no modifica lógica

---

### 5. App Móvil - Sistema de Caché Offline ✅
**Archivos**: `AP GUERRERO/components/Ventas/VentasScreen.js`

**Cambios implementados**:
- ✅ Caché de pedidos pendientes (`verificarPedidosPendientes`)
- ✅ Caché de ventas del día (`cargarVentasDelDia`)
- ✅ Caché de historial de reimpresión (`cargarHistorialReimpresion`)
- ✅ Indicador de stock en modal "Editar Venta"
- ✅ Fix: Invalidar caché de historial después de editar venta
- ✅ Fix: Teclado empujando contenido en Sugeridos

**Beneficios**:
- Funciona con señal media/inestable
- Carga instantánea desde caché (AsyncStorage)
- Actualiza en segundo plano sin bloquear UI
- Timeout reducido a 12 segundos (antes 25s)
- Historial se actualiza correctamente después de editar
- Teclado ya no empuja el contenido en ninguna pantalla

**Claves de caché**:
```javascript
pedidos_cache_${userId}_${fecha}
ventas_backend_cache_${userId}_${fechaDia}
historial_cache_${userId}_${fechaStr}
```

**Bugs corregidos**:
1. **Historial no mostraba ediciones**: El caché no se invalidaba después de editar. Solución: Invalidar caché automáticamente.
2. **Teclado empujaba contenido en Sugeridos**: `ProductList.js` tenía `paddingBottom: 220` en vez de `260`. Solución: Cambiar a 260 para igualar Ventas.

**Riesgo**: Bajo - Solo agrega caché y corrige padding, no modifica lógica existente

---

## 📦 CAMBIOS PREVIOS (Pausados desde 2026-03-21)

### 3. Backend - Corrección de Fechas Operativas ⏸️
**Archivo**: `api/views.py`

**Cambios**:
- Nueva función `_resolver_fecha_operativa()` para evitar desfases de zona horaria
- Corrección en auditoría para que no cruce mal ventas/vencidas
- Mejora en mapeo de cargue por vendedor
- ✅ **Fix edición de ventas (24 marzo 2026)**: Ahora al editar una venta desde la app, el backend actualiza correctamente:
  - Vendidas (productos vendidos) ✅
  - Nequi/Daviplata (métodos de pago) ✅ NUEVO
  - Vencidas (productos vencidos) ✅ NUEVO

**Problema corregido**:
- Antes: Al editar una venta y cambiar método de pago a NEQUI o agregar vencidas, NO se reflejaba en el resumen de Cargue
- Ahora: El backend revierte los valores anteriores y aplica los nuevos correctamente

**Riesgo**: Medio - Requiere validación con datos reales

---

### 3. Frontend - Botón "Precio Especial" ⏸️
**Archivo**: `frontend/src/components/Cargue/PlantillaOperativa.jsx`

**Cambios**:
- Botón amarillo informativo que aparece solo si hay diferencia por precios especiales
- Modal con detalle por venta:
  - Cliente
  - Total real vendido
  - Total calculado a "Precio Cargue/App"
  - Diferencia
- Cambio solo visual/informativo
- NO modifica cálculos base de cargue
- NO modifica stock
- NO cambia lógica del backend

**Riesgo**: Bajo - Solo visual, no afecta lógica de negocio

---

### 4. Frontend - Gestión de Rutas 🆕
**Archivo**: `frontend/src/components/rutas/GestionRutas.jsx`

**Cambios**:
- Interacción doble clic para editar/eliminar rutas
- Botones compactos (lápiz/basura) con auto-ocultamiento (5s)
- Modal unificado para crear/editar rutas

**Riesgo**: Bajo - Mejora de UX

---

### 5. Frontend - Reporte Ventas Ruta 🆕
**Archivos**: 
- `frontend/src/components/rutas/ReporteVentasRuta.jsx`
- `frontend/src/components/rutas/ReporteVentasRuta.css`

**Cambios**: (Revisar diff para detalles)

**Riesgo**: Bajo

---

### 6. Frontend - Reportes Avanzados 🆕
**Archivos**:
- `frontend/src/pages/ReportesAvanzadosScreen.jsx`
- `frontend/src/pages/ReportesAvanzados/DashboardIntegral.jsx` (nuevo)
- `frontend/src/pages/ReportesAvanzados/DashboardIntegral.css` (nuevo)
- `frontend/src/pages/ReportesAvanzados/cargueOrden.js` (nuevo)

**Cambios**: Dashboard integral de reportes

**Riesgo**: Bajo - Módulo nuevo, no afecta existentes

---

### 7. Backend - Endpoint Vendedores Cargue 🆕
**Archivo**: `api/urls.py`, `api/views.py`

**Cambios**:
- Nuevo endpoint `/api/vendedores-cargue/` para cargar vendedores dinámicamente
- Usado por Herramientas.jsx para select de vendedores

**Riesgo**: Bajo - Endpoint simple de lectura

---

### 8. Frontend - Servicios de Rutas 🆕
**Archivo**: `frontend/src/services/rutasService.js`

**Cambios**: (Revisar diff para detalles)

**Riesgo**: Bajo

---

## 📁 ARCHIVOS NUEVOS (Sin seguimiento)

### Documentación
- `.kiro/docs/PLAN_RECONEXION_OFFLINE_CARGUE.md`
- `.kiro/docs/README_INFORME_REPORTES_AVANZADOS.md`
- `.kiro/docs/README_PENDIENTES_2026-03-14.md`
- `PENDIENTES_VPS_MARZO.md`
- `README_DESPLIEGUE_AUDITORIA_Y_RECUPERACION_2026-03-19.md`
- `README_PENDIENTE_SUBIDA_WEB_2026-03-21.md`
- `README_TAREA_PENDIENTE_IMAGENES_PEDIDOS_2026-03-22.md`
- `STICKY_HEADER_DEBUG.md`
- `frontend/src/pages/ReportesAvanzados/Analisis_Inteligente_Reportes_Avanzados.md`

### Código
- `optimizacion_completar_venta.js` (NO aplicado, solo referencia)

### App Móvil
- `AP GUERRERO/` (completo, sin seguimiento)

---

## 🚨 MOTIVO DE PAUSA (2026-03-21)

Se reportó una falla en el flujo de `Pedidos` y por eso el lote web quedó pausado.

**Estado actual**: ¿Ya se resolvió el problema de Pedidos?

---

## ✅ CHECKLIST ANTES DE SUBIR

### Backend (api/)
- [ ] Revisar cambios en `api/views.py`
- [ ] Revisar cambios en `api/urls.py`
- [ ] Excluir `__pycache__` del commit
- [ ] Probar endpoints nuevos:
  - `/api/vendedores-cargue/`

### Frontend (frontend/)
- [ ] Revisar cambios en `PlantillaOperativa.jsx`
- [ ] Revisar cambios en `GestionRutas.jsx`
- [ ] Revisar cambios en `ReporteVentasRuta.jsx`
- [ ] Revisar cambios en `ReportesAvanzadosScreen.jsx`
- [ ] Revisar cambios en `rutasService.js`
- [ ] Probar módulos:
  - Cargue (botón Precio Especial)
  - Auditoría
  - Ventas Ruta
  - Gestión de Rutas
  - Reportes Avanzados

### App Móvil (AP GUERRERO/)
- [ ] Revisar cambios en `VentasScreen.js`
- [ ] Probar caché offline:
  - Pedidos pendientes
  - Ventas del día
  - Historial de reimpresión
- [ ] Probar con señal media/inestable
- [ ] Probar indicador de stock en "Editar Venta"

---

## 📦 ESTRATEGIA DE COMMITS

### Opción 1: Commit Separado por Módulo
```bash
# 1. Backend
git add api/views.py api/urls.py
git commit -m "feat(backend): Corrección fechas operativas + endpoint vendedores-cargue"

# 2. Frontend Web
git add frontend/src/components/Cargue/PlantillaOperativa.jsx
git add frontend/src/components/rutas/GestionRutas.jsx
git add frontend/src/components/rutas/ReporteVentasRuta.*
git add frontend/src/pages/ReportesAvanzadosScreen.jsx
git add frontend/src/pages/ReportesAvanzados/
git add frontend/src/services/rutasService.js
git commit -m "feat(frontend): Botón Precio Especial + Mejoras Rutas + Dashboard Reportes"

# 3. App Móvil
git add "AP GUERRERO/"
git commit -m "feat(app): Sistema caché offline + indicador stock en edición"

# 4. Documentación
git add AI_CONTEXT.md
git add .kiro/docs/
git add *.md
git commit -m "docs: Actualización documentación cambios 2026-03-24"
```

### Opción 2: Commit Único (No recomendado)
```bash
git add .
git commit -m "feat: Caché offline app + Precio especial + Mejoras rutas + Dashboard reportes"
```

---

## 🚀 DESPLIEGUE AL VPS

### Paso 1: Preparar Local
```bash
# 1. Hacer commit limpio (sin __pycache__)
git add api/views.py api/urls.py
git add frontend/src/
git add "AP GUERRERO/"
git add AI_CONTEXT.md
git commit -m "feat: Caché offline app + Precio especial + Mejoras rutas"

# 2. Push a repositorio
git push origin main
```

### Paso 2: Actualizar VPS (OPCIÓN SEGURA)
```bash
# Conectar al VPS
ssh root@76.13.96.225
cd ~/crm-fabrica

# OPCIÓN A: Pull con rebase (si no hay conflictos)
git pull --rebase origin main

# OPCIÓN B: Reset duro (si hay conflictos o cambios locales)
git fetch origin
git reset --hard origin/main

# Verificar que se bajó todo
git log -1
```

### Paso 3: Reconstruir según lo que cambiaste

**Si tocaste Frontend + Backend + App:**
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

**Si solo tocaste Frontend:**
```bash
docker compose -f docker-compose.prod.yml up -d --build frontend
```

**Si solo tocaste Backend:**
```bash
docker compose -f docker-compose.prod.yml up -d --build backend
```

**Si tocaste Models (Base de Datos):**
```bash
# Paso 1: Migrar
docker exec crm_backend_prod python manage.py migrate

# Paso 2: Reiniciar backend
docker compose -f docker-compose.prod.yml up -d --build backend
```

### Paso 4: Verificar que todo funciona
```bash
# Ver logs en tiempo real
docker compose -f docker-compose.prod.yml logs -f

# Verificar que los contenedores estén corriendo
docker ps

# Probar en navegador
# https://aglogistics.tech
```

### Paso 5: Probar en producción
- [ ] Cargue (botón Precio Especial)
- [ ] Auditoría
- [ ] Ventas Ruta
- [ ] Pedidos
- [ ] Reportes
- [ ] App Móvil (caché offline)

---

## ⚠️ RIESGOS CONOCIDOS

| Módulo | Riesgo | Mitigación |
|--------|--------|------------|
| Backend fechas | Medio | Validar con datos reales antes de subir |
| Botón Precio Especial | Bajo | Solo visual, no afecta lógica |
| Caché offline app | Bajo | Fallback a comportamiento anterior si falla |
| Gestión Rutas | Bajo | Mejora de UX, no cambia lógica |
| Reportes Avanzados | Bajo | Módulo nuevo, aislado |

---

## 📝 NOTAS FINALES

- **App Móvil**: Los cambios de caché son seguros, solo agregan funcionalidad sin modificar existente
- **Frontend Web**: Cambios mayormente visuales/informativos
- **Backend**: Requiere más atención por cambios en lógica de fechas
- **Prioridad**: Validar primero que el problema de Pedidos esté resuelto

---

**Próximo paso**: Decidir qué subir primero y en qué orden.
