@echo off
title CRM Fabrica AP Guerrero
color 0A

echo.
echo ==========================================
echo    CRM FABRICA AP GUERRERO
echo    Iniciando sistema...
echo ==========================================
echo.

:: Obtener directorio actual
set "PROJECT_DIR=%~dp0"

:: Verificar que existe el entorno virtual
if not exist "%PROJECT_DIR%venv\Scripts\activate.bat" (
    echo [ERROR] No se encontro el entorno virtual.
    echo Ejecuta primero: python -m venv venv
    pause
    exit /b 1
)

:: Verificar que existe node_modules en frontend
if not exist "%PROJECT_DIR%frontend\node_modules" (
    echo [AVISO] No se encontro node_modules en frontend.
    echo Ejecutando npm install...
    cd /d "%PROJECT_DIR%frontend"
    npm install
    cd /d "%PROJECT_DIR%"
)

echo [1/2] Iniciando Backend Django...
start "Backend Django - Puerto 8000" cmd /k "cd /d %PROJECT_DIR% && venv\Scripts\activate && python manage.py runserver 0.0.0.0:8000"

:: Esperar 3 segundos para que el backend inicie
echo Esperando que el backend inicie...
timeout /t 3 /nobreak > nul

echo [2/2] Iniciando Frontend React...
start "Frontend React - Puerto 3000" cmd /k "cd /d %PROJECT_DIR%frontend && npm start"

echo.
echo ==========================================
echo    SISTEMA INICIADO CORRECTAMENTE
echo ==========================================
echo.
echo    Backend:  http://localhost:8000
echo    Frontend: http://localhost:3000
echo    Admin:    http://localhost:8000/admin
echo.
echo ==========================================
echo.
echo Para detener: Cierra las ventanas de CMD
echo.
pause
