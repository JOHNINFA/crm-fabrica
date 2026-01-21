#!/bin/bash

# Configuración
BACKUP_DIR="/root/backups/db"
CONTAINER_NAME="crm_postgres_prod"
DB_USER="postgres"
DB_NAME="fabrica"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Ejecutar backup
echo "📦 Iniciando backup de base de datos..."
docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME | gzip > $FILENAME

# Verificar éxito
if [ $? -eq 0 ]; then
  echo "✅ Backup completado exitosamente: $FILENAME"
  
  # Borrar backups antiguos (más de 30 días)
  find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete
  echo "🧹 Limpieza de archivos antiguos completada."
else
  echo "❌ Error al crear backup de la base de datos."
fi
