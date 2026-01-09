"""
Sistema de Flujos Conversacionales para crear clientes paso a paso
"""

class ClienteCreationFlow:
    """
    Flujo conversacional para crear un cliente
    Maneja el diálogo paso a paso sin depender de la IA
    """
    
    # Pasos del flujo
    STEPS = [
        {
            "field": "nombre_completo",
            "question": "📝 ¿Cuál es el nombre completo del contacto?",
            "required": True
        },
        {
            "field": "tipo_identificacion",
            "question": "🪪 ¿Tipo de identificación? (ej: CC, NIT, TI, CE)",
            "required": True
        },
        {
            "field": "identificacion",
            "question": "🆔 ¿Número de identificación?",
            "required": True
        },
        {
            "field": "nombre_negocio",
            "question": "🏪 ¿Nombre del Negocio? (opcional, presiona '.' para omitir)",
            "required": False
        },
        {
            "field": "celular",
            "question": "📱 ¿Número de celular? (opcional, presiona '.' para omitir)",
            "required": False
        },
        {
            "field": "direccion",
            "question": "📍 ¿Dirección completa? (opcional, presiona '.' para omitir)",
            "required": False
        },
        {
            "field": "ciudad",
            "question": "🏙️ ¿Ciudad? (ej: Bogotá) (opcional, presiona '.' para omitir)",
            "required": False
        },
        {
            "field": "departamento",
            "question": "🗺️ ¿Departamento? (ej: Cundinamarca) (opcional, presiona '.' para omitir)",
            "required": False
        },
        {
            "field": "vendedor",
            "question": "👤 ¿Vendedor asignado?",
            "required": False,
            "dynamic_options": "Vendedor"
        },
        {
            "field": "zona_ruta",
            "question": "🚚 ¿Zona o Ruta?",
            "required": False,
            "dynamic_options": "Ruta"
        },
        {
            "field": "lista_precios",
            "question": "💰 ¿Lista de precios?",
            "required": False,
            "dynamic_options": "ListaPrecio"
        },
        {
            "field": "dias_entrega",
            "question": "📅 ¿Días de entrega? (ej: LUN,MIE,VIE o '.' para ninguno)",
            "required": False
        }
    ]
    
    def __init__(self):
        self.data = {}
        self.current_step = 0
        self.completed = False
        self.active = False
    
    def start(self):
        """Inicia el flujo"""
        self.reset()
        self.active = True
    
    def get_next_question(self):
        """Obtiene la siguiente pregunta del flujo"""
        if self.current_step >= len(self.STEPS):
            return self._generate_confirmation()
        
        step = self.STEPS[self.current_step]
        question = step["question"]
        
        # Cargar opciones dinámicas si aplica
        if "dynamic_options" in step:
            model_name = step["dynamic_options"]
            options_str = self._get_options_for_model(model_name)
            if options_str:
                question += f"\n\nOpciones disponibles:\n{options_str}\n\n(O escribe '.' para ninguno)"
            else:
                question += " (ej: Opción 1, Opción 2, o '.' para ninguno)"
                
        return question

    def _get_options_for_model(self, model_name):
        """Obtiene opciones formateadas desde la BD"""
        try:
            from api.models import Vendedor, Ruta, ListaPrecio
            
            options = []
            if model_name == "Vendedor":
                objs = Vendedor.objects.all().order_by('id_vendedor')
                options = [f"- {v.id_vendedor}: {v.nombre}" for v in objs]
            elif model_name == "Ruta":
                objs = Ruta.objects.filter(activo=True).order_by('nombre')
                options = [f"- {r.nombre}" for r in objs]
            elif model_name == "ListaPrecio":
                objs = ListaPrecio.objects.all().order_by('nombre')
                options = [f"- {l.nombre}" for l in objs]
                
            return "\n".join(options) if options else ""
        except Exception as e:
            return ""
    
    def process_answer(self, answer: str):
        """Procesa la respuesta del usuario"""
        answer = answer.strip()
        
        # Si ya completamos todas las preguntas
        if self.current_step >= len(self.STEPS):
            # Usuario está confirmando
            if answer.lower() in ['si', 'sí', 's', 'confirmar', 'ok', 'yes']:
                self.completed = True
                return {
                    "status": "completed",
                    "data": self._prepare_final_data(),
                    "message": "✅ Perfecto, creando el cliente..."
                }
            else:
                self.reset()
                return {
                    "status": "cancelled",
                    "message": "❌ Cancelado. Si quieres crear otro cliente, dime 'crear cliente'"
                }
        
        # Guardar respuesta actual
        step = self.STEPS[self.current_step]
        field = step["field"]
        
        # Si la respuesta está vacía y el campo es requerido
        if not answer and step["required"]:
            return {
                "status": "waiting",
                "message": f"⚠️ Este campo es obligatorio. {step['question']}"
            }

        # 🛑 VALIDACIÓN DE IDENTIFICACIÓN DUPLICADA
        if field == "identificacion":
            identificacion_val = answer.strip().upper()
            try:
                from api.models import Cliente
                cliente_existente = Cliente.objects.filter(identificacion=identificacion_val).first()
                if cliente_existente:
                    # OPCIÓN 1: CARGAR (Autocompletar todo)
                    if "cargar" in answer.lower():
                        # Llenamos todo el formulario con los datos de la BD
                        self.data['identificacion'] = cliente_existente.identificacion
                        self.data['nombre_completo'] = cliente_existente.nombre_completo
                        self.data['tipo_identificacion'] = cliente_existente.tipo_identificacion
                        self.data['nombre_negocio'] = cliente_existente.alias
                        self.data['celular'] = cliente_existente.movil
                        self.data['direccion'] = cliente_existente.direccion
                        self.data['ciudad'] = cliente_existente.ciudad
                        self.data['departamento'] = cliente_existente.departamento
                        self.data['vendedor'] = cliente_existente.vendedor_asignado
                        self.data['zona_ruta'] = cliente_existente.zona_barrio
                        self.data['lista_precios'] = cliente_existente.tipo_lista_precio
                        self.data['dias_entrega'] = cliente_existente.dia_entrega
                        self.data['metodo_pago'] = cliente_existente.medio_pago_defecto
                        
                        # Saltamos al final
                        self.current_step = len(self.STEPS)
                        return {
                            "status": "waiting",
                            "message": self._generate_confirmation()
                        }

                    # OPCIÓN 2: CONFIRMAR (Editar paso a paso)
                    elif "confirmar" in answer.lower() or "editar" in answer.lower():
                         # Extraer posible ID del texto si viene "CONFIRMAR 123"
                        import re
                        match = re.search(r'\d+', answer)
                        if match:
                            identificacion_val = match.group()
                            answer = identificacion_val 
                        # Dejamos pasar para que siga al siguiente paso (Nombre)
                        pass 
                    
                    else:
                        # MENSAJE DE OFERTA DE AUTOCOMPLETADO
                        detalles = f"👤 {cliente_existente.nombre_completo}"
                        if cliente_existente.alias: detalles += f"\n🏪 {cliente_existente.alias}"
                        if cliente_existente.vendedor_asignado: detalles += f"\n👤 Vend: {cliente_existente.vendedor_asignado}"
                        
                        return {
                            "status": "waiting",
                            "message": f"⚡ **¡Cliente Encontrado!**\n\n{detalles}\n\n¿Qué deseas hacer?\n\n🚀 Escribe **'CARGAR'** para usar estos datos automáticamente (¡Más rápido!).\n✏️ Escribe **'CONFIRMAR {identificacion_val}'** para editar los datos paso a paso."
                        }
            except Exception:
                pass

        elif field == "vendedor":
            # Validar e intentar resolver el Vendedor al Nombre/ID correcto
            v_input = answer.strip()
            if v_input != ".":
                try:
                    from api.models import Vendedor
                    
                    # 0. Si el input es un dígito y venimos de una sugerencia (ej: eligiendo opción 1)
                    if v_input.isdigit() and hasattr(self, 'last_suggestions_vendedor'):
                        idx = int(v_input) - 1
                        if 0 <= idx < len(self.last_suggestions_vendedor):
                            answer = self.last_suggestions_vendedor[idx].nombre # NOMBRE, no ID
                            del self.last_suggestions_vendedor # Limpiar
                            self.data[field] = answer
                            self.current_step += 1
                            return self._get_next_step_response()

                    # 1. Por ID directo (ej: ID1)
                    v_match = Vendedor.objects.filter(id_vendedor__iexact=v_input).first()
                    
                    # 2. Por contenido (startswith es mejor para autocompletar)
                    if not v_match:
                        matches = Vendedor.objects.filter(nombre__istartswith=v_input)
                        if matches.count() == 1:
                            v_match = matches.first()
                        elif matches.count() > 1:
                            # Múltiples coincidencias -> PREGUNTAR
                            self.last_suggestions_vendedor = list(matches)
                            opciones = [f"{i+1}. {v.nombre} ({v.id_vendedor})" for i, v in enumerate(matches)]
                            lista_str = "\n".join(opciones)
                            return {
                                "status": "waiting",
                                "message": f"🔎 Encontré varios vendedores con '{v_input}'. Escribe el **número** de tu elección:\n\n{lista_str}"
                            }
                        else:
                            # 3. Intento parcial general (contains)
                            matches = Vendedor.objects.filter(nombre__icontains=v_input)
                            if matches.count() == 1:
                                v_match = matches.first()
                            elif matches.count() > 1:
                                self.last_suggestions_vendedor = list(matches)
                                opciones = [f"{i+1}. {v.nombre} ({v.id_vendedor})" for i, v in enumerate(matches)]
                                lista_str = "\n".join(opciones)
                                return {
                                    "status": "waiting",
                                    "message": f"🔎 Encontré varios vendedores con '{v_input}'. Escribe el **número**:\n\n{lista_str}"
                                }

                    if v_match:
                        # Guardamos EL NOMBRE (v.nombre) porque el Frontend usa value={v.nombre}
                        # Aunque lo ideal sería ID, debemos adaptarnos al sistema actual.
                        answer = v_match.nombre
                    else:
                        # Si no encuentra nada, avisamos
                        opciones = [f"{v.id_vendedor}: {v.nombre}" for v in Vendedor.objects.all()]
                        lista_str = "\n".join(opciones)
                        return {
                            "status": "waiting",
                            "message": f"⚠️ No encontré vendedor con '{v_input}'. Selecciona de la lista:\n\n{lista_str}"
                        }
                except Exception as e:
                    print(f"Error validando vendedor: {e}")

        elif field == "zona_ruta":
            # Validar Ruta
            r_input = answer.strip()
            if r_input != "." and r_input.lower() != "sin ruta":
                try:
                    from api.models import Ruta
                    # 1. Exacto
                    r_match = Ruta.objects.filter(nombre__iexact=r_input, activo=True).first()
                    # 2. Parcial
                    if not r_match:
                        r_match = Ruta.objects.filter(nombre__icontains=r_input, activo=True).first()
                    
                    if r_match:
                        answer = r_match.nombre
                    else:
                        opciones = [r.nombre for r in Ruta.objects.filter(activo=True)]
                        lista_str = "\n".join(opciones[:10]) # Limitar a 10
                        return {
                            "status": "waiting",
                            "message": f"⚠️ No encontré la ruta '{r_input}'.\n\nOpciones disponibles:\n{lista_str}"
                        }
                except Exception:
                    pass

        elif field == "lista_precios":
            # Validar Lista de Precios
            l_input = answer.strip()
            if l_input != "." and l_input:
                try:
                    from api.models import ListaPrecio
                    # 1. Exacto
                    l_match = ListaPrecio.objects.filter(nombre__iexact=l_input, activo=True).first()
                    # 2. Parcial
                    if not l_match:
                        l_match = ListaPrecio.objects.filter(nombre__icontains=l_input, activo=True).first()
                    
                    if l_match:
                        answer = l_match.nombre # Guardamos NOMBRE para compatibilidad
                    else:
                        opciones = [lp.nombre for lp in ListaPrecio.objects.filter(activo=True)]
                        lista_str = "\n".join(opciones[:10])
                        return {
                            "status": "waiting",
                            "message": f"⚠️ No encontré la lista '{l_input}'.\n\nOpciones disponibles:\n{lista_str}"
                        }
                except Exception:
                    pass
        
        # Guardar dato (solo si no está vacío)
        if answer:
            # Forzar MAYÚSCULAS para campos de texto libre
            campos_upper = ['nombre_completo', 'nombre_negocio', 'direccion', 'ciudad', 'departamento', 'identificacion']
            if field in campos_upper and isinstance(answer, str):
                self.data[field] = answer.upper()
            else:
                self.data[field] = answer
        
        # Avanzar al siguiente paso
        self.current_step += 1
        
        # Obtener siguiente pregunta
        next_question = self.get_next_question()
        
        return {
            "status": "waiting",
            "message": next_question
        }
    
    def _generate_confirmation(self):
        """Genera mensaje de confirmación con resumen de datos"""
        summary = "📋 **Resumen de datos:**\n\n"
        summary += f"👤 Nombre: {self.data.get('nombre_completo', 'No especificado')}\n"
        summary += f"🪪 Tipo ID: {self.data.get('tipo_identificacion', 'CC')}\n"
        summary += f"🆔 Identificación: {self.data.get('identificacion', 'No especificado')}\n"
        
        if self.data.get('nombre_negocio'):
            summary += f"🏪 Negocio: {self.data['nombre_negocio']}\n"
        if self.data.get('celular'):
            summary += f"📱 Celular: {self.data['celular']}\n"
        if self.data.get('direccion'):
            summary += f"📍 Dirección: {self.data['direccion']}\n"
        if self.data.get('ciudad'):
            summary += f"🏙️ Ciudad: {self.data['ciudad']}\n"
        if self.data.get('departamento'):
            summary += f"🗺️ Departamento: {self.data['departamento']}\n"
        if self.data.get('vendedor') and self.data.get('vendedor') != ".":
            summary += f"👤 Vendedor: {self.data['vendedor']}\n"
        if self.data.get('zona_ruta') and self.data.get('zona_ruta') != ".":
            summary += f"🚚 Zona/Ruta: {self.data['zona_ruta']}\n"
        if self.data.get('lista_precios'):
            summary += f"💰 Lista Precios: {self.data['lista_precios']}\n"
        if self.data.get('dias_entrega'):
            summary += f"📅 Días Entrega: {self.data['dias_entrega']}\n"
        
        summary += "\n✅ ¿Confirmas estos datos? Responde **'SI'** para crear el cliente o **'NO'** para cancelar."
        
        return summary
    
    def _prepare_final_data(self):
        """Prepara los datos finales con valores por defecto"""
        # Limpiar puntos que se usan para omitir
        def clean_value(val):
            return '' if val == '.' else val
        
        return {
            "tipo_identificacion": self.data.get('tipo_identificacion', 'CC').upper(),
            "identificacion": self.data.get('identificacion', ''),
            "nombre_completo": self.data.get('nombre_completo', ''),
            "nombre_negocio": clean_value(self.data.get('nombre_negocio', '')),
            "celular": clean_value(self.data.get('celular', '')),
            "metodo_pago": "Efectivo",
            "direccion": clean_value(self.data.get('direccion', '')),
            "departamento": clean_value(self.data.get('departamento', '')),
            "ciudad": clean_value(self.data.get('ciudad', '')),
            "vendedor": clean_value(self.data.get('vendedor', 'Ninguno')) or "Ninguno",
            "zona_ruta": clean_value(self.data.get('zona_ruta', 'Sin ruta')) or "Sin ruta",
            "lista_precios": clean_value(self.data.get('lista_precios', '')),
            "dias_entrega": clean_value(self.data.get('dias_entrega', '')),
            "activo": True
        }
    
    def reset(self):
        """Reinicia el flujo"""
        self.data = {}
        self.current_step = 0
        self.completed = False
        self.active = False
        if hasattr(self, 'last_suggestions_vendedor'):
            del self.last_suggestions_vendedor
    
    def get_progress(self):
        """Obtiene el progreso actual"""
        return {
            "step": self.current_step + 1,
            "total": len(self.STEPS) + 1,  # +1 para confirmación
            "percentage": int((self.current_step / len(self.STEPS)) * 100)
        }


# Almacén global de flujos activos (en producción usar Redis o BD)
active_flows = {}

def get_or_create_flow(user_id: str, flow_type: str = "cliente"):
    """Obtiene o crea un flujo conversacional"""
    key = f"{user_id}_{flow_type}"
    
    if key not in active_flows:
        if flow_type == "cliente":
            active_flows[key] = ClienteCreationFlow()
    
    return active_flows[key]

def clear_flow(user_id: str, flow_type: str = "cliente"):
    """Limpia un flujo completado"""
    key = f"{user_id}_{flow_type}"
    if key in active_flows:
        del active_flows[key]
