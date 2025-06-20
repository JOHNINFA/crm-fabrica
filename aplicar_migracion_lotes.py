#!/usr/bin/env python3
"""
Script para aplicar la migración de lotes y verificar la estructura de la base de datos.

Ejecutar desde la raíz del proyecto:
python aplicar_migracion_lotes.py
"""

import os
import sys
import django
from django.core.management import execute_from_command_line

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

def main():
    print("🔧 Aplicando migración para tabla de lotes...")
    
    try:
        # Aplicar migraciones
        execute_from_command_line(['manage.py', 'makemigrations'])
        execute_from_command_line(['manage.py', 'migrate'])
        
        print("✅ Migración aplicada correctamente")
        
        # Verificar estructura de la tabla
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'api_lote' 
                ORDER BY ordinal_position;
            """)
            
            print("\n📋 Estructura de la tabla api_lote:")
            print("Campo                | Tipo      | Nullable")
            print("-" * 45)
            
            for row in cursor.fetchall():
                column_name, data_type, is_nullable = row
                nullable = "Sí" if is_nullable == "YES" else "No"
                print(f"{column_name:<20} | {data_type:<9} | {nullable}")
        
        print("\n🎯 La tabla api_lote está lista para usar!")
        print("Endpoints disponibles:")
        print("- GET    /api/lotes/                    - Listar lotes")
        print("- POST   /api/lotes/                    - Crear lote")
        print("- GET    /api/lotes/{id}/               - Obtener lote")
        print("- PATCH  /api/lotes/{id}/               - Actualizar lote")
        print("- DELETE /api/lotes/{id}/               - Eliminar lote")
        print("- GET    /api/lotes/?producto={id}      - Lotes por producto")
        print("- GET    /api/lotes/?fecha_ingreso={fecha} - Lotes por fecha")
        
    except Exception as e:
        print(f"❌ Error al aplicar migración: {e}")
        return 1
    
    return 0

if __name__ == '__main__':
    sys.exit(main())