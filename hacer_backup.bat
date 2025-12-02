@echo off
title Backup Base de Datos - CRM Fabrica
color 0E

echo.
echo ==========================================
echo    BACKUP DE BASE DE DATOS
echo    CRM Fabrica AP Guerrero
echo ==========================================
echo.

set "PROJECT_DIR=%~dp0"
set "BACKUP_FILE=%PROJECT_DIR%BASE_DATOS_BACKUP_COMPLETO.sql"

echo Exportando base de datos 'fabrica'...
echo Archivo: %BACKUP_FILE%
echo.
echo (Te pedira la contrasena de PostgreSQL)
echo.

pg_dump -U postgres -d fabrica -F p -f "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo    BACKUP COMPLETADO EXITOSAMENTE
    echo ==========================================
    echo.
    echo Archivo creado: BASE_DATOS_BACKUP_COMPLETO.sql
    echo.
    echo Ahora puedes copiar toda la carpeta al disco duro.
    echo.
) else (
    echo.
    echo [ERROR] No se pudo crear el backup.
    echo Verifica que PostgreSQL este instalado y corriendo.
    echo.
)

pause
