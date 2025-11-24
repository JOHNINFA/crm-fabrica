#!/usr/bin/env python
"""
Script para limpiar completamente la tabla api_cargueid1
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1

def limpiar_tabla_completa():
    """Eliminar todos los registros de CargueID1"""
    
    print("🧹 Limpiando tabla api_cargueid1...")
    print("=" * 60)
    
    # Contar registros antes de eliminar
    total_registros = CargueID1.objects.count()
    
    if total_registros == 0:
        print("✅ La tabla ya está vacía")
        return
    
    print(f"📦 Total de registros encontrados: {total_registros}")
    
    # Mostrar algunos ejemplos
    ejemplos = CargueID1.objects.all()[:5]
    print("\n📋 Ejemplos de registros a eliminar:")
    for reg in ejemplos:
        print(f"   - {reg.dia} {reg.fecha} - {reg.producto}: {reg.cantidad}")
    
    if total_registros > 5:
        print(f"   ... y {total_registros - 5} más")
    
    # Eliminar todos
    CargueID1.objects.all().delete()
    
    print("\n" + "=" * 60)
    print(f"✅ Tabla limpiada: {total_registros} registros eliminados")
    print("🎯 Ahora puedes hacer pruebas limpias desde la app")

if __name__ == '__main__':
    respuesta = input("⚠️  ¿Estás seguro de eliminar TODOS los registros de api_cargueid1? (si/no): ")
    
    if respuesta.lower() in ['si', 's', 'yes', 'y']:
        limpiar_tabla_completa()
    else:
        print("❌ Operación cancelada")
