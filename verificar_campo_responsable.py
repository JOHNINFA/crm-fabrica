#!/usr/bin/env python3
"""
Script para verificar que el campo 'responsable' se agregó correctamente 
a todas las tablas CargueID1-ID6
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from django.db import connection
from api.models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6

def verificar_campo_responsable():
    """Verificar que el campo responsable existe en todas las tablas"""
    
    modelos = [
        ('CargueID1', CargueID1),
        ('CargueID2', CargueID2),
        ('CargueID3', CargueID3),
        ('CargueID4', CargueID4),
        ('CargueID5', CargueID5),
        ('CargueID6', CargueID6),
    ]
    
    print("🔍 VERIFICANDO CAMPO RESPONSABLE EN MODELOS DJANGO")
    print("=" * 60)
    
    for nombre, modelo in modelos:
        try:
            # Verificar que el campo existe en el modelo
            campo_responsable = modelo._meta.get_field('responsable')
            print(f"✅ {nombre}: Campo 'responsable' encontrado")
            print(f"   - Tipo: {campo_responsable.__class__.__name__}")
            print(f"   - Max length: {campo_responsable.max_length}")
            print(f"   - Default: {campo_responsable.default}")
            print(f"   - Blank: {campo_responsable.blank}")
            
        except Exception as e:
            print(f"❌ {nombre}: Error - {e}")
        
        print()
    
    print("\n🔍 VERIFICANDO CAMPO RESPONSABLE EN BASE DE DATOS")
    print("=" * 60)
    
    # Verificar en la base de datos directamente
    with connection.cursor() as cursor:
        tablas = [
            'api_cargueid1',
            'api_cargueid2', 
            'api_cargueid3',
            'api_cargueid4',
            'api_cargueid5',
            'api_cargueid6'
        ]
        
        for tabla in tablas:
            try:
                # Obtener información de las columnas
                cursor.execute(f"""
                    SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
                    FROM information_schema.columns 
                    WHERE table_name = '{tabla}' AND column_name = 'responsable'
                """)
                
                resultado = cursor.fetchone()
                
                if resultado:
                    column_name, data_type, max_length, default, nullable = resultado
                    print(f"✅ {tabla}: Campo 'responsable' encontrado en BD")
                    print(f"   - Tipo: {data_type}")
                    print(f"   - Max length: {max_length}")
                    print(f"   - Default: {default}")
                    print(f"   - Nullable: {nullable}")
                else:
                    print(f"❌ {tabla}: Campo 'responsable' NO encontrado en BD")
                    
            except Exception as e:
                print(f"❌ {tabla}: Error consultando BD - {e}")
            
            print()

def probar_insercion():
    """Probar que se puede insertar un registro con el campo responsable"""
    
    print("\n🧪 PROBANDO INSERCIÓN CON CAMPO RESPONSABLE")
    print("=" * 60)
    
    try:
        # Crear un registro de prueba en CargueID1
        registro_prueba = CargueID1.objects.create(
            dia='LUNES',
            producto='AREPA PRUEBA',
            cantidad=10,
            responsable='JUAN PEREZ',  # ✅ Usando el nuevo campo
            usuario='Script de Prueba'
        )
        
        print(f"✅ Registro creado exitosamente:")
        print(f"   - ID: {registro_prueba.id}")
        print(f"   - Día: {registro_prueba.dia}")
        print(f"   - Producto: {registro_prueba.producto}")
        print(f"   - Responsable: {registro_prueba.responsable}")
        print(f"   - Usuario: {registro_prueba.usuario}")
        
        # Eliminar el registro de prueba
        registro_prueba.delete()
        print(f"✅ Registro de prueba eliminado")
        
    except Exception as e:
        print(f"❌ Error en inserción de prueba: {e}")

if __name__ == '__main__':
    verificar_campo_responsable()
    probar_insercion()
    print("\n🎉 VERIFICACIÓN COMPLETADA")