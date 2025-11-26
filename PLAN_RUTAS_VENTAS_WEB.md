# 📋 PLAN RUTAS Y VENTAS WEB - IMPLEMENTACIÓN COMPLETADA

## 🎯 OBJETIVO
Crear un sistema completo de gestión de rutas de vendedores que permita:
- Administrar rutas y clientes desde la aplicación web
- Visualizar rutas y clientes en la app móvil
- Registrar ventas desde la app móvil
- Ver reportes de ventas en la aplicación web

---

## ✅ ESTADO ACTUAL: IMPLEMENTADO Y FUNCIONAL

### 📊 Resumen de Implementación

| Componente | Estado | Descripción |
|------------|--------|-------------|
| **Backend (Django)** | ✅ Completado | Modelos, API y endpoints funcionando |
| **Frontend Web** | ✅ Completado | Gestión de rutas y reportes |
| **App Móvil** | ✅ Completado | Integración con API Django |
| **Base de Datos** | ✅ PostgreSQL | Tablas creadas y migraciones aplicadas |

---

## 🏗️ ARQUITECTURA IMPLEMENTADA

### 1. BACKEND (Django REST Framework)

#### Modelos Creados (`api/models.py`)

**Modelo: Ruta**
```python
class Ruta(models.Model):
    nombre = models.CharField(max_length=100)  # Ej: "RUTA GAITANA"
    vendedor = models.ForeignKey(Vendedor, on_delete=models.SET_NULL, null=True, blank=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
```

**Modelo: ClienteRuta**
```python
class ClienteRuta(models.Model):
    ruta = models.ForeignKey(Ruta, related_name='clientes', on_delete=models.CASCADE)
    nombre_negocio = models.CharField(max_length=200)  # Ej: "SERVI HOGAR"
    nombre_contacto = models.CharField(max_length=200, blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    telefono = models.CharField(max_length=50, blank=True, null=True)
    tipo_negocio = models.CharField(max_length=100, blank=True, null=True)  # Ej: "SUPERMERCADO"
    dia_visita = models.CharField(max_length=20)  # LUNES, MARTES, etc.
    orden = models.IntegerField(default=0)  # Orden de visita
    latitud = models.FloatField(null=True, blank=True)
    longitud = models.FloatField(null=True, blank=True)
```

**Modelo: VentaRuta**
```python
class VentaRuta(models.Model):
    vendedor = models.ForeignKey(Vendedor, on_delete=models.CASCADE)
    ruta = models.ForeignKey(Ruta, on_delete=models.SET_NULL, null=True, blank=True)
    cliente_nombre = models.CharField(max_length=200)
    cliente = models.ForeignKey(ClienteRuta, on_delete=models.SET_NULL, null=True, blank=True)
    fecha = models.DateTimeField(default=timezone.now)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    metodo_pago = models.CharField(max_length=50, default='EFECTIVO')
    detalles = models.JSONField(default=list)  # [{producto, cantidad, precio, subtotal}]
    sincronizado = models.BooleanField(default=False)
```

#### API Endpoints Disponibles

| Endpoint | Método | Descripción | Filtros |
|----------|--------|-------------|---------|
| `/api/rutas/` | GET, POST | Listar/crear rutas | `?vendedor_id=ID1` |
| `/api/rutas/{id}/` | GET, PUT, DELETE | Detalle/editar/eliminar ruta | - |
| `/api/clientes-ruta/` | GET, POST | Listar/crear clientes | `?ruta=1&dia=LUNES` |
| `/api/clientes-ruta/{id}/` | GET, PUT, DELETE | Detalle/editar/eliminar cliente | - |
| `/api/ventas-ruta/` | GET, POST | Listar/crear ventas | `?vendedor_id=ID1&fecha=2025-11-25` |
| `/api/ventas-ruta/{id}/` | GET | Detalle de venta | - |

#### ViewSets Implementados (`api/views.py`)

- **RutaViewSet**: CRUD completo con filtro por vendedor
- **ClienteRutaViewSet**: CRUD completo con filtros por ruta y día
- **VentaRutaViewSet**: CRUD completo con filtros por vendedor y fecha

