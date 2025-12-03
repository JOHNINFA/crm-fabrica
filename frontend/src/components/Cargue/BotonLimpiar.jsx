import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'react-bootstrap';
import VerificarGuardado from './VerificarGuardado';
import { useVendedores } from '../../context/VendedoresContext';

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

  // Obtener datos frescos del contexto de vendedores
  const { datosVendedores } = useVendedores();

  // 🚀 NUEVA FUNCIÓN: Verificar productos de un ID específico
  const verificarProductosDelID = async (idVendedor) => {
    try {
      const { simpleStorage } = await import('../../services/simpleStorage');

      if (!fechaSeleccionada) {
        console.warn(`⚠️ fechaSeleccionada no definida para ${idVendedor}`);
        return { listos: [], pendientes: [] };
      }

      const fechaAUsar = fechaSeleccionada;
      const key = `cargue_${dia}_${idVendedor}_${fechaAUsar}`;
      const datos = await simpleStorage.getItem(key);

      const productosListos = [];
      const productosPendientes = [];

      if (datos && datos.productos) {
        for (const producto of datos.productos) {
          // Debug: mostrar estado de checks para productos con total > 0
          if (producto.total > 0) {
            console.log(`🔍 ${idVendedor} - ${producto.producto}: Cantidad=${producto.cantidad}, Adicional=${producto.adicional}, V=${producto.vendedor}, D=${producto.despachador}, Total=${producto.total}`);
          }

          // 🚀 LÓGICA CORRECTA: Productos con TOTAL > 0 (cantidad + adicional) sin checkboxes completos
          if (producto.total > 0 && (!producto.vendedor || !producto.despachador)) {
            productosPendientes.push({
              id: producto.id,
              nombre: producto.producto,
              totalCantidad: producto.total, // Contar total (cantidad + adicional)
              vendedorId: idVendedor,
              vendedor: producto.vendedor,
              despachador: producto.despachador
            });
            console.log(`⚠️ ${idVendedor} PRODUCTO PENDIENTE: ${producto.producto} - Total: ${producto.total} - V:${producto.vendedor} D:${producto.despachador}`);
          }

          // 🚀 LÓGICA CORRECTA: Productos completamente listos (V=true, D=true, TOTAL>0)
          if (producto.vendedor && producto.despachador && producto.total > 0) {
            productosListos.push({
              id: producto.id,
              nombre: producto.producto,
              totalCantidad: producto.total // Contar total (cantidad + adicional)
            });
            console.log(`✅ ${idVendedor} PRODUCTO LISTO: ${producto.producto} - Total: ${producto.total}`);
          }
        }
      }

      return { listos: productosListos, pendientes: productosPendientes };
    } catch (error) {
      console.error(`Error verificando productos de ${idVendedor}:`, error);
      return { listos: [], pendientes: [] };
    }
  };

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
              console.log(`🔍 ${id} - ${producto.producto}: Cantidad=${producto.cantidad}, Adicional=${producto.adicional}, V=${producto.vendedor}, D=${producto.despachador}, Total=${producto.total}`);
            }

            // 🚀 LÓGICA CORRECTA: Productos con TOTAL > 0 (cantidad + adicional) sin checkboxes completos
            if (producto.total > 0 && (!producto.vendedor || !producto.despachador)) {
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
              console.log(`⚠️ PRODUCTO PENDIENTE: ${producto.producto} - Total: ${producto.total} - V:${producto.vendedor} D:${producto.despachador}`);
            }

            // 🚀 LÓGICA CORRECTA: Productos completamente listos (V=true, D=true, TOTAL>0)
            if (producto.vendedor && producto.despachador && producto.total > 0) {
              if (!todosLosProductos[producto.id]) {
                todosLosProductos[producto.id] = {
                  id: producto.id,
                  nombre: producto.producto,
                  totalCantidad: 0
                };
              }
              todosLosProductos[producto.id].totalCantidad += producto.total; // Contar total (cantidad + adicional)
              console.log(`✅ PRODUCTO LISTO: ${producto.producto} - Total: ${producto.total}`);
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

    const estadoGuardado = localStorage.getItem(`estado_boton_${dia}_${fechaFormateadaLS}`);
    if (estadoGuardado) {
      setEstado(estadoGuardado);
      console.log(`🔄 Estado global recuperado: ${estadoGuardado}`);
    }

    // También verificar si hay datos congelados
    const datosCongelados = localStorage.getItem(`produccion_congelada_${dia}_${fechaFormateadaLS}`);
    if (datosCongelados) {
      console.log('❄️ Datos de producción congelados encontrados');
    }
  }, [dia, fechaFormateadaLS, idSheet]);

  // 🚀 SOLO ID1 verifica productos de TODOS los IDs
  useEffect(() => {
    if (idSheet !== 'ID1') return;

    const verificarYAvanzar = async () => {
      const resultado = await verificarProductosListos();
      setProductosValidados(resultado.listos);
      setProductosPendientes(resultado.pendientes);

      console.log(`🔍 Verificación automática - Listos: ${resultado.listos.length}, Pendientes: ${resultado.pendientes.length}`);
    };

    verificarYAvanzar();

    // 🚀 VERIFICACIÓN EN TIEMPO REAL: Solo cuando está en ALISTAMIENTO_ACTIVO
    let interval;
    if (estado === 'ALISTAMIENTO_ACTIVO') {
      console.log('🔄 Iniciando verificación automática cada 2 segundos...');
      interval = setInterval(verificarYAvanzar, 2000); // Verificar cada 2 segundos
    }

    return () => {
      if (interval) {
        console.log('🛑 Deteniendo verificación automática');
        clearInterval(interval);
      }
    };
  }, [dia, fechaSeleccionada, idSheet, estado]);

  // 🚀 NUEVA FUNCIONALIDAD: Detectar cambios en datos de cargue para verificación inmediata
  useEffect(() => {
    if (idSheet !== 'ID1' || estado !== 'ALISTAMIENTO_ACTIVO') return;

    const handleCargueDataChange = async (e) => {
      console.log('🔥 Cambio detectado en datos de cargue, verificando productos...');

      const resultado = await verificarProductosListos();
      setProductosValidados(resultado.listos);
      setProductosPendientes(resultado.pendientes);

      console.log(`⚡ Verificación inmediata - Listos: ${resultado.listos.length}, Pendientes: ${resultado.pendientes.length}`);
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
      console.log(`❄️ ${estadoNombre} - Producción YA CONGELADA (manteniendo valores originales)`);
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
    console.log(`❄️ ${estadoNombre} - Producción CONGELADA POR PRIMERA VEZ`);
    console.log('Datos congelados:', datosParaCongelar);
  };

  // Función para actualizar inventario
  const actualizarInventario = async (productoId, cantidad, tipo) => {
    try {
      console.log(`🔥 API CALL - Producto ID: ${productoId}, Cantidad: ${cantidad}, Tipo: ${tipo}`);

      const cantidadFinal = tipo === 'SUMAR' ? cantidad : -cantidad;
      console.log(`🔥 Enviando al backend: cantidad = ${cantidadFinal}`);

      const response = await fetch(`http://localhost:8000/api/productos/${productoId}/actualizar_stock/`, {
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

      console.log(`🔥 Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Response error: ${errorText}`);
        throw new Error(`Error al actualizar inventario: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ API RESPONSE:`, result);
      console.log(`✅ Stock actualizado a: ${result.stock_actual}`);
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

      console.log('📋 Cargando pedidos PENDIENTES para fecha:', fechaFormateada);

      // 🔥 CARGAR TODOS LOS PEDIDOS y filtrar en el frontend (más seguro)
      const response = await fetch(`http://localhost:8000/api/pedidos/`);

      if (!response.ok) {
        console.warn('⚠️ No se pudieron cargar pedidos');
        return { pedidosAgrupados: {}, pedidosIds: [] };
      }

      const todosPedidos = await response.json();
      console.log(`📦 Total de pedidos en BD: ${todosPedidos.length}`);

      // 🔥 FILTRAR SOLO PEDIDOS PENDIENTES DE LA FECHA ESPECÍFICA
      const pedidosFiltrados = todosPedidos.filter(p => {
        const fechaEntrega = p.fecha_entrega ? p.fecha_entrega.split('T')[0] : null;
        const esPendiente = p.estado === 'PENDIENTE';
        const esFechaCorrecta = fechaEntrega === fechaFormateada;

        if (esFechaCorrecta && esPendiente) {
          console.log(`✅ Pedido incluido: ${p.numero || p.id} - Fecha: ${fechaEntrega} - Estado: ${p.estado}`);
        }

        return esPendiente && esFechaCorrecta;
      });

      console.log(`✅ Pedidos PENDIENTES para ${fechaFormateada}: ${pedidosFiltrados.length}`);

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
            console.log(`   📦 ${nombreProducto}: +${cantidad} (total: ${pedidosAgrupados[nombreProducto].cantidad})`);
          }
        }
      }

      console.log('📊 Productos agrupados de pedidos:', pedidosAgrupados);
      console.log(`📊 Total de pedidos a marcar como ENTREGADA: ${pedidosIds.length}`);

      return { pedidosAgrupados, pedidosIds };

    } catch (error) {
      console.error('❌ Error cargando pedidos:', error);
      return { pedidosAgrupados: {}, pedidosIds: [] };
    }
  };

  // 📋 NUEVA FUNCIÓN: Marcar pedidos como ENTREGADA
  const marcarPedidosComoEntregados = async (pedidosIds) => {
    try {
      console.log(`📦 Marcando ${pedidosIds.length} pedidos como ENTREGADA...`);

      let exitosos = 0;
      let errores = 0;

      for (const pedidoId of pedidosIds) {
        try {
          const response = await fetch(`http://localhost:8000/api/pedidos/${pedidoId}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ estado: 'ENTREGADA' })
          });

          if (response.ok) {
            exitosos++;
            console.log(`✅ Pedido ${pedidoId} marcado como ENTREGADA`);
          } else {
            errores++;
            console.error(`❌ Error marcando pedido ${pedidoId}`);
          }
        } catch (error) {
          errores++;
          console.error(`❌ Error en pedido ${pedidoId}:`, error);
        }
      }

      console.log(`✅ Pedidos actualizados: ${exitosos} exitosos, ${errores} errores`);
      return { exitosos, errores };

    } catch (error) {
      console.error('❌ Error marcando pedidos:', error);
      return { exitosos: 0, errores: pedidosIds.length };
    }
  };

  // 🔒 NUEVA FUNCIÓN: Guardar SOLICITADAS en Planeación
  const guardarSolicitadasEnPlaneacion = async () => {
    try {
      console.log('💾 GUARDANDO SOLICITADAS EN PLANEACIÓN...');

      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;

      // Obtener solicitadas desde todas las tablas de cargue
      const solicitadasMap = {};
      const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];

      for (const id of idsVendedores) {
        const response = await fetch(`http://localhost:8000/api/cargue-${id.toLowerCase()}/?fecha=${fechaFormateada}`);
        if (response.ok) {
          const cargueData = await response.json();
          cargueData.forEach(item => {
            const producto = item.producto_nombre || item.producto;
            const cantidad = item.cantidad || 0;

            if (!solicitadasMap[producto]) {
              solicitadasMap[producto] = 0;
            }
            solicitadasMap[producto] += cantidad;
          });
        }
      }

      console.log('📊 Solicitadas a guardar:', solicitadasMap);

      // 📸 GUARDAR SNAPSHOT (foto del momento) - Solo si NO existe ya
      // Verificar si ya hay snapshot guardado para este día
      const checkSnapshot = await fetch(`http://localhost:8000/api/planeacion/?fecha=${fechaFormateada}`);
      const snapshotExistente = checkSnapshot.ok ? await checkSnapshot.json() : [];

      if (snapshotExistente.length > 0) {
        console.log('📸 Snapshot ya existe para este día - NO se sobrescribe');
        return; // Salir sin guardar
      }

      console.log('📸 Guardando SNAPSHOT del día (primera vez)...');

      // Obtener existencias actuales desde api_stock
      const stockResponse = await fetch('http://localhost:8000/api/stock/');
      const stocks = stockResponse.ok ? await stockResponse.json() : [];
      const stockMap = {};
      stocks.forEach(s => {
        stockMap[s.producto_nombre] = s.cantidad_actual;
      });

      // Obtener pedidos del día
      const pedidosResponse = await fetch(`http://localhost:8000/api/pedidos/`);
      const todosPedidos = pedidosResponse.ok ? await pedidosResponse.json() : [];
      const pedidosFecha = todosPedidos.filter(p =>
        p.fecha_entrega && p.fecha_entrega.split('T')[0] === fechaFormateada && p.estado !== 'ANULADA'
      );

      const pedidosMap = {};
      pedidosFecha.forEach(pedido => {
        if (pedido.detalles) {
          pedido.detalles.forEach(detalle => {
            const nombre = detalle.producto_nombre;
            if (!pedidosMap[nombre]) pedidosMap[nombre] = 0;
            pedidosMap[nombre] += detalle.cantidad;
          });
        }
      });

      // Guardar snapshot para cada producto con datos
      const productosConDatos = new Set([
        ...Object.keys(solicitadasMap),
        ...Object.keys(pedidosMap)
      ]);

      for (const nombreProducto of productosConDatos) {
        const solicitadas = solicitadasMap[nombreProducto] || 0;
        const pedidos = pedidosMap[nombreProducto] || 0;
        const existencias = stockMap[nombreProducto] || 0;

        if (solicitadas > 0 || pedidos > 0) {
          const snapshot = {
            fecha: fechaFormateada,
            producto_nombre: nombreProducto,
            existencias: existencias,
            solicitadas: solicitadas,
            pedidos: pedidos,
            total: solicitadas + pedidos,
            orden: 0,
            ia: 0,
            usuario: 'Sistema'
          };

          const response = await fetch(`http://localhost:8000/api/planeacion/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(snapshot)
          });

          if (response.ok) {
            console.log(`📸 Snapshot guardado: ${nombreProducto} (S:${solicitadas}, P:${pedidos}, E:${existencias})`);
          } else {
            console.error(`❌ Error guardando snapshot de ${nombreProducto}`);
          }
        }
      }

      console.log('✅ SOLICITADAS GUARDADAS EN PLANEACIÓN');

    } catch (error) {
      console.error('❌ Error guardando solicitadas:', error);
    }
  };

  // 🔒 NUEVA FUNCIÓN: Congelar PEDIDOS en Planeación
  const congelarPedidosEnPlaneacion = async () => {
    try {
      console.log('❄️ CONGELANDO PEDIDOS EN PLANEACIÓN...');

      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;

      // Obtener pedidos actuales de la BD
      const response = await fetch(`http://localhost:8000/api/pedidos/`);
      if (!response.ok) {
        console.warn('⚠️ No se pudieron cargar pedidos para congelar');
        return;
      }

      const todosPedidos = await response.json();

      // Filtrar pedidos de esta fecha que no estén anulados
      const pedidosFecha = todosPedidos.filter(p =>
        p.fecha_entrega === fechaFormateada && p.estado !== 'ANULADA'
      );

      console.log(`📦 Pedidos encontrados para ${fechaFormateada}:`, pedidosFecha.length);

      // Agrupar pedidos por producto
      const pedidosMap = {};
      for (const pedido of pedidosFecha) {
        if (pedido.detalles && pedido.detalles.length > 0) {
          for (const detalle of pedido.detalles) {
            const nombreProducto = detalle.producto_nombre;
            if (!pedidosMap[nombreProducto]) {
              pedidosMap[nombreProducto] = 0;
            }
            pedidosMap[nombreProducto] += detalle.cantidad;
          }
        }
      }

      console.log('📊 Pedidos agrupados por producto:', pedidosMap);

      // Guardar/actualizar en api_planeacion con los pedidos congelados
      for (const [nombreProducto, cantidadPedidos] of Object.entries(pedidosMap)) {
        if (cantidadPedidos > 0) {
          // Verificar si ya existe un registro de planeación para este producto y fecha
          const planeacionResponse = await fetch(
            `http://localhost:8000/api/planeacion/?fecha=${fechaFormateada}&producto_nombre=${encodeURIComponent(nombreProducto)}`
          );

          let datosPlaneacion = {
            fecha: fechaFormateada,
            producto_nombre: nombreProducto,
            pedidos: cantidadPedidos,
            existencias: 0,
            solicitadas: 0,
            orden: 0,
            ia: 0
          };

          if (planeacionResponse.ok) {
            const planeacionExistente = await planeacionResponse.json();
            if (planeacionExistente.length > 0) {
              // Actualizar registro existente, manteniendo otros valores
              const registro = planeacionExistente[0];
              datosPlaneacion = {
                ...datosPlaneacion,
                existencias: registro.existencias || 0,
                solicitadas: registro.solicitadas || 0,
                orden: registro.orden || 0,
                ia: registro.ia || 0
              };
            }
          }

          // Guardar en BD
          await fetch(`http://localhost:8000/api/planeacion/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosPlaneacion)
          });

          console.log(`✅ Pedidos congelados para ${nombreProducto}: ${cantidadPedidos} und`);
        }
      }

      console.log('✅ PEDIDOS CONGELADOS EN PLANEACIÓN');

    } catch (error) {
      console.error('❌ Error congelando pedidos:', error);
    }
  };

  // 📸 NUEVA FUNCIÓN: Guardar snapshot de Planeación en tabla independiente
  const guardarSnapshotPlaneacion = async () => {
    try {
      console.log('📸 ========== GUARDANDO SNAPSHOT DE PLANEACIÓN ==========');

      if (!fechaSeleccionada) {
        console.error('❌ SNAPSHOT - fechaSeleccionada no definida');
        return;
      }

      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaFormateada = `${year}-${month}-${day}`;

      console.log(`📸 SNAPSHOT - Fecha: ${fechaFormateada}`);

      // 1. Obtener existencias actuales desde api_stock
      const stockResponse = await fetch('http://localhost:8000/api/stock/');
      const stocks = stockResponse.ok ? await stockResponse.json() : [];
      const stockMap = {};
      stocks.forEach(s => {
        stockMap[s.producto_nombre] = s.cantidad_actual;
      });

      // 2. Obtener solicitadas desde BD y localStorage (fallback)
      const solicitadasMap = {};
      const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];
      const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

      // Primero intentar desde BD
      let datosEncontradosEnBD = false;
      for (const id of idsVendedores) {
        const response = await fetch(`http://localhost:8000/api/cargue-${id.toLowerCase()}/?fecha=${fechaFormateada}`);
        if (response.ok) {
          const cargueData = await response.json();
          if (cargueData.length > 0) datosEncontradosEnBD = true;
          cargueData.forEach(item => {
            const producto = item.producto_nombre || item.producto;
            const cantidad = item.cantidad || 0;
            const adicional = item.adicional || 0;
            const dctos = item.dctos || 0;

            if (!solicitadasMap[producto]) {
              solicitadasMap[producto] = 0;
            }
            solicitadasMap[producto] += (cantidad + adicional + dctos);
          });
        }
      }

      // Si no hay datos en BD, buscar en localStorage
      if (!datosEncontradosEnBD) {
        console.log('📸 SNAPSHOT - No hay datos en BD, buscando en localStorage...');
        const { simpleStorage } = await import('../../services/simpleStorage');

        for (const diaActual of diasSemana) {
          for (const id of idsVendedores) {
            const key = `cargue_${diaActual}_${id}_${fechaFormateada}`;
            const datos = await simpleStorage.getItem(key);

            if (datos && datos.productos) {
              datos.productos.forEach(item => {
                const producto = item.producto;
                const cantidad = item.cantidad || 0;
                const adicional = item.adicional || 0;
                const dctos = item.dctos || 0;

                if (!solicitadasMap[producto]) {
                  solicitadasMap[producto] = 0;
                }
                solicitadasMap[producto] += (cantidad + adicional + dctos);
              });
            }
          }
        }
        console.log(`📸 SNAPSHOT - Solicitadas desde localStorage:`, Object.keys(solicitadasMap).length, 'productos');
      }

      // 3. Obtener pedidos del día
      const pedidosResponse = await fetch(`http://localhost:8000/api/pedidos/`);
      const todosPedidos = pedidosResponse.ok ? await pedidosResponse.json() : [];
      const pedidosFecha = todosPedidos.filter(p =>
        p.fecha_entrega && p.fecha_entrega.split('T')[0] === fechaFormateada && p.estado !== 'ANULADA'
      );

      const pedidosMap = {};
      pedidosFecha.forEach(pedido => {
        if (pedido.detalles) {
          pedido.detalles.forEach(detalle => {
            const nombre = detalle.producto_nombre;
            if (!pedidosMap[nombre]) pedidosMap[nombre] = 0;
            pedidosMap[nombre] += detalle.cantidad;
          });
        }
      });

      // 4. Obtener orden e IA desde api_planeacion (si existe)
      const planeacionResponse = await fetch(`http://localhost:8000/api/planeacion/?fecha=${fechaFormateada}`);
      const planeacionData = planeacionResponse.ok ? await planeacionResponse.json() : [];
      const planeacionMap = {};
      planeacionData.forEach(p => {
        planeacionMap[p.producto_nombre] = {
          orden: p.orden || 0,
          ia: p.ia || 0
        };
      });

      // 5. Construir registros para el snapshot
      const productosConDatos = new Set([
        ...Object.keys(stockMap),
        ...Object.keys(solicitadasMap),
        ...Object.keys(pedidosMap)
      ]);

      const registros = [];
      let orden = 0;

      for (const nombreProducto of productosConDatos) {
        const existencias = stockMap[nombreProducto] || 0;
        const solicitadas = solicitadasMap[nombreProducto] || 0;
        const pedidos = pedidosMap[nombreProducto] || 0;
        const planeacionInfo = planeacionMap[nombreProducto] || { orden: 0, ia: 0 };

        // Solo incluir productos con datos relevantes
        if (existencias > 0 || solicitadas > 0 || pedidos > 0) {
          registros.push({
            producto_nombre: nombreProducto,
            existencias: existencias,
            solicitadas: solicitadas,
            pedidos: pedidos,
            total: solicitadas + pedidos,
            orden: planeacionInfo.orden || orden++,
            ia: planeacionInfo.ia || 0
          });
        }
      }

      console.log(`📊 Registros a guardar: ${registros.length}`);

      // 6. Enviar al endpoint de snapshot
      const response = await fetch('http://localhost:8000/api/registros-planeacion-dia/guardar_snapshot/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: fechaFormateada,
          registros: registros,
          usuario: 'Sistema'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ SNAPSHOT GUARDADO: ${result.cantidad} registros para ${fechaFormateada}`);
      } else {
        const error = await response.text();
        console.error('❌ Error guardando snapshot:', error);
      }

    } catch (error) {
      console.error('❌ Error en guardarSnapshotPlaneacion:', error);
    }
  };

  // 🚀 NUEVA FUNCIÓN: Guardar datos de un ID específico
  const guardarDatosDelID = async (fechaAUsar, idVendedor) => {
    try {
      console.log(`💾 ${idVendedor} - GUARDANDO DATOS ESPECÍFICOS...`);
      console.log(`📅 ${idVendedor} - Fecha a usar: ${fechaAUsar}`);

      const { simpleStorage } = await import('../../services/simpleStorage');
      const { cargueService } = await import('../../services/cargueService');

      // Obtener datos desde localStorage del ID específico
      const key = `cargue_${dia}_${idVendedor}_${fechaAUsar}`;
      console.log(`🔑 ${idVendedor} - Buscando datos en key: ${key}`);

      // 🚀 MEJORADO: Intentar obtener de localStorage directamente primero
      let datos = null;
      const datosLocalString = localStorage.getItem(key);

      if (datosLocalString) {
        try {
          datos = JSON.parse(datosLocalString);
          console.log(`✅ ${idVendedor} - Datos encontrados en localStorage: ${datos.productos?.length || 0} productos`);
        } catch (parseError) {
          console.error(`❌ ${idVendedor} - Error parsing localStorage:`, parseError);
        }
      }

      // Si no hay datos en localStorage, intentar con simpleStorage
      if (!datos) {
        datos = await simpleStorage.getItem(key);
        console.log(`🔍 ${idVendedor} - Datos desde simpleStorage: ${datos?.productos?.length || 0} productos`);
      }

      if (!datos || !datos.productos) {
        console.log(`⚠️ ${idVendedor} - No hay datos para guardar (datos: ${JSON.stringify(datos)})`);
        return false;
      }

      console.log(`📊 ${idVendedor} - Total productos en datos: ${datos.productos.length}`);
      console.log(`📊 ${idVendedor} - Productos con cantidad > 0: ${datos.productos.filter(p => p.cantidad > 0).length}`);

      // Filtrar solo productos que tienen datos relevantes
      const productosParaGuardar = datos.productos.filter(p =>
        p.cantidad > 0 || p.dctos > 0 || p.adicional > 0 ||
        p.devoluciones > 0 || p.vencidas > 0 || p.vendedor || p.despachador
      );

      if (productosParaGuardar.length === 0) {
        console.log(`⚠️ ${idVendedor} - No hay productos con datos para guardar`);
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
        console.log(`✅ Responsable desde responsableStorage: "${responsableReal}"`);
      } else if (responsableLS && responsableLS !== 'RESPONSABLE' && responsableLS.trim() !== '') {
        responsableReal = responsableLS.trim();
        console.log(`✅ Responsable desde localStorage: "${responsableReal}"`);
      } else if (responsableFromDatos && responsableFromDatos !== 'RESPONSABLE' && responsableFromDatos.trim() !== '') {
        responsableReal = responsableFromDatos.trim();
        console.log(`✅ Responsable desde datos: "${responsableReal}"`);
      }

      // 🚀 NUEVO: Intentar obtener del contexto de vendedores si aún es el default
      if (responsableReal === 'RESPONSABLE' && datosVendedores && datosVendedores[idVendedor]) {
        const nombreContexto = datosVendedores[idVendedor].nombre;
        if (nombreContexto && nombreContexto.trim() !== '') {
          responsableReal = nombreContexto.trim();
          console.log(`✅ Responsable desde Contexto Vendedores: "${responsableReal}"`);
        }
      }

      console.log(`📝 ${idVendedor} - RESPONSABLE FINAL: "${responsableReal}"`);

      // 🚀 CORREGIDO: Recopilar datos de pagos específicos del ID
      const conceptosKey = `conceptos_pagos_${dia}_${idVendedor}_${fechaAUsar}`;
      const datosConceptos = localStorage.getItem(conceptosKey);
      let pagosData = {};

      console.log(`💰 ${idVendedor} - Buscando conceptos en: ${conceptosKey}`);

      if (datosConceptos) {
        try {
          const conceptos = JSON.parse(datosConceptos);
          console.log(`💰 ${idVendedor} - Conceptos encontrados:`, conceptos);

          pagosData = {
            concepto: conceptos.filter(c => c.concepto).map(c => c.concepto).join(', ') || '',
            descuentos: conceptos.reduce((sum, c) => sum + (parseFloat(c.descuentos) || 0), 0),
            nequi: conceptos.reduce((sum, c) => sum + (parseFloat(c.nequi) || 0), 0),
            daviplata: conceptos.reduce((sum, c) => sum + (parseFloat(c.daviplata) || 0), 0)
          };

          console.log(`💰 ${idVendedor} - Datos de pagos procesados:`, pagosData);
        } catch (error) {
          console.error(`❌ Error parsing conceptos para ${idVendedor}:`, error);
        }
      } else {
        console.log(`⚠️ ${idVendedor} - No se encontraron datos de conceptos en: ${conceptosKey}`);
      }

      // Calcular totales de resumen
      const totalProductos = productosParaGuardar.reduce((sum, p) => sum + ((p.total || 0) * (p.valor || 0)), 0);
      const totalDctos = productosParaGuardar.reduce((sum, p) => sum + ((p.dctos || 0) * (p.valor || 0)), 0);
      // 🚀 CORREGIDO: Buscar BASE CAJA específica del ID
      const baseCajaKey = `base_caja_${dia}_${idVendedor}_${fechaAUsar}`;
      const baseCaja = parseFloat(localStorage.getItem(baseCajaKey)) || 0;

      console.log(`💰 ${idVendedor} - Buscando base caja en: ${baseCajaKey} = ${baseCaja}`);

      // 🚀 CORREGIDO: Obtener TOTAL PEDIDOS del contexto
      const datosContexto = datosVendedores[idVendedor];
      const totalPedidos = datosContexto?.totalPedidos || 0;
      console.log(`📦 ${idVendedor} - Total Pedidos obtenido: ${totalPedidos}`);

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

      console.log(`💰 ${idVendedor} - Cálculos de resumen:`, {
        totalProductos,
        totalDctos,
        descuentosPagos: pagosData.descuentos || 0,
        ventaCalculada,
        nequi: pagosData.nequi || 0,
        daviplata: pagosData.daviplata || 0,
        totalEfectivoCalculado
      });

      // Recopilar datos de cumplimiento
      const cumplimientoKey = `cumplimiento_${dia}_${idVendedor}_${fechaAUsar}`;
      const datosCumplimiento = localStorage.getItem(cumplimientoKey);
      let cumplimientoData = {};

      console.log(`📋 ${idVendedor} - Buscando cumplimiento en: ${cumplimientoKey}`);

      if (datosCumplimiento) {
        try {
          cumplimientoData = JSON.parse(datosCumplimiento);
          console.log(`✅ ${idVendedor} - Cumplimiento encontrado:`, cumplimientoData);
        } catch (error) {
          console.error(`❌ Error parsing cumplimiento para ${idVendedor}:`, error);
        }
      } else {
        console.log(`⚠️ ${idVendedor} - No se encontraron datos de cumplimiento`);
      }

      // 🚀 NUEVO: Recopilar lotes de producción (solo desde ID1)
      let lotesProduccion = [];
      if (idVendedor === 'ID1') {
        const lotesKey = `lotes_${dia}_ID1_${fechaAUsar}`;
        const lotesData = localStorage.getItem(lotesKey);
        console.log(`📦 ${idVendedor} - Buscando lotes en: ${lotesKey}`);

        if (lotesData) {
          try {
            lotesProduccion = JSON.parse(lotesData);
            console.log(`✅ ${idVendedor} - Lotes de producción encontrados:`, lotesProduccion);
          } catch (error) {
            console.error(`❌ Error parsing lotes para ${idVendedor}:`, error);
          }
        } else {
          console.log(`⚠️ ${idVendedor} - No se encontraron lotes de producción en: ${lotesKey}`);
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

      console.log(`🚀 ${idVendedor} - Enviando datos a API:`, JSON.stringify(datosParaGuardar, null, 2));
      console.log(`📊 ${idVendedor} - Resumen de datos a guardar:`);
      console.log(`   - Productos: ${datosParaGuardar.productos.length}`);
      console.log(`   - Cumplimiento: ${Object.keys(datosParaGuardar.cumplimiento || {}).length} campos`);
      console.log(`   - Lotes producción: ${(datosParaGuardar.lotes_produccion || []).length}`);
      console.log(`   - Responsable: ${datosParaGuardar.responsable}`);

      const resultado = await cargueService.guardarCargueCompleto(datosParaGuardar);

      if (resultado.error) {
        console.error(`❌ Error enviando datos de ${idVendedor}:`, resultado.message);
        throw new Error(`Error guardando datos de ${idVendedor}: ${resultado.message}`);
      }

      console.log(`✅ ${idVendedor} - Datos enviados a la API exitosamente`);
      console.log(`📊 ${idVendedor} - Resultado:`, resultado);
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
      console.log('💾 VERIFICACIÓN FINAL DE DATOS...');
      console.log('📝 Nota: Con sincronización en tiempo real, los datos ya deberían estar en BD');

      // 🆕 Verificar si hay datos pendientes de sincronizar en localStorage
      const { simpleStorage } = await import('../../services/simpleStorage');

      for (const id of idsVendedores) {
        const key = `cargue_${dia}_${id}_${fechaAUsar}`;
        const datosLocal = await simpleStorage.getItem(key);

        if (datosLocal && datosLocal.sincronizado === false) {
          // Hay datos pendientes de sincronizar, guardarlos
          console.log(`⚠️ ${id} - Datos pendientes de sincronizar, guardando...`);
          try {
            await guardarDatosDelID(fechaAUsar, id);
            console.log(`✅ ${id} - Datos pendientes guardados`);
          } catch (error) {
            console.error(`❌ Error guardando ${id}:`, error);
          }
        } else {
          console.log(`✅ ${id} - Datos ya sincronizados en tiempo real`);
        }
      }

      console.log('✅ VERIFICACIÓN FINAL COMPLETADA');
      return true;
    } catch (error) {
      console.error('❌ Error en verificación final:', error);
      throw error;
    }
  };

  // Función original mantenida para referencia
  const guardarDatosCompletosOriginal = async (fechaAUsar, idsVendedores) => {
    try {
      console.log('💾 GUARDANDO DATOS COMPLETOS DESDE EL CONTEXTO...');
      console.log('🔍 DEBUG - datosVendedores completo:', datosVendedores);
      console.log('🔍 DEBUG - Keys disponibles:', Object.keys(datosVendedores));
      console.log('🔍 DEBUG - IDs a procesar:', idsVendedores);

      // Debug detallado de cada vendedor
      idsVendedores.forEach(id => {
        const datos = datosVendedores[id];
        console.log(`🔍 DEBUG - ${id}:`, datos);
        if (datos && datos.productos) {
          console.log(`🔍 DEBUG - ${id} productos:`, datos.productos.length);
          console.log(`🔍 DEBUG - ${id} productos con datos:`, datos.productos.filter(p => p.cantidad > 0 || p.vendedor || p.despachador));
        }
      });

      const { cargueService } = await import('../../services/cargueService');

      // 1. Guardar datos de cada ID directamente desde el contexto (NO desde localStorage)
      for (const id of idsVendedores) {
        // Obtiene los datos del vendedor directamente del contexto
        const productosDelVendedor = datosVendedores[id];

        console.log(`🔍 DEBUG - Datos de ${id}:`, productosDelVendedor);
        console.log(`🔍 DEBUG - Tipo de datos de ${id}:`, Array.isArray(productosDelVendedor) ? 'Array' : typeof productosDelVendedor);

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
            console.log(`🔍 DEBUG RESPONSABLE para ${id}:`);

            // Método 1: responsableStorage
            const responsableRS = responsableStorage.get(id);
            console.log(`   - responsableStorage.get("${id}"): "${responsableRS}"`);

            // Método 2: localStorage directo
            const responsableLS = localStorage.getItem(`responsable_${id}`);
            console.log(`   - localStorage.getItem("responsable_${id}"): "${responsableLS}"`);

            // Método 3: localStorage alternativo
            const responsableAlt = localStorage.getItem(`cargue_responsable_${id}`);
            console.log(`   - localStorage.getItem("cargue_responsable_${id}"): "${responsableAlt}"`);

            // Método 4: responsables_cargue
            const responsablesCargue = localStorage.getItem('responsables_cargue');
            let responsableFromCargue = null;
            if (responsablesCargue) {
              try {
                const parsed = JSON.parse(responsablesCargue);
                responsableFromCargue = parsed[id];
                console.log(`   - responsables_cargue["${id}"]: "${responsableFromCargue}"`);
              } catch (error) {
                console.log(`   - responsables_cargue: Error parsing`);
              }
            } else {
              console.log(`   - responsables_cargue: No existe`);
            }

            // Método 5: Desde los datos del cargue actual
            const keyDatosCargue = `cargue_${dia}_${id}_${fechaAUsar}`;
            const datosCargue = localStorage.getItem(keyDatosCargue);
            let responsableFromDatos = null;
            if (datosCargue) {
              try {
                const parsed = JSON.parse(datosCargue);
                responsableFromDatos = parsed.responsable;
                console.log(`   - datos_cargue["${id}"].responsable: "${responsableFromDatos}"`);
              } catch (error) {
                console.log(`   - datos_cargue: Error parsing`);
              }
            }

            // Determinar el responsable real usando prioridad mejorada
            let responsableReal = 'RESPONSABLE';

            // Prioridad: datos del cargue > responsableStorage > localStorage directo > alternativo > cargue general
            if (responsableFromDatos && responsableFromDatos !== 'RESPONSABLE' && responsableFromDatos.trim() !== '') {
              responsableReal = responsableFromDatos.trim();
              console.log(`   ✅ Usando datos_cargue: "${responsableReal}"`);
            } else if (responsableRS && responsableRS !== 'RESPONSABLE' && responsableRS.trim() !== '') {
              responsableReal = responsableRS.trim();
              console.log(`   ✅ Usando responsableStorage: "${responsableReal}"`);
            } else if (responsableLS && responsableLS !== 'RESPONSABLE' && responsableLS.trim() !== '') {
              responsableReal = responsableLS.trim();
              console.log(`   ✅ Usando localStorage directo: "${responsableReal}"`);
            } else if (responsableAlt && responsableAlt !== 'RESPONSABLE' && responsableAlt.trim() !== '') {
              responsableReal = responsableAlt.trim();
              console.log(`   ✅ Usando localStorage alternativo: "${responsableReal}"`);
            } else if (responsableFromCargue && responsableFromCargue !== 'RESPONSABLE' && responsableFromCargue.trim() !== '') {
              responsableReal = responsableFromCargue.trim();
              console.log(`   ✅ Usando responsables_cargue: "${responsableReal}"`);
            } else {
              console.log(`   ❌ No se encontró responsable válido, usando: "${responsableReal}"`);
            }

            console.log(`📝 RESPONSABLE FINAL para ${id}: "${responsableReal}"`);

            // 🚀 CORREGIDO: RECOPILAR DATOS DE PAGOS específicos del ID
            const conceptosKey = `conceptos_pagos_${dia}_${id}_${fechaAUsar}`;
            const datosConceptos = localStorage.getItem(conceptosKey);
            let pagosData = {};

            console.log(`💰 ${id} - Buscando conceptos en: ${conceptosKey}`);

            if (datosConceptos) {
              try {
                const conceptos = JSON.parse(datosConceptos);
                console.log(`💰 ${id} - Conceptos encontrados:`, conceptos);

                // Sumar todos los conceptos para obtener totales
                pagosData = {
                  concepto: conceptos.filter(c => c.concepto).map(c => c.concepto).join(', ') || '',
                  descuentos: conceptos.reduce((sum, c) => sum + (parseFloat(c.descuentos) || 0), 0),
                  nequi: conceptos.reduce((sum, c) => sum + (parseFloat(c.nequi) || 0), 0),
                  daviplata: conceptos.reduce((sum, c) => sum + (parseFloat(c.daviplata) || 0), 0)
                };
                console.log(`💰 ${id} - Datos de pagos procesados:`, pagosData);
              } catch (error) {
                console.error(`❌ Error parsing conceptos para ${id}:`, error);
              }
            } else {
              console.log(`⚠️ ${id} - No se encontraron datos de conceptos en: ${conceptosKey}`);
            }

            // 🚀 CORREGIDO: RECOPILAR DATOS DE BASE CAJA específica del ID
            const baseCajaKey = `base_caja_${dia}_${id}_${fechaAUsar}`;
            const datosBaseCaja = localStorage.getItem(baseCajaKey);
            const baseCaja = datosBaseCaja ? parseFloat(datosBaseCaja) || 0 : 0;

            console.log(`💰 ${id} - Buscando base caja en: ${baseCajaKey} = ${baseCaja}`);

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

            console.log(`💰 ${id} - Cálculos de resumen:`, {
              totalProductos,
              totalDctos,
              descuentosPagos: pagosData.descuentos || 0,
              ventaCalculada,
              nequi: pagosData.nequi || 0,
              daviplata: pagosData.daviplata || 0,
              totalEfectivoCalculado
            });

            // 🚀 RECOPILAR DATOS DE CUMPLIMIENTO desde localStorage
            const datosCumplimiento = localStorage.getItem(`cumplimiento_${dia}_${id}_${fechaAUsar}`);
            let cumplimientoData = {};
            if (datosCumplimiento) {
              try {
                cumplimientoData = JSON.parse(datosCumplimiento);
                console.log(`✅ Datos de cumplimiento para ${id}:`, cumplimientoData);
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

            console.log(`🚀 Preparando para enviar datos de ${id}:`, datosParaGuardar);
            console.log(`📦 Productos con datos para ${id}: ${productosParaGuardar.length}`);
            console.log(`📅 Fecha que se enviará: ${datosParaGuardar.fecha}`);
            console.log(`👤 Responsable que se enviará: ${datosParaGuardar.responsable}`);
            console.log(`💰 Pagos que se enviarán:`, datosParaGuardar.pagos);
            console.log(`📊 Resumen que se enviará:`, datosParaGuardar.resumen);
            console.log(`✅ Cumplimiento que se enviará:`, datosParaGuardar.cumplimiento);

            console.log(`🚀 ENVIANDO A API - ${id}:`, JSON.stringify(datosParaGuardar, null, 2));
            const resultado = await cargueService.guardarCargueCompleto(datosParaGuardar);

            if (resultado.error) {
              console.error(`❌ Error enviando datos de ${id}:`, resultado.message);
              throw new Error(`Error guardando datos de ${id}: ${resultado.message}`);
            }

            console.log(`✅ Datos de ${id} enviados a la API exitosamente.`);
          } else {
            console.log(`⚠️ ${id} no tiene productos con datos para guardar`);
          }
        } else {
          console.log(`⚠️ No hay datos en el contexto para ${id} o no es un array válido`);
          console.log(`🔍 DEBUG - Valor actual de datosVendedores[${id}]:`, productosDelVendedor);
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
        console.log('✅ Guardados datos de BASE CAJA y CONCEPTOS');
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
        console.log('✅ Guardados datos de PRODUCCIÓN');
      }

      return true;
    } catch (error) {
      console.error('❌ Error guardando datos completos desde el contexto:', error);
      throw error;
    }
  };

  // 🚀 NUEVA FUNCIÓN: Limpiar localStorage de un ID específico
  const limpiarLocalStorageDelID = (fechaAUsar, idVendedor) => {
    try {
      console.log(`🧹 ${idVendedor} - LIMPIANDO LOCALSTORAGE...`);

      // Limpiar datos del ID específico
      const key = `cargue_${dia}_${idVendedor}_${fechaAUsar}`;
      localStorage.removeItem(key);
      console.log(`🗑️ ${idVendedor} - Eliminado: ${key}`);

      // Limpiar cumplimiento específico del ID
      const cumplimientoKey = `cumplimiento_${dia}_${idVendedor}_${fechaAUsar}`;
      localStorage.removeItem(cumplimientoKey);
      console.log(`🗑️ ${idVendedor} - Eliminado: ${cumplimientoKey}`);

      // 🚀 CORREGIDO: Limpiar conceptos específicos del ID
      const conceptosKey = `conceptos_pagos_${dia}_${idVendedor}_${fechaAUsar}`;
      localStorage.removeItem(conceptosKey);
      console.log(`🗑️ ${idVendedor} - Eliminado: ${conceptosKey}`);

      // 🚀 CORREGIDO: Limpiar base caja específica del ID
      const baseCajaKey = `base_caja_${dia}_${idVendedor}_${fechaAUsar}`;
      localStorage.removeItem(baseCajaKey);
      console.log(`🗑️ ${idVendedor} - Eliminado: ${baseCajaKey}`);

      console.log(`✅ ${idVendedor} - LocalStorage limpiado completamente`);
    } catch (error) {
      console.error(`❌ Error limpiando localStorage de ${idVendedor}:`, error);
    }
  };

  // Limpiar localStorage después de guardar (FUNCIÓN ORIGINAL - mantener para compatibilidad)
  const limpiarLocalStorage = (fechaAUsar, idsVendedores) => {
    try {
      console.log('🧹 LIMPIANDO LOCALSTORAGE...');

      // Limpiar datos de cada ID usando funciones específicas
      for (const id of idsVendedores) {
        limpiarLocalStorageDelID(fechaAUsar, id);
      }

      // Limpiar datos adicionales
      const clavesALimpiar = [
        `estado_boton_${dia}_${fechaAUsar}`,
        `estado_despacho_${dia}_${fechaAUsar}`,
        `produccion_congelada_${dia}_${fechaAUsar}`,
        `produccion_${dia}_${fechaAUsar}`,

        // 🚀 CORREGIDO: Limpiar conceptos específicos por ID
        `conceptos_pagos_${dia}_ID1_${fechaAUsar}`,
        `conceptos_pagos_${dia}_ID2_${fechaAUsar}`,
        `conceptos_pagos_${dia}_ID3_${fechaAUsar}`,
        `conceptos_pagos_${dia}_ID4_${fechaAUsar}`,
        `conceptos_pagos_${dia}_ID5_${fechaAUsar}`,
        `conceptos_pagos_${dia}_ID6_${fechaAUsar}`,
        // 🚀 CORREGIDO: Limpiar base caja específica por ID
        `base_caja_${dia}_ID1_${fechaAUsar}`,
        `base_caja_${dia}_ID2_${fechaAUsar}`,
        `base_caja_${dia}_ID3_${fechaAUsar}`,
        `base_caja_${dia}_ID4_${fechaAUsar}`,
        `base_caja_${dia}_ID5_${fechaAUsar}`,
        `base_caja_${dia}_ID6_${fechaAUsar}`,
        // ✅ Limpiar datos de cumplimiento para todos los IDs
        `cumplimiento_${dia}_ID1_${fechaAUsar}`,
        `cumplimiento_${dia}_ID2_${fechaAUsar}`,
        `cumplimiento_${dia}_ID3_${fechaAUsar}`,
        `cumplimiento_${dia}_ID4_${fechaAUsar}`,
        `cumplimiento_${dia}_ID5_${fechaAUsar}`,
        `cumplimiento_${dia}_ID6_${fechaAUsar}`
      ];

      clavesALimpiar.forEach(clave => {
        localStorage.removeItem(clave);
        console.log(`🗑️ Eliminado: ${clave}`);
      });

      console.log('✅ LocalStorage limpiado completamente');
    } catch (error) {
      console.error('❌ Error limpiando localStorage:', error);
    }
  };

  // 🚀 NUEVA FUNCIÓN: Validar lotes vencidos de un ID específico
  const validarLotesVencidosDelID = async (fechaAUsar, idVendedor) => {
    try {
      console.log(`🔍 ${idVendedor} - VALIDANDO LOTES VENCIDOS...`);

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
        console.log(`❌ ${idVendedor} - PRODUCTOS CON VENCIDAS SIN LOTES:`, productosConVencidasSinLotes);

        const mensaje = `❌ ${idVendedor} - No se puede finalizar\n\nLos siguientes productos tienen vencidas pero no tienen información de lotes:\n\n${productosConVencidasSinLotes.map(p =>
          `• ${p.producto} (${p.vencidas} vencidas)`
        ).join('\n')
          }\n\nPor favor complete la información de lotes vencidos antes de finalizar.`;

        alert(mensaje);
        return false;
      }

      console.log(`✅ ${idVendedor} - VALIDACIÓN DE LOTES VENCIDOS COMPLETADA`);
      return true;
    } catch (error) {
      console.error(`❌ Error validando lotes vencidos de ${idVendedor}:`, error);
      alert(`❌ Error validando lotes vencidos de ${idVendedor}. No se puede finalizar.`);
      return false;
    }
  };

  // Validar lotes vencidos antes de finalizar (FUNCIÓN ORIGINAL - mantener para compatibilidad)
  const validarLotesVencidos = async (fechaAUsar, idsVendedores) => {
    try {
      console.log('🔍 VALIDANDO LOTES VENCIDOS...');
      console.log(`📅 Fecha para validación: ${fechaAUsar}`);

      const { simpleStorage } = await import('../../services/simpleStorage');
      const productosConVencidasSinLotes = [];

      // Verificar todos los IDs
      for (const id of idsVendedores) {
        const key = `cargue_${dia}_${id}_${fechaAUsar}`;
        const datos = await simpleStorage.getItem(key);

        if (datos && datos.productos) {
          for (const producto of datos.productos) {
            // Si tiene vencidas pero no tiene lotes vencidos completos
            if (producto.vencidas > 0) {
              const lotesVencidos = producto.lotesVencidos || [];

              // Verificar que tenga al menos un lote con información completa
              const lotesCompletos = lotesVencidos.filter(lote =>
                lote.lote && lote.lote.trim() !== '' &&
                lote.motivo && lote.motivo.trim() !== ''
              );

              if (lotesCompletos.length === 0) {
                productosConVencidasSinLotes.push({
                  id: id,
                  producto: producto.producto,
                  vencidas: producto.vencidas
                });
              }
            }
          }
        }
      }

      if (productosConVencidasSinLotes.length > 0) {
        console.log('❌ PRODUCTOS CON VENCIDAS SIN LOTES:', productosConVencidasSinLotes);

        const mensaje = `❌ No se puede finalizar\n\nLos siguientes productos tienen vencidas pero no tienen información de lotes:\n\n${productosConVencidasSinLotes.map(p =>
          `• ${p.id}: ${p.producto} (${p.vencidas} vencidas)`
        ).join('\n')
          }\n\nPor favor complete la información de lotes vencidos antes de finalizar.`;

        alert(mensaje);
        return false;
      }

      console.log('✅ VALIDACIÓN DE LOTES VENCIDOS COMPLETADA');
      return true;
    } catch (error) {
      console.error('❌ Error validando lotes vencidos:', error);
      alert('❌ Error validando lotes vencidos. No se puede finalizar.');
      return false;
    }
  };

  // 🚀 NUEVA FUNCIÓN: Manejar finalizar para un ID específico
  const manejarFinalizarDelID = async () => {
    console.log(`🚀🚀🚀 ${idSheet} - BOTÓN FINALIZAR PRESIONADO 🚀🚀🚀`);
    console.log('⏰ Timestamp:', Date.now());
    console.log(`📊 ${idSheet} - Productos validados disponibles:`, productosValidados.length);

    setLoading(true);

    try {
      // 🚀 NUEVO: Forzar guardado de datos actuales de la pantalla antes de procesar
      // Esto asegura que si el autoguardado está desactivado, los datos se guarden antes de leerlos
      console.log(`💾 ${idSheet} - Forzando guardado de datos en pantalla...`);
      window.dispatchEvent(new CustomEvent('solicitarGuardado'));
      // Esperar para asegurar que el evento se procese y localStorage se actualice
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log(`🏁 ${idSheet} - INICIANDO FINALIZACIÓN ESPECÍFICA`);

      const { simpleStorage } = await import('../../services/simpleStorage');

      if (!fechaSeleccionada) {
        console.error(`❌ ${idSheet} - ERROR: fechaSeleccionada no está definida`);
        alert(`❌ ${idSheet} - Error: No se ha seleccionado una fecha válida`);
        setLoading(false);
        return;
      }

      const fechaAUsar = fechaSeleccionada;
      console.log(`📅 ${idSheet} - Fecha a usar para guardado: ${fechaAUsar}`);

      // VALIDACIÓN PREVIA: Verificar lotes vencidos del ID específico
      console.log(`🔍 ${idSheet} - VALIDACIÓN PREVIA: Verificando lotes vencidos...`);
      const lotesValidos = await validarLotesVencidosDelID(fechaAUsar, idSheet);

      if (!lotesValidos) {
        setLoading(false);
        return;
      }

      console.log(`✅ ${idSheet} - VALIDACIÓN COMPLETADA - Continuando con finalización...`);

      let totalDevoluciones = 0;
      let totalVencidas = 0;

      // PASO 1: Procesar devoluciones y vencidas del ID específico
      console.log(`📦 ${idSheet} - PASO 1: Procesando devoluciones y vencidas...`);
      const key = `cargue_${dia}_${idSheet}_${fechaAUsar}`;
      const datos = await simpleStorage.getItem(key);

      if (datos && datos.productos) {
        for (const producto of datos.productos) {
          if (producto.id) {
            // Procesar devoluciones (sumar al inventario)
            if (producto.devoluciones > 0) {
              await actualizarInventario(producto.id, producto.devoluciones, 'SUMAR');
              totalDevoluciones += producto.devoluciones;
              console.log(`⬆️ ${idSheet} - DEVOLUCIÓN: ${producto.producto} +${producto.devoluciones}`);
            }

            // Procesar vencidas (NO afectar inventario - solo registrar)
            if (producto.vencidas > 0) {
              totalVencidas += producto.vencidas;
              console.log(`🗑️ ${idSheet} - VENCIDAS: ${producto.producto} ${producto.vencidas} (sin afectar inventario)`);
            }
          }
        }
      }

      // PASO 2: Guardar datos del ID específico en la base de datos
      console.log(`💾 ${idSheet} - PASO 2: Guardando datos en base de datos...`);
      await guardarDatosDelID(fechaAUsar, idSheet);

      // PASO 3: Limpiar localStorage del ID específico
      console.log(`🧹 ${idSheet} - PASO 3: Limpiando localStorage...`);
      limpiarLocalStorageDelID(fechaAUsar, idSheet);

      // PASO 4: Cambiar estado a COMPLETADO para el ID específico
      setEstado('COMPLETADO');
      localStorage.setItem(`estado_boton_${dia}_${idSheet}_${fechaFormateadaLS}`, 'COMPLETADO');

      console.log(`🎉 ${idSheet} - FINALIZACIÓN COMPLETADA EXITOSAMENTE`);

      // ✅ MOSTRAR MODAL DE ÉXITO EN LUGAR DE ALERT
      setSuccessModalData({
        titulo: '¡Jornada Finalizada!',
        mensaje: 'Los datos se han guardado correctamente en la base de datos.',
        detalles: `⬆️ Devoluciones: ${totalDevoluciones}\n🗑️ Vencidas: ${totalVencidas}\n🧹 LocalStorage limpiado`
      });
      setShowSuccessModal(true);

    } catch (error) {
      console.error(`❌ ${idSheet} - Error en finalización:`, error);
      alert(`❌ ${idSheet} - Error en finalización: ${error.message}`);
    }

    setLoading(false);
  };

  // Manejar finalizar (devoluciones, vencidas y guardado completo) - FUNCIÓN ORIGINAL - mantener para compatibilidad
  const manejarFinalizar = async () => {
    console.log('🚀🚀🚀 BOTÓN DESPACHO PRESIONADO 🚀🚀🚀');
    console.log('⏰ Timestamp:', Date.now());
    console.log('📊 Productos validados disponibles:', productosValidados.length);

    setLoading(true);

    try {
      // 🚀 NUEVO: Forzar guardado de datos actuales de la pantalla antes de procesar
      console.log('💾 Forzando guardado de datos en pantalla...');
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
      for (const id of idsVendedores) {
        const key = `cargue_${dia}_${id}_${fechaAUsar}`;
        const datos = await simpleStorage.getItem(key);

        if (datos && datos.productos) {
          for (const producto of datos.productos) {
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
      }

      // 🚨 CONFIRMACIÓN: Abrir Modal en lugar de window.confirm
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

      console.log('🏁 INICIANDO FINALIZACIÓN COMPLETA');
      console.log(`📅 Fecha a usar para guardado: ${fechaAUsar}`);

      // VALIDACIÓN PREVIA: Verificar lotes vencidos
      console.log('🔍 VALIDACIÓN PREVIA: Verificando lotes vencidos...');
      const lotesValidos = await validarLotesVencidos(fechaAUsar, idsVendedores);

      if (!lotesValidos) {
        setLoading(false);
        return; // No continuar si faltan lotes vencidos
      }

      console.log('✅ VALIDACIÓN COMPLETADA - Continuando con finalización...');

      // Resetear contadores para el procesamiento real
      let totalDevoluciones = 0;
      let totalVencidas = 0;

      // 🚀 PASO 0: VALIDACIÓN - El inventario YA FUE DESCONTADO en DESPACHO
      console.log('✅ INVENTARIO YA DESCONTADO EN DESPACHO - Saltando descuento...');
      console.log('📋 Productos que ya fueron descontados:', productosValidados.length);

      // PASO 1: Procesar devoluciones y vencidas
      console.log('📦 PASO 1: Procesando devoluciones y vencidas...');
      for (const id of idsVendedores) {
        const key = `cargue_${dia}_${id}_${fechaAUsar}`;
        const datos = await simpleStorage.getItem(key);

        if (datos && datos.productos) {
          for (const producto of datos.productos) {
            if (producto.id) {
              // Procesar devoluciones (sumar al inventario)
              if (producto.devoluciones > 0) {
                await actualizarInventario(producto.id, producto.devoluciones, 'SUMAR');
                totalDevoluciones += producto.devoluciones;
                console.log(`⬆️ DEVOLUCIÓN: ${producto.producto} +${producto.devoluciones}`);
              }

              // Procesar vencidas (NO afectar inventario - solo registrar)
              if (producto.vencidas > 0) {
                totalVencidas += producto.vencidas;
                console.log(`🗑️ VENCIDAS: ${producto.producto} ${producto.vencidas} (sin afectar inventario)`);
              }
            }
          }
        }
      }

      // PASO 2: Guardar todos los datos en la base de datos
      console.log('💾 PASO 2: Guardando datos en base de datos...');
      await guardarDatosCompletos(fechaAUsar, idsVendedores);

      // PASO 3: Limpiar localStorage
      console.log('🧹 PASO 3: Limpiando localStorage...');
      limpiarLocalStorage(fechaAUsar, idsVendedores);

      // 🔒 Congelar producción al cambiar a COMPLETADO
      congelarProduccion('COMPLETADO');

      // PASO 4: Cambiar estado a COMPLETADO
      setEstado('COMPLETADO');
      // 🔥 IMPORTANTE: Convertir fecha a string YYYY-MM-DD para consistencia
      const fechaKey = fechaSeleccionada instanceof Date
        ? fechaSeleccionada.toISOString().split('T')[0]
        : fechaSeleccionada;
      localStorage.setItem(`estado_boton_${dia}_${fechaKey}`, 'COMPLETADO');

      console.log(`🎉 FINALIZACIÓN COMPLETADA - Estado guardado en: estado_boton_${dia}_${fechaKey}`);
      alert(`✅ Jornada Finalizada y Guardada\n\n📊 Datos guardados en base de datos\n⬆️ Devoluciones: ${totalDevoluciones}\n🗑️ Vencidas: ${totalVencidas}\n🧹 LocalStorage limpiado`);

    } catch (error) {
      console.error('❌ Error en finalización:', error);
      alert(`❌ Error en finalización: ${error.message}\n\nLos datos pueden no haberse guardado correctamente.`);
    }

    setLoading(false);
  };

  // 🚀 NUEVA FUNCIÓN: Manejar despacho para un ID específico
  const manejarDespachoDelID = async () => {
    console.log(`🚚 ${idSheet} - EJECUTANDO DESPACHO - AFECTANDO INVENTARIO`);

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
        console.log(`🔄 ${idSheet} - Usuario eligió volver a revisar checkboxes`);
      } else {
        console.log(`🚫 ${idSheet} - Usuario eligió quedarse en la pantalla actual`);
      }

      console.log(`🚫 ${idSheet} - DESPACHO BLOQUEADO - Hay productos sin verificar completamente`);
      return;
    }

    setLoading(true);

    try {
      console.log(`📋 ${idSheet} - Productos validados para despacho:`, productosValidados.length);

      // DESCONTAR del inventario
      for (const producto of productosValidados) {
        console.log(`🔥 ${idSheet} - PROCESANDO: ${producto.nombre}`);

        const productoId = producto.id || null;

        if (productoId) {
          console.log(`   - Producto ID: ${productoId}`);
          console.log(`   - Cantidad a descontar: ${producto.totalCantidad}`);

          const resultado = await actualizarInventario(productoId, producto.totalCantidad, 'RESTAR');
          console.log(`✅ ${idSheet} - DESCONTADO: ${producto.nombre} - Stock actualizado: ${resultado.stock_actual}`);
        } else {
          console.error(`❌ ${idSheet} - Producto ID NO encontrado para: ${producto.nombre}`);
        }
      }

      // Cambiar estado a FINALIZAR para el ID específico
      setEstado('FINALIZAR');
      localStorage.setItem(`estado_despacho_${dia}_${idSheet}_${fechaFormateadaLS}`, 'DESPACHO');
      localStorage.setItem(`estado_boton_${dia}_${idSheet}_${fechaFormateadaLS}`, 'FINALIZAR');

      console.log(`✅ ${idSheet} - DESPACHO COMPLETADO - Inventario afectado`);

      // Mostrar resumen
      const resumen = productosValidados.map(p => `${p.nombre}: ${p.totalCantidad} und`).join('\n');
      const totalGeneral = productosValidados.reduce((sum, p) => sum + p.totalCantidad, 0);

      let mensaje = `✅ ${idSheet} - Despacho Realizado\n\n${resumen}\n\n🎯 TOTAL DESCONTADO DEL INVENTARIO: ${totalGeneral} unidades`;

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
      case 'ALISTAMIENTO':
        return {
          texto: '📦 SUGERIDO',
          variant: 'outline-secondary',
          disabled: loading,
          onClick: async () => {
            // 🔒 Congelar producción al activar alistamiento
            congelarProduccion('ALISTAMIENTO ACTIVADO');

            // 🔒 NUEVO: Congelar PEDIDOS en Planeación
            await congelarPedidosEnPlaneacion();

            // 🔒 NUEVO: Guardar SOLICITADAS en Planeación automáticamente
            await guardarSolicitadasEnPlaneacion();

            // 📸 NUEVO: Guardar snapshot de Planeación en tabla independiente
            await guardarSnapshotPlaneacion();

            setEstado('ALISTAMIENTO_ACTIVO');
            localStorage.setItem(`estado_boton_${dia}_${fechaFormateadaLS}`, 'ALISTAMIENTO_ACTIVO');
            console.log('📦 Cambiando a ALISTAMIENTO_ACTIVO');
          }
        };
      case 'ALISTAMIENTO_ACTIVO':
        return {
          texto: '📦 ALISTAMIENTO ACTIVO',
          variant: 'dark',
          disabled: listos.length === 0 || loading || pendientes.length > 0, // Deshabilitar si no hay productos listos O si hay pendientes
          onClick: async () => {
            setLoading(true);

            try {
              // 🚨 VALIDACIÓN ESTRICTA: NO permitir despacho si hay productos pendientes
              if (productosPendientes.length > 0) {
                const listaPendientes = productosPendientes.map(p =>
                  `• ${p.nombre}: ${p.totalCantidad} und (V:${p.vendedor ? '✓' : '✗'} D:${p.despachador ? '✓' : '✗'})`
                ).join('\n');

                const totalPendientes = productosPendientes.reduce((sum, p) => sum + p.totalCantidad, 0);

                alert(
                  `❌ NO SE PUEDE REALIZAR EL DESPACHO\n\n` +
                  `Los siguientes productos tienen cantidades pero NO están completamente verificados:\n\n` +
                  `${listaPendientes}\n\n` +
                  `🔧 SOLUCIÓN: Marque los checkboxes V (Vendedor) y D (Despachador) faltantes.\n\n` +
                  `⚠️ TODOS los productos con cantidad deben tener ambos checkboxes marcados antes de continuar.\n\n` +
                  `Total pendiente: ${totalPendientes} unidades en ${productosPendientes.length} productos`
                );

                console.log('🚫 DESPACHO BLOQUEADO - Hay productos sin verificar completamente');
                setLoading(false);
                return; // Salir sin hacer despacho
              }

              // 🎯 CONFIRMACIÓN: Mostrar resumen antes de descontar inventario
              const resumen = productosValidados.map(p => `${p.nombre}: ${p.totalCantidad} und`).join('\n');
              const totalGeneral = productosValidados.reduce((sum, p) => sum + p.totalCantidad, 0);

              const mensaje = `🚚 ¿Confirmar Despacho?\n\n${resumen}\n\n🎯 TOTAL A DESCONTAR DEL INVENTARIO: ${totalGeneral} unidades\n\n¿Desea continuar?`;

              // 🚨 CONFIRMACIÓN: Solo continuar si el usuario acepta
              const confirmar = window.confirm(mensaje);

              if (!confirmar) {
                console.log('❌ Despacho cancelado por el usuario');
                setLoading(false);
                return; // Salir sin hacer nada
              }

              // 🚀 PROCEDER CON EL DESPACHO: Afectar inventario
              console.log('🚚 ALISTAMIENTO_ACTIVO → Afectando inventario...');

              // ========== PASO 1: DESCONTAR CARGUE DEL INVENTARIO ==========
              console.log('📦 PASO 1: Descontando productos de CARGUE...');

              for (const producto of productosValidados) {
                console.log(`🔥 PROCESANDO CARGUE: ${producto.nombre}`);
                const productoId = producto.id || null;

                if (productoId) {
                  console.log(`   - Producto ID: ${productoId}`);
                  console.log(`   - Cantidad a descontar: ${producto.totalCantidad}`);

                  const resultado = await actualizarInventario(productoId, producto.totalCantidad, 'RESTAR');
                  console.log(`✅ DESCONTADO CARGUE: ${producto.nombre} - Stock actualizado: ${resultado.stock_actual}`);
                } else {
                  console.error(`❌ Producto ID NO encontrado para: ${producto.nombre}`);
                }
              }

              const totalCargue = productosValidados.reduce((sum, p) => sum + p.totalCantidad, 0);
              console.log(`✅ TOTAL CARGUE DESCONTADO: ${totalCargue} unidades`);

              // ========== PASO 2: DESCONTAR PEDIDOS DEL INVENTARIO ==========
              console.log('📋 PASO 2: Descontando productos de PEDIDOS PENDIENTES...');

              const { pedidosAgrupados, pedidosIds } = await cargarPedidosPendientes(fechaSeleccionada);
              const productosPedidos = Object.values(pedidosAgrupados);
              let totalPedidos = 0;

              if (productosPedidos.length > 0) {
                // Cargar todos los productos desde la API para obtener IDs
                const productosResponse = await fetch('http://localhost:8000/api/productos/');
                const todosLosProductos = productosResponse.ok ? await productosResponse.json() : [];

                for (const productoPedido of productosPedidos) {
                  // Buscar el ID del producto por nombre
                  let productoId = null;

                  // Opción 1: Buscar en productosValidados (productos de CARGUE)
                  const productoEnCargue = productosValidados.find(p =>
                    p.nombre.toUpperCase() === productoPedido.nombre.toUpperCase()
                  );

                  if (productoEnCargue) {
                    productoId = productoEnCargue.id;
                  }
                  // Opción 2: Buscar en todos los productos de la API
                  else {
                    const productoEnAPI = todosLosProductos.find(p =>
                      p.nombre.toUpperCase() === productoPedido.nombre.toUpperCase()
                    );
                    productoId = productoEnAPI?.id;
                  }

                  if (productoId) {
                    console.log(`🔥 PROCESANDO PEDIDO: ${productoPedido.nombre}`);
                    console.log(`   - Producto ID: ${productoId}`);
                    console.log(`   - Cantidad a descontar: ${productoPedido.cantidad}`);

                    const resultado = await actualizarInventario(productoId, productoPedido.cantidad, 'RESTAR');

                    console.log(`✅ DESCONTADO PEDIDO: ${productoPedido.nombre} - Stock actualizado: ${resultado.stock_actual}`);
                    totalPedidos += productoPedido.cantidad;
                  } else {
                    console.error(`❌ Producto ID NO encontrado para pedido: ${productoPedido.nombre}`);
                  }
                }

                console.log(`✅ TOTAL PEDIDOS DESCONTADO: ${totalPedidos} unidades`);

                // ========== PASO 3: MARCAR PEDIDOS COMO ENTREGADA ==========
                console.log('📦 PASO 3: Marcando pedidos como ENTREGADA...');
                const { exitosos, errores } = await marcarPedidosComoEntregados(pedidosIds);
                console.log(`✅ Pedidos actualizados: ${exitosos} exitosos, ${errores} errores`);
              } else {
                console.log('ℹ️ No hay pedidos PENDIENTES para este día');
              }

              // 🔒 Congelar producción al cambiar a FINALIZAR
              congelarProduccion('INVENTARIO AFECTADO - SOLO LECTURA');

              // Cambiar a FINALIZAR (ahora solo lectura)
              setEstado('FINALIZAR');
              const fechaKey = fechaSeleccionada instanceof Date
                ? fechaSeleccionada.toISOString().split('T')[0]
                : fechaSeleccionada;
              localStorage.setItem(`estado_boton_${dia}_${fechaKey}`, 'FINALIZAR');
              console.log(`✅ Inventario afectado (CARGUE + PEDIDOS) → Cambiando a FINALIZAR - Estado guardado en: estado_boton_${dia}_${fechaKey}`);

              // 🎯 Mostrar confirmación del despacho realizado
              const resumenCargue = productosValidados.map(p => `${p.nombre}: ${p.totalCantidad} und`).join('\n');
              const resumenPedidos = productosPedidos.length > 0
                ? productosPedidos.map(p => `${p.nombre}: ${p.cantidad} und`).join('\n')
                : 'Sin pedidos pendientes';

              const totalGeneralFinal = totalCargue + totalPedidos;

              const mensajeFinal = `✅ Despacho Completado\n\n` +
                `📦 CARGUE:\n${resumenCargue}\nTotal: ${totalCargue} und\n\n` +
                `📋 PEDIDOS:\n${resumenPedidos}\nTotal: ${totalPedidos} und\n\n` +
                `🎯 TOTAL DESCONTADO DEL INVENTARIO: ${totalGeneralFinal} unidades\n\n` +
                `✅ ${pedidosIds.length} pedidos marcados como ENTREGADA`;

              alert(mensajeFinal);

            } catch (error) {
              console.error('❌ Error afectando inventario:', error);
              alert(`❌ Error afectando inventario: ${error.message}`);
            }

            setLoading(false);
          }
        };
      case 'FINALIZAR':
        return {
          texto: '🚚 DESPACHO',
          variant: 'dark', // Cambiado a dark para usar estilo personalizado
          customStyle: {
            backgroundColor: '#0c2c53',
            borderColor: '#0c2c53',
            color: 'white'
          },
          disabled: loading || productosPendientes.length > 0, // Deshabilitar si hay pendientes
          onClick: manejarFinalizar
        };
      case 'COMPLETADO':
        return {
          texto: '🎉 COMPLETADO',
          variant: 'success',
          disabled: true,
          onClick: null
        };
      default:
        return {
          texto: '📦 SUGERIDO',
          variant: 'secondary',
          disabled: true,
          onClick: null
        };
    }
  };

  const config = obtenerConfigBoton();

  return (
    <div className="mt-3">
      <div className="d-flex justify-content-start">
        <Button
          variant={config.variant}
          disabled={config.disabled}
          onClick={config.onClick}
          style={{
            minWidth: '150px',
            fontWeight: 'bold',
            ...(config.customStyle || {})
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

      {/* Modal de Éxito - ESTILO PREMIUM */}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered backdrop="static">
        <Modal.Body className="text-center p-5">
          <div className="mb-4 text-success">
            <i className="bi bi-check-circle-fill" style={{ fontSize: '4rem' }}></i>
          </div>
          <h2 className="fw-bold mb-3 text-dark">{successModalData.titulo}</h2>
          <p className="text-muted fs-5 mb-4">{successModalData.mensaje}</p>

          <div className="bg-light p-3 rounded border mb-4 text-start">
            <pre className="mb-0 text-secondary" style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
              {successModalData.detalles}
            </pre>
          </div>

          <Button variant="success" size="lg" className="w-100 rounded-pill" onClick={() => setShowSuccessModal(false)}>
            Entendido
          </Button>
        </Modal.Body>
      </Modal>

      {/* Indicador de productos pendientes */}
      {idSheet === 'ID1' && productosPendientes.length > 0 && (
        <div className="mt-2">
          <div className="py-2 px-3" style={{
            fontSize: '0.85em',
            color: '#495057'
          }}>
            <strong>⚠️ {estado === 'ALISTAMIENTO_ACTIVO' ? 'ALISTAMIENTO BLOQUEADO' : 'DESPACHO BLOQUEADO'}</strong><br />
            {productosPendientes.length} producto(s) con cantidad necesitan verificación completa (checkboxes V y D)
          </div>
        </div>
      )}

      {/* Botón de verificar guardado solo en ID1 y después de COMPLETADO */}
      {idSheet === 'ID1' && estado === 'COMPLETADO' && (
        <VerificarGuardado dia={dia} fechaSeleccionada={fechaSeleccionada} />
      )}
    </div>
  );
};

export default BotonLimpiar;