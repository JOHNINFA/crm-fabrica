#!/usr/bin/env python
"""
Script para limpiar datos incorrectos del 25 de noviembre de 2025
que fueron guardados cuando debían ser del 24 de noviembre.
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6

def limpiar_datos_25_noviembre():
    """Eliminar datos del 25 de noviembre de 2025 para LUNES"""
    
    fecha_incorrecta = '2025-11-25'
    dia = 'LUNES'
    
    modelos = {
        'CargueID1': CargueID1,
        'CargueID2': CargueID2,
        'CargueID3': CargueID3,
        'CargueID4': CargueID4,
        'CargueID5': CargueID5,
        'CargueID6': CargueID6,
    }
    
    print(f"🧹 Limpiando datos de {dia} {fecha_incorrecta}...")
    print("=" * 60)
    
    total_eliminados = 0
    
    for nombre_modelo, Modelo in modelos.items():
        # Buscar registros con esa fecha y día
        registros = Modelo.objects.filter(dia=dia, fecha=fecha_incorrecta)
        cantidad = registros.count()
        
        if cantidad > 0:
            print(f"\n📦 {nombre_modelo}:")
            print(f"   Encontrados: {cantidad} registros")
            
            # Mostrar algunos productos antes de eliminar
            productos_ejemplo = list(registros.values_list('producto', 'cantidad')[:5])
            for producto, cant in productos_ejemplo:
                print(f"   - {producto}: {cant}")
            
            if cantidad > 5:
                print(f"   ... y {cantidad - 5} más")
            
            # Eliminar
            registros.delete()
            print(f"   ✅ Eliminados: {cantidad} registros")
            total_eliminados += cantidad
        else:
            print(f"\n✓ {nombre_modelo}: Sin datos para eliminar")
    
    print("\n" + "=" * 60)
    print(f"✅ Total eliminados: {total_eliminados} registros")
    print(f"🎯 Ahora puedes enviar los datos correctos del LUNES 24 de noviembre")

if __name__ == '__main__':
    respuesta = input("⚠️  ¿Estás seguro de eliminar los datos del LUNES 25/11/2025? (si/no): ")
    
    if respuesta.lower() in ['si', 's', 'yes', 'y']:
        limpiar_datos_25_noviembre()
    else:
        print("❌ Operación cancelada")
