
import os
import django
import sys

# Configurar entorno Django
sys.path.append('/home/john/Escritorio/crm-fabrica')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Pedido

def analizar_pedido():
    print("🔍 Buscando pedido de 'POLLO AZUL'...")
    
    # Buscar pedidos por destinatario (nombre grabado en el pedido)
    pedidos = Pedido.objects.filter(
        destinatario__icontains='POLLO AZUL'
    ).order_by('-fecha_creacion')[:5]

    if not pedidos:
        # Intentar buscar por destinatario (nombre grabado en el pedido)
        pedidos = Pedido.objects.filter(
            destinatario__icontains='POLLO AZUL'
        ).order_by('-fecha_creacion')[:5]

    for p in pedidos:
        print(f"\n📦 PEDIDO #{p.numero_pedido} (ID: {p.id})")
        print(f"   Fecha Entrega: {p.fecha_entrega}")
        print(f"   Estado: {p.estado}")
        print(f"   Total: ${p.total}")
        print(f"   Vendedor: {p.vendedor}")
        
        print("   🛒 DETALLES (Productos):")
        try:
            items = p.detalles.all()
            if items:
                for d in items:
                    # Intentar obtener nombre del producto de varias formas
                    nombre = getattr(d, 'producto_nombre', None)
                    if not nombre and hasattr(d, 'producto'):
                        nombre = d.producto.nombre
                    print(f"      - {nombre} x {d.cantidad}")
            else:
                print("      ⚠️ LISTA DE PRODUCTOS VACÍA")
        except Exception as e:
             print(f"      (Error accediendo a detalles: {e})")

        print("   ⚠️ NOVEDADES (Historial):")
        if p.novedades:
            for n in p.novedades:
                print(f"      - {n}")
        else:
            print("      (Sin novedades registradas)")

if __name__ == '__main__':
    analizar_pedido()
