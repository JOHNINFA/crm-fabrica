import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from django.db.models import Sum
from api.models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6

class IAService:
    def __init__(self):
        self.modelos = {} # Aquí guardaremos los modelos entrenados por producto

    def obtener_historial_ventas(self):
        """
        Recolecta y unifica las ventas de todas las tablas de CargueID.
        Retorna un DataFrame de Pandas listo para el análisis.
        """
        # print("🧠 IA: Recolectando historial de ventas...")  # Debug desactivado
        
        # Lista de modelos de cargue
        modelos_cargue = [CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6]
        
        todos_los_datos = []

        for modelo in modelos_cargue:
            # Obtener ventas confirmadas (donde hay fecha y producto)
            registros = modelo.objects.filter(
                fecha__isnull=False,
                producto__isnull=False
            ).exclude(producto='').values('fecha', 'producto', 'cantidad', 'adicional', 'devoluciones')
            
            for registro in registros:
                fecha = registro['fecha']
                if not fecha:
                    continue
                    
                # Convertir fecha a datetime si es string
                if isinstance(fecha, str):
                    try:
                        fecha = datetime.strptime(fecha, '%Y-%m-%d').date()
                    except:
                        continue

                # Procesar datos del registro
                nombre = registro['producto']
                cantidad = int(registro.get('cantidad', 0) or 0)
                adicional = int(registro.get('adicional', 0) or 0)
                devoluciones = int(registro.get('devoluciones', 0) or 0)
                
                # La venta real es lo que salió (cantidad + adicional - devoluciones)
                total_venta = cantidad + adicional - devoluciones
                
                if total_venta > 0 and nombre:
                    todos_los_datos.append({
                        'fecha': fecha,
                        'producto': nombre,
                        'venta': total_venta,
                        'dia_semana': fecha.weekday() # 0=Lunes, 5=Sábado, 6=Domingo
                    })

        # Crear DataFrame
        df = pd.DataFrame(todos_los_datos)
        
        if not df.empty:
            # Agrupar por fecha y producto (sumar ventas de todos los vendedores)
            df = df.groupby(['fecha', 'producto', 'dia_semana'])['venta'].sum().reset_index()
            print(f"✅ IA: {len(df)} registros históricos analizados")  # Solo resumen
        else:
            print("⚠️ IA: Sin datos históricos")
            
        return df

    def predecir_produccion(self, fecha_objetivo, datos_contextuales=None):
        """
        Genera una predicción de producción CONTEXTUAL para una fecha específica.
        
        V2: Considera:
        - Existencias actuales
        - Solicitadas del día (desde Cargue)
        - Pedidos del día
        - Histórico de ventas
        
        Args:
            fecha_objetivo: Fecha para la cual predecir
            datos_contextuales: Dict con {producto_nombre: {existencias, solicitadas, pedidos}}
        """
        df = self.obtener_historial_ventas()
        
        if df.empty:
            return []

        # Convertir fecha objetivo
        if isinstance(fecha_objetivo, str):
            fecha_objetivo = datetime.strptime(fecha_objetivo, '%Y-%m-%d').date()
            
        dia_semana_objetivo = fecha_objetivo.weekday()
        # print(f"🧠 IA: Prediciendo para el día {dia_semana_objetivo} (0=Lunes)...")  # Debug off

        predicciones = []
        
        # Obtener lista única de productos
        productos_unicos = df['producto'].unique()

        for producto in productos_unicos:
            # 🎯 DATOS CONTEXTUALES (del día actual)
            existencias = 0
            solicitadas = 0
            pedidos = 0
            
            if datos_contextuales and producto in datos_contextuales:
                existencias = datos_contextuales[producto].get('existencias', 0)
                solicitadas = datos_contextuales[producto].get('solicitadas', 0)
                pedidos = datos_contextuales[producto].get('pedidos', 0)
            
            # 📊 DATOS HISTÓRICOS (aprendizaje)
            historia_producto = df[
                (df['producto'] == producto) & 
                (df['dia_semana'] == dia_semana_objetivo)
            ]

            # Calcular promedio histórico
            promedio_historico = 0
            confianza = 'Baja'
            
            if not historia_producto.empty:
                historia_producto = historia_producto.sort_values('fecha', ascending=False)
                ultimos_registros = historia_producto.head(4)
                promedio_historico = int(ultimos_registros['venta'].mean())
                confianza = 'Alta' if len(ultimos_registros) >= 3 else 'Media'
            else:
                # Si no hay historia del día específico, usar promedio general
                promedio_general = df[df['producto'] == producto]['venta'].mean()
                promedio_historico = int(promedio_general or 0)
                confianza = 'Baja (Promedio General)'

            # 🧠 ALGORITMO INTELIGENTE V2
            # 1. Demanda del día = Solicitadas + Pedidos
            demanda_actual = solicitadas + pedidos
            
            # 2. Usar la mayor entre demanda actual y promedio histórico
            demanda_final = max(demanda_actual, promedio_historico)
            
            # 3. Calcular faltante
            faltante = demanda_final - existencias
            
            # 4. Sugerencia con factor de seguridad (10%)
            if faltante > 0:
                sugerido = int(faltante * 1.10)
                motivo = f"Demanda: {demanda_final} - Stock: {existencias} = {faltante} (+10%)"
            else:
                # Si hay stock suficiente, sugerir solo el promedio histórico
                sugerido = int(promedio_historico * 0.20)  # 20% del promedio como reposición
                motivo = f"Stock suficiente. Reposición: {int(promedio_historico * 0.20)}"
            
            predicciones.append({
                'producto': producto,
                'ia_sugerido': max(0, sugerido),
                'confianza': confianza,
                'detalle': {
                    'existencias': existencias,
                    'solicitadas': solicitadas,
                    'pedidos': pedidos,
                    'demanda_final': demanda_final,
                    'promedio_historico': promedio_historico,
                    'motivo': motivo
                }
            })
            
            # Log detallado (solo para debugging)
            # if sugerido > 0:
            #     print(f"   🧠 {producto}: {sugerido} und | {motivo}")

        print(f"✅ IA: {len(predicciones)} productos con sugerencias")
        return predicciones
