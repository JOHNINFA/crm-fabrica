#!/usr/bin/env python3
"""
Script para aplicar optimización de bulk operations en guardar_sugerido
Uso: python3 aplicar_optimizacion_sugeridos.py
"""

import re
import sys

VIEWS_FILE = '/home/john/Escritorio/crm-fabrica/api/views.py'

# Código optimizado
CODIGO_OPTIMIZADO = '''        # 🚀 OPTIMIZACIÓN: Preparar datos para bulk operations
        # Obtener vendedor una sola vez (fuera del loop)
        vendedor_nombre = vendedor_id
        try:
            from .models import Vendedor
            vendedor_obj = Vendedor.objects.filter(id_vendedor=vendedor_id).first()
            if vendedor_obj and vendedor_obj.nombre:
                vendedor_nombre = vendedor_obj.nombre
        except Exception as e:
            print(f"  ⚠️ Error buscando vendedor: {e}")
        
        # Obtener todos los productos existentes en UNA SOLA QUERY
        productos_nombres = [prod.get('nombre') for prod in productos if prod.get('nombre')]
        registros_existentes = {
            reg.producto: reg
            for reg in Modelo.objects.filter(dia=dia, fecha=fecha, producto__in=productos_nombres)
        }
        
        productos_actualizar = []
        productos_crear = []
        count = 0
        
        # Procesar cada producto (sin queries en el loop)
        for prod in productos:
            nombre = prod.get('nombre')
            cantidad_raw = prod.get('cantidad')
            cantidad = int(cantidad_raw) if cantidad_raw is not None else 0
            
            if nombre:
                # Obtener check V (si viene)
                v_check = prod.get('v', False) or prod.get('V', False)
                
                # Normalizar nombre para evitar duplicados
                import re
                nombre = re.sub(r'\\s+', ' ', nombre).strip()

                if not nombre:
                    continue

                # Determinar responsable (sin queries)
                registro_existente = registros_existentes.get(nombre)
                responsable_a_usar = vendedor_nombre
                
                if registro_existente and registro_existente.responsable:
                    if not registro_existente.responsable.startswith('ID'):
                        responsable_a_usar = registro_existente.responsable
                
                # Preparar datos
                if registro_existente:
                    # Actualizar existente
                    registro_existente.cantidad = cantidad
                    registro_existente.total = cantidad
                    registro_existente.responsable = responsable_a_usar
                    registro_existente.usuario = 'AppMovil'
                    registro_existente.v = v_check
                    productos_actualizar.append(registro_existente)
                else:
                    # Crear nuevo
                    productos_crear.append(Modelo(
                        dia=dia,
                        fecha=fecha,
                        producto=nombre,
                        cantidad=cantidad,
                        total=cantidad,
                        responsable=responsable_a_usar,
                        usuario='AppMovil',
                        v=v_check
                    ))
                
                count += 1
        
        # 🚀 Ejecutar operaciones en bulk (solo 2-3 queries en total)
        if productos_actualizar:
            Modelo.objects.bulk_update(
                productos_actualizar,
                ['cantidad', 'total', 'responsable', 'usuario', 'v'],
                batch_size=100
            )
            print(f"  ✅ Actualizados {len(productos_actualizar)} productos en bulk")
        
        if productos_crear:
            Modelo.objects.bulk_create(productos_crear, batch_size=100)
            print(f"  ✅ Creados {len(productos_crear)} productos en bulk")
'''

def main():
    print("🚀 Aplicando optimización de bulk operations...")
    
    # Leer archivo
    try:
        with open(VIEWS_FILE, 'r', encoding='utf-8') as f:
            contenido = f.read()
    except Exception as e:
        print(f"❌ Error leyendo archivo: {e}")
        return 1
    
    # Buscar el patrón a reemplazar
    patron = r'        # Procesar cada producto\n        count = 0\n        for prod in productos:.*?count \+= 1'
    
    # Reemplazar
    contenido_nuevo = re.sub(
        patron,
        CODIGO_OPTIMIZADO.rstrip(),
        contenido,
        flags=re.DOTALL
    )
    
    if contenido == contenido_nuevo:
        print("⚠️  No se encontró el patrón a reemplazar")
        print("   Verifica que el archivo no haya sido modificado")
        return 1
    
    # Crear backup
    backup_file = VIEWS_FILE + '.backup'
    try:
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Backup creado: {backup_file}")
    except Exception as e:
        print(f"❌ Error creando backup: {e}")
        return 1
    
    # Guardar archivo optimizado
    try:
        with open(VIEWS_FILE, 'w', encoding='utf-8') as f:
            f.write(contenido_nuevo)
        print(f"✅ Optimización aplicada correctamente")
        print(f"   Archivo: {VIEWS_FILE}")
        print()
        print("🔄 Reinicia el servidor Django para aplicar cambios:")
        print("   Ctrl+C en el terminal del servidor")
        print("   python3 manage.py runserver 0.0.0.0:8000")
    except Exception as e:
        print(f"❌ Error guardando archivo: {e}")
        # Restaurar backup
        with open(backup_file, 'r', encoding='utf-8') as f:
            contenido_backup = f.read()
        with open(VIEWS_FILE, 'w', encoding='utf-8') as f:
            f.write(contenido_backup)
        print("   Backup restaurado")
        return 1
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
