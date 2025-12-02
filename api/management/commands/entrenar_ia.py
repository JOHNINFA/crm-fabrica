from django.core.management.base import BaseCommand
from api.services.ia_service import IAService


class Command(BaseCommand):
    help = 'Entrena redes neuronales para todos los productos con datos históricos'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n🧠 =========================================='))
        self.stdout.write(self.style.SUCCESS('   ENTRENAMIENTO DE REDES NEURONALES'))
        self.stdout.write(self.style.SUCCESS('==========================================\n'))
        
        ia_service = IAService()
        ia_service.entrenar_todos_los_modelos()
        
        self.stdout.write(self.style.SUCCESS('\n✅ Proceso de entrenamiento finalizado\n'))
