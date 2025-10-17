#!/usr/bin/env python
"""
Script para corregir manualmente el pedido PED-000010 anulado
Revierte las cantidades en Planeación y el dinero en Cargue
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Pedido, Planeacion, CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6
from django.db import transaction

def corregir_pedido_anulado(numero_pedido='PED-000010'):
    """Corregir un pedido anulado que no revirtió correctamente"""
    
    try:
        # Buscar el pedido
        pedido = Pedido.objects.get(numero_pedido=numero_pedido)
        
        print(f"\n{'='*60}")
        print(f"📋 INFORMACIÓN DEL PEDIDO {numero_pedido}")
        print(f"{'='*60}")
        print(f"Estado: {pedido.estado}")
        print(f"Destinatario: {pedido.destinatario}")
        print(f"Vendedor: {pedido.vendedor}")
        print(f"Total: ${pedido.total}")
        print(f"Fecha entrega: {pedido.fecha_entrega}")
        print(f"Detalles: {pedido.detalles.count()} productos")
        
        if pedido.estado != 'ANULADA':
            print(f"\n⚠️ El pedido NO está anulado. Estado actual: {pedido.estado}")
            return
        
        # Confirmar acción
        print(f"\n{'='*60}")
        print(f"🔄 REVERSIÓN MANUAL")
        print(f"{'='*60}")
        
        with transaction.atomic():
            # 1. Revertir en Planeación
            if pedido.fecha_entrega:
                print(f"\n📊 Revirtiendo en Planeación...")
                
                for detalle in pedido.detalles.all():
                    try:
                        planeacion = Planeacion.objects.filter(
                            fecha=pedido.fecha_entrega,
                            producto_nombre=detalle.producto.nombre
                        ).first()
                        
                        if planeacion:
                            pedidos_antes = planeacion.pedidos
                            total_antes = planeacion.total
                            
                            # Restar la cantidad
                            planeacion.pedidos = max(0, planeacion.pedidos - detalle.cantidad)
                            planeacion.save()
                            
                            print(f"  ✅ {detalle.producto.nombre}:")
                            print(f"     Pedidos: {pedidos_antes} → {planeacion.pedidos} (-{detalle.cantidad})")
                            print(f"     Total: {total_antes} → {planeacion.total}")
                        else:
                            print(f"  ⚠️ {detalle.producto.nombre}: No encontrado en Planeación")
                    
                    except Exception as e:
                        print(f"  ❌ Error con {detalle.producto.nombre}: {str(e)}")
                        continue
            
            # 2. Revertir en Cargue
            if pedido.fecha_entrega and pedido.vendedor:
                print(f"\n💰 Revirtiendo en Cargue...")
                
                cargue_models = [
                    ('ID1', CargueID1), ('ID2', CargueID2), ('ID3', CargueID3),
                    ('ID4', CargueID4), ('ID5', CargueID5), ('ID6', CargueID6)
                ]
                
                cargue_actualizado = False
                
                for id_cargue, CargueModel in cargue_models:
                    try:
                        cargues = CargueModel.objects.filter(fecha=pedido.fecha_entrega)
                        
                        for cargue in cargues:
                            if hasattr(cargue, 'responsable') and cargue.responsable:
                                # Buscar coincidencia con el vendedor
                                if pedido.vendedor.lower() in cargue.responsable.lower():
                                    pedidos_antes = float(cargue.total_pedidos or 0)
                                    efectivo_antes = float(cargue.total_efectivo or 0)
                                    
                                    # Revertir el total_pedidos
                                    cargue.total_pedidos = max(0, pedidos_antes - float(pedido.total))
                                    
                                    # Recalcular total_efectivo
                                    if hasattr(cargue, 'venta') and cargue.venta:
                                        cargue.total_efectivo = float(cargue.venta) - float(cargue.total_pedidos)
                                    
                                    cargue.save()
                                    
                                    print(f"  ✅ {id_cargue} - {cargue.responsable}:")
                                    print(f"     Total Pedidos: ${pedidos_antes:,.0f} → ${cargue.total_pedidos:,.0f} (-${pedido.total:,.0f})")
                                    print(f"     Total Efectivo: ${efectivo_antes:,.0f} → ${cargue.total_efectivo:,.0f}")
                                    
                                    cargue_actualizado = True
                                    break
                        
                        if cargue_actualizado:
                            break
                    
                    except Exception as e:
                        print(f"  ⚠️ Error en {id_cargue}: {str(e)}")
                        continue
                
                if not cargue_actualizado:
                    print(f"  ⚠️ No se encontró cargue para vendedor '{pedido.vendedor}'")
        
        print(f"\n{'='*60}")
        print(f"✅ CORRECCIÓN COMPLETADA")
        print(f"{'='*60}\n")
        
    except Pedido.DoesNotExist:
        print(f"\n❌ ERROR: Pedido {numero_pedido} no encontrado")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("\n🔧 SCRIPT DE CORRECCIÓN DE PEDIDO ANULADO")
    print("="*60)
    
    # Ejecutar corrección
    corregir_pedido_anulado('PED-000010')
    
    print("\n✅ Script finalizado")