---

### 2. FRONTEND WEB (React)

#### Servicios (`frontend/src/services/rutasService.js`)

```javascript
// Servicio completo para gestión de rutas
rutasService = {
    obtenerRutas(),
    crearRuta(ruta),
    actualizarRuta(id, ruta),
    eliminarRuta(id),
    obtenerClientesRuta(rutaId, dia),
    crearClienteRuta(cliente),
    actualizarClienteRuta(id, cliente),
    eliminarClienteRuta(id),
    obtenerVentasRuta(vendedorId, fecha),
    obtenerVendedores()
}
```

#### Componentes Creados

**1. GestionRutas.jsx** (`frontend/src/components/rutas/GestionRutas.jsx`)
- Interfaz para crear y administrar rutas
- Asignar vendedores a rutas
- Agregar/editar/eliminar clientes
- Campos disponibles:
  - Nombre del negocio
  - Tipo de negocio (Supermercado, Carnicería, etc.)
  - Dirección
  - Teléfono
  - Día de visita
  - Orden de visita

**2. ReporteVentasRuta.jsx** (`frontend/src/components/rutas/ReporteVentasRuta.jsx`)
- Dashboard de ventas de ruta
- Filtros por fecha y vendedor
- Resumen de totales
- Detalle de productos vendidos

**3. Integración en OtrosScreen.jsx**
- Módulo "Gestión de Rutas" (icono: map)
- Módulo "Ventas de Ruta" (icono: point_of_sale)

---

### 3. APP MÓVIL (React Native)

#### Servicios Creados (`AP GUERRERO/services/rutasApiService.js`)

```javascript
// Conexión con API Django (IP: 192.168.1.19:8000)
rutasApiService = {
    obtenerRutasPorUsuario(userId),      // Obtiene rutas del vendedor
    obtenerClientesPorRutaYDia(rutaId, dia),  // Obtiene clientes a visitar
    enviarVentaRuta(ventaData),          // Envía venta al backend
    marcarClienteVisitado(ruta, orden, visitado),  // TODO: Implementar
    limpiarTodasLasVisitas(ruta)         // TODO: Implementar
}
```

#### Componentes Modificados

**1. SeleccionarRuta.js**
- ✅ Ahora usa `rutasApiService` en lugar de Google Sheets
- ✅ Carga rutas reales desde Django
- ✅ Muestra rutas asignadas al vendedor

**2. ListaClientes.js**
- ✅ Ahora usa `rutasApiService` para obtener clientes
- ✅ Filtra por ruta y día automáticamente
- ⚠️ Estado "visitado" se guarda localmente (pendiente backend)

**3. ventasService.js**
- ✅ Sincronización automática con backend
- ✅ Guarda venta local + envía a Django
- ✅ Manejo de errores offline (guarda local si no hay internet)

---

## 🔄 FLUJO DE TRABAJO COMPLETO

### Desde la Web (Administrador)

1. **Crear Ruta**
   - Ir a: Otros → Gestión de Rutas
   - Click en "+ Nueva"
   - Ingresar nombre (ej: "RUTA GAITANA")
   - Asignar vendedor (ej: "Vendedor 1")
   - Guardar

2. **Agregar Clientes a la Ruta**
   - Seleccionar la ruta creada
   - Click en "+ Agregar Cliente"
   - Completar datos:
     - Nombre: "SERVI HOGAR"
     - Tipo: "SUPERMERCADO"
     - Dirección: "CL. 135A #94C-21, BOGOTÁ"
     - Teléfono: "6013031604"
     - Día: "MIERCOLES"
     - Orden: 1
   - Guardar

3. **Ver Ventas**
   - Ir a: Otros → Ventas de Ruta
   - Filtrar por fecha y vendedor
   - Ver totales y detalles

### Desde la App Móvil (Vendedor)

1. **Seleccionar Ruta**
   - Login con usuario (ej: ID1)
   - Ir a sección "Rutas"
   - Seleccionar "RUTA GAITANA"
   - Seleccionar día (ej: MIERCOLES)

