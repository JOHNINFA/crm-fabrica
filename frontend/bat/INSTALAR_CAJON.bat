@echo off
cd /d "%~dp0"
title Iniciando Servidor de Cajon Monedero...
color 0A

:: ==========================================
:: CONFIGURACION AUTOMATICA v2.0
:: ==========================================

echo.
echo  ========================================
echo   CONFIGURADOR AUTOMATICO CAJON MONEDERO
echo  ========================================
echo.

:: 1. Buscar CajonServer.exe
if not exist "CajonServer.exe" (
    echo [ERROR] No encuentro CajonServer.exe en esta carpeta.
    echo Por favor, coloca este archivo junto al ejecutable.
    pause
    exit
)

:: 2. Detectar impresora EPSON
echo  [-] Buscando impresora EPSON...
set "PRINTER_NAME="

:: Verificamos impresoras (solo informativo ahora, el EXE hace el trabajo duro)
for /f "tokens=*" %%a in ('wmic printer get name ^| findstr /i "EPSON"') do (
    set "PRINTER_NAME=%%a"
    goto :FoundPrinter
)
for /f "tokens=*" %%a in ('wmic printer get name ^| findstr /i "TM-"') do (
    set "PRINTER_NAME=%%a"
    goto :FoundPrinter
)

:ManualInput
:: Si no detectamos nada, igual seguimos, el EXE se encargara
echo  [!] No detecte impresora EPSON en lista simple, pero el servidor buscara mejor.
set "PRINTER_NAME=Automatica"

:FoundPrinter
if "%PRINTER_NAME%"=="" set "PRINTER_NAME=Automatica"

:Confirm
echo.
echo  [OK] Impresora detectada: "%PRINTER_NAME%"
echo.

:: 3. Agregar al inicio de Windows (Startup)
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_NAME=CajonServer_Auto.bat"

:: Guardamos la ruta ACTUAL donde esta el usuario instalando
set "INSTALL_DIR=%~dp0"

echo  [-] Configurando inicio automatico...
(
echo @echo off
echo :: Este script inicia el servidor de cajon
echo cd /d "%INSTALL_DIR%"
echo start "" /min "CajonServer.exe"
) > "%STARTUP_FOLDER%\%SHORTCUT_NAME%"

echo.
echo  [OK] Configurado para iniciar con Windows!
echo  [INFO] Se guardo en: %STARTUP_FOLDER%
echo.
echo  ========================================
echo   INICIANDO SERVIDOR... (Minimizado)
echo  ========================================
echo.

start "" /min "CajonServer.exe"

echo  [EXITO] El servidor esta corriendo en segundo plano.
echo  [INFO] Puedes cerrar esta ventana.
timeout /t 5
exit
