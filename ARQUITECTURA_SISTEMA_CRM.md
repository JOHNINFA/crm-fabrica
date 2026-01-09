# 🏗️ ARQUITECTURA DEL SISTEMA CRM FÁBRICA

## 📅 Última actualización: 2026-01-05
## 🎯 Estado: SISTEMA COMPLETO CON IA FUNCIONANDO

---

## 📊 RESUMEN EJECUTIVO

**CRM Fábrica** es un sistema integral de gestión empresarial **con inteligencia artificial** compuesto por:
- **Backend Django REST**: API principal con 50+ endpoints + IA con TensorFlow
- **Frontend React**: 40 páginas con integración de IA en Planeación
- **App Móvil React Native (AP GUERRERO)**: Ventas en ruta, gestión de cargue y rutas
- **Base de Datos PostgreSQL**: 40+ tablas
- **🧠 Sistema de IA**: 5 modelos entrenados + infraestructura para 72 productos

**📱 Para documentación detallada de la app móvil, ver:** `DOCUMENTACION_APP_MOVIL.md`

---

## 🗺️ **MAPA GENERAL DEL SISTEMA**

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND WEB (React)                         │
│  ┌───────────┬───────────┬────────────┬──────────┬──────────┐  │
│  │  Cargue   │    POS    │  Pedidos   │ Inventar │  Turnos  │  │
│  │  (Rutas)  │  (Ventas) │ (Clientes) │   io     │  (Caja)  │  │
│  │           │           │            │ +PLANEA  │          │  │
│  │           │           │            │  +IA🧠   │          │  │
│  └───────────┴───────────┴────────────┴──────────┴──────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                     REST API (HTTP)
                             │
┌────────────────────────────┴────────────────────────────────────┐
│               BACKEND DJANGO (Python)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Views │ Serializers │ Models │ IA Service 🧠       │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
         ┌──────▼─────────┐      ┌───────▼────────────┐
         │  PostgreSQL    │      │  TensorFlow/Keras  │
         │  (40+ Tablas)  │      │  (5 modelos .keras)│
         └────────────────┘      └────────────────────┘
                │
    ┌───────────┴───────────┐
    │                       │
┌───▼──────────┐    ┌───────▼────────┐
│  APP MÓVIL   │    │  Django Mgmt   │
│ AP GUERRERO  │    │  entrenar_ia   │
│ ✅ Ventas    │    │   (comando)    │
│ ✅ Cargue    │    └────────────────┘
│ ✅ Sugerido  │
│ ✅ Rendimien │
│ ✅ Rutas     │
└──────────────┘
```

---

## 🧠 **SISTEMA DE IA (SOLO EN FRONTEND WEB)**

### **⚠️ IMPORTANTE:**
- ✅ La IA está implementada en el **frontend web** (InventarioPlaneacion.jsx)
- ✅ La IA funciona en el **backend** (ia_service.py)
- ❌ La IA **NO está en la app móvil**
- ❌ La app móvil **NO tiene sugerencias automáticas**

### **Componentes Existentes:**

#### **1. Servicio de IA** (`api/services/ia_service.py` - 15KB)
```python
class IAService:
    ✅ obtener_historial_ventas()
       → Extrae datos de CargueID1-6 (ventas netas)
    
    ✅ preparar_datos_para_ml()
       → Features: dia_semana, dia_mes, mes, semana_año, venta_anterior
       → Target: venta del día siguiente
    
    ✅ crear_modelo_neuronal()
       → Arquitectura: Dense(64) → Dropout(0.2) → Dense(32) → 
         Dropout(0.2) → Dense(16) → Dense(1)
       → Optimizador: Adam
       → Loss: MSE, Métrica: MAE
    
    ✅ entrenar_modelo_producto(producto_nombre)
    ✅ cargar_modelo_producto(producto_nombre)
    ✅ predecir_con_red_neuronal(producto, fecha)
    ✅ predecir_produccion(fecha, datos_contextuales)
    ✅ entrenar_todos_los_modelos()
```

#### **2. Modelos Entrenados** (`api/ml_models/`)
```
✅ AREPA_MEDIANA_330Gr.keras (70KB) + _scaler.pkl
✅ AREPA_QUESO_CORRIENTE_450Gr.keras + _scaler.pkl
✅ AREPA_QUESO_ESPECIAL_GRANDE_600Gr.keras + _scaler.pkl
✅ AREPA_TIPO_OBLEA_500Gr.keras + _scaler.pkl
✅ AREPA_TIPO_PINCHO_330Gr.keras + _scaler.pkl

