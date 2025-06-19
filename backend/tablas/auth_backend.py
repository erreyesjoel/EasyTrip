from django.contrib.auth.models import User

class EmailOrUsernameModelBackend:
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # Buscar por username
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            # Buscar por email
            try:
                user = User.objects.get(email=username)
            except User.DoesNotExist:
                return None
        if user.check_password(password) and user.is_active:
            return user
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None