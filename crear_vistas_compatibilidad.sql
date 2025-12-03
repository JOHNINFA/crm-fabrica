-- ================================================================
-- Script SQL: Crear Vistas de Compatibilidad
-- Propósito: Emular tablas antiguas api_cargueid1-6 usando nuevas tablas normalizadas
-- Fecha: 2025-12-03
-- ================================================================

-- IMPORTANTE: Primero renombrar las tablas antiguas para liberar los nombres
-- Esto se hará desde Django con una migración

-- ================================================================
-- VISTA: api_cargueid1_view (Emula api_cargueid1)
-- ================================================================

CREATE OR REPLACE VIEW api_cargueid1_view AS
SELECT 
    -- ID y metadatos del producto
    p.id,
    p.vendedor_id,
    p.dia,
    p.fecha,
    
    -- Checkboxes
    p.v,
    p.d,
    
    -- Datos del producto
    p.producto,
    p.cantidad,
    p.dctos,
    p.adicional,
    p.devoluciones,
    p.vencidas,
    p.lotes_vencidos,
    p.lotes_produccion,
    p.total,
    p.valor,
    p.neto,
    
    -- Pagos (de la tabla de pagos, puede ser NULL)
    COALESCE(pag.concepto, '') as concepto,
    COALESCE(pag.descuentos, 0) as descuentos,
    COALESCE(pag.nequi, 0) as nequi,
    COALESCE(pag.daviplata, 0) as daviplata,
    
    -- Resumen (de la tabla de resumen, puede ser NULL)
    COALESCE(r.base_caja, 0) as base_caja,
    COALESCE(r.total_despacho, 0) as total_despacho,
    COALESCE(r.total_pedidos, 0) as total_pedidos,
    COALESCE(r.total_dctos, 0) as total_dctos,
    COALESCE(r.venta, 0) as venta,
    COALESCE(r.total_efectivo, 0) as total_efectivo,
    
    -- Cumplimiento (de la tabla de cumplimiento, puede ser NULL)
    c.licencia_transporte,
    c.soat,
    c.uniforme,
    c.no_locion,
    c.no_accesorios,
    c.capacitacion_carnet,
    c.higiene,
    c.estibas,
    c.desinfeccion,
    
    -- Metadatos
    p.usuario,
    p.responsable,
    p.ruta,
    p.activo,
    p.fecha_creacion,
    p.fecha_actualizacion

FROM api_cargue_productos p
LEFT JOIN api_cargue_resumen r 
    ON p.vendedor_id = r.vendedor_id 
    AND p.dia = r.dia 
    AND p.fecha = r.fecha
LEFT JOIN api_cargue_pagos pag 
    ON p.vendedor_id = pag.vendedor_id 
    AND p.dia = pag.dia 
    AND p.fecha = pag.fecha
LEFT JOIN api_cargue_cumplimiento c 
    ON p.vendedor_id = c.vendedor_id 
    AND p.dia = c.dia 
    AND p.fecha = c.fecha

WHERE p.vendedor_id = 'ID1';

-- ================================================================
-- VISTA: api_cargueid2_view (Emula api_cargueid2)
-- ================================================================

CREATE OR REPLACE VIEW api_cargueid2_view AS
SELECT 
    p.id, p.vendedor_id, p.dia, p.fecha, p.v, p.d,
    p.producto, p.cantidad, p.dctos, p.adicional, p.devoluciones, p.vencidas,
    p.lotes_vencidos, p.lotes_produccion, p.total, p.valor, p.neto,
    COALESCE(pag.concepto, '') as concepto,
    COALESCE(pag.descuentos, 0) as descuentos,
    COALESCE(pag.nequi, 0) as nequi,
    COALESCE(pag.daviplata, 0) as daviplata,
    COALESCE(r.base_caja, 0) as base_caja,
    COALESCE(r.total_despacho, 0) as total_despacho,
    COALESCE(r.total_pedidos, 0) as total_pedidos,
    COALESCE(r.total_dctos, 0) as total_dctos,
    COALESCE(r.venta, 0) as venta,
    COALESCE(r.total_efectivo, 0) as total_efectivo,
    c.licencia_transporte, c.soat, c.uniforme, c.no_locion,
    c.no_accesorios, c.capacitacion_carnet, c.higiene, c.estibas, c.desinfeccion,
    p.usuario, p.responsable, p.ruta, p.activo, p.fecha_creacion, p.fecha_actualizacion
