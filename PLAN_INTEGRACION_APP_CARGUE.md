# 🔗 INTEGRACIÓN APP GUERRERO ↔ CARGUE WEB

**Fecha:** 2025-12-17
**Objetivo:** Conectar ventas de app móvil con planilla de cargue web

---

## ✅ LO QUE YA FUNCIONA

### APP MÓVIL (AP GUERRERO):
```javascript
// En VentasScreen.js
confirmarVenta() {
  const ventaBackend = {
    vendedor_id: 'ID1',  // ✅ Ya envía ID del vendedor
    cliente_nombre: 'Juan Pérez',
    total: 15000,
    detalles: [
      { nombre: 'AREPA TIPO OBLEA', cantidad: 10, precio: 2500 }
    ],
    metodo_pago: 'EFECTIVO',  // ✅ Ya envía método
    productos_vencidos: [],
    fecha: '2025-12-17'  // ✅ Ya envía fecha
  }
  
  await enviarVentaRuta(ventaBackend);  // ✅ Ya guarda en VentaRuta
}
```

### BACKEND:
- ✅ Modelo `VentaRuta` existe
- ✅ API `/api/ventas-ruta/` funcionando
- ✅ Puede filtrar por `vendedor_id` y `fecha`

---

## 🎯 OBJETIVO

```
1. ID1 carga:               200 AREPAS
2. ID1 vende (desde app):   150 AREPAS (registra en VentaRuta)
3. ID1 reporta vencidas:      5 AREPAS
4.Web calcula automático:    45 AREPAS DEVOLUCIONES ✅
```

**Fórmula:**
```
DEVOLUCIONES = CARGUE_INICIAL - VENTAS_APP - VENCIDAS
```

---

## 🔧 PASOS DE IMPLEMENTACIÓN

### PASO 1: Endpoint para calcular devoluciones

**Archivo:** `api/views.py`

```python
@api_view(['GET'])
def calcular_devoluciones_automaticas(request, id_vendedor, fecha):
    """
    Calcula devoluciones automáticamente basándose en:
    - Cargue inicial (de CargueIDx)
    - Ventas reales (de VentaRuta)
    - Vencidas (registradas manualmente)
    
    Retorna devoluciones por producto.
    """
    try:
        from api.models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6, VentaRuta
        from django.db.models import Sum
        
        # Obtener modelo correcto
        modelo_map = {
            'ID1': CargueID1,
            'ID2': CargueID2,
            'ID3': CargueID3,
            'ID4': CargueID4,
            'ID5': CargueID5,
            'ID6': CargueID6,
        }
        
        ModeloCargue = modelo_map.get(id_vendedor)
        if not ModeloCargue:
            return Response({'error': 'ID de vendedor inválido'}, status=400)
        
        # Obtener cargue del día
        cargues = ModeloCargue.objects.filter(
            fecha=fecha,
            activo=True
        )
        
        resultado = []
        
        for cargue in cargues:
            # Cantidad inicial con la que salió
            cantidad_inicial = cargue.cantidad - cargue.dctos + cargue.adicional
            
            # Ventas registradas en app (por producto)
            ventas_app = VentaRuta.objects.filter(
                vendedor__id_vendedor=id_vendedor,
                fecha__date=fecha
            ).values('detalles')
            
            # Agregar cantidades vendidas por producto
            cantidad_vendida = 0
            for venta in ventas_app:
                detalles = venta.get('detalles', [])
                for detalle in detalles:
                    if detalle.get('nombre', '').upper() == cargue.producto.upper():
                        cantidad_vendida += detalle.get('cantidad', 0)
            
            # Vencidas
            vencidas = cargue.vencidas or 0
            
            # Calcular devoluciones
            devoluciones = max(0, cantidad_inicial - cantidad_vendida - vencidas)
            
            resultado.append({
                'producto': cargue.producto,
                'cantidad_inicial': cantidad_inicial,
                'cantidad_vendida': cantidad_vendida,
                'vencidas': vencidas,
                'devoluciones': devoluciones
            })
        
        return Response({
            'id_vendedor': id_vendedor,
            'fecha': fecha,
            'productos': resultado
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)
```

**Agregar ruta:**
```python
# en urls.py
path('cargue/devoluciones-automaticas/<str:id_vendedor>/<str:fecha>/', 
     calcular_devoluciones_automaticas, 
     name='devoluciones-automaticas'),
```

---

### PASO 2: Endpoint para ventas en tiempo real

