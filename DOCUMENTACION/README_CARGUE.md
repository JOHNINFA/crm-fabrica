# 📦 Módulo CARGUE (Operativo de Vendedores)

## 📋 Descripción General

El módulo CARGUE es el sistema operativo para vendedores en ruta. Permite registrar productos despachados, devoluciones, vencidas, pagos recibidos y control de cumplimiento. Existen 6 rutas diferentes (ID1-ID6), cada una con su propio formulario.

---

## 🎯 Funcionalidades Principales

1. **Registro de Despacho**
   - Productos entregados
   - Cantidades
   - Descuentos aplicados
   - Productos adicionales

2. **Control de Devoluciones**
   - Productos devueltos por cliente
   - Motivos de devolución
   - Productos vencidos

3. **Registro de Pagos**
   - Efectivo recibido
   - Nequi
   - Daviplata
   - Otros métodos

4. **Control de Cumplimiento**
   - Licencia de transporte
   - SOAT
   - Uniforme
   - Higiene
   - Documentos requeridos

5. **Resumen Operativo**
   - Total de despacho
   - Total de pedidos
   - Total de descuentos
   - Venta neta
   - Efectivo total

---

## 🏗️ Estructura de Componentes Frontend

### Componentes Principales

```
frontend/src/components/Cargue/
├── PlantillaOperativa.jsx      # Pantalla principal
├── MenuSheets.jsx              # Selector de rutas (ID1-ID6)
├── SelectorFecha.jsx           # Selector de fecha
├── RegistroForm.jsx            # Formulario de registro
├── TablaProductos.jsx          # Tabla de productos
├── LotesVencidos.jsx           # Gestión de lotes vencidos
├── ControlCumplimiento.jsx     # Control de cumplimiento
├── ResumenVentas.jsx           # Resumen de ventas
├── ResponsableManager.jsx      # Gestión de responsables
├── BotonSincronizar.jsx        # Sincronización con API
├── BotonCorreccion.jsx         # Corrección de datos
└── VerificarGuardado.jsx       # Verificación de guardado
```

---

## 💾 Modelos de Datos Backend

### Modelo: CargueID1 (y ID2-ID6 similares)
```python
class CargueID1(models.Model):
    # Identificación
    dia = models.CharField(max_length=10)  # LUNES, MARTES, etc.
    fecha = models.DateField()
    
    # Vendedor
    responsable = models.CharField(max_length=100)
    ruta = models.CharField(max_length=100, blank=True)
    
    # Checkboxes
    v = models.BooleanField(default=False)  # Vendedor
    d = models.BooleanField(default=False)  # Despachador
    
    # Productos
    producto = models.CharField(max_length=255)
    cantidad = models.IntegerField(default=0)
    dctos = models.IntegerField(default=0)
    adicional = models.IntegerField(default=0)
    devoluciones = models.IntegerField(default=0)
    vencidas = models.IntegerField(default=0)
    lotes_vencidos = models.TextField(blank=True)  # JSON
    lotes_produccion = models.TextField(blank=True)  # JSON
    total = models.IntegerField(default=0)  # Calculado
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    neto = models.DecimalField(max_digits=12, decimal_places=2)  # Calculado
    
    # Pagos
    concepto = models.CharField(max_length=255, blank=True)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2)
    nequi = models.DecimalField(max_digits=10, decimal_places=2)
    daviplata = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Resumen
    base_caja = models.DecimalField(max_digits=10, decimal_places=2)
    total_despacho = models.DecimalField(max_digits=12, decimal_places=2)
    total_pedidos = models.DecimalField(max_digits=10, decimal_places=2)
    total_dctos = models.DecimalField(max_digits=10, decimal_places=2)
    venta = models.DecimalField(max_digits=12, decimal_places=2)
    total_efectivo = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Control de Cumplimiento
    licencia_transporte = models.CharField(max_length=2, choices=[('C', 'Cumple'), ('NC', 'No Cumple')])
    soat = models.CharField(max_length=2, choices=[('C', 'Cumple'), ('NC', 'No Cumple')])
    uniforme = models.CharField(max_length=2, choices=[('C', 'Cumple'), ('NC', 'No Cumple')])
    no_locion = models.CharField(max_length=2, choices=[('C', 'Cumple'), ('NC', 'No Cumple')])
    no_accesorios = models.CharField(max_length=2, choices=[('C', 'Cumple'), ('NC', 'No Cumple')])
    capacitacion_carnet = models.CharField(max_length=2, choices=[('C', 'Cumple'), ('NC', 'No Cumple')])
    higiene = models.CharField(max_length=2, choices=[('C', 'Cumple'), ('NC', 'No Cumple')])
    estibas = models.CharField(max_length=2, choices=[('C', 'Cumple'), ('NC', 'No Cumple')])
    desinfeccion = models.CharField(max_length=2, choices=[('C', 'Cumple'), ('NC', 'No Cumple')])
    
    # Metadatos
    usuario = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
```

