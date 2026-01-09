"""
Session Manager para Agente IA
Maneja conversaciones multi-turno pregunta por pregunta
"""
import requests
import json
import re


class SessionManager:
    """Gestiona sesiones conversacionales para recolección de datos paso a paso"""
    
    def __init__(self, session_id=None):
        from api.models import AgentSession
        import uuid
        
        if session_id:
            try:
                self.session = AgentSession.objects.get(session_id=session_id)
            except AgentSession.DoesNotExist:
                self.session = AgentSession.objects.create()
        else:
            self.session = AgentSession.objects.create()
    
    def start_collection(self, tool_name, required_params):
        """Inicia recolección de datos para una herramienta"""
        self.session.tool_name = tool_name
        self.session.required_params = required_params
        self.session.collected_params = {}
        self.session.current_param_index = 0
        self.session.save()
    
    def add_response(self, user_input, param_name, param_description):
        """Procesa respuesta del usuario y extrae el valor"""
        # Extraer valor usando IA
        value = self._extract_value(user_input, param_name, param_description)
        
        # Guardar
        self.session.collected_params[param_name] = value
        self.session.current_param_index += 1
        self.session.save()
        
        return value
    
    def get_next_question(self, tool_def):
        """Genera la siguiente pregunta"""
        from api.models import Vendedor, Ruta, ListaPrecio
        
        param_name = self.session.get_next_param()
        if not param_name:
            return None
            
        # ⚡ Optimización para Edición Rápida
        # Si es actualizar_cliente y NO es busqueda, asumimos que el usuario
        # ya dijo todo lo que quería cambiar en el prompt inicial.
        if tool_def.get('name') == 'actualizar_cliente' and param_name != 'busqueda':
            return None
        
        # Obtener descripción del parámetro
        props = tool_def.get("parameters", {}).get("properties", {})
        param_info = props.get(param_name, {})
        description = param_info.get("description", param_name)
        
        # Opciones dinámicas
        options_text = ""
        
        if param_name == "vendedor":
            try:
                vendedores = Vendedor.objects.filter(activo=True).values_list('nombre', flat=True)
                if vendedores:
                    options_text = "\n\n📋 *Opciones disponibles:*\n" + "\n".join([f"- {v}" for v in vendedores])
            except: pass
            
        elif param_name == "zona_ruta":
            try:
                rutas = Ruta.objects.filter(activo=True).values_list('nombre', flat=True)
                if rutas:
                    options_text = "\n\n📍 *Rutas disponibles:*\n" + "\n".join([f"- {r}" for r in rutas])
            except: pass
            
        elif param_name == "lista_precios":
            try:
                listas = ListaPrecio.objects.filter(activo=True).values_list('nombre', flat=True)
                if listas:
                    options_text = "\n\n💲 *Listas disponibles:*\n" + "\n".join([f"- {l}" for l in listas])
            except: pass

        # Personalizar pregunta según el parámetro
        question_templates = {
            "busqueda": "¿Cuál es el nombre o ID del cliente que quieres actualizar?",
            "tipo_identificacion": "¿Tipo de identificación? (CC/NIT/CE/PASAPORTE)",
            "identificacion": "¿Número de identificación?",
            "nombre_completo": "¿Nombre completo del contacto?",
            "nombre_negocio": "¿Nombre del negocio? (opcional, Enter para saltar)",
            "celular": "¿Número de celular? (opcional)",

            "metodo_pago": "¿Método de pago? (Efectivo/Crédito/etc)",
            "direccion": "¿Dirección completa?",
            "departamento": "¿Departamento? (ej: Cundinamarca)",
            "ciudad": "¿Ciudad? (ej: Bogotá)",
            "vendedor": "¿Vendedor asignado? (opcional)",
            "zona_ruta": "¿Zona o ruta? (opcional)",
            "lista_precios": "¿Lista de precios? (opcional)",
            "dias_entrega": "¿Días de entrega? (LUN,MAR...)"
        }
        
        base_q = question_templates.get(param_name, f"¿{description}?")
        return f"{base_q}{options_text}"
    
    def _extract_value(self, user_input, param_name, param_description):
        """Extrae valor específico de respuesta natural usando IA"""
        
        # Para respuestas simples, usar directamente
        clean_input = user_input.strip()
        
        # Si es vacío y es opcional, usar None
        if not clean_input or clean_input.lower() in ['skip', 'saltar', 'ninguno', 'no']:
            return None
        
        # Casos especiales
        if param_name == "tipo_identificacion":
            clean_input = clean_input.upper()
            if "CC" in clean_input or "CEDULA" in clean_input:
                return "CC"
            elif "NIT" in clean_input:
                return "NIT"
            elif "CE" in clean_input:
                return "CE"
            elif "PASAPORTE" in clean_input:
                return "PASAPORTE"
            return "CC"  # Default
        
        if param_name == "metodo_pago":
            clean_input_upper = clean_input.upper()
            if "EFECTIVO" in clean_input_upper:
                return "Efectivo"
            elif "CREDITO" in clean_input_upper or "CRÉDITO" in clean_input_upper:
                return "Crédito"
            return clean_input

        if param_name == "dias_entrega":
            # Extraer días de la semana
            dias = []
            dias_map = {
                "LUNES": ["lun", "lunes"],
                "MARTES": ["mar", "martes"],
                "MIERCOLES": ["mie", "miercoles", "miércoles"],
                "JUEVES": ["jue", "jueves"],
                "VIERNES": ["vie", "viernes"],
                "SABADO": ["sab", "sabado", "sábado"]
            }
            
            input_lower = clean_input.lower()
            for dia_key, variantes in dias_map.items():
                if any(v in input_lower for v in variantes):
                    dias.append(dia_key)
            
            return ",".join(dias) if dias else None
            
        if param_name == "zona_ruta":
            # Búsqueda inteligente de ruta
            from api.models import Ruta
            rutas = Ruta.objects.filter(activo=True)
            input_upper = clean_input.upper()
            
            # 1. Búsqueda exacta
            for r in rutas:
                if r.nombre.upper() == input_upper:
                    return r.nombre
            
            # 2. Búsqueda parcial (ej: "Gaitana" en "RUTA GAITANA")
            for r in rutas:
                if input_upper in r.nombre.upper():
                    return r.nombre
                    
            return clean_input
        
        # Para el resto, retornar directamente
        return clean_input
    
    def is_active(self):
        """Verifica si hay una sesión activa"""
        return self.session.tool_name is not None
    
    def get_session_id(self):
        """Retorna el ID de la sesión"""
        return str(self.session.session_id)
