import pandas as pd
import numpy as np
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from api.models import ReportePlaneacion, CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6
from datetime import datetime, timedelta
import joblib
import os
import logging

logger = logging.getLogger(__name__)

class NeuralNetworkService:
    def __init__(self):
        self.model_path = 'ia_models/'
        if not os.path.exists(self.model_path):
            os.makedirs(self.model_path)
            
        self.scalers = {}
        self.models = {}
        self.min_samples_to_train = 5 # Empezar a entrenar con pocos datos (Online Learning)

    def _get_model_filename(self, producto):
        return os.path.join(self.model_path, f'mlp_{producto.replace(" ", "_").replace("/", "-")}.pkl')

    def _get_scaler_filename(self, producto):
        return os.path.join(self.model_path, f'scaler_{producto.replace(" ", "_").replace("/", "-")}.pkl')

    def load_model(self, producto):
        """Carga modelo y scaler si existen"""
        model_file = self._get_model_filename(producto)
        scaler_file = self._get_scaler_filename(producto)
        
        if os.path.exists(model_file) and os.path.exists(scaler_file):
            self.models[producto] = joblib.load(model_file)
            self.scalers[producto] = joblib.load(scaler_file)
            return True
        return False

    def train_incremental(self, nuevo_reporte):
        """
        Entrena (partial_fit) con un nuevo reporte diario.
        Se llama cada vez que el usuario guarda la planeación.
        """
        try:
            # 1. Extraer datos del reporte
            fecha = nuevo_reporte.fecha_reporte
            datos = nuevo_reporte.datos_json if isinstance(nuevo_reporte.datos_json, list) else []
            
            # Convertir fecha a features
            dia_semana = fecha.weekday() # 0-6
            dia_mes = fecha.day
            
            for item in datos:
                producto = item.get('producto_nombre') or item.get('producto')
                orden_final = item.get('orden', 0)
                
                # Inputs (Features)
                stock = item.get('existencias', 0)
                solicitado = item.get('solicitadas', 0)
                pedidos = item.get('pedidos', 0)
                
                # Vector de entrada X
                X = np.array([[dia_semana, dia_mes, stock, solicitado, pedidos]])
                y = np.array([orden_final])
                
                # Cargar o crear modelo
                if producto not in self.models:
                    if not self.load_model(producto):
                        # Configuración Red Neuronal Ligera (para pocos datos)
                        self.models[producto] = MLPRegressor(
                            hidden_layer_sizes=(10, 5), # 2 capas ocultas pequeñas
                            activation='relu',
                            solver='adam',
                            learning_rate_init=0.01,
                            max_iter=1000,
                            random_state=42
                        )
                        self.scalers[producto] = StandardScaler()
                        
                        # Primera vez: necesitamos un buffer para fit inicial o partial_fit con classes (para clasif, aqui regr)
                        # MLPRegressor soporta partial_fit pero necesita ver datos
                        # Haremos un ajuste sucio inicial con los datos actuales para inicializar
                        self.scalers[producto].fit(X)
                
                # Escalar
                # Nota: StandardScaler incremental es partial_fit
                self.scalers[producto].partial_fit(X)
                X_scaled = self.scalers[producto].transform(X)
                
                # Entrenar
                self.models[producto].partial_fit(X_scaled, y)
                
                # Guardar
                joblib.dump(self.models[producto], self._get_model_filename(producto))
                joblib.dump(self.scalers[producto], self._get_scaler_filename(producto))
                
            logger.info(f"🧠 Modelos actualizados con reporte del {fecha}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error entrenando modelos: {e}")
            return False

    def predecir(self, fecha_objetivo, datos_contextuales):
        """
        Predice para una lista de productos en una fecha futura.
        Datos contextuales: { "ProdA": { "existencias": 10, "solicitadas": 50... } }
        """
        predicciones = []
        
        # Features fecha
        if isinstance(fecha_objetivo, str):
            dt = datetime.strptime(fecha_objetivo, '%Y-%m-%d')
        else:
            dt = fecha_objetivo
            
        dia_semana = dt.weekday()
        dia_mes = dt.day
        
        for producto, ctx in datos_contextuales.items():
            if self.load_model(producto) or producto in self.models:
                # Preparar vector
                stock = ctx.get('existencias', 0)
                solicitado = ctx.get('solicitadas', 0)
                pedidos = ctx.get('pedidos', 0)
                
                X = np.array([[dia_semana, dia_mes, stock, solicitado, pedidos]])
                
                # Escalar y Predecir
                X_scaled = self.scalers[producto].transform(X)
                prediction = self.models[producto].predict(X_scaled)[0]
                
                # Reglas de salida (no negativos, redondear)
                sugerido = max(0, int(round(prediction)))
                
                predicciones.append({
                    'producto': producto,
                    'ia_sugerido': sugerido,
                    'confianza': 'Alta (Aprendizaje)',
                    'detalle': {
                        'motivo': 'Basado en histórico neuronal',
                        'usa_red_neuronal': True
                    }
                })
            else:
                # No hay modelo => No retornamos nada (fallback a Gemini o cero)
                pass
                
        return predicciones

