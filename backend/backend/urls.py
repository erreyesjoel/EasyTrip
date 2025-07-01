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
from tablas.views import editar_paquete, ejemplo_get, eliminar_paquete, obtener_paquetes, registro_usuario, crear_paquete, enviar_codigo_verificacion, verificar_codigo, enviar_codigo_recuperacion, cambiar_password_con_codigo, gestion_usuarios_tabla, crear_usuario, editar_usuario, eliminar_usuario, obtener_roles_usuario
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from tablas.views import CustomTokenObtainPairView, usuario_actual, logout_view
from django.conf import settings
from django.conf.urls.static import static

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
    path('api/paquetes/', obtener_paquetes, name='obtener_paquetes'),
    path('api/crear-paquete/', crear_paquete, name='crear_paquete'),
    path('api/editar-paquete/<int:paquete_id>/', editar_paquete, name='editar_paquete'),  # Para editar un paquete
    path('api/eliminar-paquete/<int:paquete_id>/', eliminar_paquete, name='eliminar_paquete'),  # Para eliminar un paquete
    path('api/gestion-usuarios/', gestion_usuarios_tabla, name='gestion_usuarios_tabla'),
    path('api/crear-usuario/', crear_usuario, name='crear_usuario'),
    path('api/editar-usuario/<int:user_id>/', editar_usuario, name='editar_usuario'),
    path('api/eliminar-usuario/<int:user_id>/', eliminar_usuario, name='eliminar_usuario'),
    path('api/roles-usuario/', obtener_roles_usuario, name='obtener_roles_usuario'),
]

# Solo en desarrollo: sirve archivos media desde MEDIA_URL
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Configuración para servir archivos estáticos (predeterminados) SOLO EN PRODUCCION, COMO MEDIA_URL
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
