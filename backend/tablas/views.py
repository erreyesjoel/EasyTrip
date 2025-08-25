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
from .models import PaqueteTuristico, ImagenPaquete, Reserva
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Count

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
        # Preparamos la respuesta with las imágenes actuales del paquete
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
    """
    Devuelve la lista de usuarios, permitiendo filtrar por email, rol y estado (is_active).
    Parámetros de query string:
      - email: filtra por email (contiene, insensible a mayúsculas)
      - rol: filtra por rol exacto
      - estado: 'activo' o 'inactivo' (mapea a is_active True/False)
    """
    usuarios = User.objects.all()

    email = request.GET.get('email')
    rol = request.GET.get('rol')
    estado = request.GET.get('estado')

    if email:
        usuarios = usuarios.filter(email__icontains=email)
    if rol:
        usuarios = usuarios.filter(rol=rol)
    if estado == 'activo':
        usuarios = usuarios.filter(is_active=True)
    elif estado == 'inactivo':
        usuarios = usuarios.filter(is_active=False)

    # ordering es propio de Django, permite ordenar los resultados ascendentemente o descendentemente
    # por un campo específico, por ejemplo: ?ordering=username
    ordering = request.GET.get('ordering')
    if ordering:
        usuarios = usuarios.order_by(ordering)

    data = []
    for user in usuarios:
        data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'rol': user.rol,
            'is_active': user.is_active,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'last_login': user.last_login,
            'date_joined': user.date_joined,
        })
    return Response(data)

# api para crear un usuario
# Se usa el modelo User de Django para crear un nuevo usuario
# api para crear un usuario
# Se usa el modelo User de Django para crear un nuevo usuario
@api_view(['POST'])
def crear_usuario(request):
    if request.method == 'POST':
        # Recoge los datos del request
        data = request.data
        username = data.get('username')
        email = data.get('email')
        rol = data.get('rol', 'usuario')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')

        # Validaciones básicas
        if not username or not email:
            return Response({'error': 'Username y email son requeridos.'}, status=400)
        if User.objects.filter(username=username).exists():
            return Response({'error': 'El usuario ya existe.'}, status=400)
        if User.objects.filter(email=email).exists():
            return Response({'error': 'El email ya existe.'}, status=400)
        if '@' not in email or '.' not in email:
            return Response({'error': 'El email no es válido.'}, status=400)

        # Crea el usuario
        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            rol=rol
        )
        # Genera el token seguro
        token = default_token_generator.make_token(user)
        enlace = f'{settings.FRONTEND_URL}definir-password?user_id={user.id}&token={token}'
        send_mail(
            subject=f'Bienvenido a {settings.APP_NAME}',
            message=(
                f'¡Hola {first_name}!\n\n'
                f'Tu cuenta en {settings.APP_NAME} ha sido creada correctamente.\n'
                f'Tu nombre de usuario es: {username}\n\n'
                f'Por favor define tu contraseña en el siguiente enlace:\n{enlace}\n\n'
                '¡Gracias por registrarte!'
            ),
            from_email=f"{settings.APP_NAME} <{settings.EMAIL_HOST_USER}>",
            recipient_list=[email],
            fail_silently=True
        )
        return Response({
            'ok': True,
            'mensaje': 'Usuario creado correctamente.',
            'usuario': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'rol': user.rol
            }
        }, status=201)
    return Response({'error': 'Método no permitido'}, status=405)

