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
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes
from django.core.exceptions import ValidationError
from django.utils import timezone

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
            from django.contrib.auth import get_user_model
            User = get_user_model()
            username_or_email = request.data.get('username') or request.data.get('email')
            user = User.objects.filter(email=username_or_email).first()
            if not user:
                user = User.objects.filter(username=username_or_email).first()
            print("Intentando login para:", username_or_email, "Usuario encontrado:", user)
            if user:
                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])
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

# api para obtener todos los paquetes turísticos y sus imágenes
@api_view(['GET'])
def obtener_paquetes(request):
    """
    Vista para obtener todos los paquetes turísticos y sus imágenes,
    con filtros por query string (nombre, estado, precio_base, duracion, cupo).
    """
    filtro_map = {
        'nombre':      lambda v: {'nombre__icontains': v},
        'estado':      lambda v: {'estado': v},
        # 'precio_base':  lambda v: {'precio_base': float(v)},  # <-- Elimina esta línea
        'duracion':    lambda v: {'duracion_dias': int(v)},
        'cupo':        lambda v: {'cupo_maximo__gte': int(v)},
    }

    filtros = {}
    for param, builder in filtro_map.items():
        valor = request.GET.get(param)
        if valor not in [None, '']:
            try:
                filtros.update(builder(valor))
            except (ValueError, TypeError):
                pass

    # Lógica especial para el filtro de precio "starts with"
    precio_valor = request.GET.get('precio_base')
    if precio_valor not in [None, '']:
        try:
            precio_float = float(precio_valor)
            # Calcula el siguiente número entero mayor
            if '.' in precio_valor:
                # Si el usuario pone "50.5", busca entre 50.5 y 50.6
                decimales = len(precio_valor.split('.')[1])
                incremento = 10 ** -decimales
                precio_max = precio_float + incremento
            else:
                # Si el usuario pone "50", busca entre 50.0 y 51.0
                precio_max = precio_float + 1
            filtros['precio_base__gte'] = precio_float
            filtros['precio_base__lt'] = precio_max
        except ValueError:
            pass

    paquetes = PaqueteTuristico.objects.filter(**filtros).order_by('id')

    # Preparamos la respuesta
    resultado = []
    for paquete in paquetes:
        imagenes_data = []
        for imagen in paquete.imagenes.all():
            tiene_imagen_propia = imagen.imagen and hasattr(imagen.imagen, 'url')
            imagenes_data.append({
                'id': imagen.id,
                'descripcion': imagen.descripcion,
                'imagen_url': imagen.imagen_url,
                'es_predeterminada': not tiene_imagen_propia
            })
        paquete_data = {
            'id': paquete.id,
            'nombre': paquete.nombre,
            'descripcion': paquete.descripcion,
            'precio_base': float(paquete.precio_base),
            'duracion_dias': paquete.duracion_dias,
            'cupo_maximo': paquete.cupo_maximo,
            'estado': paquete.estado,
            'imagenes': imagenes_data
        }
        resultado.append(paquete_data)
    return Response(resultado)

# api creada, para crear un paquete turistico
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def crear_paquete(request):
    if request.method == 'POST': # si el método es POST
        # Si la petición es multipart (con imágenes), usamos request.data y request.FILES
        if request.content_type and request.content_type.startswith('multipart'):
            data = request.data
        else:
            # Obtener los datos del cuerpo de la solicitud
            # Como un validated de laravel en un controller
            # Usamos json.loads para convertir el cuerpo de la solicitud (texto JSON) en un objeto Python (diccionario)
            data = json.loads(request.body)
        # usamos data.get, para hacerlos como nullables por la prevencion de errores
        # total ya hacemos una validacion de todos los campos, si falta uno de ahi, error
        nombre = data.get('nombre')
        descripcion = data.get('descripcion')
        precio_base = data.get('precio_base')
        duracion_dias = data.get('duracion_dias')
        cupo_maximo = data.get('cupo_maximo')
        estado = data.get('estado')
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
        # Agregar imágenes al paquete, si existen (solo si es multipart)
        if hasattr(request, 'FILES'):
            imagenes = request.FILES.getlist('imagenes')
            for img in imagenes:
                # Validar tamaño de imagen antes de guardar
                imagen_obj = ImagenPaquete(paquete=paquete, imagen=img)
                try:
                    imagen_obj.full_clean()  # Ejecuta los validadores, incluido el de tamaño
                    imagen_obj.save()
                except ValidationError as e:
                    return Response({'error': e.message_dict.get('imagen', ['Error de validación'])[0]}, status=400)
        # Preparamos la respuesta con las imágenes actuales del paquete
        imagenes_data = []
        for imagen in paquete.imagenes.all():
            tiene_imagen_propia = imagen.imagen and hasattr(imagen.imagen, 'url')
            imagenes_data.append({
                'id': imagen.id,
                'descripcion': imagen.descripcion,
                'imagen_url': imagen.imagen_url,
                'es_predeterminada': not tiene_imagen_propia
            })
        paquete_data = {
            'id': paquete.id,
            'nombre': paquete.nombre,
            'descripcion': paquete.descripcion,
            'precio_base': float(paquete.precio_base),
            'duracion_dias': paquete.duracion_dias,
            'cupo_maximo': paquete.cupo_maximo,
            'estado': paquete.estado,
            'imagenes': imagenes_data
        }
        return Response({'ok': True, 'mensaje': 'Paquete creado correctamente.', 'paquete': paquete_data})

