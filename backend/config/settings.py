"""
Django settings for feeder project.

Generated by 'django-admin startproject' using Django 4.2.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""
import os
from pathlib import Path
from dotenv import load_dotenv


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-gm+y$(1-=fa2kq0-yu9k$ivr!&x+81n%agk(8_xsaqc4a-ndcw'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = []

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'django_filters',
    'drf_spectacular',
    'dj_rest_auth',
    'corsheaders',
    'feeder',
    'log_api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'log_api.middleware.RequestLogMiddleware',
]

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3001',
    'http://localhost:3002'
]
CORS_ALLOW_CREDENTIALS = True

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'feeder.authentication.KitchenPinAuthentication',
        'feeder.authentication.QRAuthentication',
    ],
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.LimitOffsetPagination',
    'PAGE_SIZE': 100,
}

REST_AUTH = {
    'USER_DETAILS_SERIALIZER': 'feeder.serializers.UserDetailSerializer'
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Insomnia Feeder v1',
    'DESCRIPTION': 'Backend API for Insomnia Feeder v1',
    'SERVE_INCLUDE_SCHEMA': False,

    'VERSION': 'v1',
    'SCHEMA_PATH_PREFIX': r'/api/v\d+/',
    'SWAGGER_UI_SETTINGS': {
        'persistAuthorization': True,
        'docExpansion': 'none',
        'operationsSorter': 'alpha',
        'tagsSorter': 'alpha',
    },
    # 'SERVE_AUTHENTICATION': ['rest_framework.authentication.SessionAuthentication', ],
    # 'SERVE_PERMISSIONS': ['rest_framework.permissions.IsAuthenticated', ],
}


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'ru-ru'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

FIXTURE_DIRS = [
    os.path.join(BASE_DIR, 'initial/fixtures')
]

# Загрузка переменных для разработки запускаемой вне Docker контейнера
env_file = BASE_DIR / ".env"
if env_file.exists():
    load_dotenv(env_file)

SENTRY_DSN = os.environ.get("SENTRY_DSN", "")
if SENTRY_DSN:
    from sentry_sdk.integrations.django import DjangoIntegration
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],

        # Set traces_sample_rate to 1.0 to capture 100%
        # of transactions for performance monitoring.
        # We recommend adjusting this value in production.
        traces_sample_rate=1.0,

        # If you wish to associate users to errors (assuming you are using
        # django.contrib.auth) you may enable sending PII data.
        send_default_pii=True
    )


DEBUG = os.environ.get("DEBUG", "") == "True"

SECRET_KEY = os.environ.get("SECRET_KEY", "")

NOTION_AUTH_HEADER = os.environ.get("NOTION_AUTH_HEADER", "")

ALLOWED_HOSTS = [h.strip() for h in os.environ.get("ALLOWED_HOSTS", "127.0.0.1,localhost").split(",") if h]

CSRF_TRUSTED_ORIGINS = [h.strip() for h in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",") if h]

AGREEMOD_PEOPLE_URL = os.environ.get("AGREEMOD_PEOPLE_URL", "")
AGREEMOD_ARRIVED_PERSON_URL = os.environ.get("AGREEMOD_ARRIVED_PERSON_URL", "")
AGREEMOD_ARRIVED_BULK_URL = os.environ.get("AGREEMOD_ARRIVED_BULK_URL", "")

IS_SYNC_TO_NOTION_ON = os.environ.get("IS_SYNC_TO_NOTION_ON", "False")

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': os.environ.get("DB_ENGINE", ""),  # Add 'postgresql_psycopg2', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': os.environ.get("DB_NAME", ""),      # Or path to database file if using sqlite3.
        # The following settings are not used with sqlite3:
        'USER': os.environ.get("DB_USER", ""),
        'PASSWORD': os.environ.get("DB_PASSWORD", ""),
        'HOST': os.environ.get("DB_HOST", ""),
        'PORT': os.environ.get("DB_PORT", ""),
    },
}

TIME_ZONE = os.environ.get("TIME_ZONE", "UTC")
PUBLIC_SITE_URL = os.environ.get("PUBLIC_SITE_URL", "")

EMAIL_HOST = os.environ.get("EMAIL_HOST", "")
EMAIL_PORT = os.environ.get("EMAIL_PORT", 465)
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_SSL = True
EMAIL_FROM = os.environ.get("EMAIL_FROM", "")

SERVER_EMAIL = EMAIL_FROM

_email_backend = os.environ.get("EMAIL_BACKEND", "")
if _email_backend:
    EMAIL_BACKEND = _email_backend

# APPEND_SLASH = False