# api patch para cambiar estado de usuario, activo o no
@api_view(['PATCH'])
def cambiar_estado_usuario(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Usuario no encontrado.'}, status=404)
    is_active = request.data.get('is_active')
    if is_active is None:
        return Response({'error': 'Falta el campo is_active.'}, status=400)
    user.is_active = bool(is_active)
    user.save()
    return Response({'mensaje': f'Usuario {"activado" if user.is_active else "desactivado"} correctamente.'}, status=200)

# api para editar un usuario
# api para editar un usuario
@api_view(['PUT', 'PATCH'])
def editar_usuario(request, user_id):
    if request.method in ['PUT', 'PATCH']:
        # Busca el usuario por su ID
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado.'}, status=404)

        # Solo permitimos editar email y rol
        data = request.data
        email = data.get('email')
        rol = data.get('rol')

        # Validación de email (opcional: puedes agregar más validaciones)
        if email:
            # Verifica que el email no esté en uso por otro usuario
            if User.objects.exclude(id=user_id).filter(email=email).exists():
                return Response({'error': 'El email ya está en uso por otro usuario.'}, status=400)
            user.email = email

        if rol:
            user.rol = rol

        user.save()
        return Response({'mensaje': 'Usuario actualizado correctamente.'})

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

@api_view(['GET'])
def obtener_roles_usuario(request):
    # Devuelve los roles definidos en el modelo User
    # Se asume que el campo se llama 'rol' y tiene choices
    roles = []
    for value, label in User._meta.get_field('rol').choices:
        roles.append({'value': value, 'label': label})
    return Response(roles)

# api get para detalles paquete en el frontend

@api_view(['GET'])
def obtener_paquete_por_id(request, paquete_id):
    try:
        paquete = PaqueteTuristico.objects.get(id=paquete_id)
        imagenes_data = []
        for imagen in paquete.imagenes.all():
            imagenes_data.append({
                'id': imagen.id,
                'descripcion': imagen.descripcion,
                'imagen_url': imagen.imagen_url,
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
        return Response(paquete_data)
    except PaqueteTuristico.DoesNotExist:
        return Response({'error': 'Paquete no encontrado'}, status=status.HTTP_404_NOT_FOUND)
@api_view(['POST'])
def reservar_paquete_por_id(request, paquete_id):
    data = request.data
    email = data.get('email')
    fecha_reservada = data.get('fecha_reservada')  # formato: 'YYYY-MM-DD'

    if not all([email, fecha_reservada]):
        return Response({'error': 'Faltan datos requeridos.'}, status=400)

    # Buscar usuario
    try:
        usuario = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'Usuario no encontrado.'}, status=404)


    # Buscar paquete
    try:
        paquete = PaqueteTuristico.objects.get(id=paquete_id)
    except PaqueteTuristico.DoesNotExist:
        return Response({'error': 'Paquete no encontrado.'}, status=404)

    # validacion, si el paquete está inactivo, no se puede reservar
    # error 403 Forbidden
    if paquete.estado == 'inactivo':
        return Response({'error': 'Paquete inactivo.'}, status=403)
    
    # buscar agentes activos
    agentes = User.objects.filter(rol='agente', is_active=True)
    agente_gestor = random.choice(agentes) if agentes.exists() else None

    # Crear reserva
    reserva = Reserva.objects.create(
        usuario=usuario,
        paquete_turistico=paquete,
        fecha_reservada=fecha_reservada,
        usuario_gestor=agente_gestor
    )
    return Response({'mensaje': 'Reserva creada correctamente.', 'reserva_id': reserva.id}, status=201)

# api get, para mostrar todas las reservas, en el panel de administración (gestion)
@api_view(['GET'])
def reservas_gestion(request):
    """
    Devuelve la lista de reservas, permitiendo filtrar por:
      - usuario (email)
      - paquete (nombre)
      - estado
      - fecha_reservada
      - usuario_gestor (email)
    Parámetros de query string:
      usuario, paquete, estado, fecha_reservada, usuario_gestor
    """
    # Diccionario de lambdas para construir los filtros dinámicamente
    filtros_map = {
        'usuario': lambda v: {'usuario__email__icontains': v},
        'paquete': lambda v: {'paquete_turistico__nombre__icontains': v},
        'estado': lambda v: {'estado': v},
        'fecha_reservada': lambda v: {'fecha_reservada': v},
        'usuario_gestor': lambda v: {'usuario_gestor__email__icontains': v},
    }
    filtros = {}
    # Recorremos cada posible filtro y lo añadimos si está presente en la query string
    for key, filter_func in filtros_map.items():
        value = request.GET.get(key)
        if value not in [None, '']:
            filtros.update(filter_func(value))

    # Filtramos las reservas según los filtros construidos
    reservas = Reserva.objects.filter(**filtros).order_by('-fecha_creacion')

    # Serializamos los datos manualmente para devolver solo lo necesario
    reservas_data = []
    for reserva in reservas:
        reservas_data.append({
            'id': reserva.id,
            'usuario': reserva.usuario.email,
            'paquete': reserva.paquete_turistico.nombre,
            # usuario gestor, cogemos el email, y si no tiene la reserva usuario gestor, null
            'usuario_gestor': reserva.usuario_gestor.email if reserva.usuario_gestor else None,
            'fecha_reservada': reserva.fecha_reservada,
            'estado': reserva.estado,
            'fecha_creacion': reserva.fecha_creacion,
            # join entre la tabla de reservas y paquete_turistico usando la fk
            'duracion_dias': reserva.paquete_turistico.duracion_dias
        })
    # Devolvemos la respuesta en formato JSON
    return Response(reservas_data)

# api para devolver los agentes activos
@api_view(['GET'])
def usuarios_agentes(request):
    agentes = User.objects.filter(rol='agente', is_active=True)
    data = [
        {
            'email': agente.email,
            'nombre': f"{agente.first_name} {agente.last_name}".strip() or agente.username
        }
        for agente in agentes
    ]
    return Response(data)

# api patch para "edtiar" una reserva (api para consumir en gestion)
# asignar gestor (agente) o actualizar el estado de la reserva
@api_view(['PATCH'])
def asignar_gestor_reserva(request, reserva_id):
    try:
        reserva = Reserva.objects.get(id=reserva_id)
    except Reserva.DoesNotExist:
        return Response({'error': 'Reserva no encontrada.'}, status=404)

    # Actualizar gestor si se envía
    email = request.data.get('usuario_gestor')
    if email:
        try:
            gestor = User.objects.get(email=email)
            reserva.usuario_gestor = gestor
        except User.DoesNotExist:
            return Response({'error': 'Gestor no encontrado.'}, status=404)

    # Actualizar estado si se envía
    estado = request.data.get('estado')
    if estado:
        reserva.estado = estado

    # Actualizar fecha si se envía
    fecha_reservada = request.data.get('fecha_reservada')
    if fecha_reservada:
        reserva.fecha_reservada = fecha_reservada

    reserva.save()
    return Response({'mensaje': 'Reserva actualizada correctamente.'}, status=200)

# api para crear reserva desde panel gestion (administracion y agente)
@api_view(['POST'])
def crear_reserva(request):
    data = request.data
    email = data.get('email')
    paquete_id = data.get('paquete_id')
    fecha_reservada = data.get('fecha_reservada')
    estado = data.get('estado', 'pendiente')

    if not all([email, paquete_id, fecha_reservada, estado]):
        return Response({'error': 'Faltan datos obligatorios.'}, status=400)

    # Buscar usuario, si no existe lo crea como invitado
    usuario, created = User.objects.get_or_create(
        email=email,
        defaults={'username': email.split('@')[0], 'is_active': True}
    )

    # Buscar paquete
    try:
        paquete = PaqueteTuristico.objects.get(id=paquete_id)
    except PaqueteTuristico.DoesNotExist:
        return Response({'error': 'Paquete no encontrado.'}, status=404)

    if paquete.estado != 'activo':
        return Response({'error': 'El paquete no está activo.'}, status=403)

    reserva = Reserva.objects.create(
        usuario=usuario,
        paquete_turistico=paquete,
        fecha_reservada=fecha_reservada,
        estado=estado
    )

    return Response({'mensaje': 'Reserva creada correctamente.', 'reserva_id': reserva.id}, status=201)

@api_view(['PATCH'])
def definicion_password(request, user_id):
    token = request.data.get('token')
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Id del usuario no existente'}, status=404)
    if user.has_usable_password():
        return Response({'error': 'El usuario ya tiene una contraseña definida.'}, status=400)
    if not default_token_generator.check_token(user, token):
        return Response({'error': 'Token inválido o expirado.'}, status=400)
    password = request.data.get('password')
    user.set_password(password)
    user.save()
    return Response({'mensaje': 'Contraseña definida correctamente.'}, status=200)

# api get para saber el total de usuarios registrados
# usando count() de Django
# from django.db.models import Count
@api_view(['GET'])
def count_usuarios(request):
    total_usuarios = User.objects.count()
    activos = User.objects.filter(is_active=True).count()
    inactivos = User.objects.filter(is_active=False).count()
    return Response({
        'total': total_usuarios,
        'activos': activos,
        'inactivos': inactivos,
    }, status=200)

@api_view(['GET'])
def count_reservas(request):
    total_reservas = Reserva.objects.count()
    pendientes = Reserva.objects.filter(estado='pendiente').count()
    confirmadas = Reserva.objects.filter(estado='confirmada').count()
    pagadas = Reserva.objects.filter(estado='pagada').count()
    canceladas = Reserva.objects.filter(estado='cancelada').count()
    finalizadas = Reserva.objects.filter(estado='finalizada').count()
    return Response({
        'total': total_reservas,
        'pendientes': pendientes,
        'confirmadas': confirmadas,
        'pagadas': pagadas,
        'canceladas': canceladas,
        'finalizadas': finalizadas,
    }, status=200)