FROM api_cargue_productos p
LEFT JOIN api_cargue_resumen r ON p.vendedor_id = r.vendedor_id AND p.dia = r.dia AND p.fecha = r.fecha
LEFT JOIN api_cargue_pagos pag ON p.vendedor_id = pag.vendedor_id AND p.dia = pag.dia AND p.fecha = pag.fecha
LEFT JOIN api_cargue_cumplimiento c ON p.vendedor_id = c.vendedor_id AND p.dia = c.dia AND p.fecha = c.fecha
WHERE p.vendedor_id = 'ID2';

-- ================================================================
-- VISTA: api_cargueid3_view (Emula api_cargueid3)
-- ================================================================

CREATE OR REPLACE VIEW api_cargueid3_view AS
SELECT 
    p.id, p.vendedor_id, p.dia, p.fecha, p.v, p.d,
    p.producto, p.cantidad, p.dctos, p.adicional, p.devoluciones, p.vencidas,
    p.lotes_vencidos, p.lotes_produccion, p.total, p.valor, p.neto,
    COALESCE(pag.concepto, '') as concepto,
    COALESCE(pag.descuentos, 0) as descuentos,
    COALESCE(pag.nequi, 0) as nequi,
    COALESCE(pag.daviplata, 0) as daviplata,
    COALESCE(r.base_caja, 0) as base_caja,
    COALESCE(r.total_despacho, 0) as total_despacho,
    COALESCE(r.total_pedidos, 0) as total_pedidos,
    COALESCE(r.total_dctos, 0) as total_dctos,
    COALESCE(r.venta, 0) as venta,
    COALESCE(r.total_efectivo, 0) as total_efectivo,
    c.licencia_transporte, c.soat, c.uniforme, c.no_locion,
    c.no_accesorios, c.capacitacion_carnet, c.higiene, c.estibas, c.desinfeccion,
    p.usuario, p.responsable, p.ruta, p.activo, p.fecha_creacion, p.fecha_actualizacion
FROM api_cargue_productos p
LEFT JOIN api_cargue_resumen r ON p.vendedor_id = r.vendedor_id AND p.dia = r.dia AND p.fecha = r.fecha
LEFT JOIN api_cargue_pagos pag ON p.vendedor_id = pag.vendedor_id AND p.dia = pag.dia AND p.fecha = pag.fecha
LEFT JOIN api_cargue_cumplimiento c ON p.vendedor_id = c.vendedor_id AND p.dia = c.dia AND p.fecha = c.fecha
WHERE p.vendedor_id = 'ID3';

-- ================================================================
-- VISTA: api_cargueid4_view (Emula api_cargueid4)
-- ================================================================

CREATE OR REPLACE VIEW api_cargueid4_view AS
SELECT 
    p.id, p.vendedor_id, p.dia, p.fecha, p.v, p.d,
    p.producto, p.cantidad, p.dctos, p.adicional, p.devoluciones, p.vencidas,
    p.lotes_vencidos, p.lotes_produccion, p.total, p.valor, p.neto,
    COALESCE(pag.concepto, '') as concepto,
    COALESCE(pag.descuentos, 0) as descuentos,
    COALESCE(pag.nequi, 0) as nequi,
    COALESCE(pag.daviplata, 0) as daviplata,
    COALESCE(r.base_caja, 0) as base_caja,
    COALESCE(r.total_despacho, 0) as total_despacho,
    COALESCE(r.total_pedidos, 0) as total_pedidos,
    COALESCE(r.total_dctos, 0) as total_dctos,
    COALESCE(r.venta, 0) as venta,
    COALESCE(r.total_efectivo, 0) as total_efectivo,
    c.licencia_transporte, c.soat, c.uniforme, c.no_locion,
    c.no_accesorios, c.capacitacion_carnet, c.higiene, c.estibas, c.desinfeccion,
    p.usuario, p.responsable, p.ruta, p.activo, p.fecha_creacion, p.fecha_actualizacion
FROM api_cargue_productos p
LEFT JOIN api_cargue_resumen r ON p.vendedor_id = r.vendedor_id AND p.dia = r.dia AND p.fecha = r.fecha
LEFT JOIN api_cargue_pagos pag ON p.vendedor_id = pag.vendedor_id AND p.dia = pag.dia AND p.fecha = pag.fecha
LEFT JOIN api_cargue_cumplimiento c ON p.vendedor_id = c.vendedor_id AND p.dia = c.dia AND p.fecha = c.fecha
WHERE p.vendedor_id = 'ID4';

