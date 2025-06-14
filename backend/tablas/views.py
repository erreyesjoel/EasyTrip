from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

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
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')

    if not username or not password:
        return Response({'error': 'Username y password son requeridos.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'El usuario ya existe.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, password=password, email=email)
    return Response({'mensaje': 'Usuario creado correctamente.'}, status=status.HTTP_201_CREATED)