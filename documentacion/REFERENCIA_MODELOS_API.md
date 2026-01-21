# 📖 REFERENCIA COMPLETA - MODELOS Y API

## 📅 Fecha: 2026-01-05
## 🎯 Propósito: Documentación técnica detallada

---

## 🗄️ **MODELOS DE BASE DE DATOS (40+ tablas)**

### **1. PRODUCTOS E INVENTARIO**

#### **Categoria**
```python
Campos:
- nombre: CharField(max_length=100, unique=True)

Relaciones:
- productos: Reverse FK (Producto.categoria)
```

#### **Producto** ⭐ MODELO PRINCIPAL
```python
Campos:
- nombre: CharField(max_length=255, unique=True)
- descripcion: TextField(blank=True, null=True)
- precio: DecimalField(max_digits=10, decimal_places=2, default=0)
- precio_compra: DecimalField
- precio_cargue: DecimalField  # Precio para Cargue y App
- stock_total: IntegerField(default=0)
- codigo_barras: CharField(max_length=100)
- marca: CharField(max_length=100, default="GENERICA")
- impuesto: CharField(max_length=20, default="IVA(0%)")
- orden: IntegerField(default=0, db_index=True)  # Ordenamiento personalizado
- ubicacion_inventario: CharField  # PRODUCCION | MAQUILA
- imagen: ImageField(upload_to='productos/')
- activo: BooleanField(default=True)
- fecha_creacion: DateTimeField

# Disponibilidad por módulo (CRM Web):
- disponible_pos: BooleanField(default=True)
- disponible_cargue: BooleanField(default=True)
- disponible_pedidos: BooleanField(default=True)
- disponible_inventario: BooleanField(default=True)

# Disponibilidad por módulo (App Móvil):
- disponible_app_cargue: BooleanField(default=True)
- disponible_app_sugeridos: BooleanField(default=True)
- disponible_app_rendimiento: BooleanField(default=True)
- disponible_app_ventas: BooleanField(default=True)

Relaciones:
- categoria: ForeignKey(Categoria, SET_NULL, null=True)
- stock: OneToOne reverse (Stock.producto)
- movimientos: Reverse FK (MovimientoInventario.producto)
- lotes: Reverse FK (Lote.producto)

⚠️ CRÍTICO - save():
- AUTO-CREA Stock al crear Producto nuevo
- AUTO-ACTUALIZA Stock.cantidad_actual al modificar stock_total
- Elimina imágenes antiguas al actualizar/borrar

Ordering: ['orden', 'id']
```

#### **Stock** (Quantity actual en tiempo real)
```python
Campos:
- producto: OneToOneField(Producto, primary_key=True)
- cantidad_actual: IntegerField(default=0)
- fecha_actualizacion: DateTimeField(auto_now=True)

⚠️ CRÍTICO:
- Es la fuente de verdad del inventario actual
- Se actualiza automáticamente desde MovimientoInventario
- No editar directamente, usar MovimientoInventario
```

#### **Lote** (Trazabilidad de producción)
```python
Campos:
- lote: CharField(max_length=100, unique=True)
- producto: ForeignKey(Producto, SET_NULL, null=True)
- cantidad_inicial: IntegerField(default=0)
- cantidad_actual: IntegerField(default=0)
- fecha_produccion: DateField()
- fecha_vencimiento: DateField()
- usuario: CharField(max_length=100)
- fecha_creacion: DateTimeField

Usos:
- Trazabilidad de productos por lote
- Control de vencimientos
- Asignación en Cargue
```

#### **MovimientoInventario** ⚠️ CRÍTICO
```python
Campos:
- producto: ForeignKey(Producto, CASCADE)
- lote: ForeignKey(Lote, SET_NULL, null=True, blank=True)
- tipo: CharField  # ENTRADA, SALIDA, AJUSTE
- cantidad: IntegerField()
- usuario: CharField(max_length=100)
- nota: TextField(blank=True, null=True)
- fecha: DateTimeField(auto_now_add=True)

⚠️ CRÍTICO - save():
- AUTO-ACTUALIZA Producto.stock_total
- AUTO-ACTUALIZA Stock.cantidad_actual
- AUTO-ACTUALIZA Lote.cantidad_actual (si aplica)
- ENTRADA: Suma
- SALIDA: Resta
- AJUSTE: Reemplaza

NO editar stock directamente, siempre usar MovimientoInventario
```

---

### **2. VENTAS (POS)**

#### **Venta**
```python
Campos:
- numero_factura: CharField(max_length=50, unique=True)
- cliente: CharField(max_length=255, default="CONSUMIDOR FINAL")
- vendedor: CharField(max_length=255)
- fecha: DateTimeField(auto_now_add=True)
- subtotal: DecimalField(max_digits=12, decimal_places=2)
- impuesto: DecimalField
- descuento: DecimalField
- total: DecimalField(max_digits=12, decimal_places=2)
- metodo_pago: CharField  # EFECTIVO, TARJETA, NEQUI, QR, etc.
- dinero_entregado: DecimalField
- cambio: DecimalField

Relaciones:
- detalles: Reverse FK (DetalleVenta.venta)

Comportamiento:
- numero_factura se genera automáticamente (F-XXXXXX)
```

#### **DetalleVenta** ⚠️ CRÍTICO
```python
Campos:
- venta: ForeignKey(Venta, CASCADE)
- producto: ForeignKey(Producto, SET_NULL, null=True)
- producto_nombre: CharField(max_length=255)
- cantidad: IntegerField()
- precio_unitario: DecimalField
- subtotal: DecimalField

⚠️ CRÍTICO - save():
- AUTO-CREA MovimientoInventario tipo SALIDA
- Esto AUTO-DESCUENTA stock_total del Producto
- No revertir manualmente, anular la venta
```

---

### **3. CLIENTES**

#### **Cliente**
```python
Campos:
- nombre: CharField(max_length=255, blank=True, null= True)
- nombre_contacto: CharField(max_length=255)
- nombre_negocio: CharField(max_length=255)
- direccion: TextField
- telefono: CharField(max_length=20)
- celular: CharField(max_length=20, blank=True, null=True)
- correo: EmailField(blank=True, null=True)
- lista_precio: ForeignKey(ListaPrecio, SET_NULL, null=True)
- identificacion: CharField(unique=True)
- tipo_identificacion: CharField  # CC, NIT, CE
- tipo_cliente: CharField  # CONSUMIDOR_FINAL, CLIENTE
- fecha_creacion: DateTimeField
- notas: TextField

# Campos Ruta:
- esDeRuta: BooleanField(default=False)
- dia_visita: CharField  # LUNES, MARTES, etc.
- orden_visita: IntegerField(default=0)
- vendedor_asignado: CharField

Usos:
- Clientes de POS y Pedidos
- Clientes de rutas (app móvil)
- Asignación de lista de precios
```

#### **ListaPrecio**
```python
Campos:
- nombre: CharField(max_length=100, unique=True)
- descripcion: TextField
- activa: BooleanField(default=True)

Relaciones:
- precios: Reverse FK (PrecioProducto.lista)
- clientes: Reverse FK (Cliente.lista_precio)

Notas:
- Lista "CLIENTES" actualiza Producto.precio (comportamiento especial)
```

#### **PrecioProducto**
```python
Campos:
- lista: ForeignKey(ListaPrecio, CASCADE)
- producto: ForeignKey(Producto, CASCADE)
- precio: DecimalField(max_digits=10, decimal_places=2)

Unique Together: ['lista', 'producto']
```

---

### **4. CARGUE (6 VENDEDORES)** ⚠️ CRÍTICO

**Nota:** Hay 6 tablas idénticas: `CargueID1`, `CargueID2`, ..., `CargueID6`

#### **CargueID1** (y ID2-ID6 - idénticos)
```python
Campos:
# Identificación:
- dia: CharField(max_length=10)  # LUNES, MARTES, etc.
- fecha: DateField()
- producto: CharField(max_length=255)

# Datos del cargue:
- cantidad: IntegerField(default=0)  # Despachada
- vendidas: IntegerField(default=0)  # De app/real
- devoluciones: IntegerField(default=0)
- vencidas: IntegerField(default=0)
- dctos: IntegerField(default=0)  # Descuentos
- adicional: IntegerField(default=0)
- total: IntegerField(default=0)  # Auto-calculado
- valor: IntegerField(default=0)  # Precio unitario
- neto: IntegerField(default=0)  # total * valor
- responsable: CharField(max_length=100)
- usuario: CharField(max_length=100, default="Sistema")

# Checks de control:
- v: BooleanField(default=False)  # Check Vendedor (app)
- d: BooleanField(default=False)  # Check Despachador (web)

# Lotes (JSON):
- lotes_produccion: JSONField(default=list)
  Formato: [{"lote": "LOTE-xxx", "cantidad": 50}]
  
- lotes_vencidos: JSONField(default=list)
  Formato: [{"lote": "LOTE-xxx", "cantidad": 5, "motivo": "HONGO", "foto_url": "..."}]

# Cumplimiento (checks):
- licencia_transporte: BooleanField(default=False)
- soat: BooleanField(default=False)
- habeas_data: BooleanField(default=False)
- uniforme: BooleanField(default=False)
- higiene: BooleanField(default=False)
- manipulacion_alimentos: BooleanField(default=False)

# Timestamps:
- fecha_creacion: DateTimeField
- fecha_actualizacion: DateTimeField

⚠️ CRÍTICO - save():
- AUTO-CALCULA total = cantidad - dctos + adicional - devoluciones - vencidas
- AUTO-CALCULA neto = total * valor

⚠️ CRÍTICO - Unique Together:
- ['dia', 'fecha', 'producto']
- No puede haber duplicados

Usos:
- Despacho de productos a vendedores
- Sincronización con app móvil
- Cierre de turno vendedores
- Trazabilidad de lotes
```

---

### **5. PLANEACIÓN** (CON IA)

####  **Planeacion** 🧠
```python
Campos:
- fecha: DateField()
- producto_nombre: CharField(max_length=255)
- existencias: IntegerField(default=0)
- solicitadas: IntegerField(default=0)  # Suma de CargueID1-6
- pedidos: IntegerField(default=0)  # Pedidos del día
- total: IntegerField(default=0)  # solicitadas + pedidos
- orden: IntegerField(default=0)  # Orden de producción
- ia: IntegerField(default=0)  # 🧠 PREDICCIÓN IA
- usuario: CharField(max_length=100, default='Sistema')
- fecha_creacion: DateTimeField
- fecha_actualizacion: DateTimeField

⚠️ Unique Together: ['fecha', 'producto_nombre']

Usos:
- Planeación de producción
- Predicciones de IA (campo ia)
- Cálculo de necesidades
- Orden de producción
```

#### **Produccion**
```python
Campos:
- fecha: DateField()
- producto: ForeignKey(Producto, SET_NULL, null=True)
- cantidad: IntegerField()
- lote: CharField(max_length=100)
- usuario: CharField(max_length=100)
- nota: TextField(blank=True, null=True)
- fecha_produccion: DateTimeField
```

---

### **6. PEDIDOS**

#### **Pedido**
```python
Campos:
- numero_pedido: CharField(max_length=50, unique=True)
- vendedor: CharField(max_length=255)
- destinatario: CharField(max_length=255)
- direccion: TextField
- fecha_pedido: DateTimeField
- fecha_entrega: DateField
- tipo_pedido: CharField  # ENTREGA, TRASLADO, DEVOLUCION, MUESTRA
- estado: CharField  # PENDIENTE, EN_TRANSITO, ENTREGADA, ANULADA
- asignado_a: CharField  # ID1-ID6, DOM1, DOM2, NINGUNO
- total: DecimalField
- observaciones: TextField
- afectar_inventario_inmediato: BooleanField(default=False)
- inventario_afectado: BooleanField(default=False)

Relaciones:
- detalles: Reverse FK (DetallePedido.pedido)

Métodos especiales:
- afectar_inventario(): POST /api/pedidos/{id}/afectar_inventario/
- anular(): POST /api/pedidos/{id}/anular/

⚠️ CRÍTICO:
- Si inventario_afectado=True al anular, DEVUELVE stock
```

#### **DetallePedido**
```python
Campos:
- pedido: ForeignKey(Pedido, CASCADE)
- producto: ForeignKey(Producto, SET_NULL, null=True)
- producto_nombre: CharField(max_length=255)
- cantidad: Int egerField()
- precio_unitario: DecimalField
- subtotal: DecimalField
```

---

### **7. TURNOS Y CAJA (POS)**

#### **Cajero**
```python
Campos:
- nombre_usuario: CharField(max_length=50, unique=True)
- nombre_completo: CharField(max_length=200)
- contrasena: CharField(max_length=255)
- sucursal: ForeignKey(Sucursal, SET_NULL, null=True)
- activo: BooleanField(default=True)
- fecha_creacion: DateTimeField
```

#### **Turno** ⚠️ CRÍTICO
```python
Campos:
- cajero: ForeignKey(Cajero, CASCADE)
- sucursal: ForeignKey(Sucursal, SET_NULL, null=True)
- fecha_apertura: DateTimeField
- fecha_cierre: DateTimeField(null=True, blank=True)
- monto_apertura: DecimalField
- monto_cierre: DecimalField(null=True, blank=True)
- estado: CharField  # ABIERTO, CERRADO

⚠️ CRÍTICO:
- Solo puede haber un turno ABIERTO por cajero a la vez
- Debe cerrarse antes de abrir otro
```

#### **ArqueoCaja** ⚠️ CRÍTICO
```python
Campos:
- turno: ForeignKey(Turno, CASCADE)
- cajero: ForeignKey(Cajero, CASCADE)
- fecha: DateTimeField

# Valores del sistema (calculados):
- valores_sistema: JSONField
  Formato: {
    "EFECTIVO": 150000,
    "NEQUI": 50000,
    "DAVIPLATA": 30000,
    "total": 230000
  }

# Valores reales (contados):
- valores_caja: JSONField
  Mismo formato

# Diferencias:
- total_diferencia: DecimalField
- observaciones: TextField

⚠️ CRÍTICO - save():
- AUTO-CALCULA total_diferencia = valores_caja.total - valores_sistema.total
- Usado para cuadre de caja
```

---

### **8. APP MÓVIL**

#### **VentaRuta**
```python
Campos:
- numero_venta: CharField(max_length=50, unique=True)
- vendedor_id: CharField(max_length=50)  # ID1-ID6
- vendedor_nombre: CharField(max_length=255)
- cliente_id: IntegerField(null=True, blank=True)
- cliente_nombre: CharField(max_length=255)
- productos: JSONField
  Formato: [
    {
      "producto_id": 5,
      "nombre": "AREPA MEDIANA 330Gr",
      "cantidad": 10,
      "precio": 3500
    }
  ]
- total: DecimalField
- metodo_pago: CharField  # EFECTIVO, NEQUI, DAVIPLATA
- fecha: DateField()
- hora: TimeField()
- fecha_creacion: DateTimeField

Usos:
- Registrar ventas desde app móvil
- Sincronización con Cargue web
- GET /api/cargue/ventas-tiempo-real/ consulta esta tabla
```

#### **Ruta**
```python
Campos:
- nombre: CharField(max_length=255)
- descripcion: TextField
- vendedor_asignado: CharField(max_length=50)  # ID1-ID6
- activa: BooleanField(default=True)

Relaciones:
- clientes: Reverse FK (Cliente con esDeRuta=True)
```

---

### **9. OTROS MODELOS**

#### **Vendedor**
```python
Campos:
- id_vendedor: CharField(max_length=50, unique=True)  # ID1-ID6
- nombre: CharField(max_length=255)
- telefono: CharField(max_length=20)
- ruta: CharField(max_length=255, blank=True, null=True)
- activo: BooleanField(default=True)
```

#### **Domiciliario**
```python
Campos:
- codigo: CharField(max_length=50, unique=True)  # DOM1, DOM2
- nombre: CharField(max_length=255)
- telefono: CharField(max_length=20)
- activo: BooleanField(default=True)
```

#### **ConfiguracionImpresion**
```python
Campos:
- nombre_negocio: CharField(max_length=200)
- nit: CharField(max_length=50)
- direccion: CharField(max_length=300)
- telefono: CharField(max_length=50)
- correo: EmailField
- mensaje_ticket: TextField
- logo: ImageField(upload_to='logos/')
- tamano_fuente: IntegerField(default=12)
- formato_ticket: CharField(max_length=10)  # 58mm, 80mm
- impresora_predeterminada: CharField(max_length=255)
```

---

## 🔗 **ENDPOINTS API (50+)**

### **AUTENTICACIÓN**
Los endpoints no requieren autenticación actualmente.

---

### **PRODUCTOS** (ViewSet)

```http
GET /api/productos/
Parámetros: ?ubicacion=PRODUCCION|MAQUILA, ?activo=true|false
Response: Lista de productos con todos los campos

POST /api/productos/
Body: {all producto fields}
Response: Producto creado

GET /api/productos/{id}/
Response: Detalle de producto

PATCH /api/productos/{id}/
Body: {campos a actualizar}
Response: Producto actualizado

DELETE /api/productos/{id}/
Response: 204 No Content
```

---

### **STOCK** (ViewSet)

```http
GET /api/stock/
Parámetros: ?ubicacion=PRODUCCION|MAQUILA
Response: [
  {
    "producto_id": 1,
    "producto_nombre": "AREPA MEDIANA 330Gr",
    "producto_descripcion": "",
    "cantidad_actual": 150,
    "fecha_actualizacion": "2026-01-05T10:30:00Z",
    "disponible_inventario": true,
    "orden": 1
  }
]
```

---

### **MOVIMIENTOS INVENTARIO** (ViewSet)

```http
GET /api/movimientos/
Parámetros: ?producto_id=5, ?tipo=ENTRADA|SALIDA|AJUSTE, ?fecha__gte=2026-01-01
Response: Lista de movimientos

POST /api/movimientos/
Body: {
  "producto": 5,
  "lote": 1,  // opcional
  "tipo": "ENTRADA",  // ENTRADA, SALIDA, AJUSTE
  "cantidad": 100,
  "usuario": "Juan",
  "nota": "Producción del día"
}
Response: Movimiento creado
⚠️ AUTO-ACTUALIZA stock_total y Stock.cantidad_actual
```

---

### **VENTAS POS** (ViewSet)

```http
GET /api/ventas/
Parámetros: ?fecha__gte=2026-01-01, ?vendedor=Juan
Response: Lista de ventas

POST /api/ventas/
Body: {
  "cliente": "CONSUMIDOR FINAL",
  "vendedor": "Cajero1",
  "subtotal": 35000,
  "total": 35000,
  "metodo_pago": "EFECTIVO",
  "dinero_entregado": 50000,
  "detalles": [
    {
      "producto": 5,
      "producto_nombre": "AREPA MEDIANA 330Gr",
      "cantidad": 10,
      "precio_unitario": 3500
    }
  ]
}
Response: Venta creada
⚠️ AUTO-DESCUENTA stock por cada detalle
```

---

### **CARGUE** (ViewSets ID1-ID6)

```http
GET /api/cargue-id1/?fecha=2026-01-05&dia=LUNES
Response: Lista de productos del cargue

POST /api/cargue-id1/
Body: {
  "dia": "LUNES",
  "fecha": "2026-01-05",
  "producto": "AREPA MEDIANA 330Gr",
  "cantidad": 100,
  "valor": 3500,
  "responsable": "Juan",
  "lotes_produccion": [
    {"lote": "LOTE-20260105-001", "cantidad": 100}
  ],
  "d": true  // Check despachador
}
Response: Registro creado/actualizado
⚠️ AUTO-CALCULA total y neto

PATCH /api/cargue-id1/{id}/
Body: {campos a actualizar}
Response: Registro actualizado
```

---

### **CARGUE - ENDPOINTS ESPECIALES** (Funciones)

```http
POST /api/guardar-sugerido/
Descripción: App móvil crea cargue manualmente
Body: {
  "vendedor_id": "ID1",
  "dia": "LUNES",
  "fecha": "2026-01-05",
  "productos": [
    {"nombre": "AREPA MEDIANA 330Gr", "cantidad": 100}
  ]
}
Response: { "success": true, "message": "..." }
⚠️ Valida duplicados (dia+fecha+vendedor)

GET /api/obtener-cargue/?vendedor_id=ID1&dia=LUNES&fecha=2026-01-05
Descripción: App móvil consulta su cargue
Response: {
  "AREPA MEDIANA 330Gr": {
    "quantity": 100,
    "v": false,  // Check vendedor
    "d": true    // Check despachador
  }
}

POST /api/actualizar-check-vendedor/
Descripción: App móvil marca check "V"
Body: {
  "vendedor_id": "ID1",
  "dia": "LUNES",
  "fecha": "2026-01-05",
  "producto": "AREPA MEDIANA 330Gr",
  "v": true
}
Response: { "success": true }
⚠️ Solo si D=true y cantidad>0

GET /api/verificar-estado-dia/?vendedor_id=ID1&dia=LUNES&fecha=2026-01-05
Response: {
  "success": true,
  "estado": "DESPACHO",  // SUGERIDO, DESPACHO, COMPLETADO
  "tiene_datos": true,
  "completado": false
}

GET /api/rendimiento-cargue/?dia=LUNES&fecha=2026-01-05
Descripción: App móvil ve rendimiento
Response: {
  "success": true,
  "data": [
    {
      "producto": "AREPA MEDIANA 330Gr",
      "vencidas": 5,
      "devoluciones": 10,
      "total": 100
    }
  ]
}

GET /api/cargue/ventas-tiempo-real/{id_vendedor}/{fecha}/
Descripción: Web consulta ventas de app
Response: {
  "vendedor_id": "ID1",
  "fecha": "2026-01-05",
  "ventas_por_producto": {
    "AREPA MEDIANA 330Gr": 85
  }
}

POST /api/cargue/cerrar-turno/
Descripción: App cierra turno (opcional, web lo hace)
Body: {
  "id_vendedor": "ID1",
  "fecha": "2026-01-05",
  "devoluciones": [...],
  "vencidas": [...]
}
```

---

### **PLANEACIÓN** (ViewSet + Función IA)

```http
GET /api/planeacion/?fecha=2026-01-05
Response: Lista de planeación del día

POST /api/planeacion/
Body: {
  "fecha": "2026-01-05",
  "producto_nombre": "AREPA MEDIANA 330Gr",
  "existencias": 50,
  "solicitadas": 200,
  "pedidos": 100,
  "total": 300,
  "orden": 1,
  "ia": 320,  // 🧠 Predicción IA
  "usuario": "Juan"
}
Response: Planeación creada
⚠️ unique_together: fecha + producto_nombre

🧠 POST /api/planeacion/prediccion_ia/
Descripción: IA predice producción
Body: {
  "fecha": "2026-01-10",
  "datos_contextuales": {
    "AREPA MEDIANA 330Gr": {
      "existencias": 50,
      "solicitadas": 200,
      "pedidos": 100
    }
  }
}
Response: {
  "success": true,
  "predicciones": [
    {
      "producto": "AREPA MEDIANA 330Gr",
      "ia_sugerido": 350,
      "confianza": "IA (Red Neuronal)",
      "detalle": {
        "usa_red_neuronal": true,
        "prediccion_venta": 320,
        "demanda_total": 320,
        "faltante": 270
      }
    }
  ]
}
⚠️ Usa modelos .keras entrenados
```

---

### **PEDIDOS** (ViewSet)

```http
GET /api/pedidos/
Parámetros: ?estado=PENDIENTE, ?vendedor=ID1, ?fecha_entrega=2026-01-05
Response: Lista de pedidos

POST /api/pedidos/
Body: {
  "vendedor": "ID1",
  "destinatario": "Tienda Sol",
  "direccion": "Calle 123",
  "fecha_entrega": "2026-01-05",
  "tipo_pedido": "ENTREGA",
  "asignado_a": "ID1",
  "afectar_inventario_inmediato": true,
  "detalles": [
    {
      "producto": 5,
      "producto_nombre": "AREPA MEDIANA 330Gr",
      "cantidad": 50,
      "precio_unitario": 3500
    }
  ]
}
Response: Pedido creado
⚠️ Si afectar_inventario_inmediato=true, descuenta stock automáticamente

POST /api/pedidos/{id}/afectar_inventario/
Descripción: Afectar stock manualmente
Response: { "success": true }
⚠️ Solo si inventario_afectado=false

POST /api/pedidos/{id}/anular/
Descripción: Anular pedido
Response: { "success": true }
⚠️ Si inventario_afectado=true, DEVUELVE stock
```

---

### **TURNOS** (ViewSet + Funciones)

```http
GET /api/turnos/?cajero={id}&estado=ABIERTO
Response: Lista de turnos

POST /api/turnos/
Body: {
  "cajero": 1,
  "monto_apertura": 50000
}
Response: Turno creado
⚠️ Solo un turno ABIERTO por cajero

PATCH /api/turnos/{id}/
Body: {
  "estado": "CERRADO",
  "monto_cierre": 230000
}
Response: Turno cerrado

🆕 POST /api/turno/verificar/
Body: { "vendedor_id": "ID1" }
Response: {
  "turno_activo": true,
  "turno_id": 5
}

🆕 POST /api/turno/abrir/
Body: {
  "vendedor_id": "ID1",
  "monto_apertura": 50000
}
Response: { "success": true, "turno_id": 6 }

🆕 POST /api/turno/cerrar/
Body: { "turno_id": 6 }
Response: { "success": true }
```

