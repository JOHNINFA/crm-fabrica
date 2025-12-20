# 🔄 FLUJO EXACTO DEL CARGUE INTEGRADO

**Fecha:** 2025-12-17  
**Estado:** CORREGIDO Y APROBADO  

---

## 📋 FLUJO PASO A PASO

### 1️⃣ SUGERIDO
```
Usuario (Encargado):
└─ Presiona botón SUGERIDO

Sistema:
├─ Congela producción
├─ Congela pedidos en Planeación
├─ Guarda solicitadas en Planeación
├─ Guarda snapshot de Planeación
├─ 💾 GUARDA EN BD: Estado = SUGERIDO
└─ Cambia a: ALISTAMIENTO ACTIVO
```

---

### 2️⃣ ALISTAMIENTO ACTIVO
```
Encargado:
├─ Puede editar ADICIONAL (ID necesita más mercancía)
├─ Puede editar DCTOS (descuentos)
└─ 💾 CADA CAMBIO → GUARDA EN BD

Despachador:
├─ Marca columna D (Despachador verificó)
└─ 💾 GUARDA EN BD: check_despachador = true

Vendedor (desde app AP GUERRERO):
├─ Marca checkbox V (Vendedor recibió)
└─ 💾 GUARDA EN BD: check_vendedor = true

Cuando AMBOS checks V ✓ y D ✓:
├─ 💾 GUARDA ESTADO EN BD: Estado = DESPACHO
└─ ✅ AUTOMÁTICAMENTE cambia a: DESPACHO
```

---

### 3️⃣ DESPACHO
```
Durante el día:

Vendedor en ruta (App AP GUERRERO):
├─ Vende productos → Registra en módulo VENTAS
├─ Ventas se sincronizan a BD
└─ Web puede consultar ventas en tiempo real

Encargado (todavía puede):
├─ Editar ADICIONAL (si ID regresa por más mercancía)
└─ 💾 ACTUALIZA EN BD cada cambio

Cuando vendedor REGRESA al final del día:

Encargado:
├─ Vendedor trae mercancía no vendida
├─ 📊 CALCULAR DEVOLUCIONES:
│   
│   Ejemplo:
│   ├─ ID salió con: 200 AREPAS (cantidad - dctos + adicional)
│   ├─ ID vendió (desde app): 150 AREPAS
│   ├─ ID vencidas (reporta): 5 AREPAS
│   └─ ID devoluciones = 200 - 150 - 5 = 45 AREPAS ✅
│
├─ Ingresar VENCIDAS manualmente (con lotes vencidos)
├─ Ingresar DESCUENTOS si aplican
├─ 💾 GUARDAR tabla de CUMPLIMIENTO
├─ 💾 GUARDAR LOTES VENCIDOS
└─ Click en botón COMPLETAR

Sistema valida:
├─ ¿Tiene vencidas? → ¿Tiene lotes registrados? ✅
├─ ¿Devoluciones calculadas correctamente? ✅
└─ Permite pasar a COMPLETADO
```

---

### 4️⃣ COMPLETAR → COMPLETADO
```
Usuario:
└─ Click en botón COMPLETAR

Sistema AFECTA INVENTARIO:

1️⃣ DESCONTAR VENTAS (desde app):
   ├─ Consulta ventas de app AP GUERRERO
   ├─ Por cada producto vendido:
   │   └─ Inventario -= cantidad_vendida
   └─ 💾 Registra MovimientoInventario

2️⃣ DESCONTAR VENCIDAS:
   ├─ Por cada producto con vencidas:
   │   └─ Inventario -= vencidas
   └─ 💾 Registra MovimientoInventario + Lotes

3️⃣ SUMAR DEVOLUCIONES:
   ├─ Por cada producto con devoluciones:
   │   └─ Inventario += devoluciones
   └─ 💾 Registra MovimientoInventario

4️⃣ DESCONTAR PEDIDOS:
   ├─ Por cada pedido asignado:
   │   └─ Inventario -= cantidad_pedido
   └─ 💾 Marca pedido como ENTREGADA

5️⃣ GUARDAR EN BD:
   ├─ CargueIDx con datos finales
   ├─ Tabla Cumplimiento
   ├─ Lotes Vencidos
   └─ EstadoCargue = COMPLETADO

6️⃣ LIMPIAR:
   ├─ Limpiar localStorage
   └─ 🔒 BLOQUEAR EDICIÓN (solo lectura)

Resultado:
└─ Estado: COMPLETADO ✅ (no se puede editar nada)
```

