# PENDIENTE: Sincronización de Precios entre IDs y Días

## Problema
Cuando se cambia el precio (VALOR) de un producto en la tabla de Cargue (ej: ID1 SABADO), el cambio solo se refleja en ese ID y día específico. No se actualiza en los otros IDs (ID2, ID3, etc.) ni en otros días.

## Lo que ya funciona
- ✅ El doble clic en la celda VALOR permite editar el precio
- ✅ El precio se guarda en el backend (`/api/productos/{id}/`) correctamente
- ✅ La función `sincronizarPrecioBackend()` actualiza el campo `precio` en la BD

## El problema raíz
Los datos de cada ID/día se guardan en **localStorage** con el valor del momento en que se crearon. Cuando se carga un ID/día, usa el valor guardado en localStorage en lugar del precio actualizado del backend.

## Archivos involucrados
- `frontend/src/components/Cargue/PlantillaOperativa.jsx`
  - Línea ~528: `valor: Math.round(product.price * 0.65)` - Ya modificado para usar precio del backend
  - Línea ~486: `valor: productoGuardado.valor || 0` - Carga directa desde localStorage (pendiente)
  - Función `sincronizarPrecioBackend()` - Actualiza el backend correctamente

- `frontend/src/services/cargueApiService.js` - Servicio híbrido que maneja localStorage y API

## Solución propuesta
1. Cuando se carguen los productos, SIEMPRE obtener el precio actual del backend
2. Solo usar localStorage para: cantidad, dctos, adicional, devoluciones, vencidas, vendedor, despachador
3. El campo `valor` debe venir siempre del precio del producto en el backend

## Pasos para continuar
1. Revisar `cargarDatosGuardados()` en PlantillaOperativa.jsx
2. Asegurar que `product.price` venga actualizado del contexto de productos
3. Verificar que el contexto de productos (`useProducts`) recargue los precios del backend
4. Posiblemente agregar un evento para refrescar precios cuando se actualice uno

## Prueba de verificación
1. Cambiar precio de AREPA TIPO OBLEA en ID1 SABADO a $3000
2. Ir a ID2 SABADO y verificar que muestre $3000
3. Ir a ID1 LUNES y verificar que muestre $3000
4. En la app móvil, sincronizar productos y verificar el nuevo precio
