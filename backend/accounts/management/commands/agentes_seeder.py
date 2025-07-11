import os # import os para acceder a las variables de entorno
from django.core.management.base import BaseCommand # BaseCommand es la clase base para crear comandos personalizados en Django
from django.contrib.auth import get_user_model # get_user_model permite obtener el modelo de usuario personalizado (settings.py)

class Command(BaseCommand): 
    help = 'Crear un agente'

    def handle(self, *args, **options):
        User = get_user_model()
        password = os.environ.get('AGENTE_PASSWORD')
        if not password:
            self.stdout.write(self.style.ERROR('La variable de entorno AGENTE_PASSWORD no está definida. No se creó el usuario.'))
            return
        if not User.objects.filter(username='AgenteJoel').exists():
            User.objects.create_user(
                username='AgenteJoel',
                email='agentejoel@easytrip.com',
                password=password,
                first_name='Agente',
                last_name='Joel',
                rol='agente'
            )
            self.stdout.write(self.style.SUCCESS('Usuario agente AgenteJoel creado.'))
        else:
            self.stdout.write(self.style.WARNING('El usuario AgenteJoel ya existe.'))