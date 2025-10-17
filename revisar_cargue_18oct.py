#!/usr/bin/env python
"""
Script para revisar Cargue del 18 de octubre de 2025
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6
from datetime import date

def revisar_cargue():
    """Revisar Cargue del 18 de octubre"""
    
    fecha = date(2025, 10, 18)
    
    print(f"\n{'='*60}")
    print(f"💰 REVISANDO CARGUE - {fecha}")
    print(f"{'='*60}\n")
    
    cargue_models = [
        ('ID1', CargueID1), ('ID2', CargueID2), ('ID3', CargueID3),
        ('ID4', CargueID4), ('ID5', CargueID5), ('ID6', CargueID6)
    ]
    
    encontrado = False
    
    for id_cargue, CargueModel in cargue_models:
        cargues = CargueModel.objects.filter(fecha=fecha)
        
        if cargues.exists():
            encontrado = True
            print(f"{'='*60}")
            print(f"📋 {id_cargue}")
            print(f"{'='*60}\n")
            
            for cargue in cargues:
                responsable = getattr(cargue, 'responsable', 'N/A')
                total_pedidos = float(getattr(cargue, 'total_pedidos', 0))
                total_efectivo = float(getattr(cargue, 'total_efectivo', 0))
                venta = float(getattr(cargue, 'venta', 0))
                
                print(f"Responsable: {responsable}")
                print(f"Venta: ${venta:,.0f}")
                print(f"Total Pedidos: ${total_pedidos:,.0f}")
                print(f"Total Efectivo: ${total_efectivo:,.0f}")
                
                if total_pedidos > 0:
                    print(f"⚠️ TIENE PEDIDOS CON VALOR")
                
                print()
    
    if not encontrado:
        print("⚠️ No hay registros en Cargue para esta fecha\n")

if __name__ == '__main__':
    revisar_cargue()
