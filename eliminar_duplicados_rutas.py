#!/usr/bin/env python
"""
Script para eliminar clientes duplicados entre rutas del mismo vendedor
Mantiene solo los clientes de la ruta principal (RUTA RINCON para ID1)
"""
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import ClienteRuta, Ruta, Vendedor
from collections import defaultdict

def eliminar_duplicados():
    """Eliminar clientes duplicados entre rutas del mismo vendedor"""
    
    print("\n" + "="*80)
    print("🔄 ELIMINANDO CLIENTES DUPLICADOS ENTRE RUTAS")
    print("="*80 + "\n")
    
    # Obtener todos los vendedores
    vendedores = Vendedor.objects.all()
    
    total_eliminados = 0
    
    for vendedor in vendedores:
        rutas = Ruta.objects.filter(vendedor=vendedor, activo=True).order_by('id')
        
        if rutas.count() <= 1:
            continue  # No hay duplicados posibles si solo tiene 1 ruta
        
        print(f"\n{'='*80}")
        print(f"👤 VENDEDOR: {vendedor.nombre} ({vendedor.id_vendedor})")
        print(f"📍 Rutas: {rutas.count()}")
        for r in rutas:
            print(f"   - {r.nombre} (ID: {r.id})")
        print(f"{'='*80}")
        
        # Obtener todos los clientes de todas las rutas del vendedor
        todos_clientes = ClienteRuta.objects.filter(ruta__in=rutas)
        
        # Agrupar por nombre de negocio
        clientes_por_nombre = defaultdict(list)
        for cliente in todos_clientes:
            nombre_normalizado = cliente.nombre_negocio.strip().upper()
            clientes_por_nombre[nombre_normalizado].append(cliente)
        
        # Buscar duplicados
        for nombre, clientes in clientes_por_nombre.items():
            if len(clientes) > 1:
                print(f"\n🔍 Duplicado encontrado: {nombre}")
                print(f"   Aparece en {len(clientes)} rutas:")
                
                # Mostrar todas las instancias
                for c in clientes:
                    print(f"   - Ruta: {c.ruta.nombre} (ID: {c.id}) - Días: {c.dia_visita}")
                
                # Decidir cuál mantener
                # Prioridad: 1) Ruta con más clientes, 2) Ruta con ID mayor (más reciente)
                rutas_con_conteo = []
                for c in clientes:
                    conteo = ClienteRuta.objects.filter(ruta=c.ruta).count()
                    rutas_con_conteo.append((c, conteo))
                
                # Ordenar por: 1) Mayor cantidad de clientes, 2) ID de ruta mayor
                rutas_con_conteo.sort(key=lambda x: (x[1], x[0].ruta.id), reverse=True)
                
                cliente_a_mantener = rutas_con_conteo[0][0]
                clientes_a_eliminar = [c for c in clientes if c.id != cliente_a_mantener.id]
                
                print(f"   ✅ Mantener: {cliente_a_mantener.ruta.nombre}")
                print(f"   ❌ Eliminar de: {', '.join([c.ruta.nombre for c in clientes_a_eliminar])}")
                
                # Eliminar duplicados
                for c in clientes_a_eliminar:
                    c.delete()
                    total_eliminados += 1
                    print(f"      ✅ Eliminado de {c.ruta.nombre}")
    
    # Resumen final
    print("\n" + "="*80)
    print("📊 RESUMEN")
    print("="*80)
    print(f"❌ Total de duplicados eliminados: {total_eliminados}")
    print("="*80 + "\n")

if __name__ == '__main__':
    try:
        eliminar_duplicados()
        print("✅ Proceso completado exitosamente\n")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
