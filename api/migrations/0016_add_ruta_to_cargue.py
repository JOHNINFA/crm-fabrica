# Generated migration to add ruta field to Cargue models

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0015_add_responsable_to_vendedor'),
    ]

    operations = [
        migrations.AddField(
            model_name='cargueid1',
            name='ruta',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='cargueid2',
            name='ruta',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='cargueid3',
            name='ruta',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='cargueid4',
            name='ruta',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='cargueid5',
            name='ruta',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='cargueid6',
            name='ruta',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]
