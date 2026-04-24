import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'react-bootstrap';
import VerificarGuardado from './VerificarGuardado';
import { useVendedores } from '../../context/VendedoresContext';
import './BotonLimpiar.css';

// 🔧 API URL configurable para desarrollo local y producción
const API_URL = process.env.REACT_APP_API_URL || '/api';

const BotonLimpiar = ({ productos = [], dia, idSheet, fechaSeleccionada, onLimpiar }) => {
  // 🔧 Helper para formatear fecha a YYYY-MM-DD (consistente con localStorage)
  const formatearFechaLS = (fecha) => {
    if (fecha instanceof Date) {
      return fecha.toISOString().split('T')[0];
    }
    return fecha || '';
  };
  const fechaFormateadaLS = formatearFechaLS(fechaSeleccionada);

  const [estado, setEstado] = useState('ALISTAMIENTO');
  const [loading, setLoading] = useState(false);
  const [productosValidados, setProductosValidados] = useState([]);
  const [productosPendientes, setProductosPendientes] = useState([]);

  // Estados para el Modal de Confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({
    totalDevoluciones: 0,
    totalVencidas: 0,
    resumenDevoluciones: [],
    resumenVencidas: []
  });

  // Estados para el Modal de Éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState({
    titulo: '',
    mensaje: '',
    detalles: ''
  });

  // 🆕 Estado para Modal de CONFIRMACIÓN DE DESCUENTO (antes de afectar inventario)
  const [showDescuentoConfirm, setShowDescuentoConfirm] = useState(false);
  const [descuentoPreview, setDescuentoPreview] = useState({
    totalCargue: 0,
    totalPedidos: 0,
    totalVencidas: 0,
    productosACargue: [],
    productosPedidos: [],
    productosVencidas: [],
    ejecutarDescuento: null // función que se ejecutará si confirma
  });

  // Obtener datos frescos del contexto de vendedores
  const { datosVendedores } = useVendedores();



  // Verificar productos listos y detectar productos pendientes (FUNCIÓN ORIGINAL - mantener para compatibilidad)
  const verificarProductosListos = async () => {
    try {
      const { simpleStorage } = await import('../../services/simpleStorage');

      // 🚀 CORREGIDO: Usar fechaSeleccionada directamente sin fallback
      if (!fechaSeleccionada) {
        console.warn('⚠️ fechaSeleccionada no definida en verificarProductosListos');
        return { listos: [], pendientes: [] };
      }

      const fechaAUsar = fechaSeleccionada;
      const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];

      const todosLosProductos = {};
      const productosPendientes = {};

      // Recopilar productos de todos los IDs
      for (const id of idsVendedores) {
        const key = `cargue_${dia}_${id}_${fechaAUsar}`;
        const datos = await simpleStorage.getItem(key);

        if (datos && datos.productos) {
          for (const producto of datos.productos) {
            // Debug: mostrar estado de checks para productos con total > 0
            if (producto.total > 0) {
            }

            // 🚀 LÓGICA FLEXIBLE: Productos con TOTAL > 0 sin check de DESPACHADOR (Vendedor opcional)
            if (producto.total > 0 && !producto.despachador) {
              if (!productosPendientes[producto.id]) {
                productosPendientes[producto.id] = {
                  id: producto.id,
                  nombre: producto.producto,
                  totalCantidad: 0,
                  vendedorId: id,
                  vendedor: producto.vendedor,
                  despachador: producto.despachador
                };
              }
              productosPendientes[producto.id].totalCantidad += producto.total; // Contar total (cantidad + adicional)
            }

            // 🚀 LÓGICA FLEXIBLE: Productos listos si NO ESTÁN PENDIENTES (marcados por Despachador)
            if (producto.despachador && producto.total > 0) {
              if (!todosLosProductos[producto.id]) {
                todosLosProductos[producto.id] = {
                  id: producto.id,
                  nombre: producto.producto,
                  totalCantidad: 0
                };
              }
              todosLosProductos[producto.id].totalCantidad += producto.total; // Contar total (cantidad + adicional)
            }
          }
        }
      }

      return {
        listos: Object.values(todosLosProductos),
        pendientes: Object.values(productosPendientes)
      };
    } catch (error) {
      console.error('Error verificando productos:', error);
      return { listos: [], pendientes: [] };
    }
  };

  // 🚀 SOLO ID1 maneja el estado global para todos los IDs
  useEffect(() => {
    if (idSheet !== 'ID1') return;

    // 1. Cargar estado inicial desde localStorage (para velocidad)
    let estadoGuardado = localStorage.getItem(`estado_boton_${dia}_${fechaFormateadaLS}`);

    // ⚠️ REGLA DE MIGRACIÓN: Si encontramos el estado viejo "SUGERIDO", lo convertimos a "ALISTAMIENTO_ACTIVO"
    if (estadoGuardado === 'SUGERIDO') {
      estadoGuardado = 'ALISTAMIENTO_ACTIVO';
      localStorage.setItem(`estado_boton_${dia}_${fechaFormateadaLS}`, 'ALISTAMIENTO_ACTIVO');
    }

    if (estadoGuardado) {
      setEstado(estadoGuardado);
    }

    // 2. SIEMPRE consultar al servidor para tener la verdad absoluta

    const cargarEstadoDesdeBD = async () => {
      try {
        const urlEstado = `${API_URL}/estado-cargue/?dia=${dia.toUpperCase()}&fecha=${fechaFormateadaLS}`;
        const responseEstado = await fetch(urlEstado);

        if (responseEstado.ok) {
          const dataEstado = await responseEstado.json();

          if (dataEstado.success && dataEstado.estado) {
            // CASO ESPECIAL: Si la BD está vacía (ALISTAMIENTO) pero yo tengo un estado avanzado
            // ENTONCES: La BD está desactualizada. ¡Actualízala con mi estado!
            if (dataEstado.estado === 'ALISTAMIENTO' && estadoGuardado && estadoGuardado !== 'ALISTAMIENTO') {
              // Forzar re-envío del estado local a la BD
              // No hacemos setEstado porque ya está en ese estado, pero el useEffect de guardado no saltará si no cambia.
              // Así que llamamos manualmente al endpoint de actualización.
              fetch(`${API_URL}/estado-cargue/actualizar/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  dia: dia.toUpperCase(),
                  fecha: fechaFormateadaLS,
                  estado: estadoGuardado,
                  vendedor_id: 'ID1'
                })
              });
              return;
            }

            // CASO NORMAL: La BD tiene un esatdo diferente (y no es el default). La BD manda.
            if (dataEstado.estado !== estadoGuardado) {
              setEstado(dataEstado.estado);
              localStorage.setItem(`estado_boton_${dia}_${fechaFormateadaLS}`, dataEstado.estado);

              // Si viene congelado de BD, asegurar congelamiento local
              if (dataEstado.estado === 'DESPACHO' || dataEstado.estado === 'COMPLETADO') {
                congelarProduccion(dataEstado.estado);
              }
            } else {
            }
            return;
          }
        }

        // Si no hay estado en BD y no teníamos local, intentar inferir
        if (!estadoGuardado) {
          // ... (Lógica de inferencia existente) ...
          const url = `${API_URL}/cargue-id1/?dia=${dia.toUpperCase()}&fecha=${fechaFormateadaLS}`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              const tieneCheckVD = data.some(r => r.v === true && r.d === true);
              const tieneCantidad = data.some(r => r.cantidad > 0);
              let estadoInferido = 'ALISTAMIENTO';
              if (tieneCheckVD) estadoInferido = 'DESPACHO';
              else if (tieneCantidad) estadoInferido = 'ALISTAMIENTO_ACTIVO'; // 🚀 Omitir SUGERIDO, ir directo a ACTIVO

              setEstado(estadoInferido);
              localStorage.setItem(`estado_boton_${dia}_${fechaFormateadaLS}`, estadoInferido);
            }
          }
        }

      } catch (error) {
        console.error(`❌ Error cargando estado desde BD:`, error);
      }
    };

    cargarEstadoDesdeBD();

    // También verificar si hay datos congelados
    const datosCongelados = localStorage.getItem(`produccion_congelada_${dia}_${fechaFormateadaLS}`);
    if (datosCongelados) {

    }
  }, [dia, fechaFormateadaLS, idSheet]);



  // 🆕 NUEVO: Sincronizar estado con BD cuando cambie
  const estadoAnteriorRef = React.useRef(estado);

  useEffect(() => {
    if (idSheet !== 'ID1') return;
    if (estado === estadoAnteriorRef.current) return; // No sincronizar si no cambió

    estadoAnteriorRef.current = estado;

    // No sincronizar estados iniciales
    if (estado === 'ALISTAMIENTO') return;


    fetch(`${API_URL}/estado-cargue/actualizar/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dia: dia.toUpperCase(),
        fecha: fechaFormateadaLS,
        estado: estado,
        vendedor_id: 'ID1'
      })
    })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
        } else {
          console.error(`❌ Error sincronizando estado:`, result.error);
        }
      })
      .catch(err => console.error(`❌ Error en fetch estado:`, err));
  }, [estado, dia, fechaFormateadaLS, idSheet]);

  // 🚀 SOLO ID1 verifica productos de TODOS los IDs
  useEffect(() => {

    if (idSheet !== 'ID1') {
      return;
    }


    const verificarYAvanzar = async () => {
      try {
        const resultado = await verificarProductosListos();
        setProductosValidados(resultado.listos);
        setProductosPendientes(resultado.pendientes);


        // 🆕 LÓGICA FLEXIBLE: Si está en ALISTAMIENTO_ACTIVO y HAY AL MENOS 1 PRODUCTO LISTO, pasar a DESPACHO
        if (estado === 'ALISTAMIENTO_ACTIVO' && resultado.listos.length > 0) {
          const nuevoEstado = 'DESPACHO';
          setEstado(nuevoEstado);
          localStorage.setItem(`estado_boton_${dia}_${fechaFormateadaLS}`, nuevoEstado);

          // Congelar producción al pasar a DESPACHO
          congelarProduccion('DESPACHO');
        }
      } catch (error) {
        console.error(`❌ ERROR en verificarYAvanzar:`, error);
      }
    };

    // Solo verificar si está en ALISTAMIENTO_ACTIVO
    if (estado === 'ALISTAMIENTO_ACTIVO' || estado === 'ALISTAMIENTO') {
      verificarYAvanzar();
    }

    // 🚀 VERIFICACIÓN EN TIEMPO REAL: Solo cuando está en ALISTAMIENTO_ACTIVO
    let interval;
    if (estado === 'ALISTAMIENTO_ACTIVO' || estado === 'ALISTAMIENTO') {
      interval = setInterval(verificarYAvanzar, 1000); // Verificar cada 1 segundo
    }

    return () => {
      if (interval) {

        clearInterval(interval);
      }
    };
  }, [dia, fechaSeleccionada, idSheet, estado]);

  // 🚀 NUEVA FUNCIONALIDAD: Detectar cambios en datos de cargue para verificación inmediata
  useEffect(() => {
    if (idSheet !== 'ID1' || (estado !== 'ALISTAMIENTO_ACTIVO' && estado !== 'ALISTAMIENTO')) return;

    const handleCargueDataChange = async (e) => {
      // 🕒 Esperar 500ms para asegurar que el almacenamiento se actualizó correctamente
      setTimeout(async () => {
        const resultado = await verificarProductosListos();
        setProductosValidados(resultado.listos);
        setProductosPendientes(resultado.pendientes);


        // 🆕 LÓGICA FLEXIBLE: Si HAY AL MENOS 1 PRODUCTO LISTO, cambiar a DESPACHO
        if (resultado.listos.length > 0) {
          const nuevoEstado = 'DESPACHO';
          setEstado(nuevoEstado);
          localStorage.setItem(`estado_boton_${dia}_${fechaFormateadaLS}`, nuevoEstado);
          congelarProduccion('DESPACHO');
        }
      }, 500);
    };

    // Escuchar evento personalizado de cambios en cargue
    window.addEventListener('cargueDataChanged', handleCargueDataChange);

    return () => {
      window.removeEventListener('cargueDataChanged', handleCargueDataChange);
    };
  }, [dia, fechaSeleccionada, idSheet, estado]);

  // 🚀 SOLO ID1 TIENE EL BOTÓN MAESTRO que controla todos los IDs
  if (idSheet !== 'ID1') {
    return (
      <div className="mt-3">
        <small className="text-muted">Controlado desde ID1</small>
      </div>
    );
  }

  // 🔒 FUNCIÓN PARA CONGELAR PRODUCCIÓN (reutilizable)
  const congelarProduccion = (estadoNombre) => {
    if (!fechaSeleccionada) {
      console.error('❌ ERROR: fechaSeleccionada no definida para congelar producción');
      return;
    }

    const keyCongelados = `produccion_congelada_${dia}_${fechaFormateadaLS}`;
    const datosExistentes = localStorage.getItem(keyCongelados);

    // 🔒 PROTECCIÓN: Si ya hay datos congelados, NO recongelar
    if (datosExistentes) {
      return; // Salir sin recongelar
    }

    // 🆕 PRIMERA VEZ: Congelar datos actuales
    const datosParaCongelar = {};
    const fechaActual = fechaSeleccionada;
    const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];

    // Calcular totales actuales para congelar
    for (const diaActual of diasSemana) {
      for (const id of idsVendedores) {
        const key = `cargue_${diaActual}_${id}_${fechaActual}`;
        const datosString = localStorage.getItem(key);

        if (datosString) {
          try {
            const datos = JSON.parse(datosString);
            if (datos && datos.productos) {
              datos.productos.forEach(producto => {
                if (producto.total > 0) {
                  if (!datosParaCongelar[producto.producto]) {
                    datosParaCongelar[producto.producto] = 0;
                  }
                  datosParaCongelar[producto.producto] += producto.total;
                }
              });
            }
          } catch (error) {
            // Ignorar errores
          }
        }
      }
    }

    localStorage.setItem(keyCongelados, JSON.stringify(datosParaCongelar));

  };

  // Función para actualizar inventario
  const actualizarInventario = async (productoId, cantidad, tipo) => {
    try {

      const cantidadFinal = tipo === 'SUMAR' ? cantidad : -cantidad;

      const response = await fetch(`${API_URL}/productos/${productoId}/actualizar_stock/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cantidad: cantidadFinal,
          usuario: 'Sistema Despacho',
          nota: `Despacho - ${dia} - ${new Date().toISOString()}`
        }),
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Response error: ${errorText}`);
        throw new Error(`Error al actualizar inventario: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Error actualizando inventario:', error);
      throw error;
    }
  };

  // 📋 NUEVA FUNCIÓN: Cargar pedidos PENDIENTES del día
  const cargarPedidosPendientes = async (fecha) => {
    try {
      // Convertir fecha a formato YYYY-MM-DD si es un objeto Date
      let fechaFormateada = fecha;
      if (fecha instanceof Date) {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        fechaFormateada = `${year}-${month}-${day}`;
      }



      // 🔥 CARGAR PEDIDOS filtrados por fecha de entrega
      const response = await fetch(`${API_URL}/pedidos/?fecha_entrega=${fechaFormateada}`);

      if (!response.ok) {
        console.warn('⚠️ No se pudieron cargar pedidos');
        return { pedidosAgrupados: {}, pedidosIds: [] };
      }

      const todosPedidos = await response.json();

      // 🔥 FILTRAR SOLO PEDIDOS PENDIENTES DE LA FECHA ESPECÍFICA Y QUE NO HAYAN AFECTADO INVENTARIO
      const pedidosFiltrados = todosPedidos.filter(p => {
        const fechaEntrega = p.fecha_entrega ? p.fecha_entrega.split('T')[0] : null;
        // Filtro corregido: Incluir ENTREGADA si no han afectado inventario
        // Solo excluir lo que definitivamente no debe suma: ANULADA y CANCELADO
        const estadosIgnorados = ['CANCELADO', 'ANULADA', 'PENDIENTE', 'NO_ENTREGADA'];
        const esValido = !estadosIgnorados.includes(p.estado);
        const esFechaCorrecta = fechaEntrega === fechaFormateada;

        // 🔒 NUEVO: Si ya afectó inventario (ej. pedido urgente), NO volver a descontar
        const yaAfectoInventario = p.inventario_afectado === true;

        if (esFechaCorrecta && esValido) {
          if (yaAfectoInventario) {
          } else {
          }
        }

        return esValido && esFechaCorrecta && !yaAfectoInventario;
        // return esPendiente && esFechaCorrecta; // DEBUG: Permitir incluso si ya afectó inventario
      });


      // Agrupar productos por nombre y sumar cantidades
      const pedidosAgrupados = {};
      const pedidosIds = [];

      for (const pedido of pedidosFiltrados) {
        pedidosIds.push(pedido.id);

        if (pedido.detalles && pedido.detalles.length > 0) {
          for (const detalle of pedido.detalles) {
            const nombreProducto = detalle.producto_nombre;
            const cantidad = detalle.cantidad;

            if (!pedidosAgrupados[nombreProducto]) {
              pedidosAgrupados[nombreProducto] = {
                nombre: nombreProducto,
                cantidad: 0,
                productoId: null // Se buscará después
              };
            }

            pedidosAgrupados[nombreProducto].cantidad += cantidad;
          }
        }
      }



      return { pedidosAgrupados, pedidosIds };

    } catch (error) {
      console.error('❌ Error cargando pedidos:', error);
      return { pedidosAgrupados: {}, pedidosIds: [] };
    }
  };

  // 📋 NUEVA FUNCIÓN: Marcar pedidos como ENTREGADA
  const marcarPedidosComoEntregados = async (pedidosIds) => {
    try {

      let exitosos = 0;
      let errores = 0;

      for (const pedidoId of pedidosIds) {
        try {
          const response = await fetch(`${API_URL}/pedidos/${pedidoId}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ estado: 'ENTREGADA' })
          });

          if (response.ok) {
            exitosos++;
          } else {
            errores++;
            console.error(`❌ Error marcando pedido ${pedidoId}`);
          }
        } catch (error) {
          errores++;
          console.error(`❌ Error en pedido ${pedidoId}:`, error);
        }
      }

      return { exitosos, errores };

    } catch (error) {
      console.error('❌ Error marcando pedidos:', error);
      return { exitosos: 0, errores: pedidosIds.length };
    }
  };





  // 🚀 NUEVA FUNCIÓN: Guardar datos de un ID específico
  const guardarDatosDelID = async (fechaAUsar, idVendedor) => {
    try {

      const { simpleStorage } = await import('../../services/simpleStorage');
      const { cargueService } = await import('../../services/cargueService');

      // Obtener datos desde localStorage del ID específico
      const key = `cargue_${dia}_${idVendedor}_${fechaAUsar}`;

      // 🚀 MEJORADO: Intentar obtener de localStorage directamente primero
      let datos = null;
      const datosLocalString = localStorage.getItem(key);

      if (datosLocalString) {
        try {
          datos = JSON.parse(datosLocalString);
        } catch (parseError) {
          console.error(`❌ ${idVendedor} - Error parsing localStorage:`, parseError);
        }
      }

      // Si no hay datos en localStorage, intentar con simpleStorage
      if (!datos) {
        datos = await simpleStorage.getItem(key);
      }

      if (!datos || !datos.productos) {
        return false;
      }


      // Filtrar solo productos que tienen datos relevantes
      const productosParaGuardar = datos.productos.filter(p =>
        p.cantidad > 0 || p.dctos > 0 || p.adicional > 0 ||
        p.devoluciones > 0 || p.vencidas > 0 || p.vendedor || p.despachador
      );

      if (productosParaGuardar.length === 0) {
        return false;
      }

      // Obtener responsable real - PRIORIDAD: responsableStorage > localStorage > datos > default
      const { responsableStorage } = await import('../../utils/responsableStorage');
      let responsableReal = 'RESPONSABLE';

      const responsableRS = responsableStorage.get(idVendedor);
      const responsableLS = localStorage.getItem(`responsable_${idVendedor}`);
      const responsableFromDatos = datos.responsable;

      // 🚀 PRIORIDAD CORRECTA: responsableStorage es la fuente de verdad
      if (responsableRS && responsableRS !== 'RESPONSABLE' && responsableRS.trim() !== '') {
        responsableReal = responsableRS.trim();
      } else if (responsableLS && responsableLS !== 'RESPONSABLE' && responsableLS.trim() !== '') {
        responsableReal = responsableLS.trim();
      } else if (responsableFromDatos && responsableFromDatos !== 'RESPONSABLE' && responsableFromDatos.trim() !== '') {
        responsableReal = responsableFromDatos.trim();
      }

      // 🚀 NUEVO: Intentar obtener del contexto de vendedores si aún es el default
      if (responsableReal === 'RESPONSABLE' && datosVendedores && datosVendedores[idVendedor]) {
        const nombreContexto = datosVendedores[idVendedor].nombre;
        if (nombreContexto && nombreContexto.trim() !== '') {
          responsableReal = nombreContexto.trim();
        }
      }


      // 🚀 CORREGIDO: Recopilar datos de pagos específicos del ID
      const conceptosKey = `conceptos_pagos_${dia}_${idVendedor}_${fechaAUsar}`;
      const datosConceptos = localStorage.getItem(conceptosKey);
      let pagosData = {};


      if (datosConceptos) {
        try {
          const conceptos = JSON.parse(datosConceptos);

          pagosData = {
            concepto: conceptos.filter(c => c.concepto).map(c => c.concepto).join(', ') || '',
            descuentos: conceptos.reduce((sum, c) => sum + (parseFloat(c.descuentos) || 0), 0),
            nequi: conceptos.reduce((sum, c) => sum + (parseFloat(c.nequi) || 0), 0),
            daviplata: conceptos.reduce((sum, c) => sum + (parseFloat(c.daviplata) || 0), 0)
          };

        } catch (error) {
          console.error(`❌ Error parsing conceptos para ${idVendedor}:`, error);
        }
      } else {
      }

      // Calcular totales de resumen
      const totalProductos = productosParaGuardar.reduce((sum, p) => sum + ((p.total || 0) * (p.valor || 0)), 0);
      const totalDctos = productosParaGuardar.reduce((sum, p) => sum + ((p.dctos || 0) * (p.valor || 0)), 0);
      // 🚀 CORREGIDO: Buscar BASE CAJA específica del ID
      const baseCajaKey = `base_caja_${dia}_${idVendedor}_${fechaAUsar}`;
      const baseCaja = parseFloat(localStorage.getItem(baseCajaKey)) || 0;


      // 🚀 CORREGIDO: Obtener TOTAL PEDIDOS del contexto
      const datosContexto = datosVendedores[idVendedor];
      const totalPedidos = datosContexto?.totalPedidos || 0;

      // 🚀 CORREGIDO: Calcular VENTA y TOTAL EFECTIVO correctamente
      // VENTA = BASE_CAJA + TOTAL_DESPACHO + TOTAL_PEDIDOS - TOTAL_DCTOS
      const ventaCalculada = baseCaja + totalProductos + totalPedidos - (totalDctos + (pagosData.descuentos || 0));

      // TOTAL_EFECTIVO = VENTA - NEQUI - DAVIPLATA
      const totalEfectivoCalculado = ventaCalculada - (pagosData.nequi || 0) - (pagosData.daviplata || 0);

      const resumenData = {
        base_caja: baseCaja,
        total_despacho: totalProductos,
        total_pedidos: totalPedidos,
        total_dctos: totalDctos + (pagosData.descuentos || 0), // Incluir descuentos de pagos
        venta: ventaCalculada,
        total_efectivo: totalEfectivoCalculado
      };


      // Recopilar datos de cumplimiento
      const cumplimientoKey = `cumplimiento_${dia}_${idVendedor}_${fechaAUsar}`;
      const datosCumplimiento = localStorage.getItem(cumplimientoKey);
      let cumplimientoData = {};


      if (datosCumplimiento) {
        try {
          cumplimientoData = JSON.parse(datosCumplimiento);
        } catch (error) {
          console.error(`❌ Error parsing cumplimiento para ${idVendedor}:`, error);
        }
      } else {
      }

      // 🚀 NUEVO: Recopilar lotes de producción (solo desde ID1)
      let lotesProduccion = [];
      if (idVendedor === 'ID1') {
        const lotesKey = `lotes_${dia}_ID1_${fechaAUsar}`;
        const lotesData = localStorage.getItem(lotesKey);

        if (lotesData) {
          try {
            lotesProduccion = JSON.parse(lotesData);
          } catch (error) {
            console.error(`❌ Error parsing lotes para ${idVendedor}:`, error);
          }
        } else {
        }
      }

      const datosParaGuardar = {
        dia_semana: dia,
        vendedor_id: idVendedor,
        fecha: fechaAUsar,
        responsable: responsableReal,
        pagos: pagosData,
        resumen: resumenData,
        cumplimiento: cumplimientoData,
        lotes_produccion: lotesProduccion, // 🚀 NUEVO: Agregar lotes de producción
        productos: productosParaGuardar.map(p => ({
          producto_nombre: p.producto,
          cantidad: p.cantidad || 0,
          dctos: p.dctos || 0,
          adicional: p.adicional || 0,
          devoluciones: p.devoluciones || 0,
          vencidas: p.vencidas || 0,
          lotes_vencidos: p.lotesVencidos || [],
          valor: p.valor || 0,
          vendedor: p.vendedor || false,
          despachador: p.despachador || false
        }))
      };


      const resultado = await cargueService.guardarCargueCompleto(datosParaGuardar);

      if (resultado.error) {
        console.error(`❌ Error enviando datos de ${idVendedor}:`, resultado.message);
        throw new Error(`Error guardando datos de ${idVendedor}: ${resultado.message}`);
      }

      return true;
    } catch (error) {
      console.error(`❌ Error guardando datos de ${idVendedor}:`, error);
      throw error;
    }
  };

  // Guardar todos los datos en la base de datos usando el contexto como fuente de verdad (FUNCIÓN ORIGINAL - mantener para compatibilidad)
  // 🆕 MODIFICADO: Con sincronización en tiempo real, los datos ya están en BD
  // Esta función ahora solo hace una verificación final y guarda datos pendientes
  const guardarDatosCompletos = async (fechaAUsar, idsVendedores) => {
    try {



      // 🆕 Verificar si hay datos pendientes de sincronizar en localStorage
      const { simpleStorage } = await import('../../services/simpleStorage');

      for (const id of idsVendedores) {
        const key = `cargue_${dia}_${id}_${fechaAUsar}`;
        const datosLocal = await simpleStorage.getItem(key);

        if (datosLocal && datosLocal.sincronizado === false) {
          // Hay datos pendientes de sincronizar, guardarlos
          try {
            await guardarDatosDelID(fechaAUsar, id);
          } catch (error) {
            console.error(`❌ Error guardando ${id}:`, error);
          }
        } else {
        }
      }


      return true;
    } catch (error) {
      console.error('❌ Error en verificación final:', error);
      throw error;
    }
  };

  // Función original mantenida para referencia
  const guardarDatosCompletosOriginal = async (fechaAUsar, idsVendedores) => {
    try {





      // Debug detallado de cada vendedor
      idsVendedores.forEach(id => {
        const datos = datosVendedores[id];
        if (datos && datos.productos) {
        }
      });

      const { cargueService } = await import('../../services/cargueService');

      // 1. Guardar datos de cada ID directamente desde el contexto (NO desde localStorage)
      for (const id of idsVendedores) {
        // Obtiene los datos del vendedor directamente del contexto
        const productosDelVendedor = datosVendedores[id];


        if (productosDelVendedor && Array.isArray(productosDelVendedor) && productosDelVendedor.length > 0) {
          // Filtrar solo productos que tienen datos relevantes
          const productosParaGuardar = productosDelVendedor.filter(p =>
            p.cantidad > 0 || p.dctos > 0 || p.adicional > 0 ||
            p.devoluciones > 0 || p.vencidas > 0 || p.vendedor || p.despachador
          );

          // Solo guardar si hay productos con datos
          if (productosParaGuardar.length > 0) {
            // 🚀 MEJORADO: Obtener responsable real con verificación exhaustiva
            const { responsableStorage } = await import('../../utils/responsableStorage');

            // 🔍 DEBUG DETALLADO: Verificar múltiples fuentes de responsable

            // Método 1: responsableStorage
            const responsableRS = responsableStorage.get(id);

            // Método 2: localStorage directo
            const responsableLS = localStorage.getItem(`responsable_${id}`);

            // Método 3: localStorage alternativo
            const responsableAlt = localStorage.getItem(`cargue_responsable_${id}`);

            // Método 4: responsables_cargue
            const responsablesCargue = localStorage.getItem('responsables_cargue');
            let responsableFromCargue = null;
            if (responsablesCargue) {
              try {
                const parsed = JSON.parse(responsablesCargue);
                responsableFromCargue = parsed[id];
              } catch (error) {
              }
            } else {
            }

            // Método 5: Desde los datos del cargue actual
            const keyDatosCargue = `cargue_${dia}_${id}_${fechaAUsar}`;
            const datosCargue = localStorage.getItem(keyDatosCargue);
            let responsableFromDatos = null;
            if (datosCargue) {
              try {
                const parsed = JSON.parse(datosCargue);
                responsableFromDatos = parsed.responsable;
              } catch (error) {
              }
            }

            // Determinar el responsable real usando prioridad mejorada
            let responsableReal = 'RESPONSABLE';

            // Prioridad: datos del cargue > responsableStorage > localStorage directo > alternativo > cargue general
            if (responsableFromDatos && responsableFromDatos !== 'RESPONSABLE' && responsableFromDatos.trim() !== '') {
              responsableReal = responsableFromDatos.trim();
            } else if (responsableRS && responsableRS !== 'RESPONSABLE' && responsableRS.trim() !== '') {
              responsableReal = responsableRS.trim();
            } else if (responsableLS && responsableLS !== 'RESPONSABLE' && responsableLS.trim() !== '') {
              responsableReal = responsableLS.trim();
            } else if (responsableAlt && responsableAlt !== 'RESPONSABLE' && responsableAlt.trim() !== '') {
              responsableReal = responsableAlt.trim();
            } else if (responsableFromCargue && responsableFromCargue !== 'RESPONSABLE' && responsableFromCargue.trim() !== '') {
              responsableReal = responsableFromCargue.trim();
            } else {
            }


            // 🚀 CORREGIDO: RECOPILAR DATOS DE PAGOS específicos del ID
            const conceptosKey = `conceptos_pagos_${dia}_${id}_${fechaAUsar}`;
            const datosConceptos = localStorage.getItem(conceptosKey);
            let pagosData = {};


            if (datosConceptos) {
              try {
                const conceptos = JSON.parse(datosConceptos);

                // Sumar todos los conceptos para obtener totales
                pagosData = {
                  concepto: conceptos.filter(c => c.concepto).map(c => c.concepto).join(', ') || '',
                  descuentos: conceptos.reduce((sum, c) => sum + (parseFloat(c.descuentos) || 0), 0),
                  nequi: conceptos.reduce((sum, c) => sum + (parseFloat(c.nequi) || 0), 0),
                  daviplata: conceptos.reduce((sum, c) => sum + (parseFloat(c.daviplata) || 0), 0)
                };
              } catch (error) {
                console.error(`❌ Error parsing conceptos para ${id}:`, error);
              }
            } else {
            }

            // 🚀 CORREGIDO: RECOPILAR DATOS DE BASE CAJA específica del ID
            const baseCajaKey = `base_caja_${dia}_${id}_${fechaAUsar}`;
            const datosBaseCaja = localStorage.getItem(baseCajaKey);
            const baseCaja = datosBaseCaja ? parseFloat(datosBaseCaja) || 0 : 0;


            // 🚀 CORREGIDO: CALCULAR TOTALES DE RESUMEN correctamente
            const totalProductos = productosParaGuardar.reduce((sum, p) => sum + ((p.total || 0) * (p.valor || 0)), 0);
            const totalDctos = productosParaGuardar.reduce((sum, p) => sum + ((p.dctos || 0) * (p.valor || 0)), 0);

            // Calcular VENTA y TOTAL EFECTIVO correctamente
            const ventaCalculada = totalProductos - totalDctos - (pagosData.descuentos || 0);
            const totalEfectivoCalculado = ventaCalculada - (pagosData.nequi || 0) - (pagosData.daviplata || 0);

            const resumenData = {
              base_caja: baseCaja,
              total_despacho: totalProductos,
              total_pedidos: 0, // Se puede calcular si es necesario
              total_dctos: totalDctos + (pagosData.descuentos || 0), // Incluir descuentos de pagos
              venta: ventaCalculada,
              total_efectivo: totalEfectivoCalculado
            };


            // 🚀 RECOPILAR DATOS DE CUMPLIMIENTO desde localStorage
            const datosCumplimiento = localStorage.getItem(`cumplimiento_${dia}_${id}_${fechaAUsar}`);
            let cumplimientoData = {};
            if (datosCumplimiento) {
              try {
                cumplimientoData = JSON.parse(datosCumplimiento);
              } catch (error) {
                console.error(`❌ Error parsing cumplimiento para ${id}:`, error);
              }
            }

            const datosParaGuardar = {
              dia_semana: dia,
              vendedor_id: id,
              fecha: fechaAUsar,
              responsable: responsableReal, // ✅ Usar responsable real
              pagos: pagosData, // ✅ Incluir datos de pagos
              resumen: resumenData, // ✅ Incluir datos de resumen
              cumplimiento: cumplimientoData, // ✅ Incluir datos de cumplimiento
              productos: productosParaGuardar.map(p => ({
                producto_nombre: p.producto,
                cantidad: p.cantidad || 0,
                dctos: p.dctos || 0,
                adicional: p.adicional || 0,
                devoluciones: p.devoluciones || 0,
                vencidas: p.vencidas || 0,
                lotes_vencidos: p.lotesVencidos || [],
                valor: p.valor || 0,
                // 'total' y 'neto' se calculan en el backend, no es necesario enviarlos
                vendedor: p.vendedor || false,
                despachador: p.despachador || false
              }))
            };


            const resultado = await cargueService.guardarCargueCompleto(datosParaGuardar);

            if (resultado.error) {
              console.error(`❌ Error enviando datos de ${id}:`, resultado.message);
              throw new Error(`Error guardando datos de ${id}: ${resultado.message}`);
            }

          } else {
          }
        } else {
        }
      }

      // 2. Guardar datos de BASE CAJA y RESUMEN (mantener desde localStorage ya que estos no están en el contexto)
      const datosBaseCaja = localStorage.getItem(`base_caja_${dia}_${fechaAUsar}`);
      const datosConceptos = localStorage.getItem(`conceptos_pagos_${dia}_${fechaAUsar}`);

      if (datosBaseCaja || datosConceptos) {
        const resumenData = {
          dia_semana: `${dia}_RESUMEN`,
          vendedor_id: 'BASE_CAJA',
          fecha: fechaAUsar,
          responsable: 'SISTEMA_RESUMEN',
          datos_adicionales: {
            base_caja: datosBaseCaja ? JSON.parse(datosBaseCaja) : {},
            conceptos_pagos: datosConceptos ? JSON.parse(datosConceptos) : []
          }
        };

        await cargueService.guardarResumen(resumenData);

      }

      // 3. Guardar datos de PRODUCCIÓN (mantener desde localStorage ya que estos no están en el contexto)
      const datosProduccion = localStorage.getItem(`produccion_${dia}_${fechaAUsar}`);
      if (datosProduccion) {
        const produccionData = JSON.parse(datosProduccion);
        await cargueService.guardarCargue({
          dia_semana: `${dia}_PRODUCCION`,
          vendedor_id: 'PRODUCCION',
          fecha: fechaAUsar,
          responsable: 'SISTEMA_PRODUCCION',
          productos: produccionData.productos || []
        });

      }

      return true;
    } catch (error) {
      console.error('❌ Error guardando datos completos desde el contexto:', error);
      throw error;
    }
  };

  const normalizarFechaStorage = (fecha) => {
    if (fecha instanceof Date) {
      return fecha.toISOString().split('T')[0];
    }
    return fecha || '';
  };

  // 🚀 NUEVA FUNCIÓN: Limpiar localStorage de un ID específico
  const limpiarLocalStorageDelID = (fechaAUsar, idVendedor) => {
    try {
      const fechaStorage = normalizarFechaStorage(fechaAUsar);

      // Limpiar datos del ID específico
      const key = `cargue_${dia}_${idVendedor}_${fechaStorage}`;
      localStorage.removeItem(key);

      // Limpiar cambios pendientes de columnas editables offline
      const pendingKey = `cargue_pending_${dia}_${idVendedor}_${fechaStorage}`;
      localStorage.removeItem(pendingKey);

      const despachadorOverridesKey = `cargue_despachador_overrides_${dia}_${idVendedor}_${fechaStorage}`;
      localStorage.removeItem(despachadorOverridesKey);

      const resumenPendingKey = `resumen_pending_${dia}_${idVendedor}_${fechaStorage}`;
      localStorage.removeItem(resumenPendingKey);

      const cumplimientoPendingKey = `cumplimiento_pending_${dia}_${idVendedor}_${fechaStorage}`;
      localStorage.removeItem(cumplimientoPendingKey);

      const lotesPendingKey = `lotes_pending_${dia}_${idVendedor}_${fechaStorage}`;
      localStorage.removeItem(lotesPendingKey);

      // Limpiar cumplimiento específico del ID
      const cumplimientoKey = `cumplimiento_${dia}_${idVendedor}_${fechaStorage}`;
      localStorage.removeItem(cumplimientoKey);

      // 🚀 CORREGIDO: Limpiar conceptos específicos del ID
      const conceptosKey = `conceptos_pagos_${dia}_${idVendedor}_${fechaStorage}`;
      localStorage.removeItem(conceptosKey);

      // 🚀 CORREGIDO: Limpiar base caja específica del ID
      const baseCajaKey = `base_caja_${dia}_${idVendedor}_${fechaStorage}`;
      localStorage.removeItem(baseCajaKey);

      const lotesKey = `lotes_${dia}_${idVendedor}_${fechaStorage}`;
      localStorage.removeItem(lotesKey);

    } catch (error) {
      console.error(`❌ Error limpiando localStorage de ${idVendedor}:`, error);
    }
  };

  // Limpiar localStorage después de guardar (FUNCIÓN ORIGINAL - mantener para compatibilidad)
  const limpiarLocalStorage = (fechaAUsar, idsVendedores) => {
    try {
      const fechaStorage = normalizarFechaStorage(fechaAUsar);


      // Limpiar datos de cada ID usando funciones específicas
      for (const id of idsVendedores) {
        limpiarLocalStorageDelID(fechaStorage, id);
      }

      // Limpiar datos adicionales
      const clavesALimpiar = [
        `estado_boton_${dia}_${fechaStorage}`,
        `estado_despacho_${dia}_${fechaStorage}`,
        `produccion_congelada_${dia}_${fechaStorage}`,
        `produccion_${dia}_${fechaStorage}`,

        // 🚀 CORREGIDO: Limpiar conceptos específicos por ID
        `conceptos_pagos_${dia}_ID1_${fechaStorage}`,
        `conceptos_pagos_${dia}_ID2_${fechaStorage}`,
        `conceptos_pagos_${dia}_ID3_${fechaStorage}`,
        `conceptos_pagos_${dia}_ID4_${fechaStorage}`,
        `conceptos_pagos_${dia}_ID5_${fechaStorage}`,
        `conceptos_pagos_${dia}_ID6_${fechaStorage}`,
        // 🚀 CORREGIDO: Limpiar base caja específica por ID
        `base_caja_${dia}_ID1_${fechaStorage}`,
        `base_caja_${dia}_ID2_${fechaStorage}`,
        `base_caja_${dia}_ID3_${fechaStorage}`,
        `base_caja_${dia}_ID4_${fechaStorage}`,
        `base_caja_${dia}_ID5_${fechaStorage}`,
        `base_caja_${dia}_ID6_${fechaStorage}`,
        // ✅ Limpiar datos de cumplimiento para todos los IDs
        `cumplimiento_${dia}_ID1_${fechaStorage}`,
        `cumplimiento_${dia}_ID2_${fechaStorage}`,
        `cumplimiento_${dia}_ID3_${fechaStorage}`,
        `cumplimiento_${dia}_ID4_${fechaStorage}`,
        `cumplimiento_${dia}_ID5_${fechaStorage}`,
        `cumplimiento_${dia}_ID6_${fechaStorage}`
      ];

      clavesALimpiar.forEach(clave => {
        localStorage.removeItem(clave);
      });


    } catch (error) {
      console.error('❌ Error limpiando localStorage:', error);
    }
  };

  // 🚀 NUEVA FUNCIÓN: Validar lotes vencidos de un ID específico
  const validarLotesVencidosDelID = async (fechaAUsar, idVendedor) => {
    try {

      const { simpleStorage } = await import('../../services/simpleStorage');
      const key = `cargue_${dia}_${idVendedor}_${fechaAUsar}`;
      const datos = await simpleStorage.getItem(key);

      const productosConVencidasSinLotes = [];

      if (datos && datos.productos) {
        for (const producto of datos.productos) {
          if (producto.vencidas > 0) {
            const lotesVencidos = producto.lotesVencidos || [];
            const lotesCompletos = lotesVencidos.filter(lote =>
              lote.lote && lote.lote.trim() !== '' &&
              lote.motivo && lote.motivo.trim() !== ''
            );

            if (lotesCompletos.length === 0) {
              productosConVencidasSinLotes.push({
                id: idVendedor,
                producto: producto.producto,
                vencidas: producto.vencidas
              });
            }
          }
        }
      }

      if (productosConVencidasSinLotes.length > 0) {

        const mensaje = `❌ ${idVendedor} - No se puede finalizar\n\nLos siguientes productos tienen vencidas pero no tienen información de lotes:\n\n${productosConVencidasSinLotes.map(p =>
          `• ${p.producto} (${p.vencidas} vencidas)`
        ).join('\n')
          }\n\nPor favor complete la información de lotes vencidos antes de finalizar.`;

        alert(mensaje);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`❌ Error validando lotes vencidos de ${idVendedor}:`, error);
      alert(`❌ Error validando lotes vencidos de ${idVendedor}. No se puede finalizar.`);
      return false;
    }
  };

  // Validar lotes vencidos antes de finalizar (FUNCIÓN ORIGINAL - mantener para compatibilidad)
  // 🚀 VALIDACIÓN ROBUSTA: Consultar BD + LocalStorage para asegurar que no se escapen vencidas
  const validarLotesVencidos = async (fechaAUsar, idsVendedores) => {
    try {
      const { simpleStorage } = await import('../../services/simpleStorage');
      const productosConVencidasSinLotes = [];
      const productosAmbiguosSoloFvto = [];
      const endpointMap = {
        'ID1': 'cargue-id1', 'ID2': 'cargue-id2', 'ID3': 'cargue-id3',
        'ID4': 'cargue-id4', 'ID5': 'cargue-id5', 'ID6': 'cargue-id6'
      };

      for (const id of idsVendedores) {
        let productosAValidar = [];
        let origenDatos = 'LocalStorage';

        // 1. Intentar cargar verdad absoluta desde BD primero
        try {
          const endpoint = endpointMap[id];
          const res = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/${endpoint}/?fecha=${fechaAUsar}&dia=${dia}`);
          if (res.ok) {
            const dataDB = await res.json();
            if (dataDB && dataDB.length > 0) {
              productosAValidar = dataDB;
              origenDatos = 'Base de Datos';
            }
          }
        } catch (e) {
          console.warn(`⚠️ No se pudo validar BD para ${id}, usando LocalStorage`, e);
        }

        // 2. Si BD falló o está vacía, usar LocalStorage
        if (productosAValidar.length === 0) {
          const key = `cargue_${dia}_${id}_${fechaAUsar}`;
          const datosLS = await simpleStorage.getItem(key);
          if (datosLS && datosLS.productos) {
            productosAValidar = datosLS.productos;
          }
        }


        // 3. Validar cada producto
        for (const p of productosAValidar) {
          const vencidas = parseFloat(p.vencidas || 0);
          if (vencidas > 0) {
            // Verificar si tiene lotes en campo de BD (string)
            const tieneLotesBD = p.lotes_vencidos && p.lotes_vencidos.trim().length > 0 && p.lotes_vencidos !== 'undefined';

            // Verificar array local (si viene de LS o UI enriquecida)
            let lotesArray = Array.isArray(p.lotesVencidos) ? p.lotesVencidos : [];
            if ((!lotesArray || lotesArray.length === 0) && p.lotes_vencidos) {
              try {
                const parsed = typeof p.lotes_vencidos === 'string'
                  ? JSON.parse(p.lotes_vencidos)
                  : p.lotes_vencidos;
                if (Array.isArray(parsed)) {
                  lotesArray = parsed;
                }
              } catch (e) {
                // Compatibilidad con formato antiguo no JSON
                lotesArray = [];
              }
            }

            const lotesCompletos = lotesArray.filter(l =>
              String(l?.lote || '').trim() !== '' &&
              String(l?.motivo || '').trim() !== ''
            );
            const tieneLotesArray = lotesCompletos.length > 0;

            if (!tieneLotesBD && !tieneLotesArray) {
              productosConVencidasSinLotes.push({
                id: id,
                producto: p.producto,
                vencidas: vencidas
              });
              continue;
            }

            // 🆕 Alerta de posible olvido de novedades:
            // si solo hay FVTO y la cantidad de lotes FVTO es menor a vencidas reportadas.
            const lotesConMotivo = lotesCompletos.filter(l => String(l?.motivo || '').trim() !== '');
            const lotesFvto = lotesConMotivo.filter(
              l => String(l?.motivo || '').trim().toUpperCase() === 'FVTO'
            ).length;
            const lotesOtros = Math.max(0, lotesConMotivo.length - lotesFvto);

            if (lotesFvto > 0 && lotesOtros === 0 && lotesFvto < vencidas) {
              productosAmbiguosSoloFvto.push({
                id,
                producto: p.producto,
                vencidas: Number(vencidas),
                lotesFvto
              });
            }
          }
        }
      }

      if (productosConVencidasSinLotes.length > 0) {
        const mensaje = `❌ No se puede finalizar la jornada\n\nEl sistema ha detectado vencidas sin registrar lote (en Base de Datos o local):\n\n${productosConVencidasSinLotes.map(p =>
          `• ${p.id}: ${p.producto} (${p.vencidas} und)`
        ).join('\n')
          }\n\nPor favor vaya a la pestaña de "Vendidas", verifique los datos y asigne el lote correspondiente.`;

        alert(mensaje);
        return false;
      }

      if (productosAmbiguosSoloFvto.length > 0) {
        const mensajeAmbiguo = `⚠️ Validación de clasificación FVTO\n\n` +
          `Detectamos productos donde "VENCIDAS" es mayor al número de lotes FVTO y no hay otros motivos registrados.\n` +
          `Si continúas, el sistema asumirá que TODAS esas vencidas son FVTO.\n\n` +
          `${productosAmbiguosSoloFvto.map(p =>
            `• ${p.id}: ${p.producto} (vencidas=${p.vencidas}, lotes FVTO=${p.lotesFvto})`
          ).join('\n')}\n\n` +
          `¿Deseas continuar con esa interpretación?`;

        const confirmar = window.confirm(mensajeAmbiguo);
        if (!confirmar) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error crítico en validación de lotes:", error);
      alert("Error validando lotes. Revise consola.");
      return false;
    }
  };

  // 🚀 NUEVA FUNCIÓN: Manejar finalizar para un ID específico


  // 📥 HELPER: Cargar datos de cargue unificados (LocalStorage o BD) para un ID específico
  const cargarDatosCargue = async (fechaAUsar, vendedorId) => {
    const { simpleStorage } = await import('../../services/simpleStorage');

    // Formatear fecha
    let fechaFormateada;
    if (fechaAUsar instanceof Date) {
      fechaFormateada = fechaAUsar.toISOString().split('T')[0];
    } else {
      fechaFormateada = String(fechaAUsar).split('T')[0];
    }

    const key = `cargue_${dia}_${vendedorId}_${fechaFormateada}`;
    let datosCargue = await simpleStorage.getItem(key);


    // Si no está en LocalStorage, intentar BD
    if (!datosCargue || !datosCargue.productos || datosCargue.productos.length === 0) {
      try {
        const endpoint = vendedorId === 'ID1' ? 'cargue-id1' :
          vendedorId === 'ID2' ? 'cargue-id2' :
            vendedorId === 'ID3' ? 'cargue-id3' :
              vendedorId === 'ID4' ? 'cargue-id4' :
                vendedorId === 'ID5' ? 'cargue-id5' : 'cargue-id6';

        const url = `${API_URL}/${endpoint}/?fecha=${fechaFormateada}&dia=${dia.toUpperCase()}`;
        const response = await fetch(url);
        const datosDB = await response.json();

        if (Array.isArray(datosDB) && datosDB.length > 0) {
          datosCargue = {
            productos: datosDB.map(p => ({
              id: p.producto_id || p.id,
              producto: p.producto,
              cantidad: p.cantidad || 0,
              adicional: p.adicional || 0,
              total: p.total || 0,
              vencidas: p.vencidas || 0,
              devoluciones: p.devoluciones || 0,
              vendedor: p.v || p.vendedor || false,
              despachador: p.d || p.despachador || false
            }))
          };
        }
      } catch (e) {
        console.error(`❌ ${vendedorId} - Error Helper DB:`, e);
      }
    }

    // Si aun no hay datos
    if (!datosCargue || !datosCargue.productos) return null;

    // Calcular productosACargue (mapeo IDs reales)
    const productosACargue = [];

    // Necesitamos mapa de productos para IDs reales
    try {
      const prodRes = await fetch(`${API_URL}/productos/`);
      const todosProds = await prodRes.json();

      for (const p of datosCargue.productos) {
        if (p.vendedor && p.despachador && p.total > 0) {
          const pReal = todosProds.find(tp => tp.nombre.toUpperCase() === p.producto.toUpperCase());
          if (pReal) {
            productosACargue.push({
              id: pReal.id,
              nombre: p.producto,
              cantidad: p.total
            });
          }
        }
      }
    } catch (e) {
      console.error("Error mapeando productos en helper:", e);
    }

    datosCargue.productosACargue = productosACargue;
    return datosCargue;
  };

  // 🚀 LÓGICA DE CIERRE GLOBAL MULTIVENDEDOR
  const manejarFinalizarDelID = async () => {
    // alert("🛠️ DEBUG: Iniciando función manejarFinalizarDelID (GLOBAL V3)"); 
    if (!window.navigator.onLine) {
      alert("⚠️ No tienes conexión a internet. No se puede realizar el cierre de inventario.");
      return;
    }

    setLoading(true);
    try {
      // Usamos la fecha seleccionada globalmente
      let fechaAUsar = fechaSeleccionada;
      if (fechaSeleccionada instanceof Date) {
        fechaAUsar = fechaSeleccionada.toISOString().split('T')[0];
      }


      const IDS_VENDEDORES = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];

      // Variables acumuladoras GLOBALES
      let granTotalCargue = 0;
      let granTotalVencidas = 0;
      let granTotalDevoluciones = 0;

      let todosProductosACargue = [];
      let todosProductosVencidas = [];

      // ========== PASO 1: RECOPILAR DATOS DE TODOS LOS VENDEDORES ==========

      for (const vendedorId of IDS_VENDEDORES) {
        const datosVendedor = await cargarDatosCargue(fechaAUsar, vendedorId);

        if (datosVendedor && datosVendedor.productos) {
          // Obtener lista maestra de productos para mapear IDs
          // (Optimizacion: Podriamos cargarla una sola vez fuera del loop, pero por seguridad la pedimos o usamos caché)
          // Nota: cargarDatosCargue ya hace el mapeo interno de productos! 
          // Revisemos cargarDatosCargue... devuelve { productos: [...], productosACargue: [...] }

          // Acumular CARGUE (Ventas)
          if (datosVendedor.productosACargue) {
            todosProductosACargue = [...todosProductosACargue, ...datosVendedor.productosACargue];

            // Sumar al total
            const sumaVendedor = datosVendedor.productosACargue.reduce((acc, p) => acc + (p.cantidad || 0), 0);
            granTotalCargue += sumaVendedor;
          }

          // Acumular VENCIDAS y DEVOLUCIONES
          for (const prod of datosVendedor.productos) {
            if (prod.vencidas > 0 && prod.id) { // prod.id es el ID del PRODUCTO (ya mapeado en cargarDatosCargue)
              todosProductosVencidas.push({
                id: prod.id,
                nombre: prod.producto,
                cantidad: prod.vencidas,
                origen: vendedorId
              });
              granTotalVencidas += prod.vencidas;
            }
            if (prod.devoluciones > 0) {
              granTotalDevoluciones += prod.devoluciones;
            }
          }
        }
      }



      // ========== PASO 2: CALCULAR PEDIDOS (YA ES GLOBAL) ==========
      let totalPedidos = 0;
      let productosPedidosCalculados = [];

      // Filtro de pedidos (usa la lógica corregida anteriormente)
      const { pedidosAgrupados, pedidosIds } = await cargarPedidosPendientes(fechaAUsar);
      const productosPedidos = Object.values(pedidosAgrupados);

      if (productosPedidos.length > 0) {
        const productosResponse = await fetch(`${API_URL}/productos/`);
        const todosLosProductosAPI = await productosResponse.json();

        for (const pedido of productosPedidos) {
          const productoEnAPI = todosLosProductosAPI.find(p =>
            p.nombre.trim().toUpperCase() === pedido.nombre.trim().toUpperCase()
          );

          if (productoEnAPI) {
            productosPedidosCalculados.push({
              id: productoEnAPI.id,
              nombre: pedido.nombre,
              cantidad: pedido.cantidad
            });
            totalPedidos += pedido.cantidad;
          }
        }
      }


      // ========== 🆕 PREPARAR FUNCIÓN DE EJECUCIÓN (CLOSURE) ==========
      const ejecutarDescuentoReal = async () => {
        try {

          // 1. Descontar CARGUE GLOBAL
          for (const item of todosProductosACargue) {
            await actualizarInventario(item.id, item.cantidad, 'RESTAR');
          }

          // 2. Descontar PEDIDOS
          for (const item of productosPedidosCalculados) {
            await actualizarInventario(item.id, item.cantidad, 'RESTAR');
          }

          // 3. Descontar VENCIDAS
          for (const item of todosProductosVencidas) {
            await actualizarInventario(item.id, item.cantidad, 'RESTAR');
          }

          // 4. Marcar Pedidos como Entregados
          if (pedidosIds && pedidosIds.length > 0) {
            await marcarPedidosComoEntregados(pedidosIds);
          }

          // 5. CERRAR ESTADO PARA TODOS LOS VENDEDORES (Iterar)
          const fechaKeyForBD = fechaSeleccionada instanceof Date
            ? fechaSeleccionada.toISOString().split('T')[0]
            : fechaSeleccionada;

          for (const vendedorId of IDS_VENDEDORES) {
            try {
              await fetch(`${API_URL}/estado-cargue/actualizar/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  dia: dia,
                  fecha: fechaKeyForBD,
                  vendedor_id: vendedorId,
                  estado: 'COMPLETADO'
                })
              });
              // Guardar localstorage también por si acaso
              localStorage.setItem(`estado_boton_${dia}_${vendedorId}_${fechaFormateadaLS}`, 'COMPLETADO');
            } catch (err) {
              console.error(`❌ Error cerrando ${vendedorId}:`, err);
            }
          }

          // Guardar global
          localStorage.setItem(`estado_boton_${dia}_${fechaKeyForBD}`, 'COMPLETADO');

          setEstado('COMPLETADO'); // Actualizar visualmente el botón actual

          // Modal de Éxito
          setSuccessModalData({
            titulo: '¡Cierre Global Exitoso!',
            mensaje: 'Se ha descontado el inventario de TODOS los vendedores y pedidos.',
            detalles: `✅ Ventas (Cargue): ${granTotalCargue} und\n✅ Pedidos: ${totalPedidos} und\n✅ Vencidas: ${granTotalVencidas} und\n\nEl turno ha sido cerrado para ID1 - ID6.`
          });
          setShowSuccessModal(true);

        } catch (error) {
          console.error(`❌ Error crítico en cierre global:`, error);
          alert(`Hubo un error en el proceso: ${error.message}`);
        } finally {
          setLoading(false);
        }
      };

      // 🆕 Preparar detalle completo para mostrar en el modal
      const detalleCompleto = [
        ...todosProductosACargue.map(p => ({ ...p, tipo: 'CARGUE' })),
        ...productosPedidosCalculados.map(p => ({ ...p, tipo: 'PEDIDO' })),
        ...todosProductosVencidas.map(p => ({ ...p, tipo: 'VENCIDA' }))
      ];

      // Ordenar por nombre
      detalleCompleto.sort((a, b) => a.nombre.localeCompare(b.nombre));

      // Guardar datos en el estado del modal y mostrarlo
      setDescuentoPreview({
        totalCargue: granTotalCargue,
        totalPedidos: totalPedidos,
        totalVencidas: granTotalVencidas,
        totalDevoluciones: granTotalDevoluciones,
        ejecutarDescuento: ejecutarDescuentoReal,
        detalle: detalleCompleto // 🆕 Pasamos el detalle
      });

      // ⚠️ VALIDACIÓN: Si hay vencidas, preguntar por lotes ANTES de mostrar modal
      if (granTotalVencidas > 0) {
        const confirmarLotes = window.confirm(
          `⚠️ ATENCIÓN: Se detectaron ${granTotalVencidas} productos VENCIDOS.\n\n¿Ya ingresaste la información de los LOTES correspondientes en la columna "Lotes Vencidos"?\n\n• ACEPTAR: Sí, ya los ingresé. Continuar.\n• CANCELAR: No, quiero revisar primero.`
        );

        if (!confirmarLotes) {
          setLoading(false);
          return; // Salir sin mostrar modal
        }
      }

      setShowDescuentoConfirm(true);

    } catch (error) {
      console.error(`❌ Error general:`, error);
      alert(`Error iniciando proceso: ${error.message}`);
      setLoading(false);
    }
  };

  // Manejar finalizar (devoluciones, vencidas y guardado completo) - FUNCIÓN ORIGINAL - mantener para compatibilidad
  const manejarFinalizar = async () => {




    setLoading(true);

    try {
      // 🚀 NUEVO: Forzar guardado de datos actuales de la pantalla antes de procesar

      window.dispatchEvent(new CustomEvent('solicitarGuardado'));
      await new Promise(resolve => setTimeout(resolve, 500));

      // 🚀 CORREGIDO: Validar que fechaSeleccionada existe y no usar fallback a fecha actual
      if (!fechaSeleccionada) {
        console.error('❌ ERROR: fechaSeleccionada no está definida');
        alert('❌ Error: No se ha seleccionado una fecha válida');
        setLoading(false);
        return;
      }

      const { simpleStorage } = await import('../../services/simpleStorage');
      const fechaAUsar = fechaSeleccionada;
      const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];

      // 🎯 RECOPILAR DATOS PARA CONFIRMACIÓN ANTES de procesar
      let totalDevoluciones = 0;
      let totalVencidas = 0;
      let resumenDevoluciones = [];
      let resumenVencidas = [];

      // Recopilar datos de todos los IDs para mostrar en la confirmación
      const endpointMapRecoleccion = {
        'ID1': 'cargue-id1', 'ID2': 'cargue-id2', 'ID3': 'cargue-id3',
        'ID4': 'cargue-id4', 'ID5': 'cargue-id5', 'ID6': 'cargue-id6'
      };

      for (const id of idsVendedores) {
        let productos = [];

        // 1. Cargar LocalStorage
        const key = `cargue_${dia}_${id}_${fechaAUsar}`;
        const datos = await simpleStorage.getItem(key);
        if (datos && datos.productos) {
          productos = datos.productos;
        }

        // 2. Verificar BD para asegurar que no se nos escapen vencidas de la App Móvil
        // Si en local no vemos vencidas, preguntamos al servidor
        const vencidasLocal = productos.reduce((acc, p) => acc + (p.vencidas || 0), 0);

        if (vencidasLocal === 0) {
          try {
            const res = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/${endpointMapRecoleccion[id]}/?fecha=${fechaAUsar}&dia=${dia}`);
            if (res.ok) {
              const dbData = await res.json();
              if (dbData && dbData.length > 0) {
                const vencidasDB = dbData.reduce((acc, p) => acc + (p.vencidas || 0), 0);
                if (vencidasDB > 0) {
                  productos = dbData; // Usar datos de BD que están más actualizados
                }
              }
            }
          } catch (e) {
            console.warn(`⚠️ No se pudo verificar BD para recolección ${id}`, e);
          }
        }

        // Procesar productos (ya sea de Local o BD)
        for (const producto of productos) {
          if (producto.devoluciones > 0) {
            totalDevoluciones += producto.devoluciones;
            resumenDevoluciones.push(`${producto.producto}: ${producto.devoluciones} und (${id})`);
          }
          if (producto.vencidas > 0) {
            totalVencidas += producto.vencidas;
            resumenVencidas.push(`${producto.producto}: ${producto.vencidas} und (${id})`);
          }
        }
      }

      // 🚨 CONFIRMACIÓN: Abrir Modal en lugar de window.confirm

      // ⚠️ ADVERTENCIA DE USUARIO: Si hay vencidas, preguntar por Lotes antes de continuar
      if (totalVencidas > 0) {
        const confirmarLotes = window.confirm(
          `⚠️ ATENCIÓN: Se han detectado ${totalVencidas} productos vencidos.\n\n¿Confirmas que ya ingresaste la información de los LOTES correspondientes?\n\n- ACEPTAR: Sí, ya los ingresé. Continuar.\n- CANCELAR: No, quiero revisar primero.`
        );

        if (!confirmarLotes) {
          setLoading(false);
          return;
        }
      }


      setConfirmModalData({
        totalDevoluciones,
        totalVencidas,
        resumenDevoluciones,
        resumenVencidas
      });
      setShowConfirmModal(true);
      setLoading(false); // Detener loading mientras confirma
      return;

    } catch (error) {
      console.error('❌ Error preparando finalización:', error);
      alert(`❌ Error: ${error.message}`);
      setLoading(false);
    }
  };

  // 🚀 NUEVA FUNCIÓN: Ejecutar finalización después de confirmar en el modal
  const ejecutarFinalizacion = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      // Recalcular variables necesarias (ya que es un nuevo scope)
      const { simpleStorage } = await import('../../services/simpleStorage');
      const fechaAUsar = fechaSeleccionada;
      const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];



      /*
      // VALIDACIÓN PREVIA ESTRICTA DESHABILITADA (Reemplazada por confirmación de usuario)
      const lotesValidos = await validarLotesVencidos(fechaAUsar, idsVendedores);
      if (!lotesValidos) {
        setLoading(false);
        return; 
      }
      */



      // Resetear contadores para el procesamiento real
      let totalDevoluciones = 0;
      let totalVencidas = 0;
      let totalVendidas = 0;
      let totalPedidos = 0;


      // ========== PASO 1: PROCESAR VENDIDAS, VENCIDAS Y DEVOLUCIONES ==========

      for (const id of idsVendedores) {
        const key = `cargue_${dia}_${id}_${fechaAUsar}`;
        const datos = await simpleStorage.getItem(key);

        if (datos && datos.productos) {
          for (const producto of datos.productos) {
            if (producto.id) {
              /* 
                 🚨 CORRECCIÓN IMPORTANTE:
                 No descontar nada aquí. El inventario ya se descontó (o se debe descontar) 
                 al momento del DESPACHO (Cargue completo).
                 
                 - Si descontamos VENDIDAS aquí -> Doble descuento (Cargue + Vendidas).
                 - Si descontamos VENCIDAS aquí -> Doble descuento (Cargue + Vencidas).
              */

              // 🔧 CORREGIDO: Las devoluciones NO afectan el inventario
              // El producto nunca salió realmente del almacén (ya está restado en el TOTAL)
              if (producto.devoluciones > 0) {
                totalDevoluciones += producto.devoluciones;
              }
            }
          }
        }
      }


      // ========== PASO 2: DESCONTAR PEDIDOS DEL INVENTARIO ==========

      const { pedidosAgrupados, pedidosIds } = await cargarPedidosPendientes(fechaSeleccionada);
      const productosPedidos = Object.values(pedidosAgrupados);

      if (productosPedidos.length > 0) {
        const productosResponse = await fetch(`${API_URL}/productos/`);
        const todosLosProductos = await productosResponse.json();

        for (const pedido of productosPedidos) {
          const productoEnAPI = todosLosProductos.find(p =>
            p.nombre.toUpperCase() === pedido.nombre.toUpperCase()
          );

          if (productoEnAPI) {
            await actualizarInventario(productoEnAPI.id, pedido.cantidad, 'RESTAR');
            totalPedidos += pedido.cantidad;
          }
        }

        // Marcar pedidos como entregados
        const { exitosos, errores } = await marcarPedidosComoEntregados(pedidosIds);
      }


      // PASO 3: Guardar todos los datos en la base de datos

      await guardarDatosCompletos(fechaAUsar, idsVendedores);

      // PASO 4: Limpiar localStorage

      limpiarLocalStorage(fechaAUsar, idsVendedores);

      // 🔒 Congelar producción al cambiar a COMPLETADO
      congelarProduccion('COMPLETADO');

      // PASO 5: Cambiar estado a COMPLETADO
      setEstado('COMPLETADO');
      // 🔥 IMPORTANTE: Convertir fecha a string YYYY-MM-DD para consistencia
      const fechaKey = fechaSeleccionada instanceof Date
        ? fechaSeleccionada.toISOString().split('T')[0]
        : fechaSeleccionada;
      localStorage.setItem(`estado_boton_${dia}_${fechaKey}`, 'COMPLETADO');


      // 🆕 Resumen actualizado
      alert(
        `✅ Jornada Finalizada y Guardada\n\n` +
        `📊 INVENTARIO ACTUALIZADO:\n` +
        `✅ Cargue: Ya descontado previamente\n` +
        `⬇️ Pedidos descontados: ${totalPedidos} und\n` +
        `📋 Devoluciones registradas: ${totalDevoluciones} und\n\n` +
        `💾 Datos guardados en base de datos\n` +
        `🧹 LocalStorage limpiado`
      );

    } catch (error) {
      console.error('❌ Error en finalización:', error);
      alert(`❌ Error en finalización: ${error.message}\n\nLos datos pueden no haberse guardado correctamente.`);
    }

    setLoading(false);
  };

  // 🆕 NUEVA FUNCIÓN: Manejar COMPLETAR (afecta inventario al final)
  const manejarCompletar = async () => {
    setLoading(true);

    try {
      const { simpleStorage } = await import('../../services/simpleStorage');

      if (!fechaSeleccionada) {
        alert('❌ Error: No se ha seleccionado una fecha válida');
        setLoading(false);
        return;
      }

      const fechaAUsar = fechaSeleccionada;
      const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];

      // 🆕 VALIDACIÓN DE LOTES VENCIDOS (tanto localStorage como BD)

      const endpointMapValidacion = {
        'ID1': 'cargue-id1',
        'ID2': 'cargue-id2',
        'ID3': 'cargue-id3',
        'ID4': 'cargue-id4',
        'ID5': 'cargue-id5',
        'ID6': 'cargue-id6'
      };

      const productosConVencidasSinLotes = [];

      for (const id of idsVendedores) {
        let productosAProcesar = [];

        // Intentar cargar de localStorage primero
        const key = `cargue_${dia}_${id}_${fechaAUsar}`;
        const datos = await simpleStorage.getItem(key);

        if (datos && datos.productos && datos.productos.length > 0) {
          productosAProcesar = datos.productos;
        } else {
          // Si no hay en localStorage, cargar desde BD
          try {
            const endpoint = endpointMapValidacion[id];
            const url = `${API_URL}/${endpoint}/?fecha=${fechaAUsar}&dia=${dia.toUpperCase()}`;
            const response = await fetch(url);
            if (response.ok) {
              const datosDB = await response.json();
              productosAProcesar = datosDB.map(p => ({
                producto: p.producto,
                vencidas: p.vencidas || 0,
                lotes_vencidos: p.lotes_vencidos || '',
                lotesVencidos: p.lotes_vencidos ? p.lotes_vencidos.split(',').filter(l => l.trim()).map(l => ({ lote: l.trim(), motivo: 'BD' })) : []
              }));
            }
          } catch (error) {
            console.error(`❌ Error cargando desde BD para validación: ${id}`, error);
          }
        }

        // Validar productos con vencidas
        for (const producto of productosAProcesar) {
          if (producto.vencidas > 0) {
            const lotesVencidos = producto.lotesVencidos || [];
            const tieneLotesEnBD = producto.lotes_vencidos && producto.lotes_vencidos.trim() !== '';

            // Verificar que tenga al menos un lote con información completa
            const lotesCompletos = lotesVencidos.filter(lote =>
              lote.lote && lote.lote.trim() !== '' &&
              lote.motivo && lote.motivo.trim() !== ''
            );

            if (lotesCompletos.length === 0 && !tieneLotesEnBD) {
              productosConVencidasSinLotes.push({
                id: id,
                producto: producto.producto,
                vencidas: producto.vencidas
              });
            }
          }
        }
      }

      if (productosConVencidasSinLotes.length > 0) {

        const mensaje = `❌ No se puede completar\n\nLos siguientes productos tienen vencidas pero no tienen información de lotes:\n\n${productosConVencidasSinLotes.map(p =>
          `• ${p.id}: ${p.producto} (${p.vencidas} vencidas)`
        ).join('\n')
          }\n\nPor favor complete la información de lotes vencidos antes de continuar.`;

        alert(mensaje);
        setLoading(false);
        return;
      }


      // Variables para resumen
      let totalCargueDescontado = 0;
      let totalPedidosDescontado = 0;
      let totalDevoluciones = 0;
      let totalVencidas = 0;
      let totalVendidas = 0;

      // ========== PASO 1: DESCONTAR CARGUE DEL INVENTARIO ==========
      // 🚨 CORRECCIÓN: NO descontar cargue aquí si venimos de un estado donde ya se descontó
      // Por ahora asumo que si llegamos aquí, ya se hizo el despacho.

      /* 
         BLOQUE ELIMINADO: Descuento de Cargue
         No se debe descontar el cargue aquí porque ya se hizo en el paso de Despacho.
         Si se descuenta aquí, se duplica.
      */

      // ========== PASO 2: DESCONTAR PEDIDOS DEL INVENTARIO ==========

      const { pedidosAgrupados, pedidosIds } = await cargarPedidosPendientes(fechaSeleccionada);
      const productosPedidos = Object.values(pedidosAgrupados);

      if (productosPedidos.length > 0) {
        const productosResponse = await fetch(`${API_URL}/productos/`);
        const todosLosProductos = await productosResponse.json();

        for (const pedido of productosPedidos) {
          const productoEnAPI = todosLosProductos.find(p =>
            p.nombre.toUpperCase() === pedido.nombre.toUpperCase()
          );

          if (productoEnAPI) {
            await actualizarInventario(productoEnAPI.id, pedido.cantidad, 'RESTAR');
            totalPedidosDescontado += pedido.cantidad;
          }
        }

        // Marcar pedidos como entregados
        const { exitosos, errores } = await marcarPedidosComoEntregados(pedidosIds);
      }


      //  ========== PASO 3: PROCESAR DEVOLUCIONES Y VENCIDAS ==========

      // 🆕 MEJORADO: Leer desde BD si localStorage está vacío
      const endpointMap = {
        'ID1': 'cargue-id1',
        'ID2': 'cargue-id2',
        'ID3': 'cargue-id3',
        'ID4': 'cargue-id4',
        'ID5': 'cargue-id5',
        'ID6': 'cargue-id6'
      };

      for (const id of idsVendedores) {
        const key = `cargue_${dia}_${id}_${fechaAUsar}`;
        let datos = await simpleStorage.getItem(key);
        let productosAProcesar = [];

        // Si hay datos en localStorage, usarlos
        if (datos && datos.productos && datos.productos.length > 0) {
          productosAProcesar = datos.productos;
        } else {
          // 🆕 Si no hay datos en localStorage, leer desde la BD
          try {
            const endpoint = endpointMap[id];
            const url = `${API_URL}/${endpoint}/?fecha=${fechaAUsar}&dia=${dia.toUpperCase()}`;
            const response = await fetch(url);
            if (response.ok) {
              const datosDB = await response.json();
              // Mapear productos de la BD a la estructura esperada
              productosAProcesar = datosDB.map(p => ({
                id: p.id,
                producto: p.producto,
                vendidas: p.vendidas || 0,
                vencidas: p.vencidas || 0,
                devoluciones: p.devoluciones || 0
              }));
            }
          } catch (error) {
            console.error(`❌ ${id} - Error cargando desde BD:`, error);
          }
        }

        // Procesar los productos (ya sea de localStorage o BD)
        for (const producto of productosAProcesar) {
          // Obtener ID del producto si no lo tiene
          let productoId = producto.id;
          if (!productoId && producto.producto) {
            // Buscar ID en la lista de productos
            try {
              const prodResponse = await fetch(`${API_URL}/productos/?search=${encodeURIComponent(producto.producto)}`);
              const prods = await prodResponse.json();
              const prodEncontrado = prods.find(p => p.nombre.toUpperCase() === producto.producto.toUpperCase());
              if (prodEncontrado) {
                productoId = prodEncontrado.id;
              }
            } catch (e) {
              console.error(`❌ Error buscando ID de producto: ${producto.producto}`);
            }
          }

          if (productoId) {
            /* 
               🚨 CORRECCIÓN FINAL:
               NO descontar ni vendidas ni vencidas aquí, porque ya se descontó el Cargue Total en Despacho.
            */

            // 🔧 CORREGIDO: Las devoluciones NO afectan el inventario
            // El producto nunca salió realmente del almacén (ya está restado en el TOTAL)
            if (producto.devoluciones > 0) {
              totalDevoluciones += producto.devoluciones;
            }
          } else {
            console.warn(`⚠️ Producto sin ID: ${producto.producto}`);
          }
        }
      }


      // ========== PASO 4: GUARDAR EN BD ==========
      await guardarDatosCompletos(fechaAUsar, idsVendedores);

      // ========== PASO 5: LIMPIAR LOCALSTORAGE ==========
      limpiarLocalStorage(fechaAUsar, idsVendedores);

      // ========== PASO 6: CAMBIAR A COMPLETADO ==========
      setEstado('COMPLETADO');
      const fechaKey = fechaSeleccionada instanceof Date
        ? fechaSeleccionada.toISOString().split('T')[0]
        : fechaSeleccionada;
      localStorage.setItem(`estado_boton_${dia}_${fechaKey}`, 'COMPLETADO');


      // Mostrar resumen
      alert(
        '✅ Jornada Completada\n\n' +
        `📦 Cargue descontado: ${totalCargueDescontado} und\n` +
        `📋 Pedidos descontados: ${totalPedidosDescontado} und\n` +
        `⬇️ Vendidas descontadas: ${totalVendidas} und\n` +
        `⬇️ Vencidas descontadas: ${totalVencidas} und\n` +
        `📋 Devoluciones registradas: ${totalDevoluciones} und (no afectan inventario)\n\n` +
        `💾 Datos guardados en BD\n` +
        `🧹 LocalStorage limpiado`
      );

    } catch (error) {
      console.error('❌ Error en COMPLETADO:', error);
      alert(`❌ Error: ${error.message}\n\nLos datos pueden no haberse guardado correctamente.`);
    }

    setLoading(false);
  };


  const manejarDespachoDelID = async () => {

    // Validación estricta: NO permitir avanzar si hay productos pendientes
    if (productosPendientes.length > 0) {
      const listaPendientes = productosPendientes.map(p => {
        const checksFaltantes = [];
        if (!p.vendedor) checksFaltantes.push('V');
        if (!p.despachador) checksFaltantes.push('D');

        return `• ${p.nombre} (${p.totalCantidad} und) - Faltan: ${checksFaltantes.join(', ')}`;
      }).join('\n');

      const confirmar = window.confirm(
        `❌ ${idSheet} - NO SE PUEDE REALIZAR EL DESPACHO\n\n` +
        `Los siguientes productos tienen cantidades pero NO están completamente verificados:\n\n` +
        `${listaPendientes}\n\n` +
        `🔧 SOLUCIÓN: Marque los checkboxes V (Vendedor) y D (Despachador) faltantes para todos los productos con cantidad.\n\n` +
        `⚠️ TODOS los productos con cantidad deben tener ambos checkboxes marcados antes de continuar.\n\n` +
        `✅ ACEPTAR: Volver a revisar y marcar checkboxes\n` +
        `❌ CANCELAR: Quedarse en esta pantalla`
      );

      if (confirmar) {
      } else {
      }

      return;
    }

    setLoading(true);

    try {

      /* 
        🚨 CORRECCIÓN CRÍTICA:
        NO descontar inventario aquí. El estado DESPACHO es solo transitorio.
        El inventario se descuenta UNA SOLA VEZ cuando se presiona el botón:
        DESPACHO → COMPLETADO
        
        Si descontamos aquí Y en Completado = DOBLE DESCUENTO ❌
      */

      // Cambiar estado a FINALIZAR para el ID específico (sin afectar inventario)
      setEstado('FINALIZAR');
      localStorage.setItem(`estado_despacho_${dia}_${idSheet}_${fechaFormateadaLS}`, 'DESPACHO');
      localStorage.setItem(`estado_boton_${dia}_${idSheet}_${fechaFormateadaLS}`, 'FINALIZAR');


      // Mostrar resumen SIN decir que se descontó
      const resumen = productosValidados.map(p => `${p.nombre}: ${p.totalCantidad} und`).join('\n');
      const totalGeneral = productosValidados.reduce((sum, p) => sum + p.totalCantidad, 0);

      let mensaje = `✅ ${idSheet} - Cambio a DESPACHO\n\n${resumen}\n\n📦 TOTAL PREPARADO: ${totalGeneral} unidades\n\n⚠️ El inventario se descontará al presionar FINALIZAR`;

      if (productosPendientes.length > 0) {
        const totalPendientes = productosPendientes.reduce((sum, p) => sum + p.totalCantidad, 0);
        mensaje += `\n\n⚠️ PRODUCTOS NO DESPACHADOS: ${productosPendientes.length} productos (${totalPendientes} unidades)`;
      }

      alert(mensaje);

    } catch (error) {
      console.error(`❌ ${idSheet} - Error en despacho:`, error);
      alert(`❌ ${idSheet} - Error en despacho: ${error.message}`);
    }

    setLoading(false);
  };

  const obtenerConfigBoton = () => {
    const listos = productosValidados;
    const pendientes = productosPendientes;

    switch (estado) {
      // 🗑️ Case SUGERIDO eliminado - Estado obsoleto
      // 🗑️ Case SUGERIDO eliminado - Estado obsoleto
      case 'ALISTAMIENTO_ACTIVO':
        return {
          texto: '📦 ALISTAMIENTO ACTIVO',
          variant: '', // 🛑 Sin variante Bootstrap para evitar conflictos de color
          disabled: listos.length === 0 || loading || pendientes.length > 0,
          customStyle: {
            backgroundColor: '#8B4513 !important', // Café FORZADO
            borderColor: '#8B4513 !important',
            color: 'white !important'
          },
          onClick: async () => {
            // ... (lógica existente)
            setLoading(true);
            try {
              if (productosPendientes.length > 0) {
                const listaPendientes = productosPendientes.map(p =>
                  `• ${p.nombre}: ${p.totalCantidad} und (V:${p.vendedor ? '✓' : '✗'} D:${p.despachador ? '✓' : '✗'})`
                ).join('\n');
                alert(`❌ NO SE PUEDE CONTINUAR\n\nFalta verificar:\n${listaPendientes}`);
                setLoading(false); return;
              }

              if (!window.confirm('¿Pasar a DESPACHO?')) { setLoading(false); return; }

              setEstado('DESPACHO');
              const fechaKey = fechaSeleccionada instanceof Date ? fechaSeleccionada.toISOString().split('T')[0] : fechaSeleccionada;
              localStorage.setItem(`estado_boton_${dia}_${fechaKey}`, 'DESPACHO');
              alert('✅ Estado cambiado a DESPACHO');
            } catch (error) { console.error(error); }
            setLoading(false);
          }
        };
      case 'DESPACHO':
        return {
          texto: '🚚 DESPACHO',
          variant: 'primary',
          disabled: loading,
          onClick: manejarFinalizarDelID, // ✅ Mantenemos la lógica conecta CORRECTAMENTE
          customStyle: {
            backgroundColor: '#0d2d4e',
            borderColor: '#0d2d4e',
            color: 'white'
          }
        };
      case 'COMPLETADO':
        return {
          texto: '🎉 COMPLETADO',
          variant: 'success',
          disabled: true,
          onClick: null
        };
      default:
        // Por defecto, asumimos que estamos en ALISTAMIENTO ACTIVO (Café) para no bloquear la operación
        return {
          texto: '📦 ALISTAMIENTO ACTIVO',
          variant: '', // 🛑 Sin variante para que gane el customStyle
          disabled: listos.length === 0 || loading || pendientes.length > 0,
          customStyle: {
            backgroundColor: '#8B4513 !important', // Café FORZADO
            borderColor: '#8B4513 !important',
            color: 'white !important'
          },
          onClick: async () => {
            setLoading(true);
            try {
              if (productosPendientes.length > 0) {
                // ... Lógica de validación (misma que ALISTAMIENTO_ACTIVO) ...
                const listaPendientes = productosPendientes.map(p =>
                  `• ${p.nombre}: ${p.totalCantidad} und (V:${p.vendedor ? '✓' : '✗'} D:${p.despachador ? '✓' : '✗'})`
                ).join('\n');
                alert(`❌ NO SE PUEDE CONTINUAR\n\nFalta verificar:\n${listaPendientes}`);
                setLoading(false); return;
              }

              if (!window.confirm('¿Pasar a DESPACHO?')) { setLoading(false); return; }

              setEstado('DESPACHO');
              const fechaKey = fechaSeleccionada instanceof Date ? fechaSeleccionada.toISOString().split('T')[0] : fechaSeleccionada;
              localStorage.setItem(`estado_boton_${dia}_${fechaKey}`, 'DESPACHO');
            } catch (error) { console.error(error); }
            setLoading(false);
          }
        };
    }
  };

  const config = obtenerConfigBoton();

  return (
    <div className="mt-3">
      <div className="d-flex justify-content-start">
        <Button
          variant={estado === 'DESPACHO' ? '' : config.variant}
          disabled={config.disabled}
          onClick={config.onClick}
          className={estado === 'DESPACHO' ? 'btn-despacho-custom' : ''}
          style={{
            minWidth: '150px',
            fontWeight: 'bold',
            ...(estado === 'DESPACHO' ? {
              backgroundColor: '#0d2d4e !important',
              borderColor: '#0d2d4e !important',
              color: 'white !important'
            } : {}),
            ...(config.customStyle || {}),
            opacity: 1 // Forzar opacidad al 100% para que se vea el color incluso disabled
          }}
        >
          {loading ? '⏳ Procesando...' : config.texto}
        </Button>
      </div>

      {/* Modal de Confirmación - ESTILO PREMIUM */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered backdrop="static" size="lg">
        <Modal.Header closeButton className="bg-dark text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <i className="bi bi-truck me-2"></i> Confirmar Finalización
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="text-center mb-4">
            <h5 className="fw-bold text-dark">¿Está seguro de finalizar la jornada?</h5>
            <p className="text-muted">Esta acción guardará todos los registros y cerrará el día.</p>
          </div>

          <div className="row g-3">
            {confirmModalData.totalDevoluciones > 0 && (
              <div className="col-12">
                <div className="card border-warning shadow-sm h-100">
                  <div className="card-body d-flex align-items-start">
                    <div className="bg-warning-subtle p-3 rounded-circle me-3 text-warning-emphasis">
                      <i className="bi bi-arrow-up-circle-fill fs-4"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold text-warning-emphasis mb-1">Devoluciones ({confirmModalData.totalDevoluciones} und)</h6>
                      <ul className="mb-0 ps-3 small text-muted">
                        {confirmModalData.resumenDevoluciones.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {confirmModalData.totalVencidas > 0 && (
              <div className="col-12">
                <div className="card border-danger shadow-sm h-100">
                  <div className="card-body d-flex align-items-start">
                    <div className="bg-danger-subtle p-3 rounded-circle me-3 text-danger-emphasis">
                      <i className="bi bi-trash-fill fs-4"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold text-danger-emphasis mb-1">Vencidas ({confirmModalData.totalVencidas} und)</h6>
                      <ul className="mb-0 ps-3 small text-muted">
                        {confirmModalData.resumenVencidas.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="col-12">
              <div className="card border-info shadow-sm">
                <div className="card-body d-flex align-items-center">
                  <div className="bg-info-subtle p-2 rounded-circle me-3 text-info-emphasis">
                    <i className="bi bi-database-check fs-5"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold text-info-emphasis mb-0">Resumen de Acción</h6>
                    <small className="text-muted">Se guardarán los datos en BD y se limpiará el dispositivo.</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-light border-top-0">
          <Button variant="outline-secondary" onClick={() => setShowConfirmModal(false)} className="px-4 rounded-pill">
            Cancelar
          </Button>
          <Button variant="dark" onClick={ejecutarFinalizacion} className="px-4 rounded-pill">
            ✅ Confirmar Finalización
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 🆕 Modal de CONFIRMACIÓN - DISEÑO MINIMALISTA PREMIUM CORREGIDO */}
      <Modal show={showDescuentoConfirm} onHide={() => setShowDescuentoConfirm(false)} centered backdrop="static" size="lg" scrollable={true} contentClassName="border-0 shadow-lg rounded-4 overflow-hidden">
        <Modal.Header className="border-0 pb-0 pt-4 px-5 bg-white flex-shrink-0">
          <div className="w-100 text-center">
            <div className="mb-2 mx-auto bg-warning-subtle text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
              <i className="bi bi-exclamation-lg fs-3"></i>
            </div>
            <Modal.Title className="fw-bold fs-4 text-dark">
              Confirmar Descuento
            </Modal.Title>
            <p className="text-secondary mt-1 mb-0 fw-light small">
              Verifique los movimientos antes de afectar el inventario
            </p>
          </div>
        </Modal.Header>

        <Modal.Body className="px-5 py-3 bg-white d-flex flex-column">
          <div className="bg-light rounded-4 p-3 mb-3 border border-light-subtle">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary small text-uppercase fw-bold"><i className="bi bi-box-seam me-2"></i>Cargue (Ventas)</span>
              <span className="fw-bold text-dark fs-5">{descuentoPreview.totalCargue}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary small text-uppercase fw-bold"><i className="bi bi-clipboard-check me-2"></i>Pedidos</span>
              <span className="fw-bold text-dark fs-5">{descuentoPreview.totalPedidos}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-secondary small text-uppercase fw-bold"><i className="bi bi-trash3 me-2"></i>Vencidas</span>
              <span className={`fw-bold fs-5 ${descuentoPreview.totalVencidas > 0 ? 'text-danger' : 'text-dark'}`}>{descuentoPreview.totalVencidas}</span>
            </div>

            {descuentoPreview.totalDevoluciones > 0 && (
              <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                <span className="text-muted small fst-italic"><i className="bi bi-arrow-return-left me-1"></i>Devoluciones (no descuenta)</span>
                <span className="text-muted small">{descuentoPreview.totalDevoluciones}</span>
              </div>
            )}
          </div>

          {/* 🆕 DETALLE DESGLOSADO POR PRODUCTO (FACTURA PROFORMA) */}
          <div className="bg-white rounded-3 border mb-3">
            <table className="table table-sm table-hover mb-0" style={{ fontSize: '0.85rem' }}>
              <thead className="table-light sticky-top">
                <tr>
                  <th className="ps-3">Producto</th>
                  <th className="text-center">Origen</th>
                  <th className="text-end pe-3">Cant.</th>
                </tr>
              </thead>
              <tbody>
                {descuentoPreview.detalle && descuentoPreview.detalle.length > 0 ? (
                  descuentoPreview.detalle.map((item, idx) => (
                    <tr key={idx}>
                      <td className="ps-3 text-truncate" style={{ maxWidth: '180px' }} title={item.nombre}>{item.nombre}</td>
                      <td className="text-center">
                        <span className={`badge rounded-pill ${item.tipo === 'CARGUE' ? 'text-bg-secondary' : item.tipo === 'PEDIDO' ? 'text-bg-primary' : 'text-bg-danger'}`} style={{ fontSize: '0.65em', width: '60px' }}>
                          {item.tipo}
                        </span>
                      </td>
                      <td className="text-end pe-3 fw-bold">{item.cantidad}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center text-muted py-3">No hay productos para descontar</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-center py-2">
            <p className="text-uppercase text-muted fw-bold x-small mb-0" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Total a Descontar</p>
            <h1 className="display-4 fw-bold text-dark mb-0 lh-1">
              {(descuentoPreview.totalCargue || 0) + (descuentoPreview.totalPedidos || 0) + (descuentoPreview.totalVencidas || 0)}
              <span className="fs-6 text-muted fw-normal ms-2 d-block d-sm-inline">unidades</span>
            </h1>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 px-5 pb-5 pt-2 d-flex justify-content-center gap-3 bg-white flex-shrink-0">
          <Button
            variant="light"
            size="lg"
            className="px-4 rounded-pill fw-bold text-secondary border hover-shadow"
            onClick={() => {
              setShowDescuentoConfirm(false);
              setLoading(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="dark"
            size="lg"
            className="px-5 rounded-pill fw-bold shadow hover-lift"
            onClick={async () => {
              setShowDescuentoConfirm(false);
              if (descuentoPreview.ejecutarDescuento) {
                await descuentoPreview.ejecutarDescuento();
              }
            }}
            style={{ backgroundColor: '#0d2d4e', borderColor: '#0d2d4e', minWidth: '200px' }}
          >
            Confirmar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Éxito - DISEÑO MINIMALISTA PREMIUM */}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered backdrop="static" size="md" contentClassName="border-0 shadow-lg rounded-4">
        <Modal.Body className="text-center p-5">
          <div className="mb-4 mx-auto bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
            <i className="bi bi-check-lg" style={{ fontSize: '3rem' }}></i>
          </div>

          <h2 className="fw-bold mb-2 text-dark">{successModalData.titulo}</h2>
          <p className="text-secondary mb-4">{successModalData.mensaje}</p>

          <div className="bg-light p-4 rounded-4 text-start mb-4 border border-light">
            <pre className="mb-0 text-secondary small" style={{ fontFamily: 'Inter, sans-serif', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {successModalData.detalles}
            </pre>
          </div>

          <Button
            variant="success"
            size="lg"
            className="w-100 rounded-pill fw-bold shadow-sm"
            onClick={() => setShowSuccessModal(false)}
          >
            Entendido
          </Button>
        </Modal.Body>
      </Modal>



      {/* Botón de verificar guardado - OCULTO (no se está usando)
      {idSheet === 'ID1' && estado === 'COMPLETADO' && (
        <VerificarGuardado dia={dia} fechaSeleccionada={fechaSeleccionada} />
      )}
      */}
    </div >
  );
};

export default BotonLimpiar;
