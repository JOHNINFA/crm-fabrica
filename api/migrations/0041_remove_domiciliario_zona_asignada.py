# Generated manually

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0040_domiciliario_pedido_afectar_inventario_inmediato_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='domiciliario',
            name='zona_asignada',
        ),
    ]
