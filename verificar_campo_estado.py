#!/usr/bin/env python3
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from django.db import connection

def verificar_campo_estado():
    print("🔍 VERIFICANDO CAMPO ESTADO EN api_cargueoperativo...")
    
    with connection.cursor() as cursor:
        # Verificar estructura de la tabla
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'api_cargueoperativo' 
            AND column_name = 'estado';
        """)
        
        resultado = cursor.fetchone()
        
        if resultado:
            column_name, data_type, is_nullable, column_default = resultado
            print(f"✅ Campo encontrado:")
            print(f"   - Nombre: {column_name}")
            print(f"   - Tipo: {data_type}")
            print(f"   - Nullable: {is_nullable}")
            print(f"   - Default: {column_default}")
        else:
            print("❌ Campo 'estado' no encontrado")
            return
        
        # Verificar valores existentes
        cursor.execute("SELECT DISTINCT estado FROM api_cargueoperativo WHERE estado IS NOT NULL;")
        valores_existentes = cursor.fetchall()
        
        print(f"\n📊 Valores existentes en campo 'estado':")
        if valores_existentes:
            for valor in valores_existentes:
                print(f"   - '{valor[0]}'")
        else:
            print("   - No hay valores (todos NULL)")
        
        # Contar registros con estado NULL
        cursor.execute("SELECT COUNT(*) FROM api_cargueoperativo WHERE estado IS NULL;")
        count_null = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM api_cargueoperativo;")
        count_total = cursor.fetchone()[0]
        
        print(f"\n📈 Estadísticas:")
        print(f"   - Total registros: {count_total}")
        print(f"   - Registros con estado NULL: {count_null}")
        print(f"   - Registros con estado válido: {count_total - count_null}")
        
        # Si hay registros con NULL, sugerir actualización
        if count_null > 0:
            print(f"\n⚠️ PROBLEMA: {count_null} registros tienen estado NULL")
            print("💡 SOLUCIÓN: Actualizar registros NULL a un valor por defecto")
            
            respuesta = input("\n¿Quieres actualizar los registros NULL a 'COMPLETADO'? (s/n): ")
            if respuesta.lower() == 's':
                cursor.execute("UPDATE api_cargueoperativo SET estado = 'COMPLETADO' WHERE estado IS NULL;")
                print(f"✅ {count_null} registros actualizados a 'COMPLETADO'")
            else:
                print("❌ No se actualizaron los registros")

if __name__ == "__main__":
    verificar_campo_estado()