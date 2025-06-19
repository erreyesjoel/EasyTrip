from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view
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
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

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

    username = email.split('@')[0]  # Genera el username a partir del email

    # PRIMERO: comprobar email
    if User.objects.filter(email=email).exists():
        return Response({'error': 'El email ya está registrado.'}, status=status.HTTP_400_BAD_REQUEST)

    # LUEGO: comprobar username
    if User.objects.filter(username=username).exists():
        return Response({'error': 'El usuario ya existe.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        first_name=first_name,
        last_name=last_name
    )
    return Response({'mensaje': 'Usuario creado correctamente.', 'username': username}, status=status.HTTP_201_CREATED)

@csrf_exempt
def enviar_codigo_verificacion(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        if not email:
            return JsonResponse({'error': 'Email requerido'}, status=400)
        # NUEVO: comprobar si el email ya está registrado
        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'El email ya está registrado.'}, status=400)
        # Generar código de 6 dígitos
        codigo = str(random.randint(100000, 999999))
        # Guardar en la base de datos con fecha_expiracion a 7 minutos
        CodigoVerificacion.objects.create(
            email=email,
            codigo=codigo,
            fecha_expiracion=timezone.now() + timedelta(minutes=7)
        )
        # Enviar email con HTML y APP_NAME en negrita
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
        # Busca el código más reciente, no usado y no expirado
        ahora = timezone.now()
        codigos = CodigoVerificacion.objects.filter(
            email=email,
            codigo=codigo,
            usado=False,
            fecha_expiracion__gte=ahora
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
                secure=False,  # Usa False en desarrollo (HTTP), True en producción (HTTPS)
                samesite='Lax'
            )
            response.set_cookie(
                key='refresh_token',
                value=refresh,
                httponly=True,
                secure=False,
                samesite='Lax'
            )
        return response