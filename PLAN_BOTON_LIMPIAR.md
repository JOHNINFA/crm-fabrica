# 🔧 PLAN SIMPLE: MODIFICAR BOTONLIMPIAR

**Objetivo:** Cambiar el flujo del BotonLimpiar para que el inventario se afecte solo en COMPLETADO

---

## 📊 FLUJO ACTUAL (PROBLEMA)

```
1. ALISTAMIENTO (SUGERIDO)
   └─ Click botón → ALISTAMIENTO_ACTIVO

2. ALISTAMIENTO_ACTIVO
   ├─ Usuario marca checks V y D
   ├─ Click botón
   ├─ ❌ DESCUENTA INVENTARIO AQUÍ (líneas 1979-2051)
   │   - Descuenta CARGUE
   │   - Descuenta PEDIDOS
   └─ Cambia a FINALIZAR

3. FINALIZAR (DESPACHO)
   ├─ Procesa devoluciones (+inventario)
   ├─ Procesa vencidas
   ├─ Guarda en BD
   └─ Cambia a COMPLETADO

4. COMPLETADO
   └─ Fin
```

**PROBLEMA:** El inventario se descuenta en paso 2, pero las devoluciones/vencidas se procesan en paso 3. Esto causa inconsistencias.

---

## ✅ FLUJO NUEVO (SOLUCIÓN)

```
1. ALISTAMIENTO (SUGERIDO)
   └─ Click botón → ALISTAMIENTO_ACTIVO

2. ALISTAMIENTO_ACTIVO
   ├─ Usuario marca checks V y D
   ├─ Click botón
   ├─ ✅ NO descuentainventario
   └─ Cambia a DESPACHO

3. DESPACHO
   ├─ Usuario registra devoluciones y vencidas
   ├─ Click botón COMPLETAR
   └─ Cambia a COMPLETADO

4. COMPLETADO
   ├─ ✅ AFECTA INVENTARIO AQUÍ:
   │   - Descuenta CARGUE
   │   - Descuenta PEDIDOS
   │   - Suma DEVOLUCIONES
   │   - Descuenta VENCIDAS
   ├─ Guarda en BD
   └─ Fin
```

---

## 🔧 CAMBIOS A REALIZAR

### CAMBIO 1: Renombrar estados

**Actual:**
- ALISTAMIENTO
- ALISTAMIENTO_ACTIVO
- FINALIZAR
- COMPLETADO

**Nuevo:**
- SUGERIDO (en lugar de ALISTAMIENTO)
- ALISTAMIENTO_ACTIVO (igual)
- DESPACHO (en lugar de FINALIZAR)
- COMPLETADO (igual)

### CAMBIO 2: ALISTAMIENTO_ACTIVO - NO descontar inventario

**Líneas a modificar: 1927-2087**

**ANTES:**
```javascript
case 'ALISTAMIENTO_ACTIVO':
  return {
    texto: '📦 ALISTAMIENTO ACTIVO',
    onClick: async () => {
      // ... validaciones ...
      
      // ❌ DESCUENTA INVENTARIO
      for (const producto of productosValidados) {
        await actualizarInventario(productoId, producto.totalCantidad, 'RESTAR');
      }
      
      // ❌ DESCUENTA PEDIDOS
      for (const pedido of pedidos) {
        await actualizarInventario(productoId, pedido.cantidad, 'RESTAR');
      }
      
      setEstado('FINALIZAR');
    }
  };
```

**DESPUÉS:**
```javascript
case 'ALISTAMIENTO_ACTIVO':
  return {
    texto: '📦 ALISTAMIENTO ACTIVO',
    onClick: async () => {
      // Validaciones
      if (productosPendientes.length > 0) {
        alert('Marque todos los checkboxes');
        return;
      }
      
      // Confirmar
      const confirmar = window.confirm('¿Pasar a DESPACHO?');
      if (!confirmar) return;
      
      // ✅ SOLO cambiar estado
      setEstado('DESPACHO');
      localStorage.setItem(`estado_boton_${dia}_${fechaFormateadaLS}`, 'DESPACHO');
      
      alert('✅ Estado cambiado a DESPACHO');
    }
  };
```

### CAMBIO 3: DESPACHO - Solo guardar datos

**Líneas a modificar: 2088-2099**

**ANTES:**
```javascript
case 'FINALIZAR':
  return {
    texto: '🚚 DESPACHO',
    onClick: manejarFinalizar  // Procesa devoluciones y guarda
  };
```

**DESPUÉS:**
```javascript
case 'DESPACHO':
  return {
    texto: '✅ COMPLETAR',
    onClick: async () => {
      const confirmar = window.confirm(
        '¿Completar jornada?\n\n' +
        'Se afectará el inventario final.'
      );
      
      if (!confirmar) return;
      
      // Llamar nueva función que afecta inventario
      await manejarCompletar();
    }
  };
```

### CAMBIO 4: Nueva función manejarCompletar

**Agregar después de otras funciones auxiliares:**

