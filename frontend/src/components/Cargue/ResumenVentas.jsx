import React, { useState, useEffect } from 'react';
import { Table, Form } from 'react-bootstrap';

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

  // 🚀 MEJORADO: Cargar datos según el estado (COMPLETADO = BD, otros = localStorage)
  const cargarDatos = async () => {
    try {
      const fechaActual = fechaSeleccionada;

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

              // 🚀 CORREGIDO: Tomar solo el primer registro con datos de pagos
              // Los datos de pagos solo se guardan en el primer producto para evitar duplicación
              const tieneConcepto = item.concepto && item.concepto.trim();
              const tieneMontos = parseFloat(item.descuentos) > 0 || parseFloat(item.nequi) > 0 || parseFloat(item.daviplata) > 0;

              if ((tieneConcepto || tieneMontos) && conceptosMap.size === 0) {
                // Solo tomar el primer registro con datos de pagos
                conceptosMap.set('PAGOS', {
                  concepto: item.concepto || '',
                  descuentos: parseFloat(item.descuentos) || 0,
                  nequi: parseFloat(item.nequi) || 0,
                  daviplata: parseFloat(item.daviplata) || 0
                });

                console.log(`🔍 RESUMEN - Datos de pagos cargados para ${idSheet}:`, {
                  concepto: item.concepto,
                  descuentos: item.descuentos,
                  nequi: item.nequi,
                  daviplata: item.daviplata
                });
              }

              // Procesar base caja (tomar el primer valor no cero)
              if (item.base_caja && parseFloat(item.base_caja) > 0 && baseCajaDB === 0) {
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

            console.log('✅ RESUMEN - Conceptos procesados:', conceptosArray);
            console.log('✅ RESUMEN - Base caja:', baseCajaDB);

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
        const baseCajaValor = parseInt(baseCajaGuardada) || 0;
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
        console.log(`📂 RESUMEN - ${idSheet} No hay conceptos guardados, usando array vacío`);
        // Inicializar con array vacío si no hay datos
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
  useEffect(() => {
    const fechaActual = fechaSeleccionada;

    // 🚀 CORREGIDO: Guardar BASE CAJA específica por ID
    if (baseCaja > 0 && idSheet) {
      const baseCajaKey = `base_caja_${dia}_${idSheet}_${fechaActual}`;
      localStorage.setItem(baseCajaKey, baseCaja.toString());
      console.log(`💾 RESUMEN - ${idSheet} Base caja guardada: ${baseCajaKey} = ${baseCaja}`);
    }
  }, [baseCaja, dia, idSheet, fechaSeleccionada]);

  useEffect(() => {
    const fechaActual = fechaSeleccionada;

    // 🚀 CORREGIDO: Guardar CONCEPTOS específicos por ID
    const hayDatos = filas.some(fila => fila.concepto || fila.descuentos > 0 || fila.nequi > 0 || fila.daviplata > 0);
    if (hayDatos && idSheet) {
      const conceptosKey = `conceptos_pagos_${dia}_${idSheet}_${fechaActual}`;
      localStorage.setItem(conceptosKey, JSON.stringify(filas));
      console.log(`💾 RESUMEN - ${idSheet} Conceptos guardados: ${conceptosKey}`, filas.filter(f => f.concepto || f.descuentos > 0 || f.nequi > 0 || f.daviplata > 0));
    }
  }, [filas, dia, idSheet, fechaSeleccionada]);

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return `$${Math.round(num).toLocaleString()}`;
  };

  const handleInputChange = (index, campo, value) => {
    const newFilas = [...filas];
    if (campo === 'concepto') {
      newFilas[index][campo] = value;
    } else {
      const numValue = value.replace(/[^0-9]/g, '');
      newFilas[index][campo] = numValue ? parseInt(numValue) : 0;
    }
    setFilas(newFilas);
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

  return (
    <div className="resumen-container">



      {/* Tabla de Pagos */}
      <div style={{ paddingRight: '15px' }}>
        <Table bordered className="resumen-pagos mb-3" style={{ minWidth: '500px', marginRight: '20px' }}>
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
              value={baseCaja ? formatCurrency(baseCaja) : ''}
              onChange={handleBaseCajaChange}
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
          <div className="text-end">{formatCurrency(calcularTotalDespacho() - calcularTotal('descuentos'))}</div>
        </div>

        <div className="bg-light p-2">
          <strong>TOTAL EFECTIVO:</strong>
          <div className="text-end">{formatCurrency((calcularTotalDespacho() - calcularTotal('descuentos')) - calcularTotal('nequi') - calcularTotal('daviplata'))}</div>
        </div>
      </div>
    </div>
  );
};

export default ResumenVentas;