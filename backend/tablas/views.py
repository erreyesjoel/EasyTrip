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
    })
