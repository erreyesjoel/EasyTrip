from django.core.management.base import BaseCommand
from tablas.models import PaqueteTuristico

class Command(BaseCommand):
    help = 'Crea un paquete turístico de ejemplo si no existe'

    def handle(self, *args, **options):
        nombre = 'Aventura en los Pirineos'
        if not PaqueteTuristico.objects.filter(nombre=nombre).exists():
            paquete = PaqueteTuristico.objects.create(
                nombre=nombre,
                descripcion='Disfruta de 5 días de senderismo, rafting y naturaleza en los Pirineos. Incluye alojamiento, comidas y actividades guiadas.',
                precio_base=499.99,
                duracion_dias=5,
                cupo_maximo=20,
                estado='activo'
            )
            self.stdout.write(self.style.SUCCESS(f'Paquete creado: {paquete}'))
        else:
            self.stdout.write(self.style.WARNING('El paquete de ejemplo ya existe.'))