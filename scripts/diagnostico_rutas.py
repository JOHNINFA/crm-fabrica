import os
import django
import sys

# Configurar entorno Django
import sys
sys.path.append('/home/john/Escritorio/crm-fabrica')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
import django
django.setup()

from api.models import Vendedor, Ruta, ClienteRuta, Pedido, Cliente

def diagnosticar():
    print("--- DIAGNÓSTICO DE VENDEDORES Y RUTAS ---\n")
    
    # Obtener todos los Vendedores
    print("--- Vendedores --")
    vendedores = Vendedor.objects.all().order_by('id_vendedor')
    for v in vendedores:
        print(f"ID: {v.id_vendedor} - Nombre: {v.nombre} - Ruta (texto): {v.ruta} - Activo: {v.activo}")
        
    print("\n--- Rutas (Tabla Ruta) --")
    rutas = Ruta.objects.all()
    for r in rutas:
        vendedor_nombre = r.vendedor.nombre if r.vendedor else "SIN VENDEDOR"
        vendedor_id = r.vendedor.id_vendedor if r.vendedor else "N/A"
        print(f"ID: {r.id} - Nombre: {r.nombre} - Vendedor Asignado (FK): {vendedor_nombre} ({vendedor_id})")
        
        clientes = ClienteRuta.objects.filter(ruta=r).count()
        print(f"   Clientes en esta ruta: {clientes}")

    print("\n--- Buscar Cliente 'EL CAPALLO' ---")
    cliente_capallo = ClienteRuta.objects.filter(nombre_negocio__icontains="CAPALLO").first()
    if cliente_capallo:
        print(f"Encontrado en ClienteRuta: {cliente_capallo.nombre_negocio} - Ruta ID: {cliente_capallo.ruta.id} ({cliente_capallo.ruta.nombre})")
    else:
        print("NO encontrado en ClienteRuta")
        
    cliente_web = Cliente.objects.filter(nombre_completo__icontains="CAPALLO").first()
    if cliente_web:
         print(f"Encontrado en Cliente (Web): {cliente_web.nombre_completo} - Vendedor Asignado: {cliente_web.vendedor_asignado}")
    else:
         print("NO encontrado en Cliente (Web)")

if __name__ == '__main__':
    diagnosticar()
