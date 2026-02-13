# 💻 Guía: Instalar el Proyecto en una Nueva Máquina

Si cambias de computador o formateas tu PC, sigue estos pasos para volver a montar tu entorno de desarrollo local.

## 📋 1. Requisitos Previos
Asegúrate de instalar esto antes de empezar:
1.  **Git:** [Descargar](https://git-scm.com/downloads)
2.  **Python 3.10+:** [Descargar](https://www.python.org/downloads/)
3.  **Node.js (v18+):** [Descargar](https://nodejs.org/)
4.  **PostgreSQL:** [Descargar](https://www.postgresql.org/download/)

---

## 📥 2. Descargar el Código
Abre una terminal en la carpeta donde guardarás tus proyectos:

```bash
git clone https://github.com/JOHNINFA/crm-fabrica.git
cd crm-fabrica
```

---

## 🐍 3. Configurar Backend (Python/Django)

1.  **Crear entorno virtual:**
    ```bash
    python -m venv venv
    ```
2.  **Activar entorno:**
    *   **Windows:** `.\venv\Scripts\activate`
    *   **Linux/Mac:** `source venv/bin/activate`
3.  **Instalar librerías:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Configurar Base de Datos:**
    *   Abre `pgAdmin` o tu terminal SQL y crea una base de datos vacía llamada `fabrica`.
    *   *(Opcional)* Si tienes un respaldo `.sql` de tu maquina anterior, restáuralo aquí. Si no, Django creará las tablas vacías en el siguiente paso.
5.  **Migrar (Crear tablas):**
    ```bash
    python manage.py migrate
    ```
6.  **Crear Superusuario (Admin):**
    ```bash
    python manage.py createsuperuser
    ```

---

## ⚛️ 4. Configurar Frontend (React)

1.  **Ir a la carpeta frontend:**
    ```bash
    cd frontend
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
3.  **Crear archivo `.env`:**
    Crea un archivo llamado `.env` dentro de la carpeta `frontend/` y pega esto:
    ```env
    REACT_APP_API_URL=http://localhost:8000/api
    ```

---

## ▶️ 5. Iniciar el Proyecto (Día a Día)

Necesitarás dos terminales abiertas:

**Terminal 1 (Backend):**
```bash
# En la carpeta principal
source venv/bin/activate  # (o activate en Windows)
python manage.py runserver
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

¡Listo! Abre `http://localhost:3000` y deberías ver tu sistema funcionando.
