from django.contrib.auth import get_user_model
User = get_user_model()

from rest_framework import status
from django.contrib.auth.tokens import default_token_generator
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import random
from django.core.mail import send_mail
from django.http import JsonResponse
from .models import CodigoVerificacion
from django.views.decorators.csrf import csrf_exempt
import json
from django.conf import settings
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import RefreshToken
from .models import PaqueteTuristico, ImagenPaquete

@api_view(['GET'])
def ejemplo_get(request):
    data = {
        "mensaje": "¡Hola desde la API!",
        "paquete": {
            "nombre": "Tour a Machu Picchu",
            "precio": 199.99,
            "duracion": 3,
            "estado": "activo"
        }
    }
    return Response(data)

@api_view(['POST'])
def registro_usuario(request):
    password = request.data.get('password')
    email = request.data.get('email')
    first_name = request.data.get('nombre', '')
    last_name = request.data.get('apellido', '')

    if not email or not password:
        return Response({'error': 'Email y password son requeridos.'}, status=status.HTTP_400_BAD_REQUEST)

    username = email.split('@')[0]

    if User.objects.filter(email=email).exists():
        return Response({'error': 'El email ya está registrado.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'El usuario ya existe.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        first_name=first_name,
        last_name=last_name
    )

    # Genera los tokens
    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)
    refresh = str(refresh)
    response = Response({'mensaje': 'Usuario creado correctamente.', 'username': username}, status=status.HTTP_201_CREATED)
    response.set_cookie(
        key='access_token',
        value=access,
        httponly=True,
        secure=False,  # True en producción
        samesite='Lax',
        path='/'
    )
    response.set_cookie(
        key='refresh_token',
        value=refresh,
        httponly=True,
        secure=False,
        samesite='Lax',
        path='/'
    )

    send_mail(
        subject=f'Bienvenido a {settings.APP_NAME}',
        message=(
            f'¡Hola {first_name}!\n\n'
            f'Tu cuenta en {settings.APP_NAME} ha sido creada correctamente.\n'
            f'Tu nombre de usuario es: {username}\n\n'
            '¡Gracias por registrarte!'
        ),
        from_email=f"{settings.APP_NAME} <{settings.EMAIL_HOST_USER}>",
        recipient_list=[email],
        fail_silently=True
    )

    return response

@csrf_exempt
def enviar_codigo_verificacion(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        if not email:
            return JsonResponse({'error': 'Email requerido'}, status=400)
        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'El email ya está registrado.'}, status=400)
        codigo = str(random.randint(100000, 999999))
        CodigoVerificacion.objects.create(
            email=email,
            codigo=codigo,
            fecha_expiracion=timezone.now() + timedelta(minutes=7),
            tipo='registro'  # <--- aquí
        )
        send_mail(
            subject=f'Tu código de verificación en {settings.APP_NAME}',
            message=f'Tu código de verificación es: {codigo}',
            from_email=f"{settings.APP_NAME} <{settings.EMAIL_HOST_USER}>",
            recipient_list=[email],
            fail_silently=False,
            html_message=f"""
                <p><strong>{settings.APP_NAME}</strong></p>
                <p>Tu código de verificación es: <b>{codigo}</b></p>
                <p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
            """
        )
        return JsonResponse({'ok': True})
    return JsonResponse({'error': 'Método no permitido'}, status=405)

