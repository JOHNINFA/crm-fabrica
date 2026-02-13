#!/usr/bin/env python
"""
Script para sincronizar clientes de Gestión de Pedidos a Gestión de Rutas
Crea automáticamente los clientes en las rutas de los vendedores según sus días asignados
"""
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Cliente, Ruta, ClienteRuta, Vendedor
from django.db.models import Max

def sincronizar_clientes_a_rutas():
    """Sincronizar todos los clientes con vendedor asignado a ClienteRuta"""
    
    print("\n" + "="*80)
    print("🔄 SINCRONIZANDO CLIENTES DE GESTIÓN DE PEDIDOS A GESTIÓN DE RUTAS")
    print("="*80 + "\n")
    
    # Obtener todos los clientes que tienen vendedor asignado
    clientes = Cliente.objects.filter(
        vendedor_asignado__isnull=False,
        activo=True
    ).exclude(
        vendedor_asignado=''
    ).order_by('vendedor_asignado', 'dia_entrega')
    
    print(f"👥 Total de clientes con vendedor asignado: {clientes.count()}\n")
    
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
    clientes_omitidos = 0
    errores = 0
    
    # Agrupar por vendedor
    vendedores_procesados = set()
    
    for cliente in clientes:
        try:
            vendedor_nombre = cliente.vendedor_asignado
            
            if vendedor_nombre not in vendedores_procesados:
                print(f"\n{'='*80}")
                print(f"👤 VENDEDOR: {vendedor_nombre}")
                print(f"{'='*80}")
                vendedores_procesados.add(vendedor_nombre)
            
            # Buscar el vendedor en la tabla Vendedor
            vendedor = Vendedor.objects.filter(nombre__iexact=vendedor_nombre).first()
            
            if not vendedor:
                print(f"⚠️ Cliente '{cliente.nombre_completo}': Vendedor '{vendedor_nombre}' no encontrado en tabla Vendedor")
                errores += 1
                continue
            
            # Buscar la ruta del vendedor
            ruta = Ruta.objects.filter(vendedor=vendedor, activo=True).first()
            
            if not ruta:
                print(f"⚠️ Cliente '{cliente.nombre_completo}': No hay ruta activa para {vendedor_nombre}")
                errores += 1
                continue
            
            # Obtener días de visita del cliente
            dias_visita = cliente.dia_entrega
            if not dias_visita:
                print(f"⚠️ Cliente '{cliente.nombre_completo}': Sin días de visita asignados")
                clientes_omitidos += 1
                continue
            
            # Normalizar días (quitar espacios, convertir a mayúsculas)
            dias_lista = [d.strip().upper() for d in dias_visita.split(',')]
            dias_lista.sort(key=lambda d: orden_dias.get(d, 99))
            dias_ordenados = ','.join(dias_lista)
            
            # Nombre del negocio (usar alias si existe, sino nombre completo)
            nombre_negocio = cliente.alias or cliente.nombre_completo
            
            # Buscar si ya existe el cliente en la ruta
            cliente_ruta = ClienteRuta.objects.filter(
                ruta=ruta,
                nombre_negocio=nombre_negocio
            ).first()
            
            if cliente_ruta:
                # Actualizar cliente existente
                actualizado = False
                
                # Actualizar días si son diferentes
                if cliente_ruta.dia_visita != dias_ordenados:
                    cliente_ruta.dia_visita = dias_ordenados
                    actualizado = True
                
                # Actualizar contacto
                if cliente_ruta.nombre_contacto != cliente.nombre_completo:
                    cliente_ruta.nombre_contacto = cliente.nombre_completo
                    actualizado = True
                
                # Actualizar dirección
                if cliente_ruta.direccion != (cliente.direccion or ''):
                    cliente_ruta.direccion = cliente.direccion or ''
                    actualizado = True
                
                # Actualizar teléfono
                telefono = cliente.telefono_1 or cliente.movil or ''
                if cliente_ruta.telefono != telefono:
                    cliente_ruta.telefono = telefono
                    actualizado = True
                
                # Actualizar tipo_negocio para marcar origen PEDIDOS
                tipo_base = cliente.alias or "Cliente"
                tipo_esperado = f"{tipo_base} | PEDIDOS"
                if cliente_ruta.tipo_negocio != tipo_esperado:
                    cliente_ruta.tipo_negocio = tipo_esperado
                    actualizado = True
                
                # Actualizar nota
                if cliente.nota and cliente_ruta.nota != cliente.nota:
                    cliente_ruta.nota = cliente.nota
                    actualizado = True
                
                if actualizado:
                    cliente_ruta.save()
                    print(f"✅ Actualizado: {nombre_negocio} - Días: {dias_ordenados}")
                    clientes_actualizados += 1
                else:
                    print(f"ℹ️ Sin cambios: {nombre_negocio}")
                    clientes_omitidos += 1
            else:
                # Crear nuevo cliente en ruta
                ultimo_orden = ClienteRuta.objects.filter(ruta=ruta).aggregate(
                    Max('orden')
                )['orden__max'] or 0
                
                tipo_base = cliente.alias or "Cliente"
                
                ClienteRuta.objects.create(
                    ruta=ruta,
                    nombre_negocio=nombre_negocio,
                    nombre_contacto=cliente.nombre_completo,
                    direccion=cliente.direccion or '',
                    telefono=cliente.telefono_1 or cliente.movil or '',
                    tipo_negocio=f"{tipo_base} | PEDIDOS",
                    dia_visita=dias_ordenados,
                    orden=ultimo_orden + 1,
                    activo=True,
                    nota=cliente.nota or ''
                )
                print(f"✅ Creado: {nombre_negocio} - Días: {dias_ordenados} - ORIGEN: PEDIDOS")
                clientes_creados += 1
                
        except Exception as e:
            print(f"❌ Error procesando cliente '{cliente.nombre_completo}': {str(e)}")
            import traceback
            traceback.print_exc()
            errores += 1
            continue
    
    # Resumen final
    print("\n" + "="*80)
    print("📊 RESUMEN DE SINCRONIZACIÓN")
    print("="*80)
    print(f"✅ Clientes creados: {clientes_creados}")
    print(f"🔄 Clientes actualizados: {clientes_actualizados}")
    print(f"ℹ️ Clientes sin cambios: {clientes_omitidos}")
    print(f"❌ Errores: {errores}")
    print(f"👥 Total procesado: {clientes.count()}")
    print("="*80 + "\n")

if __name__ == '__main__':
    try:
        sincronizar_clientes_a_rutas()
        print("✅ Sincronización completada exitosamente\n")
    except Exception as e:
        print(f"\n❌ Error en la sincronización: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