---

## 🎯 PROBLEMA CLAVE RESUELTO

### ¿Cómo sabemos cuánto devuelve el vendedor?

**OPCIÓN 1: Cálculo Automático (Recomendada)**
```javascript
const calcularDevoluciones = (producto) => {
  // Cantidad con la que salió
  const cantidadInicial = producto.cantidad - producto.dctos + producto.adicional;
  
  // Ventas desde app
  const ventasApp = obtenerVentasDesdeApp(producto.id, fecha);
  
  // Vencidas ingresadas manualmente
  const vencidas = producto.vencidas || 0;
  
  // DEVOLUCIONES CALCULADAS
  const devoluciones = cantidadInicial - ventasApp - vencidas;
  
  return Math.max(0, devoluciones); // No puede ser negativo
};
```

**OPCIÓN 2: Manual (Backup si app falla)**
```javascript
// Si no hay conexión o datos de app
const ingresarDevolucionesManualmente = () => {
  // Encargado cuenta físicamente y registra
  return cantidadDevuelta;
};
```

---

## 💾 GUARDADO EN CADA ESTADO

### Tabla: `CargueIDx` (Actualización continua)

```python
# SUGERIDO → ALISTAMIENTO ACTIVO
CargueIDx.objects.update_or_create(
    fecha=fecha,
    dia=dia,
    producto=producto,
    defaults={
        'cantidad': cantidad,
        'estado': 'ALISTAMIENTO_ACTIVO'
    }
)

# Usuario edita ADICIONAL
CargueIDx.objects.filter(...).update(
    adicional=nuevo_adicional,
    fecha_modificacion=now()
)

# Despachador marca D
CargueIDx.objects.filter(...).update(
    check_despachador=True,
    despachador_usuario='Juan',
    despachador_timestamp=now()
)

# Vendedor marca V (desde app)
CargueIDx.objects.filter(...).update(
    check_vendedor=True,
    vendedor_timestamp=now()
)

# Sistema detecta V + D → DESPACHO
if check_vendedor and check_despachador:
    CargueIDx.objects.filter(...).update(
        estado='DESPACHO'
    )

# Encargado ingresa vencidas y lotes
CargueIDx.objects.filter(...).update(
    vencidas=5,
    lotes_vencidos=json_lotes
)

# Al COMPLETAR
ventas_app = VentaRuta.objects.filter(
    vendedor_id=id_vendedor,
    fecha=fecha,
    producto=producto
).aggregate(Sum('cantidad'))['cantidad__sum'] or 0

devoluciones = (cantidad - dctos + adicional) - ventas_app - vencidas

CargueIDx.objects.filter(...).update(
    devoluciones=devoluciones,
    venta=ventas_app,  # Ventas reales desde app
    total=(cantidad - dctos + adicional) - devoluciones - vencidas,
    estado='COMPLETADO',
    inventario_afectado=True
)
```

---

## 📱 INTEGRACIÓN CON APP

### En app AP GUERRERO - Módulo VENTAS

```javascript
// Al registrar venta
const registrarVenta = async (venta) => {
  const response = await fetch('http://localhost:8000/api/ventas-ruta/', {
    method: 'POST',
    body: JSON.stringify({
      vendedor_id: 'ID1',
      fecha: '2025-12-17',
      producto_id: producto.id,
      cantidad: 10,
      valor_unitario: 1500,
      total: 15000,
      metodo_pago: 'NEQUI',  // EFECTIVO, NEQUI, DAVIPLATA
      ubicacion: coordenadas
    })
  });
  
  // Actualizar UI
  alert('✅ Venta registrada');
};
```

