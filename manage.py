#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

def load_env_file(filename):
    """Carga variables de entorno desde un archivo .env simple"""
    try:
        with open(filename) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    key, _, value = line.partition('=')
                    if key and value:
                        os.environ.setdefault(key.strip(), value.strip())
    except FileNotFoundError:
        pass

def main():
    """Run administrative tasks."""
    # Cargar variables de entorno locales
    base_dir = os.path.dirname(os.path.abspath(__file__))
    load_env_file(os.path.join(base_dir, '.env'))
    load_env_file(os.path.join(base_dir, '.env.ai'))

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
