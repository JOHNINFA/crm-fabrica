import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Table } from 'react-bootstrap';
import DateSelector from '../common/DateSelector';
// import { useProductos } from '../../context/ProductosContext'; // No necesario
import '../../styles/InventarioProduccion.css';
import '../../styles/InventarioPlaneacion.css';
import '../../styles/TablaKardex.css';
import '../../styles/BorderlessInputs.css';
import '../../styles/ActionButtons.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const InventarioPlaneacion = () => {
  // const { productos: productosContext } = useProductos(); // No necesario
  const [productos, setProductos] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [planeacion, setPlaneacion] = useState([]);
  const [solicitadasCargadas, setSolicitadasCargadas] = useState(false);
  const [snapshotGuardado, setSnapshotGuardado] = useState(false);
  const [diaCongelado, setDiaCongelado] = useState(false); // 🔒 Estado de congelación
  const [reporteGuardado, setReporteGuardado] = useState(false); // ✅ Estado para botón guardar reporte

  // 🚀 Cache para optimización
  const [cache, setCache] = useState({
    datos: null,
    timestamp: null,
    fecha: null
  });
  const CACHE_DURATION = 30000; // 30 segundos (aumentado para reducir llamadas)
  const [cargando, setCargando] = useState(false); // Para evitar salto visual
  const [ultimaActualizacion, setUltimaActualizacion] = useState(Date.now()); // Para forzar actualizaciones

  // 🔒 Verificar si el día está congelado (ALISTAMIENTO activado)
  useEffect(() => {
    const verificarCongelacion = () => {
      const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
      const diaSemana = diasSemana[fechaSeleccionada.getDay()];
      const fechaParaKey = fechaSeleccionada.toISOString().split('T')[0];
      const estadoBoton = localStorage.getItem(`estado_boton_${diaSemana}_${fechaParaKey}`);

      // 🔒 Día congelado si está en ALISTAMIENTO_ACTIVO, FINALIZAR (Despacho) o COMPLETADO
      // 🔓 DESBLOQUEO SOLICITADO: El usuario quiere editar siempre, sin importar el estado del cargue.
      // El control de "versión final" se hace mediante el botón "Guardar Reporte".
      const congelado = false; // estadoBoton === 'COMPLETADO'; // ⚠️ Lógica anterior desactivada
      setDiaCongelado(congelado);

      if (congelado) {
        console.log(`🔒 DÍA CONGELADO - Estado: ${estadoBoton} - No se permiten modificaciones`);
      } else {
        console.log(`✏️ DÍA EDITABLE - Estado: ${estadoBoton || 'No iniciado'}`);
      }
    };

    verificarCongelacion();

    // Verificar cada 5 segundos por si cambia el estado (optimizado)
    const interval = setInterval(verificarCongelacion, 5000);

    return () => clearInterval(interval);
  }, [fechaSeleccionada]);

  // 🗑️ Limpiar localStorage viejo al montar (más de 7 días)
  useEffect(() => {
    try {
      const ahora = Date.now();
      const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000;
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('planeacion_')) {
          try {
            const datos = JSON.parse(localStorage.getItem(key));
            if (datos.timestamp && (ahora - datos.timestamp) > SIETE_DIAS) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
    }
  }, []);



  // 🚀 Verificar si el cache es válido
  const cacheValido = (fecha) => {
    if (!cache.datos || !cache.timestamp || cache.fecha !== fecha) {
      return false;
    }
    const ahora = Date.now();
    const tiempoTranscurrido = ahora - cache.timestamp;
    return tiempoTranscurrido < CACHE_DURATION;
  };

  // Cargar existencias desde BD con optimización
  const cargarExistenciasReales = async (forzarRecarga = false) => {
    try {
      setCargando(true);
      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;

      // 🚀 Verificar cache
      if (!forzarRecarga && cacheValido(fechaFormateada)) {

        setProductos(cache.datos);
        setCargando(false);
        return;
      }




      // 🎯 Marcar como cargando solo si no hay productos
      if (productos.length === 0) {
        setCargando(true);
      }

      // 🎯 NO limpiar productos mientras carga - mantener datos anteriores
      // Esto evita el salto visual de "No hay productos disponibles"

      // 🔍 VERIFICAR SI EL DÍA ESTÁ COMPLETADO
      const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
      const diaSemana = diasSemana[fechaSeleccionada.getDay()];

      // 🔥 IMPORTANTE: Usar el mismo formato que BotonLimpiar (objeto Date convertido a string)
      const fechaParaKey = fechaSeleccionada.toISOString().split('T')[0]; // YYYY-MM-DD
      const estadoBoton = localStorage.getItem(`estado_boton_${diaSemana}_${fechaParaKey}`);
      const hoyKey = new Date().toISOString().split('T')[0];
      const esFechaPasada = fechaParaKey < hoyKey;
      // Para fechas pasadas, siempre consultar DB aunque esté marcado COMPLETADO
      const diaCompletado = estadoBoton === 'COMPLETADO' && !esFechaPasada;

      console.log(`🔍 Buscando estado en: estado_boton_${diaSemana}_${fechaParaKey}`);
      console.log(`🔍 Estado del día ${diaSemana} (${fechaFormateada}): ${estadoBoton || 'No iniciado'} | Fecha pasada: ${esFechaPasada}`);

      // 🚀 OPTIMIZACIÓN: Si el día está COMPLETADO (y es hoy), solo cargar planeación y stock
      let planeacionResponse, stockResponse, pedidosResponse;
      let cargueId1Response, cargueId2Response, cargueId3Response;
      let cargueId4Response, cargueId5Response, cargueId6Response;

      if (diaCompletado) {

        [planeacionResponse, stockResponse] = await Promise.all([
          fetch(`${API_URL}/planeacion/?fecha=${fechaFormateada}`),
          fetch(`${API_URL}/stock/`)
        ]);

        // Crear respuestas vacías para cargue y pedidos (no se necesitan)
        const emptyResponse = { ok: true, json: async () => [] };
        pedidosResponse = emptyResponse;
        cargueId1Response = cargueId2Response = cargueId3Response = emptyResponse;
        cargueId4Response = cargueId5Response = cargueId6Response = emptyResponse;
      } else {

        [planeacionResponse, stockResponse, pedidosResponse,
          cargueId1Response, cargueId2Response, cargueId3Response,
          cargueId4Response, cargueId5Response, cargueId6Response] = await Promise.all([
            fetch(`${API_URL}/planeacion/?fecha=${fechaFormateada}`),
            fetch(`${API_URL}/stock/`),
            fetch(`${API_URL}/pedidos/`),
            fetch(`${API_URL}/cargue-id1/?fecha=${fechaFormateada}`),
            fetch(`${API_URL}/cargue-id2/?fecha=${fechaFormateada}`),
            fetch(`${API_URL}/cargue-id3/?fecha=${fechaFormateada}`),
            fetch(`${API_URL}/cargue-id4/?fecha=${fechaFormateada}`),
            fetch(`${API_URL}/cargue-id5/?fecha=${fechaFormateada}`),
            fetch(`${API_URL}/cargue-id6/?fecha=${fechaFormateada}`)
          ]);
      }

      // 📸 Verificar si existe snapshot guardado y cargar ORDEN e IA
      let planeacionData = [];
      if (planeacionResponse.ok) {
        planeacionData = await planeacionResponse.json();
        const haySnapshot = planeacionData.length > 0;
        setSnapshotGuardado(haySnapshot);
        if (haySnapshot) {

        }
      } else {
        setSnapshotGuardado(false);
      }

      // 🎯 USAR api_stock COMO FUENTE PRINCIPAL
      if (!stockResponse.ok) throw new Error('Error al obtener stocks');
      const stocksBD = await stockResponse.json();


      // Crear mapa de stocks
      const stockMap = {};
      stocksBD.forEach(s => {
        stockMap[s.producto_id] = s.cantidad_actual;
      });

      // 🔥 SUMAR SOLICITADAS desde TODAS las tablas de CARGUE (ID1 a ID6)
      let solicitadasMap = {};

      const cargueResponses = [
        { response: cargueId1Response, id: 'ID1' },
        { response: cargueId2Response, id: 'ID2' },
        { response: cargueId3Response, id: 'ID3' },
        { response: cargueId4Response, id: 'ID4' },
        { response: cargueId5Response, id: 'ID5' },
        { response: cargueId6Response, id: 'ID6' }
      ];

      for (const { response, id } of cargueResponses) {
        if (response.ok) {
          const cargueData = await response.json();
          console.log(`✅ Cargue ${id}:`, cargueData.length, 'registros');

          // Sumar cantidades por producto con logs detallados
          cargueData.forEach(item => {
            const producto = item.producto || item.producto_nombre;
            const cantidad = item.total || item.cantidad || 0;  // ✅ Usar 'total' primero

            if (cantidad > 0) {
              console.log(`   🔍 ${id} - ${producto}: ${cantidad} und (Fecha: ${item.fecha}, Día: ${item.dia_semana})`);
            }

            if (!solicitadasMap[producto]) {
              solicitadasMap[producto] = 0;
            }
            solicitadasMap[producto] += cantidad;
          });
        }
      }



      // Log detallado de cada producto con solicitadas
      Object.entries(solicitadasMap).forEach(([producto, cantidad]) => {
        if (cantidad > 0) {
          console.log(`   📦 ${producto}: ${cantidad} und TOTAL`);
        }
      });

      // 🚀 Procesar pedidos dinámicamente desde api/pedidos
      const pedidosMap = {};

      if (pedidosResponse.ok) {

        const pedidos = await pedidosResponse.json();

        // Filtrar pedidos por fecha (comparar solo la parte de fecha, sin hora)
        const pedidosFecha = pedidos.filter(p => {
          if (p.estado === 'ANULADA') return false;

          // Normalizar fechas para comparación
          const fechaEntrega = p.fecha_entrega ? p.fecha_entrega.split('T')[0] : null;
          return fechaEntrega === fechaFormateada;
        });

        console.log(`✅ Pedidos activos para ${fechaFormateada}:`, pedidosFecha.length);

        // Sumar cantidades por producto
        for (const pedido of pedidosFecha) {
          console.log(`   📦 Pedido ${pedido.numero || pedido.id}:`, pedido.detalles?.length || 0, 'productos');

          if (pedido.detalles && pedido.detalles.length > 0) {
            for (const detalle of pedido.detalles) {
              const nombreProducto = detalle.producto_nombre;
              const cantidad = detalle.cantidad || 0;

              if (!pedidosMap[nombreProducto]) {
                pedidosMap[nombreProducto] = 0;
              }
              pedidosMap[nombreProducto] += cantidad;

              console.log(`      - ${nombreProducto}: +${cantidad} (total: ${pedidosMap[nombreProducto]})`);
            }
          }
        }


      }

      // 🎯 Usar stocks como productos (api_stock ya tiene todos los de PRODUCCION)
      // 🆕 Filtrar productos con disponible_inventario = true
      const productosProduccion = stocksBD
        .filter(s => s.disponible_inventario !== false) // Excluir productos sin inventario
        .map(s => ({
          id: s.producto_id,
          nombre: s.producto_nombre,
          descripcion: s.producto_descripcion,
          stock_total: s.cantidad_actual,
          orden: s.orden || 999999 // 🆕 Incluir campo orden para ordenamiento
        }));

      console.log(`📦 Productos desde api_stock: ${productosProduccion.length} (de ${stocksBD.length} totales)`);


      // 🧠 CONSULTAR PREDICCIONES DE IA CON REDES NEURONALES

      let prediccionesIAMap = {};
      try {
        // Preparar datos contextuales para la IA
        const datosContextuales = {};
        productosProduccion.forEach(p => {
          const existencias = stockMap[p.id] !== undefined ? stockMap[p.id] : (p.stock_total || 0);
          const solicitadas = solicitadasMap[p.nombre] || 0;
          const pedidos = pedidosMap[p.nombre] || 0;

          datosContextuales[p.nombre] = {
            existencias: existencias,
            solicitadas: solicitadas,
            pedidos: pedidos
          };
        });

        const iaResponse = await fetch(`${API_URL}/planeacion/prediccion_ia/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fecha: fechaFormateada,
            datos_contextuales: datosContextuales
          })
        });

        if (iaResponse.ok) {
          const iaData = await iaResponse.json();
          if (iaData.predicciones && iaData.predicciones.length > 0) {
            iaData.predicciones.forEach(pred => {
              prediccionesIAMap[pred.producto] = {
                ia_sugerido: pred.ia_sugerido,
                confianza: pred.confianza,
                usa_red_neuronal: pred.detalle?.usa_red_neuronal || false
              };
            });
            console.log(`✅ IA: ${iaData.predicciones.length} productos analizados`);

            // Log de productos con Red Neuronal
            const conRedNeuronal = iaData.predicciones.filter(p => p.detalle?.usa_red_neuronal);
            if (conRedNeuronal.length > 0) {
              console.log(`🧠 ${conRedNeuronal.length} productos usando Red Neuronal:`);
              conRedNeuronal.forEach(p => {
                console.log(`   - ${p.producto}: ${p.ia_sugerido} (${p.confianza})`);
              });
            }
          }
        }
      } catch (iaError) {
        console.error('⚠️ Error consultando IA (no crítico):', iaError);
      }

      // 🚀 SIEMPRE calcular dinámicamente desde CARGUE y PEDIDOS (datos en tiempo real)

      // 🛡️ RECOVERY FIX: Intentar cargar desde Snapshot Histórico (Reporte)
      // Si el día está congelado, es posible que el reporte tenga los datos ORIGINALES (antes del bug visual)
      let reporteData = [];
      try {
        const repResponse = await fetch(`${API_URL}/reportes-planeacion/?fecha=${fechaFormateada}`);
        if (repResponse.ok) {
          reporteData = await repResponse.json();
          console.log('🛡️ Reporte histórico encontrado:', reporteData.length);
        }
      } catch (e) {
        console.error('Error cargando reporte recuperación:', e);
      }

      // 📊 Cargar ORDEN e IA: Prioridad -> Reporte Histórico > Base de Datos Planeación
      const planeacionMap = {};

      // 1. Cargar desde BD principal (puede tener datos corruptos 1,2,3...)
      planeacionData.forEach(item => {
        planeacionMap[item.producto_nombre] = {
          orden: item.orden || 0,
          ia: item.ia || 0
        };
      });

      // 2. SOBRESCRIBIR con datos del Reporte Histórico (si existe)
      // El reporte "Guardado" (botón verde) es la fuente de verdad inmutable.
      if (reporteData.length > 0) {
        const reporte = reporteData[0]; // Usar el primer reporte encontrado
        if (reporte.datos_json) {
          let productosReporte = [];
          try {
            productosReporte = typeof reporte.datos_json === 'string'
              ? JSON.parse(reporte.datos_json)
              : reporte.datos_json;

            console.log('🛡️ Restaurando datos desde reporte histórico:', productosReporte.length);

            productosReporte.forEach(item => {
              if (item.orden > 0) {
                // Solo sobrescribir si el producto ya existía o agregarlo
                if (!planeacionMap[item.nombre]) {
                  planeacionMap[item.nombre] = {};
                }
                planeacionMap[item.nombre].orden = item.orden;
                // Opcional: restaurar IA también
                if (item.ia > 0) planeacionMap[item.nombre].ia = item.ia;
              }
            });
          } catch (parseError) {
            console.error('Error parseando JSON de reporte:', parseError);
          }
        }
      }

      const productosConPlaneacion = productosProduccion.map(p => {
        // Obtener existencias desde stockMap
        const existencias = stockMap[p.id] !== undefined ? stockMap[p.id] : (p.stock_total || 0);

        // Solicitadas desde cargue (suma de todos los IDs)
        const solicitadoFinal = solicitadasMap[p.nombre] || 0;

        // Pedidos del día
        const pedidosProducto = pedidosMap[p.nombre] || 0;

        // ORDEN e IA desde planeación guardada
        const planeacionGuardada = planeacionMap[p.nombre];

        // 🚀 CORRECCIÓN CRÍTICA: Distinguir entre "Orden Visual" (posición) y "Cantidad Ordenada" (producción)

        // 1. Cantidad a producir (Input editable): Viene del snapshot. Si no hay, es 0.
        let cantidadOrdenada = planeacionGuardada ? (planeacionGuardada.orden || 0) : 0;

        // 2. IA sugerida
        let ia = planeacionGuardada ? planeacionGuardada.ia : 0;

        // 🧠 Si no hay IA guardada, usar predicción del cerebro
        if (ia === 0 && prediccionesIAMap[p.nombre]) {
          ia = prediccionesIAMap[p.nombre].ia_sugerido;
          console.log(`🧠 IA sugerida para ${p.nombre}: ${ia} (${prediccionesIAMap[p.nombre].confianza})`);
        }

        // 3. Posición Visual (Orden de lista): Viene del maestro de Productos (Kardex).
        // Si no existe en maestro, poner al final (9999).
        let ordenVisual = p.orden > 0 ? p.orden : 9999;

        if (solicitadoFinal > 0) {
          console.log(`📊 ${p.nombre}: Solicitadas=${solicitadoFinal}, Pedidos=${pedidosProducto}`);
        }

        return {
          id: p.id,
          nombre: p.nombre,
          existencias: existencias,
          solicitado: solicitadoFinal,
          pedidos: pedidosProducto,
          orden: cantidadOrdenada, // ✅ Restaurado: Es la CANTIDAD a producir
          ordenVisual: ordenVisual, // 🆕 Nuevo campo para ordenar la lista
          ia: ia
        };
      });

      setSolicitadasCargadas(true);

      // 🆕 ORDENAR PRODUCTOS usando el campo 'ordenVisual' (posición en Kardex)
      // El campo 'orden' ahora guarda la CANTIDAD a producir, no la posición.
      productosConPlaneacion.sort((a, b) => {
        // Usar ordenVisual para ordenar
        const ordenA = a.ordenVisual !== undefined ? a.ordenVisual : 999999;
        const ordenB = b.ordenVisual !== undefined ? b.ordenVisual : 999999;

        if (ordenA !== ordenB) {
          return ordenA - ordenB;
        }

        // Si el orden es igual, ordenar por ID
        return (a.id || 0) - (b.id || 0);
      });

      // Log detallado antes de setear productos

      productosConPlaneacion.forEach(p => {
        if (p.solicitado > 0) {
          console.log(`   - ${p.nombre}: ${p.solicitado} solicitadas`);
        }
      });

      // 🎯 Actualizar productos preservando ORDEN e IA editados por el usuario
      // Solo se preserva el valor local si la fecha del cache coincide con la fecha actual
      // Esto evita que valores del día anterior contaminen un día nuevo
      setProductos(prevProductos => {
        const productosFusionados = productosConPlaneacion.map(nuevoProducto => {
          const productoLocal = prevProductos.find(p => p.id === nuevoProducto.id);

          const ordenServidor = nuevoProducto.orden || 0;
          const iaServidor = nuevoProducto.ia || 0;

          // Solo usar datos locales si corresponden a la MISMA fecha que estamos cargando
          // Si son de otro día (cambio de fecha), ignorarlos y respetar lo que trae el servidor
          const localEsDeMismaFecha = cache.fecha === fechaFormateada;

          if (productoLocal && localEsDeMismaFecha) {
            const ordenLocal = productoLocal.orden || 0;
            const iaLocal = productoLocal.ia || 0;
            return {
              ...nuevoProducto,
              orden: ordenServidor > 0 ? ordenServidor : ordenLocal,
              ia: iaServidor > 0 ? iaServidor : iaLocal
            };
          }

          // Fecha diferente o sin datos locales: usar exactamente lo que trae el servidor
          return nuevoProducto;
        });

        return productosFusionados;
      });
      // 🔍 Verificar si ya existe reporte histórico (Boton Verde)
      try {
        const checkRep = await fetch(`${API_URL}/reportes-planeacion/?fecha=${fechaFormateada}`);
        if (checkRep.ok) {
          const reps = await checkRep.json();
          setReporteGuardado(reps.length > 0);
        }
      } catch (e) {
        console.error('Error verificando reporte:', e);
      }

      setCargando(false);

      const timestamp = Date.now();

      // 🚀 Guardar en cache en memoria
      setCache({
        datos: productosConPlaneacion,
        timestamp: timestamp,
        fecha: fechaFormateada
      });

      // 🚀 Guardar en localStorage para carga instantánea futura
      try {
        const key = `planeacion_${fechaFormateada}`;
        const datosParaGuardar = {
          productos: productosConPlaneacion,
          timestamp: timestamp,
          fecha: fechaFormateada
        };
        localStorage.setItem(key, JSON.stringify(datosParaGuardar));

      } catch (error) {
        console.error('Error al guardar en localStorage:', error);
      }

      // Mostrar mensaje si se cargaron solicitadas
      const totalSolicitadas = Object.values(solicitadasMap).reduce((sum, val) => sum + val, 0);
      if (totalSolicitadas > 0) {
        console.log(`✅ ${Object.keys(solicitadasMap).length} solicitadas cargadas`);
      }
    } catch (error) {
      console.error('❌ Error al cargar existencias:', error);
      setCargando(false);
      // No hacer nada si hay error - mantener productos existentes
    }
  };
  // Utilidades
  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const getExistenciasClass = (existencias) => {
    return existencias > 0 ? 'bg-light-green' : 'bg-light-red';
  };

  // 🚀 Guardar TODO en BD automáticamente (ORDEN, IA, SOLICITADAS, PEDIDOS, EXISTENCIAS)
  const guardarEnBD = async (producto) => {
    try {
      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;

      const datosPlaneacion = {
        fecha: fechaFormateada,
        producto_nombre: producto.nombre,
        existencias: producto.existencias || 0,
        solicitadas: producto.solicitado || 0,
        pedidos: producto.pedidos || 0,
        total: (producto.solicitado || 0) + (producto.pedidos || 0),
        orden: producto.orden || 0,
        ia: producto.ia || 0,
        usuario: 'Usuario'
      };

      // 🔍 Verificar si ya existe el registro
      const checkResponse = await fetch(
        `${API_URL}/planeacion/?fecha=${fechaFormateada}&producto_nombre=${encodeURIComponent(producto.nombre)}`
      );

      let method = 'POST';
      let url = `${API_URL}/planeacion/`;

      if (checkResponse.ok) {
        const registrosExistentes = await checkResponse.json();
        if (registrosExistentes.length > 0) {
          // Ya existe, usar PATCH
          method = 'PATCH';
          url = `${API_URL}/planeacion/${registrosExistentes[0].id}/`;
        }
      }

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosPlaneacion)
      });

      if (response.ok) {
        console.log(`✅ ${method === 'POST' ? 'Creado' : 'Actualizado'}: ${producto.nombre} - Orden: ${producto.orden}, IA: ${producto.ia}, Solicitadas: ${producto.solicitado}, Pedidos: ${producto.pedidos}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ Error guardando ${producto.nombre}:`, errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error guardando en BD:', error);
      return false;
    }
  };

  // Timers para debounce
  const [saveTimers, setSaveTimers] = useState({});
  const [guardandoIndicadores, setGuardandoIndicadores] = useState({}); // 💾 Indicadores de guardado

  const updateProducto = (id, field, value) => {
    // 🔒 BLOQUEAR si el día está congelado
    if (diaCongelado) {
      mostrarMensaje('⚠️ No se pueden modificar datos después de activar ALISTAMIENTO', 'warning');
      return;
    }

    const nuevosProductos = productos.map(producto =>
      producto.id === id ? { ...producto, [field]: parseInt(value) || 0 } : producto
    );
    setProductos(nuevosProductos);

    // 🚀 Guardar en BD después de 1 segundo sin cambios (para ORDEN e IA)
    if (field === 'orden' || field === 'ia') {
      const producto = productos.find(p => p.id === id);
      if (producto) {
        // Mostrar indicador de "guardando..."
        setGuardandoIndicadores(prev => ({ ...prev, [id]: true }));

        // Cancelar timer anterior si existe
        if (saveTimers[id]) {
          clearTimeout(saveTimers[id]);
        }

        // Crear nuevo timer - ⚡ Reducido a 500ms para guardado más rápido
        const timer = setTimeout(async () => {
          const productoActualizado = nuevosProductos.find(p => p.id === id);
          if (productoActualizado) {
            await guardarEnBD(productoActualizado);
            // Ocultar indicador después de guardar
            setGuardandoIndicadores(prev => ({ ...prev, [id]: false }));
          }
        }, 500);

        setSaveTimers({ ...saveTimers, [id]: timer });
      }
    }

    // 🚀 GUARDAR INMEDIATAMENTE EN LOCALSTORAGE PARA PERSISTENCIA INSTANTÁNEA
    // (Sobrevive a recargas F5 antes de que termine el debounce de BD)
    try {
      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;
      const key = `planeacion_${fechaFormateada}`;

      const datosParaGuardar = {
        productos: nuevosProductos,
        timestamp: Date.now(),
        fecha: fechaFormateada
      };
      localStorage.setItem(key, JSON.stringify(datosParaGuardar));
    } catch (e) {
      console.error('Error guardando backup local:', e);
    }

    // 🔒 Pausar actualización automática mientras el usuario edita
    setCache({ ...cache, timestamp: Date.now() });
  };

  // ⚡ Sincronización rápida: solo Existencias, Solicitadas y Pedidos (sin IA ni snapshots)
  const sincronizarDatosOperativos = async () => {
    try {
      setCargando(true);
      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;

      const [stockRes, cargue1, cargue2, cargue3, cargue4, cargue5, cargue6, pedidosRes] =
        await Promise.all([
          fetch(`${API_URL}/stock/`),
          fetch(`${API_URL}/cargue-id1/?fecha=${fechaFormateada}`),
          fetch(`${API_URL}/cargue-id2/?fecha=${fechaFormateada}`),
          fetch(`${API_URL}/cargue-id3/?fecha=${fechaFormateada}`),
          fetch(`${API_URL}/cargue-id4/?fecha=${fechaFormateada}`),
          fetch(`${API_URL}/cargue-id5/?fecha=${fechaFormateada}`),
          fetch(`${API_URL}/cargue-id6/?fecha=${fechaFormateada}`),
          fetch(`${API_URL}/pedidos/`),
        ]);

      if (!stockRes.ok) throw new Error('Error stock');
      const stocksBD = await stockRes.json();

      // Mapa de existencias
      const stockMap = {};
      stocksBD.forEach(s => { stockMap[s.producto_id] = s.cantidad_actual; });

      // Sumar solicitadas de todos los cargues
      const solicitadasMap = {};
      for (const res of [cargue1, cargue2, cargue3, cargue4, cargue5, cargue6]) {
        if (res.ok) {
          const data = await res.json();
          data.forEach(item => {
            const nombre = item.producto || item.producto_nombre;
            const cantidad = item.total || item.cantidad || 0;
            solicitadasMap[nombre] = (solicitadasMap[nombre] || 0) + cantidad;
          });
        }
      }

      // Sumar pedidos
      const pedidosMap = {};
      if (pedidosRes.ok) {
        const pedidos = await pedidosRes.json();
        pedidos
          .filter(p => p.estado !== 'ANULADA' && p.fecha_entrega?.split('T')[0] === fechaFormateada)
          .forEach(p => {
            (p.detalles || []).forEach(d => {
              pedidosMap[d.producto_nombre] = (pedidosMap[d.producto_nombre] || 0) + (d.cantidad || 0);
            });
          });
      }

      // Actualizar solo las 3 columnas operativas, preservar Orden e IA
      setProductos(prev => prev.map(p => ({
        ...p,
        existencias: stockMap[p.id] !== undefined ? stockMap[p.id] : p.existencias,
        solicitado: solicitadasMap[p.nombre] || 0,
        pedidos: pedidosMap[p.nombre] || 0,
      })));

      setCargando(false);
    } catch (error) {
      console.error('❌ Error sincronización rápida:', error);
      setCargando(false);
    }
  };

  // Effects - Carga inicial (sin polling automático)
  useEffect(() => {
    if (fechaSeleccionada) {
      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;

      // 🧹 Limpiar productos, cache y activar spinner al cambiar de fecha
      setProductos([]);
      setCargando(true);
      setCache({ datos: null, timestamp: null, fecha: null });

      cargarExistenciasReales(true);
    }

    // ❌ POLLING DESACTIVADO: Genera demasiadas llamadas al backend
    // Solo se actualiza:
    // 1. Al cargar la página
    // 2. Al cambiar de fecha
    // 3. Al hacer clic en "Sincronizar"
    // 4. Cuando se recibe evento de Cargue/Pedidos

    let intervalo = null; // No hay intervalo

    // 🚀 Escuchar eventos de otros módulos
    const handlePedidoGuardado = () => {

      cargarExistenciasReales(true);
    };

    const handleInventarioActualizado = () => {

      cargarExistenciasReales(true);
    };

    const handleProductosUpdated = () => {

      cargarExistenciasReales(true);
    };

    const handleCargueActualizado = (event) => {

      // Los datos vienen en event.detail
      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaActual = `${year}-${month}-${day}`;

      console.log(`🔍 Comparando fechas: evento=${event.detail?.fecha}, actual=${fechaActual}`);

      if (event.detail && event.detail.fecha === fechaActual) {


        // 🔥 Limpiar cache para forzar recarga desde servidor
        setCache({ datos: null, timestamp: null, fecha: null });

        // 🔥 Limpiar localStorage para forzar recarga
        const key = `planeacion_${fechaActual}`;
        localStorage.removeItem(key);

        // 🚀 Marcar timestamp de actualización
        setUltimaActualizacion(Date.now());

        // 🚀 Delay de 300ms para evitar múltiples llamadas
        setTimeout(() => {
          cargarExistenciasReales(true);
        }, 300); // 300ms para agrupar eventos múltiples
      } else {
        console.log('⚠️ Fechas NO coinciden - No se actualiza');
      }
    };

    window.addEventListener('pedidoGuardado', handlePedidoGuardado);
    window.addEventListener('inventarioActualizado', handleInventarioActualizado);
    window.addEventListener('productosUpdated', handleProductosUpdated);
    window.addEventListener('cargueActualizado', handleCargueActualizado);

    return () => {
      // No hay intervalo que limpiar
      window.removeEventListener('pedidoGuardado', handlePedidoGuardado);
      window.removeEventListener('inventarioActualizado', handleInventarioActualizado);
      window.removeEventListener('productosUpdated', handleProductosUpdated);
      window.removeEventListener('cargueActualizado', handleCargueActualizado);
    };
  }, [fechaSeleccionada]); // Sin diaCongelado porque no hay polling

  // const handleSolicitadoChange = (id, cantidad) => updateProducto(id, 'solicitado', cantidad); // No editable
  const handleOrdenChange = (id, cantidad) => updateProducto(id, 'orden', cantidad);

  const handleGuardarPlaneacion = async () => {
    try {
      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;

      // Guardar cada producto en la BD
      for (const producto of productos) {
        const datosPlaneacion = {
          fecha: fechaFormateada,
          producto_nombre: producto.nombre,
          existencias: producto.existencias || 0,
          solicitadas: producto.solicitado || 0,
          pedidos: producto.pedidos || 0,
          total: (producto.solicitado || 0) + (producto.pedidos || 0),
          orden: producto.orden || 0,
          ia: producto.ia || 0,
          usuario: 'Sistema'
        };

        const response = await fetch(`${API_URL}/planeacion/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosPlaneacion)
        });

        if (!response.ok) {
          console.error(`Error guardando ${producto.nombre}`);
        }
      }

      mostrarMensaje('Planeación guardada correctamente en BD', 'success');

      // 🚀 Limpiar cache para forzar recarga
      setCache({ datos: null, timestamp: null, fecha: null });

      // 🚀 Limpiar localStorage para forzar recarga desde servidor
      try {
        const year = fechaSeleccionada.getFullYear();
        const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
        const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
        const fechaFormateada = `${year}-${month}-${day}`;
        const key = `planeacion_${fechaFormateada}`;
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error al limpiar localStorage:', error);
      }

      // 🚀 Notificar a otros módulos
      window.dispatchEvent(new Event('planeacionGuardada'));

    } catch (error) {
      console.error('Error guardando planeación:', error);
      mostrarMensaje('Error al guardar planeación', 'danger');
    }
  };

  // 🚀 Guardar Reporte Histórico (Snapshot)
  const guardarReporte = async () => {
    try {
      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;

      const response = await fetch(`${API_URL}/reportes-planeacion/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha_reporte: fechaFormateada,
          datos_json: productos,
          usuario: 'Usuario Sistema'
        })
      });

      if (response.ok) {
        setReporteGuardado(true);
        mostrarMensaje('📝 Reporte guardado exitosamente para historial', 'success');
        // No revertir color
      } else {
        mostrarMensaje('Error al guardar reporte', 'danger');
      }
    } catch (error) {
      console.error('Error guardando reporte:', error);
      mostrarMensaje('Error de conexión', 'danger');
    }
  };

  const handleDateSelect = (date) => setFechaSeleccionada(date);

  return (
    <Container fluid className="py-4">
      {/* Encabezado y controles */}
      <Row className="mb-4">
        <Col>
          <p className="text-muted fw-medium" style={{ fontSize: '0.95rem' }}>Planifique la cantidad de productos a fabricar para una fecha específica.</p>
        </Col>
      </Row>

      {/* Selector de fecha y botón de sincronización */}
      <Row className="mb-4">
        <Col xs={12} md={6}>
          <DateSelector onDateSelect={handleDateSelect} />
        </Col>
        <Col xs={12} md={6} className="d-flex justify-content-end align-items-center gap-2 botones-planeacion">
          {/* ✅ Nuevo botón GUARDAR REPORTE */}
          <Button
            variant={reporteGuardado ? "success" : "primary"}
            size="sm"
            className="mb-2 mb-md-0 d-flex align-items-center"
            onClick={() => {
              if (reporteGuardado) {
                mostrarMensaje('⚠️ Ya hay un reporte de planeación guardado para esta fecha.', 'warning');
                return;
              }
              guardarReporte();
            }}
            disabled={cargando || productos.length === 0}
            title={reporteGuardado ? "Ya existe un reporte guardado" : "Guardar una copia de esta planeación"}
          >
            {reporteGuardado ? (
              <>
                <i className="bi bi-check-circle-fill me-1"></i>
                Guardado
              </>
            ) : (
              <>
                <i className="bi bi-save me-1"></i>
                Guardar Reporte
              </>
            )}
          </Button>

          <Button
            variant="outline-primary"
            size="sm"
            className="mb-2 mb-md-0"
            onClick={() => {
              cargarExistenciasReales(true);
            }}
            disabled={cargando}
          >
            <i className="bi bi-arrow-repeat me-1"></i>
            {cargando ? 'Sincronizando...' : 'Sincronizar'}
          </Button>

          <Button
            variant="outline-success"
            size="sm"
            className="mb-2 mb-md-0 btn-aplicar-ia"
            onClick={() => {
              const productosConIA = productos.filter(p => p.ia > 0);
              if (productosConIA.length === 0) {
                mostrarMensaje('No hay sugerencias de IA disponibles', 'warning');
                return;
              }

              const nuevosProductos = productos.map(p => ({
                ...p,
                orden: p.ia > 0 ? p.ia : p.orden
              }));

              setProductos(nuevosProductos);

              // Guardar automáticamente en BD
              nuevosProductos.forEach(p => {
                if (p.ia > 0) guardarEnBD(p);
              });

              mostrarMensaje(`🤖 ${productosConIA.length} sugerencias de IA aplicadas a ORDEN`, 'success');
            }}
            disabled={diaCongelado || cargando}
            title={diaCongelado ? 'Bloqueado - Día congelado' : 'Copiar valores de IA a Orden'}
          >
            <i className="bi bi-robot"></i>
            <span className="d-none d-lg-inline ms-1">Aplicar IA</span>
          </Button>
        </Col>
      </Row>

      {/* Mensajes de alerta */}
      {mensaje.texto && (
        <Row className="mb-4">
          <Col>
            <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ texto: '', tipo: '' })}>
              {mensaje.texto}
            </Alert>
          </Col>
        </Row>
      )}

      {/* 🔒 Indicador de día congelado */}
      {diaCongelado && (
        <Row className="mb-3">
          <Col>
            <Alert variant="warning" className="d-flex align-items-center">
              <i className="bi bi-lock-fill me-2"></i>
              <strong>Día congelado:</strong>&nbsp;Los datos están bloqueados porque el ALISTAMIENTO ya fue activado. No se permiten modificaciones.
            </Alert>
          </Col>
        </Row>
      )}



      {/* Tabla de planeación */}
      <Row className="mb-4">
        <Col>
          <div className="table-container">
            <Table className="align-middle mb-0 table-kardex planeacion-table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '32%' }}>Producto</th>
                  <th scope="col" className="text-center" style={{ width: '9%' }}>Existencias</th>
                  <th scope="col" className="text-center" style={{ width: '5%' }}>Solicitadas</th>
                  <th scope="col" className="text-center" style={{ width: '19%' }}>Pedidos</th>
                  <th scope="col" className="text-center" style={{ width: '13%' }}>Total</th>
                  <th scope="col" className="text-center" style={{ width: '12%' }}>Orden</th>
                  <th scope="col" className="text-center" style={{ width: '10%' }}>IA</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => {
                  const total = (producto.solicitado || 0) + (producto.pedidos || 0);
                  return (
                    <tr key={producto.id} className="product-row">
                      <td className="fw-medium" style={{ color: '#1e293b' }}>{producto.nombre}</td>
                      <td className="text-center">
                        <span className={`${getExistenciasClass(producto.existencias)} rounded-pill-sm`}>
                          {producto.existencias} und
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center">
                          <span className={`solicitadas-display ${producto.solicitado > 0 ? 'has-data' : ''}`}>
                            {producto.solicitado || 0}
                          </span>
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center">
                          <span className={`solicitadas-display ${(producto.pedidos || 0) > 0 ? 'has-data' : ''}`}>
                            {producto.pedidos || 0}
                          </span>
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center">
                          <span className={`solicitadas-display ${total > 0 ? 'has-data' : ''}`} style={{ fontWeight: '600' }}>
                            {total}
                          </span>
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center align-items-center position-relative">
                          <input
                            type="number"
                            min="0"
                            value={producto.orden || 0}
                            onChange={(e) => handleOrdenChange(producto.id, e.target.value)}
                            onFocus={(e) => e.target.select()} // 🎯 Seleccionar todo al hacer clic
                            className="solicitadas-display"
                            style={{
                              cursor: diaCongelado ? 'not-allowed' : 'text',
                              maxWidth: '60px',
                              backgroundColor: diaCongelado ? '#f8f9fa' : 'white',
                              opacity: diaCongelado ? 0.6 : 1
                            }}
                            disabled={diaCongelado}
                            title={diaCongelado ? 'Bloqueado - Día congelado' : 'Editable'}
                          />
                          {guardandoIndicadores[producto.id] && (
                            <span className="ms-1 text-muted" style={{ fontSize: '0.75rem' }}>
                              <i className="bi bi-arrow-repeat spinner-border spinner-border-sm"></i>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center">
                          <span
                            className="solicitadas-display"
                            style={{
                              color: (producto.ia || 0) > 0 ? '#6c757d' : '#adb5bd',
                              fontWeight: (producto.ia || 0) > 0 ? '500' : '400'
                            }}
                            title={(producto.ia || 0) > 0 ? "Sugerencia de IA" : ""}
                          >
                            {producto.ia || 0}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {productos.length === 0 && !cargando && (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <p className="text-muted">No hay productos disponibles</p>
                    </td>
                  </tr>
                )}
                {productos.length === 0 && cargando && (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <div className="d-flex justify-content-center align-items-center">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                        <p className="text-muted mb-0">Cargando productos...</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>



      {/* Historial de planeación */}
      {planeacion.length > 0 && (
        <Row className="mt-5">
          <Col>
            <h5 className="mb-3 fw-bold" style={{ color: '#1e293b' }}>Historial de Planeación</h5>
            <div className="table-container">
              <Table className="align-middle mb-0 table-kardex planeacion-table">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Productos</th>
                    <th scope="col" className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {planeacion.map((plan) => (
                    <tr key={plan.id}>
                      <td>
                        <span className="rounded-pill-sm" style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                          {plan.fecha}
                        </span>
                      </td>
                      <td>
                        {plan.productos.map(p => (
                          <div key={p.id} className="mb-1">
                            <span className="fw-medium" style={{ color: '#1e293b' }}>{p.nombre}:</span>
                            <span className="rounded-pill-sm bg-light-green ms-2">
                              <i className="bi bi-box-seam me-1"></i> {p.solicitado}
                            </span>
                            <span className="rounded-pill-sm ms-2" style={{ backgroundColor: '#3498DB', color: '#fff' }}>
                              <i className="bi bi-clipboard-check me-1"></i> {p.orden}
                            </span>
                          </div>
                        ))}
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="rounded-pill-sm"
                          style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
                        >
                          <i className="bi bi-eye me-1"></i>
                          Ver Detalles
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default InventarioPlaneacion;