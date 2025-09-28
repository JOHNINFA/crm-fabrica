import React, { useState, useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';
import { useVendedores } from '../../context/VendedoresContext';
import { simpleStorage } from '../../services/simpleStorage';
import { responsableStorage } from '../../utils/responsableStorage';
import TablaProductos from './TablaProductos';
import ResumenVentas from './ResumenVentas';
import BotonLimpiar from './BotonLimpiar';
import ControlCumplimiento from './ControlCumplimiento';
import BotonCorreccionNuevo from './BotonCorreccionNuevo';
import './PlantillaOperativa.css';

const PlantillaOperativa = ({ responsable = "RESPONSABLE", dia, idSheet, idUsuario, onEditarNombre, fechaSeleccionada }) => {
  const { products } = useProducts();
  const { actualizarDatosVendedor, actualizarResponsable, cargarResponsable } = useVendedores();

  // 🚀 SOLUCIÓN ANTI-REBOTE MEJORADA: Múltiples fuentes para evitar rebote
  const [nombreResponsable, setNombreResponsable] = useState(() => {
    // Intentar múltiples fuentes en orden de prioridad
    let responsableInicial = "RESPONSABLE";

    try {
      // 1. Intentar responsableStorage
      const responsableLS = responsableStorage?.get(idSheet);
      if (responsableLS && responsableLS !== 'RESPONSABLE') {
        console.log(`📦 INICIAL - Responsable desde responsableStorage para ${idSheet}: "${responsableLS}"`);
        responsableInicial = responsableLS;
      } else {
        // 2. Intentar localStorage directo
        const responsableDirecto = localStorage.getItem(`responsable_${idSheet}`);
        if (responsableDirecto && responsableDirecto !== 'RESPONSABLE') {
          console.log(`📦 INICIAL - Responsable desde localStorage directo para ${idSheet}: "${responsableDirecto}"`);
          responsableInicial = responsableDirecto;
        } else {
          // 3. Intentar clave alternativa
          const responsableAlt = localStorage.getItem(`cargue_responsable_${idSheet}`);
          if (responsableAlt && responsableAlt !== 'RESPONSABLE') {
            console.log(`📦 INICIAL - Responsable desde clave alternativa para ${idSheet}: "${responsableAlt}"`);
            responsableInicial = responsableAlt;
          } else {
            console.log(`🔄 INICIAL - No se encontró responsable guardado para ${idSheet}, usando: "RESPONSABLE"`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error inicializando responsable para ${idSheet}:`, error);
    }

    return responsableInicial;
  });

  // 🔍 DEBUG: Monitorear cambios en nombreResponsable
  useEffect(() => {
    console.log(`🎯 CAMBIO EN nombreResponsable para ${idSheet}: "${nombreResponsable}"`);
  }, [nombreResponsable, idSheet]);

  // 🚀 CARGA INMEDIATA: Intentar cargar desde BD inmediatamente si no hay datos locales
  useEffect(() => {
    const cargarInmediatamente = async () => {
      // Solo ejecutar si el estado actual es "RESPONSABLE" (valor por defecto)
      if (nombreResponsable === "RESPONSABLE") {
        console.log(`⚡ CARGA INMEDIATA - Intentando cargar desde BD para ${idSheet}...`);

        try {
          const responsableDB = await cargarResponsable(idSheet);
          if (responsableDB && responsableDB !== 'RESPONSABLE') {
            console.log(`⚡ CARGA INMEDIATA - Encontrado en BD: "${responsableDB}"`);
            setNombreResponsable(responsableDB);

            // Guardar en múltiples ubicaciones para próximas cargas
            responsableStorage.set(idSheet, responsableDB);
            localStorage.setItem(`responsable_${idSheet}`, responsableDB);
            localStorage.setItem(`cargue_responsable_${idSheet}`, responsableDB);
          }
        } catch (error) {
          console.error(`❌ Error en carga inmediata para ${idSheet}:`, error);
        }
      } else {
        console.log(`✅ CARGA INMEDIATA - Ya tiene valor válido: "${nombreResponsable}"`);
      }
    };

    // 🚀 CORREGIDO: Ejecutar inmediatamente sin delay, solo UNA VEZ por idSheet
    cargarInmediatamente();
  }, [idSheet]); // ✅ Solo idSheet como dependencia para evitar loop infinito

  // 🚀 LISTENER SIMPLIFICADO para cambios en responsables
  useEffect(() => {
    const handleResponsableUpdate = (e) => {
      if (e.detail && e.detail.idSheet === idSheet && e.detail.nuevoNombre) {
        console.log(`🔄 RESPONSABLE ACTUALIZADO - ${idSheet}: "${e.detail.nuevoNombre}"`);
        setNombreResponsable(e.detail.nuevoNombre);

        // ✅ Sincronizar con la base de datos
        actualizarResponsable(idSheet, e.detail.nuevoNombre);
      }
    };

    window.addEventListener('responsableActualizado', handleResponsableUpdate);

    return () => {
      window.removeEventListener('responsableActualizado', handleResponsableUpdate);
    };
  }, [idSheet, actualizarResponsable]);

  // ✅ Sincronizar con BD (sin rebote porque ya inicializamos desde localStorage)
  useEffect(() => {
    const sincronizarConBD = async () => {
      try {
        console.log(`🔄 SINCRONIZANDO CON BD para ${idSheet}...`);
        console.log(`🔍 Estado actual nombreResponsable: "${nombreResponsable}"`);

        const responsableDB = await cargarResponsable(idSheet);
        console.log(`🔍 Respuesta de BD: "${responsableDB}"`);

        // Solo actualizar si el valor de la BD es diferente al actual
        if (responsableDB && responsableDB !== 'RESPONSABLE' && responsableDB !== nombreResponsable) {
          console.log(`🔄 SINCRONIZANDO - BD tiene "${responsableDB}", actual es "${nombreResponsable}"`);
          setNombreResponsable(responsableDB);
          responsableStorage.set(idSheet, responsableDB); // Actualizar localStorage
        } else if (responsableDB === nombreResponsable) {
          console.log(`✅ SINCRONIZADO - BD y estado local coinciden: "${responsableDB}"`);
        } else {
          console.log(`⚠️ BD no tiene responsable válido para ${idSheet}, manteniendo: "${nombreResponsable}"`);
        }
      } catch (error) {
        console.error(`❌ Error sincronizando con BD para ${idSheet}:`, error);
        console.log(`📦 MANTENIENDO valor actual: "${nombreResponsable}"`);
      }
    };

    // 🚀 CORREGIDO: Ejecutar sincronización solo UNA VEZ por idSheet
    // Removemos cargarResponsable de las dependencias para evitar loop infinito
    const timer = setTimeout(sincronizarConBD, 200);

    return () => clearTimeout(timer);
  }, [idSheet]); // ✅ Solo idSheet como dependencia

  // Actualizar desde prop solo si no hay valor en localStorage ni BD
  useEffect(() => {
    const responsableGuardado = responsableStorage.get(idSheet);

    if (!responsableGuardado && responsable && responsable !== 'RESPONSABLE' && responsable !== nombreResponsable) {
      console.log(`🔄 PROP UPDATE - Responsable desde prop para ${idSheet}: "${responsable}"`);
      setNombreResponsable(responsable);
    }
  }, [idSheet, responsable, nombreResponsable]);

  const [productosOperativos, setProductosOperativos] = useState([]);
  const [datosResumen, setDatosResumen] = useState({
    totalDespacho: 0,
    totalPedidos: 0,
    totalDctos: 0,
    venta: 0,
    totalEfectivo: 0,
  });

  // Cargar datos desde localStorage
  const cargarDatosGuardados = async () => {
    try {
      // ✅ CORREGIDO: Usar siempre fechaSeleccionada sin fallback
      const fechaAUsar = fechaSeleccionada;
      const key = `cargue_${dia}_${idSheet}_${fechaAUsar}`;

      console.log(`🔍 CARGANDO ${idSheet} - Key: ${key}`);
      console.log(`🔄 RECARGA SOLICITADA - Timestamp: ${Date.now()}`);

      // Primero intentar desde localStorage directamente
      const datosLocalString = localStorage.getItem(key);
      let datos = null;

      if (datosLocalString) {
        try {
          datos = JSON.parse(datosLocalString);
          console.log(`📂 ${idSheet} - Datos encontrados:`, datos.productos ? datos.productos.length : 0, 'productos');
        } catch (error) {
          console.error(`❌ ${idSheet} - Error parsing localStorage:`, error);
        }
      } else {
        console.log(`⚠️ ${idSheet} - No hay datos en localStorage para ${key}`);
      }

      if (datos && datos.productos) {
        console.log(`🔍 ${idSheet} - Estructura de datos:`, datos.productos.slice(0, 2)); // Mostrar primeros 2 productos

        console.log(`🔍 ${idSheet} - Productos del contexto:`, products.length);
        console.log(`🔍 ${idSheet} - Primer producto contexto:`, products[0]?.name);
        console.log(`🔍 ${idSheet} - Primer producto guardado:`, datos.productos[0]?.producto);

        // Orden específico de productos
        const ordenEspecifico = [
          'AREPA TIPO OBLEA 500Gr',
          'AREPA MEDIANA 330Gr',
          'AREPA TIPO PINCHO 330Gr',
          'AREPA QUESO ESPECIAL GRANDE 600Gr',
          'AREPA CON QUESO CUADRADA 450Gr',
          'AREPA CON QUESO ESPECIAL PEQUEÑA 600Gr',
          'AREPA QUESO CORRIENTE 450Gr',
          'AREPA BOYACENSE X 10',
          'ALMOJABANA X 5 300Gr',
          'AREPA SANTANDEREANA 450Gr',
          'AREPA DE CHOCLO CON QUESO PEQUEÑA 700 Gr',
          'AREPA DE CHOCLO CON QUESO PEQUEÑA 700Gr',
          'AREPA CON SEMILLA DE QUINUA 450Gr',
          'AREPA DE CHOCLO CON QUESO GRANDE 1200Gr',
          'AREPA DE CHOCLO CORRIENTE 300Gr',
          'AREPA BOYACENSE X 5 450Gr',
          'ALMOJABANAS X 10 600Gr',
          'AREPA QUESO MINI X10'
        ];

        const productosOrdenados = [...products].sort((a, b) => {
          const indexA = ordenEspecifico.indexOf(a.name);
          const indexB = ordenEspecifico.indexOf(b.name);

          if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;

          return indexA - indexB;
        });

        const productosConDatos = productosOrdenados.map(product => {
          const productoGuardado = datos.productos.find(p => p.producto === product.name);

          if (productoGuardado) {
            console.log(`✅ ${idSheet} - Cargando producto: ${product.name} - Cantidad: ${productoGuardado.cantidad}`);
            return {
              id: product.id,
              producto: product.name,
              cantidad: productoGuardado.cantidad || 0,
              dctos: productoGuardado.dctos || 0,
              adicional: productoGuardado.adicional || 0,
              devoluciones: productoGuardado.devoluciones || 0,
              vencidas: productoGuardado.vencidas || 0,
              lotesVencidos: productoGuardado.lotesVencidos || [],
              total: productoGuardado.total || 0,
              valor: productoGuardado.valor || Math.round(product.price * 0.65),
              neto: productoGuardado.neto || 0,
              vendedor: productoGuardado.vendedor || false,
              despachador: productoGuardado.despachador || false
            };
          } else {
            console.log(`❌ ${idSheet} - NO encontrado: ${product.name}`);
          }

          return {
            id: product.id,
            producto: product.name,
            cantidad: 0,
            dctos: 0,
            adicional: 0,
            devoluciones: 0,
            vencidas: 0,
            lotesVencidos: [],
            total: 0,
            valor: Math.round(product.price * 0.65),
            neto: 0,
            vendedor: false,
            despachador: false
          };
        });

        console.log(`✅ ${idSheet} - Datos cargados correctamente desde localStorage`);
        console.log(`🔄 ${idSheet} - Estableciendo productos:`, productosConDatos.filter(p => p.cantidad > 0).map(p => `${p.producto}: ${p.cantidad}`));
        setProductosOperativos(productosConDatos);
        return;
      }

      // Si no hay datos, usar formato inicial con orden específico
      const ordenEspecifico = [
        'AREPA TIPO OBLEA 500Gr',
        'AREPA MEDIANA 330Gr',
        'AREPA TIPO PINCHO 330Gr',
        'AREPA QUESO ESPECIAL GRANDE 600Gr',
        'AREPA CON QUESO CUADRADA 450Gr',
        'AREPA CON QUESO ESPECIAL PEQUEÑA 600Gr',
        'AREPA QUESO CORRIENTE 450Gr',
        'AREPA BOYACENSE X 10',
        'ALMOJABANA X 5 300Gr',
        'AREPA SANTANDEREANA 450Gr',
        'AREPA DE CHOCLO CON QUESO PEQUEÑA 700 Gr',
        'AREPA DE CHOCLO CON QUESO PEQUEÑA 700Gr',
        'AREPA CON SEMILLA DE QUINUA 450Gr',
        'AREPA DE CHOCLO CON QUESO GRANDE 1200Gr',
        'AREPA DE CHOCLO CORRIENTE 300Gr',
        'AREPA BOYACENSE X 5 450Gr',
        'ALMOJABANAS X 10 600Gr',
        'AREPA QUESO MINI X10'
      ];

      const productosOrdenados = [...products].sort((a, b) => {
        const indexA = ordenEspecifico.indexOf(a.name);
        const indexB = ordenEspecifico.indexOf(b.name);

        if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        return indexA - indexB;
      });

      const productosFormateados = productosOrdenados.map(product => ({
        id: product.id,
        producto: product.name,
        cantidad: 0,
        dctos: 0,
        adicional: 0,
        devoluciones: 0,
        vencidas: 0,
        lotesVencidos: [],
        total: 0,
        valor: Math.round(product.price * 0.65),
        neto: 0,
        vendedor: false,
        despachador: false
      }));

      console.log(`🆕 ${idSheet} - Usando datos iniciales (${productosFormateados.length} productos)`);
      console.log(`⚠️ ${idSheet} - RESETEO A DATOS INICIALES - Esto no debería pasar si hay datos guardados`);
      setProductosOperativos(productosFormateados);
    } catch (error) {

    }
  };

  useEffect(() => {
    console.log(`🔍 ${idSheet} - Productos disponibles:`, products.length, products.map(p => p.name));

    // La condición clave es que el array de productos del contexto esté completamente cargado.
    const productosEstanListos = products && products.length > 1 && products.some(p => p.name !== 'Servicio');

    if (productosEstanListos) {
      console.log(`✅ ${idSheet} - Productos del contexto listos. Cargando datos guardados...`);
      cargarDatosGuardados();
    } else {
      console.log(`⏳ ${idSheet} - Esperando que la lista completa de productos se cargue desde el contexto...`);
    }
  }, [products, dia, idSheet, fechaSeleccionada]);

  // Función deshabilitada - solo el botón DESPACHO afecta inventario

  const actualizarProducto = async (id, campo, valor) => {
    // Verificar estado del botón para actualización en tiempo real
    const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`) || 'ALISTAMIENTO';

    setProductosOperativos(prev =>
      prev.map(p => {
        if (p.id === id) {
          // Manejar diferentes tipos de campos
          let valorProcesado;

          if (campo === 'vendedor' || campo === 'despachador') {
            // Campos booleanos
            valorProcesado = valor;
          } else if (campo === 'lotesVencidos') {
            // Array de lotes vencidos
            valorProcesado = valor;
          } else {
            // Campos numéricos
            valorProcesado = parseInt(valor) || 0;
          }

          const updated = { ...p, [campo]: valorProcesado };
          const valorAnterior = p[campo] || 0;

          // Calcular total automáticamente solo para campos numéricos (no para texto o checkboxes)
          if (campo !== 'vendedor' && campo !== 'despachador' && campo !== 'lotesVencidos') {
            updated.total = updated.cantidad - updated.dctos + updated.adicional - updated.devoluciones - updated.vencidas;
            updated.neto = Math.round(updated.total * updated.valor);

            // ✅ INVENTARIO: Afectar solo campos permitidos cuando el botón está en FINALIZAR
            if (estadoBoton === 'FINALIZAR' && (campo === 'cantidad' || campo === 'adicional' || campo === 'dctos')) {
              // DEVOLUCIONES y VENCIDAS NO afectan inventario en FINALIZAR
              const totalAnterior = p.total || 0;
              const totalNuevo = updated.total;
              const diferenciaTOTAL = totalNuevo - totalAnterior;

              if (diferenciaTOTAL !== 0) {
                console.log(`🟢 FINALIZAR ACTIVO - Actualizando inventario por cambio en TOTAL:`);
                console.log(`   - Producto: ${updated.producto}`);
                console.log(`   - Campo modificado: ${campo}`);
                console.log(`   - TOTAL anterior: ${totalAnterior}`);
                console.log(`   - TOTAL nuevo: ${totalNuevo}`);
                console.log(`   - Diferencia TOTAL: ${diferenciaTOTAL}`);

                // Actualizar inventario basado en el cambio del TOTAL
                actualizarInventarioPorTOTAL(id, diferenciaTOTAL);
              }
            } else if (estadoBoton === 'FINALIZAR' && (campo === 'devoluciones' || campo === 'vencidas')) {
              console.log(`📝 ${campo.toUpperCase()} REGISTRADO: ${valorProcesado} (NO afecta inventario en FINALIZAR - se procesará al finalizar)`);
            } else {
              console.log(`📝 CAMBIO REGISTRADO: ${campo} = ${valorProcesado} (inventario NO afectado - botón: ${estadoBoton})`);
            }

            console.log(`📊 ${updated.producto}: cantidad=${updated.cantidad}, total=${updated.total} ${estadoBoton === 'DESPACHO' ? '- DESPACHO ACTIVO' : '- Sin afectar inventario'}`);
          }

          return updated;
        }
        return p;
      })
    );
  };

  // 🚀 NUEVA FUNCIÓN: Actualizar inventario basado en cambio de TOTAL
  const actualizarInventarioPorTOTAL = async (productoId, diferenciaTOTAL) => {
    try {
      console.log(`🔥 ACTUALIZANDO INVENTARIO POR CAMBIO EN TOTAL:`);
      console.log(`   - Producto ID: ${productoId}`);
      console.log(`   - Diferencia TOTAL: ${diferenciaTOTAL}`);

      // Si el TOTAL aumenta, se descuenta más del inventario (cantidad negativa)
      // Si el TOTAL disminuye, se suma de vuelta al inventario (cantidad positiva)
      const cantidadFinal = -diferenciaTOTAL;

      console.log(`   - Cantidad a enviar al inventario: ${cantidadFinal}`);

      const response = await fetch(`http://localhost:8000/api/productos/${productoId}/actualizar_stock/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cantidad: cantidadFinal,
          usuario: `Sistema Despacho - ${idSheet}`,
          nota: `Ajuste por cambio en TOTAL: ${diferenciaTOTAL} - ${dia} - ${new Date().toISOString()}`
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error actualizando inventario: ${errorText}`);
        throw new Error(`Error al actualizar inventario: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ INVENTARIO ACTUALIZADO POR TOTAL:`);
      console.log(`   - Stock actualizado: ${result.stock_actual}`);
      console.log(`   - Diferencia TOTAL aplicada: ${diferenciaTOTAL}`);

    } catch (error) {
      console.error('❌ Error actualizando inventario por TOTAL:', error);
      alert(`❌ Error actualizando inventario: ${error.message}`);
    }
  };

  // 🚀 FUNCIÓN ANTERIOR: Actualizar inventario en tiempo real durante DESPACHO
  const actualizarInventarioTiempoReal = async (productoId, diferencia, campo) => {
    try {
      console.log(`🔥 ACTUALIZANDO INVENTARIO EN TIEMPO REAL:`);
      console.log(`   - Producto ID: ${productoId}`);
      console.log(`   - Diferencia: ${diferencia}`);
      console.log(`   - Campo: ${campo}`);

      // Lógica de inventario:
      // CANTIDAD: más mercancía sale (restar del inventario)
      // ADICIONAL: más mercancía sale (restar del inventario)  
      // DCTOS: menos mercancía sale (sumar al inventario)
      let cantidadFinal;
      if (campo === 'cantidad') {
        cantidadFinal = -diferencia; // Cantidad resta del inventario
      } else if (campo === 'adicional') {
        cantidadFinal = -diferencia; // Adicional resta del inventario
      } else if (campo === 'dctos') {
        cantidadFinal = diferencia;  // Descuento suma al inventario
      }

      console.log(`   - Cantidad final a enviar: ${cantidadFinal}`);

      const response = await fetch(`http://localhost:8000/api/productos/${productoId}/actualizar_stock/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cantidad: cantidadFinal,
          usuario: `Sistema Despacho - ${idSheet}`,
          nota: `Ajuste en tiempo real - ${campo}: ${diferencia} - ${dia} - ${new Date().toISOString()}`
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error actualizando inventario: ${errorText}`);
        throw new Error(`Error al actualizar inventario: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ INVENTARIO ACTUALIZADO EN TIEMPO REAL:`);
      console.log(`   - Stock actualizado: ${result.stock_actual}`);
      console.log(`   - Campo: ${campo}, Diferencia: ${diferencia}`);

    } catch (error) {
      console.error('❌ Error actualizando inventario en tiempo real:', error);
      // Mostrar alerta al usuario
      alert(`❌ Error actualizando inventario: ${error.message}`);
    }
  };



  // Sin lógica especial de sincronización - todos los IDs funcionan igual

  useEffect(() => {
    // La guarda de seguridad es correcta y debe permanecer.
    if (productosOperativos.length === 0 && products.length > 0) {
      console.log(`🤔 Omitiendo actualización/guardado para ${idSheet} porque productosOperativos está vacío.`);
      return;
    }

    // Solo actualizar y guardar si hay productos operativos para procesar.
    if (productosOperativos.length > 0) {
      // Calcular resumen automáticamente
      const totalNeto = productosOperativos.reduce((sum, p) => sum + (p.neto || 0), 0);
      setDatosResumen({
        totalDespacho: totalNeto,
        totalPedidos: 0,
        totalDctos: 0,
        venta: totalNeto,
        totalEfectivo: totalNeto,
      });

      // Actualizar contexto y localStorage
      actualizarDatosVendedor(idSheet, productosOperativos);
      console.log(`✅ Datos actualizados para ${idSheet} en contexto.`);

      const fechaAUsar = fechaSeleccionada;
      const key = `cargue_${dia}_${idSheet}_${fechaAUsar}`;
      const datos = {
        dia,
        idSheet,
        fecha: fechaAUsar,
        responsable: nombreResponsable,  // ✅ Incluir responsable en los datos guardados
        productos: productosOperativos,
        timestamp: Date.now(),
        sincronizado: false
      };

      localStorage.setItem(key, JSON.stringify(datos));
      console.log(`💾 Guardado en localStorage (${key}).`);
    }
  }, [productosOperativos, idSheet, dia, fechaSeleccionada]);

  // Función limpiarDatos deshabilitada para debug
  const limpiarDatos = () => {
    console.log('⚠️ limpiarDatos llamada - DESHABILITADA para debug');
    // Función deshabilitada temporalmente
  };

  return (
    <div className="container-fluid plantilla-operativa" style={{ minWidth: '1200px' }}>
      <div className="d-flex justify-content-between align-items-center">
        <h6
          className="responsable-title m-0"
          onDoubleClick={onEditarNombre}
          style={{ cursor: 'pointer', userSelect: 'none', color: 'red' }}
        >
          {nombreResponsable}
        </h6>
      </div>
      <div className="row">
        <div className="col-lg-8">
          <TablaProductos
            productos={productosOperativos}
            onActualizarProducto={actualizarProducto}
            dia={dia}
            fechaSeleccionada={fechaSeleccionada}
          />
          <BotonLimpiar
            productos={productosOperativos}
            dia={dia}
            idSheet={idSheet}
            fechaSeleccionada={fechaSeleccionada}
            onLimpiar={limpiarDatos}
          />
          <ControlCumplimiento
            dia={dia}
            idSheet={idSheet}
            fechaSeleccionada={fechaSeleccionada}
          />
          <BotonCorreccionNuevo
            dia={dia}
            idSheet={idSheet}
            fechaSeleccionada={fechaSeleccionada}
            productos={productosOperativos}
            onProductosActualizados={() => {
              console.log('🔄 REFRESCANDO DATOS DESPUÉS DE CORRECCIÓN...');
              // Forzar recarga completa de datos
              cargarDatosGuardados();

              // Forzar re-render del componente
              setTimeout(() => {
                cargarDatosGuardados();
              }, 100);
            }}
          />
        </div>
        <div className="col-lg-4">
          <ResumenVentas
            datos={datosResumen}
            productos={productosOperativos}
            dia={dia}
            fechaSeleccionada={fechaSeleccionada}
          />
        </div>
      </div>
    </div>
  );
};

export default PlantillaOperativa;