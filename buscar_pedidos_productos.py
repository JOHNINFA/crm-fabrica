#!/usr/bin/env python
"""
Script para buscar pedidos con AREPA TIPO OBLEA y AREPA MEDIANA
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Pedido, DetallePedido, Producto
from datetime import date, timedelta

def buscar_pedidos():
    """Buscar pedidos con los productos específicos"""
    
    # Buscar productos
    productos_buscar = ['AREPA TIPO OBLEA 500Gr', 'AREPA MEDIANA 330Gr']
    
    print(f"\n{'='*60}")
    print(f"🔍 BUSCANDO PEDIDOS CON:")
    print(f"{'='*60}")
    for p in productos_buscar:
        print(f"  - {p}")
    
    # Fecha de referencia
    fecha_ref = date(2025, 10, 18)
    fecha_inicio = fecha_ref - timedelta(days=7)
    fecha_fin = fecha_ref + timedelta(days=7)
    
    print(f"\nRango de fechas: {fecha_inicio} a {fecha_fin}\n")
    
    # Buscar detalles de pedidos
    for nombre_producto in productos_buscar:
        try:
            producto = Producto.objects.get(nombre=nombre_producto)
            
            print(f"\n{'='*60}")
            print(f"📦 {nombre_producto}")
            print(f"{'='*60}\n")
            
            detalles = DetallePedido.objects.filter(
                producto=producto,
                pedido__fecha_entrega__gte=fecha_inicio,
                pedido__fecha_entrega__lte=fecha_fin
            ).select_related('pedido')
            
            if detalles.exists():
                print(f"Encontrados {detalles.count()} pedidos:\n")
                
                for detalle in detalles:
                    pedido = detalle.pedido
                    print(f"  Pedido: {pedido.numero_pedido}")
                    print(f"  Estado: {pedido.estado}")
                    print(f"  Fecha entrega: {pedido.fecha_entrega}")
                    print(f"  Destinatario: {pedido.destinatario}")
                    print(f"  Cantidad: {detalle.cantidad}")
                    print()
            else:
                print("  ⚠️ No se encontraron pedidos\n")
                
        except Producto.DoesNotExist:
            print(f"  ❌ Producto no encontrado: {nombre_producto}\n")

if __name__ == '__main__':
    buscar_pedidos()
