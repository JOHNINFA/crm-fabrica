import os
import sys
import django

# Configurar entorno Django
sys.path.append('/home/john/Escritorio/crm-fabrica')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Ruta, Vendedor

def revertir_rutas():
    print("--- REVERSIÓN DE CAMBIOS DE RUTAS (SOLICITUD MANUAL) ---\n")
    
    try:
        # 1. Obtener Vendedores
        id2 = Vendedor.objects.get(id_vendedor='ID2') # Javier Tibavija
        id4 = Vendedor.objects.get(id_vendedor='ID4') # Luis Chirino
        
        print(f"✅ Vendedores encontrados: ID2={id2.nombre}, ID4={id4.nombre}")
        
        # 2. Restaurar Ruta ID 3 a ID2 (Javier Tibavija)
        ruta_3 = Ruta.objects.filter(id=3).first()
        if ruta_3:
            print(f"\n🔄 Restaurando Ruta ID 3 ({ruta_3.nombre}) a ID2 (Javier Tibavija)...")
            ruta_3.vendedor = id2
            ruta_3.save()
            print("✅ Ruta ID 3 devuelta a ID2.")
        else:
            print("❌ No se encontró la Ruta ID 3.")

        # 3. Recrear Ruta "CHAPINERO" para ID4 (Luis Chirino) - La original ID 11 fue borrada
        # Verificamos si ya existe por si acaso
        ruta_chapinero = Ruta.objects.filter(nombre="CHAPINERO", vendedor=id4).first()
        if not ruta_chapinero:
            print(f"\n🔄 Recreando Ruta vacía 'CHAPINERO' para ID4 (Luis Chirino)...")
            # Forzamos ID 11 si es posible, o dejamos que el sistema asigne uno nuevo
            ruta_restaurada = Ruta.objects.create(
                nombre="CHAPINERO",
                vendedor=id4,
                activo=True
            )
            print(f"✅ Ruta restaurada: '{ruta_restaurada.nombre}' (ID: {ruta_restaurada.id}) asignada a ID4.")
        else:
            print(f"\nℹ️ La ruta 'CHAPINERO' ya existe para ID4 (ID: {ruta_chapinero.id}).")

        # 4. Restaurar campos de texto en Vendedores
        # ID2 debe decir "RUTA CHAPINERO"
        if id2.ruta != "RUTA CHAPINERO":
            id2.ruta = "RUTA CHAPINERO"
            id2.save()
            print("✅ Campo texto ID2 restaurado.")
            
        # ID4 debe decir "CHAPINERO"
        if id4.ruta != "CHAPINERO":
            id4.ruta = "CHAPINERO"
            id4.save()
            print("✅ Campo texto ID4 restaurado.")

        print("\n🎉 REVERSIÓN FINALIZADA. LOS CAMBIOS HAN SIDO DESHECHOS.")
        
    except Exception as e:
        print(f"❌ Error durante la reversión: {e}")

if __name__ == '__main__':
    revertir_rutas()
