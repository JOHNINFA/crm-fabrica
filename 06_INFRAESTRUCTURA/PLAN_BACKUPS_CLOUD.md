# Plan de Implementación: Sistema Integral de Backups y Gestión VPS

Este plan detalla la creación de un módulo avanzado de administración de datos para el VPS directamente desde la interfaz web, incluyendo respaldos, restauración, integración con la nube y gestión del dominio.

---

## 🏗️ Fase 1: Backend de Backups (Django)
**Objetivo:** Permitir que Django interactúe con el sistema operativo para gestionar la base de datos PostgreSQL.

1.  **Nuevo Servicio de Respaldo (`api/utils/backup_manager.py`):**
    *   Función `create_backup()`: Ejecuta `pg_dump` y guarda el archivo comprimido `.sql.gz` en una carpeta segura fuera del acceso público.
    *   Función `list_backups()`: Escanea la carpeta y retorna una lista con nombre, fecha, tamaño y ruta para descarga.
    *   Función `restore_database(filename)`: Cierra conexiones activas y ejecuta `psql < backup.sql` para restaurar. **(Acción Crítica: Requiere confirmación y contraseña de admin)**.
    *   Función `delete_backup(filename)`: Elimina archivos físicos para liberar espacio.
    *   **Función `clean_data_by_range(start_date, end_date)`:** Elimina registros transaccionales (Ventas, Pedidos, Movimientos) dentro de un rango de fechas específico para liberar espacio en la base de datos viva. *Requisito previo: Haber generado un backup.*

2.  **API Endpoints (`api/views/backup_views.py`):**
    *   `GET /api/backups/`: Listar respaldos.
    *   `POST /api/backups/create/`: Generar nuevo respaldo ahora.
    *   `GET /api/backups/download/<filename>/`: Descargar el archivo al PC local.
    *   `POST /api/backups/restore/`: Restaurar un respaldo seleccionado.
    *   `DELETE /api/backups/<filename>/`: Borrar respaldo del VPS.
    *   `POST /api/backups/clean-range/`: Endpoint para ejecutar la limpieza por rango de fechas.

---

## 🖥️ Fase 2: Interfaz Web (React) - Módulo "Administración VPS"
**Objetivo:** Crear una interfaz amigable pero segura para estas operaciones críticas.

1.  **Nuevo Componente `BackupManager.jsx`:**
    *   Tabla interactiva de backups (Fecha, Tamaño, Acciones).
    *   Botón grande **"Generar Nuevo Respaldo"** (con spinner de carga).
    *   Botón **"Restaurar"** (protegido con modal de doble confirmación: "Escriba RESTAURAR para confirmar").
    *   Indicador de espacio en disco disponible en el VPS.

2.  **Integración en `Herramientas.jsx`:**
    *   Agregar una pestaña o sección dedicada a este nuevo componente.

---

## ☁️ Fase 3: Integración Cloud (Google Drive / S3)
**Objetivo:** Automatizar la subida de respaldos a la nube para no depender solo del disco local del VPS.

1.  **Investigación MCP vs API Directa:**
    *   *Nota Técnica:* MCP (Model Context Protocol) es para agentes de IA. Para una aplicación web Django, lo estándar es usar la API de Google Drive (`google-auth`, `google-api-python-client`) directamente.
2.  **Configuración de Google Drive:**
    *   Crear credenciales de "Service Account" en Google Cloud Console.
    *   Compartir una carpeta de Drive con ese email de servicio.
3.  **Servicio de Sincronización:**
    *   Script en Django que detecta nuevos backups locales y los sube a Drive automáticamente.
    *   Opción en frontend: "Enviar a la Nube".

---

## 🌐 Fase 4: Dominio y Conectividad Móvil (Prioridad Inmediata)
**Objetivo:** Resolver los problemas actuales antes de añadir nuevas funcionalidades complejas.

1.  **Dominio (`aglogistics.tech`):**
    *   Verificar configuración de certificados SSL (HTTPS).
    *   Asegurar que Nginx redireccione correctamente `www` y sin `www`.

2.  **App Móvil:**
    *   Verificar que la App apunte a `https://aglogistics.tech/api`.
    *   Probar Login desde un dispositivo real.
    *   Ajustar CORS si es necesario.

---

## 📅 Orden de Ejecución Sugerido

1.  **Paso 1 (Inmediato):** Arreglar el Dominio y probar la App Móvil (para asegurar que el sistema actual funciona al 100%).
2.  **Paso 2:** Crear el sistema de Backups Local (Crear, Listar, Descargar, Borrar) en Backend y Frontend.
3.  **Paso 3:** Implementar la Restauración (es lo más delicado).
4.  **Paso 4:** Conectar con Google Drive para respaldos en la nube.
