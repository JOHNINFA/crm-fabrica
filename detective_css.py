
import glob
import os
import shutil
import subprocess
import time

# Configuración
SEARCH_DIR = 'frontend/src'
BUILD_CMD = 'cd frontend && npm run build'
BACKUP_DIR = 'css_backup_temp'

def get_css_files():
    return [f for f in glob.glob(f'{SEARCH_DIR}/**/*.css', recursive=True)]

def backup_files(files):
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
    for f in files:
        # Mantener estructura de carpetas en backup
        rel_path = os.path.relpath(f, '.')
        backup_path = os.path.join(BACKUP_DIR, rel_path)
        os.makedirs(os.path.dirname(backup_path), exist_ok=True)
        shutil.copy2(f, backup_path)

def restore_files(files):
    for f in files:
        rel_path = os.path.relpath(f, '.')
        backup_path = os.path.join(BACKUP_DIR, rel_path)
        if os.path.exists(backup_path):
            shutil.copy2(backup_path, f)
    print("Archivos restaurados.")

def empty_files(files):
    for f in files:
        with open(f, 'w', encoding='utf-8') as file:
            file.write("/* Empty for debugging */")

def run_build():
    print("Ejecutando build...", end='', flush=True)
    result = subprocess.run(BUILD_CMD, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    if result.returncode == 0:
        print(" ✅ PASÓ")
        return True
    else:
        # Verificar si es el error de CSS Minimizer
        stderr = result.stderr.decode('utf-8', errors='ignore')
        if "Minimizer" in stderr and "Unexpected" in stderr:
            print(" ❌ FALLÓ (Error CSS encontrado)")
            return False
        elif "Module not found" in stderr:
            print(" ⚠️ ERROR DE MODULO (Ignorando prueba)")
            # Si faltan modulos es porque borramos algo que no debiamos, asumimos fallo
            return False
        else:
            print(" ❌ FALLÓ (Otro error)")
            return False

def main():
    print("--- DETECTIVE CSS AUTOMÁTICO ---")
    files = get_css_files()
    print(f"Encontrados {len(files)} archivos CSS.")
    
    print("Haciendo backup temporal...")
    backup_files(files)
    
    try:
        # Verificar que el build falle inicialmente (sanity check)
        print("Verificando estado actual (debería fallar)...")
        if run_build():
            print("¡El build pasa sin hacer nada! No hay error que buscar.")
            return

        candidates = files
        round_num = 1
        
        while len(candidates) > 1:
            print(f"\n--- RONDA {round_num}: {len(candidates)} sospechosos ---")
            
            # Dividir en dos mitades
            mid = len(candidates) // 2
            first_half = candidates[:mid]
            second_half = candidates[mid:]
            
            # Prueba: Vaciar la primera mitad. 
            # Si el build PASA, el error estaba en esa mitad (que ahora está limpia).
            print(f"Vaciando {len(first_half)} archivos...")
            empty_files(first_half)
            
            # Los de la segunda mitad NO los tocamos (se supone que están restaurados del paso anterior o nunca tocados)
            # Pero para asegurar, restauramos la segunda mitad desde backup
            restore_files(second_half) 
            
            if run_build():
                print(">>> El error SE FUE. ¡El culpable está en el grupo vaciado!")
                candidates = first_half
                # Restauramos todo para la siguiente ronda, excepto que ya sabemos el grupo
                restore_files(candidates) 
            else:
                print(">>> El error PERSISTE. ¡El culpable está en el grupo INTACTO!")
                candidates = second_half
                # Restauramos la primera mitad que habíamos vaciado en vano
                restore_files(first_half)
            
            round_num += 1

        culprit = candidates[0]
        print(f"\n\n🎯 ¡CULPABLE ENCONTRADO!: {culprit}")
        print("Restaurando archivos...")
        restore_files(files)
        print(f"Revisa el archivo: {culprit}")

    except Exception as e:
        print(f"\nError inesperado: {e}")
        print("Restaurando archivos de emergencia...")
        restore_files(files)
    
    finally:
        # Limpiar backup si se quiere, o dejarlo
        # shutil.rmtree(BACKUP_DIR)
        pass

if __name__ == "__main__":
    main()
