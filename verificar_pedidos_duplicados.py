#!/usr/bin/env python
"""
Script para verificar si hay pedidos duplicados
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Pedido
from datetime import date

def verificar_duplicados():
    """Verificar pedidos duplicados"""
    
    fecha = date(2025, 10, 18)
    
    print(f"\n{'='*60}")
    print(f"🔍 VERIFICANDO PEDIDOS - {fecha}")
    print(f"{'='*60}\n")
    
    # Buscar TODOS los pedidos (incluyendo anulados)
    pedidos = Pedido.objects.filter(fecha_entrega=fecha).order_by('numero_pedido')
    
    print(f"Total pedidos (todos): {pedidos.count()}\n")
    
    for pedido in pedidos:
        print(f"Pedido: {pedido.numero_pedido}")
        print(f"  Estado: {pedido.estado}")
        print(f"  Vendedor: {pedido.vendedor}")
        print(f"  Destinatario: {pedido.destinatario}")
        print(f"  Total: ${pedido.total}")
        print(f"  Creado: {pedido.fecha_creacion}")
        print()
    
    # Verificar si hay duplicados por destinatario
    print(f"{'='*60}")
    print(f"🔍 VERIFICANDO DUPLICADOS POR DESTINATARIO")
    print(f"{'='*60}\n")
    
    destinatarios = {}
    for pedido in pedidos:
        if pedido.destinatario not in destinatarios:
            destinatarios[pedido.destinatario] = []
        destinatarios[pedido.destinatario].append(pedido)
    
    for dest, lista_pedidos in destinatarios.items():
        if len(lista_pedidos) > 1:
            print(f"⚠️ DUPLICADO: {dest} tiene {len(lista_pedidos)} pedidos:")
            for p in lista_pedidos:
                print(f"  - {p.numero_pedido} ({p.estado}) - ${p.total}")
            print()

if __name__ == '__main__':
    verificar_duplicados()