---

## 🔌 Endpoints API

### Crear Cargue
```
POST /api/cargue-id1/

Request:
{
  "dia": "LUNES",
  "fecha": "2025-11-17",
  "responsable": "Juan Pérez",
  "ruta": "Ruta 1",
  "v": true,
  "d": false,
  "producto": "Producto A",
  "cantidad": 50,
  "dctos": 5,
  "adicional": 0,
  "devoluciones": 2,
  "vencidas": 1,
  "valor": 5000,
  "concepto": "Venta normal",
  "descuentos": 0,
  "nequi": 0,
  "daviplata": 0,
  "base_caja": 10000,
  "total_despacho": 235000,
  "total_pedidos": 0,
  "total_dctos": 25000,
  "venta": 235000,
  "total_efectivo": 235000,
  "licencia_transporte": "C",
  "soat": "C",
  "uniforme": "C",
  "usuario": "Sistema"
}

Response:
{
  "id": 1,
  "dia": "LUNES",
  "fecha": "2025-11-17",
  "responsable": "Juan Pérez",
  "ruta": "Ruta 1",
  "producto": "Producto A",
  "cantidad": 50,
  "total": 42,
  "neto": 210000,
  "total_despacho": 235000,
  "total_efectivo": 235000,
  "fecha_creacion": "2025-11-17T10:30:00Z"
}
```

### Listar Cargues
```
GET /api/cargue-id1/?fecha=2025-11-17&dia=LUNES

Response:
[
  {
    "id": 1,
    "dia": "LUNES",
    "fecha": "2025-11-17",
    "responsable": "Juan Pérez",
    "producto": "Producto A",
    "cantidad": 50,
    "total": 42,
    "neto": 210000
  },
  ...
]
```

### Actualizar Responsable
```
POST /api/vendedores/actualizar_responsable/

Request:
{
  "id_vendedor": "ID1",
  "responsable": "Juan Pérez",
  "ruta": "Ruta 1"
}

Response:
{
  "success": true,
  "message": "Responsable y ruta actualizados para ID1",
  "registros_actualizados": 5
}
```

### Obtener Responsable
```
GET /api/vendedores/obtener_responsable/?id_vendedor=ID1

Response:
{
  "success": true,
  "id_vendedor": "ID1",
  "responsable": "Juan Pérez",
  "ruta": "Ruta 1"
}
```

---

## 🔄 Flujo de Cargue Completo


### 1. Seleccionar Ruta y Fecha
```javascript
// MenuSheets.jsx
const handleSelectRoute = (routeId) => {
  // ID1, ID2, ID3, ID4, ID5, ID6
  setSelectedRoute(routeId);
  loadCargueData(routeId);
};

// SelectorFecha.jsx
const handleDateSelect = (date) => {
  setSelectedDate(date);
  loadCarguesByDate(date);
};
```

### 2. Registrar Productos
```javascript
// RegistroForm.jsx
const handleAddProduct = (productData) => {
  // Validar datos
  // Calcular total = cantidad - dctos + adicional - devoluciones - vencidas
  // Calcular neto = total * valor
  // Agregar a tabla
  // Actualizar resumen
};
```

### 3. Registrar Lotes Vencidos
```javascript
// LotesVencidos.jsx
const handleAddExpiredLot = (lotData) => {
  // Lote: "LOTE001"
  // Motivo: "HONGO", "FVTO", "SELLADO"
  // Cantidad: número
  // Guardar en JSON
};
```

### 4. Registrar Pagos
```javascript
// ResumenVentas.jsx
const handleRegisterPayment = (paymentData) => {
  // Efectivo: cantidad
  // Nequi: cantidad
  // Daviplata: cantidad
  // Calcular total_efectivo
};
```

### 5. Control de Cumplimiento
```javascript
// ControlCumplimiento.jsx
const handleComplianceCheck = (field, value) => {
  // licencia_transporte: C/NC
  // soat: C/NC
  // uniforme: C/NC
  // higiene: C/NC
  // etc.
};
```

### 6. Guardar Cargue
```javascript
// PlantillaOperativa.jsx
const handleSaveCargue = async () => {
  // Validar todos los campos
  // Enviar a API
  // Mostrar confirmación
  // Limpiar formulario
};
```

---

## 📊 Servicios Frontend

