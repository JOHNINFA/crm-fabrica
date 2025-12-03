#!/usr/bin/env python3
"""
Script para crear vistas SQL de compatibilidad
Ejecuta el archivo crear_vistas_compatibilidad.sql en PostgreSQL

Autor: Sistema
Fecha: 2025-12-03
"""

import os
import sys
import subprocess

# Configuración de base de datos (ajustar según tu configuración)
DB_NAME = 'fabrica'
DB_USER = 'postgres'
DB_HOST = 'localhost'
DB_PORT = '5432'

SQL_FILE = '/home/john/Escritorio/crm-fabrica/crear_vistas_compatibilidad.sql'

def ejecutar_sql():
    """Ejecutar el script SQL en PostgreSQL"""
    print("\n" + "="*80)
    print("🔧 Creando Vistas SQL de Compatibilidad")
    print("="*80 + "\n")
    
    if not os.path.exists(SQL_FILE):
        print(f"❌ ERROR: No se encontró el archivo {SQL_FILE}")
        return 1
    
    print(f"📄 Archivo SQL: {SQL_FILE}")
    print(f"🗄️  Base de datos: {DB_NAME}")
    print(f"👤 Usuario: {DB_USER}\n")
    
    # Construir comando psql
    cmd = [
        'psql',
        '-h', DB_HOST,
        '-p', DB_PORT,
        '-U', DB_USER,
        '-d', DB_NAME,
        '-f', SQL_FILE
    ]
    
    print(f"🚀 Ejecutando: {' '.join(cmd)}\n")
    print("="*80)
    
    try:
        # Ejecutar comando
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=False
        )
        
        # Mostrar salida
        if result.stdout:
            print(result.stdout)
        
        if result.stderr:
            print(result.stderr)
        
        if result.returncode == 0:
            print("\n" + "="*80)
            print("✅ Vistas SQL creadas exitosamente")
            print("="*80)
            
            print("\n📊 Vistas creadas:")
            print("   - api_cargueid1_view")
            print("   - api_cargueid2_view")
            print("   - api_cargueid3_view")
            print("   - api_cargueid4_view")
            print("   - api_cargueid5_view")
            print("   - api_cargueid6_view")
            
            return 0
        else:
            print("\n" + "="*80)
            print("❌ ERROR al crear vistas SQL")
            print("="*80)
            return 1
            
    except FileNotFoundError:
        print("❌ ERROR: No se encontró el comando 'psql'")
        print("   Asegúrate de tener PostgreSQL instalado.")
        return 1
    except Exception as e:
        print(f"❌ ERROR inesperado: {e}")
        return 1


if __name__ == '__main__':
    sys.exit(ejecutar_sql())
