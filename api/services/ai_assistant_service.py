"""
Servicio de Asistente IA usando Google Gemini (Cloud)
Optimizado para VPS y respuestas rápidas.
"""
import requests
import json
import os
from pathlib import Path
from django.conf import settings
from api.services.rag_context_loader import load_shared_rag_context

class AIAssistant:
    """
    Asistente IA que usa Google Gemini 1.5 Flash
    Reemplaza a la versión local de Ollama para mejor rendimiento en VPS.
    """
    
    def __init__(self, model="gemini-1.5-flash"):
        # 1. Intentar leer CONFIGURACIÓN DINÁMICA (ia_config.json)
        self.api_key = None
        self.model = model  # Default inicial
        
        CONFIG_FILE = 'ia_config.json'
        
        if os.path.exists(CONFIG_FILE):
            try:
                import json
                with open(CONFIG_FILE, 'r') as f:
                    config = json.load(f)
                    self.api_key = config.get('gemini_api_key')
                    # Si hay un modelo personalizado guardado, usarlo
                    if config.get('gemini_model'):
                        self.model = config.get('gemini_model')
            except:
                pass

        # 2. Si no hay API KEY en config, leer del entorno
        if not self.api_key:
            self.api_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
            
        # Endpoint REST oficial de Google
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        
        self.docs_loaded = False
        self.context = ""
    
    def load_documentation(self):
        """Carga la documentación del proyecto para contexto"""
        if self.docs_loaded:
            return self.context
        
        try:
            # Buscar documentos en el directorio raíz del proyecto
            base_path = Path(__file__).parent.parent.parent
            docs = []
            
            # 1) Contexto compartido principal (steering)
            shared_rag = load_shared_rag_context()
            if shared_rag:
                docs.append(shared_rag[:5000])

            # 2) Fallbacks legacy (si existen)
            doc_files = ["RESUMEN_ANALISIS.md"]
            
            for doc_file in doc_files:
                file_path = base_path / doc_file
                if file_path.exists():
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # Limitamos tamaño para no gastar tokens excesivos
                        docs.append(content[:4000])
            
            self.context = "\n\n---\n\n".join(docs)
            self.docs_loaded = True
            return self.context
        except Exception as e:
            print(f"⚠️ Error cargando documentación: {e}")
            return ""
    
    def ask(self, question, include_docs=True, temperature=0.7):
        """
        Pregunta al asistente IA (Gemini)
        """
        if not self.api_key:
            return "⚠️ Error de Configuración: No se encontró GOOGLE_API_KEY en el archivo .env. Por favor configúrala para usar la IA."

        # 1. Detectar Intención de Herramientas (Ventas, Reportes)
        tool_data = ""
        context_msg = ""
        
        try:
            if self._detect_sales_intent(question):
                print("🔎 Detectada intención de REPORTE DE VENTAS")
                sales_data = self._get_sales_report(question)
                tool_data = f"\nDATOS REALES DEL SISTEMA (Consúltalos para responder):\n{json.dumps(sales_data, indent=2, ensure_ascii=False)}\n"
                context_msg = "Tienes acceso a DATOS REALES de ventas. Úsalos para responder con precisión numérica. "
        except Exception as e:
            print(f"⚠️ Error ejecutando herramienta de ventas: {e}")
            return f"🐛 Error consultando base de datos: {str(e)}"

        # 2. Preparar System Prompt
        docs = self.load_documentation()
        docs_slice = docs[:2200] if include_docs else docs[:900]

        if docs_slice:
            system_instruction = f"""Eres el Asistente IA experto del CRM Fábrica.
Tu misión es ayudar a gestionar el negocio de arepas y lácteos.
Responde en español, de forma profesional, concisa y basada en datos.

Contexto del Negocio:
{docs_slice}

{context_msg}"""
        else:
            system_instruction = f"""Eres Agente Guerrero IA.
Tu objetivo es ayudar con operaciones del CRM.
Sé directo y eficiente.
{context_msg}"""
        
        # 3. Construir Payload para Gemini
        # Estructura: System Instruction + User Prompt con Datos
        full_user_content = question
        if tool_data:
            full_user_content += f"\n\n---CONTEXTO DE DATOS---\n{tool_data}\n---------------------"

        payload = {
            "contents": [{
                "parts": [{"text": f"{system_instruction}\n\nPregunta del Usuario: {full_user_content}"}]
            }],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 800,
                "topP": 0.8,
                "topK": 40
            }
        }
        
        # 4. Llamar a Google API
        try:
            response = requests.post(
                f"{self.base_url}?key={self.api_key}",
                headers={'Content-Type': 'application/json'},
                json=payload,
                timeout=15 
            )
            
            if response.status_code != 200:
                error_det = response.text
                print(f"❌ Error Gemini: {error_det}")
                return f"Error ({response.status_code}) conectando con Gemini AI."

            data = response.json()
            
            # Extraer respuesta de Gemini
            try:
                answer = data['candidates'][0]['content']['parts'][0]['text']
                return answer.strip()
            except (KeyError, IndexError):
                return "La IA no devolvió una respuesta válida (Bloqueo de seguridad o error interno)."
                
        except requests.exceptions.Timeout:
            return "⏱️ El tiempo de espera con Google se agotó."
        except Exception as e:
            return f"❌ Error de conexión: {str(e)}"

    def _detect_sales_intent(self, question):
        """Detecta si la pregunta es sobre ventas/reportes"""
        keywords = ['venta', 'vendio', 'pedido', 'reporte', 'total', 'cuanto', 'ingreso', 'semana', 'mes', 'ayer', 'hoy']
        q_lower = question.lower()
        return any(k in q_lower for k in keywords)

    def _get_sales_report(self, question):
        """
        Consulta la BD real de Django para obtener ventas
        """
        import django
        from django.utils import timezone
        from datetime import timedelta
        import datetime
        from django.db.models import Sum, Count
        
        # Importar modelos dentro de la función
        from api.models import Venta, Pedido

        now = timezone.now()
        start_date = now.replace(day=1, hour=0, minute=0, second=0)
        end_date = now
        
        q_lower = question.lower()
        
        # Lógica de fechas
        if 'ayer' in q_lower:
            start_date = now - timedelta(days=1)
            start_date = start_date.replace(hour=0, minute=0, second=0)
            end_date = start_date.replace(hour=23, minute=59, second=59)
        elif 'hoy' in q_lower:
            start_date = now.replace(hour=0, minute=0, second=0)
        elif 'mes pasado' in q_lower:
            first = now.replace(day=1)
            last_month = first - timedelta(days=1)
            start_date = last_month.replace(day=1, hour=0, minute=0)
            end_date = last_month.replace(hour=23, minute=59)

        # Consultas ORM
        ventas_pos = Venta.objects.filter(
            fecha__gte=start_date, 
            fecha__lte=end_date,
            estado='PAGADO'
        ).aggregate(total=Sum('total'), count=Count('id'))
        
        ventas_pedidos = Pedido.objects.filter(
            fecha__gte=start_date,
            fecha__lte=end_date,
            tipo_pedido='ENTREGA'
        ).aggregate(total=Sum('total'), count=Count('id'))

        total_pos = ventas_pos['total'] or 0
        total_pedidos = ventas_pedidos['total'] or 0
        
        return {
            "rango": {
                "inicio": start_date.strftime("%Y-%m-%d %H:%M"),
                "fin": end_date.strftime("%Y-%m-%d %H:%M")
            },
            "ventas": {
                "pos_local": float(total_pos),
                "domicilios": float(total_pedidos),
                "total_consolidado": float(total_pos + total_pedidos)
            },
            "operaciones": {
                "num_ventas_pos": ventas_pos['count'],
                "num_peds_domicilio": ventas_pedidos['count']
            }
        }
    
    def analyze_data(self, data, question):
        """Analiza datos JSON arbitrarios"""
        if isinstance(data, dict):
            data_str = json.dumps(data, indent=2, ensure_ascii=False)
        else:
            data_str = str(data)
        
        prompt = f"Analiza estos datos:\n\n{data_str[:5000]}\n\nPregunta: {question}"
        return self.ask(prompt, include_docs=False)
    
    def check_health(self):
        """Verifica conexión con Google"""
        if not self.api_key:
             return {
                'status': 'error',
                'message': 'Falta GOOGLE_API_KEY en .env',
                'provider': 'Gemini (Sin Configurar)'
            }

        try:
            # Prueba simple de ping (generar 'Hola')
            requests.post(
                f"{self.base_url}?key={self.api_key}",
                headers={'Content-Type': 'application/json'},
                json={"contents": [{"parts": [{"text": "Hola"}]}]},
                timeout=5
            )
            return {
                'status': 'ok',
                'message': f'✅ Conectado a {self.model}',
                'provider': f'Google {self.model}',
                'models': [self.model]
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Error conectando a Gemini: {str(e)}',
                'provider': 'Google Gemini (Error)'
            }
