#!/usr/bin/env python
"""
Script para migrar pedidos existentes a ClienteRuta
Crea automáticamente los clientes en las rutas de los vendedores
"""
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Pedido, Ruta, ClienteRuta, Vendedor
from django.db.models import Max

def migrar_pedidos_a_rutas():
    """Migrar todos los pedidos asignados a vendedores a ClienteRuta"""
    
    print("\n" + "="*80)
    print("🔄 MIGRANDO PEDIDOS EXISTENTES A GESTIÓN DE RUTAS")
    print("="*80 + "\n")
    
    # Obtener todos los pedidos que tienen vendedor asignado
    # Buscar por campo 'vendedor' ya que asignado_a_id puede estar vacío
    pedidos = Pedido.objects.filter(
        vendedor__isnull=False
    ).exclude(
        vendedor=''
    ).exclude(
        vendedor='PEDIDOS'  # Excluir pedidos genéricos
    ).order_by('vendedor', 'fecha_entrega')
    
    print(f"📦 Total de pedidos con vendedor asignado: {pedidos.count()}\n")
    
    # Mapeo de días
    dias_map = {
        0: 'LUNES',
        1: 'MARTES',
        2: 'MIERCOLES',
        3: 'JUEVES',
        4: 'VIERNES',
        5: 'SABADO',
        6: 'DOMINGO'
    }
    
    # Orden de días para ordenar
    orden_dias = {
        'LUNES': 1,
        'MARTES': 2,
        'MIERCOLES': 3,
        'JUEVES': 4,
        'VIERNES': 5,
        'SABADO': 6,
        'DOMINGO': 7
    }
    
    clientes_creados = 0
    clientes_actualizados = 0
    errores = 0
    
    # Agrupar por vendedor
    vendedores_procesados = set()
    
    for pedido in pedidos:
        try:
            vendedor_id = pedido.asignado_a_id
            
            if vendedor_id not in vendedores_procesados:
                print(f"\n{'='*80}")
                print(f"👤 VENDEDOR: {vendedor_id}")
                print(f"{'='*80}")
                vendedores_procesados.add(vendedor_id)
            
            # Buscar el vendedor
            vendedor = Vendedor.objects.filter(id_vendedor=vendedor_id).first()
            
            if not vendedor:
                print(f"⚠️ Pedido #{pedido.numero_pedido}: Vendedor {vendedor_id} no encontrado")
                errores += 1
                continue
            
            # Buscar la ruta del vendedor
            ruta = Ruta.objects.filter(vendedor=vendedor, activo=True).first()
            
            if not ruta:
                print(f"⚠️ Pedido #{pedido.numero_pedido}: No hay ruta activa para {vendedor_id}")
                errores += 1
                continue
            
            # Obtener el día de la semana
            if not pedido.fecha_entrega:
                print(f"⚠️ Pedido #{pedido.numero_pedido}: Sin fecha de entrega")
                errores += 1
                continue
            
            dia_semana = dias_map[pedido.fecha_entrega.weekday()]
            
            # Buscar si ya existe el cliente en la ruta
            cliente_ruta = ClienteRuta.objects.filter(
                ruta=ruta,
                nombre_negocio=pedido.destinatario
            ).first()
            
            if cliente_ruta:
                # Actualizar días de visita si no incluye el día actual
                dias_actuales = [d.strip() for d in cliente_ruta.dia_visita.split(',')]
                
                if dia_semana not in dias_actuales:
                    dias_actuales.append(dia_semana)
                    # Ordenar días
                    dias_actuales.sort(key=lambda d: orden_dias.get(d, 99))
                    cliente_ruta.dia_visita = ','.join(dias_actuales)
                    
                    # Actualizar nota si no tiene
                    if not cliente_ruta.nota or 'Pedido #' not in cliente_ruta.nota:
                        cliente_ruta.nota = f"Pedido #{pedido.numero_pedido}"
                    
                    # Asegurar que el origen sea PEDIDOS
                    if cliente_ruta.tipo_negocio and '| PEDIDOS' not in cliente_ruta.tipo_negocio:
                        tipo_base = cliente_ruta.tipo_negocio.split('|')[0].strip()
                        cliente_ruta.tipo_negocio = f"{tipo_base} | PEDIDOS"
                    
                    cliente_ruta.save()
                    print(f"✅ Actualizado: {pedido.destinatario} - Días: {cliente_ruta.dia_visita}")
                    clientes_actualizados += 1
                else:
                    print(f"ℹ️ Ya existe: {pedido.destinatario} - Día {dia_semana} ya incluido")
            else:
                # Crear nuevo cliente en ruta
                ultimo_orden = ClienteRuta.objects.filter(ruta=ruta).aggregate(
                    Max('orden')
                )['orden__max'] or 0
                
                ClienteRuta.objects.create(
                    ruta=ruta,
                    nombre_negocio=pedido.destinatario,
                    nombre_contacto=pedido.destinatario,
                    direccion=pedido.direccion_entrega or '',
                    telefono=pedido.telefono_contacto or '',
                    tipo_negocio=f"Cliente | PEDIDOS",
                    dia_visita=dia_semana,
                    orden=ultimo_orden + 1,
                    activo=True,
                    nota=f"Pedido #{pedido.numero_pedido}"
                )
                print(f"✅ Creado: {pedido.destinatario} - Día: {dia_semana} - ORIGEN: PEDIDOS")
                clientes_creados += 1
                
        except Exception as e:
            print(f"❌ Error procesando pedido #{pedido.numero_pedido}: {str(e)}")
            import traceback
            traceback.print_exc()
            errores += 1
            continue
    
    # Resumen final
    print("\n" + "="*80)
    print("📊 RESUMEN DE MIGRACIÓN")
    print("="*80)
    print(f"✅ Clientes creados: {clientes_creados}")
    print(f"🔄 Clientes actualizados: {clientes_actualizados}")
    print(f"❌ Errores: {errores}")
    print(f"📦 Total procesado: {pedidos.count()}")
    print("="*80 + "\n")

if __name__ == '__main__':
    try:
        migrar_pedidos_a_rutas()
        print("✅ Migración completada exitosamente\n")
    except Exception as e:
        print(f"\n❌ Error en la migración: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