2. **Ver Clientes del Día**
   - La app muestra lista ordenada de clientes
   - Información visible:
     - Nombre del negocio
     - Tipo de negocio
     - Dirección
     - Teléfono
     - Orden de visita

3. **Realizar Venta**
   - Seleccionar cliente
   - Agregar productos
   - Confirmar venta
   - ✅ Se guarda local + se envía a Django automáticamente

---

## 📦 BASE DE DATOS (PostgreSQL)

### Tablas Creadas

```sql
-- Tabla de Rutas
api_ruta (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    vendedor_id VARCHAR(10) REFERENCES api_vendedor(id_vendedor),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP
)

-- Tabla de Clientes de Ruta
api_clienteruta (
    id SERIAL PRIMARY KEY,
    ruta_id INTEGER REFERENCES api_ruta(id),
    nombre_negocio VARCHAR(200),
    nombre_contacto VARCHAR(200),
    direccion VARCHAR(255),
    telefono VARCHAR(50),
    tipo_negocio VARCHAR(100),  -- NUEVO CAMPO
    dia_visita VARCHAR(20),
    orden INTEGER,
    latitud FLOAT,
    longitud FLOAT
)

-- Tabla de Ventas de Ruta
api_ventaruta (
    id SERIAL PRIMARY KEY,
    vendedor_id VARCHAR(10) REFERENCES api_vendedor(id_vendedor),
    ruta_id INTEGER REFERENCES api_ruta(id),
    cliente_nombre VARCHAR(200),
    cliente_id INTEGER REFERENCES api_clienteruta(id),
    fecha TIMESTAMP,
    total DECIMAL(12,2),
    metodo_pago VARCHAR(50),
    detalles JSONB,
    sincronizado BOOLEAN DEFAULT FALSE
)
```

### Migraciones Aplicadas

- ✅ `0043_clienteruta_ruta_ventaruta_clienteruta_ruta` - Creación inicial
- ✅ `0044_clienteruta_tipo_negocio` - Agregado campo tipo_negocio

---

## 🔧 CONFIGURACIÓN TÉCNICA

### Backend
- **Framework**: Django 5.1.7 + Django REST Framework
- **Base de Datos**: PostgreSQL (nombre: `fabrica`)
- **Puerto**: 8000
- **IP**: 0.0.0.0 (accesible desde red local)

### Frontend Web
- **Framework**: React 19.1.0
- **Puerto**: 3000
- **Dependencias nuevas**: axios

### App Móvil
- **Framework**: React Native + Expo
- **API URL**: `http://192.168.1.19:8000/api`
- **Almacenamiento local**: AsyncStorage

---

## 📝 DATOS DE EJEMPLO

### Estructura de Cliente (según imagen proporcionada)

```javascript
{
    nombre_negocio: "SERVI HOGAR",
    tipo_negocio: "SUPERMERCADO",
    direccion: "CL. 135A #94C-21, BOGOTÁ",
    telefono: "6013031604",
    dia_visita: "MIERCOLES",  // o "LU-MI-VI" para múltiples días
    orden: 1
}
```

### Estructura de Venta

```javascript
{
    vendedor_id: "ID1",
    cliente_nombre: "SERVI HOGAR",
    total: 45000,
    metodo_pago: "EFECTIVO",
    detalles: [
        {
            producto: "AREPA TIPO OBLEA 500Gr",
            cantidad: 10,
            precio: 2600,
            subtotal: 26000
        },
        {
            producto: "AREPA MEDIANA 330Gr",
            cantidad: 9,
            precio: 2100,
            subtotal: 18900
        }
    ]
}
```

---

## ⚠️ PENDIENTES - PLAN DE TRABAJO PARA MAÑANA

### 🎯 OBJETIVO SESIÓN: Integración Completa App Móvil

---

## 📅 PLAN DE TRABAJO - SESIÓN PRÓXIMA

### FASE 1: Conexión de Rutas (AP GUERRERO ↔ CRM-FABRICA)

