#!/usr/bin/env python
"""
Script para buscar todos los registros de Planeación con pedidos > 0
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Planeacion

def buscar_planeacion_con_pedidos():
    """Buscar registros con pedidos > 0"""
    
    print(f"\n{'='*60}")
    print(f"🔍 BUSCANDO REGISTROS CON PEDIDOS > 0")
    print(f"{'='*60}\n")
    
    # Buscar registros con pedidos
    planeaciones = Planeacion.objects.filter(pedidos__gt=0).order_by('fecha', 'producto_nombre')
    
    if not planeaciones.exists():
        print("⚠️ No hay registros con pedidos > 0\n")
        return
    
    print(f"Total registros encontrados: {planeaciones.count()}\n")
    
    # Agrupar por fecha
    fecha_actual = None
    
    for p in planeaciones:
        if fecha_actual != p.fecha:
            if fecha_actual is not None:
                print()
            fecha_actual = p.fecha
            print(f"{'='*60}")
            print(f"📅 FECHA: {p.fecha}")
            print(f"{'='*60}")
        
        print(f"\n{p.producto_nombre}:")
        print(f"  Existencias: {p.existencias}")
        print(f"  Solicitadas: {p.solicitadas}")
        print(f"  Pedidos: {p.pedidos}")
        print(f"  Total: {p.total}")
    
    print(f"\n{'='*60}\n")

if __name__ == '__main__':
    buscar_planeacion_con_pedidos()
