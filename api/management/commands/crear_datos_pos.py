from django.core.management.base import BaseCommand
from api.models import Sucursal, Cajero
import hashlib

class Command(BaseCommand):
    help = 'Crear datos de ejemplo para el sistema POS'

    def handle(self, *args, **options):
        self.stdout.write('🚀 Creando datos de ejemplo para POS...')
        
        # Crear sucursales
        sucursal1, created = Sucursal.objects.get_or_create(
            nombre='Centro Norte',
            defaults={
                'direccion': 'Calle 123 #45-67, Centro Norte',
                'telefono': '(601) 123-4567',
                'email': 'centronorte@empresa.com',
                'ciudad': 'Bogotá',
                'departamento': 'Cundinamarca',
                'activo': True,
                'es_principal': True
            }
        )
        if created:
            self.stdout.write(f'✅ Sucursal creada: {sucursal1.nombre}')
        else:
            self.stdout.write(f'ℹ️  Sucursal ya existe: {sucursal1.nombre}')

        sucursal2, created = Sucursal.objects.get_or_create(
            nombre='Sur',
            defaults={
                'direccion': 'Carrera 89 #12-34, Sur',
                'telefono': '(601) 987-6543',
                'email': 'sur@empresa.com',
                'ciudad': 'Bogotá',
                'departamento': 'Cundinamarca',
                'activo': True,
                'es_principal': False
            }
        )
        if created:
            self.stdout.write(f'✅ Sucursal creada: {sucursal2.nombre}')
        else:
            self.stdout.write(f'ℹ️  Sucursal ya existe: {sucursal2.nombre}')

        # Crear cajeros
        cajeros_data = [
            {
                'nombre': 'jose',
                'password': '123456',
                'sucursal': sucursal1,
                'email': 'jose@empresa.com',
                'rol': 'CAJERO'
            },
            {
                'nombre': 'maria',
                'password': '123456',
                'sucursal': sucursal1,
                'email': 'maria@empresa.com',
                'rol': 'CAJERO'
            },
            {
                'nombre': 'carlos',
                'password': '123456',
                'sucursal': sucursal2,
                'email': 'carlos@empresa.com',
                'rol': 'SUPERVISOR'
            }
        ]

        for cajero_data in cajeros_data:
            # Hash de la contraseña
            password_hash = hashlib.sha256(cajero_data['password'].encode()).hexdigest()
            
            cajero, created = Cajero.objects.get_or_create(
                nombre=cajero_data['nombre'],
                sucursal=cajero_data['sucursal'],
                defaults={
                    'password': password_hash,
                    'email': cajero_data['email'],
                    'rol': cajero_data['rol'],
                    'activo': True,
                    'puede_hacer_descuentos': cajero_data['rol'] == 'SUPERVISOR',
                    'limite_descuento': 10 if cajero_data['rol'] == 'SUPERVISOR' else 0,
                    'puede_anular_ventas': cajero_data['rol'] == 'SUPERVISOR'
                }
            )
            
            if created:
                self.stdout.write(f'✅ Cajero creado: {cajero.nombre} - {cajero.sucursal.nombre}')
            else:
                self.stdout.write(f'ℹ️  Cajero ya existe: {cajero.nombre} - {cajero.sucursal.nombre}')

        self.stdout.write(
            self.style.SUCCESS('\n🎉 Datos de ejemplo creados exitosamente!')
        )
        self.stdout.write('\n📋 Credenciales de prueba:')
        self.stdout.write('   • jose (Centro Norte) - Contraseña: 123456')
        self.stdout.write('   • maria (Centro Norte) - Contraseña: 123456')
        self.stdout.write('   • carlos (Sur) - Contraseña: 123456')
        self.stdout.write('\n🏪 Sucursales disponibles:')
        self.stdout.write('   • Centro Norte (Principal)')
        self.stdout.write('   • Sur')