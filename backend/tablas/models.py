from django.conf import settings
from django.db import models

class PaqueteTuristico(models.Model):
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]

    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    precio_base = models.DecimalField(max_digits=10, decimal_places=2)
    duracion_dias = models.PositiveIntegerField()
    cupo_maximo = models.PositiveIntegerField()
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='activo')

    def __str__(self):
        return self.nombre

    class Meta:
        db_table = 'paquete_turistico'

class Reserva(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('confirmada', 'Confirmada'),
        ('pagada', 'Pagada'),
        ('cancelada', 'Cancelada'),
    ]

    # Relación con el usuario que hace la reserva (cliente).
    # Django ya incluye una tabla de usuarios (auth_user), por eso no hay que crearla.
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reservas'
    )

    # Relación con el paquete turístico reservado.
    paquete_turistico = models.ForeignKey(
        PaqueteTuristico, on_delete=models.CASCADE, related_name='reservas'
    )

    # Fecha para la que se hace la reserva.
    fecha_reservada = models.DateField()

    # Estado de la reserva (pendiente, confirmada, pagada, cancelada).
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')

    # Fecha en la que se creó la reserva.
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    # Usuario (agente o recepcionista) que gestiona el cambio de estado de la reserva.
    # Puede ser null si aún no ha sido gestionada.
    usuario_gestor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reservas_gestionadas'
    )

    def __str__(self):
        return f"{self.usuario.username} - {self.paquete_turistico.nombre} ({self.estado})"
    
    class Meta:
        db_table = 'reserva'
