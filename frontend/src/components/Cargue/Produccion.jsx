import React, { useState, useEffect } from 'react';
import { Table, Row, Col } from 'react-bootstrap';
import { useProducts } from '../../hooks/useUnifiedProducts';
import { useVendedores } from '../../context/VendedoresContext';
import { cargueService, detalleCargueService } from '../../services/cargueService';
import './Produccion.css';

const Produccion = ({ dia, fechaSeleccionada }) => {
  const { products } = useProducts();
  const { calcularTotalProductos } = useVendedores();

  // Estado para pedidos y sugeridos
  const [pedidos, setPedidos] = useState({});
  const [sugeridos, setSugeridos] = useState({});
  const [datosProduccionCargados, setDatosProduccionCargados] = useState(false);
  const [ultimosTotalesGuardados, setUltimosTotalesGuardados] = useState({});
  const [hayDatosNuevos, setHayDatosNuevos] = useState(false);
  const [estadoBoton, setEstadoBoton] = useState('SUGERIDO');

  // Cargar datos de producción guardados
  const cargarDatosProduccion = async () => {
    try {
      const datosGuardados = await cargueService.getByDiaVendedor('PRODUCCION', 'PRODUCCION');

      if (datosGuardados && datosGuardados.length > 0) {
        const cargue = datosGuardados[0];
        const detalles = await detalleCargueService.getAll({ cargue_operativo: cargue.id });

        if (detalles && detalles.length > 0) {
          const pedidosGuardados = {};
          const sugeridosGuardados = {};

          detalles.forEach(detalle => {
            pedidosGuardados[detalle.producto_nombre] = detalle.adicional || 0;
            sugeridosGuardados[detalle.producto_nombre] = detalle.vencidas || 0; // Usar vencidas para sugeridos
          });

          setPedidos(pedidosGuardados);
          setSugeridos(sugeridosGuardados);
        }
      }
      setDatosProduccionCargados(true);
    } catch (error) {
      console.error('Error al cargar datos de producción:', error);
      setDatosProduccionCargados(true);
    }
  };

  // Cargar datos de todos los IDs al inicializar PRODUCCION
  useEffect(() => {
    const cargarTodosLosIDs = async () => {
      if (products.length === 0) return;

      try {
        const { simpleStorage } = await import('../../services/simpleStorage');
        const fechaActual = new Date().toISOString().split('T')[0];
        const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
        const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];

        // Detectar el día actual o usar el último con datos
        let diaConDatos = null;

        for (const dia of diasSemana) {
          for (const id of idsVendedores) {
            const key = `cargue_${dia}_${id}_${fechaActual}`;
            const datos = await simpleStorage.getItem(key);
            if (datos && datos.productos && datos.productos.length > 0) {
              diaConDatos = dia;
              break;
            }
          }
          if (diaConDatos) break;
        }

        if (diaConDatos) {
          console.log(`📅 Cargando datos de ${diaConDatos}`);

          // Cargar datos de todos los IDs para ese día
          for (const id of idsVendedores) {
            const key = `cargue_${diaConDatos}_${id}_${fechaActual}`;
            const datos = await simpleStorage.getItem(key);

            if (datos && datos.productos) {
              const productosFormateados = datos.productos.map(p => ({
                id: p.id,
                producto: p.producto,
                total: p.total || 0
              }));

              // Simular actualización del contexto
              const { actualizarDatosVendedor } = await import('../../context/VendedoresContext');
              // Usar el contexto directamente
              window.dispatchEvent(new CustomEvent('actualizarVendedor', {
                detail: { id, productos: productosFormateados }
              }));
            }
          }
        }

        await cargarDatosProduccion();
      } catch (error) {
        console.error('Error cargando datos de IDs:', error);
      }
    };

    if (!datosProduccionCargados) {
      cargarTodosLosIDs();
    }
  }, [products, datosProduccionCargados]);

  // Calcular total directamente desde localStorage
  const calcularTotalDirecto = (nombreProducto, fecha = null) => {
    // 🚀 CORREGIDO: Usar fecha específica del día y fecha seleccionados
    let fechaActual = fecha || fechaSeleccionada;
    if (!fechaActual) {
      fechaActual = new Date().toISOString().split('T')[0];
    }

    // console.log(`🔍 PRODUCCION - ${nombreProducto}:`);
    // console.log(`   - Día: ${dia}`);
    // console.log(`   - Fecha seleccionada: ${fechaSeleccionada}`);
    // console.log(`   - Fecha a usar: ${fechaActual}`);

    // DEBUG: Mostrar información de detección
    if (nombreProducto === 'AREPA TIPO OBLEA 500Gr') {
      console.log(`🔍 PRODUCCION DEBUG - ${nombreProducto}:`);
      console.log(`   - Fecha a usar: ${fechaActual}`);
      console.log(`   - Claves localStorage:`, Object.keys(localStorage).filter(key => key.startsWith('cargue_') && key.includes(fechaActual)));
    }

    // 🚀 CORREGIDO: Usar el día que viene como prop en lugar de detectar automáticamente
    let diaActivo = dia; // Usar el día actual del MenuSheets

    if (!diaActivo) {
      // Fallback: detectar día con datos para esa fecha
      const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

      for (const diaFallback of diasSemana) {
        const key = `cargue_${diaFallback}_ID1_${fechaActual}`;
        const datos = localStorage.getItem(key);
        if (datos) {
          diaActivo = diaFallback;
          break;
        }
      }
    }

    if (!diaActivo) {
      if (nombreProducto === 'AREPA TIPO OBLEA 500Gr') {
        console.log(`   - ❌ No se detectó día activo`);
      }
      return 0;
    }

    if (nombreProducto === 'AREPA TIPO OBLEA 500Gr') {
      console.log(`   - Día activo: ${diaActivo}`);
    }

    // 🔒 VERIFICAR SI HAY DATOS CONGELADOS (ESTADOS AVANZADOS)
    const estadoBoton = localStorage.getItem(`estado_boton_${diaActivo}_${fechaActual}`);

    // ✅ CORRECCIÓN: Incluir COMPLETADO y verificar datos congelados SIEMPRE en estados avanzados
    if (estadoBoton === 'ALISTAMIENTO_ACTIVO' || estadoBoton === 'DESPACHO' || estadoBoton === 'FINALIZAR' || estadoBoton === 'COMPLETADO') {
      const keyCongelados = `produccion_congelada_${diaActivo}_${fechaActual}`;
      const datosCongelados = localStorage.getItem(keyCongelados);

      if (datosCongelados) {
        try {
          const totalesCongelados = JSON.parse(datosCongelados);
          const totalCongelado = totalesCongelados[nombreProducto];

          if (totalCongelado !== undefined) {
            if (nombreProducto === 'AREPA TIPO OBLEA 500Gr') {
              console.log(`   - ❄️ DATOS CONGELADOS ENCONTRADOS: ${totalCongelado}`);
              console.log(`   - Estado: ${estadoBoton}`);
              console.log(`   - Key congelados: ${keyCongelados}`);
              console.log(`   - 🚫 SALTANDO CÁLCULO - USANDO VALOR CONGELADO`);
            }
            return totalCongelado;
          }
        } catch (error) {
          if (nombreProducto === 'AREPA TIPO OBLEA 500Gr') {
            console.log(`   - ❌ Error parsing datos congelados: ${error.message}`);
          }
        }
      }

      // Si no hay datos congelados en estados avanzados, mostrar advertencia
      if (nombreProducto === 'AREPA TIPO OBLEA 500Gr') {
        console.log(`   - ⚠️ NO HAY DATOS CONGELADOS para estado: ${estadoBoton}`);
        console.log(`   - Key buscada: ${keyCongelados}`);
        console.log(`   - 🔧 CONTINUANDO CON CÁLCULO NORMAL (DEBERÍA CONGELARSE)`);
      }
    }

    let total = 0;
    const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];

    // DEBUG: Mostrar información detallada para AREPA TIPO OBLEA
    if (nombreProducto === 'AREPA TIPO OBLEA 500Gr') {
      console.log(`   - Buscando en IDs: ${idsVendedores.join(', ')}`);
      console.log(`   - Estado botón: ${estadoBoton}`);
      console.log(`   - Día activo: ${diaActivo}`);
      console.log(`   - Fecha actual: ${fechaActual}`);
    }

    for (const id of idsVendedores) {
      const key = `cargue_${diaActivo}_${id}_${fechaActual}`;
      const datosString = localStorage.getItem(key);

      if (datosString) {
        try {
          const datos = JSON.parse(datosString);
          if (datos && datos.productos) {
            const producto = datos.productos.find(p => p.producto === nombreProducto);
            if (producto) {
              if (nombreProducto === 'AREPA TIPO OBLEA 500Gr') {
                console.log(`   - ${id}: cantidad=${producto.cantidad}, dctos=${producto.dctos || 0}, adicional=${producto.adicional || 0}, total=${producto.total}`);
                console.log(`     Key: ${key}`);
                console.log(`     Cálculo: ${producto.cantidad} - ${producto.dctos || 0} + ${producto.adicional || 0} - ${producto.devoluciones || 0} - ${producto.vencidas || 0} = ${producto.total}`);
              }
              if (producto.total > 0) {
                total += producto.total;
              }
            } else {
              if (nombreProducto === 'AREPA TIPO OBLEA 500Gr') {
                console.log(`   - ${id}: producto no encontrado en ${datos.productos.length} productos`);
                console.log(`     Key: ${key}`);
                console.log(`     Productos disponibles:`, datos.productos.map(p => p.producto).slice(0, 3));
              }
            }
          }
        } catch (error) {
          if (nombreProducto === 'AREPA TIPO OBLEA 500Gr') {
            console.log(`   - ${id}: error parsing datos - ${error.message}`);
            console.log(`     Key: ${key}`);
          }
        }
      } else {
        if (nombreProducto === 'AREPA TIPO OBLEA 500Gr') {
          console.log(`   - ${id}: no hay datos`);
          console.log(`     Key buscada: ${key}`);
        }
      }
    }

    // if (nombreProducto === 'AREPA TIPO OBLEA 500Gr') {
    //   console.log(`   - 🎯 TOTAL CALCULADO: ${total}`);
    // }

    // 🔒 CONGELAR DATOS AUTOMÁTICAMENTE en estados avanzados si no existen
    if ((estadoBoton === 'ALISTAMIENTO_ACTIVO' || estadoBoton === 'DESPACHO' || estadoBoton === 'FINALIZAR' || estadoBoton === 'COMPLETADO') && total > 0) {
      const keyCongelados = `produccion_congelada_${diaActivo}_${fechaActual}`;
      let datosCongelados = {};

      try {
        const datosExistentes = localStorage.getItem(keyCongelados);
        if (datosExistentes) {
          datosCongelados = JSON.parse(datosExistentes);
        }
      } catch (error) {
        datosCongelados = {};
      }

      // Solo congelar si no existe el producto en datos congelados
      if (!datosCongelados[nombreProducto]) {
        datosCongelados[nombreProducto] = total;
        localStorage.setItem(keyCongelados, JSON.stringify(datosCongelados));

        if (nombreProducto === 'AREPA TIPO OBLEA 500Gr') {
          console.log(`   - 🔒 CONGELADO AUTOMÁTICO: ${total} unidades`);
          console.log(`   - Estado: ${estadoBoton}`);
        }
      } else {
        // Si ya existe, usar el valor congelado en lugar del calculado
        const valorCongelado = datosCongelados[nombreProducto];

        if (nombreProducto === 'AREPA TIPO OBLEA 500Gr') {
          console.log(`   - 🔒 USANDO VALOR CONGELADO EXISTENTE: ${valorCongelado} (calculado era: ${total})`);
        }

        return valorCongelado;
      }
    }

    return total;
  };

  // Verificar si la producción está congelada
  const verificarProduccionCongelada = () => {
    const fechaActual = fechaSeleccionada;
    const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaActual}`);
    return estadoBoton === 'ALISTAMIENTO_ACTIVO' || estadoBoton === 'DESPACHO' || estadoBoton === 'FINALIZAR' || estadoBoton === 'COMPLETADO';
  };

  // 🚀 NUEVO: Detectar estado del botón en tiempo real
  useEffect(() => {
    const detectarEstado = () => {
      const fechaActual = fechaSeleccionada;
      const estadoGuardado = localStorage.getItem(`estado_boton_${dia}_${fechaActual}`);

      // 🚀 CORREGIDO: Manejar null, undefined, y string 'null'
      let estado = 'SUGERIDO'; // Default

      if (estadoGuardado && estadoGuardado !== 'null' && estadoGuardado !== 'undefined') {
        estado = estadoGuardado;
      }

      console.log(`🎯 Estado detectado: "${estado}" (guardado: "${estadoGuardado}")`);
      console.log(`📅 Clave localStorage: estado_boton_${dia}_${fechaActual}`);

      setEstadoBoton(estado);
    };

    detectarEstado();
    const interval = setInterval(detectarEstado, 1000); // Verificar cada segundo
    return () => clearInterval(interval);
  }, [dia, fechaSeleccionada]);

  // 🚀 NUEVO: Función para eliminar solicitadas existentes
  const eliminarSolicitadasExistentes = async () => {
    try {
      // Obtener registros existentes para esta fecha
      const response = await fetch(`http://localhost:8000/api/produccion/?fecha=${fechaSeleccionada}`);

      if (response.ok) {
        const registrosExistentes = await response.json();

        // Filtrar solo los que son solicitadas (lote contiene "SOLICITADAS")
        const solicitadasExistentes = registrosExistentes.filter(r =>
          r.lote && r.lote.includes('SOLICITADAS')
        );

        // Eliminar cada registro
        for (const registro of solicitadasExistentes) {
          await fetch(`http://localhost:8000/api/produccion/${registro.id}/`, {
            method: 'DELETE'
          });
        }

        if (solicitadasExistentes.length > 0) {
          console.log(`🗑️ Eliminados ${solicitadasExistentes.length} registros de solicitadas anteriores`);
        }
      }
    } catch (error) {
      console.error('❌ Error eliminando solicitadas existentes:', error);
    }
  };

  // 🚀 NUEVO: Función para guardar solicitadas en BD
  const guardarSolicitadasEnBD = async () => {
    try {
      console.log('💾 GUARDANDO SOLICITADAS EN BD...');
      console.log(`📅 Fecha: ${fechaSeleccionada}`);
      console.log(`📅 Día: ${dia}`);
      console.log(`🕐 Timestamp: ${new Date().toISOString()}`);

      // Primero eliminar registros existentes para esta fecha
      await eliminarSolicitadasExistentes();

      // Calcular totales actuales para cada producto
      const productosParaGuardar = [];

      products.forEach(producto => {
        const totalProductos = calcularTotalDirecto(producto.name);
        const pedidosProducto = pedidos[producto.name] || 0;
        const totalFinal = totalProductos + pedidosProducto;

        if (totalFinal > 0) {
          productosParaGuardar.push({
            fecha: fechaSeleccionada,
            producto: producto.name,
            cantidad: totalFinal,
            lote: `SOLICITADAS_${dia}`,
            usuario: 'SISTEMA_PRODUCCION'
          });
        }
      });

      // ✅ Guardar para la MISMA fecha seleccionada
      const datosParaGuardar = {
        dia: dia,
        fecha: fechaSeleccionada,
        productos: productosParaGuardar.map(p => ({
          producto_nombre: p.producto,
          cantidad_solicitada: p.cantidad
        }))
      };

      console.log('📊 Datos a enviar:', datosParaGuardar);

      const response = await fetch('http://localhost:8000/api/produccion-solicitadas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosParaGuardar)
      });

      if (response.ok) {
        const resultado = await response.json();
        console.log('✅ Solicitadas guardadas exitosamente:', resultado);

        // Actualizar estado
        const totalesGuardados = {};
        productosParaGuardar.forEach(p => {
          totalesGuardados[p.producto] = p.cantidad;
        });
        setUltimosTotalesGuardados(totalesGuardados);
        setHayDatosNuevos(false);
      } else {
        const error = await response.json();
        console.error('❌ Error guardando solicitadas:', error);
      }

    } catch (error) {
      console.error('❌ Error guardando solicitadas:', error);
    }
  };

  // 🚀 NUEVO: Detectar cambios en totales
  useEffect(() => {
    if (products.length === 0) return;

    const totalesActuales = {};
    products.forEach(producto => {
      const totalProductos = calcularTotalDirecto(producto.name);
      const pedidosProducto = pedidos[producto.name] || 0;
      const totalFinal = totalProductos + pedidosProducto;
      totalesActuales[producto.name] = totalFinal;
    });

    // Comparar con últimos guardados
    const hayDiferencias = JSON.stringify(totalesActuales) !== JSON.stringify(ultimosTotalesGuardados);

    if (hayDiferencias && Object.keys(ultimosTotalesGuardados).length > 0) {
      console.log('🔄 Cambios detectados en totales de producción');
      setHayDatosNuevos(true);
    }

    // 🚀 NUEVO: Si hay totales > 0 y no hay datos guardados, marcar como nuevos
    const hayTotalesPositivos = Object.values(totalesActuales).some(total => total > 0);
    const noHayGuardados = Object.keys(ultimosTotalesGuardados).length === 0;

    if (hayTotalesPositivos && noHayGuardados) {
      console.log('🆕 DATOS INICIALES DETECTADOS - Marcando como nuevos');
      console.log('📊 Totales detectados:', totalesActuales);
      setHayDatosNuevos(true);
    }

    // Guardar referencia inicial si no existe
    if (Object.keys(ultimosTotalesGuardados).length === 0) {
      setUltimosTotalesGuardados({ ...totalesActuales });
    }

  }, [products, pedidos, sugeridos]);

  // 🚀 Guardado automático inteligente con debounce
  useEffect(() => {
    // 🔍 DEBUG: Mostrar estado actual para diagnóstico
    console.log('🔍 DEBUG GUARDADO AUTOMÁTICO:');
    console.log(`   - Estado botón: "${estadoBoton}"`);
    console.log(`   - Hay datos nuevos: ${hayDatosNuevos}`);
    console.log(`   - Fecha seleccionada: ${fechaSeleccionada}`);
    console.log(`   - Día: ${dia}`);

    // Solo guardar si está en estado SUGERIDO y hay datos nuevos
    if (estadoBoton === 'SUGERIDO' && hayDatosNuevos && fechaSeleccionada) {
      console.log('⏳ Programando guardado automático en 3 segundos...');
      console.log(`📅 Guardará para fecha: ${fechaSeleccionada} (día: ${dia})`);

      const timeoutId = setTimeout(() => {
        console.log('🚀 EJECUTANDO GUARDADO AUTOMÁTICO AHORA...');
        guardarSolicitadasEnBD();
      }, 3000); // 3 segundos de debounce

      return () => {
        console.log('🚫 Cancelando guardado automático (nuevo cambio detectado)');
        clearTimeout(timeoutId);
      };
    } else {
      console.log('❌ NO SE GUARDARÁ - Condiciones no cumplidas:');
      if (estadoBoton !== 'SUGERIDO') console.log(`   - Estado incorrecto: "${estadoBoton}" (necesita "SUGERIDO")`);
      if (!hayDatosNuevos) console.log('   - No hay datos nuevos');
      if (!fechaSeleccionada) console.log('   - No hay fecha seleccionada');
    }
  }, [estadoBoton, hayDatosNuevos, fechaSeleccionada]);

  const produccionCongelada = verificarProduccionCongelada();

  // Función para calcular total (TOTAL PRODUCTOS + PEDIDOS)
  const calcularTotal = (nombreProducto, fecha = null) => {
    const totalProductos = calcularTotalDirecto(nombreProducto, fecha);
    const pedidosProducto = pedidos[nombreProducto] || 0;
    return totalProductos + pedidosProducto;
  };

  // Manejar cambios en pedidos
  const handlePedidoChange = (nombreProducto, valor) => {
    setPedidos(prev => ({
      ...prev,
      [nombreProducto]: parseInt(valor) || 0
    }));
  };

  // Manejar cambios en sugeridos
  const handleSugeridoChange = (nombreProducto, valor) => {
    setSugeridos(prev => ({
      ...prev,
      [nombreProducto]: parseInt(valor) || 0
    }));
  };

  // Función para guardar datos de producción
  const guardarProduccion = async () => {
    try {
      const datosProduccion = {
        dia_semana: 'PRODUCCION',
        vendedor_id: 'PRODUCCION',
        fecha: new Date().toISOString().split('T')[0],
        responsable: 'SISTEMA',
        productos: products.map(producto => ({
          producto_nombre: producto.name,
          cantidad: calcularTotalProductos(producto.name),
          dctos: 0,
          adicional: pedidos[producto.name] || 0,
          devoluciones: 0,
          vencidas: 0,
          total: calcularTotal(producto.name),
          valor: producto.price,
          neto: calcularTotal(producto.name) * producto.price,
          vendedor: false,
          despachador: false
        }))
      };

      await cargueService.guardarCargue(datosProduccion);
      console.log('Datos de producción guardados');
    } catch (error) {
      console.error('Error al guardar producción:', error);
    }
  };

  // Guardar automáticamente cuando cambien los datos
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (Object.keys(pedidos).length > 0 || Object.keys(sugeridos).length > 0) {
        guardarProduccion();
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [pedidos, sugeridos]);

  // Datos para la tabla de porciones
  const datosPorciones = Array(22).fill({});

  return (
    <div className="container-fluid mt-4 produccion-container">
      {produccionCongelada && (
        <div className="alert alert-warning mb-3" role="alert">
          <strong>❄️ PRODUCCIÓN CONGELADA</strong> - Los datos están bloqueados durante el proceso de alistamiento y despacho.
        </div>
      )}


      <Row>
        <Col md={7}>
          <Table bordered responsive className="tabla-produccion">
            <thead className="header-produccion">
              <tr>
                <th>PRODUCTOS</th>
                <th>TOTAL PRODUCTOS</th>
                <th>PEDIDOS</th>
                <th>TOTAL</th>
                <th>SUGERIDO</th>
              </tr>
            </thead>
            <tbody>
              {products.map((producto, index) => (
                <tr key={index} className="fila-produccion">
                  <td className="producto-cell">{producto.name}</td>
                  <td>
                    <input
                      type="number"
                      value={calcularTotalDirecto(producto.name)}
                      readOnly
                      style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={pedidos[producto.name] || 0}
                      readOnly
                      style={{
                        textAlign: 'center',
                        backgroundColor: 'transparent',
                        cursor: 'default'
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={calcularTotal(producto.name)}
                      readOnly
                      style={{
                        backgroundColor: '#e2efda',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#cc0000'
                      }}
                    />
                  </td>
                  <td className="sugerido-cell">
                    <input
                      type="number"
                      value={sugeridos[producto.name] || 0}
                      onChange={(e) => handleSugeridoChange(producto.name, e.target.value)}
                      disabled={produccionCongelada}
                      style={{
                        textAlign: 'center',
                        backgroundColor: produccionCongelada ? '#f8f9fa' : 'white',
                        cursor: produccionCongelada ? 'not-allowed' : 'text'
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
        <Col md={5}>
          <Table bordered responsive className="tabla-porciones">
            <thead className="header-porciones">
              <tr>
                <th>PORCION X2</th>
                <th>PORCION X3</th>
                <th>PORCION X4</th>
                <th>PORCION X5</th>
              </tr>
            </thead>
            <tbody>
              {datosPorciones.map((_, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="number"
                      defaultValue={0}
                      disabled={produccionCongelada}
                      style={{
                        backgroundColor: produccionCongelada ? '#f8f9fa' : 'white',
                        cursor: produccionCongelada ? 'not-allowed' : 'text'
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      defaultValue={0}
                      disabled={produccionCongelada}
                      style={{
                        backgroundColor: produccionCongelada ? '#f8f9fa' : 'white',
                        cursor: produccionCongelada ? 'not-allowed' : 'text'
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      defaultValue={0}
                      disabled={produccionCongelada}
                      style={{
                        backgroundColor: produccionCongelada ? '#f8f9fa' : 'white',
                        cursor: produccionCongelada ? 'not-allowed' : 'text'
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      defaultValue={0}
                      disabled={produccionCongelada}
                      style={{
                        backgroundColor: produccionCongelada ? '#f8f9fa' : 'white',
                        cursor: produccionCongelada ? 'not-allowed' : 'text'
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="footer-porciones">
              <tr>
                <td colSpan="4" className="text-center fw-bold">TOTAL</td>
              </tr>
              <tr>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
              </tr>
            </tfoot>
          </Table>
        </Col>
      </Row>
    </div>
  );
};

export default Produccion;