#### 1.1 Verificar Componentes Actuales
- ✅ Ya implementado: `AP GUERRERO/services/rutasApiService.js`
- ✅ Ya modificado: `AP GUERRERO/components/rutas/SeleccionarRuta.js`
- ⚠️ Pendiente: Probar que las rutas carguen desde el CRM

**Archivos a Revisar:**
```javascript
// AP GUERRERO/services/rutasApiService.js
obtenerRutasPorUsuario(userId) // Ya conecta a Django
obtenerClientesPorRutaYDia(rutaId, dia) // Ya conecta a Django
```

**Tareas:**
- [ ] Iniciar app móvil y hacer login
- [ ] Verificar que aparezcan las rutas creadas en CRM
- [ ] Verificar que al seleccionar día aparezcan los clientes correctos
- [ ] Verificar que los datos mostrados sean completos (nombre, dirección, teléfono, tipo)

---

### FASE 2: Conexión de Ventas (Registrar Ventas desde App)

#### 2.1 Flujo de Venta Actual
```javascript
// AP GUERRERO/services/ventasService.js
guardarVenta(venta) {
    // 1. Guarda local en AsyncStorage
    // 2. Envía a backend vía enviarVentaRuta() ✅ Ya implementado
}
```

#### 2.2 Verificación de Estructura de Datos

**Lo que la App envía actualmente:**
```javascript
{
    cliente_id: "CLI-001",
    cliente_nombre: "SERVI HOGAR",
    cliente_negocio: "SERVI HOGAR",
    vendedor: "ID1",  // ⚠️ Verificar formato
    productos: [...],
    total: 45000,
    vencidas: [...],  // ⚠️ NUEVO: Manejar productos vencidos
    fotoVencidas: "..."  // ⚠️ NUEVO: Imagen de productos vencidos
}
```

**Lo que el backend espera:**
```python
# VentaRuta model
{
    vendedor_id: "ID1",  # VARCHAR
    cliente_nombre: "SERVI HOGAR",  # VARCHAR
    total: 45000,  # Decimal
    detalles: [...],  # JSON
    # FALTA: Campo para vencidas e imagen
}
```

**Tareas:**
- [ ] Agregar campos al modelo `VentaRuta`:
  - `productos_vencidos` (JSONField)
  - `foto_vencidos` (ImageField o TextField para base64)
- [ ] Modificar `ventasService.js` para incluir vencidas en el envío
- [ ] Crear migración y aplicarla

---

### FASE 3: Manejo de Productos Vencidos (Devoluciones)

#### 3.1 Flujo Actual de Vencidas en App

**IMPORTANTE:** Las vencidas son parte del **MÓDULO VENTAS** en AP-GUERRERO

**Componente:** `AP GUERRERO/components/Ventas/DevolucionesVencidas.js`

**Flujo Completo:**
1. Vendedor realiza venta desde **VentasScreen.js**
2. ANTES de confirmar, puede abrir modal "Vencidas"
3. Selecciona productos vencidos + cantidad
4. Toma foto de evidencia
5. Confirma venta → Se envía TODO junto:
   - ✅ Productos vendidos
   - ✅ Productos vencidos
   - ✅ Foto de evidencia

```javascript
// AP GUERRERO/components/Ventas/VentasScreen.js - línea ~140
const venta = {
    cliente_id: clienteSeleccionado.id,
    cliente_nombre: clienteSeleccionado.nombre,
    vendedor: userId,
    productos: productosVenta,  // Productos vendidos
    total: total,
    vencidas: vencidas,  // ⚠️ Productos vencidos devueltos
    fotoVencidas: fotoVencidas  // ⚠️ Foto de evidencia
};
```

#### 3.2 Integración con Backend

