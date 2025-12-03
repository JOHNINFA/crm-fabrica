import os
import django
import sys

# Configurar entorno Django
sys.path.append('/home/john/Escritorio/crm-fabrica')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1

productos_revisar = [
    'AREPA DE MAIZ CON SEMILLA DE CHIA450Gr',
    'AREPA DE MAIZ PETO CON SEMILLAS DE LINAZA 450Gr',
    'AREPA CON SEMILLA DE QUINUA 450Gr'
]

print("🔍 Verificando estado de checks V en la BD...")

for nombre in productos_revisar:
    # Buscar exacto o aproximado
    r = CargueID1.objects.filter(fecha='2025-10-25', producto__icontains=nombre[:15]).first()
    if r:
        print(f"\n📦 {r.producto}")
        print(f"   V: {r.v}  <-- {'✅ CORRECTO' if r.v else '❌ INCORRECTO'}")
        print(f"   D: {r.d}")
    else:
        print(f"\n❌ No encontrado: {nombre}")
