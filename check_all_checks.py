import os
import django
import sys

# Configurar entorno Django
sys.path.append('/home/john/Escritorio/crm-fabrica')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1

print("🔍 Productos con V=True o D=True en fecha 2025-10-25...")

registros = CargueID1.objects.filter(fecha='2025-10-25').order_by('producto')

if not registros.exists():
    print("❌ No se encontraron registros")
else:
    print(f"\n📊 Total registros: {registros.count()}\n")
    for r in registros:
        if r.v or r.d:
            print(f"✅ {r.producto}")
            print(f"   V: {r.v} | D: {r.d} | Adicional: {r.adicional}")
        else:
            print(f"⚪ {r.producto} - V: False | D: False")
