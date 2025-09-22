import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';

const BotonLimpiar = ({ productos = [], dia, idSheet, fechaSeleccionada, onLimpiar }) => {
  const [estado, setEstado] = useState('ALISTAMIENTO');
  const [loading, setLoading] = useState(false);
  const [productosValidados, setProductosValidados] = useState([]);

  // Verificar productos listos en todos los IDs (V=true, D=true, TOTAL>0)
  const verificarProductosListos = async () => {
    try {
      const { simpleStorage } = await import('../../services/simpleStorage');
      const fechaAUsar = fechaSeleccionada || new Date().toISOString().split('T')[0];
      const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];

      const todosLosProductos = {};

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

      return Object.values(todosLosProductos);
    } catch (error) {
      console.error('Error verificando productos:', error);
      return [];
    }
  };

  // Recuperar estado guardado al cargar
  useEffect(() => {
    if (idSheet !== 'ID1') return;

    const estadoGuardado = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`);
    if (estadoGuardado) {
      setEstado(estadoGuardado);
      console.log(`🔄 Estado recuperado: ${estadoGuardado}`);
    }

    // También verificar si hay datos congelados
    const datosCongelados = localStorage.getItem(`produccion_congelada_${dia}_${fechaSeleccionada}`);
    if (datosCongelados) {
      console.log('❄️ Datos de producción congelados encontrados');
    }
  }, [dia, fechaSeleccionada, idSheet]);

  // Verificar productos y avanzar automáticamente
  useEffect(() => {
    if (idSheet !== 'ID1') return;

    const verificarYAvanzar = async () => {
      const listos = await verificarProductosListos();
      setProductosValidados(listos);

      // Auto-avance solo de ALISTAMIENTO_ACTIVO → DESPACHO
      if (estado === 'ALISTAMIENTO_ACTIVO' && listos.length > 0) {
        console.log('🤖 AUTO-AVANCE: ALISTAMIENTO_ACTIVO → DESPACHO');
        setEstado('DESPACHO');
        localStorage.setItem(`estado_boton_${dia}_${fechaSeleccionada}`, 'DESPACHO');
      }
    };

    verificarYAvanzar();

    // Verificación automática cada 3 segundos cuando está en ALISTAMIENTO_ACTIVO
    let interval;
    if (estado === 'ALISTAMIENTO_ACTIVO') {
      interval = setInterval(verificarYAvanzar, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dia, fechaSeleccionada, idSheet, estado]);

  // Solo mostrar botón en ID1
  if (idSheet !== 'ID1') {
    return (
      <div className="mt-3">
        <small className="text-muted">Marque V y D para habilitar</small>
      </div>
    );
  }

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

  // Manejar finalizar (devoluciones y vencidas)
  const manejarFinalizar = async () => {
    setLoading(true);

    try {
      console.log('🏁 INICIANDO FINALIZACIÓN');

      const { simpleStorage } = await import('../../services/simpleStorage');
      const fechaAUsar = fechaSeleccionada || new Date().toISOString().split('T')[0];
      const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];

      let totalDevoluciones = 0;
      let totalVencidas = 0;

      // Procesar devoluciones y vencidas de todos los IDs
      for (const id of idsVendedores) {
        const key = `cargue_${dia}_${id}_${fechaAUsar}`;
        const datos = await simpleStorage.getItem(key);

        if (datos && datos.productos) {
          for (const producto of datos.productos) {
            // Usar directamente el ID del producto que ya viene en los datos
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
            } else {
              console.error(`❌ Producto sin ID: ${producto.producto}`);
            }
          }
        }
      }

      // Cambiar estado a COMPLETADO
      setEstado('COMPLETADO');
      localStorage.removeItem(`estado_despacho_${dia}_${fechaSeleccionada}`);
      localStorage.setItem(`estado_boton_${dia}_${fechaSeleccionada}`, 'COMPLETADO');

      alert(`✅ Jornada Finalizada\n\n⬆️ Devoluciones: ${totalDevoluciones}\n⬇️ Vencidas: ${totalVencidas}`);

    } catch (error) {
      console.error('❌ Error en finalización:', error);
      alert(`❌ Error en finalización: ${error.message}`);
    }

    setLoading(false);
  };

  // Manejar despacho
  const manejarDespacho = async () => {
    const timestamp = Date.now();
    console.log(`\n\n=== 🚀 DESPACHO EJECUTADO ${timestamp} ===`);
    console.log('Stack trace:', new Error().stack);

    setLoading(true);

    try {
      console.log('=== 🚀 INICIANDO DESPACHO DEBUG ===');
      console.log('Productos validados encontrados:', productosValidados);

      // Debug: Mostrar inventario actual antes del despacho
      console.log('=== 📊 INVENTARIO ANTES DEL DESPACHO ===');
      for (const producto of productosValidados) {
        const productoEncontrado = productos.find(p => p.name === producto.nombre);
        if (productoEncontrado) {
          console.log(`📎 ${producto.nombre} (ID: ${productoEncontrado.id})`);
          console.log(`   - Stock actual: ${productoEncontrado.stock_total || 'No disponible'}`);
          console.log(`   - A descontar: ${producto.totalCantidad}`);
          console.log(`   - Stock esperado: ${(productoEncontrado.stock_total || 0) - producto.totalCantidad}`);
        }
      }

      console.log('=== 📤 EJECUTANDO DESCUENTOS ===');

      // Descontar del inventario
      for (const producto of productosValidados) {
        console.log(`🔥 PROCESANDO: ${producto.nombre}`);

        // Buscar el ID del producto por nombre
        console.log(`🔍 Buscando producto: "${producto.nombre}"`);
        console.log(`🔍 Array productos disponible:`, productos);

        // Usar el ID que ya viene en el objeto producto
        const productoId = producto.id || null;

        if (productoId) {
          console.log(`   - Producto ID encontrado: ${productoId}`);
          console.log(`   - Cantidad a descontar: ${producto.totalCantidad} (ya incluye descuentos)`);

          const resultado = await actualizarInventario(productoId, producto.totalCantidad, 'RESTAR');

          console.log(`✅ RESULTADO FINAL: ${producto.nombre}`);
          console.log(`   - Stock actualizado: ${resultado.stock_actual}`);
        } else {
          console.error(`❌ Producto ID NO encontrado para: ${producto.nombre}`);
          console.error(`❌ Objeto producto:`, producto);
        }
      }

      console.log('=== ✅ DESPACHO COMPLETADO ===');

      setEstado('FINALIZAR');

      // Guardar estado de despacho
      localStorage.setItem(`estado_despacho_${dia}_${fechaSeleccionada}`, 'DESPACHO');
      localStorage.setItem(`estado_boton_${dia}_${fechaSeleccionada}`, 'FINALIZAR');

      const resumen = productosValidados.map(p => `${p.nombre}: ${p.totalCantidad} und`).join('\n');
      const totalGeneral = productosValidados.reduce((sum, p) => sum + p.totalCantidad, 0);
      alert(`✅ Despacho Realizado\n\n${resumen}\n\n🎯 TOTAL DESCONTADO DEL INVENTARIO: ${totalGeneral} unidades`);

    } catch (error) {
      console.error('❌ Error en despacho:', error);
      alert(`❌ Error en despacho: ${error.message}`);
    }

    setLoading(false);
  };

  const obtenerConfigBoton = () => {
    const listos = productosValidados;

    switch (estado) {
      case 'ALISTAMIENTO':
        return {
          texto: '📦 SUGERIDO',
          variant: 'outline-secondary', // Gris suave con borde
          disabled: loading, // Solo deshabilitar si está cargando
          onClick: () => {
            setEstado('ALISTAMIENTO_ACTIVO');
            localStorage.setItem(`estado_despacho_${dia}_${fechaSeleccionada}`, 'ALISTAMIENTO');
            localStorage.setItem(`estado_boton_${dia}_${fechaSeleccionada}`, 'ALISTAMIENTO_ACTIVO');
            // Congelar datos actuales de producción
            const datosParaCongelar = {};
            const fechaActual = fechaSeleccionada || new Date().toISOString().split('T')[0];
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

            localStorage.setItem(`produccion_congelada_${dia}_${fechaSeleccionada}`, JSON.stringify(datosParaCongelar));
            console.log('📦 ALISTAMIENTO ACTIVADO - Producción congelada');
            console.log('Datos congelados:', datosParaCongelar);
            console.log('📦 ALISTAMIENTO ACTIVADO - Producción congelada');
          }
        };
      case 'ALISTAMIENTO_ACTIVO':
        return {
          texto: '📦 ALISTAMIENTO ACTIVO',
          variant: 'dark', // Gris oscuro (activado)
          disabled: listos.length === 0 || loading, // Validar productos listos
          onClick: () => {
            setEstado('DESPACHO');
            localStorage.setItem(`estado_boton_${dia}_${fechaSeleccionada}`, 'DESPACHO');
            console.log('🚚 Cambiando a DESPACHO');
          }
        };
      case 'DESPACHO':
        return {
          texto: '🚚 DESPACHO',
          variant: 'primary',
          disabled: loading,
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
    <div className="d-flex justify-content-start mt-3">
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
  );
};

export default BotonLimpiar;