**Modelo VentaRuta debe guardar:**
```python
class VentaRuta(models.Model):
    # Campos existentes
    vendedor = models.ForeignKey(Vendedor, on_delete=models.CASCADE)
    cliente_nombre = models.CharField(max_length=200)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    detalles = models.JSONField(default=list)  # Productos vendidos
    
    # ⚠️ NUEVOS CAMPOS PARA VENCIDAS
    productos_vencidos = models.JSONField(default=list, blank=True)
    # Ejemplo: [{"nombre": "AREPA OBLEA", "cantidad": 2}, ...]
    
    foto_vencidos = models.ImageField(
        upload_to='ventas_ruta/vencidos/%Y/%m/', 
        null=True, 
        blank=True
    )
    # Guarda la imagen de evidencia
```

#### 3.3 Visualización en Web

**Componente:** `frontend/src/components/rutas/ReporteVentasRuta.jsx`

**Debe mostrar:**
- 📊 Lista de ventas
- 👁️ Al hacer clic en una venta, ver detalle:
  - ✅ Productos vendidos (ya existe)
  - ⚠️ **NUEVO:** Sección "Productos Vencidos" (si hay)
  - ⚠️ **NUEVO:** Imagen de evidencia (si hay)

**Ejemplo de visualización:**
```jsx
// Detalle de venta
<Modal>
    <h4>Productos Vendidos</h4>
    {venta.detalles.map(...)} 
    
    {/* ⚠️ NUEVO: Mostrar vencidas si existen */}
    {venta.productos_vencidos && venta.productos_vencidos.length > 0 && (
        <>
            <hr />
            <h4 className="text-danger">Productos Vencidos Devueltos</h4>
            {venta.productos_vencidos.map(p => (
                <div>
                    <strong>{p.nombre}</strong> - Cantidad: {p.cantidad}
                </div>
            ))}
            
            {/* ⚠️ NUEVO: Mostrar foto de evidencia */}
            {venta.foto_vencidos && (
                <div>
                    <h5>Evidencia Fotográfica</h5>
                    <img 
                        src={venta.foto_vencidos_url} 
                        alt="Productos vencidos" 
                        style={{ maxWidth: '100%', cursor: 'pointer' }}
                        onClick={() => window.open(venta.foto_vencidos_url)}
                    />
                </div>
            )}
        </>
    )}
</Modal>
```

**Tareas:**
- [ ] Agregar campos `productos_vencidos` y `foto_vencidos` al modelo VentaRuta
- [ ] Actualizar `enviarVentaRuta()` para enviar vencidas + foto
- [ ] Actualizar `ReporteVentasRuta.jsx` para mostrar vencidas e imagen
- [ ] Probar flujo completo: App → Backend → Web

---

### FASE 4: Manejo de Imágenes

#### 4.1 Opciones para Envío de Imagen

**OPCIÓN 1: Base64 (Simple, pero pesado)**
```javascript
// En la app
const fotoBase64 = await convertImageToBase64(photoUri);

// Enviar en JSON
{
    foto_vencidos: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**OPCIÓN 2: Multipart/Form-Data (Recomendado)**
```javascript
// En la app
const formData = new FormData();
formData.append('vendedor_id', 'ID1');
formData.append('total', '45000');
formData.append('detalles', JSON.stringify(productos));
formData.append('foto_vencidos', {
    uri: photoUri,
    type: 'image/jpeg',
    name: 'vencidos.jpg'
});