### cargueService.js
```javascript
export const cargueService = {
  // Crear cargue
  createCargue: async (routeId, cargueData) => {
    const endpoint = `/api/cargue-${routeId.toLowerCase()}/`;
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cargueData)
    });
  },
  
  // Obtener cargues por fecha
  getCarguesByDate: async (routeId, date) => {
    const endpoint = `/api/cargue-${routeId.toLowerCase()}/?fecha=${date}`;
    return fetch(endpoint);
  },
  
  // Actualizar cargue
  updateCargue: async (routeId, cargueId, cargueData) => {
    const endpoint = `/api/cargue-${routeId.toLowerCase()}/${cargueId}/`;
    return fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cargueData)
    });
  },
  
  // Obtener responsable
  getResponsable: async (routeId) => {
    return fetch(`/api/vendedores/obtener_responsable/?id_vendedor=${routeId}`);
  },
  
  // Actualizar responsable
  updateResponsable: async (routeId, responsable, ruta) => {
    return fetch('/api/vendedores/actualizar_responsable/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_vendedor: routeId,
        responsable: responsable,
        ruta: ruta
      })
    });
  }
};
```

---

## 🎨 Estilos Principales

### PlantillaOperativa.css
```css
.plantilla-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.plantilla-main {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.plantilla-sidebar {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-section {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
}

.form-section-title {
  font-weight: bold;
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  border-bottom: 2px solid #007bff;
  padding-bottom: 5px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.form-group input,
.form-group select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.25);
}

.tabla-productos {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 15px;
}

.tabla-productos thead {
  background-color: #007bff;
  color: white;
}

.tabla-productos th,
.tabla-productos td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  font-size: 12px;
}

.tabla-productos tbody tr:hover {
  background-color: #f9f9f9;
}

.resumen-section {
  background-color: #f0f0f0;
  border-radius: 4px;
  padding: 15px;
  margin-top: 15px;
}

.resumen-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.resumen-row.total {
  font-weight: bold;
  font-size: 16px;
  color: #28a745;
  border-top: 2px solid #ddd;
  padding-top: 10px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.button-group button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover {
  background-color: #218838;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}
```

---

## 🔐 Validaciones

### Validación de Cantidad
```javascript
const validateQuantity = (cantidad, dctos, adicional, devoluciones, vencidas) => {
  const total = cantidad - dctos + adicional - devoluciones - vencidas;
  
  if (total < 0) {
    throw new Error('El total no puede ser negativo');
  }
  
  if (cantidad <= 0) {
    throw new Error('La cantidad debe ser mayor a 0');
  }
  
  return true;
};
```

### Validación de Pagos
```javascript
const validatePayments = (efectivo, nequi, daviplata, totalDespacho) => {
  const totalPagos = efectivo + nequi + daviplata;
  
  if (totalPagos < totalDespacho) {
    throw new Error('El total de pagos es menor al despacho');
  }
  
  return true;
};
```

### Validación de Cumplimiento
```javascript
const validateCompliance = (complianceData) => {
  const requiredFields = [
    'licencia_transporte',
    'soat',
    'uniforme',
    'higiene'
  ];
  
  for (const field of requiredFields) {
    if (!complianceData[field]) {
      throw new Error(`${field} es requerido`);
    }
  }
  
  return true;
};
```

---

## 📱 Pantalla Principal (PlantillaOperativa.jsx)

