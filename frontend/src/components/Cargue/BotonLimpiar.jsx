import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import VerificarGuardado from './VerificarGuardado';
import { useVendedores } from '../../context/VendedoresContext';

const BotonLimpiar = ({ productos = [], dia, idSheet, fechaSeleccionada, onLimpiar }) => {
  const [estado, setEstado] = useState('ALISTAMIENTO');
  const [loading, setLoading] = useState(false);
  const [productosValidados, setProductosValidados] = useState([]);
  const [productosPendientes, setProductosPendientes] = useState([]);

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
            console.log(`🔍 ${idVendedor} - ${producto.producto}: V=${producto.vendedor}, D=${producto.despachador}, Total=${producto.total}`);
          }

          // Productos con cantidad pero sin checkboxes completos
          if (producto.total > 0 && (!producto.vendedor || !producto.despachador)) {
            productosPendientes.push({
              id: producto.id,
              nombre: producto.producto,
              totalCantidad: producto.total,
              vendedorId: idVendedor,
              vendedor: producto.vendedor,
              despachador: producto.despachador
            });
            console.log(`⚠️ ${idVendedor} PRODUCTO PENDIENTE: ${producto.producto} - Total: ${producto.total} - V:${producto.vendedor} D:${producto.despachador}`);
          }

          // Productos completamente listos (V=true, D=true, TOTAL>0)
          if (producto.vendedor && producto.despachador && producto.total > 0) {
            productosListos.push({
              id: producto.id,
              nombre: producto.producto,
              totalCantidad: producto.total
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
              console.log(`🔍 ${id} - ${producto.producto}: V=${producto.vendedor}, D=${producto.despachador}, Total=${producto.total}`);
            }

            // Productos con cantidad pero sin checkboxes completos
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
              productosPendientes[producto.id].totalCantidad += producto.total;
              console.log(`⚠️ PRODUCTO PENDIENTE: ${producto.producto} - Total: ${producto.total} - V:${producto.vendedor} D:${producto.despachador}`);
            }

            // Productos completamente listos (V=true, D=true, TOTAL>0)
            if (producto.vendedor && producto.despachador && producto.total > 0) {
              if (!todosLosProductos[producto.id]) {
                todosLosProductos[producto.id] = {
                  id: producto.id,
                  nombre: producto.producto,
                  totalCantidad: 0
                };
              }
              todosLosProductos[producto.id].totalCantidad += producto.total;
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

    const estadoGuardado = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`);
    if (estadoGuardado) {
      setEstado(estadoGuardado);
      console.log(`🔄 Estado global recuperado: ${estadoGuardado}`);
    }

    // También verificar si hay datos congelados
    const datosCongelados = localStorage.getItem(`produccion_congelada_${dia}_${fechaSeleccionada}`);
    if (datosCongelados) {
      console.log('❄️ Datos de producción congelados encontrados');
    }
  }, [dia, fechaSeleccionada, idSheet]);

  // 🚀 SOLO ID1 verifica productos de TODOS los IDs
  useEffect(() => {
    if (idSheet !== 'ID1') return;

    const verificarYAvanzar = async () => {
      const resultado = await verificarProductosListos();
      setProductosValidados(resultado.listos);
      setProductosPendientes(resultado.pendientes);

      // ❌ AUTO-AVANCE DESACTIVADO - Ahora es manual
      // if (estado === 'ALISTAMIENTO_ACTIVO' && resultado.listos.length > 0) {
      //   console.log('🤖 AUTO-AVANCE: ALISTAMIENTO_ACTIVO → DESPACHO');
      //   setEstado('DESPACHO');
      //   localStorage.setItem(`estado_boton_${dia}_${fechaSeleccionada}`, 'DESPACHO');
      // }
    };

    verificarYAvanzar();

    // ❌ VERIFICACIÓN AUTOMÁTICA DESACTIVADA - Ahora es manual
    // let interval;
    // if (estado === 'ALISTAMIENTO_ACTIVO') {
    //   interval = setInterval(verificarYAvanzar, 3000);
    // }

    return () => {
      // Cleanup function (vacía porque no hay interval activo)
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

    const keyCongelados = `produccion_congelada_${dia}_${fechaSeleccionada}`;
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

  // 🚀 NUEVA FUNCIÓN: Guardar datos de un ID específico
  const guardarDatosDelID = async (fechaAUsar, idVendedor) => {
    try {
      console.log(`💾 ${idVendedor} - GUARDANDO DATOS ESPECÍFICOS...`);

      const { simpleStorage } = await import('../../services/simpleStorage');
      const { cargueService } = await import('../../services/cargueService');

      // Obtener datos desde localStorage del ID específico
      const key = `cargue_${dia}_${idVendedor}_${fechaAUsar}`;
      const datos = await simpleStorage.getItem(key);

      if (!datos || !datos.productos) {
        console.log(`⚠️ ${idVendedor} - No hay datos para guardar`);
        return false;
      }

      // Filtrar solo productos que tienen datos relevantes
      const productosParaGuardar = datos.productos.filter(p =>
        p.cantidad > 0 || p.dctos > 0 || p.adicional > 0 ||
        p.devoluciones > 0 || p.vencidas > 0 || p.vendedor || p.despachador
      );

      if (productosParaGuardar.length === 0) {
        console.log(`⚠️ ${idVendedor} - No hay productos con datos para guardar`);
        return false;
      }

      // Obtener responsable real
      const { responsableStorage } = await import('../../utils/responsableStorage');
      let responsableReal = 'RESPONSABLE';

      const responsableRS = responsableStorage.get(idVendedor);
      const responsableLS = localStorage.getItem(`responsable_${idVendedor}`);
      const responsableFromDatos = datos.responsable;

      if (responsableFromDatos && responsableFromDatos !== 'RESPONSABLE' && responsableFromDatos.trim() !== '') {
        responsableReal = responsableFromDatos.trim();
      } else if (responsableRS && responsableRS !== 'RESPONSABLE' && responsableRS.trim() !== '') {
        responsableReal = responsableRS.trim();
      } else if (responsableLS && responsableLS !== 'RESPONSABLE' && responsableLS.trim() !== '') {
        responsableReal = responsableLS.trim();
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

      // 🚀 CORREGIDO: Calcular VENTA y TOTAL EFECTIVO correctamente
      const ventaCalculada = totalProductos - totalDctos - (pagosData.descuentos || 0);
      const totalEfectivoCalculado = ventaCalculada - (pagosData.nequi || 0) - (pagosData.daviplata || 0);

      const resumenData = {
        base_caja: baseCaja,
        total_despacho: totalProductos,
        total_pedidos: 0,
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
      const datosCumplimiento = localStorage.getItem(`cumplimiento_${dia}_${idVendedor}_${fechaAUsar}`);
      let cumplimientoData = {};
      if (datosCumplimiento) {
        try {
          cumplimientoData = JSON.parse(datosCumplimiento);
        } catch (error) {
          console.error(`❌ Error parsing cumplimiento para ${idVendedor}:`, error);
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

      console.log(`🚀 ${idVendedor} - Enviando datos a API:`, datosParaGuardar);
      const resultado = await cargueService.guardarCargueCompleto(datosParaGuardar);

      if (resultado.error) {
        console.error(`❌ Error enviando datos de ${idVendedor}:`, resultado.message);
        throw new Error(`Error guardando datos de ${idVendedor}: ${resultado.message}`);
      }

      console.log(`✅ ${idVendedor} - Datos enviados a la API exitosamente`);
      return true;
    } catch (error) {
      console.error(`❌ Error guardando datos de ${idVendedor}:`, error);
      throw error;
    }
  };

  // Guardar todos los datos en la base de datos usando el contexto como fuente de verdad (FUNCIÓN ORIGINAL - mantener para compatibilidad)
  const guardarDatosCompletos = async (fechaAUsar, idsVendedores) => {
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

      // 1. Guardar datos de cada ID usando las funciones específicas
      for (const id of idsVendedores) {
        console.log(`💾 Guardando datos de ${id}...`);

        try {
          await guardarDatosDelID(fechaAUsar, id);
          console.log(`✅ ${id} - Datos guardados exitosamente`);
        } catch (error) {
          console.error(`❌ Error guardando ${id}:`, error);
          throw new Error(`Error guardando datos de ${id}: ${error.message}`);
        }
      }

      console.log('✅ TODOS LOS IDs GUARDADOS EXITOSAMENTE');
      return true;
    } catch (error) {
      console.error('❌ Error guardando datos completos:', error);
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
      localStorage.setItem(`estado_boton_${dia}_${idSheet}_${fechaSeleccionada}`, 'COMPLETADO');

      console.log(`🎉 ${idSheet} - FINALIZACIÓN COMPLETADA EXITOSAMENTE`);
      alert(`✅ ${idSheet} - Jornada Finalizada y Guardada\n\n📊 Datos guardados en base de datos\n⬆️ Devoluciones: ${totalDevoluciones}\n🗑️ Vencidas: ${totalVencidas}\n🧹 LocalStorage limpiado`);

    } catch (error) {
      console.error(`❌ ${idSheet} - Error en finalización:`, error);
      alert(`❌ ${idSheet} - Error en finalización: ${error.message}\n\nLos datos pueden no haberse guardado correctamente.`);
    }

    setLoading(false);
  };

  // Manejar finalizar (devoluciones, vencidas y guardado completo) - FUNCIÓN ORIGINAL - mantener para compatibilidad
  const manejarFinalizar = async () => {
    console.log('🚀🚀🚀 BOTÓN FINALIZAR PRESIONADO 🚀🚀🚀');
    console.log('⏰ Timestamp:', Date.now());
    console.log('📊 Productos validados disponibles:', productosValidados.length);

    setLoading(true);

    try {
      console.log('🏁 INICIANDO FINALIZACIÓN COMPLETA');

      const { simpleStorage } = await import('../../services/simpleStorage');

      // 🚀 CORREGIDO: Validar que fechaSeleccionada existe y no usar fallback a fecha actual
      if (!fechaSeleccionada) {
        console.error('❌ ERROR: fechaSeleccionada no está definida');
        alert('❌ Error: No se ha seleccionado una fecha válida');
        setLoading(false);
        return;
      }

      const fechaAUsar = fechaSeleccionada; // ✅ Usar directamente fechaSeleccionada sin fallback
      console.log(`📅 Fecha a usar para guardado: ${fechaAUsar}`);
      const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];

      // VALIDACIÓN PREVIA: Verificar lotes vencidos
      console.log('🔍 VALIDACIÓN PREVIA: Verificando lotes vencidos...');
      const lotesValidos = await validarLotesVencidos(fechaAUsar, idsVendedores);

      if (!lotesValidos) {
        setLoading(false);
        return; // No continuar si faltan lotes vencidos
      }

      console.log('✅ VALIDACIÓN COMPLETADA - Continuando con finalización...');

      let totalDevoluciones = 0;
      let totalVencidas = 0;

      // PASO 0: Inventario ya fue afectado en DESPACHO (según README)
      console.log('📋 PASO 0: Inventario ya procesado en DESPACHO - continuando con devoluciones/vencidas...');

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
      localStorage.setItem(`estado_boton_${dia}_${fechaSeleccionada}`, 'COMPLETADO');

      console.log('🎉 FINALIZACIÓN COMPLETADA EXITOSAMENTE');
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
      localStorage.setItem(`estado_despacho_${dia}_${idSheet}_${fechaSeleccionada}`, 'DESPACHO');
      localStorage.setItem(`estado_boton_${dia}_${idSheet}_${fechaSeleccionada}`, 'FINALIZAR');

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

  // Manejar despacho (SÍ afectar inventario según README original) - FUNCIÓN ORIGINAL - mantener para compatibilidad
  const manejarDespacho = async () => {
    console.log('🚚 EJECUTANDO DESPACHO - AFECTANDO INVENTARIO (según README)');

    // 🚀 VALIDACIÓN ESTRICTA: NO permitir avanzar si hay productos pendientes
    if (productosPendientes.length > 0) {
      const listaPendientes = productosPendientes.map(p => {
        const checksFaltantes = [];
        if (!p.vendedor) checksFaltantes.push('V');
        if (!p.despachador) checksFaltantes.push('D');

        return `• ${p.nombre} (${p.totalCantidad} und) - Faltan: ${checksFaltantes.join(', ')}`;
      }).join('\n');

      const confirmar = window.confirm(
        `❌ NO SE PUEDE REALIZAR EL DESPACHO\n\n` +
        `Los siguientes productos tienen cantidades pero NO están completamente verificados:\n\n` +
        `${listaPendientes}\n\n` +
        `🔧 SOLUCIÓN: Marque los checkboxes V (Vendedor) y D (Despachador) faltantes para todos los productos con cantidad.\n\n` +
        `⚠️ TODOS los productos con cantidad deben tener ambos checkboxes marcados antes de continuar.\n\n` +
        `✅ ACEPTAR: Volver a revisar y marcar checkboxes\n` +
        `❌ CANCELAR: Quedarse en esta pantalla`
      );

      if (confirmar) {
        console.log('🔄 Usuario eligió volver a revisar checkboxes');
      } else {
        console.log('🚫 Usuario eligió quedarse en la pantalla actual');
      }

      console.log('🚫 DESPACHO BLOQUEADO - Hay productos sin verificar completamente');
      return; // Salir sin hacer despacho
    }

    setLoading(true);

    try {
      console.log('📋 Productos validados para despacho:', productosValidados.length);

      // DESCONTAR del inventario (según README: "Actualización de inventario solo en DESPACHO")
      for (const producto of productosValidados) {
        console.log(`🔥 PROCESANDO: ${producto.nombre}`);

        const productoId = producto.id || null;

        if (productoId) {
          console.log(`   - Producto ID: ${productoId}`);
          console.log(`   - Cantidad a descontar: ${producto.totalCantidad}`);

          const resultado = await actualizarInventario(productoId, producto.totalCantidad, 'RESTAR');

          console.log(`✅ DESCONTADO: ${producto.nombre} - Stock actualizado: ${resultado.stock_actual}`);
        } else {
          console.error(`❌ Producto ID NO encontrado para: ${producto.nombre}`);
        }
      }

      // 🔒 Congelar producción al cambiar a FINALIZAR
      congelarProduccion('FINALIZAR INICIADO');

      // Cambiar estado a FINALIZAR
      setEstado('FINALIZAR');
      localStorage.setItem(`estado_despacho_${dia}_${fechaSeleccionada}`, 'DESPACHO');
      localStorage.setItem(`estado_boton_${dia}_${fechaSeleccionada}`, 'FINALIZAR');

      console.log('✅ DESPACHO COMPLETADO - Inventario afectado según README');

      // Mostrar resumen con advertencia si hay pendientes
      const resumen = productosValidados.map(p => `${p.nombre}: ${p.totalCantidad} und`).join('\n');
      const totalGeneral = productosValidados.reduce((sum, p) => sum + p.totalCantidad, 0);

      let mensaje = `✅ Despacho Realizado\n\n${resumen}\n\n🎯 TOTAL DESCONTADO DEL INVENTARIO: ${totalGeneral} unidades`;

      if (productosPendientes.length > 0) {
        const totalPendientes = productosPendientes.reduce((sum, p) => sum + p.totalCantidad, 0);
        mensaje += `\n\n⚠️ PRODUCTOS NO DESPACHADOS: ${productosPendientes.length} productos (${totalPendientes} unidades)\n(Falta marcar checkboxes V y/o D)`;
      }

      alert(mensaje);

    } catch (error) {
      console.error('❌ Error en despacho:', error);
      alert(`❌ Error en despacho: ${error.message}`);
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
          variant: 'outline-secondary', // Gris suave con borde
          disabled: loading, // Solo deshabilitar si está cargando
          onClick: () => {
            // 🔒 Congelar producción al activar alistamiento
            congelarProduccion('ALISTAMIENTO ACTIVADO');

            setEstado('ALISTAMIENTO_ACTIVO');
            localStorage.setItem(`estado_despacho_${dia}_${fechaSeleccionada}`, 'ALISTAMIENTO');
            localStorage.setItem(`estado_boton_${dia}_${fechaSeleccionada}`, 'ALISTAMIENTO_ACTIVO');
          }
        };
      case 'ALISTAMIENTO_ACTIVO':
        return {
          texto: '📦 ALISTAMIENTO ACTIVO',
          variant: 'dark', // Gris oscuro (activado)
          disabled: listos.length === 0 || loading, // Validar productos listos
          onClick: () => {
            // 🔒 Congelar producción al cambiar a DESPACHO
            congelarProduccion('DESPACHO INICIADO');

            setEstado('DESPACHO');
            localStorage.setItem(`estado_boton_${dia}_${fechaSeleccionada}`, 'DESPACHO');
            console.log('🚚 Cambiando a DESPACHO');
          }
        };
      case 'DESPACHO':
        return {
          texto: pendientes.length > 0 ? '🚚 DESPACHO (BLOQUEADO)' : '🚚 DESPACHO',
          variant: pendientes.length > 0 ? 'warning' : 'primary',
          disabled: loading || pendientes.length > 0, // Deshabilitar si hay pendientes
          onClick: manejarDespacho
        };
      case 'FINALIZAR':
        return {
          texto: '✅ FINALIZAR',
          variant: 'success',
          disabled: loading,
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
            fontWeight: 'bold'
          }}
        >
          {loading ? '⏳ Procesando...' : config.texto}
        </Button>
      </div>

      {/* Indicador de productos pendientes */}
      {idSheet === 'ID1' && productosPendientes.length > 0 && (
        <div className="mt-2">
          <div className="alert alert-warning py-2 px-3" style={{ fontSize: '0.85em' }}>
            <strong>⚠️ DESPACHO BLOQUEADO</strong><br />
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