-- Limpiar datos y dejar solo un producto
DELETE FROM api_movimientoinventario;
DELETE FROM api_lote;
DELETE FROM api_producto WHERE nombre != 'AREPA';

-- Asegurar que AREPA tenga los valores correctos
UPDATE api_producto 
SET nombre = 'AREPA', marca = 'GENERICA', stock_total = 3,
    precio_compra = 0, precio = 2900, impuesto = 'IVA(0%)', activo = true
WHERE nombre = 'AREPA';

-- Mantener solo categorías básicas
DELETE FROM api_categoria WHERE nombre NOT IN ('General', 'Arepas', 'Servicios');