# api para editar un paquete turístico
# Se usa PUT o PATCH, dependiendo de si se quiere actualizar todo o solo algunos campos
# Se usa el id del paquete turístico para identificar cuál se va a editar
# Se usa json.loads para convertir el cuerpo de la solicitud (texto JSON) en un objeto Python (diccionario)
# Se usa data.get para hacerlos como nullables por la prevención de errores
# Se usa try-except para manejar el caso en que el paquete no exista
# Se actualizan los campos del paquete con los datos d
# el cuerpo de la solicitud
# Si el paquete no existe, se devuelve un error 404
# Si se actualiza correctamente, se devuelve un mensaje de éxito
# put es para actualizar todo el paquete, patch es para actualizar solo algunos campos
@api_view(['PUT', 'PATCH'])
@parser_classes([MultiPartParser, FormParser])
def editar_paquete(request, paquete_id):
    if request.method in ['PUT', 'PATCH']:
        # Se usa try-except para manejar el caso en que el paquete no exista
        try:
            paquete = PaqueteTuristico.objects.get(id=paquete_id)
        except PaqueteTuristico.DoesNotExist:
            return Response({'error': 'Paquete no encontrado.'}, status=404)
        # Si la petición es multipart (con imágenes), usamos request.data y request.FILES
        if request.content_type and request.content_type.startswith('multipart'):
            data = request.data
        else:
            # Si es JSON puro, usamos json.loads
            data = json.loads(request.body)
        # Se actualizan los campos del paquete con los datos del cuerpo de la solicitud
        nombre = data.get('nombre')
        descripcion = data.get('descripcion')
        precio_base = data.get('precio_base')
        duracion_dias = data.get('duracion_dias')
        cupo_maximo = data.get('cupo_maximo')
        estado = data.get('estado')
        if nombre: paquete.nombre = nombre
        if descripcion: paquete.descripcion = descripcion
        if precio_base: paquete.precio_base = precio_base
        if duracion_dias: paquete.duracion_dias = duracion_dias
        if cupo_maximo: paquete.cupo_maximo = cupo_maximo
        if estado: paquete.estado = estado
        paquete.save()
        # Eliminar imágenes si se especifica (solo si viene el campo imagenes_eliminar)
        imagenes_eliminar = data.get('imagenes_eliminar')
        if imagenes_eliminar:
            try:
                ids = json.loads(imagenes_eliminar) if isinstance(imagenes_eliminar, str) else imagenes_eliminar
                ImagenPaquete.objects.filter(id__in=ids, paquete=paquete).delete()
            except Exception:
                pass
        # Añadir nuevas imágenes si se enviaron (solo si es multipart)
        if hasattr(request, 'FILES'):
            imagenes = request.FILES.getlist('imagenes')
            for img in imagenes:
                # Validar tamaño de imagen antes de guardar
                imagen_obj = ImagenPaquete(paquete=paquete, imagen=img)
                try:
                    imagen_obj.full_clean()  # Ejecuta los validadores, incluido el de tamaño
                    imagen_obj.save()
                except ValidationError as e:
                    return Response({'error': e.message_dict.get('imagen', ['Error de validación'])[0]}, status=400)
        # Preparamos la respuesta con las imágenes actuales del paquete
        imagenes_data = []
        for imagen in paquete.imagenes.all():
            tiene_imagen_propia = imagen.imagen and hasattr(imagen.imagen, 'url')
            imagenes_data.append({
                'id': imagen.id,
                'descripcion': imagen.descripcion,
                'imagen_url': imagen.imagen_url,
                'es_predeterminada': not tiene_imagen_propia
            })
        paquete_data = {
            'id': paquete.id,
            'nombre': paquete.nombre,
            'descripcion': paquete.descripcion,
            'precio_base': float(paquete.precio_base),
            'duracion_dias': paquete.duracion_dias,
            'cupo_maximo': paquete.cupo_maximo,
            'estado': paquete.estado,
            'imagenes': imagenes_data
        }
        # Si se actualiza correctamente, se devuelve un mensaje de éxito y los datos actualizados
        return Response({'ok': True, 'mensaje': 'Paquete actualizado correctamente.', 'paquete': paquete_data})
    # Se devuelve un error 405 si el método no es PUT o PATCH
    return Response({'error': 'Método no permitido'}, status=405)

