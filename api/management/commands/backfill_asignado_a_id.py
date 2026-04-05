"""
Rellena asignado_a_id en pedidos que tienen vendedor (nombre) pero asignado_a_id=null.

Uso:
    python manage.py backfill_asignado_a_id           # Modo simulación (no guarda)
    python manage.py backfill_asignado_a_id --apply   # Aplica los cambios reales
"""
from django.core.management.base import BaseCommand
from api.models import Pedido, Vendedor


class Command(BaseCommand):
    help = 'Rellena asignado_a_id en pedidos con vendedor pero sin asignado_a_id'

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply',
            action='store_true',
            help='Aplicar cambios reales (sin este flag solo simula)',
        )

    def handle(self, *args, **options):
        aplicar = options['apply']

        if not aplicar:
            self.stdout.write(self.style.WARNING(
                '🔍 MODO SIMULACIÓN — usa --apply para guardar cambios\n'
            ))

        # Construir mapa nombre_lower → id_vendedor
        vendedores = Vendedor.objects.filter(activo=True).values('id_vendedor', 'nombre')
        mapa_nombre = {}
        for v in vendedores:
            if v['nombre']:
                mapa_nombre[v['nombre'].strip().lower()] = v['id_vendedor']

        self.stdout.write(f'Vendedores activos encontrados: {len(mapa_nombre)}')
        for nombre, id_v in mapa_nombre.items():
            self.stdout.write(f'  {id_v} → {nombre}')

        # Pedidos con vendedor (nombre) pero sin asignado_a_id
        pedidos = Pedido.objects.filter(
            asignado_a_id__isnull=True,
            vendedor__isnull=False,
        ).exclude(vendedor='')

        total = pedidos.count()
        self.stdout.write(f'\nPedidos con vendedor pero sin asignado_a_id: {total}')

        actualizados = 0
        sin_match = 0

        for pedido in pedidos:
            nombre_lower = (pedido.vendedor or '').strip().lower()
            id_vendedor = mapa_nombre.get(nombre_lower)

            if id_vendedor:
                self.stdout.write(
                    f'  ✅ #{pedido.numero_pedido} "{pedido.vendedor}" → {id_vendedor}'
                )
                if aplicar:
                    pedido.asignado_a_id = id_vendedor
                    pedido.asignado_a_tipo = 'VENDEDOR'
                    pedido.save(update_fields=['asignado_a_id', 'asignado_a_tipo'])
                actualizados += 1
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f'  ⚠️  #{pedido.numero_pedido} "{pedido.vendedor}" → sin match'
                    )
                )
                sin_match += 1

        self.stdout.write('\n' + '='*50)
        if aplicar:
            self.stdout.write(self.style.SUCCESS(
                f'✅ Actualizados: {actualizados} | Sin match: {sin_match} | Total: {total}'
            ))
        else:
            self.stdout.write(self.style.WARNING(
                f'📋 Simulación: {actualizados} se actualizarían | {sin_match} sin match | Total: {total}'
            ))
            self.stdout.write('Ejecuta con --apply para aplicar los cambios.')
