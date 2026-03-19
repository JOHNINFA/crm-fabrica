import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Table, Form, Modal, Button } from 'react-bootstrap';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { cargueRealtimeService } from '../../services/cargueRealtimeService'; // 🆕 Sincronización tiempo real

const createEmptyPagoRow = () => ({
  concepto: '',
  descuentos: 0,
  nequi: 0,
  daviplata: 0
});

const createEmptyPagoRows = (count = 10) => Array(count).fill(null).map(() => createEmptyPagoRow());

const ResumenVentas = ({ datos, productos = [], dia, idSheet, fechaSeleccionada, estadoCompletado = false }) => {

  // 🔍 DEBUG: Monitorear cambios en el prop datos
  useEffect(() => {
    console.log(`🔍 RESUMEN - Prop 'datos' cambió:`, datos);
  }, [datos]);
  const [filas, setFilas] = useState(createEmptyPagoRows());

  const [baseCaja, setBaseCaja] = useState(0);
  const [mostrarModalFvto, setMostrarModalFvto] = useState(false);

  // 🆕 Estado para nota del cargue
  const [notaCargue, setNotaCargue] = useState('');
  const notaTimeoutRef = useRef(null);
  const notaEditandoRef = useRef(false); // 🔧 Flag para evitar sobrescritura mientras edita
  const pendingResumenSyncInProgressRef = useRef(false);
  const filasRef = useRef(filas);
  const baseCajaRef = useRef(baseCaja);

  const fechaFormateadaLS = useMemo(() => {
    if (fechaSeleccionada instanceof Date) {
      return fechaSeleccionada.toISOString().split('T')[0];
    }
    return fechaSeleccionada || '';
  }, [fechaSeleccionada]);

  const baseCajaStorageKey = useMemo(
    () => `base_caja_${dia}_${idSheet}_${fechaFormateadaLS}`,
    [dia, idSheet, fechaFormateadaLS]
  );

  const conceptosStorageKey = useMemo(
    () => `conceptos_pagos_${dia}_${idSheet}_${fechaFormateadaLS}`,
    [dia, idSheet, fechaFormateadaLS]
  );

  const pendingResumenStorageKey = useMemo(
    () => `resumen_pending_${dia}_${idSheet}_${fechaFormateadaLS}`,
    [dia, idSheet, fechaFormateadaLS]
  );

  const tieneDatosEnFilas = (rows = []) => rows.some(
    (fila) => fila.concepto || fila.descuentos > 0 || fila.nequi > 0 || fila.daviplata > 0
  );

  const readPendingResumen = () => {
    try {
      const raw = localStorage.getItem(pendingResumenStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error('❌ Error leyendo resumen pendiente:', error);
      return {};
    }
  };

  const writePendingResumen = (pendingResumen) => {
    const cleaned = {};

    if (Array.isArray(pendingResumen?.filas)) {
      cleaned.filas = pendingResumen.filas;
    }

    if (Object.prototype.hasOwnProperty.call(pendingResumen || {}, 'baseCaja')) {
      cleaned.baseCaja = pendingResumen.baseCaja;
    }

    if (Object.keys(cleaned).length === 0) {
      localStorage.removeItem(pendingResumenStorageKey);
      return;
    }

    cleaned.updatedAt = Date.now();
    localStorage.setItem(pendingResumenStorageKey, JSON.stringify(cleaned));
  };

  const markPendingResumenField = (field, value) => {
    const pendingResumen = readPendingResumen();
    pendingResumen[field] = value;
    writePendingResumen(pendingResumen);
  };

  const clearPendingResumenField = (field, expectedValue = undefined) => {
    const pendingResumen = readPendingResumen();
    if (!Object.prototype.hasOwnProperty.call(pendingResumen, field)) return;

    if (expectedValue !== undefined) {
      const actualValue = pendingResumen[field];
      if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
        return;
      }
    }

    delete pendingResumen[field];
    delete pendingResumen.updatedAt;
    writePendingResumen(pendingResumen);
  };

  const applyPendingResumen = ({ filas: filasBase = createEmptyPagoRows(), baseCaja: baseCajaBase = 0 }) => {
    const pendingResumen = readPendingResumen();

    return {
      filas: Array.isArray(pendingResumen.filas) ? pendingResumen.filas : filasBase,
      baseCaja: Object.prototype.hasOwnProperty.call(pendingResumen, 'baseCaja')
        ? pendingResumen.baseCaja
        : baseCajaBase
    };
  };

  const persistResumenRowsToLocal = (rows) => {
    localStorage.setItem(conceptosStorageKey, JSON.stringify(rows));
  };

  const persistBaseCajaToLocal = (value) => {
    localStorage.setItem(baseCajaStorageKey, `${value || 0}`);
  };

  useEffect(() => {
    filasRef.current = filas;
  }, [filas]);

  useEffect(() => {
    baseCajaRef.current = baseCaja;
  }, [baseCaja]);

  // 🆕 Cargar nota desde BD
  useEffect(() => {
    const cargarNota = async () => {
      // 🔧 No recargar si el usuario está editando
      if (notaEditandoRef.current) {
        console.log('⏸️ Nota en edición, no recargar desde BD');
        return;
      }

      if (!fechaSeleccionada || !idSheet || !dia) return;
      try {
        const fechaStr = typeof fechaSeleccionada === 'string' ? fechaSeleccionada : fechaSeleccionada.toISOString?.().split('T')[0];
        const resp = await fetch(`/api/cargue-resumen/?vendedor_id=${idSheet}&dia=${dia.toUpperCase()}&fecha=${fechaStr}`);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data) && data.length > 0) {
            setNotaCargue(data[0].nota || '');
            console.log('✅ Nota cargada desde BD:', data[0].nota);
          } else {
            setNotaCargue('');
          }
        }
      } catch (e) {
        console.error('Error cargando nota:', e);
      }
    };
    cargarNota();
  }, [fechaSeleccionada, idSheet, dia]);

  // 🆕 Guardar nota en BD (onBlur)
  const guardarNota = async () => {
    if (!fechaSeleccionada || !idSheet || !dia) {
      console.log('⚠️ Faltan parámetros para guardar nota');
      return;
    }

    // 🔧 Desactivar flag de edición
    notaEditandoRef.current = false;

    try {
      const fechaStr = typeof fechaSeleccionada === 'string' ? fechaSeleccionada : fechaSeleccionada.toISOString?.().split('T')[0];
      console.log(`💾 Guardando nota para ${idSheet} - ${dia} - ${fechaStr}:`, notaCargue);

      const resp = await fetch(`/api/cargue-resumen/?vendedor_id=${idSheet}&dia=${dia.toUpperCase()}&fecha=${fechaStr}`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          // PATCH existente
          const patchResp = await fetch(`/api/cargue-resumen/${data[0].id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nota: notaCargue })
          });

          if (patchResp.ok) {
            console.log('✅ Nota guardada exitosamente (PATCH)');
          } else {
            const errorText = await patchResp.text();
            console.error('❌ Error en PATCH:', patchResp.status, errorText);
          }
        } else {
          // POST nuevo - incluir todos los campos requeridos
          const postResp = await fetch(`/api/cargue-resumen/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vendedor_id: idSheet,
              dia: dia.toUpperCase(),
              fecha: fechaStr,
              nota: notaCargue,
              base_caja: 0,
              total_despacho: 0,
              total_pedidos: 0,
              total_dctos: 0,
              venta: 0,
              total_efectivo: 0
            })
          });

          if (postResp.ok) {
            console.log('✅ Nota creada exitosamente (POST)');
          } else {
            const errorText = await postResp.text();
            console.error('❌ Error en POST:', postResp.status, errorText);
          }
        }
      } else {
        console.error('❌ Error consultando cargue-resumen:', resp.status);
      }
    } catch (e) {
      console.error('❌ Error guardando nota:', e);
    }
  };

  // 🆕 Helper para cargar base caja desde BD
  const cargarBaseCajaDesdeDB = async (fechaActual) => {
    try {
      let baseCajaDB = 0;
      const endpoint = idSheet === 'ID1' ? 'cargue-id1' :
        idSheet === 'ID2' ? 'cargue-id2' :
          idSheet === 'ID3' ? 'cargue-id3' :
            idSheet === 'ID4' ? 'cargue-id4' :
              idSheet === 'ID5' ? 'cargue-id5' : 'cargue-id6';

      const urlCargue = `/api/${endpoint}/?dia=${dia.toUpperCase()}&fecha=${fechaActual}`;
      const responseCargue = await fetch(urlCargue);

      if (responseCargue.ok) {
        const dataCargue = await responseCargue.json();
        if (Array.isArray(dataCargue) && dataCargue.length > 0) {
          for (const item of dataCargue) {
            if (item.base_caja && parseFloat(item.base_caja) > 0) {
              baseCajaDB = parseFloat(item.base_caja);
              console.log(`✅ RESUMEN - ${idSheet} Base caja cargada desde BD: ${item.base_caja}`);
              break;
            }
          }
        }
      }
      return baseCajaDB;
    } catch (error) {
      console.error(`❌ RESUMEN - Error cargando base caja:`, error);
      return 0;
    }
  };

  // 🚀 MEJORADO: Cargar datos según el estado (COMPLETADO = BD, otros = localStorage)
  const cargarDatos = async () => {
    try {
      const fechaActual = fechaFormateadaLS;

      // 🆕 NUEVO: SIEMPRE intentar cargar desde BD primero (para modo incógnito)
      console.log(`🔍 RESUMEN - ${idSheet} Iniciando carga de datos desde BD...`);

      // Primero intentar cargar desde cargue-pagos (tabla dedicada de pagos)
      const urlPagos = `/api/cargue-pagos/?vendedor_id=${idSheet}&dia=${dia.toUpperCase()}&fecha=${fechaActual}`;
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
          const baseCajaDB = await cargarBaseCajaDesdeDB(fechaActual);
          const resumenProtegido = applyPendingResumen({
            filas: conceptosFromDB,
            baseCaja: baseCajaDB
          });
          cargandoDesdeBD.current = true;
          setFilas(resumenProtegido.filas);
          setBaseCaja(resumenProtegido.baseCaja);
          persistResumenRowsToLocal(resumenProtegido.filas);
          persistBaseCajaToLocal(resumenProtegido.baseCaja);
          setTimeout(() => {
            cargandoDesdeBD.current = false;
          }, 500);

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

        const url = `/api/${endpoint}/?dia=${dia.toUpperCase()}&fecha=${fechaActual}`;
        console.log(`🔍 RESUMEN - ${idSheet} cargando desde: ${url}`);

        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ RESUMEN - ${idSheet} datos completos desde BD:`, data.length, 'registros');

          // 🚀 NUEVO: Si no hay datos para la fecha exacta, buscar en fechas cercanas
          if (data.length === 0) {
            console.log(`🔍 RESUMEN - ${idSheet} No hay datos para ${fechaActual}, buscando en fechas cercanas...`);

            // Buscar sin filtro de fecha, solo por día
            const urlSinFecha = `/api/${endpoint}/?dia=${dia.toUpperCase()}`;
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

            const resumenProtegido = applyPendingResumen({
              filas: conceptosArray,
              baseCaja: baseCajaDB
            });
            setFilas(resumenProtegido.filas);
            setBaseCaja(resumenProtegido.baseCaja);
            persistResumenRowsToLocal(resumenProtegido.filas);
            persistBaseCajaToLocal(resumenProtegido.baseCaja);
          }
        }

        return;
      }

      // 🚀 CORREGIDO: Lógica para días no completados - ESPECÍFICA POR ID
      console.log(`📂 RESUMEN - ${idSheet} Día no completado, cargando desde localStorage...`);

      // 🚀 CORREGIDO: Cargar BASE CAJA específica por ID
      const baseCajaGuardada = localStorage.getItem(baseCajaStorageKey);
      console.log(`📂 RESUMEN - ${idSheet} Buscando base caja en: ${baseCajaStorageKey} = ${baseCajaGuardada}`);

      let baseCajaLocal = 0;
      if (baseCajaGuardada) {
        baseCajaLocal = parseInt(baseCajaGuardada.replace(/[^0-9]/g, '')) || 0;
        console.log(`📂 RESUMEN - ${idSheet} Base caja cargada: ${baseCajaLocal}`);
      }

      // 🚀 CORREGIDO: Cargar CONCEPTOS específicos por ID
      const conceptosGuardados = localStorage.getItem(conceptosStorageKey);
      console.log(`📂 RESUMEN - ${idSheet} Buscando conceptos en: ${conceptosStorageKey}`);

      if (conceptosGuardados) {
        try {
          const conceptos = JSON.parse(conceptosGuardados);
          console.log(`📂 RESUMEN - ${idSheet} Conceptos cargados:`, conceptos);
          const resumenProtegido = applyPendingResumen({
            filas: Array.isArray(conceptos) ? conceptos : createEmptyPagoRows(),
            baseCaja: baseCajaLocal
          });
          setFilas(resumenProtegido.filas);
          setBaseCaja(resumenProtegido.baseCaja);
        } catch (error) {
          console.error(`❌ RESUMEN - ${idSheet} Error cargando conceptos:`, error);
        }
      } else {
        // 🆕 NUEVO: Si localStorage está vacío, intentar cargar desde el endpoint dedicado cargue-pagos
        console.log(`📂 RESUMEN - ${idSheet} No hay conceptos en localStorage, intentando cargar desde cargue-pagos...`);

        try {
          // Primero intentar con el nuevo endpoint cargue-pagos
          const urlPagos = `/api/cargue-pagos/?vendedor_id=${idSheet}&dia=${dia.toUpperCase()}&fecha=${fechaActual}`;
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
              // Desactivar el flag después de que React procese el cambio
              setTimeout(() => {
                cargandoDesdeBD.current = false;
              }, 500);

              // Guardar en localStorage para próximas cargas
              const baseCajaDB = await cargarBaseCajaDesdeDB(fechaActual);
              const resumenProtegido = applyPendingResumen({
                filas: conceptosFromDB,
                baseCaja: baseCajaDB || baseCajaLocal
              });
              setFilas(resumenProtegido.filas);
              setBaseCaja(resumenProtegido.baseCaja);
              persistResumenRowsToLocal(resumenProtegido.filas);
              persistBaseCajaToLocal(resumenProtegido.baseCaja);

              return;
            }
          }
        } catch (error) {
          console.error(`❌ RESUMEN - ${idSheet} Error cargando desde cargue-pagos:`, error);
        }

        // Si no hay datos en cargue-pagos, inicializar vacío
        console.log(`📂 RESUMEN - ${idSheet} No hay datos, usando array vacío`);
        const resumenProtegido = applyPendingResumen({
          filas: createEmptyPagoRows(),
          baseCaja: baseCajaLocal
        });
        setFilas(resumenProtegido.filas);
        setBaseCaja(resumenProtegido.baseCaja);
      }
    } catch (error) {
      console.error('❌ Error cargando datos de resumen:', error);
      const resumenProtegido = applyPendingResumen({
        filas: filasRef.current,
        baseCaja: baseCajaRef.current
      });
      setFilas(resumenProtegido.filas);
      setBaseCaja(resumenProtegido.baseCaja);
    }
  };

  // 🔧 Ref para bloquear pagosDetallados durante cambio de ID
  const cambiandoIDRef = useRef(false);

  // 🚀 NUEVO: Limpiar datos al cambiar de ID para evitar mostrar datos de otro vendedor
  useEffect(() => {
    console.log(`🔄 RESUMEN - Cambio de ID detectado: ${idSheet}`);

    // 🔧 Bloquear pagosDetallados para evitar rebote visual
    cambiandoIDRef.current = true;

    // Limpiar datos inmediatamente al cambiar de ID
    setFilas(createEmptyPagoRows());
    setBaseCaja(0);
    setNotaCargue('');

    // Luego cargar los datos específicos del nuevo ID
    if (idSheet) {
      setTimeout(() => {
        cargarDatos();
        // 🔧 Desbloquear después de que cargarDatos haya tenido tiempo de ejecutar
        setTimeout(() => {
          cambiandoIDRef.current = false;
        }, 300);
      }, 100);
    } else {
      cambiandoIDRef.current = false;
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
    if (!idSheet || !fechaFormateadaLS) return;
    persistBaseCajaToLocal(baseCaja);
    console.log(`💾 RESUMEN - ${idSheet} Base caja guardada: ${baseCajaStorageKey} = ${baseCaja}`);
    cargaInicialBaseCaja.current = false;
  }, [baseCaja, idSheet, fechaFormateadaLS, baseCajaStorageKey]);

  // 🆕 Ref para evitar sincronización en carga inicial de conceptos
  const cargaInicialConceptos = useRef(true);
  // 🆕 NUEVO: Ref para indicar que estamos cargando datos desde BD (no sincronizar)
  const cargandoDesdeBD = useRef(false);

  const sincronizarBaseCaja = async (valorBaseCaja) => {
    const result = await cargueRealtimeService.actualizarCampoGlobal(
      idSheet,
      dia,
      fechaFormateadaLS,
      'base_caja',
      valorBaseCaja,
      'Sistema'
    );

    if (result.success && result.action !== 'pending_sync') {
      clearPendingResumenField('baseCaja', valorBaseCaja);
      console.log(`✅ Base caja sincronizada: ${valorBaseCaja} (${result.action})`);
    } else if (result.success) {
      console.log('⏳ Base caja pendiente de producto base para sincronizarse');
    } else {
      console.error(`❌ Error sincronizando base_caja:`, result.error);
    }

    return result;
  };

  const sincronizarFilasPagos = async (rows) => {
    const filasConDatos = rows.filter((fila) => (
      fila.concepto || fila.descuentos > 0 || fila.nequi > 0 || fila.daviplata > 0
    ));

    const totalDescuentos = rows.reduce((sum, fila) => sum + (fila.descuentos || 0), 0);
    const totalNequi = rows.reduce((sum, fila) => sum + (fila.nequi || 0), 0);
    const totalDaviplata = rows.reduce((sum, fila) => sum + (fila.daviplata || 0), 0);
    const conceptosTexto = rows.filter((fila) => fila.concepto).map((fila) => fila.concepto).join(', ');

    const response = await fetch('/api/cargue-pagos/sync_pagos/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendedor_id: idSheet,
        dia: dia.toUpperCase(),
        fecha: fechaFormateadaLS,
        filas: filasConDatos,
        usuario: 'CRM'
      })
    });

    const result = await response.json();

    if (result.success) {
      clearPendingResumenField('filas', rows);
      console.log(`✅ Pagos sincronizados: ${result.message}`);
    } else {
      console.error(`❌ Error sincronizando pagos:`, result.error);
    }

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
        fechaFormateadaLS,
        campoSync,
        valor,
        'Sistema'
      ).catch(err => console.error(`❌ Error sincronizando ${campoSync}:`, err));
    });

    return result;
  };

  useEffect(() => {
    if (!idSheet || !fechaFormateadaLS) return;

    console.log(`🔍 SYNC DEBUG - idSheet: ${idSheet}, hayDatos: ${tieneDatosEnFilas(filas)}, cargaInicial: ${cargaInicialConceptos.current}`);
    persistResumenRowsToLocal(filas);
    console.log(`💾 RESUMEN - ${idSheet} Conceptos guardados: ${conceptosStorageKey}`, filas.filter(f => f.concepto || f.descuentos > 0 || f.nequi > 0 || f.daviplata > 0));
    cargaInicialConceptos.current = false;
  }, [filas, idSheet, fechaFormateadaLS, conceptosStorageKey]);

  useEffect(() => {
    if (!fechaFormateadaLS || typeof window === 'undefined') return undefined;

    const flushPendingResumen = async () => {
      if (pendingResumenSyncInProgressRef.current) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      const pendingResumen = readPendingResumen();
      const hasFilasPendientes = Array.isArray(pendingResumen.filas);
      const hasBaseCajaPendiente = Object.prototype.hasOwnProperty.call(pendingResumen, 'baseCaja');

      if (!hasFilasPendientes && !hasBaseCajaPendiente) return;

      pendingResumenSyncInProgressRef.current = true;

      try {
        if (hasFilasPendientes) {
          await sincronizarFilasPagos(pendingResumen.filas);
        }

        if (hasBaseCajaPendiente) {
          await sincronizarBaseCaja(pendingResumen.baseCaja);
        }
      } catch (error) {
        console.error('❌ Error reintentando resumen pendiente:', error);
      } finally {
        pendingResumenSyncInProgressRef.current = false;
      }
    };

    const handleOnline = () => {
      console.log(`🌐 ${idSheet} - Reintentando resumen pendiente...`);
      flushPendingResumen();
    };

    const intervalId = window.setInterval(flushPendingResumen, 10000);
    window.addEventListener('online', handleOnline);
    flushPendingResumen();

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
    };
  }, [dia, idSheet, fechaFormateadaLS, pendingResumenStorageKey]);

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return `$${Math.round(num).toLocaleString()}`;
  };

  // 🆕 Resumen informativo: solo vencidas con motivo FVTO
  // Regla de discriminación:
  // - Si todos los lotes con motivo son FVTO => FVTO toma todo "vencidas".
  // - Si hay mezcla de motivos (FVTO + otros) => FVTO cuenta por # de lotes FVTO.
  const resumenVencidasFvto = useMemo(() => {
    const detalle = [];
    let totalCantidad = 0;
    let totalValor = 0;

    (Array.isArray(productos) ? productos : []).forEach((producto) => {
      const lotes = Array.isArray(producto?.lotesVencidos) ? producto.lotesVencidos : [];
      const vencidasReportadas = Math.max(0, parseInt(producto?.vencidas, 10) || 0);
      if (vencidasReportadas <= 0) return;

      const lotesConMotivo = lotes.filter((lote) => String(lote?.motivo || '').trim() !== '');
      const lotesFvto = lotesConMotivo.filter(
        (lote) => String(lote?.motivo || '').trim().toUpperCase() === 'FVTO'
      ).length;
      const lotesOtros = Math.max(0, lotesConMotivo.length - lotesFvto);

      if (lotesFvto <= 0) return;

      let cantidadFvto = 0;
      if (lotesOtros === 0) {
        // Solo FVTO -> todo lo reportado en vencidas es FVTO
        cantidadFvto = vencidasReportadas;
      } else {
        // Mezcla de motivos -> discriminar por cantidad de lotes FVTO
        cantidadFvto = Math.min(vencidasReportadas, lotesFvto);
      }
      if (cantidadFvto <= 0) return;

      const valorUnitario = Math.max(0, Math.round(parseFloat(producto?.valor) || 0));
      const subtotal = cantidadFvto * valorUnitario;

      detalle.push({
        producto: producto?.producto || 'PRODUCTO',
        cantidad: cantidadFvto,
        valorUnitario,
        subtotal
      });

      totalCantidad += cantidadFvto;
      totalValor += subtotal;
    });

    detalle.sort((a, b) => b.subtotal - a.subtotal);
    return {
      detalle,
      totalCantidad,
      totalValor
    };
  }, [productos]);

  // 🆕 Navegación tipo Excel con flechas en tabla de pagos
  const handleKeyDownPagos = (e, index, campo) => {
    const columnas = ['concepto', 'descuentos', 'nequi', 'daviplata'];

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const direction = e.key === 'ArrowUp' ? -1 : 1;
      const nextId = `pago-${campo}-${index + direction}`;
      const nextElement = document.getElementById(nextId);
      if (nextElement) {
        nextElement.focus();
        setTimeout(() => nextElement.select(), 0);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const currentIndex = columnas.indexOf(campo);
      if (currentIndex !== -1) {
        const direction = e.key === 'ArrowLeft' ? -1 : 1;
        const nextCampoIndex = currentIndex + direction;
        if (nextCampoIndex >= 0 && nextCampoIndex < columnas.length) {
          const nextCampo = columnas[nextCampoIndex];
          const nextId = `pago-${nextCampo}-${index}`;
          const nextElement = document.getElementById(nextId);
          if (nextElement) {
            e.preventDefault();
            nextElement.focus();
            setTimeout(() => nextElement.select(), 0);
          }
        }
      }
    }
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
    persistResumenRowsToLocal(newFilas);
    markPendingResumenField('filas', newFilas);
    sincronizarFilasPagos(newFilas).catch(err => console.error(`❌ Error en fetch sync_pagos:`, err));
  };

  const calcularTotal = (campo) => {
    return filas.reduce((total, fila) => total + (fila[campo] || 0), 0);
  };

  const handleBaseCajaChange = (e) => {
    const value = e.target.value;
    const numValue = value.replace(/[^0-9]/g, '');
    const nuevoValor = numValue ? parseInt(numValue) : 0;
    setBaseCaja(nuevoValor);
    persistBaseCajaToLocal(nuevoValor);
    markPendingResumenField('baseCaja', nuevoValor);
    sincronizarBaseCaja(nuevoValor).catch(err => console.error(`❌ Error sincronizando base_caja:`, err));
  };

  const calcularTotalDespacho = () => {
    return productos.reduce((total, producto) => {
      const neto = Number(producto.neto) || 0;
      return total + Math.round(neto);
    }, 0);
  };

  // 🆕 SINCRONIZACIÓN DE TOTALES CALCULADOS
  const cargaInicialTotales = useRef(true);
  const ultimosTotalesGuardados = useRef({});

  // ✅ ACTIVADO: Sincronización de totales segura
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

    // Calcular totales actuales
    const totalDespacho = calcularTotalDespacho();
    const totalPedidosVal = datos.totalPedidos || 0;
    const totalDctosVal = calcularTotal('descuentos');

    // 🚀 CORRECCIÓN: VENTA es el total bruto (sin restar gastos/descuentos)
    // Antes: baseCaja + totalDespacho + totalPedidosVal - totalDctosVal
    // Ahora: baseCaja + totalDespacho + totalPedidosVal
    const ventaVal = baseCaja + totalDespacho + totalPedidosVal;

    // El efectivo sí se reduce por los gastos (descuentos) y pagos digitales
    const totalEfectivoVal = ventaVal - totalDctosVal - calcularTotal('nequi') - calcularTotal('daviplata');

    // Comparar con últimos guardados para evitar bucles infinitos
    const nuevosTotales = { d: totalDespacho, p: totalPedidosVal, v: ventaVal, e: totalEfectivoVal };
    if (JSON.stringify(nuevosTotales) === JSON.stringify(ultimosTotalesGuardados.current)) {
      return;
    }

    const timer = setTimeout(() => {
      ultimosTotalesGuardados.current = nuevosTotales;
      console.log(`🔄 Sincronizando totales BD: despacho=${totalDespacho}, pedidos=${totalPedidosVal}`);

      const totalesASincronizar = {
        total_despacho: totalDespacho,
        total_pedidos: totalPedidosVal,
        total_dctos: totalDctosVal,
        venta: ventaVal,
        total_efectivo: totalEfectivoVal
      };

      Object.entries(totalesASincronizar).forEach(([campo, valor]) => {
        cargueRealtimeService.actualizarCampoGlobal(
          idSheet, dia, fechaParaBD, campo, valor, 'Sistema'
        ).catch(e => console.error(e));
      });
    }, 2000); // Debounce 2s para estabilidad

    return () => clearTimeout(timer);
  }, [productos, baseCaja, filas, datos.totalPedidos, idSheet, dia, fechaSeleccionada]);

  // 🚀 ACTUALIZADO: Sincronizar Pagos Detallados de App Móvil
  useEffect(() => {
    // 🔧 No procesar si estamos cambiando de ID (evita rebote visual)
    if (cambiandoIDRef.current) {
      console.log('⏸️ RESUMEN - Ignorando pagosDetallados durante cambio de ID');
      return;
    }

    // Verificar si hay datos detallados (prioridad)
    if (datos.pagosDetallados && Array.isArray(datos.pagosDetallados) && datos.pagosDetallados.length > 0) {
      console.log('📲 Sincronizando pagos detallados en tabla:', datos.pagosDetallados.length);

      setFilas(prevFilas => {
        // Copia profunda para evitar mutaciones accidentales
        const newFilas = prevFilas.map(f => ({ ...f }));

        // 1. Limpiar fila antigua agrupada si existe (migración)
        const indexAntiguo = newFilas.findIndex(f => f.concepto === 'Pagos App Móvil');
        if (indexAntiguo >= 0) {
          console.log('🧹 Limpiando fila antigua agrupada');
          newFilas[indexAntiguo] = { concepto: '', descuentos: 0, nequi: 0, daviplata: 0 };
        }

        // 2. Procesar cada pago detallado
        datos.pagosDetallados.forEach(pago => {
          const conceptoPago = pago.concepto || 'Cliente App';

          // Buscar si ya existe fila con este concepto exacto
          const indexExistente = newFilas.findIndex(f =>
            f.concepto && f.concepto.trim().toUpperCase() === conceptoPago.trim().toUpperCase()
          );

          if (indexExistente >= 0) {
            // Actualizar fila existente (solo valores digitales)
            // Se preserva 'descuentos' si ya existía
            newFilas[indexExistente] = {
              ...newFilas[indexExistente],
              nequi: pago.nequi || 0,
              daviplata: pago.daviplata || 0,
              origen: pago.origen // 🆕 Copiar origen para el badge
            };
          } else {
            // Buscar primer slot vacio
            const indexVacio = newFilas.findIndex(f => !f.concepto && f.nequi === 0 && f.daviplata === 0 && f.descuentos === 0);

            if (indexVacio >= 0) {
              // Insertar nueva fila
              newFilas[indexVacio] = {
                concepto: conceptoPago,
                descuentos: 0,
                nequi: pago.nequi || 0,
                daviplata: pago.daviplata || 0,
                origen: pago.origen // 🆕 Copiar origen
              };
            } else {
              // 🚀 NUEVO: Si la tabla está llena, AGREGAR nueva fila al final (Push)
              console.log('📲 Tabla llena, expandiendo...', conceptoPago);
              newFilas.push({
                concepto: conceptoPago,
                descuentos: 0,
                nequi: pago.nequi || 0,
                daviplata: pago.daviplata || 0,
                origen: pago.origen // 🆕 Copiar origen
              });
            }
          }
        });

        // Asegurar que siempre haya al menos unas filas vacías al final para editar
        // Si la tabla creció mucho, aseguramos un mínimo de visually pleasing empty space
        const filasVaciasAlFinal = 3;
        let vaciasContadas = 0;
        for (let i = newFilas.length - 1; i >= 0; i--) {
          if (!newFilas[i].concepto && !newFilas[i].nequi && !newFilas[i].daviplata) {
            vaciasContadas++;
          } else {
            break;
          }
        }

        // Agregar filas extra si faltan
        if (vaciasContadas < filasVaciasAlFinal) {
          const faltantes = filasVaciasAlFinal - vaciasContadas;
          for (let k = 0; k < faltantes; k++) {
            newFilas.push({ concepto: '', descuentos: 0, nequi: 0, daviplata: 0 });
          }
        }

        return newFilas;
      });
    }
  }, [datos.pagosDetallados]);

  return (
    <div className="resumen-container" style={{ marginLeft: '15px' }}>

      {/* Leyenda de Origen */}
      <div className="d-flex gap-3 mb-2 ps-1" style={{ fontSize: '0.8rem', color: '#6c757d' }}>
        <div className="d-flex align-items-center">
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0d6efd', marginRight: '6px' }}></span>
          <span>Pedido</span>
        </div>
        <div className="d-flex align-items-center">
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#198754', marginRight: '6px' }}></span>
          <span>Venta Ruta</span>
        </div>
        <div className="d-flex align-items-center">
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc3545', marginRight: '6px' }}></span>
          <span>Descuento</span>
        </div>
      </div>

      {/* Tabla de Pagos con SCROLL */}
      <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px', marginBottom: '1rem' }}>
        <Table bordered hover className="resumen-pagos mb-0" style={{ border: 'none', boxShadow: 'none' }}>
          <thead className="table-header" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8f9fa' }}>
            <tr>
              <th style={{ width: '150px', backgroundColor: '#f8f9fa' }}>CONCEPTO</th>
              <th style={{ width: '120px', textAlign: 'center', backgroundColor: '#f8f9fa' }}>DESCUENTOS</th>
              <th style={{ width: '120px', textAlign: 'center', backgroundColor: '#f8f9fa' }}>NEQUI</th>
              <th style={{ width: '120px', textAlign: 'center', backgroundColor: '#f8f9fa' }}>DAVIPLATA</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, i) => (
              <tr key={i}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {/* Indicador Visual (Punto) */}
                    {fila.origen === 'PEDIDO' && (
                      <span
                        title="Pedido App"
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#0d6efd', // Azul
                          marginRight: '6px',
                          flexShrink: 0
                        }}
                      />
                    )}
                    {fila.origen === 'VENTA' && (
                      <span
                        title="Venta Ruta"
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#198754', // Verde
                          marginRight: '6px',
                          flexShrink: 0
                        }}
                      />
                    )}

                    {/* Indicador de Descuento (Rojo) */}
                    {fila.descuentos > 0 && (
                      <span
                        title="Tiene Descuento"
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#dc3545', // Rojo
                          marginRight: '6px',
                          flexShrink: 0
                        }}
                      />
                    )}

                    <OverlayTrigger
                      placement="top"
                      delay={{ show: 100, hide: 100 }}
                      overlay={<Tooltip id={`tooltip-${i}`}>{fila.concepto || 'Sin concepto'}</Tooltip>}
                    >
                      <Form.Control
                        id={`pago-concepto-${i}`}
                        type="text"
                        value={fila.concepto}
                        onChange={(e) => handleInputChange(i, 'concepto', e.target.value)}
                        onKeyDown={(e) => handleKeyDownPagos(e, i, 'concepto')}
                        onFocus={(e) => e.target.select()}
                        style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', padding: '4px', textOverflow: 'ellipsis', width: '100%' }}
                      />
                    </OverlayTrigger>
                  </div>
                </td>
                <td>
                  <Form.Control
                    id={`pago-descuentos-${i}`}
                    type="text"
                    className="text-center"
                    value={fila.descuentos ? formatCurrency(fila.descuentos) : ''}
                    onChange={(e) => handleInputChange(i, 'descuentos', e.target.value)}
                    onKeyDown={(e) => handleKeyDownPagos(e, i, 'descuentos')}
                    onFocus={(e) => e.target.select()}
                    style={{ border: 'none', background: 'transparent' }}
                  />
                </td>
                <td>
                  <Form.Control
                    id={`pago-nequi-${i}`}
                    type="text"
                    className="text-center"
                    value={fila.nequi ? formatCurrency(fila.nequi) : ''}
                    onChange={(e) => handleInputChange(i, 'nequi', e.target.value)}
                    onKeyDown={(e) => handleKeyDownPagos(e, i, 'nequi')}
                    onFocus={(e) => e.target.select()}
                    style={{ border: 'none', background: 'transparent' }}
                  />
                </td>
                <td>
                  <Form.Control
                    id={`pago-daviplata-${i}`}
                    type="text"
                    className="text-center"
                    value={fila.daviplata ? formatCurrency(fila.daviplata) : ''}
                    onChange={(e) => handleInputChange(i, 'daviplata', e.target.value)}
                    onKeyDown={(e) => handleKeyDownPagos(e, i, 'daviplata')}
                    onFocus={(e) => e.target.select()}
                    style={{ border: 'none', background: 'transparent' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10, backgroundColor: '#e9ecef' }}>
            <tr>
              <td className="fw-bold bg-light">TOTAL</td>
              <td className="text-center fw-bold bg-light">{formatCurrency(calcularTotal('descuentos'))}</td>
              <td className="text-center fw-bold bg-light">{formatCurrency(calcularTotal('nequi'))}</td>
              <td className="text-center fw-bold bg-light">{formatCurrency(calcularTotal('daviplata'))}</td>
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
          {/* 🚀 CORRECCIÓN VISUAL: Venta Bruta (sin restar descuentos/gastos) */}
          <div className="text-end">{formatCurrency(baseCaja + calcularTotalDespacho() + (datos.totalPedidos || 0))}</div>
        </div>

        <div className="bg-light p-2">
          <strong>TOTAL EFECTIVO:</strong>
          <div className="text-end d-flex justify-content-end align-items-center">
            {(calcularTotal('nequi') > 0 || calcularTotal('daviplata') > 0 || calcularTotal('descuentos') > 0) && (
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    Se descontaron del efectivo:<br />
                    {calcularTotal('descuentos') > 0 && <>Descuentos: {formatCurrency(calcularTotal('descuentos'))}<br /></>}
                    {calcularTotal('nequi') > 0 && <>Nequi: {formatCurrency(calcularTotal('nequi'))}<br /></>}
                    {calcularTotal('daviplata') > 0 && <>Daviplata: {formatCurrency(calcularTotal('daviplata'))}</>}
                  </Tooltip>
                }
              >
                <span className="text-primary me-3 d-flex align-items-center" style={{ cursor: 'pointer', marginTop: '2px' }}>
                  <i className="bi bi-eye-fill"></i>
                </span>
              </OverlayTrigger>
            )}
            {/* Efectivo = Venta Bruta - Gastos(Dctos) - Nequi - Daviplata */}
            {formatCurrency((baseCaja + calcularTotalDespacho() + (datos.totalPedidos || 0)) - calcularTotal('descuentos') - calcularTotal('nequi') - calcularTotal('daviplata'))}
          </div>
        </div>

        <div className="bg-light p-2 mt-2">
          <strong>VENCIDAS FVTO:</strong>
          <div className="text-end d-flex justify-content-end align-items-center">
            {resumenVencidasFvto.totalValor > 0 && (
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    Ver detalle de vencidas con motivo FVTO
                  </Tooltip>
                }
              >
                <span
                  className="text-primary me-3 d-flex align-items-center"
                  style={{ cursor: 'pointer', marginTop: '2px' }}
                  onClick={() => setMostrarModalFvto(true)}
                >
                  <i className="bi bi-eye-fill"></i>
                </span>
              </OverlayTrigger>
            )}
            {formatCurrency(resumenVencidasFvto.totalValor)}
          </div>
        </div>

        {/* 🆕 Mostrar novedad de precios especiales si existe */}
        {datos.novedad && (
          <div className="bg-warning p-2 mt-2" style={{ borderRadius: '4px', backgroundColor: '#fff3cd' }}>
            <strong style={{ color: '#856404' }}>📝 Novedad:</strong>
            <div className="text-end" style={{ color: '#856404' }}>{datos.novedad}</div>
          </div>
        )}
      </div>

      {/* 🔒 Campo de Notas - OCULTO temporalmente, se trabajará después */}
      {/* <div className="mt-3 p-3" style={{ border: '1px solid #dee2e6', borderRadius: '4px', backgroundColor: '#f8f9fa' }}>
        <strong style={{ fontSize: '0.9rem', color: '#495057' }}>📝 NOTAS DEL DÍA</strong>
        <textarea
          className="form-control mt-2"
          rows="3"
          placeholder="Escribe aquí las notas u observaciones del día..."
          value={notaCargue}
          onChange={(e) => {
            notaEditandoRef.current = true;
            setNotaCargue(e.target.value);
          }}
          onFocus={() => {
            notaEditandoRef.current = true;
          }}
          onBlur={guardarNota}
          disabled={estadoCompletado}
          style={{ fontSize: '0.9rem', resize: 'vertical', border: '1px solid #ced4da' }}
        />
        {!estadoCompletado && (
          <small className="text-muted d-block mt-1">
            Las notas se guardan automáticamente al hacer clic fuera del campo
          </small>
        )}
      </div> */}

      <Modal
        show={mostrarModalFvto}
        onHide={() => setMostrarModalFvto(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Detalle Vencidas FVTO ({idSheet})</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {resumenVencidasFvto.detalle.length === 0 ? (
            <div className="text-muted text-center py-4">
              No hay productos con vencidas motivo FVTO.
            </div>
          ) : (
            <Table bordered hover size="sm" className="mb-0">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="text-center">Cantidad FVTO</th>
                  <th className="text-end">Valor Unitario</th>
                  <th className="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {resumenVencidasFvto.detalle.map((item, idx) => (
                  <tr key={`${item.producto}-${idx}`}>
                    <td>{item.producto}</td>
                    <td className="text-center">{item.cantidad}</td>
                    <td className="text-end">{formatCurrency(item.valorUnitario)}</td>
                    <td className="text-end">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th className="text-end">TOTAL</th>
                  <th className="text-center">{resumenVencidasFvto.totalCantidad}</th>
                  <th></th>
                  <th className="text-end">{formatCurrency(resumenVencidasFvto.totalValor)}</th>
                </tr>
              </tfoot>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setMostrarModalFvto(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ResumenVentas;
