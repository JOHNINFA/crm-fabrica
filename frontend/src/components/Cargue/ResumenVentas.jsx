import React, { useState, useEffect, useRef } from 'react';
import { Table, Form } from 'react-bootstrap';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { cargueRealtimeService } from '../../services/cargueRealtimeService'; // 🆕 Sincronización tiempo real

const ResumenVentas = ({ datos, productos = [], dia, idSheet, fechaSeleccionada, estadoCompletado = false }) => {

  // 🔍 DEBUG: Monitorear cambios en el prop datos
  useEffect(() => {
    console.log(`🔍 RESUMEN - Prop 'datos' cambió:`, datos);
  }, [datos]);
  const [filas, setFilas] = useState(Array(10).fill().map(() => ({
    concepto: '',
    descuentos: 0,
    nequi: 0,
    daviplata: 0
  })));

  const [baseCaja, setBaseCaja] = useState(0);

  // 🆕 Helper para cargar base caja desde BD
  const cargarBaseCajaDesdeDB = async (fechaActual) => {
    try {
      const endpoint = idSheet === 'ID1' ? 'cargue-id1' :
        idSheet === 'ID2' ? 'cargue-id2' :
          idSheet === 'ID3' ? 'cargue-id3' :
            idSheet === 'ID4' ? 'cargue-id4' :
              idSheet === 'ID5' ? 'cargue-id5' : 'cargue-id6';

      const urlCargue = `http://localhost:8000/api/${endpoint}/?dia=${dia.toUpperCase()}&fecha=${fechaActual}`;
      const responseCargue = await fetch(urlCargue);

      if (responseCargue.ok) {
        const dataCargue = await responseCargue.json();
        if (Array.isArray(dataCargue) && dataCargue.length > 0) {
          for (const item of dataCargue) {
            if (item.base_caja && parseFloat(item.base_caja) > 0) {
              setBaseCaja(parseFloat(item.base_caja));
              console.log(`✅ RESUMEN - ${idSheet} Base caja cargada desde BD: ${item.base_caja}`);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ RESUMEN - Error cargando base caja:`, error);
    }
  };

  // 🚀 MEJORADO: Cargar datos según el estado (COMPLETADO = BD, otros = localStorage)
  const cargarDatos = async () => {
    try {
      const fechaActual = fechaSeleccionada;

      // 🆕 NUEVO: SIEMPRE intentar cargar desde BD primero (para modo incógnito)
      console.log(`🔍 RESUMEN - ${idSheet} Iniciando carga de datos desde BD...`);

      // Primero intentar cargar desde cargue-pagos (tabla dedicada de pagos)
      const urlPagos = `http://localhost:8000/api/cargue-pagos/?vendedor_id=${idSheet}&dia=${dia.toUpperCase()}&fecha=${fechaActual}`;
      console.log(`🔍 RESUMEN - ${idSheet} Cargando pagos desde: ${urlPagos}`);

      const responsePagos = await fetch(urlPagos);

      if (responsePagos.ok) {
        const dataPagos = await responsePagos.json();
        console.log(`✅ RESUMEN - ${idSheet} Filas de pagos desde BD:`, dataPagos.length);

        if (Array.isArray(dataPagos) && dataPagos.length > 0) {
          // Convertir las filas del endpoint a formato del componente
          const conceptosFromDB = Array(10).fill().map(() => ({
            concepto: '',
            descuentos: 0,
            nequi: 0,
            daviplata: 0
          }));

          dataPagos.forEach((pago, index) => {
            if (index < 10) {
              conceptosFromDB[index] = {
                concepto: pago.concepto || '',
                descuentos: Math.round(parseFloat(pago.descuentos)) || 0,
                nequi: Math.round(parseFloat(pago.nequi)) || 0,
                daviplata: Math.round(parseFloat(pago.daviplata)) || 0
              };
            }
          });

          console.log(`✅ RESUMEN - ${idSheet} Pagos cargados desde BD:`, conceptosFromDB.filter(f => f.concepto || f.nequi > 0 || f.daviplata > 0 || f.descuentos > 0));

          // Marcar que estamos cargando desde BD para evitar resincronización
          cargandoDesdeBD.current = true;
          setFilas(conceptosFromDB);
          setTimeout(() => {
            cargandoDesdeBD.current = false;
          }, 500);

          // También cargar base caja desde CargueIDx
          await cargarBaseCajaDesdeDB(fechaActual);
          return; // Datos cargados desde BD exitosamente
        }
      }

      // Si no hay datos en cargue-pagos, intentar cargar desde CargueIDx
      console.log(`📂 RESUMEN - ${idSheet} No hay datos en cargue-pagos, intentando CargueIDx...`);

      // 🚀 CORREGIDO: Verificar estado COMPLETADO desde localStorage
      const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaActual}`) || 'ALISTAMIENTO';
      const estaCompletado = estadoCompletado || estadoBoton === 'COMPLETADO';

      console.log(`🔍 RESUMEN - ${idSheet} Estado:`, {
        estadoCompletado,
        estadoBoton,
        estaCompletado,
        dia,
        fechaActual
      });

      // 🚀 NUEVO: Si está COMPLETADO, cargar SIEMPRE desde BD
      if (estaCompletado) {
        console.log(`🔍 RESUMEN - ${idSheet} Día COMPLETADO, cargando desde BD: ${dia} - ${fechaActual}`);

        // 🚀 CORREGIDO: Usar el mismo endpoint que los productos (ya incluye conceptos y base_caja)
        const endpoint = idSheet === 'ID1' ? 'cargue-id1' :
          idSheet === 'ID2' ? 'cargue-id2' :
            idSheet === 'ID3' ? 'cargue-id3' :
              idSheet === 'ID4' ? 'cargue-id4' :
                idSheet === 'ID5' ? 'cargue-id5' : 'cargue-id6';

        const url = `http://localhost:8000/api/${endpoint}/?dia=${dia.toUpperCase()}&fecha=${fechaActual}`;
        console.log(`🔍 RESUMEN - ${idSheet} cargando desde: ${url}`);

        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ RESUMEN - ${idSheet} datos completos desde BD:`, data.length, 'registros');

          // 🚀 NUEVO: Si no hay datos para la fecha exacta, buscar en fechas cercanas
          if (data.length === 0) {
            console.log(`🔍 RESUMEN - ${idSheet} No hay datos para ${fechaActual}, buscando en fechas cercanas...`);

            // Buscar sin filtro de fecha, solo por día
            const urlSinFecha = `http://localhost:8000/api/${endpoint}/?dia=${dia.toUpperCase()}`;
            const responseSinFecha = await fetch(urlSinFecha);

            if (responseSinFecha.ok) {
              const dataSinFecha = await responseSinFecha.json();
              console.log(`🔍 RESUMEN - ${idSheet} Datos encontrados sin filtro de fecha:`, dataSinFecha.length, 'registros');

              if (dataSinFecha.length > 0) {
                // Usar los datos más recientes
                const datosRecientes = dataSinFecha.sort((a, b) => new Date(b.fecha_actualizacion) - new Date(a.fecha_actualizacion));
                console.log(`🔍 RESUMEN - ${idSheet} Usando datos más recientes de fecha:`, datosRecientes[0].fecha);
                data.push(...datosRecientes);
              }
            }
          }

          if (Array.isArray(data) && data.length > 0) {
            // Procesar conceptos de la BD (agrupar por concepto)
            const conceptosMap = new Map();
            let baseCajaDB = 0;

            data.forEach((item, index) => {
              // 🔍 DEBUG: Mostrar cada item para ver qué datos llegan
              if (index < 3) { // Solo mostrar los primeros 3 para no saturar
                console.log(`🔍 RESUMEN - Item ${index} para ${idSheet}:`, {
                  concepto: item.concepto,
                  descuentos: item.descuentos,
                  nequi: item.nequi,
                  daviplata: item.daviplata,
                  base_caja: item.base_caja
                });
              }

              // 🚀 CORREGIDO: Buscar el registro con los valores MÁS ALTOS de pagos
              // Los datos de pagos se guardan en el primer producto, pero necesitamos encontrarlos
              const descuentosActual = parseFloat(item.descuentos) || 0;
              const nequiActual = parseFloat(item.nequi) || 0;
              const daviplataActual = parseFloat(item.daviplata) || 0;
              const tieneConcepto = item.concepto && item.concepto.trim();
              const tieneMontos = descuentosActual > 0 || nequiActual > 0 || daviplataActual > 0;

              if (tieneConcepto || tieneMontos) {
                // Buscar si ya tenemos datos guardados
                const pagosExistentes = conceptosMap.get('PAGOS');

                if (!pagosExistentes) {
                  // Primer registro con datos
                  conceptosMap.set('PAGOS', {
                    concepto: item.concepto || '',
                    descuentos: descuentosActual,
                    nequi: nequiActual,
                    daviplata: daviplataActual
                  });
                } else {
                  // Ya hay datos, tomar los valores MÁS ALTOS (último actualizado)
                  conceptosMap.set('PAGOS', {
                    concepto: item.concepto || pagosExistentes.concepto,
                    descuentos: Math.max(descuentosActual, pagosExistentes.descuentos),
                    nequi: Math.max(nequiActual, pagosExistentes.nequi),
                    daviplata: Math.max(daviplataActual, pagosExistentes.daviplata)
                  });
                }

                console.log(`🔍 RESUMEN - Datos de pagos procesados para ${idSheet}:`, {
                  concepto: item.concepto,
                  descuentos: descuentosActual,
                  nequi: nequiActual,
                  daviplata: daviplataActual,
                  registro: conceptosMap.get('PAGOS')
                });
              }

              // Procesar base caja (tomar el valor MÁXIMO, ya que puede haber varios registros)
              if (item.base_caja && parseFloat(item.base_caja) > baseCajaDB) {
                baseCajaDB = parseFloat(item.base_caja);
                console.log(`🔍 RESUMEN - Base caja encontrada:`, item.base_caja, '-> parsed:', baseCajaDB);
              }
            });

            // Convertir conceptos a array de 10 elementos
            const conceptosArray = Array(10).fill().map(() => ({
              concepto: '',
              descuentos: 0,
              nequi: 0,
              daviplata: 0
            }));

            let index = 0;
            for (const concepto of conceptosMap.values()) {
              if (index < 10) {
                conceptosArray[index] = concepto;
                index++;
              }
            }




            setFilas(conceptosArray);
            setBaseCaja(baseCajaDB);
          }
        }

        return;
      }

      // 🚀 CORREGIDO: Lógica para días no completados - ESPECÍFICA POR ID
      console.log(`📂 RESUMEN - ${idSheet} Día no completado, cargando desde localStorage...`);

      // 🚀 CORREGIDO: Cargar BASE CAJA específica por ID
      const baseCajaKey = `base_caja_${dia}_${idSheet}_${fechaActual}`;
      const baseCajaGuardada = localStorage.getItem(baseCajaKey);
      console.log(`📂 RESUMEN - ${idSheet} Buscando base caja en: ${baseCajaKey} = ${baseCajaGuardada}`);

      if (baseCajaGuardada) {
        const baseCajaValor = parseInt(baseCajaGuardada.replace(/[^0-9]/g, '')) || 0;
        console.log(`📂 RESUMEN - ${idSheet} Base caja cargada: ${baseCajaValor}`);
        setBaseCaja(baseCajaValor);
      }

      // 🚀 CORREGIDO: Cargar CONCEPTOS específicos por ID
      const conceptosKey = `conceptos_pagos_${dia}_${idSheet}_${fechaActual}`;
      const conceptosGuardados = localStorage.getItem(conceptosKey);
      console.log(`📂 RESUMEN - ${idSheet} Buscando conceptos en: ${conceptosKey}`);

      if (conceptosGuardados) {
        try {
          const conceptos = JSON.parse(conceptosGuardados);
          console.log(`📂 RESUMEN - ${idSheet} Conceptos cargados:`, conceptos);
          setFilas(conceptos);
        } catch (error) {
          console.error(`❌ RESUMEN - ${idSheet} Error cargando conceptos:`, error);
        }
      } else {
        // 🆕 NUEVO: Si localStorage está vacío, intentar cargar desde el endpoint dedicado cargue-pagos
        console.log(`📂 RESUMEN - ${idSheet} No hay conceptos en localStorage, intentando cargar desde cargue-pagos...`);

        try {
          // Primero intentar con el nuevo endpoint cargue-pagos
          const urlPagos = `http://localhost:8000/api/cargue-pagos/?vendedor_id=${idSheet}&dia=${dia.toUpperCase()}&fecha=${fechaActual}`;
          console.log(`🔍 RESUMEN - ${idSheet} Cargando pagos desde: ${urlPagos}`);

          const responsePagos = await fetch(urlPagos);

          if (responsePagos.ok) {
            const dataPagos = await responsePagos.json();
            console.log(`✅ RESUMEN - ${idSheet} Filas de pagos desde BD:`, dataPagos.length);

            if (Array.isArray(dataPagos) && dataPagos.length > 0) {
              // Convertir las filas del endpoint a formato del componente
              const conceptosFromDB = Array(10).fill().map(() => ({
                concepto: '',
                descuentos: 0,
                nequi: 0,
                daviplata: 0
              }));

              dataPagos.forEach((pago, index) => {
                if (index < 10) {
                  conceptosFromDB[index] = {
                    concepto: pago.concepto || '',
                    descuentos: Math.round(parseFloat(pago.descuentos)) || 0,
                    nequi: Math.round(parseFloat(pago.nequi)) || 0,
                    daviplata: Math.round(parseFloat(pago.daviplata)) || 0
                  };
                }
              });

              console.log(`✅ RESUMEN - ${idSheet} Pagos cargados:`, conceptosFromDB.filter(f => f.concepto || f.nequi > 0 || f.daviplata > 0));

              // 🆕 IMPORTANTE: Marcar que estamos cargando desde BD para evitar resincronización
              cargandoDesdeBD.current = true;
              setFilas(conceptosFromDB);
              // Desactivar el flag después de que React procese el cambio
              setTimeout(() => {
                cargandoDesdeBD.current = false;
              }, 500);

              // Guardar en localStorage para próximas cargas
              localStorage.setItem(conceptosKey, JSON.stringify(conceptosFromDB));

              // También cargar base caja desde CargueIDx
              const endpoint = idSheet === 'ID1' ? 'cargue-id1' :
                idSheet === 'ID2' ? 'cargue-id2' :
                  idSheet === 'ID3' ? 'cargue-id3' :
                    idSheet === 'ID4' ? 'cargue-id4' :
                      idSheet === 'ID5' ? 'cargue-id5' : 'cargue-id6';

              const urlCargue = `http://localhost:8000/api/${endpoint}/?dia=${dia.toUpperCase()}&fecha=${fechaActual}`;
              const responseCargue = await fetch(urlCargue);

              if (responseCargue.ok) {
                const dataCargue = await responseCargue.json();
                if (Array.isArray(dataCargue) && dataCargue.length > 0) {
                  for (const item of dataCargue) {
                    if (item.base_caja && parseFloat(item.base_caja) > 0) {
                      setBaseCaja(parseFloat(item.base_caja));
                      localStorage.setItem(baseCajaKey, item.base_caja.toString());
                      break;
                    }
                  }
                }
              }

              return;
            }
          }
        } catch (error) {
          console.error(`❌ RESUMEN - ${idSheet} Error cargando desde cargue-pagos:`, error);
        }

        // Si no hay datos en cargue-pagos, inicializar vacío
        console.log(`📂 RESUMEN - ${idSheet} No hay datos, usando array vacío`);
        setFilas(Array(10).fill().map(() => ({
          concepto: '',
          descuentos: 0,
          nequi: 0,
          daviplata: 0
        })));
      }
    } catch (error) {
      console.error('❌ Error cargando datos de resumen:', error);
    }
  };

  // 🚀 NUEVO: Limpiar datos al cambiar de ID para evitar mostrar datos de otro vendedor
  useEffect(() => {
    console.log(`🔄 RESUMEN - Cambio de ID detectado: ${idSheet}`);

    // Limpiar datos inmediatamente al cambiar de ID
    setFilas(Array(10).fill().map(() => ({
      concepto: '',
      descuentos: 0,
      nequi: 0,
      daviplata: 0
    })));
    setBaseCaja(0);

    // Luego cargar los datos específicos del nuevo ID
    if (idSheet) {
      setTimeout(() => cargarDatos(), 100); // Pequeño delay para evitar conflictos
    }
  }, [idSheet]); // Solo cuando cambie el ID

  // Cargar datos al inicializar o cuando cambie el estado/fecha
  useEffect(() => {
    if (idSheet && (dia || fechaSeleccionada || estadoCompletado !== undefined)) {
      console.log(`🔄 RESUMEN - Recarga por cambio de parámetros: ${idSheet}`);
      cargarDatos();
    }
  }, [dia, fechaSeleccionada, estadoCompletado]); // Sin idSheet para evitar doble carga

  // 🚀 CORREGIDO: Guardar datos cuando cambien - ESPECÍFICO POR ID
  // 🆕 Ref para evitar sincronización en carga inicial
  const cargaInicialBaseCaja = useRef(true);

  useEffect(() => {
    const fechaActual = fechaSeleccionada;

    // 🚀 CORREGIDO: Guardar BASE CAJA específica por ID
    if (baseCaja > 0 && idSheet) {
      const baseCajaKey = `base_caja_${dia}_${idSheet}_${fechaActual}`;
      localStorage.setItem(baseCajaKey, baseCaja.toString());
      console.log(`💾 RESUMEN - ${idSheet} Base caja guardada: ${baseCajaKey} = ${baseCaja}`);

      // 🆕 SINCRONIZACIÓN EN TIEMPO REAL (solo si no es carga inicial)
      if (!cargaInicialBaseCaja.current) {
        // Convertir fecha a formato YYYY-MM-DD si es objeto Date
        let fechaParaBD;
        if (fechaSeleccionada instanceof Date) {
          const year = fechaSeleccionada.getFullYear();
          const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
          const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
          fechaParaBD = `${year}-${month}-${day}`;
        } else {
          fechaParaBD = fechaSeleccionada;
        }

        cargueRealtimeService.actualizarCampoGlobal(
          idSheet,
          dia,
          fechaParaBD,
          'base_caja',
          baseCaja,
          'Sistema'
        ).then(result => {
          if (result.success) {
            console.log(`✅ Base caja sincronizada: ${baseCaja} (${result.action})`);
          }
        }).catch(err => console.error(`❌ Error sincronizando base_caja:`, err));
      }
      cargaInicialBaseCaja.current = false;
    }
  }, [baseCaja, dia, idSheet, fechaSeleccionada]);

  // 🆕 Ref para evitar sincronización en carga inicial de conceptos
  const cargaInicialConceptos = useRef(true);
  // 🆕 NUEVO: Ref para indicar que estamos cargando datos desde BD (no sincronizar)
  const cargandoDesdeBD = useRef(false);

  useEffect(() => {
    const fechaActual = fechaSeleccionada;

    // 🚀 CORREGIDO: Guardar CONCEPTOS específicos por ID
    const hayDatos = filas.some(fila => fila.concepto || fila.descuentos > 0 || fila.nequi > 0 || fila.daviplata > 0);

    console.log(`🔍 SYNC DEBUG - idSheet: ${idSheet}, hayDatos: ${hayDatos}, cargaInicial: ${cargaInicialConceptos.current}`);

    if (hayDatos && idSheet) {
      const conceptosKey = `conceptos_pagos_${dia}_${idSheet}_${fechaActual}`;
      localStorage.setItem(conceptosKey, JSON.stringify(filas));
      console.log(`💾 RESUMEN - ${idSheet} Conceptos guardados: ${conceptosKey}`, filas.filter(f => f.concepto || f.descuentos > 0 || f.nequi > 0 || f.daviplata > 0));

      // 🚫 NO sincronizar aquí - solo en handleInputChange para evitar sobreescrituras
      // La sincronización con BD solo debe ocurrir cuando el usuario EDITA manualmente
    }
  }, [filas, dia, idSheet, fechaSeleccionada]);

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return `$${Math.round(num).toLocaleString()}`;
  };

  const handleInputChange = (index, campo, value) => {
    console.log(`🔥🔥🔥 handleInputChange EJECUTADO - index: ${index}, campo: ${campo}, value: ${value}`);
    const newFilas = [...filas];
    if (campo === 'concepto') {
      newFilas[index][campo] = value;
    } else {
      const numValue = value.replace(/[^0-9]/g, '');
      newFilas[index][campo] = numValue ? parseInt(numValue) : 0;
    }
    setFilas(newFilas);

    // 🆕 SINCRONIZACIÓN INMEDIATA AL EDITAR
    // Convertir fecha a formato YYYY-MM-DD
    let fechaParaBD;
    if (fechaSeleccionada instanceof Date) {
      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      fechaParaBD = `${year}-${month}-${day}`;
    } else {
      fechaParaBD = fechaSeleccionada;
    }

    // Calcular totales con las nuevas filas
    const totalDescuentos = newFilas.reduce((sum, f) => sum + (f.descuentos || 0), 0);
    const totalNequi = newFilas.reduce((sum, f) => sum + (f.nequi || 0), 0);
    const totalDaviplata = newFilas.reduce((sum, f) => sum + (f.daviplata || 0), 0);
    const conceptosTexto = newFilas.filter(f => f.concepto).map(f => f.concepto).join(', ');

    console.log(`🔄 Sincronizando pagos: concepto=${conceptosTexto}, desc=${totalDescuentos}, nequi=${totalNequi}, davi=${totalDaviplata}`);

    // 🆕 NUEVO: Sincronizar FILAS COMPLETAS con el endpoint dedicado
    const filasConDatos = newFilas.filter(f => f.concepto || f.descuentos > 0 || f.nequi > 0 || f.daviplata > 0);

    console.log(`🔄 Sincronizando ${filasConDatos.length} filas con BD...`);
    console.log(`📤 PAYLOAD: vendedor=${idSheet}, dia=${dia.toUpperCase()}, fecha=${fechaParaBD}, filas:`, filasConDatos);

    fetch('http://localhost:8000/api/cargue-pagos/sync_pagos/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendedor_id: idSheet,
        dia: dia.toUpperCase(),
        fecha: fechaParaBD,
        filas: filasConDatos,
        usuario: 'CRM'
      })
    })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          console.log(`✅ Pagos sincronizados: ${result.message}`);
        } else {
          console.error(`❌ Error sincronizando pagos:`, result.error);
        }
      })
      .catch(err => console.error(`❌ Error en fetch sync_pagos:`, err));

    // También sincronizar TOTALES en CargueIDx (retrocompatibilidad)
    const camposASincronizar = {
      concepto: conceptosTexto,
      descuentos: totalDescuentos,
      nequi: totalNequi,
      daviplata: totalDaviplata
    };

    Object.entries(camposASincronizar).forEach(([campoSync, valor]) => {
      cargueRealtimeService.actualizarCampoGlobal(
        idSheet,
        dia,
        fechaParaBD,
        campoSync,
        valor,
        'Sistema'
      ).then(result => {
        if (result.success) {
          console.log(`✅ Total sincronizado: ${campoSync} = ${valor}`);
        }
      }).catch(err => console.error(`❌ Error sincronizando ${campoSync}:`, err));
    });
  };

  const calcularTotal = (campo) => {
    return filas.reduce((total, fila) => total + (fila[campo] || 0), 0);
  };

  const handleBaseCajaChange = (e) => {
    const value = e.target.value;
    const numValue = value.replace(/[^0-9]/g, '');
    setBaseCaja(numValue ? parseInt(numValue) : 0);
  };

  const calcularTotalDespacho = () => {
    return productos.reduce((total, producto) => {
      const neto = Number(producto.neto) || 0;
      return total + Math.round(neto);
    }, 0);
  };

  // 🆕 SINCRONIZACIÓN DE TOTALES CALCULADOS
  // Ref para evitar sincronización en carga inicial
  const cargaInicialTotales = useRef(true);

  useEffect(() => {
    // Solo sincronizar si hay productos y no es carga inicial
    if (productos.length === 0 || cargaInicialTotales.current) {
      cargaInicialTotales.current = false;
      return;
    }

    // Convertir fecha a formato YYYY-MM-DD
    let fechaParaBD;
    if (fechaSeleccionada instanceof Date) {
      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      fechaParaBD = `${year}-${month}-${day}`;
    } else {
      fechaParaBD = fechaSeleccionada;
    }

    // Calcular totales
    const totalDespacho = calcularTotalDespacho();
    const totalPedidosVal = datos.totalPedidos || 0;
    const totalDctosVal = calcularTotal('descuentos');
    const ventaVal = baseCaja + totalDespacho + totalPedidosVal - totalDctosVal;
    const totalEfectivoVal = ventaVal - calcularTotal('nequi') - calcularTotal('daviplata');

    console.log(`🔄 Sincronizando totales: despacho=${totalDespacho}, pedidos=${totalPedidosVal}, venta=${ventaVal}`);

    // Sincronizar cada campo de totales
    const totalesASincronizar = {
      total_despacho: totalDespacho,
      total_pedidos: totalPedidosVal,
      total_dctos: totalDctosVal,
      venta: ventaVal,
      total_efectivo: totalEfectivoVal
    };

    Object.entries(totalesASincronizar).forEach(([campo, valor]) => {
      cargueRealtimeService.actualizarCampoGlobal(
        idSheet,
        dia,
        fechaParaBD,
        campo,
        valor,
        'Sistema'
      ).then(result => {
        if (result.success) {
          console.log(`✅ Total sincronizado: ${campo} = ${valor}`);
        }
      }).catch(err => console.error(`❌ Error sincronizando ${campo}:`, err));
    });
  }, [productos, baseCaja, filas, datos.totalPedidos]);

  return (
    <div className="resumen-container" style={{ marginLeft: '15px' }}>
      {/* Tabla de Pagos */}
      <div>
        <Table bordered className="resumen-pagos mb-3" style={{ border: '2px solid #dee2e6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <thead className="table-header">
            <tr>
              <th style={{ width: '150px' }}>CONCEPTO</th>
              <th style={{ width: '120px', textAlign: 'center' }}>DESCUENTOS</th>
              <th style={{ width: '120px', textAlign: 'center' }}>NEQUI</th>
              <th style={{ width: '120px', textAlign: 'center' }}>DAVIPLATA</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, i) => (
              <tr key={i}>
                <td>
                  <Form.Control
                    type="text"
                    value={fila.concepto}
                    onChange={(e) => handleInputChange(i, 'concepto', e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    type="text"
                    className="text-center"
                    value={fila.descuentos ? formatCurrency(fila.descuentos) : ''}
                    onChange={(e) => handleInputChange(i, 'descuentos', e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    type="text"
                    className="text-center"
                    value={fila.nequi ? formatCurrency(fila.nequi) : ''}
                    onChange={(e) => handleInputChange(i, 'nequi', e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    type="text"
                    className="text-center"
                    value={fila.daviplata ? formatCurrency(fila.daviplata) : ''}
                    onChange={(e) => handleInputChange(i, 'daviplata', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="fw-bold">TOTAL</td>
              <td className="text-center fw-bold">{formatCurrency(calcularTotal('descuentos'))}</td>
              <td className="text-center fw-bold">{formatCurrency(calcularTotal('nequi'))}</td>
              <td className="text-center fw-bold">{formatCurrency(calcularTotal('daviplata'))}</td>
            </tr>
          </tfoot>
        </Table>
      </div>

      {/* Resumen de Totales */}
      <div className="resumen-totales mt-4">
        <div className="bg-light p-2 mb-2">
          <strong>BASE CAJA</strong>
          <div className="text-end">
            <Form.Control
              type="text"
              style={{ width: '100px', fontSize: '14px', padding: '4px 8px', marginLeft: 'auto' }}
              className="text-center"
              value={baseCaja > 0 ? `$${baseCaja.toLocaleString()}` : ''}
              onChange={handleBaseCajaChange}
              disabled={estadoCompletado}
            />
          </div>
        </div>

        <div className="bg-light p-2 mb-2">
          <strong>TOTAL DESPACHO:</strong>
          <div className="text-end">{formatCurrency(calcularTotalDespacho())}</div>
        </div>

        <div className="bg-lightpink p-2 mb-2">
          <strong>TOTAL PEDIDOS:</strong>
          <div className="text-end">{formatCurrency(datos.totalPedidos)}</div>
        </div>

        <div className="bg-light p-2 mb-2">
          <strong>TOTAL DCTOS:</strong>
          <div className="text-end">{formatCurrency(calcularTotal('descuentos'))}</div>
        </div>

        <div className="bg-lightgreen p-2 mb-2">
          <strong>VENTA:</strong>
          <div className="text-end">{formatCurrency(baseCaja + calcularTotalDespacho() + (datos.totalPedidos || 0) - calcularTotal('descuentos'))}</div>
        </div>

        <div className="bg-light p-2">
          <strong>TOTAL EFECTIVO:</strong>
          <div className="text-end d-flex justify-content-end align-items-center">
            {(calcularTotal('nequi') > 0 || calcularTotal('daviplata') > 0) && (
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    Se descontaron pagos digitales:<br />
                    Nequi: {formatCurrency(calcularTotal('nequi'))}<br />
                    Daviplata: {formatCurrency(calcularTotal('daviplata'))}
                  </Tooltip>
                }
              >
                <span className="text-primary me-3 d-flex align-items-center" style={{ cursor: 'pointer', marginTop: '2px' }}>
                  <i className="bi bi-eye-fill"></i>
                </span>
              </OverlayTrigger>
            )}
            {formatCurrency((baseCaja + calcularTotalDespacho() + (datos.totalPedidos || 0) - calcularTotal('descuentos')) - calcularTotal('nequi') - calcularTotal('daviplata'))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumenVentas;