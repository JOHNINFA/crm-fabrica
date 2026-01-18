# 📊 GUÍA IMPLEMENTACIÓN: REPORTES AVANZADOS

**Fecha:** 17 de enero de 2026  
**Módulo:** Frontend - Reportes Avanzados  
**Ubicación:** `frontend/src/pages/ReportesAvanzadosScreen.jsx`

---

## ✅ PROGRESO

### **Completado:**
- ✅ Menú principal actualizado con 6 reportes (Planeación + 5 nuevos)
- ✅ Estructura base del componente lista

### **Pendiente:**
- ⏳ Implementar vistas individuales de cada reporte
- ⏳ Crear endpoints en backend
- ⏳ Conectar frontend con backend

---

## 🎯 ESTRUCTURA DE IMPLEMENTACIÓN

### **Archivo Principal:**
`frontend/src/pages/ReportesAvanzadosScreen.jsx`

### **Método Actual:**
```javascript
const [vistaActual, setVistaActual] = useState('menu');

// Vistas disponibles:
// - 'menu' → Menú principal ✅
// - 'planeacion' → Planeación (ya existe) ✅
// - 'pedidos-ruta' → 🆕 Por implementar
// - 'pedidos-transportadora' → 🆕 Por implementar
// - 'estado-entregas' → 🆕 Por implementar
// - 'devoluciones' → 🆕 Por implementar
// - 'reportes-vendedores' → 🆕 Por implementar
```

---

## 📋 REPORTES A IMPLEMENTAR

### **1. Pedidos por Ruta** 📊
**Vista:** `pedidos-ruta`

**Datos a mostrar:**
- Tabla agrupada por ruta
- Filtros: Fecha inicio/fin, Vendedor, Estado
- Columnas: Ruta, Vendedor, Total Pedidos, Monto Total, Estado
- Gráfica: Barras por ruta

**Endpoint backend:**
```python
GET /api/reportes/pedidos-ruta/?fecha_inicio=2026-01-01&fecha_fin=2026-01-17&vendedor=ID1
```

**Respuesta:**
```json
{
  "pedidos": [
    {
      "ruta_nombre": "Ruta Centro",
      "vendedor_nombre": "Juan Pérez",
      "total_pedidos": 25,
      "monto_total": 1500000,
      "estado": "Entregado"
    }
  ],
  "totales": {
    "pedidos": 100,
    "monto": 6000000
  }
}
```

---

### **2. Pedidos por Transportadora** 🚚
**Vista:** `pedidos-transportadora`

**Datos a mostrar:**
- Tabla agrupada por transportadora
- Filtros: Fecha, Transportadora, Estado
- Columnas: Transportadora, En Ruta, Entregados, Pendientes, Total
- Gráfica: Dona de estados

**Endpoint backend:**
```python
GET /api/reportes/pedidos-transportadora/?fecha=2026-01-17
```

**Respuesta:**
```json
{
  "transportadoras": [
    {
      "nombre": "TCC",
      "en_ruta": 15,
      "entregados": 45,
      "pendientes": 5,
      "total": 65
    },
    {
      "nombre": "Servientrega",
      "en_ruta": 8,
      "entregados": 32,
      "pendientes": 3,
      "total": 43
    }
  ]
}
```

---

### **3. Estado de Entregas** 📦
**Vista:** `estado-entregas`

**Datos a mostrar:**
- Dashboard con métricas grandes
- Filtros: Rango de fechas
- Métricas: Entregados, Pendientes, No Entregados, Devoluciones
- Gráfica: Tendencias últimos 30 días
- Alertas: Pedidos > 3 días

**Endpoint backend:**
```python
GET /api/reportes/estado-entregas/?fecha_inicio=2026-01-01&fecha_fin=2026-01-17
```

**Respuesta:**
```json
{
  "metricas": {
    "entregados": 450,
    "pendientes": 23,
    "no_entregados": 5,
    "devoluciones": 12
  },
  "tendencias": [
    {"fecha": "2026-01-01", "entregados": 15, "pendientes": 3},
    {"fecha": "2026-01-02", "entregados": 18, "pendientes": 2}
  ],
  "alertas": [
    {"pedido_id": 123, "cliente": "Tienda Sol", "dias_atraso": 5}
  ]
}
```

---

### **4. Devoluciones** ↩️
**Vista:** `devoluciones`

**Datos a mostrar:**
- Tabla de devoluciones
- Filtros: Rango de fechas, Motivo
- Columnas: Pedido, Cliente, Producto, Cantidad, Motivo, Fecha
- Gráficas:  
  - Top 10 productos devueltos
  - Motivos de devolución (dona)
  - Tendencia mensual

**Endpoint backend:**
```python
GET /api/reportes/devoluciones/?fecha_inicio=2026-01-01&fecha_fin=2026-01-17
```

**Respuesta:**
```json
{
  "devoluciones": [
    {
      "pedido_id": 456,
      "cliente": "Tienda Luna",
      "producto": "Arepa Mediana",
      "cantidad": 10,
      "motivo": "Producto vencido",
      "fecha": "2026-01-15"
    }
  ],
  "top_productos": [
    {"producto": "Arepa Queso", "cantidad": 45},
    {"producto": "Almojabanas", "cantidad": 32}
  ],
  "motivos": [
    {"motivo": "Producto vencido", "cantidad": 30},
    {"motivo": "Daño en empaque", "cantidad": 15}
  ]
}
```

---

### **5. Reportes de Vendedores** 👥
**Vista:** `reportes-vendedores`

**Datos a mostrar:**
- Selector de periodo: Día/Semana/Mes/Año
- Tabla comparativa de vendedores
- Columnas: Vendedor, Ventas, Vencidas, Devoluciones, Efectividad (%)
- Gráficas:
  - Barras comparativas de ventas
  - Ranking de vendedores
  - Efectividad de entregas

**Endpoint backend:**
```python
GET /api/reportes/vendedores/?periodo=mes&fecha_inicio=2026-01-01&fecha_fin=2026-01-31
```

**Respuesta:**
```json
{
  "vendedores": [
    {
      "id": "ID1",
      "nombre": "Juan Pérez",
      "ventas_totales": 150,
      "monto": 9000000,
      "vencidas": 5,
      "devoluciones": 2,
      "efectividad": 96.5
    },
    {
      "id": "ID2",
      "nombre": "María López",
      "ventas_totales": 130,
      "monto": 7800000,
      "vencidas": 3,
      "devoluciones": 1,
      "efectividad": 98.5
    }
  ],
  "comparativa": {
    "mejor_vendedor": "ID2",
    "promedio_ventas": 140
  }
}
```

---

## 🔧 PATRÓN DE IMPLEMENTACIÓN

### **Estructura de cada vista:**

```javascript
// EJEMPLO: Pedidos por Ruta
if (vistaActual === 'pedidos-ruta') {
    return (
        <div className="reportes-screen">
            {/* Header */}
            <div className="header-dark">
                <Container>
                    <div className="d-flex align-items-center justify-content-center py-4">
                        <h5 className="mb-0 d-flex align-items-center">
                            <i className="bi bi-signpost-2 me-2" style={{ fontSize: '1.5rem' }}></i>
                            Pedidos por Ruta
                        </h5>
                    </div>
                </Container>
            </div>

            {/* Contenido */}
            <Container className="py-4">
                {/* Botón volver */}
                <div className="mb-4">
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setVistaActual('menu');
                            // Reset state
                        }}
                        className="link-volver"
                    >
                        <i className="bi bi-arrow-left me-1"></i>
                        Volver al Menú
                    </a>
                </div>

                {/* Filtros */}
                <div className="card-wrapper mb-4">
                    <Row className="g-2">
                        <Col md={4}>
                            <Form.Control
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                size="sm"
                            />
                        </Col>
                        <Col md={4}>
                            <Form.Control
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                size="sm"
                            />
                        </Col>
                        <Col md={4}>
                            <Button
                                variant="primary"
                                size="sm"
                                className="w-100"
                                onClick={handleConsultar}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Buscando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-search me-2"></i>
                                        Consultar
                                    </>
                                )}
                            </Button>
                        </Col>
                    </Row>
                </div>

                {/* Error */}
                {error && (
                    <Alert variant="warning" className="mb-4">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </Alert>
                )}

                {/* Resultados - Tabla */}
                {data.length > 0 && (
                    <div className="card-wrapper">
                        <div className="table-responsive">
                            <Table hover className="table-modern">
                                <thead>
                                    <tr>
                                        <th>Ruta</th>
                                        <th>Vendedor</th>
                                        <th className="text-center">Pedidos</th>
                                        <th className="text-end">Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.ruta_nombre}</td>
                                            <td>{item.vendedor_nombre}</td>
                                            <td className="text-center">
                                                <span className="badge-pill bg-primary">
                                                    {item.total_pedidos}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                ${item.monto_total.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* Mensaje vacío */}
                {!loading && data.length === 0 && searched && (
                    <div className="empty-state">
                        <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mb-0 mt-3">
                            No se encontraron pedidos para el rango seleccionado
                        </p>
                    </div>
                )}
            </Container>
        </div>
    );
}
```

---

## 🚀 PRÓXIMOS PASOS

### **Implementación Frontend:**
1. Agregar estados para cada reporte
2. Crear funciones fetch para cada endpoint
3. Implementar vistas con tablas y gráficas
4. Agregar manejo de errores y loading

### **Implementación Backend:**
1. Crear endpoints en `api/views.py`
2. Optimizar consultas con agregaciones Django
3. Implementar paginación
4. Agregar permisos y validaciones

---

**Archivo actualizado:** `frontend/src/pages/ReportesAvanzadosScreen.jsx` ✅  
**Menú principal:** ✅ Completado  
**Vistas individuales:** ⏳ Por implementar (código de ejemplo arriba)

**Nota:** Puedes implementar un reporte a la vez,  probarlo, y continuar con el siguiente.
