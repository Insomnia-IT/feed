import os

from django.apps import AppConfig
from django.db.backends.signals import connection_created

class FeederConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'feeder'
    verbose_name = "Кормитель"

    def ready(self):
        connection_created.connect(load_icu)

def load_icu(connection, **kwargs):
    extension_path = './icu/libSqliteIcu.so'

    if (vendor := connection.vendor) != 'sqlite':
        print('Vendor {} is not configured to load ICU extension'.format(vendor))
        return
    elif not os.path.exists(extension_path):
        print("File of ICU extension doesn't exist by {} path".format(extension_path))
        return

    try:
        connection.connection.enable_load_extension(True)

        # skip file extension for loading
        connection.connection.load_extension(extension_path[:-3])

        connection.connection.enable_load_extension(False)
    except Exception as e:
        print('Failed to load ICU extension: {}.'.format(e))
    else:
        print('ICU extension for SQLite has been loaded')