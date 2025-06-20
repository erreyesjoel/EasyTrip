from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)

    ROL_CHOICES = [
        ('cliente','Cliente'),
        ('agente', 'Agente'),
        ('recepcionista','Recepcionista'),
        ('administrador','Administrador'),
    ]
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default='cliente')

    class Meta:
        db_table = 'usuarios'