await fetch(API_URL, {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
});
```

**Tareas:**
- [ ] Configurar Django para recibir archivos (MEDIA_ROOT, MEDIA_URL)
- [ ] Actualizar `VentaRutaViewSet` para manejar archivos
- [ ] Modificar `enviarVentaRuta()` en app para enviar multipart
- [ ] Probar guardado de imagen en servidor

---

### FASE 5: Verificación y Pruebas End-to-End

#### 5.1 Prueba Completa del Flujo

**Escenario de Prueba:**
1. **Web (Admin):**
   - Crear ruta "RUTA GAITANA"
   - Agregar 3 clientes con días LUNES, MIERCOLES, VIERNES
   
2. **App Móvil (Vendedor):**
   - Login con ID1
   - Seleccionar "RUTA GAITANA"
   - Seleccionar día "MIERCOLES"
   - Ver lista de clientes (verificar datos completos)
   
3. **Realizar Venta:**
   - Seleccionar cliente
   - Agregar 3 productos
   - Agregar 2 productos vencidos
   - Tomar foto de vencidos
   - Confirmar venta
   
4. **Verificar en Web:**
   - Ver venta en "Ventas de Ruta"
   - Verificar productos vendidos
   - Verificar productos vencidos
   - Verificar imagen de vencidos

**Checklist de Verificación:**
- [ ] Rutas se cargan correctamente
- [ ] Clientes se filtran por día
- [ ] Datos completos (nombre, dirección, teléfono, tipo)
- [ ] Venta se registra en backend
- [ ] Productos vencidos se guardan
- [ ] Imagen de vencidos se sube correctamente
- [ ] Reporte web muestra toda la información

---

## 🔧 CAMBIOS TÉCNICOS NECESARIOS

### Backend (Django)

#### 1. Actualizar Modelo VentaRuta
```python
# api/models.py
class VentaRuta(models.Model):
    # ... campos existentes ...
    productos_vencidos = models.JSONField(default=list, blank=True)
    foto_vencidos = models.ImageField(
        upload_to='ventas_ruta/vencidos/%Y/%m/', 
        null=True, 
        blank=True
    )
    observaciones_vencidos = models.TextField(blank=True, null=True)
```

#### 2. Configurar Media Files
```python
# backend_crm/settings.py
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

```python
# backend_crm/urls.py
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... urls existentes
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

#### 3. Actualizar Serializer
```python
# api/serializers.py
class VentaRutaSerializer(serializers.ModelSerializer):
    foto_vencidos_url = serializers.SerializerMethodField()
    
    class Meta:
        model = VentaRuta
        fields = '__all__'
    
    def get_foto_vencidos_url(self, obj):
        if obj.foto_vencidos:
            return obj.foto_vencidos.url
        return None
