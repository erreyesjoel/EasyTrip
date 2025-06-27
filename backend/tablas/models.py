from django.conf import settings
from django.db import models
from django.utils import timezone
import datetime

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


class CodigoVerificacion(models.Model):
    TIPO_CHOICES = [
        ('registro', 'Registro'),
        ('recuperacion', 'Recuperación'),
    ]
    email = models.EmailField()
    codigo = models.CharField(max_length=10)
    creado = models.DateTimeField(auto_now_add=True)
    usado = models.BooleanField(default=False)
    fecha_expiracion = models.DateTimeField(null=True, blank=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='registro')  # NUEVO

    def expirado(self):
        return timezone.now() > self.fecha_expiracion if self.fecha_expiracion else False
    def __str__(self):
        return f"{self.email} - {self.codigo} - {self.tipo} - {'usado' if self.usado else 'no usado'}"

    class Meta:
        db_table = 'codigos_verificacion'

# clase para almacenar imágenes de paquetes turísticos, tabla aparte mejor que en el mismo modelo
# para evitar que el modelo de paquete turístico crezca demasiado y para poder
# manejar múltiples imágenes por paquete de forma más eficiente.
class ImagenPaquete(models.Model):
    paquete = models.ForeignKey(
        PaqueteTuristico,
        on_delete=models.CASCADE,
        related_name='imagenes'
    )
    imagen = models.ImageField(upload_to='paquetes/', null=True, blank=True)
    descripcion = models.CharField(max_length=255, blank=True)

    @property
    def imagen_url(self): # imagen_url es un método de la clase ImagenPaquete decorado con @property
                          # @property, convierte el metodo en una propiedad accesible, permitiendo asi acceder a imagen_url como si fuera un atributo
        """
        Devuelve la URL de la imagen si existe,
        de lo contrario devuelve la URL de la imagen predeterminada
        """
        if self.imagen and hasattr(self.imagen, 'url'):
            return self.imagen.url
        else:
            # Devuelve la URL de la imagen predeterminada que está en static/img/
            # SI NO HAY FOTO DE PRIMERAS EN ESE PAQUETE
            return f"{settings.STATIC_URL}img/paquetePredeterminada.webp"

    def __str__(self):
        return f"Imagen de {self.paquete.nombre}"

    class Meta:
        db_table = 'imagenes_paquetes'     