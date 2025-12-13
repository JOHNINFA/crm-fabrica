import os
import django
from django.contrib.auth.hashers import make_password

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Cajero, Sucursal

def crear_cajeros():
    try:
        sucursal = Sucursal.objects.first()
        if not sucursal:
            print("❌ No hay sucursales creadas. Creando una por defecto...")
            sucursal = Sucursal.objects.create(nombre="Principal", direccion="Calle Principal")

        # Crear cajero jose (ID 101)
        if not Cajero.objects.filter(id=101).exists():
            Cajero.objects.create(
                id=101,
                nombre="jose",
                password=make_password("1234"),
                sucursal=sucursal,
                rol="CAJERO",
                activo=True
            )
            print("✅ Cajero 'jose' creado con ID 101")
        else:
            print("ℹ️ Cajero 'jose' (ID 101) ya existe")

        # Crear cajero prueba1 (ID 102)
        if not Cajero.objects.filter(id=102).exists():
            Cajero.objects.create(
                id=102,
                nombre="prueba1",
                password=make_password("1234"),
                sucursal=sucursal,
                rol="CAJERO",
                activo=True
            )
            print("✅ Cajero 'prueba1' creado con ID 102")
        else:
            print("ℹ️ Cajero 'prueba1' (ID 102) ya existe")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    crear_cajeros()
