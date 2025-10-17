#!/usr/bin/env python
"""
Script para verificar cuántos registros hay en Cargue para el 18 de octubre
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1, Pedido
from datetime import date

def verificar_registros():
    """Verificar registros en Cargue"""
    
    fecha = date(2025, 10, 18)
    
    print(f"\n{'='*60}")
    print(f"🔍 VERIFICANDO CARGUE ID1 - {fecha}")
    print(f"{'='*60}\n")
    
    # Buscar registros
    cargues = CargueID1.objects.filter(fecha=fecha)
    
    print(f"Total registros encontrados: {cargues.count()}\n")
    
    for i, cargue in enumerate(cargues, 1):
        print(f"Registro #{i}:")
        print(f"  ID: {cargue.id}")
        print(f"  Responsable: {cargue.responsable}")
        print(f"  Total Pedidos: ${cargue.total_pedidos}")
        print(f"  Total Efectivo: ${cargue.total_efectivo}")
        print(f"  Venta: ${cargue.venta}")
        print()
    
    # Verificar pedidos
    print(f"{'='*60}")
    print(f"📋 PEDIDOS ACTIVOS PARA {fecha}")
    print(f"{'='*60}\n")
    
    pedidos = Pedido.objects.filter(fecha_entrega=fecha).exclude(estado='ANULADA')
    
    print(f"Total pedidos activos: {pedidos.count()}\n")
    
    for pedido in pedidos:
        print(f"Pedido: {pedido.numero_pedido}")
        print(f"  Vendedor: {pedido.vendedor}")
        print(f"  Total: ${pedido.total}")
        print()

if __name__ == '__main__':
    verificar_registros()
