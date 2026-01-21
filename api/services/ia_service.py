import pandas as pd
import numpy as np
from datetime import datetime
import json
import logging
from api.models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6
from api.services.ai_assistant_service import AIAssistant

logger = logging.getLogger(__name__)

from api.services.neural_network_service import NeuralNetworkService

class IAService:
    def __init__(self):
        self.ai = AIAssistant()
        self.nn_service = NeuralNetworkService()

    def train_with_report(self, reporte):
        """Entrena la red neuronal con un nuevo reporte guardado"""
        return self.nn_service.train_incremental(reporte)

    def obtener_historial_ventas(self):
        """
        Obtiene el historial de ventas NETAS desde todos los cargues.
        VENTA NETA = cantidad - devoluciones - vencidas
        """
        registros = []
        
        # Obtener de todos los IDs
        for modelo in [CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6]:
            try:
                cargues = modelo.objects.filter(activo=True).values(
                    'fecha', 'dia', 'producto', 'cantidad', 'devoluciones', 'vencidas'
                )
                
                for c in cargues:
                    if c['producto']:  # Solo si tiene producto
                        # 🧠 VENTA NETA = Lo que realmente se vendió
                        venta_neta = c['cantidad'] - c['devoluciones'] - c['vencidas']
                        
                        registros.append({
                            'fecha': c['fecha'],
                            'dia_nombre': c['dia'],
                            'producto': c['producto'],
                            'cantidad_cargada': c['cantidad'],
                            'devoluciones': c['devoluciones'],
                            'vencidas': c['vencidas'],
                            'venta': max(0, venta_neta)
                        })
            except Exception as e:
                logger.error(f"Error leyendo modelo {modelo}: {e}")
                continue
        
        if not registros:
            return pd.DataFrame()
        
        df = pd.DataFrame(registros)
        
        # Convertir fecha a datetime
        # Asegurar conversión segura
        df['fecha'] = pd.to_datetime(df['fecha'], errors='coerce')
        df = df.dropna(subset=['fecha'])
        
        # Agregar día de la semana (0=Lunes, 6=Domingo)
        df['dia_semana'] = df['fecha'].dt.dayofweek
        
        return df

    def calcular_estadisticas_producto(self, df, producto_nombre):
        """Calcula estadísticas básicas históricas para un producto"""
        if df.empty:
            return None
            
        df_prod = df[df['producto'] == producto_nombre].copy()
        if df_prod.empty:
            return None
        
        # Estadísticas generales (últimos 30 registros para ser más relevante)
        df_prod = df_prod.sort_values('fecha').tail(30)
        
        total_cargado = df_prod['cantidad_cargada'].sum()
        total_devoluciones = df_prod['devoluciones'].sum()
        total_vencidas = df_prod['vencidas'].sum()
        
        tasa_retorno = 0
        if total_cargado > 0:
            tasa_retorno = (total_devoluciones + total_vencidas) / total_cargado
            
        promedio_venta = df_prod['venta'].mean()
        promedio_solicitado = df_prod['cantidad_cargada'].mean()
        
        return {
            'tasa_retorno_pct': round(tasa_retorno * 100, 1),
            'promedio_venta_diaria': round(promedio_venta, 1),
            'promedio_solicitado_diario': round(promedio_solicitado, 1),
            'tendencia': 'Estable' # Simplificado por ahora
        }

    def predecir_produccion(self, fecha_objetivo, datos_contextuales=None):
        """
        Genera predicciones híbridas:
        1. Intenta usar Red Neuronal (Scikit-Learn) si está entrenada.
        2. Si no, usa Gemini 1.5 Flash (LLM).
        """
        resultados_finales = []
        
        # 1. 🧠 Intentar predicción Neuronal
        try:
            predicciones_nn = self.nn_service.predecir(fecha_objetivo, datos_contextuales)
            if predicciones_nn:
                print(f"🧠 Red Neuronal generó {len(predicciones_nn)} predicciones.")
                # Filtrar solo las que tienen datos, las demás a Gemini
                resultados_finales.extend(predicciones_nn)
        except Exception as e:
            logger.error(f"Error en predicción neuronal: {e}")

        # Identificar qué productos faltan por predecir
        productos_predichos = {r['producto'] for r in resultados_finales}
        productos_restantes = {k: v for k, v in datos_contextuales.items() if k not in productos_predichos}

        if not productos_restantes:
            return resultados_finales

        # 2. 🤖 Fallback a Gemini para productos restantes (Cold Start)
        print(f"🤖 Usando Gemini para {len(productos_restantes)} productos restantes...")
        
        # ... (Logica Gemini original simplificada abajo) ...
        # Obtener historial solo si es necesario
        try:
            df = self.obtener_historial_ventas()
        except:
            df = pd.DataFrame()

        productos_analisis_gemini = []
        for producto, datos in productos_restantes.items():
            solicitado = datos.get('solicitadas', 0)
            pedidos = datos.get('pedidos', 0)
            stock = datos.get('existencias', 0)
            
            if solicitado == 0 and pedidos == 0 and stock >= 0:
                continue

            stats = self.calcular_estadisticas_producto(df, producto) if not df.empty else None
            
            productos_analisis_gemini.append({
                "producto": producto,
                "situacion_actual": {"solicitado": solicitado, "pedidos": pedidos, "stock": stock},
                "historico": stats if stats else "Sin datos"
            })
        
        if not productos_analisis_gemini:
            return resultados_finales

        # Prompt Gemini (reducido para brevedad en reemplazo)
        prompt = f"""
        Fecha: {fecha_objetivo}
        Productos: {json.dumps(productos_analisis_gemini, ensure_ascii=False)}
        Calcula 'produccion_sugerida' (JSON Array: producto, ia_sugerido, confianza, motivo). Prioriza pedidos firmes. Si tasa retorno alta, reduce sugerido.
        """
        
        try:
            response_text = self.ai.chat(prompt)
            clean_json = response_text.replace('```json', '').replace('```', '').strip()
            predicciones_gemini = json.loads(clean_json)
            
            for item in predicciones_gemini:
                resultados_finales.append({
                    'producto': item.get('producto'),
                    'ia_sugerido': int(item.get('ia_sugerido', 0)),
                    'confianza': item.get('confianza', 'Media'),
                    'detalle': {
                        'motivo': item.get('motivo', 'Análisis Gemini'),
                        'usa_red_neuronal': False
                    }
                })
        except Exception as e:
            logger.error(f"Error Gemini: {e}")

        return resultados_finales

    def entrenar_todos_los_modelos(self):
         pass
