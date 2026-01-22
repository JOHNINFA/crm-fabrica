# Guía de Trabajo: De Local a Producción (VPS)

Esta guía documenta el flujo de trabajo correcto para desarrollar nuevas funcionalidades en tu máquina local y desplegarlas de forma segura en tu servidor de producción (VPS: `76.13.96.225`), sin perder datos ni romper el servicio.

## 🟢 Concepto Clave
*   **Entorno Local (Tu PC):** Aquí escribes código, pruebas, y rompes cosas. Los datos aquí son de prueba.
*   **Entorno Producción (VPS):** Aquí **SOLO** subes código verificado. **NUNCA** sobrescribes la base de datos de producción con la local. Los datos aquí son reales (ventas, clientes reales) y son sagrados.

---

## 🛠️ 1. Configuración del Entorno Local

Para trabajar cómodamente en tu máquina sin modificar código cada vez:

1.  **Backend (Django):** Se ejecuta con el comando habitual.
    ```bash
    python manage.py runserver 0.0.0.0:8000
    ```
2.  **Frontend (React):** Hemos configurado un archivo `.env` en `frontend/.env` para que se conecte automáticamente a tu backend local.
    ```bash
    cd frontend
    npm start
    ```

---

## 🚀 2. Flujos de Despliegue (Cómo subir cambios)

Dependiendo de qué modificaste, el proceso varía ligeramente. Elige el escenario:

### Escenario A: Cambios Visuales (Frontend - React)
*Ej: Cambiar colores, ocultar botones, nuevos componentes.*

1.  **En Local:** Realiza el cambio y verifica en `localhost:3000` que se vea bien.
2.  **Subir Archivo(s):** Copia solo los archivos modificados al VPS.
    ```bash
    # Ejemplo: Si modificaste Sidebar.jsx
    scp frontend/src/components/Pedidos/Sidebar.jsx root@76.13.96.225:~/crm-fabrica/frontend/src/components/Pedidos/
    ```
3.  **Aplicar en VPS:** Debes reconstruir el contenedor de frontend para que "compile" el nuevo código React.
    ```bash
    ssh root@76.13.96.225 "cd ~/crm-fabrica && docker compose -f docker-compose.prod.yml up -d --build frontend"
    ```

### Escenario B: Cambios de Lógica Backend (Python/Django)
*Ej: Cambiar una fórmula de cálculo, una validación, una nueva API.*

1.  **En Local:** Modifica tu `views.py` o `serializers.py` y prueba.
2.  **Subir Archivo(s):**
    ```bash
    # Ejemplo: Si modificaste views.py
    scp api/views.py root@76.13.96.225:~/crm-fabrica/api/
    ```
3.  **Aplicar en VPS:** Solo necesitas reiniciar el contenedor backend (es más rápido que reconstruir, a menos que añadas librerías).
    ```bash
    ssh root@76.13.96.225 "cd ~/crm-fabrica && docker compose -f docker-compose.prod.yml restart backend"
    ```

### Escenario C: Cambios en Base de Datos (Modelos)
*Ej: Agregar una columna nueva a una tabla (como hicimos con 'zona_barrio').* **¡CUIDADO AQUÍ!**

1.  **En Local:**
    *   Modifica `models.py`.
    *   Crea la migración: `python manage.py makemigrations`
    *   Aplica localmente para probar: `python manage.py migrate`
2.  **Subir Archivos:** Necesitas subir tanto el `models.py` como el nuevo archivo de migración generado en `api/migrations/`.
    ```bash
    # 1. Subir modelo
    scp api/models.py root@76.13.96.225:~/crm-fabrica/api/
    
    # 2. Subir EL NUEVO archivo de migración (ej: 0015_nuevo_campo.py)
    scp api/migrations/0015_nuevo_campo.py root@76.13.96.225:~/crm-fabrica/api/migrations/
    ```
3.  **Aplicar en VPS:** Ejecuta el comando de migración DENTRO del contenedor de producción.
    ```bash
    ssh root@76.13.96.225 "cd ~/crm-fabrica && docker exec crm_backend_prod python manage.py migrate"
    ```
4.  **Reiniciar:**
    ```bash
    ssh root@76.13.96.225 "cd ~/crm-fabrica && docker compose -f docker-compose.prod.yml restart backend"
    ```

### Escenario D: Instalar nuevas librerías (pip install x)

1.  **En Local:** Instala y actualiza `requirements.txt`:
    ```bash
    pip install nombre_libreria
    pip freeze > requirements.txt
    ```
2.  **Subir:**
    ```bash
    scp requirements.txt root@76.13.96.225:~/crm-fabrica/
    ```
3.  **Aplicar en VPS:** Reconstruir backend obligatoriamente.
    ```bash
    ssh root@76.13.96.225 "cd ~/crm-fabrica && docker compose -f docker-compose.prod.yml up -d --build backend"
    ```

---

## 🚫 COSAS PROHIBIDAS (Zona de Peligro)

1.  **NUNCA subir tu base de datos local (dump.sql) a producción** si el sistema ya está en uso. Borraría las ventas de hoy, los clientes nuevos, etc.
2.  **NUNCA borrar la carpeta `media/` en el VPS.** Ahí están las fotos que suben los usuarios reales.
3.  **No editar código directamente en el VPS (nano/vim)** a menos que sea una emergencia crítica. Siempre edita en local -> sube al VPS. Esto mantiene tu código local sincronizado con el real.

---

## 🆘 Comandos Rápidos de Mantenimiento VPS

*   **Ver Logs (Si algo falla):**
    ```bash
    ssh root@76.13.96.225 "docker logs --tail 100 -f crm_backend_prod"  # Backend
    ssh root@76.13.96.225 "docker logs --tail 100 -f crm_frontend_prod" # Frontend
    ssh root@76.13.96.225 "docker logs --tail 100 -f crm_nginx"         # Servidor web
    ```

*   **Hacer Backup de Emergencia (Datos Reales):**
    Descarga los datos del VPS a tu máquina.
    ```bash
    # Desde tu terminal local
    ssh root@76.13.96.225 "docker exec crm_postgres_prod pg_dump -U ventas_user fabrica" > respaldo_produccion_$(date +%F).sql
    ```
