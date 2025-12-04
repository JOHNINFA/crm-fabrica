import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from django.db.models import Sum
from api.models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6
import os
import pickle

# Machine Learning
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split

# Deep Learning - TensorFlow/Keras
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    TENSORFLOW_DISPONIBLE = True

except ImportError:
    TENSORFLOW_DISPONIBLE = False
    print("⚠️ TensorFlow no disponible - Usando algoritmo simple")


class IAService:
    def __init__(self):
        self.modelos = {}  # Aquí guardaremos los modelos entrenados por producto
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.models_dir = 'api/ml_models/'
        
        # Crear carpeta para modelos si no existe
        if not os.path.exists(self.models_dir):
            os.makedirs(self.models_dir)

    def obtener_historial_ventas(self):
        """
        Obtiene el historial de ventas NETAS desde todos los cargues.
        
        VENTA NETA = cantidad - devoluciones - vencidas
        
        Esto optimiza la producción evitando:
        - Devoluciones (productos que regresan)
        - Vencidas (productos que se pierden)
        """
        from api.models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6
        
        registros = []
        
        # Obtener de todos los IDs
        for modelo in [CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6]:
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
                        'venta': max(0, venta_neta)  # No permitir negativos, usar 'venta' para compatibilidad
                    })
        
        if not registros:
            return pd.DataFrame()
        
        df = pd.DataFrame(registros)
        
        # Convertir fecha a datetime
        df['fecha'] = pd.to_datetime(df['fecha'])
        
        # Agregar día de la semana (0=Lunes, 6=Domingo)
        df['dia_semana'] = df['fecha'].dt.dayofweek
        
        # Agregar más features temporales
        df['dia_mes'] = df['fecha'].dt.day
        df['mes'] = df['fecha'].dt.month
        df['semana_año'] = df['fecha'].dt.isocalendar().week
        
        # Ordenar por fecha
        df = df.sort_values('fecha')
        
        print(f"✅ IA: {len(df)} registros históricos analizados")
        print(f"   📊 Productos únicos: {df['producto'].nunique()}")
        print(f"   📅 Rango: {df['fecha'].min()} a {df['fecha'].max()}")
        
        return df

    def preparar_datos_para_ml(self, df, producto_nombre):
        """
        Prepara los datos para entrenar la red neuronal.
        Crea características (features) a partir de los datos históricos.
        """
        if df.empty:
            return None, None, None, None
        
        # Filtrar datos del producto
        df_producto = df[df['producto'] == producto_nombre].copy()
        
        if len(df_producto) < 10:  # Necesitamos al menos 10 registros
            return None, None, None, None
        
        # Ordenar por fecha
        df_producto = df_producto.sort_values('fecha')
        
        # Crear características (features)
        features = []
        targets = []
        
        for i in range(len(df_producto) - 1):
            # Features: datos históricos + contextuales
            feature = [
                df_producto.iloc[i]['dia_semana'],
                df_producto.iloc[i]['dia_mes'],
                df_producto.iloc[i]['mes'],
                df_producto.iloc[i]['semana_año'],
                df_producto.iloc[i]['venta'],  # Venta del día anterior
            ]
            
            # Target: venta del día siguiente
            target = df_producto.iloc[i + 1]['venta']
            
            features.append(feature)
            targets.append(target)
        
        # Convertir a arrays numpy
        X = np.array(features)
        y = np.array(targets)
        
        # Normalizar features
        X_scaled = self.scaler.fit_transform(X)
        
        return X_scaled, y, self.scaler, df_producto

    def crear_modelo_neuronal(self, input_dim):
        """
        Crea una red neuronal para predicción de demanda.
        Arquitectura: 3 capas ocultas con Dropout para evitar overfitting.
        """
        modelo = keras.Sequential([
            # Capa de entrada
            layers.Dense(64, activation='relu', input_dim=input_dim),
            layers.Dropout(0.2),
            
            # Capas ocultas
            layers.Dense(32, activation='relu'),
            layers.Dropout(0.2),
            
            layers.Dense(16, activation='relu'),
            
            # Capa de salida (predicción)
            layers.Dense(1, activation='linear')  # Regresión
        ])
        
        # Compilar modelo
        modelo.compile(
            optimizer='adam',
            loss='mse',  # Mean Squared Error
            metrics=['mae']  # Mean Absolute Error
        )
        
        return modelo

    def entrenar_modelo_producto(self, producto_nombre):
        """
        Entrena una red neuronal específica para un producto.
        """
        if not TENSORFLOW_DISPONIBLE:
            return None
        
        print(f"\n🧠 Entrenando red neuronal para: {producto_nombre}")
        
        # Obtener datos históricos
        df = self.obtener_historial_ventas()
        
        # Preparar datos
        X, y, scaler, df_producto = self.preparar_datos_para_ml(df, producto_nombre)
        
        if X is None:
            print(f"   ⚠️ Datos insuficientes para {producto_nombre}")
            return None
        
        # Dividir en train/test
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Crear modelo
        modelo = self.crear_modelo_neuronal(input_dim=X.shape[1])
        
        # Entrenar (sin mostrar progreso detallado)
        history = modelo.fit(
            X_train, y_train,
            epochs=50,
            batch_size=8,
            validation_split=0.2,
            verbose=0  # Sin output detallado
        )
        
        # Evaluar
        loss, mae = modelo.evaluate(X_test, y_test, verbose=0)
        print(f"   ✅ Modelo entrenado - MAE: {mae:.2f} unidades")
        
        # Guardar modelo en formato KERAS nativo (no HDF5 legacy)
        modelo_path = os.path.join(self.models_dir, f'{producto_nombre.replace(" ", "_")}.keras')
        scaler_path = os.path.join(self.models_dir, f'{producto_nombre.replace(" ", "_")}_scaler.pkl')
        
        modelo.save(modelo_path)
        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler, f)
        
        return modelo, scaler

    def cargar_modelo_producto(self, producto_nombre):
        """
        Carga un modelo previamente entrenado.
        """
        if not TENSORFLOW_DISPONIBLE:
            return None, None
        
        modelo_path = os.path.join(self.models_dir, f'{producto_nombre.replace(" ", "_")}.keras')
        scaler_path = os.path.join(self.models_dir, f'{producto_nombre.replace(" ", "_")}_scaler.pkl')
        
        if os.path.exists(modelo_path) and os.path.exists(scaler_path):
            modelo = keras.models.load_model(modelo_path)
            with open(scaler_path, 'rb') as f:
                scaler = pickle.load(f)
            return modelo, scaler
        
        return None, None

    def predecir_con_red_neuronal(self, producto_nombre, fecha_objetivo, datos_contextuales=None):
        """
        Usa la red neuronal entrenada para predecir demanda.
        Si no hay modelo, lo entrena primero.
        """
        if not TENSORFLOW_DISPONIBLE:
            return None
        
        # Intentar cargar modelo existente
        modelo, scaler = self.cargar_modelo_producto(producto_nombre)
        
        # Si no existe, entrenar
        if modelo is None:
            resultado = self.entrenar_modelo_producto(producto_nombre)
            if resultado is None:
                return None
            modelo, scaler = resultado
        
        # Preparar features para predicción
        if isinstance(fecha_objetivo, str):
            fecha_objetivo = datetime.strptime(fecha_objetivo, '%Y-%m-%d').date()
        
        # Obtener última venta conocida
        df = self.obtener_historial_ventas()
        df_producto = df[df['producto'] == producto_nombre].sort_values('fecha')
        
        if df_producto.empty:
            return None
        
        ultima_venta = df_producto.iloc[-1]['venta']
        
        # Crear features
        features = np.array([[
            fecha_objetivo.weekday(),
            fecha_objetivo.day,
            fecha_objetivo.month,
            fecha_objetivo.isocalendar()[1],
            ultima_venta
        ]])
        
        # Normalizar
        features_scaled = scaler.transform(features)
        
        # Predecir
        prediccion = modelo.predict(features_scaled, verbose=0)[0][0]
        
        return max(0, int(prediccion))

    def predecir_produccion(self, fecha_objetivo, datos_contextuales=None):
        """
        Genera predicciones de producción usando REDES NEURONALES.
        
        Si no hay modelo entrenado para un producto, retorna 0.
        
        Args:
            fecha_objetivo: Fecha para la cual predecir
            datos_contextuales: Dict con {producto_nombre: {existencias, solicitadas, pedidos}}
        """
        if not TENSORFLOW_DISPONIBLE:
            print("❌ TensorFlow no disponible - No se pueden generar predicciones")
            return []

        df = self.obtener_historial_ventas()
        
        if df.empty:
            print("⚠️ Sin datos históricos")
            return []

        # Convertir fecha objetivo
        if isinstance(fecha_objetivo, str):
            fecha_objetivo = datetime.strptime(fecha_objetivo, '%Y-%m-%d').date()

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
            
            # 🧠 PREDICCIÓN CON RED NEURONAL
            prediccion_neuronal = None
            try:
                prediccion_neuronal = self.predecir_con_red_neuronal(producto, fecha_objetivo, datos_contextuales)
            except Exception as e:
                print(f"   ⚠️ Error en red neuronal para {producto}: {str(e)}")
            
            # Si no hay predicción neuronal, saltar este producto
            if prediccion_neuronal is None:
                print(f"   ⚠️ {producto}: Sin modelo entrenado (necesita 10+ registros)")
                continue
            
            # 🧠 ALGORITMO CON RED NEURONAL
            # 1. Demanda del día = Solicitadas + Pedidos
            demanda_conocida = solicitadas + pedidos
            
            # 2. Predicción de venta del día (Red Neuronal)
            prediccion_venta = prediccion_neuronal
            
            # 3. Demanda total esperada (la mayor entre conocida y predicha)
            demanda_total = max(demanda_conocida, prediccion_venta)
            
            # 4. Calcular cuánto falta para cubrir la demanda
            faltante = demanda_total - existencias
            
            # 5. Sugerencia de ORDEN
            if faltante > 0:
                # Falta stock para cubrir la demanda
                sugerido = int(faltante * 1.20)  # +20% margen de seguridad
                motivo = f"Venta esperada: {int(demanda_total)} - Stock: {existencias} = Falta {int(faltante)} (+20% seguridad)"
            else:
                # Hay stock suficiente, pero sugerir reposición basada en venta esperada
                # Esto ayuda a mantener stock para días siguientes
                sugerido = int(prediccion_venta * 0.30)  # 30% de la venta esperada
                motivo = f"Stock suficiente para hoy. Reposición sugerida: {int(prediccion_venta * 0.30)} (30% de venta esperada: {int(prediccion_venta)})"
            
            predicciones.append({
                'producto': producto,
                'ia_sugerido': max(0, sugerido),
                'confianza': 'IA (Red Neuronal)',
                'detalle': {
                    'existencias': existencias,
                    'solicitadas': solicitadas,
                    'pedidos': pedidos,
                    'demanda_conocida': demanda_conocida,
                    'prediccion_venta': prediccion_neuronal,
                    'demanda_total': demanda_total,
                    'faltante': faltante,
                    'usa_red_neuronal': True,
                    'motivo': motivo
                }
            })

        print(f"✅ IA: {len(predicciones)} productos con predicciones de Red Neuronal")
        return predicciones

    def entrenar_todos_los_modelos(self):
        """
        Entrena redes neuronales para todos los productos con suficientes datos.
        Esto se puede ejecutar periódicamente (ej: cada noche).
        """
        if not TENSORFLOW_DISPONIBLE:
            print("⚠️ TensorFlow no disponible - No se pueden entrenar modelos")
            return
        

        
        df = self.obtener_historial_ventas()
        productos_unicos = df['producto'].unique()
        
        entrenados = 0
        fallidos = 0
        
        for producto in productos_unicos:
            try:
                resultado = self.entrenar_modelo_producto(producto)
                if resultado is not None:
                    entrenados += 1
                else:
                    fallidos += 1
            except Exception as e:
                print(f"   ❌ Error entrenando {producto}: {str(e)}")
                fallidos += 1
        
        print(f"\n✅ Entrenamiento completado:")
        print(f"   - Modelos entrenados: {entrenados}")
        print(f"   - Fallidos/Insuficientes: {fallidos}")
        print(f"   - Total productos: {len(productos_unicos)}\n")
