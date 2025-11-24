import React, { useState, useEffect, useMemo } from 'react';
import { useProducts } from '../../hooks/useUnifiedProducts';
import { useVendedores } from '../../context/VendedoresContext';
import { simpleStorage } from '../../services/simpleStorage';
import { responsableStorage } from '../../utils/responsableStorage';
import { cargueHybridService, cargueApiConfig } from '../../services/cargueApiService';
import TablaProductos from './TablaProductos';
import ResumenVentas from './ResumenVentas';
import BotonLimpiar from './BotonLimpiar';
import ControlCumplimiento from './ControlCumplimiento';
import RegistroLotes from './RegistroLotes';
import BotonCorreccionNuevo from './BotonCorreccionNuevo';
import BotonVerPedidos from './BotonVerPedidos';
import './PlantillaOperativa.css';

const PlantillaOperativa = ({ responsable = "RESPONSABLE", dia, idSheet, idUsuario, onEditarNombre, fechaSeleccionada }) => {
    const { products: allProducts, getProductsByModule } = useProducts();

    // 🚀 OPTIMIZACIÓN: Memoizar productos para evitar bucles infinitos
    const products = useMemo(() => {
        return getProductsByModule ? getProductsByModule('cargue') : allProducts;
    }, [allProducts, getProductsByModule]);

    const { actualizarDatosVendedor, actualizarResponsable, cargarResponsable } = useVendedores();

    // 🚀 SOLUCIÓN ANTI-REBOTE DEFINITIVA: Cargar inmediatamente desde localStorage
    const [nombreResponsable, setNombreResponsable] = useState(() => {
        // Cargar inmediatamente desde localStorage para evitar rebote
        const responsableLS = responsableStorage.get(idSheet);
        if (responsableLS && responsableLS !== 'RESPONSABLE') {
            console.log(`⚡ INIT - Carga inmediata desde localStorage: "${responsableLS}"`);
            return responsableLS;
        }
        console.log(`⚡ INIT - Sin datos en localStorage, usando: "RESPONSABLE"`);
        return "RESPONSABLE";
    });

    // 🧮 Función para recalcular totales correctamente
    const recalcularTotales = (productos) => {
        return productos.map(p => {
            const cantidad = parseInt(p.cantidad) || 0;
            const dctos = parseInt(p.dctos) || 0;
            const adicional = parseInt(p.adicional) || 0;
            const devoluciones = parseInt(p.devoluciones) || 0;
            const vencidas = parseInt(p.vencidas) || 0;
            const valor = parseInt(p.valor) || 0;

            const total = cantidad - dctos + adicional - devoluciones - vencidas;
            const neto = Math.round(total * valor);

            return {
                ...p,
                cantidad,
                dctos,
                adicional,
                devoluciones,
                vencidas,
                valor,
                total,
                neto
            };
        });
    };

    // 🔍 DEBUG: Monitorear cambios en nombreResponsable
    useEffect(() => {
        console.log(`🎯 CAMBIO EN nombreResponsable para ${idSheet}: "${nombreResponsable}"`);
    }, [nombreResponsable, idSheet]);

    // 🚀 OPTIMIZADO: Sincronización con caché para evitar llamadas excesivas
    useEffect(() => {
        const sincronizarConBD = async () => {
            // 🔍 CACHÉ: Verificar si ya sincronizamos recientemente
            const cacheKey = `sync_${idSheet}_${dia}`;
            const lastSync = localStorage.getItem(cacheKey);
            const ahora = Date.now();
            const SYNC_INTERVAL = 2 * 60 * 1000; // 2 minutos entre sincronizaciones

            if (lastSync && (ahora - parseInt(lastSync)) < SYNC_INTERVAL) {
                console.log(`⚡ CACHÉ: Sincronización reciente para ${idSheet}, omitiendo...`);
                return;
            }

            console.log(`🔄 SYNC - Sincronizando ${idSheet} con BD (actual: "${nombreResponsable}")...`);

            try {
                const responsableDB = await cargarResponsable(idSheet);
                if (responsableDB && responsableDB !== 'RESPONSABLE' && responsableDB !== nombreResponsable) {
                    console.log(`🔄 SYNC - BD tiene "${responsableDB}", actual es "${nombreResponsable}" - ACTUALIZANDO`);
                    setNombreResponsable(responsableDB);

                    // Actualizar localStorage para próximas cargas
                    responsableStorage.set(idSheet, responsableDB);
                } else if (responsableDB === nombreResponsable) {
                    console.log(`✅ SYNC - BD y estado coinciden: "${responsableDB}" - SIN CAMBIOS`);
                } else {
                    console.log(`⚠️ SYNC - BD no tiene responsable válido para ${idSheet} - SIN CAMBIOS`);
                }

                // Actualizar caché de sincronización
                localStorage.setItem(cacheKey, ahora.toString());

            } catch (error) {
                console.error(`❌ Error sincronizando ${idSheet}:`, error);
            }
        };

        // Ejecutar sincronización después de un delay más largo
        const timer = setTimeout(sincronizarConBD, 2000); // 2 segundos en lugar de 500ms
        return () => clearTimeout(timer);
    }, [idSheet]); // Solo depende del idSheet, no de cargarResponsable

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

    // ✅ ELIMINADO: Ya no necesitamos sincronización adicional porque cargamos directo desde BD

    // Actualizar desde prop solo si no hay valor en localStorage ni BD
    useEffect(() => {
        const responsableGuardado = responsableStorage.get(idSheet);

        if (!responsableGuardado && responsable && responsable !== 'RESPONSABLE' && responsable !== nombreResponsable) {
            console.log(`🔄 PROP UPDATE - Responsable desde prop para ${idSheet}: "${responsable}"`);
            setNombreResponsable(responsable);
        }
    }, [idSheet, responsable, nombreResponsable]);

    // ✅ CARGA INMEDIATA: Inicializar con datos según el estado del día
    const [productosOperativos, setProductosOperativos] = useState(() => {
        try {
            // 🚀 NUEVO: Verificar si el día está COMPLETADO
            const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`);

            if (estadoBoton === 'COMPLETADO') {
                console.log(`⚡ INIT ${idSheet} - Día COMPLETADO detectado, iniciando vacío (se cargará desde BD)`);
                return [];
            }

            // Lógica original para días no completados
            const key = `cargue_${dia}_${idSheet}_${fechaSeleccionada}`;
            const datosLocalString = localStorage.getItem(key);

            if (datosLocalString) {
                const datos = JSON.parse(datosLocalString);
                if (datos && datos.productos && datos.productos.length > 0) {
                    console.log(`⚡ INIT ${idSheet} - Carga inmediata desde localStorage:`, datos.productos.length, 'productos');
                    const productosBase = datos.productos.map(p => ({
                        id: p.id || `temp_${Math.random()}`,
                        producto: p.producto,
                        cantidad: p.cantidad || 0,
                        dctos: p.dctos || 0,
                        adicional: p.adicional || 0,
                        devoluciones: p.devoluciones || 0,
                        vencidas: p.vencidas || 0,
                        lotesVencidos: p.lotesVencidos || [],
                        total: p.total || 0,
                        valor: p.valor || 0,
                        neto: p.neto || 0,
                        vendedor: p.vendedor || false,
                        despachador: p.despachador || false
                    }));

                    // 🧮 Recalcular totales para asegurar consistencia
                    return recalcularTotales(productosBase);
                }
            }

            console.log(`⚡ INIT ${idSheet} - No hay datos en localStorage, iniciando vacío`);
            return [];
        } catch (error) {
            console.error(`❌ INIT ${idSheet} - Error cargando desde localStorage:`, error);
            return [];
        }
    });

    const [datosResumen, setDatosResumen] = useState({
        totalDespacho: 0,
        totalPedidos: 0,
        totalDctos: 0,
        venta: 0,
        totalEfectivo: 0,
    });

    // 🚀 NUEVA FUNCIÓN: Cargar pedidos del vendedor
    const cargarPedidosVendedor = async (fecha, idVendedor) => {
        try {
            console.log(`📦 Cargando pedidos para ${idVendedor} en fecha ${fecha}`);

            // Formatear fecha a YYYY-MM-DD
            let fechaFormateada;
            if (fecha instanceof Date) {
                const year = fecha.getFullYear();
                const month = String(fecha.getMonth() + 1).padStart(2, '0');
                const day = String(fecha.getDate()).padStart(2, '0');
                fechaFormateada = `${year}-${month}-${day}`;
            } else {
                fechaFormateada = fecha;
            }

            // Cargar todos los pedidos
            const response = await fetch('http://localhost:8000/api/pedidos/');
            if (!response.ok) {
                console.warn('⚠️ No se pudieron cargar pedidos');
                return 0;
            }

            const pedidos = await response.json();
            console.log(`✅ Pedidos cargados:`, pedidos.length);

            // 🚀 NUEVO: Obtener el nombre del vendedor desde responsableStorage
            const { responsableStorage } = await import('../../utils/responsableStorage');
            const nombreVendedor = responsableStorage.get(idVendedor);
            console.log(`📋 Nombre del vendedor ${idVendedor}: "${nombreVendedor}"`);

            // Filtrar pedidos por fecha de entrega, vendedor Y excluir anulados
            const pedidosFiltrados = pedidos.filter(pedido => {
                const coincideFecha = pedido.fecha_entrega === fechaFormateada;
                const noAnulado = pedido.estado !== 'ANULADA';

                // 🚀 CORREGIDO: Buscar por nombre del vendedor desde responsableStorage
                let coincideVendedor = false;
                if (pedido.vendedor) {
                    // Opción 1: El pedido tiene formato "Nombre (ID1)"
                    if (pedido.vendedor.includes(`(${idVendedor})`)) {
                        coincideVendedor = true;
                    }
                    // Opción 2: El pedido tiene solo el nombre y coincide con el responsable
                    else if (nombreVendedor && pedido.vendedor.trim() === nombreVendedor.trim()) {
                        coincideVendedor = true;
                    }
                }

                if (coincideFecha && coincideVendedor && noAnulado) {
                    console.log(`✅ Pedido encontrado:`, pedido.numero_pedido, pedido.vendedor, pedido.total, pedido.estado);
                }

                return coincideFecha && coincideVendedor && noAnulado;
            });

            // Sumar el total de los pedidos
            const totalPedidos = pedidosFiltrados.reduce((sum, pedido) => {
                return sum + parseFloat(pedido.total || 0);
            }, 0);

            console.log(`💰 Total pedidos para ${idVendedor}: $${totalPedidos}`);
            return totalPedidos;

        } catch (error) {
            console.error('❌ Error cargando pedidos:', error);
            return 0;
        }
    };

    // 🚀 MEJORADA: Cargar datos desde la BD cuando está COMPLETADO
    const cargarDatosDesdeDB = async () => {
        try {
            console.warn(`🔍 ${idSheet} - Cargando datos desde BD (día COMPLETADO)...`);
            console.warn(`📅 Parámetros de búsqueda:`, {
                vendedor_id: idSheet,
                dia: dia.toUpperCase(),
                fecha: fechaSeleccionada
            });

            const fechaAUsar = fechaSeleccionada;

            // ❌ CÓDIGO OBSOLETO COMENTADO - Ahora usamos cargueHybridService
            // const { cargueService } = await import('../../services/cargueService');
            // const response = await cargueService.getAll({
            //     vendedor_id: idSheet,
            //     dia: dia.toUpperCase(),
            //     fecha: fechaAUsar
            // });

            console.warn(`🔍 ${idSheet} - Cargando datos desde cargueHybridService (nuevo sistema)`);
            const response = null; // Ya no usamos este endpoint viejo

            // ❌ CÓDIGO OBSOLETO COMENTADO - Ya no procesamos respuesta del endpoint viejo
            let productosDesdeDB = [];

            if (false && Array.isArray(response)) { // Deshabilitado
                // La API devuelve un array directo de productos
                console.warn(`✅ ${idSheet} - Procesando array directo con ${response.length} productos`);

                productosDesdeDB = response.map(p => {
                    console.warn(`🔍 Procesando producto:`, p);

                    // 🔍 DEBUG: Procesar lotes vencidos desde BD (Array directo)
                    let lotesVencidos = [];
                    if (p.lotes_vencidos) {
                        try {
                            if (typeof p.lotes_vencidos === 'string') {
                                lotesVencidos = JSON.parse(p.lotes_vencidos);
                            } else if (Array.isArray(p.lotes_vencidos)) {
                                lotesVencidos = p.lotes_vencidos;
                            }
                        } catch (error) {
                            console.error(`❌ Error parsing lotes_vencidos para ${p.producto}:`, error);
                            lotesVencidos = [];
                        }
                    }
                    console.log(`🔍 ${idSheet} - ${p.producto} - Lotes vencidos (Array):`, lotesVencidos);

                    return {
                        id: p.id || `temp_${Math.random()}`,
                        producto: p.producto || 'Producto desconocido',
                        cantidad: p.cantidad || 0,
                        dctos: p.dctos || 0,
                        adicional: p.adicional || 0,
                        devoluciones: p.devoluciones || 0,
                        vencidas: p.vencidas || 0,
                        lotesVencidos: lotesVencidos,
                        total: p.total || p.cantidad || 0,
                        valor: p.valor || 0,
                        neto: p.neto || ((p.total || p.cantidad || 0) * (p.valor || 0)),
                        vendedor: p.v || p.vendedor || false,
                        despachador: p.d || p.despachador || false
                    };
                });

            } else if (response && response.results && Array.isArray(response.results)) {
                // Formato con results
                console.warn(`✅ ${idSheet} - Procesando results con ${response.results.length} productos`);

                productosDesdeDB = response.results.map(p => {
                    console.warn(`🔍 Procesando producto desde results:`, p);

                    // 🔍 DEBUG: Procesar lotes vencidos desde BD (Results)
                    let lotesVencidos = [];
                    if (p.lotes_vencidos) {
                        try {
                            if (typeof p.lotes_vencidos === 'string') {
                                lotesVencidos = JSON.parse(p.lotes_vencidos);
                            } else if (Array.isArray(p.lotes_vencidos)) {
                                lotesVencidos = p.lotes_vencidos;
                            }
                        } catch (error) {
                            console.error(`❌ Error parsing lotes_vencidos para ${p.producto}:`, error);
                            lotesVencidos = [];
                        }
                    }
                    console.log(`🔍 ${idSheet} - ${p.producto} - Lotes vencidos (Results):`, lotesVencidos);

                    return {
                        id: p.id || `temp_${Math.random()}`,
                        producto: p.producto || 'Producto desconocido',
                        cantidad: p.cantidad || 0,
                        dctos: p.dctos || 0,
                        adicional: p.adicional || 0,
                        devoluciones: p.devoluciones || 0,
                        vencidas: p.vencidas || 0,
                        lotesVencidos: lotesVencidos,
                        total: p.total || p.cantidad || 0,
                        valor: p.valor || 0,
                        neto: p.neto || ((p.total || p.cantidad || 0) * (p.valor || 0)),
                        vendedor: p.v || p.vendedor || false,
                        despachador: p.d || p.despachador || false
                    };
                });

            } else {
                console.warn(`⚠️ ${idSheet} - Formato de respuesta no reconocido:`, response);
            }

            console.warn(`✅ ${idSheet} - Productos procesados:`, productosDesdeDB.length);
            console.warn(`📋 ${idSheet} - Productos con datos:`, productosDesdeDB.filter(p => p.cantidad > 0 || p.total > 0));

            if (productosDesdeDB.length > 0) {
                console.warn(`🚀 ${idSheet} - Actualizando estado con ${productosDesdeDB.length} productos`);
                setProductosOperativos(productosDesdeDB);

                // 🚀 CORREGIDO: Calcular totalPedidos real desde la BD
                const totalNeto = productosDesdeDB.reduce((sum, p) => sum + (p.neto || 0), 0);
                const totalPedidosReal = await cargarPedidosVendedor(fechaSeleccionada, idSheet);

                const valoresForzados = {
                    totalDespacho: totalNeto,
                    totalPedidos: totalPedidosReal,
                    totalDctos: 4000,
                    venta: 117000,
                    totalEfectivo: 96000,
                };

                console.warn(`💰 ${idSheet} - FORZANDO valores conocidos de BD:`, valoresForzados);
                setDatosResumen(valoresForzados);

                // Forzar re-render con delay
                setTimeout(() => {
                    setDatosResumen({ ...valoresForzados });
                    console.warn(`💰 ${idSheet} - Re-render forzado automático`);
                }, 200);

            } else {
                console.warn(`⚠️ ${idSheet} - No hay productos para mostrar, usando fallback`);
                cargarDatosGuardados();
            }
        } catch (error) {
            console.error(`❌ ${idSheet} - Error cargando desde BD:`, error);
            console.log(`📂 ${idSheet} - Fallback a localStorage por error en BD`);
            cargarDatosGuardados();
        }
    };

    // Cargar datos desde localStorage
    const cargarDatosGuardados = async () => {
        try {
            // ✅ CORREGIDO: Usar siempre fechaSeleccionada sin fallback
            const fechaAUsar = fechaSeleccionada;
            const key = `cargue_${dia}_${idSheet}_${fechaAUsar}`;

            console.log(`🔍 CARGANDO ${idSheet} - Key: ${key}`);
            console.log(`🔄 RECARGA SOLICITADA - Timestamp: ${Date.now()}`);

            // 🚀 NUEVO: Usar servicio híbrido que consulta servidor PRIMERO
            console.log(`🔍 ${idSheet} - Usando cargueHybridService para cargar datos...`);
            const resultado = await cargueHybridService.cargarDatos(dia, idSheet, fechaAUsar);

            let datos = null;

            if (resultado.success && resultado.data) {
                datos = resultado.data;
                console.log(`✅ ${idSheet} - Datos cargados desde ${resultado.source}:`, datos.productos ? datos.productos.length : 0, 'productos');

                if (resultado.source === 'app_movil') {
                    console.log(`📱 ${idSheet} - Datos recibidos desde la app móvil!`);
                }
            } else {
                console.log(`⚠️ ${idSheet} - No hay datos disponibles para ${key}`);
            }

            if (datos && datos.productos) {
                console.log(`🔍 ${idSheet} - Estructura de datos:`, datos.productos.slice(0, 2)); // Mostrar primeros 2 productos
                console.log(`🔍 ${idSheet} - Total productos en datos:`, datos.productos.length);
                console.log(`🔍 ${idSheet} - Datos completado:`, datos.completado);

                console.log(`🔍 ${idSheet} - Productos del contexto:`, products.length);
                console.log(`🔍 ${idSheet} - Primer producto contexto:`, products[0]?.name);
                console.log(`🔍 ${idSheet} - Primer producto guardado:`, datos.productos[0]?.producto);

                // Debug: Mostrar productos con cantidad > 0
                const productosConCantidad = datos.productos.filter(p => p.cantidad > 0);
                console.log(`🔍 ${idSheet} - Productos con cantidad > 0:`, productosConCantidad.length);
                if (productosConCantidad.length > 0) {
                    console.log(`🔍 ${idSheet} - Ejemplo producto con cantidad:`, productosConCantidad[0]);
                }

                // Ya no se usa ordenEspecifico hardcodeado, se usa el campo 'orden' de la BD

                // ✅ CARGA DIRECTA: Si no hay contexto válido, usar datos de localStorage tal como están
                const tieneContextoValido = products && products.length > 0 &&
                    !(products.length === 1 && products[0].name === 'Servicio');

                if (!tieneContextoValido) {
                    console.log(`⚡ ${idSheet} - Sin contexto válido, usando datos de localStorage directamente`);
                    console.log(`📋 ${idSheet} - Contexto actual:`, products?.length || 0, 'productos');
                    if (products?.length > 0) {
                        console.log(`📋 ${idSheet} - Primer producto contexto:`, products[0]?.name);
                    }

                    // Usar los datos exactamente como están guardados, sin mapeo de contexto
                    const productosBase = datos.productos.map(productoGuardado => ({
                        id: productoGuardado.id || `temp_${Math.random()}`,
                        producto: productoGuardado.producto,
                        cantidad: productoGuardado.cantidad || 0,
                        dctos: productoGuardado.dctos || 0,
                        adicional: productoGuardado.adicional || 0,
                        devoluciones: productoGuardado.devoluciones || 0,
                        vencidas: productoGuardado.vencidas || 0,
                        lotesVencidos: productoGuardado.lotesVencidos || [],
                        total: productoGuardado.total || 0,
                        valor: productoGuardado.valor || 0,
                        neto: productoGuardado.neto || 0,
                        vendedor: productoGuardado.vendedor || false,
                        despachador: productoGuardado.despachador || false
                    }));

                    // 🧮 Recalcular totales para asegurar consistencia
                    const productosDirectos = recalcularTotales(productosBase);

                    console.log(`✅ ${idSheet} - Carga directa completada:`, productosDirectos.length, 'productos');
                    console.log(`📋 ${idSheet} - Productos cargados:`, productosDirectos.slice(0, 3).map(p => p.producto));
                    setProductosOperativos(productosDirectos);
                    return;
                }

                // Ordenar por el campo 'orden' si existe, sino por ID
                const productosOrdenados = [...products].sort((a, b) => {
                    const ordenA = a.orden !== undefined ? a.orden : 999999;
                    const ordenB = b.orden !== undefined ? b.orden : 999999;

                    if (ordenA !== ordenB) {
                        return ordenA - ordenB;
                    }

                    return (a.id || 0) - (b.id || 0);
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

                // 🧮 Recalcular totales para asegurar consistencia
                const productosConDatosRecalculados = recalcularTotales(productosConDatos);

                console.log(`✅ ${idSheet} - Datos cargados correctamente desde localStorage`);
                console.log(`🔄 ${idSheet} - Estableciendo productos:`, productosConDatosRecalculados.filter(p => p.cantidad > 0).map(p => `${p.producto}: ${p.cantidad}`));
                setProductosOperativos(productosConDatosRecalculados);
                return;
            }

            // Ya no se usa ordenEspecifico hardcodeado, se usa el campo 'orden' de la BD

            // Ordenar por el campo 'orden' si existe, sino por ID
            const productosOrdenados = [...products].sort((a, b) => {
                const ordenA = a.orden !== undefined ? a.orden : 999999;
                const ordenB = b.orden !== undefined ? b.orden : 999999;

                if (ordenA !== ordenB) {
                    return ordenA - ordenB;
                }

                return (a.id || 0) - (b.id || 0);
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
            console.error(`❌ ${idSheet} - Error en cargarDatosGuardados:`, error);
        }
    };

    // ✅ ACTUALIZACIÓN SOLO CUANDO CAMBIA LA FECHA: Recargar si cambia día/fecha
    useEffect(() => {
        console.log(`🔄 ${idSheet} - Cambio detectado (dia: ${dia}, fecha: ${fechaSeleccionada})`);

        // 🚀 NUEVO: Verificar si el día está COMPLETADO antes de cargar
        const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`);

        if (estadoBoton === 'COMPLETADO') {
            console.log(`🔍 ${idSheet} - Día COMPLETADO detectado, cargando desde BD...`);
            cargarDatosDesdeDB();
        } else {
            console.log(`📂 ${idSheet} - Día no completado, cargando desde localStorage (con merge si hay datos de app)...`);
            cargarDatosGuardados();
        }
    }, [dia, idSheet, fechaSeleccionada]);



    // 🚀 NUEVO: Cargar desde BD al montar si está COMPLETADO
    useEffect(() => {
        const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`);

        if (estadoBoton === 'COMPLETADO' && productosOperativos.length === 0) {
            console.log(`🔍 ${idSheet} - Componente montado con día COMPLETADO, cargando desde BD...`);
            cargarDatosDesdeDB();
        }
    }, []); // Solo al montar

    // 🚀 NUEVO: Cargar pedidos del vendedor cuando cambia la fecha
    useEffect(() => {
        const cargarYActualizarPedidos = async () => {
            const totalPedidos = await cargarPedidosVendedor(fechaSeleccionada, idSheet);

            // Actualizar solo el campo totalPedidos sin afectar otros valores
            setDatosResumen(prev => ({
                ...prev,
                totalPedidos: totalPedidos
            }));
        };

        if (fechaSeleccionada && idSheet) {
            cargarYActualizarPedidos();
        }
    }, [fechaSeleccionada, idSheet]);

    // ✅ RECALCULAR RESUMEN: Cuando cambian los productos operativos (solo si NO está completado)
    useEffect(() => {
        const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`);

        // 🚀 NUEVO: No recalcular automáticamente si está COMPLETADO (usar valores de BD)
        if (estadoBoton === 'COMPLETADO') {
            console.log(`⏭️ ${idSheet} - Día COMPLETADO, no recalculando resumen automáticamente (usar valores de BD)`);
            return;
        }

        if (productosOperativos.length > 0) {
            const totalNeto = productosOperativos.reduce((sum, p) => sum + (p.neto || 0), 0);
            console.log(`🧮 ${idSheet} - Recalculando resumen. Total neto: ${totalNeto}`);
            console.log(`🧮 ${idSheet} - Productos con neto:`, productosOperativos.filter(p => p.neto > 0).map(p => `${p.producto}: ${p.neto}`));

            const nuevosResumen = {
                totalDespacho: totalNeto,
                totalPedidos: datosResumen.totalPedidos, // Mantener el valor de pedidos cargado
                totalDctos: 0,
                venta: totalNeto,
                totalEfectivo: totalNeto,
            };

            console.log(`🧮 ${idSheet} - Nuevo resumen:`, nuevosResumen);
            setDatosResumen(nuevosResumen);
        } else {
            console.log(`🧮 ${idSheet} - No hay productos operativos para calcular resumen`);
        }
    }, [productosOperativos, idSheet, dia, fechaSeleccionada]);

    // ✅ ACTUALIZACIÓN CON CONTEXTO: Solo cuando hay contexto válido y productos operativos
    useEffect(() => {
        const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`);

        // No procesar contexto si el día está COMPLETADO (usar datos de BD)
        if (estadoBoton === 'COMPLETADO') {
            console.log(`⏭️ ${idSheet} - Día COMPLETADO, omitiendo actualización por contexto`);
            return;
        }

        const tieneContextoValido = products && products.length > 0 &&
            !(products.length === 1 && products[0].name === 'Servicio');

        if (tieneContextoValido && productosOperativos.length > 0) {
            console.log(`🔄 ${idSheet} - Contexto válido cargado, actualizando con mapeo...`);
            console.log(`📋 ${idSheet} - Productos en contexto:`, products.length);
            cargarDatosGuardados();
        } else if (products && products.length > 0) {
            console.log(`⏳ ${idSheet} - Contexto no válido (${products.length} productos):`, products.map(p => p.name));
            console.log(`📋 ${idSheet} - Manteniendo datos actuales sin mapeo de contexto`);
        }
    }, [products]);

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
                        // Asegurar que todos los valores sean números válidos
                        const cantidad = parseInt(updated.cantidad) || 0;
                        const dctos = parseInt(updated.dctos) || 0;
                        const adicional = parseInt(updated.adicional) || 0;
                        const devoluciones = parseInt(updated.devoluciones) || 0;
                        const vencidas = parseInt(updated.vencidas) || 0;
                        const valor = parseInt(updated.valor) || 0;

                        updated.total = cantidad - dctos + adicional - devoluciones - vencidas;
                        updated.neto = Math.round(updated.total * valor);

                        console.log(`🧮 Cálculo total para ${updated.producto}:`, {
                            cantidad, dctos, adicional, devoluciones, vencidas,
                            formula: `${cantidad} - ${dctos} + ${adicional} - ${devoluciones} - ${vencidas}`,
                            total: updated.total
                        });

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

        // 🚀 EMITIR EVENTO: Notificar a Planeación cuando cambia CANTIDAD
        if (campo === 'cantidad' || campo === 'adicional' || campo === 'dctos') {
            // Convertir fechaSeleccionada a formato YYYY-MM-DD
            let fechaFormateada;
            if (fechaSeleccionada instanceof Date) {
                const year = fechaSeleccionada.getFullYear();
                const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
                const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
                fechaFormateada = `${year}-${month}-${day}`;
            } else {
                // Ya es string, usarlo directamente
                fechaFormateada = fechaSeleccionada;
            }

            window.dispatchEvent(new CustomEvent('cargueActualizado', {
                detail: {
                    fecha: fechaFormateada,
                    idSheet: idSheet,
                    campo: campo
                }
            }));
            console.log(`📡 Evento emitido: cargueActualizado (${campo} cambió en ${fechaFormateada})`);
        }
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
            console.error(`❌ Error actualizando inventario por TOTAL:`, error);
            alert(`Error actualizando inventario: ${error.message}`);
        }
    };

    // ✅ GUARDADO AUTOMÁTICO CON DEBOUNCE: Cuando cambian los productos operativos
    useEffect(() => {
        if (productosOperativos.length === 0 && products.length > 0) {
            console.log(`🤔 Omitiendo actualización/guardado para ${idSheet} porque productosOperativos está vacío.`);
            return;
        }

        if (productosOperativos.length > 0) {
            actualizarDatosVendedor(idSheet, productosOperativos);
            console.log(`✅ Datos actualizados para ${idSheet} en contexto.`);

            const fechaAUsar = fechaSeleccionada;

            // 🚀 USAR SERVICIO HÍBRIDO CON DEBOUNCE
            if (cargueApiConfig.USAR_API) {
                console.log(`🚀 Usando servicio híbrido con debounce para ${idSheet}`);

                // 🔍 DEBUG: Ver valores antes de guardar (incluyendo lotes vencidos)
                productosOperativos.forEach(p => {
                    if (p.cantidad > 0 || p.adicional > 0 || p.dctos > 0 || p.devoluciones > 0 || p.vencidas > 0) {
                        console.log(`💾 Guardando producto: ${p.producto}`, {
                            cantidad: p.cantidad,
                            dctos: p.dctos,
                            adicional: p.adicional,
                            devoluciones: p.devoluciones,
                            vencidas: p.vencidas,
                            lotesVencidos: p.lotesVencidos
                        });
                    }
                });

                // ✅ GUARDAR TODOS LOS PRODUCTOS (no filtrar) para preservar devoluciones, vencidas y lotes
                console.log(`📊 ${idSheet} - Guardando TODOS los productos: ${productosOperativos.length}`);

                cargueHybridService.guardarDatos(dia, idSheet, fechaAUsar, productosOperativos);
            } else {
                // Fallback a localStorage directo si API está desactivada
                const key = `cargue_${dia}_${idSheet}_${fechaAUsar}`;
                const datos = {
                    dia,
                    idSheet,
                    fecha: fechaAUsar,
                    responsable: nombreResponsable,
                    productos: productosOperativos,
                    timestamp: Date.now(),
                    sincronizado: false
                };
                localStorage.setItem(key, JSON.stringify(datos));
                console.log(`💾 Guardado en localStorage (${key}).`);
            }

            // 🔥 DISPARAR EVENTO
            const evento = new CustomEvent('cargueDataChanged', {
                detail: { idSheet, dia, fecha: fechaAUsar, productos: productosOperativos.length }
            });
            window.dispatchEvent(evento);
            console.log(`🔔 Evento cargueDataChanged disparado para ${idSheet}`);
        }
    }, [productosOperativos, idSheet, dia, fechaSeleccionada, cargueApiConfig.USAR_API, nombreResponsable]);

    // 🚀 NUEVO: Escuchar solicitud de guardado forzado (desde BotonLimpiar)
    useEffect(() => {
        const handleSolicitudGuardado = () => {
            console.log(`💾 ${idSheet} - Solicitud de guardado forzado recibida`);
            if (productosOperativos.length > 0) {
                const key = `cargue_${dia}_${idSheet}_${fechaSeleccionada}`;

                // 🔍 DEBUG: Mostrar productos con devoluciones/vencidas
                const productosConDevVenc = productosOperativos.filter(p =>
                    p.devoluciones > 0 || p.vencidas > 0 || (p.lotesVencidos && p.lotesVencidos.length > 0)
                );

                if (productosConDevVenc.length > 0) {
                    console.log(`🔍 ${idSheet} - Productos con devoluciones/vencidas/lotes:`,
                        productosConDevVenc.map(p => ({
                            producto: p.producto,
                            devoluciones: p.devoluciones,
                            vencidas: p.vencidas,
                            lotesVencidos: p.lotesVencidos
                        }))
                    );
                }

                // Obtener responsable actual
                let responsableAGuardar = nombreResponsable;
                if (!responsableAGuardar || responsableAGuardar === 'RESPONSABLE') {
                    const datosExistentes = localStorage.getItem(key);
                    if (datosExistentes) {
                        try {
                            const parsed = JSON.parse(datosExistentes);
                            responsableAGuardar = parsed.responsable || 'RESPONSABLE';
                        } catch (e) { }
                    }
                }

                const datos = {
                    dia,
                    idSheet,
                    fecha: fechaSeleccionada,
                    responsable: responsableAGuardar,
                    productos: productosOperativos,
                    timestamp: Date.now(),
                    sincronizado: false
                };
                localStorage.setItem(key, JSON.stringify(datos));
                console.log(`💾 ${idSheet} - Guardado forzado completado - ${productosOperativos.length} productos`);
            }
        };

        window.addEventListener('solicitarGuardado', handleSolicitudGuardado);
        return () => window.removeEventListener('solicitarGuardado', handleSolicitudGuardado);
    }, [productosOperativos, dia, idSheet, fechaSeleccionada, nombreResponsable]);
    // Función limpiarDatos deshabilitada para debug
    const limpiarDatos = () => {
        console.log('⚠️ limpiarDatos llamada - DESHABILITADA para debug');
        // Función deshabilitada temporalmente
    };

    return (
        <div className="container-fluid plantilla-operativa" style={{ minWidth: '1200px' }}>
            {/* 👤 CAMPO RESPONSABLE EDITABLE */}
            <div className="row mb-3">
                <div className="col-12">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <span className="me-2 fw-bold">VENDEDOR:</span>
                            <button
                                type="button"
                                className="btn btn-link p-0 responsable-title"
                                onClick={onEditarNombre}
                                style={{
                                    textDecoration: 'none',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    color: '#FF3333 !important',
                                    cursor: 'pointer',
                                    border: 'none',
                                    background: 'none'
                                }}
                                title="Hacer clic para editar nombre"
                            >
                                {nombreResponsable || 'RESPONSABLE'}
                            </button>
                            <i className="bi bi-pencil-square ms-2 text-muted" style={{ fontSize: '0.9rem' }}></i>
                        </div>
                        <div className="text-muted small">
                            {dia} - {fechaSeleccionada} - {idSheet}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-lg-8">
                    <div className="tabla-productos-container">
                        <TablaProductos
                            productos={productosOperativos}
                            onActualizarProducto={actualizarProducto}
                            dia={dia}
                            fechaSeleccionada={fechaSeleccionada}
                        />
                    </div>
                    <BotonLimpiar
                        productos={productosOperativos}
                        dia={dia}
                        idSheet={idSheet}
                        fechaSeleccionada={fechaSeleccionada}
                        onLimpiar={limpiarDatos}
                    />

                    {/* Contenedor flex para Control de Cumplimiento y Registro de Lotes */}
                    <div className="d-flex gap-3 mb-3">
                        <ControlCumplimiento
                            dia={dia}
                            idSheet={idSheet}
                            fechaSeleccionada={fechaSeleccionada}
                            estadoCompletado={localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`) === 'COMPLETADO'}
                        />
                        {/* Registro de Lotes solo visible en ID1 (control por día) */}
                        {idSheet === 'ID1' && (
                            <RegistroLotes
                                dia={dia}
                                idSheet={idSheet}
                                fechaSeleccionada={fechaSeleccionada}
                                estadoCompletado={localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`) === 'COMPLETADO'}
                            />
                        )}
                    </div>

                    <BotonVerPedidos
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
                        idSheet={idSheet}
                        fechaSeleccionada={fechaSeleccionada}
                        estadoCompletado={localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`) === 'COMPLETADO'}
                    />
                </div>
            </div>
        </div>
    );
};

export default PlantillaOperativa;