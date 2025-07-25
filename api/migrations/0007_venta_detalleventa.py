# Generated by Django 4.2.2 on 2025-07-06 21:00

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_add_kardex_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='Venta',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('numero_factura', models.CharField(max_length=50, unique=True)),
                ('fecha', models.DateTimeField(default=django.utils.timezone.now)),
                ('vendedor', models.CharField(default='Sistema', max_length=100)),
                ('cliente', models.CharField(default='CONSUMIDOR FINAL', max_length=255)),
                ('metodo_pago', models.CharField(choices=[('EFECTIVO', 'Efectivo'), ('TARJETA', 'Tarjeta'), ('T_CREDITO', 'T. Crédito'), ('QR', 'Qr'), ('TRANSF', 'Transf'), ('RAPPIPAY', 'RAPPIPAY'), ('BONOS', 'Bonos'), ('OTROS', 'Otros')], default='EFECTIVO', max_length=20)),
                ('subtotal', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('impuestos', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('descuentos', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('total', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('dinero_entregado', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('devuelta', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('estado', models.CharField(choices=[('PAGADO', 'Pagado'), ('PENDIENTE', 'Pendiente'), ('CANCELADO', 'Cancelado')], default='PAGADO', max_length=20)),
                ('nota', models.TextField(blank=True, null=True)),
                ('banco', models.CharField(default='Caja General', max_length=100)),
                ('centro_costo', models.CharField(blank=True, max_length=100, null=True)),
                ('bodega', models.CharField(default='Principal', max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='DetalleVenta',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cantidad', models.IntegerField(default=1)),
                ('precio_unitario', models.DecimalField(decimal_places=2, max_digits=10)),
                ('subtotal', models.DecimalField(decimal_places=2, max_digits=10)),
                ('producto', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.producto')),
                ('venta', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='detalles', to='api.venta')),
            ],
        ),
    ]