-- ================================================================
-- VISTA: api_cargueid5_view (Emula api_cargueid5)
-- ================================================================

CREATE OR REPLACE VIEW api_cargueid5_view AS
SELECT 
    p.id, p.vendedor_id, p.dia, p.fecha, p.v, p.d,
    p.producto, p.cantidad, p.dctos, p.adicional, p.devoluciones, p.vencidas,
    p.lotes_vencidos, p.lotes_produccion, p.total, p.valor, p.neto,
    COALESCE(pag.concepto, '') as concepto,
    COALESCE(pag.descuentos, 0) as descuentos,
    COALESCE(pag.nequi, 0) as nequi,
    COALESCE(pag.daviplata, 0) as daviplata,
    COALESCE(r.base_caja, 0) as base_caja,
    COALESCE(r.total_despacho, 0) as total_despacho,
    COALESCE(r.total_pedidos, 0) as total_pedidos,
    COALESCE(r.total_dctos, 0) as total_dctos,
    COALESCE(r.venta, 0) as venta,
    COALESCE(r.total_efectivo, 0) as total_efectivo,
    c.licencia_transporte, c.soat, c.uniforme, c.no_locion,
    c.no_accesorios, c.capacitacion_carnet, c.higiene, c.estibas, c.desinfeccion,
    p.usuario, p.responsable, p.ruta, p.activo, p.fecha_creacion, p.fecha_actualizacion
FROM api_cargue_productos p
LEFT JOIN api_cargue_resumen r ON p.vendedor_id = r.vendedor_id AND p.dia = r.dia AND p.fecha = r.fecha
LEFT JOIN api_cargue_pagos pag ON p.vendedor_id = pag.vendedor_id AND p.dia = pag.dia AND p.fecha = pag.fecha
LEFT JOIN api_cargue_cumplimiento c ON p.vendedor_id = c.vendedor_id AND p.dia = c.dia AND p.fecha = c.fecha
WHERE p.vendedor_id = 'ID5';

-- ================================================================
-- VISTA: api_cargueid6_view (Emula api_cargueid6)
-- ================================================================

CREATE OR REPLACE VIEW api_cargueid6_view AS
SELECT 
    p.id, p.vendedor_id, p.dia, p.fecha, p.v, p.d,
    p.producto, p.cantidad, p.dctos, p.adicional, p.devoluciones, p.vencidas,
    p.lotes_vencidos, p.lotes_produccion, p.total, p.valor, p.neto,
    COALESCE(pag.concepto, '') as concepto,
    COALESCE(pag.descuentos, 0) as descuentos,
    COALESCE(pag.nequi, 0) as nequi,
    COALESCE(pag.daviplata, 0) as daviplata,
    COALESCE(r.base_caja, 0) as base_caja,
    COALESCE(r.total_despacho, 0) as total_despacho,
    COALESCE(r.total_pedidos, 0) as total_pedidos,
    COALESCE(r.total_dctos, 0) as total_dctos,
    COALESCE(r.venta, 0) as venta,
    COALESCE(r.total_efectivo, 0) as total_efectivo,
    c.licencia_transporte, c.soat, c.uniforme, c.no_locion,
    c.no_accesorios, c.capacitacion_carnet, c.higiene, c.estibas, c.desinfeccion,
    p.usuario, p.responsable, p.ruta, p.activo, p.fecha_creacion, p.fecha_actualizacion
FROM api_cargue_productos p
LEFT JOIN api_cargue_resumen r ON p.vendedor_id = r.vendedor_id AND p.dia = r.dia AND p.fecha = r.fecha
LEFT JOIN api_cargue_pagos pag ON p.vendedor_id = pag.vendedor_id AND p.dia = pag.dia AND p.fecha = pag.fecha
LEFT JOIN api_cargue_cumplimiento c ON p.vendedor_id = c.vendedor_id AND p.dia = c.dia AND p.fecha = c.fecha
WHERE p.vendedor_id = 'ID6';

-- ================================================================
-- FIN DEL SCRIPT
-- ================================================================

-- NOTA: Este script crea VISTAS, no tablas.
-- Las vistas son "virtuales" - solo muestran datos de otras tablas.
-- No ocupan espacio adicional en disco.
-- Se actualizan automáticamente cuando las tablas base cambian.