Estado: 5 / 72 productos (6.9%)
```

#### **3. Integración Frontend Web** (`InventarioPlaneacion.jsx` - 42KB)
```javascript
✅ Consulta automática de IA al cargar datos
✅ Columna "IA" editable en tabla
✅ Guardar predicciones en BD (campo Planeacion.ia)
✅ Override manual permitido
✅ POST /api/planeacion/prediccion_ia/
```

---

## 📱 **APP MÓVIL - AP GUERRERO**

### **Arquitectura:**
```
React Native + Expo
- 25 archivos
- ~5,000 líneas de código
- 7 pantallas principales
- 16 componentes
- 4 servicios
```

### **Módulos Principales:**

#### **1. VENTAS** ✅
- **Función:** Registrar ventas en ruta cliente por cliente
- **Escritura:** POST /api/ventas-ruta/
- **Lectura:** GET /api/productos/, GET /api/clientes-ruta/
- **Características:**
  - Selección de cliente (desde rutas o búsqueda)
  - Carrito de productos
  - Métodos de pago: EFECTIVO, NEQUI, DAVIPLATA
  - Impresión de tickets Bluetooth
  - Sincronización en tiempo real → CargueIDX.vendidas

#### **2. CARGUE** ✅
- **Función:** Consultar cargue del día y marcar recepción
- **Escritura:** POST /api/actualizar-check-vendedor/ (solo checks "V")
- **Lectura:** GET /api/obtener-cargue/
- **Características:**
  - Muestra cantidades despachadas (solo lectura)
  - Marcar check "V" (Vendedor) al recibir productos
  - Check "D" (Despachador) viene del CRM (solo lectura)
  - Validaciones: Solo marcar V si D=✓ y cantidad>0
- **⚠️ NO permite crear/editar cantidades**

#### **3. SUGERIDO** ✅ (Nombre confuso)
- **Función:** Vendedor crea su cargue MANUALMENTE
- **Escritura:** POST /api/guardar-sugerido/
- **Características:**
  - Vendedor selecciona día y fecha
  - Ingresa cantidades que necesita (MANUAL)
  - Envía solicitud al backend
  - Backend crea registros en CargueIDX
  - Previene duplicados (unique: dia+fecha+producto)
- **❌ NO ES IA - NO hay sugerencias automáticas**
- **⚠️ Debería llamarse "Solicitar Cargue"**

#### **4. RENDIMIENTO** ✅ (Ver Vencidas.js)
- **Función:** Ver estadísticas de cargue (solo lectura)
- **Lectura:** GET /api/rendimiento-cargue/
- **Muestra:** Vencidas, Devoluciones, Total por producto
- **❌ NO registra vencidas, solo consulta**

#### **5. RUTAS** ✅
- **Función:** Gestionar clientes por rutas y días
- **Lectura:** GET /api/rutas/, GET /api/clientes-ruta/
- **Flujo:** InicioRutas → SeleccionarRuta → SeleccionarDia → ListaClientes
- **Integración:** Botón "VENDER" abre VentasScreen con cliente pre-cargado

### **Servicios de la App:**
- `ventasService.js` (23KB) - Cache de productos, ventas
- `rutasApiService.js` (5.8KB) - Rutas y clientes
- `printerService.js` (7.4KB) - Impresión Bluetooth  
- `sheetsService.js` (2.5KB) - Backend integration

**📱 Ver documentación completa en:** `DOCUMENTACION_APP_MOVIL.md`

---

## 🔄 **FLUJO DIARIO COMPLETO**

```
DÍA ANTERIOR (Noche):
┌─────────────────────────────────────────────┐
│ 1. PLANEACIÓN (WEB + IA)                    │
│    - Usuario abre InventarioPlaneacion      │
│    - IA predice cantidades (redes neuronal) │
│    - Usuario ve campo "IA" en tabla         │
│    - Puede aceptar o ajustar manualmente    │
│    - Se guarda en Planeacion.ia            │
│                                              │
│ 2. SUGERIDO (APP MÓVIL)                     │
│    - Vendedor abre módulo "Sugerido"        │
│    - Ingresa cantidades MANUALMENTE         │
│    - POST /api/guardar-sugerido/            │
│    - Crea registros en CargueIDX            │
└─────────────────────────────────────────────┘

DÍA N (Madrugada):
┌─────────────────────────────────────────────┐
│ 3. PRODUCCIÓN (WEB)                         │
│    - Fabricar según planeación              │
│    - Asignar lotes de producción            │
│    - Actualizar stock                       │
└─────────────────────────────────────────────┘

DÍA N (Mañana):
┌─────────────────────────────────────────────┐
│ 4. CARGUE/DESPACHO (WEB)                    │
│    - Revisar "Sugeridos" de vendedores      │
│    - Ajustar cantidades según producción    │
│    - Asignar lotes a cada producto          │
│    - Marcar check "D" (Despachador)         │
│                                              │
│ 5. RECEPCIÓN (APP MÓVIL)                    │
│    - Vendedor abre módulo "Cargue"          │
│    - GET /api/obtener-cargue/               │
│    - Ve cantidades despachadas              │
│    - Marca check "V" al recibir             │
└─────────────────────────────────────────────┘

