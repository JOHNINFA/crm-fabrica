#!/usr/bin/env python
"""
Script para verificar datos en Planeación y Cargue
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Pedido, Planeacion, CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6
from datetime import date

def verificar_datos():
    """Verificar datos en Planeación y Cargue"""
    
    # Buscar el pedido
    pedido = Pedido.objects.get(numero_pedido='PED-000010')
    
    print(f"\n{'='*60}")
    print(f"📋 PEDIDO PED-000010")
    print(f"{'='*60}")
    print(f"Fecha entrega: {pedido.fecha_entrega}")
    print(f"Vendedor: {pedido.vendedor}")
    print(f"Total: ${pedido.total}")
    
    print(f"\n📦 Productos en el pedido:")
    for detalle in pedido.detalles.all():
        print(f"  - {detalle.producto.nombre}: {detalle.cantidad} unidades")
    
    # Verificar Planeación
    print(f"\n{'='*60}")
    print(f"📊 PLANEACIÓN para {pedido.fecha_entrega}")
    print(f"{'='*60}")
    
    planeaciones = Planeacion.objects.filter(fecha=pedido.fecha_entrega)
    
    if planeaciones.exists():
        print(f"Total registros: {planeaciones.count()}")
        for p in planeaciones:
            print(f"  - {p.producto_nombre}: Pedidos={p.pedidos}, Total={p.total}")
    else:
        print("⚠️ No hay registros en Planeación para esta fecha")
    
    # Verificar Cargue
    print(f"\n{'='*60}")
    print(f"💰 CARGUE para {pedido.fecha_entrega}")
    print(f"{'='*60}")
    
    cargue_models = [
        ('ID1', CargueID1), ('ID2', CargueID2), ('ID3', CargueID3),
        ('ID4', CargueID4), ('ID5', CargueID5), ('ID6', CargueID6)
    ]
    
    for id_cargue, CargueModel in cargue_models:
        cargues = CargueModel.objects.filter(fecha=pedido.fecha_entrega)
        
        if cargues.exists():
            print(f"\n{id_cargue}:")
            for c in cargues:
                responsable = getattr(c, 'responsable', 'N/A')
                total_pedidos = getattr(c, 'total_pedidos', 0)
                total_efectivo = getattr(c, 'total_efectivo', 0)
                print(f"  Responsable: {responsable}")
                print(f"  Total Pedidos: ${total_pedidos}")
                print(f"  Total Efectivo: ${total_efectivo}")
    
    # Verificar si el pedido se creó antes o después de la lógica
    print(f"\n{'='*60}")
    print(f"📅 FECHAS")
    print(f"{'='*60}")
    print(f"Pedido creado: {pedido.fecha_creacion}")
    print(f"Pedido actualizado: {pedido.fecha_actualizacion}")

if __name__ == '__main__':
    verificar_datos()
