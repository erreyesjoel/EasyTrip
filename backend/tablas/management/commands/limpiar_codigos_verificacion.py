from django.core.management.base import BaseCommand
from django.utils import timezone
from tablas.models import CodigoVerificacion

class Command(BaseCommand):
    help = 'Elimina los códigos de verificación usados o expirados'

    def handle(self, *args, **options):
        ahora = timezone.now()
        usados = CodigoVerificacion.objects.filter(usado=True).delete()
        expirados = CodigoVerificacion.objects.filter(usado=False, fecha_expiracion__lt=ahora).delete()
        self.stdout.write(self.style.SUCCESS('Códigos usados y expirados eliminados correctamente.'))