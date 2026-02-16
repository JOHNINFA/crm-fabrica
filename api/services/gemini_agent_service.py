"""
Servicio de Agente IA usando Google Gemini
Versión simplificada y limpia sin bypasses complejos
"""

import os
import json
import google.generativeai as genai
from typing import Dict, List
from datetime import datetime
from django.db.models import Sum, Count, Q
from django.utils import timezone
from api.services.rag_context_loader import load_shared_rag_context


class GeminiAgent:
    """
    Agente IA potenciado por Gemini que puede ejecutar herramientas
    """
    
    def __init__(self):
        # Cargar variables de entorno desde .env.ai
        from dotenv import load_dotenv
        from pathlib import Path
        
        env_path = Path(__file__).resolve().parent.parent.parent / '.env.ai'
        load_dotenv(env_path)
        
        # Configurar Gemini
        api_key = os.getenv('GEMINI_API_KEY', '')
        if not api_key or api_key == 'TU_API_KEY_AQUI':
            raise ValueError("❌ GEMINI_API_KEY no configurada. Edita el archivo .env.ai")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('models/gemini-flash-latest')
        self.tools = self._define_tools()
        self.context = load_shared_rag_context()
    
    def _define_tools(self) -> List[Dict]:
        """Define las herramientas disponibles para el agente"""
        return [
            {
                "name": "consultar_ventas",
                "description": "Consulta ventas totales en un rango de fechas, opcionalmente filtrado por vendedor",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "fecha_inicio": {
                            "type": "string",
                            "description": "Fecha de inicio en formato YYYY-MM-DD"
                        },
                        "fecha_fin": {
                            "type": "string",
                            "description": "Fecha de fin en formato YYYY-MM-DD"
                        },
                        "vendedor": {
                            "type": "string",
                            "description": "ID o nombre del vendedor (opcional). Ejemplo: ID1, ID2, Wilson"
                        }
                    },
                    "required": ["fecha_inicio", "fecha_fin"]
                }
            },
            {
                "name": "buscar_pedidos_cliente",
                "description": "Busca pedidos realizados por un cliente específico",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "nombre_cliente": {
                            "type": "string",
                            "description": "Nombre completo o parcial del cliente"
                        },
                        "fecha": {
                            "type": "string",
                            "description": "Fecha específica (opcional) en formato YYYY-MM-DD"
                        }
                    },
                    "required": ["nombre_cliente"]
                }
            },
            {
                "name": "crear_cliente",
                "description": "Crea un nuevo cliente en el sistema",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "nombre_completo": {
                            "type": "string",
                            "description": "Nombre completo del cliente"
                        },
                        "celular": {
                            "type": "string",
                            "description": "Número de celular del cliente"
                        },
                        "direccion": {
                            "type": "string",
                            "description": "Dirección del cliente (opcional)"
                        }
                    },
                    "required": ["nombre_completo", "celular"]
                }
            }
        ]
    
    def execute_tool(self, tool_name: str, parameters: Dict) -> Dict:
        """Ejecuta una herramienta específica"""
        try:
            if tool_name == "consultar_ventas":
                return self._consultar_ventas(parameters)
            elif tool_name == "buscar_pedidos_cliente":
                return self._buscar_pedidos_cliente(parameters)
            elif tool_name == "crear_cliente":
                return self._crear_cliente(parameters)
            else:
                return {"success": False, "message": f"Herramienta '{tool_name}' no encontrada"}
        except Exception as e:
            return {"success": False, "message": f"Error ejecutando {tool_name}: {str(e)}"}
    
    def _consultar_ventas(self, params: Dict) -> Dict:
        """Consulta ventas en múltiples fuentes"""
        from api.models import Venta, Pedido
        import api.models
        from datetime import datetime
        
        fecha_inicio_str = params.get("fecha_inicio")
        fecha_fin_str = params.get("fecha_fin")
        vendedor_filtro = params.get("vendedor")
        
        # Convertir fechas
        start_date = datetime.strptime(fecha_inicio_str, "%Y-%m-%d")
        end_date = datetime.strptime(fecha_fin_str, "%Y-%m-%d")
        end_date = end_date.replace(hour=23, minute=59, second=59)
        
        # Hacer timezone-aware
        if timezone.is_naive(start_date):
            start_date = timezone.make_aware(start_date)
        if timezone.is_naive(end_date):
            end_date = timezone.make_aware(end_date)
        
        # 1. POS (solo si no es vendedor de ruta)
        total_pos = 0
        es_ruta = vendedor_filtro and vendedor_filtro.upper().startswith("ID")
        
        if not es_ruta:
            q_pos = Venta.objects.filter(fecha__range=[start_date, end_date], estado='PAGADO')
            if vendedor_filtro:
                q_pos = q_pos.filter(vendedor__icontains=vendedor_filtro)
            total_pos = float(q_pos.aggregate(t=Sum('total'))['t'] or 0)
        
        # 2. Pedidos
        q_ped = Pedido.objects.filter(fecha__range=[start_date, end_date])
        if vendedor_filtro:
            if es_ruta:
                q_ped = q_ped.filter(Q(asignado_a_id__iexact=vendedor_filtro) | Q(vendedor__icontains=vendedor_filtro))
            else:
                q_ped = q_ped.filter(vendedor__icontains=vendedor_filtro)
        total_pedidos = float(q_ped.aggregate(t=Sum('total'))['t'] or 0)
        
        # 3. Rutas (Cargues)
        total_ruta = 0
        if es_ruta:
            # Mapeo de IDs a modelos
            cargue_map = {"ID1": "CargueID1", "ID2": "CargueID2", "ID3": "CargueID3",
                         "ID4": "CargueID4", "ID5": "CargueID5", "ID6": "CargueID6"}
            
            vid = vendedor_filtro.upper()
            if vid in cargue_map:
                try:
                    ModelClass = getattr(api.models, cargue_map[vid])
                    total_ruta = float(ModelClass.objects.filter(
                        fecha__range=[start_date, end_date]
                    ).aggregate(t=Sum('neto'))['t'] or 0)
                except:
                    pass
        
        # Reporte
        grand_total = total_pos + total_pedidos + total_ruta
        
        msg = f"💰 REPORTE DE VENTAS"
        if vendedor_filtro:
            msg += f" ({vendedor_filtro})"
        msg += f"\n📅 {fecha_inicio_str} al {fecha_fin_str}:\n"
        msg += "--------------------------------\n"
        if total_pos > 0:
            msg += f"🛒 POS: ${total_pos:,.0f}\n"
        msg += f"📦 Pedidos: ${total_pedidos:,.0f}\n"
        if total_ruta > 0:
            msg += f"🚚 Ruta: ${total_ruta:,.0f}\n"
        msg += "--------------------------------\n"
        msg += f"🏆 TOTAL: ${grand_total:,.0f}"
        
        return {"success": True, "message": msg}
    
    def _buscar_pedidos_cliente(self, params: Dict) -> Dict:
        """Busca pedidos de un cliente"""
        from api.models import Pedido, Venta
        from datetime import timedelta
        
        nombre = params.get("nombre_cliente", "")
        fecha_str = params.get("fecha")
        
        if fecha_str:
            fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
            fecha_inicio = datetime.combine(fecha, datetime.min.time())
            fecha_fin = datetime.combine(fecha, datetime.max.time())
        else:
            # Últimos 90 días por defecto
            fecha_fin = timezone.now()
            fecha_inicio = fecha_fin - timedelta(days=90)
        
        # Buscar en Pedidos
        pedidos = Pedido.objects.filter(
            Q(destinatario__icontains=nombre) | Q(numero_pedido__icontains=nombre),
            fecha__range=[fecha_inicio, fecha_fin]
        )[:10]
        
        if not pedidos.exists():
            return {"success": False, "message": f"❌ No encontré pedidos para '{nombre}'"}
        
        # Formatear resultado
        msg = f"📦 Pedidos de '{nombre}':\n"
        for p in pedidos:
            msg += f"\n• {p.numero_pedido} - {p.fecha.strftime('%d/%m/%Y')}\n"
            msg += f"  Cliente: {p.destinatario}\n"
            msg += f"  Total: ${p.total:,.0f}\n"
        
        return {"success": True, "message": msg}
    
    def _crear_cliente(self, params: Dict) -> Dict:
        """Crea un nuevo cliente"""
        from api.models import Cliente
        
        nombre = params.get("nombre_completo")
        celular = params.get("celular")
        direccion = params.get("direccion", "")
        
        try:
            cliente = Cliente.objects.create(
                nombre_completo=nombre,
                celular=celular,
                direccion=direccion
            )
            return {
                "success": True,
                "message": f"✅ Cliente '{nombre}' creado exitosamente!"
            }
        except Exception as e:
            return {"success": False, "message": f"❌ Error: {str(e)}"}
    
    def process_command(self, command: str) -> Dict:
        """Procesa un comando usando Gemini"""
        
        # Preparar contexto para Gemini
        tools_desc = "\n".join([
            f"- {t['name']}: {t['description']}" 
            for t in self.tools
        ])
        
        prompt = f"""Eres un asistente de CRM. El usuario dice: "{command}"

Herramientas disponibles:
{tools_desc}

Fecha actual: {datetime.now().strftime('%Y-%m-%d')}

Contexto del CRM:
{self.context[:2000]}

Si el usuario quiere ejecutar una acción, responde SOLO con un JSON así:
{{"tool": "nombre_herramienta", "parameters": {{"param1": "valor1"}}}}

Si solo quiere conversar, responde normalmente.

IMPORTANTE:
- Para consultas de ventas, usa 'consultar_ventas'
- Para buscar pedidos de clientes, usa 'buscar_pedidos_cliente'  
- Si mencionan "ID1", "ID2", etc., es un vendedor de ruta
- Si mencionan un año completo (ej: 2025), usa desde enero 1 hasta diciembre 31
"""
        
        try:
            # Llamar a Gemini
            response = self.model.generate_content(prompt)
            text_response = response.text.strip()
            
            # Limpiar bloques markdown si los hay
            if "```json" in text_response:
                # Extraer JSON del bloque markdown
                start = text_response.find("```json") + 7
                end = text_response.find("```", start)
                if end > start:
                    text_response = text_response[start:end].strip()
            elif "```" in text_response:
                # Bloque markdown sin especificar lenguaje
                start = text_response.find("```") + 3
                end = text_response.find("```", start)
                if end > start:
                    text_response = text_response[start:end].strip()
            
            # Intentar parsear como JSON (llamada de herramienta)
            if text_response.startswith("{"):
                try:
                    action = json.loads(text_response)
                    tool_name = action.get("tool")
                    parameters = action.get("parameters", {})
                    
                    if tool_name:
                        result = self.execute_tool(tool_name, parameters)
                        return {
                            "ai_response": result.get("message", "Acción ejecutada"),
                            "action_taken": True,
                            "tool_used": tool_name,
                            "tool_result": result
                        }
                except json.JSONDecodeError:
                    pass
            
            # Respuesta conversacional
            return {
                "ai_response": text_response,
                "action_taken": False
            }
            
        except Exception as e:
            return {
                "ai_response": f"❌ Error: {str(e)}",
                "action_taken": False
            }