**Archivo:** `api/views.py`

```python
@api_view(['GET'])
def ventas_tiempo_real(request, id_vendedor, fecha):
    """
    Obtiene ventas del día en tiempo real desde VentaRuta.
    Agrupado por producto.
    """
    try:
        from api.models import VentaRuta
        
        ventas = VentaRuta.objects.filter(
            vendedor__id_vendedor=id_vendedor,
            fecha__date=fecha
        )
        
        # Agrupar por producto
        ventas_por_producto = {}
        total_dinero = 0
        ventas_por_metodo = {
            'EFECTIVO': 0,
            'NEQUI': 0,
            'DAVIPLATA': 0
        }
        
        for venta in ventas:
            total_dinero += venta.total
            ventas_por_metodo[venta.metodo_pago] = ventas_por_metodo.get(venta.metodo_pago, 0) + venta.total
            
            for detalle in venta.detalles:
                nombre = detalle.get('nombre', '')
                cantidad = detalle.get('cantidad', 0)
                
                if nombre in ventas_por_producto:
                    ventas_por_producto[nombre] += cantidad
                else:
                    ventas_por_producto[nombre] = cantidad
        
        productos_vendidos = [
            {'producto': k, 'cantidad': v}
            for k, v in ventas_por_producto.items()
        ]
        
        return Response({
            'id_vendedor': id_vendedor,
            'fecha': fecha,
            'total_ventas': ventas.count(),
            'total_dinero': total_dinero,
            'productos_vendidos': productos_vendidos,
            'ventas_por_metodo': ventas_por_metodo
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)
```

**Agregar ruta:**
```python
path('cargue/ventas-tiempo-real/<str:id_vendedor>/<str:fecha>/', 
     ventas_tiempo_real, 
     name='ventas-tiempo-real'),
```

---

### PASO 3: Componente frontend - Ventas en Tiempo Real

