#!/usr/bin/env python
"""
Script para recalcular Planeación basándose en TODOS los pedidos activos
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Pedido, Planeacion, Producto
from django.db import transaction
from collections import defaultdict

def recalcular_planeacion():
    """Recalcular Planeación desde cero basándose en pedidos activos"""
    
    print(f"\n{'='*60}")
    print(f"🔄 RECALCULANDO PLANEACIÓN COMPLETA")
    print(f"{'='*60}\n")
    
    # Obtener todos los pedidos NO anulados
    pedidos_activos = Pedido.objects.exclude(estado='ANULADA').filter(fecha_entrega__isnull=False)
    
    print(f"📋 Pedidos activos encontrados: {pedidos_activos.count()}\n")
    
    # Agrupar por fecha y producto
    pedidos_por_fecha_producto = defaultdict(lambda: defaultdict(int))
    
    for pedido in pedidos_activos:
        print(f"  Procesando {pedido.numero_pedido} - {pedido.destinatario} - {pedido.fecha_entrega}")
        
        for detalle in pedido.detalles.all():
            key = (pedido.fecha_entrega, detalle.producto.nombre)
            pedidos_por_fecha_producto[key]['cantidad'] += detalle.cantidad
            pedidos_por_fecha_producto[key]['pedidos_list'] = pedidos_por_fecha_producto[key].get('pedidos_list', [])
            pedidos_por_fecha_producto[key]['pedidos_list'].append(pedido.numero_pedido)
    
    print(f"\n{'='*60}")
    print(f"📊 ACTUALIZANDO PLANEACIÓN")
    print(f"{'='*60}\n")
    
    with transaction.atomic():
        for (fecha, producto_nombre), data in pedidos_por_fecha_producto.items():
            cantidad = data['cantidad']
            pedidos_list = data['pedidos_list']
            
            # Buscar o crear registro en Planeación
            planeacion, created = Planeacion.objects.get_or_create(
                fecha=fecha,
                producto_nombre=producto_nombre,
                defaults={
                    'existencias': 0,
                    'solicitadas': 0,
                    'pedidos': 0,
                    'orden': 0,
                    'ia': 0,
                    'usuario': 'Sistema'
                }
            )
            
            pedidos_antes = planeacion.pedidos
            
            # Actualizar cantidad de pedidos
            planeacion.pedidos = cantidad
            planeacion.save()  # El total se calcula automáticamente
            
            status = "CREADO" if created else "ACTUALIZADO"
            print(f"✅ {status}: {producto_nombre} - {fecha}")
            print(f"   Pedidos: {pedidos_antes} → {planeacion.pedidos}")
            print(f"   Total: {planeacion.total}")
            print(f"   Pedidos incluidos: {', '.join(pedidos_list)}")
            print()
    
    print(f"{'='*60}")
    print(f"✅ RECALCULACIÓN COMPLETADA")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    recalcular_planeacion()
