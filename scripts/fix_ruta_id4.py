import os
import sys
import django

# Configurar entorno Django
sys.path.append('/home/john/Escritorio/crm-fabrica')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Ruta, Vendedor, ClienteRuta, Pedido

def corregir_rutas():
    print("--- CORRECCIÓN DE RUTAS PARA ID4 (LUIS CHIRINO) ---\n")
    
    try:
        # 1. Obtener Vendedor ID4
        id4 = Vendedor.objects.get(id_vendedor='ID4')
        print(f"✅ Vendedor encontrado: {id4.nombre} (ID4)")
        
        # 2. Obtener las rutas conflictivas
        ruta_correcta = Ruta.objects.filter(id=3).first() # RUTA CHAPINERO (Tiene clientes)
        ruta_incorrecta = Ruta.objects.filter(id=11).first() # CHAPINERO (Vacía)
        
        if not ruta_correcta:
            print("❌ No se encontró la ruta ID 3")
            return

        print(f"\n📍 Ruta ID 3: '{ruta_correcta.nombre}' - Asignada a: {ruta_correcta.vendedor.nombre if ruta_correcta.vendedor else 'NADIE'} - Clientes: {ClienteRuta.objects.filter(ruta=ruta_correcta).count()}")
        
        if ruta_incorrecta:
            print(f"📍 Ruta ID 11: '{ruta_incorrecta.nombre}' - Asignada a: {ruta_incorrecta.vendedor.nombre if ruta_incorrecta.vendedor else 'NADIE'} - Clientes: {ClienteRuta.objects.filter(ruta=ruta_incorrecta).count()}")
        
        # 3. Reasignar Ruta ID 3 a ID4
        if ruta_correcta.vendedor != id4:
            print(f"\n🔄 Reasignando Ruta ID 3 ({ruta_correcta.nombre}) a ID4 ({id4.nombre})...")
            ruta_correcta.vendedor = id4
            ruta_correcta.activo = True # Asegurar que esté activa
            ruta_correcta.save()
            print("✅ Reasignación completada.")
        else:
            print("\n✅ La Ruta ID 3 ya está asignada a ID4.")
            
        # 4. Actualizar campo 'ruta' en Vendedor ID4 para coincidir
        if id4.ruta != ruta_correcta.nombre:
            print(f"🔄 Actualizando campo texto 'ruta' en Vendedor ID4: '{id4.ruta}' -> '{ruta_correcta.nombre}'")
            id4.ruta = ruta_correcta.nombre
            id4.save()
            print("✅ Campo actualizado.")

        # 5. Manejar Ruta ID 11 (Incorrecta/Duplicada)
        if ruta_incorrecta:
            clientes_inc = ClienteRuta.objects.filter(ruta=ruta_incorrecta).count()
            if clientes_inc == 0:
                print(f"\n🗑️ Eliminando Ruta ID 11 ({ruta_incorrecta.nombre}) vacía y duplicada...")
                ruta_incorrecta.delete()
                print("✅ Ruta ID 11 eliminada.")
            else:
                print(f"\n⚠️ La Ruta ID 11 tiene {clientes_inc} clientes. No se elimina automáticamente. Se recomienda moverlos a la ID 3.")
        
        # 6. Mover Pedidos si es necesario
        # Si hay pedidos creados con la ruta incorrecta... (vendedor ya es ID4, así que probablemente estén bien por ese lado)
        
        print("\n🎉 CORRECCIÓN FINALIZADA. AHORA ID4 DEBERÍA VER LOS CLIENTES.")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    corregir_rutas()
