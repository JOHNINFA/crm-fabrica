# Dockerfile para Backend Django - CRM Fábrica
FROM python:3.10-slim

# Variables de entorno
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV TZ=America/Bogota

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gcc \
    g++ \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar requirements e instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código del proyecto
COPY . .

# Crear directorios necesarios
RUN mkdir -p media/productos media/vencidos api/ml_models

# Exponer puerto
EXPOSE 8000

# Script de entrada
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