```javascript
import React, { useState, useEffect } from 'react';
import MenuSheets from './MenuSheets';
import SelectorFecha from './SelectorFecha';
import RegistroForm from './RegistroForm';
import TablaProductos from './TablaProductos';
import ResumenVentas from './ResumenVentas';
import ControlCumplimiento from './ControlCumplimiento';
import { cargueService } from '../../services/cargueService';
import './PlantillaOperativa.css';

export default function PlantillaOperativa() {
  const [selectedRoute, setSelectedRoute] = useState('ID1');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [productos, setProductos] = useState([]);
  const [resumen, setResumen] = useState({
    total_despacho: 0,
    total_pedidos: 0,
    total_dctos: 0,
    venta: 0,
    total_efectivo: 0
  });
  const [compliance, setCompliance] = useState({});
  const [responsable, setResponsable] = useState('');
  
  useEffect(() => {
    loadResponsable();
  }, [selectedRoute]);
  
  const loadResponsable = async () => {
    try {
      const response = await cargueService.getResponsable(selectedRoute);
      const data = await response.json();
      setResponsable(data.responsable || 'RESPONSABLE');
    } catch (error) {
      console.error('Error cargando responsable:', error);
    }
  };
  
  const handleAddProduct = (productData) => {
    const newProduct = {
      id: Date.now(),
      ...productData,
      total: productData.cantidad - productData.dctos + productData.adicional - productData.devoluciones - productData.vencidas,
      neto: (productData.cantidad - productData.dctos + productData.adicional - productData.devoluciones - productData.vencidas) * productData.valor
    };
    
    setProductos([...productos, newProduct]);
    updateResumen([...productos, newProduct]);
  };
  
  const handleRemoveProduct = (productId) => {
    const updated = productos.filter(p => p.id !== productId);
    setProductos(updated);
    updateResumen(updated);
  };
  
  const updateResumen = (productList) => {
    const totalDespacho = productList.reduce((sum, p) => sum + p.neto, 0);
    setResumen({
      ...resumen,
      total_despacho: totalDespacho,
      venta: totalDespacho
    });
  };
  
  const handleSaveCargue = async () => {
    try {
      if (productos.length === 0) {
        alert('Debe agregar al menos un producto');
        return;
      }
      
      // Guardar cada producto como un registro de cargue
      for (const producto of productos) {
        await cargueService.createCargue(selectedRoute, {
          dia: selectedDate.toLocaleDateString('es-CO', { weekday: 'long' }).toUpperCase(),
          fecha: selectedDate.toISOString().split('T')[0],
          responsable: responsable,
          producto: producto.nombre,
          cantidad: producto.cantidad,
          dctos: producto.dctos,
          adicional: producto.adicional,
          devoluciones: producto.devoluciones,
          vencidas: producto.vencidas,
          valor: producto.valor,
          total_despacho: resumen.total_despacho,
          total_efectivo: resumen.total_efectivo,
          ...compliance,
          usuario: 'Sistema'
        });
      }
      
      alert('Cargue guardado exitosamente');
      setProductos([]);
      setResumen({
        total_despacho: 0,
        total_pedidos: 0,
        total_dctos: 0,
        venta: 0,
        total_efectivo: 0
      });
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };
  
  return (
    <div className="plantilla-container">
      <div className="plantilla-main">
        <MenuSheets selectedRoute={selectedRoute} onSelectRoute={setSelectedRoute} />
        <SelectorFecha selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        
        <div className="form-section">
          <div className="form-section-title">Responsable</div>
          <input
            type="text"
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
            placeholder="Nombre del responsable"
          />
        </div>
        
        <RegistroForm onAddProduct={handleAddProduct} />
        
        <TablaProductos
          productos={productos}
          onRemove={handleRemoveProduct}
        />
        
        <ResumenVentas resumen={resumen} />
        
        <ControlCumplimiento
          compliance={compliance}
          onComplianceChange={setCompliance}
        />
        
        <div className="button-group">
          <button className="btn-success" onClick={handleSaveCargue}>
            Guardar Cargue
          </button>
          <button className="btn-danger" onClick={() => setProductos([])}>
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔄 Integración con Otros Módulos

### Actualización de Planeación
Cuando se guarda un cargue:
1. Se suma el `total_despacho` a la planeación del día
2. Se actualiza el estado de "solicitadas"

### Actualización de Inventario
Los productos despachados se restan del inventario:
1. Se crea un `MovimientoInventario` de tipo SALIDA
2. Se actualiza el `stock_total`

### Integración con Pedidos
Si hay pedidos pendientes:
1. Se suma al `total_pedidos` del cargue
2. Se actualiza el estado del pedido

---

## 📊 Reportes

### Reporte de Cargue Diario
```javascript
const generateDailyCargueReport = async (date, routeId) => {
  const response = await fetch(
    `/api/cargue-${routeId}/?fecha=${date}`
  );
  const cargues = await response.json();
  
  return {
    total_productos: cargues.length,
    total_despacho: cargues.reduce((sum, c) => sum + c.total_despacho, 0),
    total_devoluciones: cargues.reduce((sum, c) => sum + c.devoluciones, 0),
    total_vencidas: cargues.reduce((sum, c) => sum + c.vencidas, 0),
    total_efectivo: cargues.reduce((sum, c) => sum + c.total_efectivo, 0)
  };
};
```

---

## 🚀 Optimizaciones

1. **Caché de Responsables**: Se cachean los responsables por ruta
2. **Validación en Cliente**: Las validaciones se hacen antes de enviar
3. **Sincronización Automática**: Los datos se sincronizan cada 5 minutos
4. **Almacenamiento Local**: Los datos se guardan en localStorage como respaldo

---

## 📝 Checklist de Implementación

- [ ] Crear componente PlantillaOperativa
- [ ] Implementar MenuSheets (selector de rutas)
- [ ] Crear SelectorFecha
- [ ] Implementar RegistroForm
- [ ] Crear TablaProductos
- [ ] Implementar LotesVencidos
- [ ] Crear ControlCumplimiento
- [ ] Implementar ResumenVentas
- [ ] Integrar con API de cargue
- [ ] Agregar validaciones
- [ ] Crear reportes
- [ ] Optimizar rendimiento

---

**Última actualización**: 17 de Noviembre de 2025
