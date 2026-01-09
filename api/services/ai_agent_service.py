"""
Servicio de Agente IA con Herramientas
Permite a la IA ejecutar acciones reales en el CRM
"""
import json
import requests
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any


class AIAgentService:
    """
    Agente IA que puede ejecutar acciones usando herramientas
    """
    
    def __init__(self, model="qwen2.5:7b"):
        self.model = model
        self.base_url = "http://localhost:11434/api"
        self.tools = self._define_tools()
        self.context = self._load_documentation()
        
    def _load_documentation(self) -> str:
        """Carga documentación del CRM para contexto del agente"""
        from pathlib import Path
        
        docs = []
        base_path = Path(__file__).parent.parent.parent
        
        # Documentos a cargar (ordenados por prioridad)
        doc_files = [
            "MANUAL_CONOCIMIENTO_IA.md",  # ← NUEVO: Manual específico para la IA
            "RESUMEN_ANALISIS.md",
            "ARQUITECTURA_SISTEMA_CRM.md"
        ]
        
        for doc_file in doc_files:
            file_path = base_path / doc_file
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Manual completo para el conocimiento, otros resumidos
                    if "MANUAL_CONOCIMIENTO" in doc_file:
                        docs.append(f"## {doc_file}\n{content}")  # Completo
                    else:
                        docs.append(f"## {doc_file}\n{content[:2000]}")  # Resumido
        
        return "\n\n".join(docs) if docs else ""
        
    def _define_tools(self) -> List[Dict]:
        """Define las herramientas disponibles para el agente"""
        return [
            {
                "name": "crear_cliente",
                "description": "Crea un nuevo cliente en la base de datos con todos sus datos",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "tipo_identificacion": {"type": "string", "description": "Tipo de identificación (CC/NIT/CE/PASAPORTE)"},
                        "identificacion": {"type": "string", "description": "Número de identificación"},
                        "nombre_completo": {"type": "string", "description": "Nombre completo del contacto"},
                        "nombre_negocio": {"type": "string", "description": "Nombre del negocio"},
                        "celular": {"type": "string", "description": "Número de celular"},
                        "metodo_pago": {"type": "string", "description": "Método de pago (Efectivo/Crédito)"},

                        "direccion": {"type": "string", "description": "Dirección completa"},
                        "departamento": {"type": "string", "description": "Departamento"},
                        "ciudad": {"type": "string", "description": "Ciudad"},
                        "vendedor": {"type": "string", "description": "Vendedor asignado"},
                        "zona_ruta": {"type": "string", "description": "Zona o ruta"},
                        "lista_precios": {"type": "string", "description": "Lista de precios"},
                        "dias_entrega": {"type": "string", "description": "Días de entrega (LUN,MAR,MIE...)"}
                    },
                    "required": ["identificacion", "nombre_completo"]
                }
            },
            {
                "name": "actualizar_cliente",
                "description": "Actualiza un cliente. EXTRAE 'busqueda' del texto del usuario (ej: 'Actualizar a Pepito').",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "busqueda": {"type": "string", "description": "El nombre EXACTO o ID del cliente mencionado por el usuario"},
                        "identificacion": {"type": "string", "description": "Nueva identificación (opcional)"},
                        "nombre_completo": {"type": "string", "description": "Nuevo nombre contacto"},
                        "nombre_negocio": {"type": "string", "description": "Nuevo nombre negocio"},
                        "celular": {"type": "string", "description": "Nuevo celular"},
                        "metodo_pago": {"type": "string", "description": "Nuevo método de pago"},
                        "direccion": {"type": "string", "description": "Nueva dirección"},
                        "vendedor": {"type": "string", "description": "Nuevo vendedor"},
                        "zona_ruta": {"type": "string", "description": "Nueva ruta"},
                        "dias_entrega": {"type": "string", "description": "Nuevos días entrega"}
                    },
                    "required": ["busqueda"]
                }
            },
            {
                "name": "consultar_ventas",
                "description": "Consulta el TOTAL MONETARIO de ventas. Permite filtrar por fechas y vendedor.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "fecha_inicio": {"type": "string", "description": "Fecha inicial YYYY-MM-DD"},
                        "fecha_fin": {"type": "string", "description": "Fecha final YYYY-MM-DD"},
                        "vendedor": {"type": "string", "description": "Nombre o ID del vendedor (ej: 'ID1', 'Juan')"}
                    }
                }
            },
            {
                "name": "buscar_pedidos_cliente",
                "description": "Busca si EXISTE un pedido específico de un cliente en una fecha o rango.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "nombre_cliente": {"type": "string", "description": "Nombre del cliente o negocio a buscar"},
                        "fecha": {"type": "string", "description": "Fecha específica YYYY-MM-DD (opcional si es hoy)"}
                    },
                    "required": ["nombre_cliente"]
                }
            },
            {
                "name": "obtener_inventario",
                "description": "Obtiene el inventario actual de productos",
                "parameters": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "buscar_producto",
                "description": "Busca un producto por nombre",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "nombre": {"type": "string", "description": "Nombre del producto a buscar"}
                    },
                    "required": ["nombre"]
                }
            },
            {
                "name": "generar_reporte_ventas",
                "description": "Genera un reporte de ventas del día",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "fecha": {"type": "string", "description": "Fecha YYYY-MM-DD, default hoy"}
                    }
                }
            },
            {
                "name": "registrar_vencida",
                "description": "Registra una vencida de producto",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "producto_id": {"type": "integer", "description": "ID del producto"},
                        "cantidad": {"type": "integer", "description": "Cantidad vencida"}
                    },
                    "required": ["producto_id", "cantidad"]
                }
            }
        ]
    
    def execute_tool(self, tool_name: str, parameters: Dict) -> Dict:
        """Ejecuta una herramienta y retorna el resultado"""
        from api.models import Cliente, Venta, Producto, Stock, Pedido
        from django.db.models import Sum, Count, Q
        from django.utils import timezone
        
        try:
            if tool_name == "crear_cliente":
                # Generar identificación única si no se proporciona
                import random
                identificacion = parameters.get("identificacion", f"CLI-{random.randint(10000, 99999)}")
                
                # Normalizar días de entrega (agregar comas si faltan)
                dias_raw = parameters.get("dias_entrega", "")
                dias = []
                if dias_raw:
                    # Limpiar caracteres como puntos
                    dias_raw = dias_raw.replace(".", "")
                    # Separar por comas o espacios
                    partes = dias_raw.replace(",", " ").split()
                    dias = [p.upper().strip() for p in partes if len(p) > 2]
                dia_entrega_fmt = ",".join(dias)

                # Limpiar Vendedor (si viene formato "ID1: Wilson")
                vendedor_raw = parameters.get("vendedor", "Ninguno")
                vendedor_fmt = "Ninguno"
                
                if vendedor_raw and vendedor_raw != ".":
                    # Si ya viene con ID (formato lista)
                    if ":" in vendedor_raw:
                        vendedor_fmt = vendedor_raw.split(":")[0].strip()
                    else:
                        # 🔍 BÚSQUEDA INTELIGENTE DE VENDEDOR
                        try:
                            from api.models import Vendedor
                            # 1. Buscar por ID exacto
                            v_db = Vendedor.objects.filter(id_vendedor__iexact=vendedor_raw).first()
                            if not v_db:
                                # 2. Buscar por Nombre (contiene)
                                v_db = Vendedor.objects.filter(nombre__icontains=vendedor_raw).first()
                            
                            if v_db:
                                vendedor_fmt = v_db.nombre # Guardamos EL NOMBRE (compatible con frontend)
                            else:
                                vendedor_fmt = vendedor_raw.strip() # Si no encuentra, guarda lo que escribió
                        except Exception as e:
                            vendedor_fmt = vendedor_raw.strip()
                
                # Limpiar Ruta (si viene formato "Ruta 1") y quitar punto
                ruta_raw = parameters.get("zona_ruta", "Sin ruta")
                if ruta_raw == ".": ruta_raw = "Sin ruta"
                # Limpiar prefijo "- " si viene de la lista
                ruta_fmt = ruta_raw.replace("- ", "").strip()

                # 🔍 BÚSQUEDA INTELIGENTE DE RUTA EN BD
                if ruta_fmt and ruta_fmt.lower() != "sin ruta":
                    try:
                        from api.models import Ruta
                        # 1. Intento exacto
                        ruta_db = Ruta.objects.filter(nombre__iexact=ruta_fmt, activo=True).first()
                        if not ruta_db:
                            # 2. Intento parcial (con que contenta la palabra)
                            ruta_db = Ruta.objects.filter(nombre__icontains=ruta_fmt, activo=True).first()
                        
                        if ruta_db:
                            ruta_fmt = ruta_db.nombre  # Usar el nombre REAL de la BD
                    except Exception as e:
                        print(f"Error buscando ruta: {e}")
                
                # Lista de precios
                lista_raw = parameters.get("lista_precios", "")
                if lista_raw == ".": lista_raw = ""
                lista_fmt = lista_raw.replace("- ", "").strip()
                
                # Verificar si ya existe -> ACTUALIZAR (Upsert)
                cliente_existente = Cliente.objects.filter(identificacion=identificacion).first()
                
                if cliente_existente:
                    # Actualizar datos
                    cliente = cliente_existente
                    cliente.nombre_completo = parameters.get("nombre_completo", cliente.nombre_completo)
                    cliente.tipo_identificacion = parameters.get("tipo_identificacion", cliente.tipo_identificacion)
                    cliente.alias = parameters.get("nombre_negocio", cliente.alias)
                    cliente.movil = parameters.get("celular", cliente.movil)
                    cliente.direccion = parameters.get("direccion", cliente.direccion)
                    cliente.departamento = parameters.get("departamento", cliente.departamento)
                    cliente.ciudad = parameters.get("ciudad", cliente.ciudad)
                    cliente.vendedor_asignado = vendedor_fmt
                    cliente.zona_barrio = ruta_fmt
                    cliente.tipo_lista_precio = lista_fmt
                    cliente.dia_entrega = dia_entrega_fmt
                    cliente.save()
                    
                    mensaje_exito = f"⚠️ El cliente con identificación {identificacion} ya existía. ✅ Se han actualizado sus datos."
                else:
                    # Crear nuevo
                    cliente = Cliente.objects.create(
                        nombre_completo=parameters.get("nombre_completo"),
                        identificacion=identificacion,
                        tipo_identificacion=parameters.get("tipo_identificacion", "CC"),
                        alias=parameters.get("nombre_negocio", ""),
                        movil=parameters.get("celular", ""),
                        medio_pago_defecto=parameters.get("metodo_pago", "EFECTIVO"),
                        direccion=parameters.get("direccion", ""),
                        departamento=parameters.get("departamento", ""),
                        ciudad=parameters.get("ciudad", ""),
                        vendedor_asignado=vendedor_fmt,
                        zona_barrio=ruta_fmt,
                        tipo_lista_precio=lista_fmt,
                        dia_entrega=dia_entrega_fmt
                    )
                    mensaje_exito = "✅ Cliente creado exitosamente."

                # 🆕 SINCRONIZACIÓN CON MÓDULO DE RUTAS (ClienteRuta)
                if cliente.zona_barrio:
                    try:
                        from api.models import Ruta, ClienteRuta
                        
                        # Buscar la ruta por nombre exacto
                        ruta_obj = Ruta.objects.filter(nombre__iexact=cliente.zona_barrio, activo=True).first()
                        
                        if ruta_obj:
                            # Calcular siguiente orden
                            ultimo = ClienteRuta.objects.filter(ruta=ruta_obj).order_by('-orden').first()
                            nuevo_orden = (ultimo.orden + 1) if ultimo else 1
                            
                            ClienteRuta.objects.create(
                                ruta=ruta_obj,
                                nombre_negocio=cliente.alias or cliente.nombre_completo,
                                nombre_contacto=cliente.nombre_completo,
                                direccion=cliente.direccion,
                                telefono=cliente.movil,
                                dia_visita=cliente.dia_entrega or "PENDIENTE",
                                tipo_negocio="Comercio | PEDIDOS", # Default para nuevos
                                orden=nuevo_orden,
                                activo=True
                            )
                    except Exception as e:
                        print(f"⚠️ Error sincronizando ClienteRuta: {e}")
                
                detalles = f"""
- Nombre: {cliente.nombre_completo}
- ID: {cliente.identificacion}
- Negocio: {cliente.alias or 'N/A'}
- Vendedor: {cliente.vendedor_asignado or 'Sin asignar'}
- Ruta: {cliente.zona_barrio or 'Sin ruta'}
- Días: {cliente.dia_entrega or 'No especificado'}
"""
                return {
                    "success": True,
                    "message": f"✅ Cliente creado exitosamente:{detalles}",
                    "data": {
                        "identificacion": cliente.identificacion,
                        "nombre": cliente.nombre_completo,
                        "id": cliente.id
                    }
                }
                
            elif tool_name == "actualizar_cliente":
                busqueda = parameters.get("busqueda", "")
                identificacion = parameters.get("identificacion", "") 
                
                from api.models import Ruta, ClienteRuta

                cliente = None
                cliente_ruta_obj = None # Variable para almacenar si encontramos un ClienteRuta
                
                # ---------------------------------------------------------
                # ESTRATEGIA DE BÚSQUEDA HÍBRIDA (Cliente Y ClienteRuta)
                # ---------------------------------------------------------
                
                # 1. Intentar buscar en CLIENTES GENERALES (Facturación)
                if busqueda.replace('.', '').isdigit() and len(busqueda) > 4:
                     cliente = Cliente.objects.filter(identificacion=busqueda).first()
                
                if not cliente:
                    cliente = Cliente.objects.filter(alias__iexact=busqueda).first()
                    if not cliente:
                        cliente = Cliente.objects.filter(nombre_completo__iexact=busqueda).first()
                    if not cliente:
                         cands = Cliente.objects.filter(alias__icontains=busqueda)
                         if cands.count() == 1: cliente = cands.first()

                # 2. Si no está en generales, buscar en RUTAS (Visitas)
                if not cliente:
                    # Buscar por nombre de negocio en ClienteRuta
                    cliente_ruta_obj = ClienteRuta.objects.filter(nombre_negocio__iexact=busqueda, activo=True).first()
                    if not cliente_ruta_obj:
                         cands_ruta = ClienteRuta.objects.filter(nombre_negocio__icontains=busqueda, activo=True)
                         if cands_ruta.count() == 1: cliente_ruta_obj = cands_ruta.first()
                
                if not cliente and not cliente_ruta_obj:
                    return {"success": False, "message": f"No encontré '{busqueda}' ni en Clientes ni en Rutas."}

                updates = []

                # ---------------------------------------------------------
                # CASO A: Actualizar CLIENTE GENERAL
                # ---------------------------------------------------------
                if cliente:
                     fields_map = {
                        "identificacion": "identificacion",
                        "nombre_completo": "nombre_completo",
                        "nombre_negocio": "alias",
                        "celular": "movil",
                        "direccion": "direccion",
                        "zona_ruta": "zona_barrio",
                        "dias_entrega": "dia_entrega"
                     }
                     route_changed = False
                     for param, field in fields_map.items():
                        if param in parameters and parameters[param]:
                            val = parameters[param]
                            if param=="dias_entrega": val=val.upper()
                            setattr(cliente, field, val)
                            updates.append(f"[Cliente] {param}: {val}")
                            if param in ["zona_ruta","dias_entrega","nombre_negocio","celular","direccion"]: route_changed = True
                     
                     if not updates: return {"success": False, "message": "Sin cambios."}
                     cliente.save()
                     
                     # Sincronizar hacia ruta (código existente simplificado)
                     if route_changed:
                         try:
                             if cliente.zona_barrio:
                                r = Ruta.objects.filter(nombre__iexact=cliente.zona_barrio).first()
                                if r:
                                    cr = ClienteRuta.objects.filter(ruta=r, nombre_negocio=cliente.alias).first()
                                    if not cr: cr = ClienteRuta.objects.filter(ruta=r, telefono=cliente.movil).first()
                                    
                                    if cr: 
                                        if parameters.get('celular'): cr.telefono = parameters['celular']
                                        if parameters.get('direccion'): cr.direccion = parameters['direccion']
                                        if parameters.get('dias_entrega'): cr.dia_visita = parameters['dias_entrega'].upper()
                                        
                                        # Etiquetado seguro
                                        curr = cr.tipo_negocio or "Comercio"
                                        if "PEDIDOS" not in curr:
                                            cr.tipo_negocio = f"{curr.split(' | ')[0]} | PEDIDOS"
                                        
                                        cr.save()
                                        updates.append("(Sync Ruta OK)")
                         except: pass

                     return {"success": True, "message": f"Cliente General Actualizado:\n" + "\n".join(updates)}

                # ---------------------------------------------------------
                # CASO B: Actualizar SOLO CLIENTE DE RUTA
                # ---------------------------------------------------------
                elif cliente_ruta_obj:
                     # Mapeo específico para ClienteRuta
                     # Parametros -> Campos ClienteRuta
                     # nombre_negocio -> nombre_negocio
                     # nombre_completo -> nombre_contacto
                     # celular -> telefono
                     # direccion -> direccion
                     # dias_entrega -> dia_visita
                     
                     if parameters.get("nombre_negocio"):
                         cliente_ruta_obj.nombre_negocio = parameters["nombre_negocio"]
                         updates.append(f"Negocio: {parameters['nombre_negocio']}")

                     if parameters.get("nombre_completo"):
                         cliente_ruta_obj.nombre_contacto = parameters["nombre_completo"]
                         updates.append(f"Contacto: {parameters['nombre_completo']}")

                     if parameters.get("celular"):
                         cliente_ruta_obj.telefono = parameters["celular"]
                         updates.append(f"Teléfono: {parameters['celular']}")

                     if parameters.get("direccion"):
                         cliente_ruta_obj.direccion = parameters["direccion"]
                         updates.append(f"Dirección: {parameters['direccion']}")
                         
                     if parameters.get("dias_entrega"):
                         val = parameters["dias_entrega"].upper()
                         cliente_ruta_obj.dia_visita = val
                         updates.append(f"Días: {val}")

                     if not updates:
                         return {"success": False, "message": f"Encontré en Rutas a {cliente_ruta_obj.nombre_negocio}, pero no indicaste cambios."}
                     
                     cliente_ruta_obj.save()
                     return {"success": True, "message": f"Cliente de RUTA actualizado:\n" + "\n".join(updates)}


            elif tool_name == "consultar_ventas":
                # LÓGICA ROBUSTA DE VENTAS (Ported from AIAssistant)
                try:
                    fecha_inicio_str = parameters.get("fecha_inicio")
                    fecha_fin_str = parameters.get("fecha_fin")
                    
                    # Función para hacer fechas conscientes
                    def make_aware_safe(dt):
                        if timezone.is_naive(dt):
                            return timezone.make_aware(dt)
                        return dt

                    now = timezone.now()
                    
                    # Si no vienen fechas en parámetros, intentar deducir o usar default
                    if not fecha_inicio_str:
                         # Default: Mes actual
                         start_date = now.replace(day=1, hour=0, minute=0, second=0)
                         end_date = now
                    else:
                        try:
                            start_date = datetime.strptime(fecha_inicio_str, "%Y-%m-%d")
                            # Asegurar aware
                            start_date = make_aware_safe(start_date)
                            
                            if fecha_fin_str:
                                end_date = datetime.strptime(fecha_fin_str, "%Y-%m-%d")
                                end_date = end_date.replace(hour=23, minute=59, second=59)
                                end_date = make_aware_safe(end_date)
                            else:
                                end_date = start_date.replace(hour=23, minute=59, second=59)
                        except ValueError:
                             return {"success": False, "message": "Formato de fecha inválido. Usa YYYY-MM-DD."}

                    
                    # ===== NUEVA LÓGICA DE REPORTE UNIFICADO (POS + PEDIDOS + RUTA) =====
                    
                    # 1. Definir Modelos de Ruta
                    cargue_models = {
                        "ID1": "CargueID1", "ID2": "CargueID2", "ID3": "CargueID3",
                        "ID4": "CargueID4", "ID5": "CargueID5", "ID6": "CargueID6",
                    }
                    import api.models
                    
                    total_pos = 0
                    count_pos = 0
                    total_pedidos = 0
                    count_pedidos = 0
                    total_ruta = 0
                    
                    # Filtro Vendedor
                    vendedor_filtro = parameters.get("vendedor")
                    
                    
                    # 2. Consultar POS (Venta)
                    # REGLA DE NEGOCIO: Los IDs (Ruta) NO venden en POS. Si es ID, saltar POS para evitar datos basura.
                    es_vendedor_ruta = False
                    if vendedor_filtro and (vendedor_filtro.upper().startswith("ID") and len(vendedor_filtro) <= 4):
                        es_vendedor_ruta = True
                        
                    if not es_vendedor_ruta:
                        q_pos = Venta.objects.filter(fecha__range=[start_date, end_date], estado='PAGADO')
                        if vendedor_filtro: 
                            q_pos = q_pos.filter(vendedor__icontains=vendedor_filtro)
                                
                        agg_pos = q_pos.aggregate(t=Sum('total'), c=Count('id'))
                        total_pos = float(agg_pos['t'] or 0)
                        count_pos = agg_pos['c'] or 0
                    else:
                        print(f"⚡ Omitiendo consulta POS para vendedor de ruta: {vendedor_filtro}")
                        total_pos = 0
                        count_pos = 0
                    
                    # 3. Consultar PEDIDOS
                    q_ped = Pedido.objects.filter(fecha__range=[start_date, end_date])
                    if vendedor_filtro: 
                        # Para IDs de ruta, buscar también en campo asignado_a_id
                        if vendedor_filtro.upper().startswith("ID") and len(vendedor_filtro) <= 4:
                            # Buscar por asignado_a_id O por vendedor (por si acaso)
                            from django.db.models import Q
                            q_ped = q_ped.filter(Q(asignado_a_id__iexact=vendedor_filtro) | Q(vendedor__iexact=vendedor_filtro))
                        else:
                            q_ped = q_ped.filter(vendedor__icontains=vendedor_filtro)
                            
                    agg_ped = q_ped.aggregate(t=Sum('total'), c=Count('id'))
                    total_pedidos = float(agg_ped['t'] or 0)
                    count_pedidos = agg_ped['c'] or 0
                    
                    # 4. Consultar RUTAS (CargueIDx)
                    # Heurística: Si vendedor es "ID1", consultar solo CargueID1. Si es "Wilson", consultar todas y filtrar por responsable.
                    modelos_a_consultar = []
                    
                    if vendedor_filtro:
                        v_upper = vendedor_filtro.upper().replace(" ", "")
                        # Si es ID explícito
                        if v_upper in cargue_models:
                            modelos_a_consultar.append(cargue_models[v_upper])
                        else:
                            # Si es nombre, consultar todas
                            modelos_a_consultar = list(cargue_models.values())
                    else:
                        # Si no hay filtro, consultar todas
                        modelos_a_consultar = list(cargue_models.values())
                        
                        # Si no hay filtro, consultar todas
                        modelos_a_consultar = list(cargue_models.values())
                    
                    target_model = cargue_models.get(vendedor_filtro.upper()) if vendedor_filtro else None

                    for m_name in modelos_a_consultar:
                        try:
                            ModelClass = getattr(api.models, m_name)
                            q_ruta = ModelClass.objects.filter(fecha__range=[start_date, end_date])
                            
                            # LOGICA CORREGIDA:
                            # Solo filtrar por 'responsable' si estamos buscando por NOMBRE en todas las tablas.
                            # Si seleccionamos la tabla específica por ID (ej: CargueID1), NO FILTRAR responsable (asumimos que la tabla es del dueño).
                            
                            should_filter_responsable = True
                            if target_model and m_name == target_model:
                                should_filter_responsable = False
                                
                            if vendedor_filtro and should_filter_responsable: 
                                q_ruta = q_ruta.filter(responsable__icontains=vendedor_filtro)
                                
                            # Sumar campo 'neto' (que parece ser la venta monetaria real)
                            agg_ruta = q_ruta.aggregate(t=Sum('neto'))
                            if agg_ruta['t']:
                                total_ruta += float(agg_ruta['t'])
                                
                        except Exception as e:
                            print(f"Error consultando ruta {m_name}: {e}")

                    grand_total = total_pos + total_pedidos + total_ruta
                    grand_count = count_pos + count_pedidos
                    
                    msg_vend = f" (Vendedor: {vendedor_filtro})" if vendedor_filtro else ""
                    
                    res_msg = f"💰 REPORTE DE VENTAS COMPLETO{msg_vend}\n"
                    res_msg += f"📅 {start_date.strftime('%Y-%m-%d')} al {end_date.strftime('%Y-%m-%d')}:\n"
                    res_msg += f"--------------------------------\n"
                    
                    # Solo mostrar POS si tiene valor (para no ensuciar reporte de vendedores de ruta)
                    if total_pos > 0:
                        res_msg += f"🛒 Tienda (POS):    ${total_pos:,.0f}\n"
                        
                    res_msg += f"📦 Pedidos (Clientes): ${total_pedidos:,.0f}\n"
                    res_msg += f"🚚 Ruta/Cargue:     ${total_ruta:,.0f}\n"
                    res_msg += f"--------------------------------\n"
                    res_msg += f"🏆 TOTAL:           ${grand_total:,.0f}"

                    return {
                        "success": True,
                        "message": res_msg,
                        "data": {
                            "total": grand_total,
                            "pos": total_pos,
                            "pedidos": total_pedidos,
                            "ruta": total_ruta
                        }
                    }
                except Exception as e:
                     return {
                        "success": False, 
                        "message": f"🐛 Error técnico consultando ventas: {str(e)}"
                     }
            
            elif tool_name == "buscar_pedidos_cliente":
                # Nueva herramienta para buscar pedidos específicos
                nombre_cliente = parameters.get("nombre_cliente", "")
                fecha_str = parameters.get("fecha")
                
                try:
                    # Configurar fecha de búsqueda
                    if fecha_str:
                         dt = datetime.strptime(fecha_str, "%Y-%m-%d")
                         # Rango de todo ese día
                         start = timezone.make_aware(dt.replace(hour=0,minute=0))
                         end = timezone.make_aware(dt.replace(hour=23,minute=59))
                    else:
                         # Si no da fecha, buscar en los últimos 90 días (3 meses) por defecto
                         end = timezone.now()
                         start = end - timedelta(days=90)
                    
                    # 1. Búsqueda principal
                    pedidos = Pedido.objects.filter(
                        (Q(destinatario__icontains=nombre_cliente) | Q(numero_pedido__icontains=nombre_cliente)),
                        fecha__range=[start, end]
                    ).order_by('-fecha')[:5]
                    
                    # 2. Retry inteligente (si no encuentra y tiene espacios, probar unido)
                    if not pedidos.exists() and " " in nombre_cliente:
                        nombre_sin_espacios = nombre_cliente.replace(" ", "")
                        pedidos = Pedido.objects.filter(
                            (Q(destinatario__icontains=nombre_sin_espacios) | Q(numero_pedido__icontains=nombre_sin_espacios)),
                            fecha__range=[start, end]
                        ).order_by('-fecha')[:5]

                    if not pedidos.exists():
                        # Intentar buscar en Venta (POS) por si fue venta mostrador con nombre
                        ventas_pos = Venta.objects.filter(
                            cliente__icontains=nombre_cliente,
                             fecha__range=[start, end]
                        ).order_by('-fecha')[:5]
                        
                        if ventas_pos.exists():
                            res = f"Encontré {len(ventas_pos)} ventas en POS para '{nombre_cliente}':\n"
                            for v in ventas_pos:
                                res += f"- {v.fecha.strftime('%d/%m %H:%M')}: ${v.total:,.0f} ({v.estado})\n"
                            return {"success": True, "message": res}
                            
                        return {"success": True, "message": f"❌ No encontré pedidos para '{nombre_cliente}' entre {start.strftime('%Y-%m-%d')} y {end.strftime('%Y-%m-%d')}"}
                    
                    # Formatear resultados Pedidos con DETALLES
                    res = f"✅ Encontré {len(pedidos)} pedidos para '{nombre_cliente}':\n"
                    for p in pedidos:
                        res += f"📦 Pedido #{p.numero_pedido} ({p.fecha.strftime('%d/%m %H:%M')}) - ${p.total:,.0f}\n"
                        res += f"   Estado: {p.estado}\n"
                        # Intentar obtener detalles (productos)
                        try:
                            detalles = p.detalles.all() # Asumiendo related_name='detalles' o DetallePedido
                            if detalles:
                                res += "   🛒 Productos:\n"
                                for d in detalles:
                                    # Ajustar nombre campo producto según modelo
                                    nom_prod = d.producto.nombre if hasattr(d, 'producto') else "Producto"
                                    cant = d.cantidad if hasattr(d, 'cantidad') else 1
                                    res += f"      - {cant}x {nom_prod}\n"
                        except:
                            pass
                        
                        if p.direccion_entrega:
                            res += f"   📍 {p.direccion_entrega}\n"
                        res += "\n"

                    return {"success": True, "message": res}
                    
                except Exception as e:
                    return {"success": False, "message": f"Error buscando pedido: {str(e)}"}
                
            elif tool_name == "obtener_inventario":
                productos = Stock.objects.select_related('producto').all()[:20]
                inventario = []
                for stock in productos:
                    inventario.append({
                        "id": stock.producto.id,
                        "nombre": stock.producto.nombre,
                        "cantidad": stock.cantidad_actual,
                        "precio": float(stock.producto.precio)
                    })
                
                return {
                    "success": True,
                    "message": f"Inventario ({len(inventario)} productos)",
                    "data": inventario
                }
                
            elif tool_name == "buscar_producto":
                nombre = parameters.get("nombre", "")
                productos = Producto.objects.filter(nombre__icontains=nombre)[:5]
                
                resultados = []
                for p in productos:
                    try:
                        stock = Stock.objects.get(producto=p)
                        cantidad = stock.cantidad_actual
                    except:
                        cantidad = 0
                        
                    resultados.append({
                        "id": p.id,
                        "nombre": p.nombre,
                        "precio": float(p.precio),
                        "stock": cantidad
                    })
                
                return {
                    "success": True,
                    "message": f"Encontrados {len(resultados)} productos",
                    "data": resultados
                }
                
            elif tool_name == "generar_reporte_ventas":
                fecha = parameters.get("fecha", timezone.now().strftime("%Y-%m-%d"))
                
                ventas = Venta.objects.filter(fecha=fecha).aggregate(
                    total=Sum('total'),
                    cantidad=Count('codigo')
                )
                
                return {
                    "success": True,
                    "message": f"Reporte de ventas {fecha}",
                    "data": {
                        "fecha": fecha,
                        "total_ventas": float(ventas['total'] or 0),
                        "cantidad_transacciones": ventas['cantidad']
                    }
                }
                
            elif tool_name == "registrar_vencida":
                # Aquí irá la lógica para registrar vencidas
                return {
                    "success": True,
                    "message": "Vencida registrada (implementación pendiente)",
                    "data": parameters
                }
                
            else:
                return {
                    "success": False,
                    "message": f"Herramienta '{tool_name}' no encontrada"
                }
                
        except Exception as e:
            return {
                "success": False,
                "message": f"Error ejecutando {tool_name}: {str(e)}"
            }
    
    def process_command(self, command: str, session_id=None) -> Dict:
        """
        Procesa un comando en lenguaje natural y ejecuta las acciones necesarias.
        Soporta sesiones conversacionales multi-turno.
        """
        from api.services.session_manager import SessionManager
        from api.services.conversational_flows import get_or_create_flow, clear_flow
        
        session_mgr = SessionManager(session_id)
        current_session_id = session_mgr.get_session_id()
        
        # ============================================================
        # 🤖 FLUJO RPA: Crear Cliente
        # ============================================================
        cmd_lower = command.lower().strip()
        
        # Usar un ID fijo para el usuario (en producción, usar auth.user.id)
        user_id = "default_user"  # TODO: Obtener del sistema de auth
        
        # Detectar si hay un flujo activo
        flow = get_or_create_flow(user_id, "cliente")
        
        # Si hay un flujo activo
        if flow.active:
            result = flow.process_answer(command)
            
            if result["status"] == "completed":
                # Ejecutar creación de cliente
                tool_result = self.execute_tool("crear_cliente", result["data"])
                clear_flow(user_id, "cliente")
                # Resetear flujo para asegurar limpieza
                flow.reset()
                
                return {
                    "ai_response": tool_result.get("message", "Cliente creado"),
                    "action_taken": True,
                    "tool_used": "crear_cliente",
                    "tool_result": tool_result,
                    "session_id": current_session_id
                }
            elif result["status"] == "cancelled":
                clear_flow(user_id, "cliente")
                flow.reset()
                return {
                    "ai_response": result["message"],
                    "action_taken": False,
                    "session_id": current_session_id
                }
            else:
                # Continuar flujo
                progress = flow.get_progress()
                message = f"{result['message']}\n\n_Paso {progress['step']} de {progress['total']}_"
                return {
                    "ai_response": message,
                    "action_taken": False,
                    "session_id": current_session_id
                }
        
        # Detectar inicio de flujo de crear cliente
        crear_keywords = ["crea un cliente", "crear cliente", "registra cliente", "agregar cliente", "nuevo cliente"]
        if any(kw in cmd_lower for kw in crear_keywords):
            # Iniciar flujo
            flow.start()
            first_question = flow.get_next_question()
            progress = flow.get_progress()
            
            return {
                "ai_response": f"🆕 **Modo: Crear Cliente**\n\n{first_question}\n\n_Paso {progress['step']} de {progress['total']}_",
                "action_taken": False,
                "session_id": current_session_id
            }
        
        # ============================================================
        # Continuar con procesamiento normal (sesiones y bypasses)
        # ============================================================
        
        # 1. Verificar si hay sesión activa (continuación de conversación)
        if session_mgr.is_active():
            # Obtener definición de la herramienta actual
            tool_name = session_mgr.session.tool_name
            tool_def = next((t for t in self.tools if t["name"] == tool_name), None)
            
            if tool_def:
                # Obtener el parámetro que se estaba pidiendo
                current_param = session_mgr.session.get_next_param()
                
                # Procesar respuesta del usuario
                session_mgr.add_response(command, current_param, tool_def)
                
                # Verificar si ya completamos todos los parámetros
                if session_mgr.session.is_complete():
                    # Ejecutar herramienta
                    result = self.execute_tool(
                        tool_name,
                        session_mgr.session.collected_params
                    )
                    
                    # Reiniciar sesión
                    session_mgr.session.reset()
                    
                    return {
                        "ai_response": result["message"],
                        "action_taken": True,
                        "tool_used": tool_name,
                        "tool_result": result,
                        "session_id": current_session_id
                    }
                else:
                    # Siguiente pregunta
                    next_q = session_mgr.get_next_question(tool_def)
                    return {
                        "ai_response": next_q,
                        "action_taken": False,
                        "session_id": current_session_id
                    }
        
        # 2. Si no hay sesión activa, procesar como comando nuevo
        
        # -----------------------------------------------------------
        # 🛡️ BYPASS MANUAL PARA VENTAS (Para corregir alucinaciones de fechas)
        # -----------------------------------------------------------
        import re
        cmd_lower = command.lower()
        
        # Palabras clave que indican intención de ver ventas (incluyendo variantes con acentos)
        keywords_ventas = ["ventas", "vendio", "vendió", "vendi", "vendí", "vendido", "ingresos", "facturado", "facturó", "pedidos", "pedido", "entrego", "entregó", "entregas", "entregados"]
        keywords_accion = ["reporte", "dime", "cuanto", "cuánto", "cuando", "cuándo", "muestrame", "muéstrame", "ver", "dame", "damel", "total", "generales", "informe", "cuantos", "cuántos"]
        
        is_ventas_intent = any(k in cmd_lower for k in keywords_ventas)
        is_accion_intent = any(k in cmd_lower for k in keywords_accion)
        
        # Si menciona ventas y alguna acción (o simplemente "ventas de enero"), activar bypass
        if is_ventas_intent and (is_accion_intent or " de " in cmd_lower):
            print("⚡ BYPASS: Detectada solicitud de ventas. Forzando herramienta...")
            
            # Intentar extraer año y mes básico
            year = datetime.now().year
            month = datetime.now().month
            
            # Buscar año
            year_match = re.search(r'202[3-9]', cmd_lower)
            if year_match:
                year = int(year_match.group())
            
            # Buscar mes(es)
            months_found = []
            months_map = {
                'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
                'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
            }
            
            # Buscar en orden de aparición
            words = cmd_lower.replace(',', '').split()
            for w in words:
                if w in months_map:
                    months_found.append(months_map[w])

            # RANGO DE FECHAS
            if "año" in cmd_lower or "anual" in cmd_lower:
                 # Si piden año completo (ej: "año 2025") y no especifican meses, usar todo el año
                 if not months_found:
                    start_month = 1
                    end_month = 12
                 elif len(months_found) >= 2:
                    start_month = months_found[0]
                    end_month = months_found[-1]
                 else:
                    start_month = months_found[0]
                    end_month = months_found[0]
            else:
                # Lógica normal de meses
                if len(months_found) >= 2:
                    start_month = months_found[0]
                    end_month = months_found[-1]
                elif len(months_found) == 1:
                    start_month = months_found[0]
                    end_month = months_found[0]
                else:
                    # Si no dicen mes, usar mes actual o anterior
                    from django.utils import timezone
                    now = timezone.now()
                    start_month = now.month
                    end_month = now.month
            
            # Construir fechas
            import calendar
            try:
                last_day = calendar.monthrange(year, end_month)[1]
                fecha_inicio = f"{year}-{start_month:02d}-01"
                fecha_fin = f"{year}-{end_month:02d}-{last_day}"
            except:
                # Fallback por si acaso
                fecha_inicio = f"{year}-01-01"
                fecha_fin = f"{year}-12-31"
            
            # Detectar filtro VENDEDOR en el bypass
            # Detectar filtro VENDEDOR en el bypass (Mejorado con Regex)
            vendedor_filtro = None
            
            # Buscar patrones de ID (Regex simplificado y agresivo)
            id_match = re.search(r'(id)\s*(\d+)', cmd_lower)
            if id_match:
                # Normalizar a "ID1", "ID2", etc.
                vendedor_filtro = f"ID{id_match.group(2)}"
            
            # --- RESPALDO MANUAL (Por si el regex falla) ---
            if not vendedor_filtro:
                if "id1" in cmd_lower or "id 1" in cmd_lower: vendedor_filtro = "ID1"
                if "id2" in cmd_lower or "id 2" in cmd_lower: vendedor_filtro = "ID2"
                if "id3" in cmd_lower or "id 3" in cmd_lower: vendedor_filtro = "ID3"
                if "id4" in cmd_lower or "id 4" in cmd_lower: vendedor_filtro = "ID4"
                if "id5" in cmd_lower or "id 5" in cmd_lower: vendedor_filtro = "ID5"
                if "id6" in cmd_lower or "id 6" in cmd_lower: vendedor_filtro = "ID6"
            
            # Si no encontró ID, buscar nombres comunes
            if not vendedor_filtro and ("wilson" in cmd_lower):
                vendedor_filtro = "ID1" 
            
            print(f"DEBUG BYPASS: cmd='{cmd_lower}' -> Vend detectado: {vendedor_filtro}")

            # Simular respuesta JSON de la IA
            action = {
                "tool": "consultar_ventas",
                "parameters": {
                    "fecha_inicio": fecha_inicio,
                    "fecha_fin": fecha_fin
                }
            }
            # Agregar vendedor si se detectó
            if vendedor_filtro:
                action["parameters"]["vendedor"] = vendedor_filtro
            
            tool_name = action["tool"]
            print(f"⚡ Ejecutando Bypass: {tool_name} con {action['parameters']}")
            
            # Saltar directo a ejecución
            parameters = action["parameters"]
            tool_result = self.execute_tool(tool_name, parameters)
            
            return {
                "ai_response": f"Generando reporte forzado para {fecha_inicio} al {fecha_fin}",
                "action_taken": True,
                "tool_used": tool_name,
                "tool_result": tool_result,
                "session_id": current_session_id
            }

        # -----------------------------------------------------------
        # 🛡️ BYPASS MANUAL PARA PEDIDOS (Detector de Cliente)
        # -----------------------------------------------------------
        elif "pedido" in cmd_lower or "pedidos" in cmd_lower or "pidió" in cmd_lower or "compró" in cmd_lower:
            print("⚡ BYPASS: Detectada consulta de PEDIDOS. Extrayendo cliente...")
            
            # Palabras a eliminar para aislar el nombre
            stopwords = ["dime", "los", "pedidos", "pedido", "de", "del", "cliente", "que", "hizo", "realizados", "por", "para", "el", "ver", "ayudame", "con", "lista", "quiero", "necesito", "buscame", "búscame", "muestrame", "muéstrame", "mis"]
            
            clean_cmd = cmd_lower
            for word in stopwords:
                # Reemplazar palabra completa
                clean_cmd = re.sub(r'\b' + word + r'\b', '', clean_cmd)
            
            # Limpiar espacios extra y obtener nombre candidato
            posible_cliente = re.sub(r'\s+', ' ', clean_cmd).strip()
            
            # Solo proceder si quedó algo que parezca un nombre
            if len(posible_cliente) > 2:
                print(f"   Cliente detectado: '{posible_cliente}'")
                
                # Simular acción
                action = {
                    "tool": "buscar_pedidos_cliente",
                    "parameters": {
                        "nombre_cliente": posible_cliente
                        # La fecha opcional ya la maneja la herramienta con default 90 días
                    }
                }
                
                tool_result = self.execute_tool("buscar_pedidos_cliente", action["parameters"])
                
                return {
                    "ai_response": f"Buscando pedidos para '{posible_cliente}'...",
                    "action_taken": True,
                    "tool_used": "buscar_pedidos_cliente",
                    "tool_result": tool_result,
                    "session_id": current_session_id
                }
        # -----------------------------------------------------------

        # Preparar prompt para el modelo
        tools_description = "\n".join([
            f"- {tool['name']}: {tool['description']}"
            for tool in self.tools
        ])
        
        # Calcular fechas para el contexto
        from django.utils import timezone
        from datetime import timedelta
        
        today_str = timezone.now().strftime('%Y-%m-%d')
        yesterday_str = (timezone.now() - timedelta(days=1)).strftime('%Y-%m-%d')

        system_prompt = f"""Eres un asistente CRM experto conectado a una base de datos. Tu trabajo es ENTENDER la intención del usuario y mapearla a una herramienta JSON.

INFORMACIÓN DE CONTEXTO:
- Fecha actual: {today_str}
- Modelos disponibles: Clientes, Ventas, Pedidos, Productos.

HERRAMIENTAS DISPONIBLES:
{tools_description}

EJEMPLOS DE APRENDIZAJE (ÚSALOS COMO GUÍA):

1. Usuario: "Crea un cliente llamado Juan Perez con celular 3001234567"
   JSON: {{"tool": "crear_cliente", "parameters": {{"nombre_completo": "Juan Perez", "celular": "3001234567"}}}}

2. Usuario: "Busca si hay pedidos de Pollo Feliz"
   JSON: {{"tool": "buscar_pedidos_cliente", "parameters": {{"nombre_cliente": "Pollo Feliz"}}}}
   (Nota: Extrae SOLO el nombre del negocio, ignora 'busca', 'pedidos', 'de')

3. Usuario: "Quiero ver los pedidos de La Tienda de Pedro"
   JSON: {{"tool": "buscar_pedidos_cliente", "parameters": {{"nombre_cliente": "La Tienda de Pedro"}}}}

4. Usuario: "Reporte de ventas de enero a marzo 2025"
   JSON: {{"tool": "consultar_ventas", "parameters": {{"fecha_inicio": "2025-01-01", "fecha_fin": "2025-03-31"}}}}

5. Usuario: "Ventas de ayer"
   JSON: {{"tool": "consultar_ventas", "parameters": {{"fecha_inicio": "{yesterday_str}", "fecha_fin": "{yesterday_str}"}}}}

REGLAS DE ORO:
- Si el usuario dice 'pedidos de [Nombre]', asume que 'buscar_pedidos_cliente' es la herramienta.
- NO inventes parametros que no existen.
- Responde SOLO con el JSON válido.
- Si faltan datos obligatorios, llena solo los que tengas.

Usuario: {command}
JSON:"""
        
        # Llamar a Ollama
        payload = {
            "model": self.model,
            "prompt": system_prompt,
            "stream": False,
            "keep_alive": "60m",
            "options": {
                "temperature": 0.0,
                "num_predict": 100,
                "num_ctx": 2048,
                "stop": ["\n\n"]
            }
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/generate",
                json=payload,
                timeout=120
            )
            response.raise_for_status()
            
            result = response.json()
            ai_response = result.get("response", "").strip()
            
            # Intentar parsear como JSON
            try:
                # Extraer JSON de la respuesta (puede venir con texto adicional)
                import re
                json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
                if json_match:
                    action = json.loads(json_match.group())
                else:
                    action = json.loads(ai_response)
                    
                # Si hay una herramienta que ejecutar
                if action.get("tool"):
                    tool_name = action["tool"]
                    parameters = action.get("parameters", {})
                    
                    # Verificar si faltan parámetros requeridos
                    tool_def = next((t for t in self.tools if t["name"] == tool_name), None)
                    if tool_def:
                        # Identificar parámetros faltantes (de los REQUIRED)
                        target_params = tool_def.get("parameters", {}).get("properties", {}).keys()
                        required_params = tool_def.get("parameters", {}).get("required", [])
                        
                        # Iniciar sesión de recolección
                        # Ordenamos los parámetros para preguntar en orden lógico
                        ordered_params = [
                            "nombre_completo", "identificacion", "tipo_identificacion", 
                            "nombre_negocio", "celular", "direccion", "ciudad", 
                            "departamento", "metodo_pago", "vendedor", "zona_ruta", 
                            "lista_precios", "dias_entrega"
                        ]
                        
                        # Filtrar solo los que son REQUIRED y no están presentes
                        params_to_ask = []
                        
                        # 1. Agregar required ordenados
                        for p in ordered_params:
                            if p in required_params and p not in parameters:
                                params_to_ask.append(p)
                                
                        # 2. Agregar otros required no ordenados
                        for p in required_params:
                            if p not in ordered_params and p not in parameters:
                                params_to_ask.append(p)
                        
                        # (Opcional: Si queremos preguntar por no requeridos, irían aquí, pero mejor NO para agilidad)
                        
                        if params_to_ask:
                            # Iniciar sesión
                            session_mgr.start_collection(tool_name, params_to_ask)
                            
                            # Precargar los parámetros ya dados
                            session_mgr.session.collected_params = parameters
                            
                            # Preguntar el primero que falta
                            first_q = session_mgr.get_next_question(tool_def)
                            
                            if first_q:
                                return {
                                    "ai_response": f"Entendido, vamos a {tool_name.replace('_', ' ')}. {first_q}",
                                    "action_taken": False,
                                    "session_id": current_session_id
                                }
                            else:
                                # Si no hay preguntas (por optimización), ejecutar directo
                                pass

                    
                    # Si no faltan parámetros (o no es herramienta compleja), ejecutar directo
                    tool_result = self.execute_tool(tool_name, parameters)
                    
                    return {
                        "ai_response": ai_response,
                        "action_taken": True,
                        "tool_used": tool_name,
                        "tool_result": tool_result,
                        "session_id": current_session_id
                    }
                else:
                    # Solo respuesta de texto
                    return {
                        "ai_response": action.get("response", ai_response),
                        "action_taken": False,
                        "session_id": current_session_id
                    }
                    
            except json.JSONDecodeError:
                # Si no es JSON válido, devolver respuesta como texto
                return {
                    "ai_response": ai_response,
                    "action_taken": False,
                    "error": "La IA no generó un JSON válido",
                    "session_id": current_session_id
                }
                
        except requests.exceptions.Timeout:
            return {
                "error": "La IA tardó mucho en responder",
                "action_taken": False,
                "session_id": current_session_id
            }
        except Exception as e:
            return {
                "error": f"Error: {str(e)}",
                "action_taken": False,
                "session_id": current_session_id
            }
