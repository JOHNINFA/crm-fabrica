#!/usr/bin/env python
"""
Script para verificar todos los pedidos activos para la fecha 2025-10-18
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Pedido, Planeacion
from datetime import date

def verificar_pedidos_activos():
    """Verificar pedidos activos para la fecha"""
    
    fecha = date(2025, 10, 18)
    
    print(f"\n{'='*60}")
    print(f"📋 PEDIDOS PARA {fecha}")
    print(f"{'='*60}\n")
    
    # Buscar todos los pedidos para esa fecha
    pedidos = Pedido.objects.filter(fecha_entrega=fecha).order_by('numero_pedido')
    
    print(f"Total pedidos encontrados: {pedidos.count()}\n")
    
    for pedido in pedidos:
        print(f"{'='*60}")
        print(f"Pedido: {pedido.numero_pedido}")
        print(f"Estado: {pedido.estado}")
        print(f"Destinatario: {pedido.destinatario}")
        print(f"Vendedor: {pedido.vendedor}")
        print(f"Total: ${pedido.total}")
        print(f"Creado: {pedido.fecha_creacion}")
        
        print(f"\nProductos:")
        for detalle in pedido.detalles.all():
            print(f"  - {detalle.producto.nombre}: {detalle.cantidad} unidades")
        print()
    
    # Verificar Planeación
    print(f"\n{'='*60}")
    print(f"📊 PLANEACIÓN PARA {fecha}")
    print(f"{'='*60}\n")
    
    planeaciones = Planeacion.objects.filter(fecha=fecha).order_by('producto_nombre')
    
    if planeaciones.exists():
        print(f"Total registros: {planeaciones.count()}\n")
        for p in planeaciones:
            print(f"{p.producto_nombre}:")
            print(f"  Existencias: {p.existencias}")
            print(f"  Solicitadas: {p.solicitadas}")
            print(f"  Pedidos: {p.pedidos}")
            print(f"  Total: {p.total}")
            print()
    else:
        print("⚠️ No hay registros en Planeación para esta fecha\n")

if __name__ == '__main__':
    verificar_pedidos_activos()
