# 📅 Plan de Trabajo: Módulos de Rutas y Ventas (Web & App)

**Fecha de inicio**: 25 de Noviembre 2025  
**Objetivo**: Migrar la gestión de Rutas y Ventas de Google Sheets (actualmente desconectado) al Backend Django, y crear interfaces de gestión en la Web.

---

## 📊 Situación Actual

1.  **App Móvil (AP GUERRERO)**:
    *   Tiene pantallas para Rutas (`SeleccionarRuta`, `InicioRutas`) y Ventas.
    *   Usa `sheetsService.js` que apunta a una URL de Google Apps Script (actualmente `null`).
    *   No hay persistencia real de rutas ni ventas en el sistema actual.

2.  **Backend (Django)**:
    *   No tiene modelos para `Ruta` ni `ClienteRuta`.
    *   Tiene modelo `Venta` (POS) pero no específico para Rutas.
    *   Tiene modelo `Vendedor` (ID1, ID2...).

3.  **Frontend Web (CRM-Fabrica)**:
    *   No tiene interfaz para gestionar rutas ni ver ventas de ruta.

---

## 🎯 Objetivos del Proyecto

1.  **Gestión de Rutas (Web)**: Permitir al administrador crear rutas, asignar vendedores y agregar clientes con días de visita.
2.  **Sincronización App**: Que la App consuma estas rutas desde Django.
3.  **Registro de Ventas (App)**: Que la App envíe las ventas a Django.
4.  **Dashboard Ventas (Web)**: Ver las ventas realizadas por los vendedores en tiempo real.

---

## 🗓️ Plan de Implementación

### **FASE 1: Backend - Modelos y API** (Estimado: 1.5 - 2 horas)

#### 1.1. Crear Modelos (`api/models.py`)
*   `Ruta`: Nombre, Vendedor asignado.
*   `ClienteRuta`: Relación con Ruta, Nombre, Dirección, Teléfono, Día de visita, Orden.
*   `VentaRuta`: Vendedor, Cliente, Fecha, Total, Detalles (JSON), Método pago.

#### 1.2. Crear Serializers (`api/serializers.py`)
*   Serializers para los nuevos modelos.

#### 1.3. Crear ViewSets (`api/views.py`)
*   `RutaViewSet`: CRUD completo. Endpoint especial para obtener rutas por `vendedor_id`.
*   `ClienteRutaViewSet`: CRUD. Filtros por ruta y día.
*   `VentaRutaViewSet`: Crear venta (desde App), Listar ventas (para Web).

#### 1.4. Registrar URLs (`api/urls.py`)

---

### **FASE 2: Frontend Web - Gestión de Rutas** (Estimado: 2 - 3 horas)

#### 2.1. Crear Servicio (`frontend/src/services/rutasService.js`)
*   Métodos para consumir la API de rutas y clientes.

#### 2.2. Crear Pantalla de Rutas (`frontend/src/pages/RutasScreen.jsx`)
*   Tabla de Rutas existentes.
*   Botón "Nueva Ruta".
*   Modal para Crear/Editar Ruta (Nombre, Vendedor).

#### 2.3. Crear Gestor de Clientes de Ruta
*   Al seleccionar una ruta, mostrar lista de clientes.
*   Permitir agregar clientes, asignarles día (Lunes-Sábado) y orden.
*   Interfaz "Drag & Drop" o simple lista ordenada.

---

### **FASE 3: Frontend Web - Dashboard de Ventas** (Estimado: 1.5 - 2 horas)

#### 3.1. Crear Servicio (`frontend/src/services/ventasRutaService.js`)
*   Métodos para obtener ventas con filtros (fecha, vendedor).

#### 3.2. Crear Pantalla de Reportes (`frontend/src/pages/ReporteVentasRuta.jsx`)
*   Filtros: Fecha Inicio/Fin, Vendedor.
*   Tarjetas de resumen (Total Vendido, Total Pedidos).
*   Tabla detallada de ventas.
*   Modal de detalle de venta (ver productos vendidos).

---

### **FASE 4: App Móvil - Integración** (Estimado: 2 horas)

#### 4.1. Actualizar Servicio (`AP GUERRERO/services/sheetsService.js`)
*   Renombrar a `rutasService.js` (o mantener nombre para compatibilidad).
*   Reemplazar llamadas a Google Sheets por llamadas a la API Django.
    *   `obtenerRutasPorUsuario` -> `GET /api/rutas/?vendedor_id=...`
    *   `obtenerClientesPorRutaYDia` -> `GET /api/clientes-ruta/?ruta=...&dia=...`

#### 4.2. Actualizar Envío de Ventas
*   Identificar dónde se envían las ventas en la App.
*   Redirigir al endpoint `POST /api/ventas-ruta/`.

---

## 🛠️ Detalles Técnicos

### Estructura de Datos Propuesta

**Modelo: Ruta**
```python
class Ruta(models.Model):
    nombre = models.CharField(max_length=100)
    vendedor = models.ForeignKey(Vendedor, on_delete=models.SET_NULL, null=True)
    activo = models.BooleanField(default=True)
```

**Modelo: ClienteRuta**
```python
class ClienteRuta(models.Model):
    ruta = models.ForeignKey(Ruta, related_name='clientes', on_delete=models.CASCADE)
    nombre_negocio = models.CharField(max_length=200)
    direccion = models.CharField(max_length=255, blank=True)
    telefono = models.CharField(max_length=50, blank=True)
    dia_visita = models.CharField(max_length=20) # LUNES, MARTES...
    orden = models.IntegerField(default=0)
```

**Modelo: VentaRuta**
```python
class VentaRuta(models.Model):
    vendedor = models.ForeignKey(Vendedor, on_delete=models.CASCADE)
    cliente_nombre = models.CharField(max_length=200) # Guardamos nombre por si borran el cliente
    fecha = models.DateTimeField(default=timezone.now)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    detalles = models.JSONField() # [{producto: "Arepa", cantidad: 10, precio: 2000}, ...]
```

---

## 🚀 Orden de Ejecución Recomendado

1.  **Backend**: Crear modelos y API (Base fundamental).
2.  **Web Rutas**: Para poder crear datos de prueba.
3.  **App Integración**: Para verificar que lee los datos creados en la web.
4.  **App Ventas**: Enviar una venta de prueba.
5.  **Web Ventas**: Visualizar esa venta en el dashboard.

---

**Nota**: Este plan asume que la App Móvil ya tiene la lógica de UI para mostrar rutas y clientes, y solo necesita cambiar el origen de los datos.

