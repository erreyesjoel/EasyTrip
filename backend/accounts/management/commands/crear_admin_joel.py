import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Crea el usuario administrador JoelTrip si no existe'

    def handle(self, *args, **options):
        User = get_user_model()
        password = os.environ.get('ADMIN_PASSWORD_ADMIN_JOEL')
        if not password:
            self.stdout.write(self.style.ERROR('La variable de entorno ADMIN_PASSWORD_ADMIN_JOEL no está definida. No se creó el usuario.'))
            return
        if not User.objects.filter(username='JoelTrip').exists():
            User.objects.create_superuser(
                username='JoelTrip',
                email='joeltrip@easytrip.com',
                password=password,
                first_name='Joel',
                last_name='Trip',
                rol='administrador'
            )
            self.stdout.write(self.style.SUCCESS('Usuario administrador JoelTrip creado.'))
        else:
            self.stdout.write(self.style.WARNING('El usuario JoelTrip ya existe.'))