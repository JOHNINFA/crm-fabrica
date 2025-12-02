# Generated migration to rename tables from remision to pedido
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0029_planeacion'),
    ]

    operations = [
        # Renombrar tabla api_remision a api_pedido
        migrations.RunSQL(
            sql='ALTER TABLE IF EXISTS api_remision RENAME TO api_pedido;',
            reverse_sql='ALTER TABLE IF EXISTS api_pedido RENAME TO api_remision;',
        ),
        
        # Renombrar tabla api_detalleremision a api_detallepedido
        migrations.RunSQL(
            sql='ALTER TABLE IF EXISTS api_detalleremision RENAME TO api_detallepedido;',
            reverse_sql='ALTER TABLE IF EXISTS api_detallepedido RENAME TO api_detalleremision;',
        ),
        
        # Renombrar columna remision_id a pedido_id en api_detallepedido
        migrations.RunSQL(
            sql='''
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='api_detallepedido' AND column_name='remision_id'
                    ) THEN
                        ALTER TABLE api_detallepedido RENAME COLUMN remision_id TO pedido_id;
                    END IF;
                END $$;
            ''',
            reverse_sql='''
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='api_detallepedido' AND column_name='pedido_id'
                    ) THEN
                        ALTER TABLE api_detallepedido RENAME COLUMN pedido_id TO remision_id;
                    END IF;
                END $$;
            ''',
        ),
    ]