```javascript
const manejarCompletar = async () => {
  setLoading(true);
  
  try {
    console.log('🏁 INICIANDO COMPLETADO - Afectando inventario');
    
    const { simpleStorage } = await import('../../services/simpleStorage');
    const fechaAUsar = fechaSeleccionada;
    const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];
    
    // ========== PASO 1: DESCONTAR CARGUE ==========
    console.log('📦 PASO 1: Descontando CARGUE...');
    
    for (const producto of productosValidados) {
      if (producto.id) {
        await actualizarInventario(producto.id, producto.totalCantidad, 'RESTAR');
        console.log(`⬇️ CARGUE: ${producto.nombre} -${producto.totalCantidad}`);
      }
    }
    
    // ========== PASO 2: DESCONTAR PEDIDOS ==========
    console.log('📋 PASO 2: Descontando PEDIDOS...');
    
    const { pedidosAgrupados, pedidosIds } = await cargarPedidosPendientes(fechaSeleccionada);
    const productosPedidos = Object.values(pedidosAgrupados);
    
    if (productosPedidos.length > 0) {
      const productosResponse = await fetch('http://localhost:8000/api/productos/');
      const todosLosProductos = await productosResponse.json();
      
      for (const pedido of productosPedidos) {
        const productoEnAPI = todosLosProductos.find(p => 
          p.nombre.toUpperCase() === pedido.nombre.toUpperCase()
        );
        
        if (productoEnAPI) {
          await actualizarInventario(productoEnAPI.id, pedido.cantidad, 'RESTAR');
          console.log(`⬇️ PEDIDO: ${pedido.nombre} -${pedido.cantidad}`);
        }
      }
      
      // Marcar pedidos como entregados
      await marcarPedidosComoEntregados(pedidosIds);
    }
    
    // ========== PASO 3: PROCESAR DEVOLUCIONES Y VENCIDAS ==========
    console.log('🔄 PASO 3: Procesando DEVOLUCIONES y VENCIDAS...');
    
    let totalDevoluciones = 0;
    let totalVencidas = 0;
    
    for (const id of idsVendedores) {
      const key = `cargue_${dia}_${id}_${fechaAUsar}`;
      const datos = await simpleStorage.getItem(key);
      
      if (datos && datos.productos) {
        for (const producto of datos.productos) {
          if (producto.id) {
            // Sumar devoluciones al inventario
            if (producto.devoluciones > 0) {
              await actualizarInventario(producto.id, producto.devoluciones, 'SUMAR');
              totalDevoluciones += producto.devoluciones;
              console.log(`⬆️ DEVOL: ${producto.producto} +${producto.devoluciones}`);
            }
            
            // Descontar vencidas (ya fueron sacadas pero vencieron)
            if (producto.vencidas > 0) {
              totalVencidas += producto.vencidas;
              console.log(`🗑️ VENCIDAS: ${producto.producto} ${producto.vencidas} (registradas, no afectan inventario)`);
            }
          }
        }
      }
    }
    
    // ========== PASO 4: GUARDAR EN BD ==========
    console.log('💾 PASO 4: Guardando en BD...');
    await guardarDatosCompletos(fechaAUsar, idsVendedores);
    
    // ========== PASO 5: LIMPIAR Y COMPLETAR ==========
    console.log('🧹 PASO 5: Limpiando localStorage...');
    limpiarLocalStorage(fechaAUsar, idsVendedores);
    
    // Cambiar a COMPLETADO
    setEstado('COMPLETADO');
    localStorage.setItem(`estado_boton_${dia}_${fechaFormateadaLS}`, 'COMPLETADO');
    
    console.log('🎉 COMPLETADO EXITOSAMENTE');
    
    alert(
      '✅ Jornada Completada\n\n' +
      `📦 Cargue descontado\n` +
      `📋 Pedidos descontados\n` +
      `⬆️ Devoluciones: ${totalDevoluciones}\n` +
      `🗑️ Vencidas: ${totalVencidas}\n` +
      `💾 Datos guardados en BD\n` +
      `🧹 LocalStorage limpiado`
    );
    
  } catch (error) {
    console.error('❌ Error en COMPLETADO:', error);
    alert(`❌ Error: ${error.message}`);
  }
  
  setLoading(false);
};
```

---

## 📋 RESUMEN DE CAMBIOS

| Línea | Cambio | Descripción |
|-------|--------|-------------|
| 1906 | Renombrar | `'📦 SUGERIDO'` (antes ALISTAMIENTO) |
| 1927-2087 | Simplificar | ALISTAMIENTO_ACTIVO solo cambia estado |
| 2088-2099 | Modificar | DESPACHO → COMPLETAR |
| Nueva función | Agregar | `manejarCompletar()` con toda la lógica |

---

## ✅ RESULTADO FINAL

**Flujo corregido:**
1. SUGERIDO → congela producción
2. ALISTAMIENTO_ACTIVO → espera checks, cambia a DESPACHO
3. DESPACHO → usuario registra devol/vencidas, click COMPLETAR
4. COMPLETADO → afecta inventario, guarda BD, limpia

---

**¿Hacemos estos cambios ahora?** 🚀
