from datetime import timezone
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)

    ROL_CHOICES = [
        ('cliente','Cliente'),
        ('agente', 'Agente'),
        ('recepcionista','Recepcionista'),
        ('administrador','Administrador'),
    ]
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default='cliente')

    # actualizar el campo last_login al guardar el usuario, SI last_login esta vacio
    # se establece la fecha y hora actual
    # self es la instancia del usuario que se esta guardando
    # args y kwargs permiten que el metodo acepte cualquier argumento adicional que Django le pase internamente al guardar el modelo
    def save(self, *args, **kwargs):
        if not self.last_login:
            self.last_login = timezone.now()
        super().save(*args, **kwargs)
    class Meta:
        db_table = 'usuarios'