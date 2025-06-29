"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from tablas.views import ejemplo_get, registro_usuario, enviar_codigo_verificacion, verificar_codigo, enviar_codigo_recuperacion, cambiar_password_con_codigo
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from tablas.views import CustomTokenObtainPairView, usuario_actual, logout_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/ejemplo/', ejemplo_get, name='ejemplo_get'),  # <--- agrega la URL para la vista
    path('api/registro/', registro_usuario, name='registro_usuario'),  # <--- agrega la URL para la vista
    path('api/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),  # <-- login JWT
    path('api/refresh/', TokenRefreshView.as_view(), name='token_refresh'),        # <-- refresh token
    path('api/registro-codigo/', enviar_codigo_verificacion, name='enviar_codigo_verificacion'),
    path('api/verificar-codigo/', verificar_codigo, name='verificar_codigo'),
    path('api/recuperar-password/', enviar_codigo_recuperacion, name='enviar_codigo_recuperacion'),
    path('api/cambiar-password/', cambiar_password_con_codigo, name='cambiar_password_con_codigo'),
    path('api/usuario/', usuario_actual, name='usuario_actual'),
    path('api/logout/', logout_view, name='logout_view'),
]