### Endpoint Backend

```python
@api_view(['POST'])
def registrar_venta_ruta(request):
    """Registra venta desde app móvil"""
    data = request.data
    
    # Crear venta
    venta = VentaRuta.objects.create(
        vendedor_id=data['vendedor_id'],
        fecha=data['fecha'],
        producto_id=data['producto_id'],
        cantidad=data['cantidad'],
        valor_unitario=data['valor_unitario'],
        total=data['total'],
        metodo_pago=data['metodo_pago']
    )
    
    # Actualizar contador en CargueIDx (opcional, para monitoreo)
    try:
        cargue = obtener_cargue_del_dia(data['vendedor_id'], data['fecha'])
        # No afectar inventario aquí, solo contador
        # El inventario se afectará en COMPLETADO
    except:
        pass
    
    return Response({
        'success': True,
        'venta_id': venta.id
    })
```

---

## 🔍 CONSULTAR VENTAS EN TIEMPO REAL

### En planilla web (estado DESPACHO)

```javascript
const consultarVentasDelDia = async (idVendedor, fecha, productoId) => {
  const response = await fetch(
    `http://localhost:8000/api/ventas-ruta/resumen/?` +
    `vendedor=${idVendedor}&fecha=${fecha}&producto=${productoId}`
  );
  
  const data = await response.json();
  
  return {
    cantidad_vendida: data.total_cantidad,
    total_dinero: data.total_dinero,
    ventas_efectivo: data.efectivo,
    ventas_nequi: data.nequi,
    ventas_daviplata: data.daviplata
  };
};

// Mostrar en interfaz
<div>
  <p>📊 Ventas en tiempo real:</p>
  <p>Vendido hoy: {ventasDelDia.cantidad_vendida} und</p>
  <p>Total: ${ventasDelDia.total_dinero}</p>
  <p>Nequi: ${ventasDelDia.ventas_nequi}</p>
  <p>DaviPlata: ${ventasDelDia.ventas_daviplata}</p>
</div>
```

---

## ✅ VALIDACIONES ANTES DE COMPLETAR

```python
def validar_antes_de_completar(id_vendedor, fecha):
    """Valida que todos los datos estén correctos"""
    
    errores = []
    
    # 1. Validar que hay ventas registradas en app
    ventas_app = VentaRuta.objects.filter(
        vendedor_id=id_vendedor,
        fecha=fecha
    ).exists()
    
    if not ventas_app:
        errores.append('⚠️ No hay ventas registradas en la app')
    
    # 2. Validar lotes vencidos
    cargues = CargueIDx.objects.filter(
        fecha=fecha,
        vencidas__gt=0
    )
    
    for cargue in cargues:
        if not cargue.lotes_vencidos:
            errores.append(f'❌ {cargue.producto}: Vencidas sin lotes')
    
    # 3. Validar devoluciones no negativas
    for cargue in CargueIDx.objects.filter(fecha=fecha):
        cantidad_inicial = cargue.cantidad - cargue.dctos + cargue.adicional
        ventas = obtener_ventas_app(id_vendedor, fecha, cargue.producto)
        devoluciones = cantidad_inicial - ventas - cargue.vencidas
        
        if devoluciones < 0:
            errores.append(
                f'❌ {cargue.producto}: Devoluciones negativas ' +
                f'(Vendió {ventas} pero solo tenía {cantidad_inicial})'
            )
    
    return errores
```

---

## 📊 RESUMEN VISUAL DEL FLUJO

```
ESTADO          │ QUIÉN ACTÚA        │ QUÉ HACE               │ GUARDA EN BD
────────────────┼────────────────────┼────────────────────────┼─────────────
SUGERIDO        │ Encargado          │ Click botón            │ ✅ Estado
                │                    │                        │
ALISTAMIENTO    │ Encargado          │ Edita ADICIONAL/DCTOS  │ ✅ Cambios
ACTIVO          │ Despachador        │ Marca columna D        │ ✅ Check D
                │ Vendedor (app)     │ Marca checkbox V       │ ✅ Check V
                │ Sistema            │ V+D → DESPACHO auto    │ ✅ Estado
                │                    │                        │
