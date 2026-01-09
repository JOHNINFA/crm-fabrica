import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import TurnoVendedor

# Eliminar turno del 20/12/2025 para el vendedor 1 (ID1)
eliminados, _ = TurnoVendedor.objects.filter(vendedor_id=1, fecha=date(2025, 12, 20)).delete()

if eliminados > 0:
    print(f"✅ Se eliminó el turno cerrado del 20/12/2025 (ID1). Ahora puedes abrirlo de nuevo.")
else:
    print(f"⚠️ No se encontró ningún turno para esa fecha. Debería dejarte abrirlo.")
