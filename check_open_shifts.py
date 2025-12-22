
import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import TurnoVendedor

def listar_abiertos():
    turnos = TurnoVendedor.objects.filter(estado='ABIERTO').order_by('fecha', 'vendedor_id')
    
    if not turnos.exists():
        print("✅ No hay turnos abiertos.")
        return

    print(f"⚠️ Se encontraron {turnos.count()} turnos ABIERTOS:")
    print("-" * 60)
    print(f"{'ID':<5} | {'VENDEDOR':<10} | {'FECHA':<15} | {'DIA':<10}")
    print("-" * 60)
    
    for t in turnos:
        print(f"{t.id:<5} | ID{t.vendedor_id:<8} | {str(t.fecha):<15} | {t.dia:<10}")

if __name__ == '__main__':
    listar_abiertos()