DESPACHO        │ Vendedor (ruta)    │ Vende desde app        │ ✅ Ventas
                │ Encargado          │ Puede editar ADICIONAL │ ✅ Cambios
                │ Encargado          │ Espera que regrese     │
                │ Encargado          │ Ingresa VENCIDAS       │ ✅ Vencidas
                │ Encargado          │ Ingresa LOTES          │ ✅ Lotes
                │ Sistema            │ Calcula DEVOLUCIONES   │ ✅ Devol.
                │ Encargado          │ Click COMPLETAR        │
                │                    │                        │
COMPLETAR       │ Sistema            │ Descuenta inventario   │ ✅ Movimientos
→ COMPLETADO    │ Sistema            │ Guarda todo en BD      │ ✅ CargueIDx
                │ Sistema            │ Limpia localStorage    │
                │ Sistema            │ Bloquea edición        │ ✅ Estado
```

---

## 🔧 CAMBIOS EN CÓDIGO

### 1. Renombrar archivo
```bash
mv frontend/src/components/Cargue/BotonLimpiar.jsx \
   frontend/src/components/Cargue/BotonCargue.jsx
```

### 2. Agregar campos a CargueIDx
```python
class CargueIDx(models.Model):
    # ... campos existentes
    
    # NUEVOS CAMPOS
    check_despachador = models.BooleanField(default=False)
    despachador_usuario = models.CharField(max_length=100, blank=True)
    despachador_timestamp = models.DateTimeField(null=True, blank=True)
    
    check_vendedor = models.BooleanField(default=False)
    vendedor_timestamp = models.DateTimeField(null=True, blank=True)
    
    estado = models.CharField(max_length=30, default='SUGERIDO')
    # SUGERIDO, ALISTAMIENTO_ACTIVO, DESPACHO, COMPLETADO
    
    inventario_afectado = models.BooleanField(default=False)
```

### 3. Transición automática
```javascript
// En BotonCargue.jsx
useEffect(() => {
  const verificarChecks = async () => {
    if (estado === 'ALISTAMIENTO_ACTIVO') {
      // Verificar si todos los productos tienen V y D
      const todosConChecks = productosConCantidad.every(p => 
        p.check_vendedor && p.check_despachador
      );
      
      if (todosConChecks) {
        console.log('✅ V+D completos → DESPACHO automático');
        
        // Guardar estado en BD
        await fetch('http://localhost:8000/api/cargue-estado/', {
          method: 'POST',
          body: JSON.stringify({
            id_vendedor: idSheet,
            fecha: fechaSeleccionada,
            estado: 'DESPACHO'
          })
        });
        
        // Actualizar local
        setEstado('DESPACHO');
        localStorage.setItem(
          `estado_boton_${dia}_${fechaFormateadaLS}`,
          'DESPACHO'
        );
      }
    }
  };
  
  verificarChecks();
}, [productosConCantidad, estado]);
```

### 4. Botón COMPLETAR
```javascript
case 'DESPACHO':
  return {
    texto: '✅ COMPLETAR',
    variant: 'success',
    disabled: loading,
    onClick: async () => {
      setLoading(true);
      
      // 1. Validar antes de completar
      const validacion = await validarAntesDeCompletar();
      if (!validacion.ok) {
        alert('❌ Errores:\\n' + validacion.errores.join('\\n'));
        setLoading(false);
        return;
      }
      
      // 2. Confirmar
      const confirmar = window.confirm(
        '¿Completar jornada?\\n\\n' +
        'Se afectará el inventario y no podrá editar.'
      );
      
      if (!confirmar) {
        setLoading(false);
        return;
      }
      
      // 3. AFECTAR INVENTARIO
      await afectarInventarioFinal();
      
      // 4. Cambiar a COMPLETADO
      setEstado('COMPLETADO');
      
      setLoading(false);
    }
  };
```

---

## ✅ ESTADO FINAL

**¿Este flujo es exactamente lo que necesitas?** 🎯
