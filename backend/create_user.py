### content of "create_user.py" file
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

UserModel = get_user_model()

user, created = UserModel.objects.get_or_create(
    username='admin',
    defaults={'is_superuser': True, 'is_staff': True}
)
if created:
    user.set_password('Kolombina25')
    user.save()
else:
    # ensure password is set (e.g. after loaddata)
    if not user.check_password('Kolombina25'):
        user.set_password('Kolombina25')
        user.save()
Token.objects.get_or_create(user=user)
