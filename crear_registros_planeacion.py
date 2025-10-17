#!/usr/bin/env python
"""
Script para crear registros en Planeación para el pedido PED-000010
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Pedido, Planeacion, Producto
from django.db import transaction

def crear_registros_planeacion():
    """Crear registros en Planeación para productos del pedido"""
    
    try:
        pedido = Pedido.objects.get(numero_pedido='PED-000010')
        
        print(f"\n{'='*60}")
        print(f"📋 CREANDO REGISTROS EN PLANEACIÓN")
        print(f"{'='*60}")
        print(f"Fecha: {pedido.fecha_entrega}")
        print(f"Pedido: {pedido.numero_pedido}")
        
        with transaction.atomic():
            for detalle in pedido.detalles.all():
                # Buscar o crear registro en Planeación
                planeacion, created = Planeacion.objects.get_or_create(
                    fecha=pedido.fecha_entrega,
                    producto_nombre=detalle.producto.nombre,
                    defaults={
                        'existencias': 0,
                        'solicitadas': 0,
                        'pedidos': 0,
                        'orden': 0,
                        'ia': 0,
                        'usuario': 'Sistema'
                    }
                )
                
                if created:
                    print(f"\n✅ Registro CREADO para {detalle.producto.nombre}")
                else:
                    print(f"\n✅ Registro ENCONTRADO para {detalle.producto.nombre}")
                
                print(f"   Pedidos antes: {planeacion.pedidos}")
                print(f"   Total antes: {planeacion.total}")
                
                # NO sumar porque el pedido ya está anulado
                # Solo mostrar información
                print(f"   ⚠️ Pedido está ANULADO, no se suman cantidades")
                print(f"   Pedidos después: {planeacion.pedidos}")
                print(f"   Total después: {planeacion.total}")
        
        print(f"\n{'='*60}")
        print(f"✅ REGISTROS CREADOS")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    crear_registros_planeacion()