@csrf_exempt
def verificar_codigo(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        codigo = data.get('codigo')
        if not email or not codigo:
            return JsonResponse({'valido': False, 'error': 'Faltan datos'}, status=400)
        ahora = timezone.now()
        codigos = CodigoVerificacion.objects.filter(
            email=email,
            codigo=codigo,
            usado=False,
            fecha_expiracion__gte=ahora,
            tipo='registro'  # <--- aquí
        ).order_by('-creado')
        if codigos.exists():
            codigo_obj = codigos.first()
            codigo_obj.usado = True
            codigo_obj.save()
            return JsonResponse({'valido': True})
        else:
            return JsonResponse({'valido': False, 'error': 'Código incorrecto o expirado'}, status=400)
    return JsonResponse({'error': 'Método no permitido'}, status=405)

# Clase personalizada para el token
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = TokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access = response.data.get('access')
            refresh = response.data.get('refresh')
            response.set_cookie(
                key='access_token',
                value=access,
                httponly=True,
                secure=False,  # True en producción
                samesite='Lax',
                path='/'       # <-- Añade esto
            )
            response.set_cookie(
                key='refresh_token',
                value=refresh,
                httponly=True,
                secure=False,
                samesite='Lax',
                path='/'       # <-- Añade esto
            )
        return response
    
@csrf_exempt
def enviar_codigo_recuperacion(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        if not email:
            return JsonResponse({'error': 'Email requerido'}, status=400)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'error': 'No existe usuario con ese email.'}, status=400)
        codigo = str(random.randint(100000, 999999))
        CodigoVerificacion.objects.create(
            email=email,
            codigo=codigo,
            fecha_expiracion=timezone.now() + timedelta(minutes=7),
            tipo='recuperacion'  # <--- aquí
        )
        send_mail(
            subject=f'Recuperación de contraseña en {settings.APP_NAME}',
            message=f'Tu código de recuperación es: {codigo}',
            from_email=f"{settings.APP_NAME} <{settings.EMAIL_HOST_USER}>",
            recipient_list=[email],
            fail_silently=False,
            html_message=f"""
                <p><strong>{settings.APP_NAME}</strong></p>
                <p>Tu código de recuperación es: <b>{codigo}</b></p>
                <p>Si no solicitaste este código, ignora este mensaje.</p>
            """
        )
        return JsonResponse({'ok': True, 'mensaje': 'Código enviado al correo.'})
    return JsonResponse({'error': 'Método no permitido'}, status=405)

@csrf_exempt
def cambiar_password_con_codigo(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        codigo = data.get('codigo')
        nueva_password = data.get('password')
        if not email or not codigo or not nueva_password:
            return JsonResponse({'error': 'Faltan datos.'}, status=400)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'error': 'No existe usuario con ese email.'}, status=400)
        ahora = timezone.now()
        codigos = CodigoVerificacion.objects.filter(
            email=email,
            codigo=codigo,
            usado=False,
            fecha_expiracion__gte=ahora,
            tipo='recuperacion'  # <--- aquí
        ).order_by('-creado')
        if codigos.exists():
            codigo_obj = codigos.first()
            codigo_obj.usado = True
            codigo_obj.save()
            user.set_password(nueva_password)
            user.save()
            return JsonResponse({'ok': True, 'mensaje': 'Contraseña cambiada correctamente.'})
        else:
            return JsonResponse({'error': 'Código incorrecto o expirado.'}, status=400)
    return JsonResponse({'error': 'Método no permitido'}, status=405)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usuario_actual(request):
    user = request.user
    return Response({
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'rol': user.rol
    })

from rest_framework.decorators import api_view

@api_view(['POST'])
def logout_view(request):
    response = Response({'ok': True, 'mensaje': 'Sesión cerrada'})
    response.delete_cookie('access_token', path='/')
    response.delete_cookie('refresh_token', path='/')
    return response

@api_view(['GET'])
def obtener_paquetes(request):
    """
    Vista para obtener todos los paquetes turísticos y sus imágenes
    """
    from .models import PaqueteTuristico
    
    # Obtenemos todos los paquetes turísticos
    paquetes = PaqueteTuristico.objects.all()
    
    # Preparamos la respuesta
    resultado = []
    for paquete in paquetes:
        # Obtenemos las imágenes relacionadas
        imagenes_data = []
        for imagen in paquete.imagenes.all():
            # Ya no necesitamos verificar es_predeterminada
            # Simplemente comprobamos si la imagen existe
            tiene_imagen_propia = imagen.imagen and hasattr(imagen.imagen, 'url')
                
            imagenes_data.append({
                'id': imagen.id,
                'descripcion': imagen.descripcion,
                'imagen_url': imagen.imagen_url,
                'es_predeterminada': not tiene_imagen_propia  # Calculamos dinámicamente
            })
            
        paquete_data = {
            'id': paquete.id,
            'nombre': paquete.nombre,
            'descripcion': paquete.descripcion,
            'precio_base': float(paquete.precio_base),  # Convertimos Decimal a float para JSON
            'duracion_dias': paquete.duracion_dias,
            'cupo_maximo': paquete.cupo_maximo,
            'estado': paquete.estado,
            'imagenes': imagenes_data
        }
        resultado.append(paquete_data)
    
    return Response(resultado)

