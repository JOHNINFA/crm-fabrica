"""
Servicio de Asistente IA usando Ollama local
"""
import requests
import json
from pathlib import Path


class AIAssistant:
    """
    Asistente IA que usa Ollama (qwen2.5:7b) localmente
    """
    
    def __init__(self, model="qwen2.5:7b"):
        self.base_url = "http://localhost:11434/api"
        self.model = model
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
            
            # Documentos principales (REDUCIDO para mejor velocidad)
            doc_files = [
                "RESUMEN_ANALISIS.md"
            ]
            
            for doc_file in doc_files:
                file_path = base_path / doc_file
                if file_path.exists():
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # Tomar solo primeros 1000 caracteres (OPTIMIZADO)
                        docs.append(content[:1000])
            
            self.context = "\n\n---\n\n".join(docs)
            self.docs_loaded = True
            
            return self.context
        except Exception as e:
            print(f"⚠️ Error cargando documentación: {e}")
            return ""
    
    def ask(self, question, include_docs=True, temperature=0.7):
        """
        Pregunta al asistente IA con capacidad de Tools (Ventas)
        """
        
        # 1. Detectar Intención de Herramientas
        tool_data = ""
        context_msg = ""
        
        try:
            # Analizar si pide ventas
            if self._detect_sales_intent(question):
                print("🔎 Detectada intención de REPORTE DE VENTAS")
                sales_data = self._get_sales_report(question)
                tool_data = f"\nDATOS REALES DEL SISTEMA:\n{json.dumps(sales_data, indent=2, ensure_ascii=False)}\n"
                context_msg = "Usa los DATOS REALES DEL SISTEMA proporcionados para responder. "
        except Exception as e:
            print(f"⚠️ Error ejecutando herramienta de ventas: {e}")
            # MODO DEBUG: Devolver error directo para ver qué pasa
            return f"🐛 ERROR TÉCNICO: No pude consultar la base de datos. Detalles: {str(e)}"

        # 2. Preparar Prompt
        if include_docs:
            docs = self.load_documentation()
            system_prompt = f"""
Eres el Asistente IA del CRM Fábrica.
Respondes en español de forma analítica y profesional.

Contexto del sistema:
{docs[:800]}

{context_msg}
"""
        else:
            system_prompt = f"""
Eres Agente Guerrero IA.
Tu objetivo es ayudar con datos del CRM.
{context_msg}
"""
        
        # Insertar datos de herramientas si existen
        full_content = question
        if tool_data:
            full_content += f"\n\n{tool_data}"

        full_prompt = f"{system_prompt}\n\nUsuario: {full_content}\n\nRespuesta:"
        
        # 3. Llamar a Ollama
        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": 300,
            }
        }
        
        try:
            response = requests.post(f"{self.base_url}/generate", json=payload, timeout=45)
            response.raise_for_status()
            return response.json().get("response", "").strip()
            
        except requests.exceptions.Timeout:
            return "⏱️ El análisis de ventas tomó demasiado tiempo. Intenta con un rango de fechas más corto."
        except Exception as e:
            return f"❌ Error: {str(e)}"

    def _detect_sales_intent(self, question):
        """Detecta si la pregunta es sobre ventas/reportes"""
        keywords = ['venta', 'vendio', 'pedido', 'reporte', 'total', 'cuanto', 'ingreso']
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
        
        # Importar modelos dentro de la función para evitar errores de carga
        from api.models import Venta, Pedido

        # Analizar fechas (Lógica simple por ahora)
        now = timezone.now()
        start_date = now.replace(day=1, hour=0, minute=0, second=0) # Inicio de mes actual
        end_date = now
        
        q_lower = question.lower()
        
        # Función auxiliar para hacer fechas timezone-aware de forma segura
        def make_aware_safe(dt):
            if timezone.is_naive(dt):
                return timezone.make_aware(dt)
            return dt
        
        # Lógica básica de fechas
        if 'ayer' in q_lower:
            start_date = now - timedelta(days=1)
            end_date = start_date.replace(hour=23, minute=59)
            start_date = start_date.replace(hour=0, minute=0)
        elif 'hoy' in q_lower:
            start_date = now.replace(hour=0, minute=0)
        elif 'mes pasado' in q_lower:
            # Ir al primer día del mes anterior
            first = now.replace(day=1)
            last_month = first - timedelta(days=1)
            start_date = last_month.replace(day=1, hour=0, minute=0)
            end_date = last_month.replace(hour=23, minute=59)
        elif 'diciembre' in q_lower and '2025' in q_lower:
             start_date = datetime.datetime(2025, 12, 1)
             end_date = datetime.datetime(2025, 12, 31, 23, 59)
             # Hacer aware si es necesario
             start_date = make_aware_safe(start_date)
             end_date = make_aware_safe(end_date)
             
        elif 'diciembre' in q_lower: # Asumir año actual o anterior si estamos en Enero
             year = now.year if now.month != 1 else now.year - 1
             start_date = datetime.datetime(year, 12, 1)
             end_date = datetime.datetime(year, 12, 31, 23, 59)
             start_date = make_aware_safe(start_date)
             end_date = make_aware_safe(end_date)

        # Consultas ORM
        # 1. Ventas POS
        ventas_pos = Venta.objects.filter(
            fecha__gte=start_date, 
            fecha__lte=end_date,
            estado='PAGADO'
        ).aggregate(
            total=Sum('total'),
            count=Count('id')
        )
        
        # 2. Pedidos
        ventas_pedidos = Pedido.objects.filter(
            fecha__gte=start_date,
            fecha__lte=end_date,
            tipo_pedido='ENTREGA' # Asumiendo entregas son ventas
        ).aggregate(
            total=Sum('total'),
            count=Count('id')
        )

        total_pos = ventas_pos['total'] or 0
        total_pedidos = ventas_pedidos['total'] or 0
        
        return {
            "periodo_analizado": {
                "inicio": start_date.strftime("%Y-%m-%d"),
                "fin": end_date.strftime("%Y-%m-%d")
            },
            "resumen_ventas": {
                "pos_mostrador": float(total_pos),
                "pedidos_domicilio": float(total_pedidos),
                "total_general": float(total_pos + total_pedidos)
            },
            "transacciones": {
                "cantidad_pos": ventas_pos['count'],
                "cantidad_pedidos": ventas_pedidos['count']
            }
        }
    
    def analyze_data(self, data, question):
        """
        Analiza datos y responde pregunta específica
        
        Args:
            data: Datos a analizar (dict o string)
            question: Pregunta sobre los datos
        
        Returns:
            Análisis de la IA
        """
        
        # Formatear datos
        if isinstance(data, dict):
            data_str = json.dumps(data, indent=2, ensure_ascii=False)
        else:
            data_str = str(data)
        
        prompt = f"""
Analiza estos datos:

{data_str[:2000]}

Pregunta: {question}

Proporciona un análisis claro y accionable.
"""
        
        return self.ask(prompt, include_docs=False)
    
    def check_health(self):
        """
        Verifica si Ollama está funcionando
        
        Returns:
            dict con estado y mensaje
        """
        try:
            response = requests.get(f"{self.base_url}/tags", timeout=5)
            response.raise_for_status()
            
            models = response.json().get('models', [])
            model_names = [m['name'] for m in models]
            
            if self.model in model_names:
                return {
                    'status': 'ok',
                    'message': f'IA {self.model} funcionando correctamente',
                    'models': model_names
                }
            else:
                return {
                    'status': 'warning',
                    'message': f'Modelo {self.model} no encontrado',
                    'models': model_names
                }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Error conectando con Ollama: {str(e)}',
                'models': []
            }
