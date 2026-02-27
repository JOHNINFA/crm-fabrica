# ULTIMO CAMBIO AP (EN PRUEBAS)

Fecha: 2026-02-25  
Estado: En validacion funcional (sin commit final)

## Alcance aplicado
- Modulo: App movil AP GUERRERO (Ventas > Reimpresion/Historial).
- Objetivo: editar una venta de ruta existente sin crear una factura nueva.

## Cambios implementados
1. Edicion de metodo de pago en venta ya facturada:
- Opciones: `EFECTIVO`, `NEQUI`, `DAVIPLATA`.
- Se guarda en la misma venta editada.

2. Edicion de cantidades:
- Aumentar/disminuir cantidades por producto.
- Si queda en `0`, el producto se elimina de la venta editada.

3. Agregar productos nuevos en la misma edicion:
- Buscador por nombre dentro del modal de edicion.
- Boton `Agregar` para sumar productos no incluidos originalmente en la factura.

4. Consistencia local/offline:
- Actualiza estado en memoria.
- Actualiza `AsyncStorage('ventas')`.
- Si la venta estaba en cola offline, actualiza `AsyncStorage('ventas_pendientes_sync')`.

## Backend usado (sin endpoint nuevo)
- Endpoint existente: `PATCH /api/ventas-ruta/{id}/editar/`.
- Ahora soporta:
  - solo `metodo_pago`,
  - solo `detalles`,
  - o ambos.
- Mantiene compatibilidad con ajuste de `vendidas` en Cargue cuando hay cambios de detalles.

## Seguridad de despliegue
- No se crearon migraciones nuevas para este ajuste.
- No se creo endpoint nuevo.
- No se realizo commit final en esta fase.

## Pruebas pendientes reportadas
- Revisar novedad en VPS en modo responsive.
- Revisar modulo Cargue (frontend web) en responsive.