DÍA N (Durante el día):
┌─────────────────────────────────────────────┐
│ 6. VENTAS (APP MÓVIL)                       │
│    - Vendedor usa módulo "Rutas"            │
│    - Selecciona clientes en orden           │
│    - Registra ventas con "Ventas"           │
│    - POST /api/ventas-ruta/                 │
│    - Sincronización → CargueIDX.vendidas    │
│                                              │
│ 7. MONITOREO (WEB)                          │
│    - GET /api/cargue/ventas-tiempo-real/    │
│    - Ver ventas en tiempo real              │
└─────────────────────────────────────────────┘

DÍA N (Noche):
┌─────────────────────────────────────────────┐
│ 8. CIERRE (WEB - BotonLimpiar)              │
│    - Actualizar vendidas (de app)           │
│    - Registrar vencidas con lotes           │
│    - Registrar devoluciones                 │
│    - Calcular descuentos/adicionales        │
│    - Registrar pagos                        │
│    - Afectar inventario                     │
│    - Estado: COMPLETADO                     │
└─────────────────────────────────────────────┘
```

---

## 🛡️ **ZONAS CRÍTICAS - NO TOCAR**

### **Métodos save() Automáticos:**
- ❌ `Producto.save()` → Crea/actualiza Stock
- ❌ `MovimientoInventario.save()` → Actualiza stock_total
- ❌ `DetalleVenta.save()` → Crea MovimientoInventario
- ❌ `CargueID1-6.save()` → Calcula total automáticamente

### **Endpoints de Sincronización:**
- ❌ `/api/cargue/ventas-tiempo-real/` → App ↔ Web
- ❌ `/api/cargue/cerrar-turno/` → Cierre de día

### **Tablas con unique_together:**
- ⚠️ `CargueID1-6`: ['dia', 'fecha', 'producto']
- ⚠️ `Planeacion`: ['fecha', 'producto_nombre']

---

## 📋 **DOCUMENTOS DE REFERENCIA**

1. **ARQUITECTURA_SISTEMA_CRM.md** (este archivo)
   - Resumen general del sistema
   - Mapa de arquitectura
   - Sistema de IA (backend + frontend web)
   - Resumen de app móvil

2. **DOCUMENTACION_APP_MOVIL.md**
   - Arquitectura completa de la app
   - Cada módulo explicado en detalle
   - Flujos de navegación
   - Servicios y endpoints
   - Flujo diario desde la app

3. **PLAN_INTEGRACION_IA.md**
   - Estado actual de IA (5 modelos)
   - Plan de mejora (entrenar 67 restantes)
   - Tracking de precisión
   - Panel de administración

4. **RESUMEN_ANALISIS.md**
   - Resumen ejecutivo
   - Métricas del sistema
   - Próximos pasos
   - Guía de seguridad

---

## ✅ **ESTADO ACTUAL**

### **Completamente Implementado:**
- [x] Backend Django con API REST
- [x] Frontend React con 40 páginas
- [x] App Móvil funcional (5 módulos)
- [x] Sistema de Cargue (6 vendedores)
- [x] POS completo
- [x] Pedidos y Clientes
- [x] Turnos y Arqueo de Caja
- [x] **Servicio de IA** (backend)
- [x] **5 modelos entrenados**
- [x] **Endpoint de predicción**
- [x] **Integración IA en Planeación WEB**
- [x] **Comando `entrenar_ia`**

### **Pendiente (Mejoras):**
- [ ] Entrenar 67 modelos restantes
- [ ] Panel de administración IA
- [ ] Tabla `IAPrediccion` (tracking)
- [ ] Reentrenamiento automático

---

## 🎯 **ACLARACIONES IMPORTANTES**

1. **IA solo en WEB**: La inteligencia artificial está implementada ÚNICAMENTE en el frontend web (Planeación). La app móvil NO tiene IA.

2. **"Sugerido" en App**: El módulo "Sugerido" de la app NO usa IA. El vendedor ingresa cantidades MANUALMENTE para crear su cargue.

3. **Sincronización App ↔ Web**: Las ventas registradas en la app se sincronizan en tiempo real con el cargue en la web.

4. **Checks V y D**: 
   - Check "D" (Despachador): Solo se marca en web
   - Check "V" (Vendedor): Solo se marca en app (cuando recibe productos)

---

**FIN - ARQUITECTURA COMPLETA Y VERIFICADA** ✅
**Versión:** 3.0 (Corregida con app móvil documentada)
**Fecha:** 2026-01-05
