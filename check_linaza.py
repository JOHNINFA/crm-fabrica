import os
import django
import sys

# Configurar entorno Django
sys.path.append('/home/john/Escritorio/crm-fabrica')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1

print("🔍 Buscando productos con LINAZA en el nombre...")

registros = CargueID1.objects.filter(fecha='2025-10-25', producto__icontains='LINAZA')

if not registros.exists():
    print("❌ No se encontró")
else:
    for r in registros:
        print(f"\n📦 ID: {r.id}")
        print(f"   Producto: '{r.producto}'")
        print(f"   Longitud nombre: {len(r.producto)} caracteres")
        print(f"   V: {r.v} | D: {r.d}")
        print(f"   Adicional: {r.adicional}")
        
        # Mostrar caracteres invisibles
        print(f"   Nombre (repr): {repr(r.producto)}")