# api para eliminar un paquete turístico
# Se usa DELETE para eliminar un paquete turístico
# Se usa el id del paquete turístico para identificar cuál se va a eliminar
# Se usa try-except para manejar el caso en que el paquete no exista
# Si el paquete no existe, se devuelve un error 404
# Si se elimina correctamente, se devuelve un mensaje de éxito
# Se devuelve un error 405 si el método no es DELETE
@api_view(['DELETE'])
def eliminar_paquete(request, paquete_id):
    if request.method == 'DELETE':
        try:
            paquete = PaqueteTuristico.objects.get(id=paquete_id)
            paquete.delete()
            return Response({'ok': True, 'mensaje': 'Paquete eliminado correctamente.'})
        except PaqueteTuristico.DoesNotExist:
            return Response({'error': 'Paquete no encontrado.'}, status=404)
    return Response({'error': 'Método no permitido'}, status=405)

# en esta api get, cogemos todos los usuarios del sistema, para la gestion de usuarios en formato tabla
# y los devolvemos en un formato JSON, para que se puedan mostrar en una tabla
# Se usa el modelo User de Django para obtener todos los usuarios
# Se usa el decorador @api_view para indicar que es una vista de API
@api_view(['GET'])
def gestion_usuarios_tabla(request):
    usuarios = User.objects.all()
    data = []
    for user in usuarios:
        data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'rol': user.rol,
            'last_login': user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else None,
            'is_active': user.is_active,
            'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M:%S')
        })
    return Response(data)

# api para crear un usuario
# Se usa el modelo User de Django para crear un nuevo usuario
@api_view(['POST'])
def crear_usuario(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        rol = data.get('rol', 'usuario')
        user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            rol=rol
        )
        user.set_password(password)
        user.save()
        return Response({'200': True, 'mensaje': 'Usuario creado correctamente.'})
    return Response({'error': 'Método no permitido'}, status=405)

# api para editar un usuario
@api_view(['PUT', 'PATCH'])
def editar_usuario(request, user_id):
    if request.method in ['PUT', 'PATCH']:
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado.'}, status=404)
        
        # cogemos los datos del cuerpo de la solicitud
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        rol = data.get('rol', user.rol)

        # datos / campos validos, para editar el usuario
        user.username = username
        user.email = email
        user.first_name = first_name
        user.last_name = last_name
        user.rol = rol
        if password:
            user.set_password(password)
        # guardamos el usuario
        # si no se cambia el password, no hace falta llamar a set_password
        user.save()
        return Response({'200': True, 'mensaje': 'Usuario editado correctamente.'})
    return Response({'error': 'Método no permitido'}, status=405)

# api para eliminar un usuario
@api_view(['DELETE'])
def eliminar_usuario(request, user_id):
    if request.method == 'DELETE':
        try:
            # cogemos el usuario por su id
            user = User.objects.get(id=user_id)
            # lo eliminamos
            # si no existe, se lanza una excepción User.DoesNotExist
            # si se elimina correctamente, se devuelve un mensaje de éxito
            user.delete()
            return Response({'200': True, 'mensaje': 'Usuario eliminado correctamente.'})
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado.'}, status=404)
    return Response({'error': 'Método no permitido'}, status=405)