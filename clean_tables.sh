#!/bin/bash

echo "Limpiando tablas api_registro_inventario y api_lote..."

# Comando SQL para limpiar las tablas
SQL_COMMAND="
-- Desactivar restricciones de clave foránea temporalmente
SET session_replication_role = replica;

-- Limpiar tablas específicas
DELETE FROM api_registro_inventario;
DELETE FROM api_lote;

-- Reiniciar secuencias de ID
ALTER SEQUENCE api_registro_inventario_id_seq RESTART WITH 1;
ALTER SEQUENCE api_lote_id_seq RESTART WITH 1;

-- Reactivar restricciones de clave foránea
SET session_replication_role = DEFAULT;

-- Confirmar
SELECT 'Tablas limpiadas correctamente' AS mensaje;
"

# Ejecutar el comando SQL
echo "$SQL_COMMAND" | psql -U postgres -d fabrica

echo "Proceso completado."
