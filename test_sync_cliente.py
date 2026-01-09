"""
Script para probar la sincronización de Cliente con ClienteRuta
Actualiza el cliente 'LA FONDA' para activar la sincronización
"""
import os
import sys
import django

# Agregar el directorio raíz al path
sys.path.insert(0, '/home/john/Escritorio/crm-fabrica')

# Configurar Django con el settings correcto
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Cliente, ClienteRuta, Ruta, Vendedor

def probar_sincronizacion():
    print("\n" + "="*60)
    print("🔄 PROBANDO SINCRONIZACIÓN CLIENTE → CLIENTERUTA")
    print("="*60 + "\n")
    
    # Buscar el cliente LA FONDA
    cliente = Cliente.objects.filter(alias__icontains="LA FONDA").first()
    
    if not cliente:
        print("❌ No se encontró el cliente 'LA FONDA'")
        return
    
    print(f"✅ Cliente encontrado: {cliente.alias} (ID: {cliente.id})")
    print(f"   - Nombre completo: {cliente.nombre_completo}")
    print(f"   - Vendedor asignado: {cliente.vendedor_asignado}")
    print(f"   - Días de entrega: {cliente.dia_entrega}")
    print(f"   - Dirección: {cliente.direccion}")
    
    # Verificar vendedor
    if cliente.vendedor_asignado:
        vendedor = Vendedor.objects.filter(nombre=cliente.vendedor_asignado).first()
        if vendedor:
            print(f"\n✅ Vendedor encontrado: {vendedor.nombre} (ID: {vendedor.id_vendedor})")
            
            # Verificar ruta
            ruta = Ruta.objects.filter(vendedor=vendedor).first()
            if ruta:
                print(f"✅ Ruta encontrada: {ruta.nombre}")
                
                # Forzar actualización del cliente para disparar perform_update
                print("\n🔄 Forzando actualización del cliente para activar sincronización...")
                cliente.save()
                
                # Verificar si se creó en ClienteRuta
                cliente_ruta = ClienteRuta.objects.filter(
                    ruta=ruta,
                    nombre_negocio__icontains="LA FONDA"
                ).first()
                
                if cliente_ruta:
                    print("\n✅ ¡SINCRONIZACIÓN EXITOSA!")
                    print(f"   - ClienteRuta ID: {cliente_ruta.id}")
                    print(f"   - Nombre Negocio: {cliente_ruta.nombre_negocio}")
                    print(f"   - Tipo Negocio: {cliente_ruta.tipo_negocio}")
                    print(f"   - Contacto: {cliente_ruta.nombre_contacto}")
                    print(f"   - Teléfono: {cliente_ruta.telefono}")
                    print(f"   - Dirección: {cliente_ruta.direccion}")
                    print(f"   - Días visita: {cliente_ruta.dia_visita}")
                    print(f"   - Orden: {cliente_ruta.orden}")
                else:
                    print("\n❌ No se creó el registro en ClienteRuta")
            else:
                print(f"❌ No se encontró ruta para el vendedor {vendedor.nombre}")
        else:
            print(f"❌ No se encontró vendedor con nombre '{cliente.vendedor_asignado}'")
    else:
        print("❌ El cliente no tiene vendedor asignado")
    
    print("\n" + "="*60)

if __name__ == "__main__":
    probar_sincronizacion()
