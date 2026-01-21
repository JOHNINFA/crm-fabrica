from django.core.management.base import BaseCommand
from api.models import Planeacion, ReportePlaneacion
from django.utils import timezone
from datetime import timedelta
import json

class Command(BaseCommand):
    help = 'Guarda automáticamente reportes de planeación si no existen y tienen datos.'

    def handle(self, *args, **kwargs):
        hoy = timezone.localdate()
        # Rango de búsqueda: desde ayer hasta 30 días adelante (por si planean muy a futuro)
        fecha_inicio = hoy - timedelta(days=1)
        fecha_fin = hoy + timedelta(days=30)
        
        self.stdout.write(f"🔍 Buscando planeaciones sin guardar desde {fecha_inicio} hasta {fecha_fin}...")
        
        # Obtener todas las fechas distintas en el rango que tienen datos en Planeacion (orden > 0)
        fechas_con_datos = Planeacion.objects.filter(
            fecha__range=[fecha_inicio, fecha_fin],
            orden__gt=0
        ).values_list('fecha', flat=True).distinct()
        
        for fecha in fechas_con_datos:
            # Verificar si ya existe reporte para esta fecha
            if ReportePlaneacion.objects.filter(fecha_reporte=fecha).exists():
                # Ya está guardado, ignorar
                continue
            
            self.stdout.write(f"⚠️ Encontrada planeación sin reporte para: {fecha}")
            
            # Obtener datos para el reporte
            productos_planeados = Planeacion.objects.filter(fecha=fecha)
            
            # Construir JSON igual al frontend
            datos_json = []
            total_orden = 0
            
            for p in productos_planeados:
                datos_json.append({
                    "id": p.id,
                    "nombre": p.producto_nombre,
                    "existencias": p.existencias,
                    "solicitado": p.solicitadas,
                    "pedidos": p.pedidos,
                    "orden": p.orden,
                    "ia": p.ia
                })
                total_orden += p.orden
            
            if total_orden > 0:
                # Crear reporte
                try:
                    ReportePlaneacion.objects.create(
                        fecha_reporte=fecha,
                        usuario='Sistema Autoguardado',
                        datos_json=datos_json
                    )
                    self.stdout.write(self.style.SUCCESS(f"✅ Autoguardado exitoso para {fecha} ({len(datos_json)} productos)"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"❌ Error guardando {fecha}: {str(e)}"))
            else:
                self.stdout.write(f"ℹ️ {fecha} tiene orden 0 total, omitiendo.")

        self.stdout.write(self.style.SUCCESS("🏁 Proceso de autoguardado finalizado."))
