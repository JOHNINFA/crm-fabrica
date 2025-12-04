# Instrucciones para Colaborador - Windows

## Requisitos Previos
- Docker Desktop instalado y corriendo en Windows
- Git instalado

## Configuración Inicial

### 1. Clonar el Repositorio
```bash
git clone https://github.com/JOHNINFA/crm-fabrica.git
cd crm-fabrica
```

### 2. Levantar los Contenedores Docker
```bash
docker-compose up -d
```

Este comando descargará las imágenes necesarias y levantará 3 contenedores:
- Frontend (React)
- Backend (Django)
- PostgreSQL

### 3. Verificar que Todo Esté Corriendo
```bash
docker-compose ps
```

Deberías ver 3 contenedores activos.

### 4. Acceder a la Aplicación
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000
- **Base de datos:** localhost:5432

---

## Actualizar Cambios del Proyecto

Cuando haya nuevos cambios en el repositorio:

### 1. Descargar los Cambios
```bash
git pull
```

### 2. Reconstruir y Reiniciar los Contenedores
```bash
docker-compose up -d --build
```

El flag `--build` reconstruye las imágenes con los nuevos cambios.

---

## Comandos Útiles

### Ver logs de los contenedores
```bash
# Todos los contenedores
docker-compose logs

# Solo un contenedor específico
docker-compose logs frontend
docker-compose logs backend
docker-compose logs postgres
```

### Detener los contenedores
```bash
docker-compose down
```

### Reiniciar los contenedores
```bash
docker-compose restart
```

### Ver contenedores corriendo
```bash
docker ps
```

### Entrar a un contenedor (para debugging)
```bash
docker exec -it crm-fabrica_backend bash
docker exec -it crm-fabrica_frontend sh
```

---

## Solución de Problemas

### Si los contenedores no inician correctamente:
```bash
docker-compose down
docker-compose up -d --build
```

### Si hay problemas con la base de datos:
```bash
docker-compose down -v
docker-compose up -d
```
⚠️ Esto eliminará los datos de la base de datos.

### Ver errores específicos:
```bash
docker-compose logs -f
```

---

## Notas Importantes

- Asegúrate de que Docker Desktop esté corriendo antes de ejecutar comandos
- Los puertos 3000, 8000 y 5432 deben estar libres en tu máquina
- Siempre haz `git pull` antes de empezar a trabajar para tener la última versión
- Si modificas código, los cambios se reflejarán automáticamente (hot reload)

---

## Contacto
Si tienes problemas, contacta al equipo de desarrollo.