# api creada, para crear un paquete turistico
@api_view(['POST'])
def crear_paquete(request):
    if request.method == 'POST': # si el método es POST
        # Obtener los datos del cuerpo de la solicitud
        # Como un validated de laravel en un controller
        # Usamos json.loads para convertir el cuerpo de la solicitud (texto JSON) en un objeto Python (diccionario)
        # usamos data.get, para hacerlos como nullables por la prevencion de errores
        # total ya hacemos una validacion de todos los campos, si falta uno de ahi, error
        data = json.loads(request.body)
        id = data.get('id')
        nombre = data.get('nombre')
        descripcion = data.get('descripcion')
        precio_base = data.get('precio_base')
        duracion_dias = data.get('duracion_dias')
        cupo_maximo = data.get('cupo_maximo')
        estado = data.get('estado')
        imagenes = data.get('imagenes', [])

        # Validar datos requeridos
        # Si falta algún dato, devolver un error, en este caso, imagen no, porque es como 'nullable'
        if not all([nombre, descripcion, precio_base, duracion_dias, cupo_maximo, estado]):
            return Response({'error': 'Faltan datos requeridos.'}, status=400)

        # Crear el paquete turístico
        paquete = PaqueteTuristico.objects.create(
            nombre=nombre,
            descripcion=descripcion,
            precio_base=precio_base,
            duracion_dias=duracion_dias,
            cupo_maximo=cupo_maximo,
            estado=estado
        )

        # Agregar imágenes al paquete, si existen
        for imagen_data in imagenes:
            imagen = ImagenPaquete.objects.create(
                paquete=paquete,
                descripcion=imagen_data.get('descripcion'),
                imagen=imagen_data.get('imagen')
            )

        return Response({'ok': True, 'mensaje': 'Paquete creado correctamente.'})

# api para editar un paquete turístico
# Se usa PUT o PATCH, dependiendo de si se quiere actualizar todo o solo algunos campos
# Se usa el id del paquete turístico para identificar cuál se va a editar
# Se usa json.loads para convertir el cuerpo de la solicitud (texto JSON) en un objeto Python (diccionario)
# Se usa data.get para hacerlos como nullables por la prevención de errores
# Se usa try-except para manejar el caso en que el paquete no exista
# Se actualizan los campos del paquete con los datos del cuerpo de la solicitud
# Si el paquete no existe, se devuelve un error 404
# Si se actualiza correctamente, se devuelve un mensaje de éxito
# put es para actualizar todo el paquete, patch es para actualizar solo algunos campos
@api_view(['PUT', 'PATCH'])
def editar_paquete(request, paquete_id):
    if request.method in ['PUT', 'PATCH']:
        data = json.loads(request.body)
        try:
            paquete = PaqueteTuristico.objects.get(id=paquete_id)
        except PaqueteTuristico.DoesNotExist:
            return Response({'error': 'Paquete no encontrado.'}, status=404)
        # Actualizar los campos del paquete
        paquete.nombre = data.get('nombre', paquete.nombre)
        paquete.descripcion = data.get('descripcion', paquete.descripcion)
        paquete.precio_base = data.get('precio_base', paquete.precio_base)
        paquete.duracion_dias = data.get('duracion_dias', paquete.duracion_dias)
        paquete.cupo_maximo = data.get('cupo_maximo', paquete.cupo_maximo)
        paquete.estado = data.get('estado', paquete.estado)
        paquete.save()
        return Response({'ok': True, 'mensaje': 'Paquete editado correctamente.'})
    return Response({'error': 'Método no permitido'}, status=405)