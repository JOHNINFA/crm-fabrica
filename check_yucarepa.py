import os
import django
import sys

# Configurar entorno Django
sys.path.append('/home/john/Escritorio/crm-fabrica')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1

print("🔍 Buscando YUCAREPA en CargueID1...")

registros = CargueID1.objects.filter(producto__icontains='YUCAREPA').order_by('-fecha')

if not registros.exists():
    print("❌ No se encontró YUCAREPA")
else:
    for r in registros:
        print(f"\n📦 ID: {r.id}")
        print(f"   Fecha: {r.fecha} | Día: {r.dia}")
        print(f"   Cantidad: {r.cantidad}")
        print(f"   Dctos: {r.dctos}")
        print(f"   🎯 Adicional: {r.adicional}")
        print(f"   V: {r.v}")
        print(f"   D: {r.d}")
        print(f"   Total: {r.total}")
