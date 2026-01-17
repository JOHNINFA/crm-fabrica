# 🔍 ANÁLISIS COMPLETO DEL SISTEMA - CRM FÁBRICA

**Fecha:** 17 de enero de 2026  
**Propósito:** Entender arquitectura actual para implementar sistema multi-dispositivo

---

## 📐 ARQUITECTURA ACTUAL

### **1. BACKEND (Django REST)**
- **Ubicación:** `/api/`
- **Modelos principales:** 40+ tablas en `models.py` (2054 líneas)
- **Vistas:** `views.py` (208,253 bytes)
- **URLs:** 50+ endpoints en `urls.py`

### **2. FRONTEND WEB (React)**
- **Ubicación:** `/frontend/`
- **Páginas:** 40+ componentes
- **Servicios:** Múltiples servicios en `/src/services/`

### **3. APP MÓVIL (React Native + Expo)**
- **Ubicación:** `/AP GUERRERO/`
- **Servicios principales:**
  - `ventasService.js` (661 líneas) - Gestión de ventas y sincronización
  - `rutasApiService.js` - Integración con API  
  - `printerService.js` - Impresión Bluetooth
  - `sheetsService.js` - Integración backend

---

## 🔄 FLUJO DE SINCRONIZACIÓN ACTUAL

### **App Móvil → Backend**

#### **1. Guardar Venta (ventasService.js líneas 505-580)**
```javascript
export const guardarVenta = async (venta) => {
    // 1. Guardar localmente en AsyncStorage
    const nuevaVenta = {
        id: await generarIdVenta(),  // VEN-0001, VEN-0002, etc.
        ...venta,
        sincronizada: false
    };
    await AsyncStorage.setItem('ventas', JSON.stringify(ventas));
    
    // 2. Preparar datos para backend
    const ventaBackend = {
        id_local: nuevaVenta.id,  // ⚠️ CRÍTICO: ID único del dispositivo
        vendedor_id: venta.vendedor_id,
        cliente_nombre: venta.cliente_nombre,
        total: venta.total,
        detalles: venta.productos,
        metodo_pago: venta.metodo_pago,
        fecha: fechaVenta
    };
    
    // 3. Sincronizar en BACKGROUND (no bloquea UI)
    (async () => {
        if (await hayConexion()) {
            try {
                await enviarVentaRuta(ventaBackend);  // POST /api/ventas-ruta/
                // Marcar como sincronizada
            } catch (err) {
                await agregarAColaPendientes(ventaBackend, nuevaVenta.id);
            }
        } else {
            await agregarAColaPendientes(ventaBackend, nuevaVenta.id);
        }
    })();
};
```

#### **2. Cola de Pendientes (líneas 13-164)**
```javascript
// Almacenamiento local
const COLA_PENDIENTES_KEY = 'ventas_pendientes_sync';

// Estructura de cada item en cola:
{
    id: "VEN-0001",
    data: { ...ventaBackend },
    intentos: 0,
    fechaCreacion: "2026-01-17T..."
}

// Sincronización (pull to refresh)
export const sincronizarVentasPendientes = async () => {
    const pendientes = await obtenerVentasPendientes();
    
    for (const venta of pendientes) {
        // ⚠️ DETECCIÓN DE DUPLICADOS
        const existe = await verificarVentaExiste(venta.id, venta.data);
        if (existe) {
            eliminarDeColaPendientes(venta.id);
            continue;
        }
        
        awaitenviarVentaRuta(venta.data);
        eliminarDeColaPendientes(venta.id);
    }
};
```

#### **3. Verificación de Duplicados (líneas 66-101)**
```javascript
const verificarVentaExiste = async (ventaId, ventaData) => {
    // Buscar por coincidencia: cliente + total + fecha
    const response = await fetch(`/api/ventas-ruta/?search=${clienteNombre}`);
    const ventas = await response.json();
    
    return ventas.some(v => {
        const mismoCliente = v.cliente_nombre === ventaData.cliente_nombre;
        const mismoTotal = Math.abs(v.total - ventaData.total) < 1;
        const mismaFecha = v.fecha.includes(fechaVenta);
        return mismoCliente && mismoTotal && mismaFecha;
    });
};
```

### **Backend - Modelo VentaRuta (models.py líneas 1851-1868)**
```python
class VentaRuta(models.Model):
    # ⚠️ ID ÚNICO DEL DISPOSITIVO
    id_local = models.CharField(
        max_length=50, 
        unique=True,  # ✅ Previene duplicados
        null=True, 
        blank=True
    )
    
    vendedor = models.ForeignKey(Vendedor, CASCADE)
    cliente_nombre = models.CharField(max_length=200)
    nombre_negocio = models.CharField(max_length=255)
    fecha = models.DateTimeField(default=timezone.now)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    detalles = models.JSONField(default=list)
    metodo_pago = models.CharField(max_length=50)
    
    # Vencidas
    productos_vencidos = models.JSONField(default=list)
    foto_vencidos = models.ImageField(...)
    
    sincronizado = models.BooleanField(default=False)
```

**⚠️ NOTA:** El campo `id_local` es `unique=True`, lo que **previene duplicados** a nivel de base de datos.

---

## 🚨 PROBLEMAS IDENTIFICADOS

### **1. Colisiones Multi-Dispositivo**

#### **Escenario:**
```
Dispositivo A (Tablet 1):
  - Vendedor ID1 registra venta: VEN-0001
  - Guarda localmente
  - Sin conexión → va a cola

Dispositivo B (Celular):
  - Mismo vendedor ID1 registra otra venta
  - Genera id_local: VEN-0001 (mismo contador!)
  - Intenta sincronizar
  
Resultado:
  ❌ Django rechaza con IntegrityError (id_local duplicado)
  ⚠️ Dispositivo B no puede sincronizar
```