**Archivo:** `frontend/src/components/Cargue/VentasEnTiempoReal.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Badge } from 'react-bootstrap';

const VentasEnTiempoReal = ({ idVendedor, fecha }) => {
  const [ventas, setVentas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const cargarVentas = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/cargue/ventas-tiempo-real/${idVendedor}/${fecha}/`
      );
      
      if (response.ok) {
        const data = await response.json();
        setVentas(data);
        setUltimaActualizacion(new Date());
      }
    } catch (error) {
      console.error('Error cargando ventas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVentas();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarVentas, 30000);
    
    return () => clearInterval(interval);
  }, [idVendedor, fecha]);

  if (loading) return <div>Cargando ventas...</div>;
  if (!ventas) return null;

  return (
    <Card className="mt-3 shadow-sm">
      <Card.Header className="bg-info text-white">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">📊 Ventas en Tiempo Real - {idVendedor}</h5>
          <Badge bg="light" text="dark">
            {ventas.total_ventas} ventas
          </Badge>
        </div>
      </Card.Header>
      <Card.Body>
        {/* Resumen */}
        <div className="row mb-3">
          <div className="col-md-4">
            <strong>Total Vendido:</strong>
            <h4 className="text-success">
              ${ventas.total_dinero?.toLocaleString()}
            </h4>
          </div>
          <div className="col-md-8">
            <strong>Por método:</strong>
            <div className="d-flex gap-3 mt-2">
              <Badge bg="success">
                Efectivo: ${ventas.ventas_por_metodo.EFECTIVO?.toLocaleString()}
              </Badge>
              <Badge bg="info">
                Nequi: ${ventas.ventas_por_metodo.NEQUI?.toLocaleString()}
              </Badge>
              <Badge bg="warning" text="dark">
                DaviPlata: ${ventas.ventas_por_metodo.DAVIPLATA?.toLocaleString()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tabla de productos vendidos */}
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Producto</th>
              <th className="text-end">Cantidad Vendida</th>
            </tr>
          </thead>
          <tbody>
            {ventas.productos_vendidos.map((item, idx) => (
              <tr key={idx}>
                <td>{item.producto}</td>
                <td className="text-end">
                  <Badge bg="primary">{item.cantidad}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Última actualización */}
        <small className="text-muted">
          Última actualización: {ultimaActualizacion?.toLocaleTimeString()}
        </small>
      </Card.Body>
    </Card>
  );
};

export default VentasEnTiempoReal;
```

---

### PASO 4: Integrar en PlantillaOperativa

**Archivo:** `frontend/src/components/Cargue/PlantillaOperativa.jsx`

```jsx
import VentasEnTiempoReal from './VentasEnTiempoReal';

// Dentro del componente, después de la tabla principal:
{estadoBoton === 'DESPACHO' && (
  <VentasEnTiempoReal 
    idVendedor={idSheet}
    fecha={fechaSeleccionada}
  />
)}
```

---

### PASO 5: Calcular devoluciones automáticamente en COMPLETADO

**Archivo:** `frontend/src/components/Cargue/BotonLimpiar.jsx`

**Modificar función `manejarCompletar`:**

```javascript
const manejarCompletar = async () => {
  setLoading(true);

  try {
    const fechaAUsar = fechaSeleccionada;
    const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];

    // 🆕 NUEVO: Calcular devoluciones automáticamente ANTES de procesar
    console.log('🔄 Calculando devoluciones automáticas desde ventas de app...');
    
    for (const id of idsVendedores) {
      try {
        const response = await fetch(
          `http://localhost:8000/api/cargue/devoluciones-automaticas/${id}/${fechaAUsar}/`
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${id} - Devoluciones calculadas:`, data.productos);
          
          // Actualizar devoluciones en localStorage
          const { simpleStorage } = await import('../../services/simpleStorage');
          const key = `cargue_${dia}_${id}_${fechaAUsar}`;
          const datosActuales = await simpleStorage.getItem(key);
          
          if (datosActuales && datosActuales.productos) {
            // Actualizar devoluciones calculadas
            for (const productoCalc of data.productos) {
              const productoLocal = datosActuales.productos.find(
                p => p.producto.toUpperCase() === productoCalc.producto.toUpperCase()
              );
              
              if (productoLocal) {
                productoLocal.devoluciones = productoCalc.devoluciones;
                console.log(
                  `  📝 ${productoCalc.producto}: ` +
                  `Inicial=${productoCalc.cantidad_inicial}, ` +
                  `Vendido=${productoCalc.cantidad_vendida}, ` +
                  `Vencidas=${productoCalc.vencidas}, ` +
                  `Devol=${productoCalc.devoluciones}`
                );
              }
            }
            
            // Guardar datos actualizados
            await simpleStorage.setItem(key, datosActuales);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error calculando devoluciones para ${id}:`, error);
      }
    }

    // Continuar con el resto del proceso (descontar inventario, etc.)
    // ... código existente ...
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  setLoading(false);
};
```

---

## 📊 FLUJO COMPLETO

```
DÍA DE TRABAJO:

1. MAÑANA - DESPACHO
   ├─ ID1 carga 200 AREPAS
   └─ Estado: DESPACHO

2. DURANTE EL DÍA
   ├─ ID1 vende 150 AREPAS (desde app)
   │   └─ Se guarda en VentaRuta
   ├─ Web muestra ventas en tiempo real
   └─ Estado: DESPACHO

3. TARDE - REGRESO
   ├─ ID1 reporta 5 vencidas manualmente
   ├─ Click botón COMPLETAR
   └─ Sistema calcula automáticamente:
       - Devoluciones = 200 - 150 - 5 = 45 ✅
       - Descuenta inventario: 155 (vendidas + vencidas)
       - Suma devoluciones: +45

4. COMPLETADO
   └─ Todo guardado en BD
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend:
- [ ] Crear endpoint `calcular_devoluciones_automaticas`
- [ ] Crear endpoint `ventas_tiempo_real`
- [ ] Probar con Postman

### Frontend Web:
- [ ] Crear componente `VentasEnTiempoReal.jsx`
- [ ] Integrar en `PlantillaOperativa.jsx`
- [ ] Modificar `manejarCompletar()` en `BotonLimpiar.jsx`
- [ ] Probar flujo completo

### App Móvil:
- [ ] ✅ Ya está guardando en VentaRuta
- [ ] ✅ Ya envía vendedor_id
- [ ] ✅ Ya envía método de pago

---

## 🎯 BENEFICIOS

1. ✅ **Automático:** No más calcular devoluciones manualmente
2. ✅ **Preciso:** Basado en ventas reales de la app
3. ✅ **Tiempo real:** Ver ventas mientras suceden
4. ✅ **Menos errores:** Sistema calcula, no humanos
5. ✅ **Integración completa:** App ↔ Web sincronizados

---

**¿Empezamos con el PASO 1 (endpoints backend)?** 🚀