---

### **RUTAS Y VENTAS APP** (ViewSets)

```http
GET /api/rutas/?vendedor_id=ID1
Response: Lista de rutas del vendedor

GET /api/clientes-ruta/?vendedor_id=ID1&dia=LUNES
Response: [
  {
    "id": 123,
    "nombre_contacto": "Juan Pérez",
    "nombre_negocio": "Tienda Sol",
    "direccion": "Calle 123",
    "telefono": "3001234567",
    "dia_visita": "LUNES",
    "orden_visita": 1,
    "esDeRuta": true
  }
]

POST /api/ventas-ruta/
Body: {
  "numero_venta": auto-generado,
  "vendedor_id": "ID1",
  "vendedor_nombre": "Juan",
  "cliente_id": 123,
  "cliente_nombre": "Tienda Sol",
  "productos": [
    {
      "producto_id": 5,
      "nombre": "AREPA MEDIANA 330Gr",
      "cantidad": 10,
      "precio": 3500
    }
  ],
  "total": 35000,
  "metodo_pago": "EFECTIVO",
  "fecha": "2026-01-05",
  "hora": "10:30:00"
}
Response: Venta ruta creada
⚠️ Web consulta estas ventas para actualizar Cargue.vendidas
```

---

### **TRAZABILIDAD** (Funciones)

```http
GET /api/trazabilidad/buscar/?lote=LOTE-20260105-001
Response: {
  "lote": "LOTE-20260105-001",
  "producto": "AREPA MEDIANA 330Gr",
  "fecha_produccion": "2026-01-05",
  "fecha_vencimiento": "2026-01-20",
  "despachos": [
    {
      "id_vendedor": "ID1",
      "cantidad": 50,
      "fecha": "2026-01-05"
    }
  ],
  "vencidas": [
    {
      "id_vendedor": "ID1",
      "cantidad": 5,
      "motivo": "HONGO",
      "foto_url": "/media/vencidos/..."
    }
  ]
}

GET /api/trazabilidad/fecha/?fecha=2026-01-05
Response: Lista de todos los lotes del día

GET /api/trazabilidad/mes/?year=2026&month=1
Response: Consolidado del mes
```

---

## 📊 **RESUMEN RÁPIDO**

### **Modelos Totales: 40+**
- Productos: 4 (Categoria, Producto, Stock, Lote)
- Inventario: 3 (MovimientoInventario, RegistroInventario, Registro)
- Ventas POS: 3 (Venta, DetalleVenta, Cliente)
- Cargue: 10 (CargueID1-6, CargueProductos, CargueResumen, CarguePagos, CargueCumplimiento)
- Planeación: 3 (Planeacion, Produccion, ProduccionSolicitada)
- Pedidos: 2 (Pedido, DetallePedido)
- Turnos/Caja: 7 (Cajero, Turno, VentaCajero, ArqueoCaja, MovimientoCaja, Sucursal, ConfiguracionImpresion)
- App Móvil: 3 (VentaRuta, Ruta, ClienteRuta)
- Otros: 5+ (Vendedor, Domiciliario, ListaPrecio, PrecioProducto, etc.)

### **Endpoints Totales: 50+**
- ViewSets REST: ~30
- Funciones personalizadas: ~20

### **Tablas con save() automático (⚠️ CRÍTICO):**
1. Producto → Auto-crea/actualiza Stock
2. MovimientoInventario → Auto-actualiza stock_total
3. DetalleVenta → Auto-crea MovimientoInventario (descuenta stock)
4. DetallePedido → Auto-crea MovimientoInventario (si afectar=true)
5. CargueID1-6 → Auto-calcula total y neto
6. ArqueoCaja → Auto-calcula total_diferencia

### **Tablas con unique_together (⚠️ CUIDADO):**
1. PrecioProducto: ['lista', 'producto']
2. CargueID1-6: ['dia', 'fecha', 'producto']
3. Planeacion: ['fecha', 'producto_nombre']

---

**FIN - REFERENCIA COMPLETA** ✅  
**Úsalo junto con:** `ARQUITECTURA_SISTEMA_CRM.md`, `DOCUMENTACION_APP_MOVIL.md`
