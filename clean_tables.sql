
-- Desactivar restricciones de clave foránea temporalmente
SET session_replication_role = replica;

-- Limpiar tablas
TRUNCATE TABLE api_registro_inventario CASCADE;
TRUNCATE TABLE api_lote CASCADE;

-- Reiniciar secuencias de ID
ALTER SEQUENCE api_registro_inventario_id_seq RESTART WITH 1;
ALTER SEQUENCE api_lote_id_seq RESTART WITH 1;

-- Reactivar restricciones de clave foránea
SET session_replication_role = DEFAULT;

-- Confirmar
SELECT 'Tablas limpiadas correctamente' AS mensaje;

