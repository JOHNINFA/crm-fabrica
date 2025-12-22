
import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import TurnoVendedor

def cerrar_viejos_menos_actual():
    # Cerrar turnos abiertos EXCEPTO el del 17 de Mayo
    target_date = '2025-05-17'
    
    turnos = TurnoVendedor.objects.filter(estado='ABIERTO').exclude(fecha=target_date)
    
    if not turnos.exists():
        print("✅ No hay turnos basura para cerrar.")
        return

    count = 0
    for t in turnos:
        print(f"🔒 Cerrando turno obsoleto ID {t.id} - Vendedor {t.vendedor_id} - Fecha {t.fecha}")
        t.estado = 'CERRADO'
        t.hora_cierre = timezone.now()
        t.observaciones = 'Cierre administrativo limpieza'
        t.save()
        count += 1

    print(f"✅ Se cerraron {count} turnos obsoletos.")
    print(f"ℹ️ El turno del {target_date} permanece ABIERTO.")

if __name__ == '__main__':
    cerrar_viejos_menos_actual()