#### **Causa Raíz:**
- Cada dispositivo genera `id_local` independientemente
- Usa contador local: `VEN-${ventas.length + 1}`
- No hay coordinación entre dispositivos
- **Campo `id_local` es `unique=True`**

### **2. Timestamps No Utilizados**

```python
# Modelo VentaRuta tiene estos campos:
fecha_creacion = models.DateTimeField(default=timezone.now)
fecha_actualizacion = models.DateTimeField(auto_now=True)

# ⚠️ PERO: No se usan para bloqueo optimista
# ⚠️ No hay validación de concurrencia
```

### **3. Sin Queue de Procesamiento**

- Todas las peticiones se procesan síncronamente
- Si 3 dispositivos envían al mismo tiempo → 3 requests simultáneos
- Django maneja con transacciones, pero puede causar deadlocks
- No hay retry automático configurado

### **4. Sin Logs de Sincronización**

- No hay trazabilidad de qué dispositivo envió qué
- Difícil debuggear conflictos
- No se registra IP, device_id, user_agent

---

## ✅ ELEMENTOS QUE FUNCIONAN BIEN

### **1. Detección de Duplicados en App**
```javascript
// líneas 66-101 de ventasService.js
verificarVentaExiste(ventaId, ventaData)
// Busca por: cliente + total + fecha
// ✅ Funciona pero no es infalible
```

### **2. Cola de Pendientes**
```javascript
// AsyncStorage: 'ventas_pendientes_sync'
// ✅ Guarda ventas fallidas
// ✅ Reintenta en pull to refresh
// ✅ Incrementa contador de intentos
```

### **3. Constraint de BD**
```python
id_local = models.CharField(..., unique=True)
# ✅ Previene duplicados absolutos
# ⚠️ Pero causa errores en lugar de manejarlos
```

---

## 🎯 ESTRATEGIA DE SOLUCIÓN

### **Fase 1: ID Únicos Reales**
```javascript
// Cambiar de:
const generarIdVenta = async () => {
    const numero = ventas.length + 1;
    return `VEN-${String(numero).padStart(4, '0')}`;
};

// A:
const generarIdVenta = async (vendedorId, dispositivoId) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${vendedorId}-${dispositivoId}-${timestamp}-${random}`;
};
// Ejemplo: "ID1-TABLET1-1737145200000-k3j9x2p1q"
```

### **Fase 2: Bloqueo Optimista**
```python
class VentaRuta(models.Model):
    # ... campos existentes ...
    
    # 🆕 Tracking multi-dispositivo
    dispositivo_id = models.CharField(max_length=100)
    ip_origen = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # 🆕 Timestamps para concurrencia
    server_timestamp = models.DateTimeField(auto_now_add=True)
    ultima_modificacion = models.DateTimeField(auto_now=True)
    version = models.IntegerField(default=1)  # Bloqueo optimista
```

### **Fase 3: Queue con Redis (Opcional para VPS)**
```python
# settings.py
CELERY_BROKER_URL = 'redis://localhost:6379/0'

# tasks.py
@shared_task
def procesar_venta_ruta(venta_data):
    # Procesar venta en background
    # Manejar conflictos
    # Retry automático
```

### **Fase 4: Logs de Sincronización**
```python
class SyncLog(models.Model):
    accion = models.CharField(max_length=50)  # CREATE_VENTA, UPDATE_CARGUE
    modelo = models.CharField(max_length=50)  # VentaRuta, CargueID1
    registro_id = models.IntegerField()
    vendedor = models.ForeignKey(Vendedor)
    dispositivo_id = models.CharField(max_length=100)
    ip_origen = models.GenericIPAddressField()
    exito = models.BooleanField(default=True)
    error_mensaje = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
```

---

## 📊 ENDPOINTS CRÍTICOS (urls.py)

### **Sincronización App ↔ Web**
```python
# Línea 57
router.register(r'ventas-ruta', VentaRutaViewSet, basename='ventas-ruta')
# POST /api/ventas-ruta/  -> Crear venta (⚠️ punto de colisión)
# GET  /api/ventas-ruta/  -> Listar ventas

# Líneas 43-48
router.register(r'cargue-id1', CargueID1ViewSet, ...)
router.register(r'cargue-id2', CargueID2ViewSet, ...)
# ... hasta cargue-id6

# Línea 88
path('cargue/ventas-tiempo-real/<str:id_vendedor>/<str:fecha>/')
# GET -> Consulta ventas desde web

# Línea 90
path('cargue/cerrar-turno/')
# POST -> Cierre de turno (⚠️ crítico)
```

---

## 🔑 CONFIGURACIÓN VPS NECESARIA

### **Para Producción en Hostinger:**
```bash
# 1. Redis (para queue)
sudo apt install redis-server
sudo systemctl enable redis-server

# 2. Celery (worker asíncrono)
pip install celery redis

# 3. Supervisor (mantener celery vivo)
sudo apt install supervisor

# 4. Nginx (proxy reverso)
# Ya configurado probablemente

# 5. PostgreSQL (ya en uso)
# Configurar pool de conexiones
```

---

## 📝 PRÓXIMOS PASOS

1. **Implementar ID únicos con UUID + timestamp**
2. **Agregar campos de tracking multi-dispositivo**
3. **Crear middleware de bloqueo optimista**
4. **Implementar SyncLog para trazabilidad**
5. **Configurar Celery + Redis (opcional pero recomendado)**
6. **Testear con 2-3 dispositivos simultáneos**
7. **Documentar y desplegar en VPS**

---

**FIN DEL ANÁLISIS**
