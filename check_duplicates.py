import os
import django
import sys

# Configurar entorno Django
sys.path.append('/home/john/Escritorio/crm-fabrica')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1
from django.db.models import Count

print("🔍 Buscando duplicados en CargueID1...")

duplicados = CargueID1.objects.values('fecha', 'producto').annotate(count=Count('id')).filter(count__gt=1)

if not duplicados.exists():
    print("✅ No se encontraron duplicados.")
else:
    print(f"⚠️ Se encontraron {duplicados.count()} productos con registros duplicados:")
    for d in duplicados:
        print(f"\n🔸 Fecha: {d['fecha']} - Producto: {d['producto']} ({d['count']} registros)")
        registros = CargueID1.objects.filter(fecha=d['fecha'], producto=d['producto']).order_by('id')
        for r in registros:
            print(f"   🔹 ID: {r.id} | Adicional: {r.adicional} | D: {r.d} | V: {r.v} | Cantidad: {r.cantidad}")