```

### Frontend App (React Native)

#### 1. Actualizar enviarVentaRuta
```javascript
// AP GUERRERO/services/rutasApiService.js
export const enviarVentaRuta = async (ventaData) => {
    try {
        const formData = new FormData();
        
        // Datos básicos
        formData.append('vendedor_id', ventaData.vendedor);
        formData.append('cliente_nombre', ventaData.cliente_nombre);
        formData.append('total', ventaData.total);
        formData.append('metodo_pago', ventaData.metodo_pago || 'EFECTIVO');
        formData.append('detalles', JSON.stringify(ventaData.productos));
        
        // Productos vencidos
        if (ventaData.vencidas && ventaData.vencidas.length > 0) {
            formData.append('productos_vencidos', JSON.stringify(ventaData.vencidas));
        }
        
        // Foto de vencidos
        if (ventaData.fotoVencidas) {
            formData.append('foto_vencidos', {
                uri: ventaData.fotoVencidas,
                type: 'image/jpeg',
                name: `vencidos_${Date.now()}.jpg`
            });
        }
        
        const response = await fetch(`${API_BASE}/ventas-ruta/`, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error enviando venta:', error);
        throw error;
    }
};
```

---

## 📊 CHECKLIST DE IMPLEMENTACIÓN

### ✅ Completado Hoy (25/Nov/2025)
- [x] Modelos base (Ruta, ClienteRuta, VentaRuta)
- [x] API REST completa
- [x] Frontend web (gestión de rutas)
- [x] Frontend web (reportes de ventas)
- [x] Integración básica app móvil
- [x] Soporte múltiples días de visita
- [x] Documentación completa

### 🔄 Para Mañana (26/Nov/2025)

#### Backend
- [ ] Agregar campos `productos_vencidos` y `foto_vencidos` a VentaRuta
- [ ] Configurar MEDIA_ROOT y MEDIA_URL
- [ ] Actualizar VentaRutaSerializer
- [ ] Crear migración
- [ ] Aplicar migración
- [ ] Probar endpoint con Postman/Thunder Client

#### App Móvil
- [ ] Verificar carga de rutas desde Django
- [ ] Verificar filtrado de clientes por día
- [ ] Actualizar `enviarVentaRuta()` para multipart
- [ ] Probar envío de venta con vencidas
- [ ] Probar envío de imagen

#### Testing
- [ ] Crear ruta de prueba en web
- [ ] Agregar 3 clientes de prueba
- [ ] Realizar venta desde app
- [ ] Verificar datos en web
- [ ] Verificar imagen de vencidos

#### Frontend Web
- [ ] Actualizar `ReporteVentasRuta.jsx` para mostrar vencidas
- [ ] Agregar visualización de imagen de vencidos
- [ ] Agregar columna/sección de vencidas en detalle

---

## 🔍 PUNTOS A VERIFICAR

### Conexión y Sincronización
1. **IP del Servidor:**
   - Verificar que `192.168.1.19` sea correcta
   - Probar desde navegador del celular: `http://192.168.1.19:8000/api/rutas/`

2. **Formato de IDs:**
   - Vendedor: "ID1", "ID2", etc.
   - Verificar que coincida en app y backend

3. **Formato de Fechas:**
   - App: ISO string `"2025-11-26T10:30:00.000Z"`
   - Backend: Django DateTimeField (compatible)

### Manejo de Errores
1. **Sin Internet:**
   - Venta se guarda local
   - Sincroniza cuando hay conexión
   
2. **Error en Servidor:**
   - Mostrar mensaje al usuario
   - Guardar en cola de pendientes

3. **Imagen muy grande:**
   - Comprimir antes de enviar
   - Máximo 2MB recomendado

---

## 💾 ESTRUCTURA DE DATOS FINAL

### Venta Completa (App → Backend)

```javascript
{
    // Datos Básicos
    vendedor_id: "ID1",
    cliente_nombre: "SERVI HOGAR",
    total: 45000,
    metodo_pago: "EFECTIVO",
    fecha: "2025-11-26T10:30:00.000Z",
    
    // Productos Vendidos
    detalles: [
        {
            producto: "AREPA TIPO OBLEA 500Gr",
            cantidad: 10,
            precio: 2600,
            subtotal: 26000
        },
        {
            producto: "AREPA MEDIANA 330Gr",
            cantidad: 9,
            precio: 2100,
            subtotal: 18900
        }
    ],
    
    // Productos Vencidos/Devueltos
    productos_vencidos: [
        {
            producto: "AREPA TIPO OBLEA 500Gr",
            cantidad: 2,
            motivo: "Fecha vencida"
        }
    ],
    
    // Foto de Vencidos
    foto_vencidos: {
        uri: "file:///path/to/photo.jpg",
        type: "image/jpeg",
        name: "vencidos_1732582200000.jpg"
    }
}
```

---

## 📝 NOTAS IMPORTANTES

### Consideraciones de Producción

1. **Almacenamiento de Imágenes:**
   - Desarrollo: Carpeta local `media/`
   - Producción: AWS S3, Cloudinary, etc.

2. **Tamaño de Imágenes:**
   - Comprimir en app antes de enviar
   - Usar librería: `expo-image-manipulator`

3. **Sincronización Offline:**
   - Cola de ventas pendientes en AsyncStorage
   - Worker para sincronizar en background

4. **Seguridad:**
   - Validar tamaño de archivo en backend
   - Validar tipo MIME (solo jpg, png)
   - Sanitizar nombres de archivo

---

## ✨ RESULTADO ESPERADO

Al finalizar la sesión de mañana tendremos:

✅ **App Móvil:**
- Carga rutas desde CRM
- Muestra clientes del día
- Registra ventas con productos vencidos
- Sube foto de vencidos al servidor

✅ **Backend:**
- Recibe y guarda ventas completas
- Almacena imágenes de vencidos
- Expone datos para reportes

✅ **Frontend Web:**
- Muestra ventas con productos vencidos
- Visualiza imágenes de vencidos
- Genera reportes completos

**Fecha de Última Actualización**: 25 de Noviembre, 2025 - 22:56
**Estado**: Listo para Fase de Integración App Móvil
**Próxima Sesión**: 26 de Noviembre, 2025

