import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useProducts } from '../../hooks/useUnifiedProducts';
import { useVendedores } from '../../context/VendedoresContext';
import { simpleStorage } from '../../services/simpleStorage';
import { responsableStorage } from '../../utils/responsableStorage';
import { cargueApiConfig } from '../../services/cargueApiService'; // Keep cargueApiConfig if still used
import TablaProductos from './TablaProductos';
import ResumenVentas from './ResumenVentas';
import BotonLimpiar from './BotonLimpiar';
import ControlCumplimiento from './ControlCumplimiento';
import RegistroLotes from './RegistroLotes';
import BotonCorreccionNuevo from './BotonCorreccionNuevo';
import BotonVerPedidos from './BotonVerPedidos';


import { cargueHybridService } from '../../services/cargueApiService'; // Corrected import
import { productoService } from '../../services/api'; // Para cargar precios directamente
import { cargueRealtimeService } from '../../services/cargueRealtimeService'; // 🆕 Sincronización tiempo real
import './PlantillaOperativa.css';

// URL de la API (usa variable de entorno en desarrollo, /api en producción)
const API_URL = process.env.REACT_APP_API_URL || '/api';

const PlantillaOperativa = ({ responsable = "RESPONSABLE", dia, idSheet, idUsuario, onEditarNombre, fechaSeleccionada }) => {
    const { products: allProducts, getProductsByModule } = useProducts();

    // 🔧 Formatear fecha para localStorage (YYYY-MM-DD)
    const fechaFormateadaLS = useMemo(() => {
        if (fechaSeleccionada instanceof Date) {
            return fechaSeleccionada.toISOString().split('T')[0];
        }
        return fechaSeleccionada || '';
    }, [fechaSeleccionada]);

    // 🚀 OPTIMIZACIÓN: Memoizar productos para evitar bucles infinitos
    const products = useMemo(() => {
        return getProductsByModule ? getProductsByModule('cargue') : allProducts;
    }, [allProducts, getProductsByModule]);

    // 🚀 PRECIOS CON CACHÉ: Cargar inmediatamente desde localStorage, actualizar desde backend en segundo plano
    const [preciosLista, setPreciosLista] = useState(() => {
        // Cargar inmediatamente desde caché para evitar parpadeo
        const cachePreciosStr = localStorage.getItem('precios_cargue_cache');
        if (cachePreciosStr) {
            try {
                const cachePrecios = JSON.parse(cachePreciosStr);
                console.log(`⚡ Precios cargados desde caché: ${Object.keys(cachePrecios).length} productos`);
                return cachePrecios;
            } catch (e) {
                console.error('Error parseando caché de precios:', e);
            }
        }
        return {};
    });

    // 🚀 Actualizar precios desde backend en segundo plano
    useEffect(() => {
        const actualizarPreciosDesdeBackend = async () => {
            try {

                const productosBackend = await productoService.getAll();

                if (productosBackend && productosBackend.length > 0) {
                    // Recuperar caché actual para comparación defensiva
                    const cacheActual = JSON.parse(localStorage.getItem('precios_cargue_cache') || '{}');
                    const mapaPrecios = {};

                    productosBackend.forEach(p => {
                        const precioCargue = parseFloat(p.precio_cargue) || 0;
                        const precioBase = parseFloat(p.precio) || 0;
                        // Robustecer búsqueda por ID (String vs Number)
                        const precioEnCache = cacheActual[p.id] || cacheActual[String(p.id)];

                        // Lógica Defensiva Anti-Rebote:
                        if (precioCargue > 0) {
                            // 1. Si la API trae un precio válido, usarlo (Prioridad Máxima)
                            mapaPrecios[p.id] = precioCargue;
                        } else if (precioEnCache > 0) {
                            // 2. Si la API trae 0 pero teníamos un precio válido en caché, CONSERVARLO.
                            // Esto evita que un glitch de la API nos resetee al precio calculado (1105)
                            mapaPrecios[p.id] = precioEnCache;
                        } else {
                            // 3. Si no hay nada, usar fallback del 65%
                            mapaPrecios[p.id] = Math.round(precioBase * 0.65);
                        }
                    });

                    // Guardar en caché para próximas cargas
                    localStorage.setItem('precios_cargue_cache', JSON.stringify(mapaPrecios));
                    setPreciosLista(mapaPrecios);
                    console.log(`💰 Precios actualizados y cacheados: ${Object.keys(mapaPrecios).length} productos`);
                }
            } catch (error) {
                console.error('❌ Error actualizando precios:', error);
            }
        };

        actualizarPreciosDesdeBackend();
    }, []); // Solo al montar

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

    // 🆕 Estado para modal de vendidas
    const [mostrarModalVendidas, setMostrarModalVendidas] = useState(false);

    // 🧮 Función para recalcular totales correctamente
    const recalcularTotales = (productos) => {
        return productos.map(p => {
            const cantidad = parseInt(p.cantidad) || 0;
            const dctos = parseInt(p.dctos) || 0;
            const adicional = parseInt(p.adicional) || 0;
            const devoluciones = parseInt(p.devoluciones) || 0;
            const vendidas = parseInt(p.vendidas) || 0;
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
                vendidas,
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

                // ✅ Sincronizar solo estado local (el evento ya implica persistencia o viene de ella)
                // NO llamar a actualizarResponsable aquí para evitar bucles infinitos
                // actualizarResponsable(idSheet, e.detail.nuevoNombre);
            }
        };

        window.addEventListener('responsableActualizado', handleResponsableUpdate);

        return () => {
            window.removeEventListener('responsableActualizado', handleResponsableUpdate);
        };
    }, [idSheet, actualizarResponsable]);

    // ✅ ELIMINADO: Ya no necesitamos sincronización adicional porque cargamos directo desde BD

    // Actualizar desde prop siempre que sea válida y diferente al estado actual
    useEffect(() => {
        // Si el padre nos manda un responsable válido (diferente a "RESPONSABLE" default), lo usamos
        if (responsable && responsable !== 'RESPONSABLE' && responsable !== nombreResponsable) {
            console.log(`🔄 PROP UPDATE - Actualizando responsable desde API para ${idSheet}: "${responsable}"`);
            setNombreResponsable(responsable);
            // También actualizamos el storage para que futuras cargas sean rápidas
            responsableStorage.set(idSheet, responsable);
        }
    }, [idSheet, responsable, nombreResponsable]);

    // 🚩 BANDERA: Evitar sincronización durante carga inicial (useRef para no disparar re-renders)
    const cargaInicialRef = useRef(true);
    // 🚩 NUEVO: Solo sincronizar cuando hay cambio manual del usuario
    const cambioManualRef = useRef(false);
    // 🚩 NUEVO: Evitar bucles infinitos en actualización de contexto
    const contextoActualizadoRef = useRef(false);
    // 🆕 NUEVO: Debounce para sincronización (evitar enviar cada tecla)
    const debounceTimerRef = useRef({});
    const [, forceUpdate] = useState(0); // Solo para forzar re-render cuando sea necesario

    // ✅ CARGA INMEDIATA CON CACHÉ: Cargar datos desde localStorage con precios cacheados
    const [productosOperativos, setProductosOperativos] = useState(() => {
        try {
            // Obtener precios desde caché
            const cachePreciosStr = localStorage.getItem('precios_cargue_cache');
            const preciosCacheados = cachePreciosStr ? JSON.parse(cachePreciosStr) : {};

            // Verificar si el día está COMPLETADO
            const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`);
            if (estadoBoton === 'COMPLETADO') {
                console.log(`⚡ INIT ${idSheet} - Día COMPLETADO, iniciando vacío`);
                return [];
            }

            // Cargar datos desde localStorage
            const key = `cargue_${dia}_${idSheet}_${fechaSeleccionada}`;
            const datosLocalString = localStorage.getItem(key);

            if (datosLocalString) {
                const datos = JSON.parse(datosLocalString);
                if (datos && datos.productos && datos.productos.length > 0) {
                    console.log(`⚡ INIT ${idSheet} - Carga inmediata con precios cacheados:`, datos.productos.length, 'productos');

                    const productosBase = datos.productos.map(p => {
                        // Usar precio cacheado si existe, sino usar el valor guardado
                        const precioCacheado = preciosCacheados[p.id];
                        return {
                            id: p.id || `temp_${Math.random()}`,
                            producto: p.producto,
                            cantidad: p.cantidad || 0,
                            dctos: p.dctos || 0,
                            adicional: p.adicional || 0,
                            devoluciones: p.devoluciones || 0,
                            vencidas: p.vencidas || 0,
                            lotesVencidos: p.lotesVencidos || [],
                            total: p.total || 0,
                            valor: precioCacheado !== undefined ? precioCacheado : (p.valor || 0),
                            neto: p.neto || 0,
                            vendedor: p.vendedor || false,
                            despachador: p.despachador || false
                        };
                    });

                    // Recalcular totales
                    return productosBase.map(p => {
                        const cantidad = parseInt(p.cantidad) || 0;
                        const dctos = parseInt(p.dctos) || 0;
                        const adicional = parseInt(p.adicional) || 0;
                        const devoluciones = parseInt(p.devoluciones) || 0;
                        const vencidas = parseInt(p.vencidas) || 0;
                        const valor = parseInt(p.valor) || 0;
                        const total = cantidad - dctos + adicional - devoluciones - vencidas;
                        const neto = Math.round(total * valor);
                        return { ...p, total, neto };
                    });
                }
            }

            console.log(`⚡ INIT ${idSheet} - No hay datos en localStorage`);
            return [];
        } catch (error) {
            console.error(`❌ INIT ${idSheet} - Error:`, error);
            return [];
        }
    });

    const [datosResumen, setDatosResumen] = useState(() => {
        // 🚀 CACHÉ INMEDIATO: Intentar leer del caché para evitar parpadeo en 0
        try {
            let fechaStr = '';
            if (fechaSeleccionada instanceof Date) {
                fechaStr = fechaSeleccionada.toISOString().split('T')[0];
            } else {
                fechaStr = fechaSeleccionada || '';
            }

            const cacheKey = `resumen_cache_${dia}_${idSheet}_${fechaStr}`;
            const cached = localStorage.getItem(cacheKey);

            if (cached) {
                const parsed = JSON.parse(cached);
                console.log(`⚡ INIT ${idSheet} - Resumen cargado desde caché:`, parsed);
                return parsed;
            }
        } catch (e) {
            console.error('Error leyendo caché resumen:', e);
        }

        return {
            totalDespacho: 0,
            totalPedidos: 0,
            totalDctos: 0,
            venta: 0,
            totalEfectivo: 0,
            nequi: 0,
            daviplata: 0,
            novedad: null  // 🆕 Novedad de precios especiales
        };
    });

    // 🚀 PERSISTENCIA DE RESUMEN: Guardar cada cambio para el próximo montaje
    useEffect(() => {
        try {
            if (datosResumen.totalPedidos > 0 || datosResumen.venta > 0 || datosResumen.totalDespacho > 0) {
                const cacheKey = `resumen_cache_${dia}_${idSheet}_${fechaFormateadaLS}`;
                localStorage.setItem(cacheKey, JSON.stringify(datosResumen));
            }
        } catch (e) {
            console.error('Error guardando caché resumen:', e);
        }
    }, [datosResumen, dia, idSheet, fechaFormateadaLS]);

    // 🆕 Cargar novedad de precios especiales desde localStorage
    useEffect(() => {
        try {
            const novedadKey = `novedad_precios_${idSheet}_${fechaFormateadaLS}`;
            const novedadGuardada = localStorage.getItem(novedadKey);

            if (novedadGuardada) {
                console.log(`📝 Novedad cargada: ${novedadGuardada}`);
                setDatosResumen(prev => ({ ...prev, novedad: novedadGuardada }));
            }
        } catch (e) {
            console.error('Error cargando novedad:', e);
        }
    }, [idSheet, fechaFormateadaLS]);

    // 🚀 NUEVA FUNCIÓN: Cargar pedidos del vendedor
    const cargarPedidosVendedor = async (fecha, idVendedor) => {
        try {
            console.log(`📦 Cargando pedidos y ventas para ${idVendedor} en fecha ${fecha}`);

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

            // 1. Cargar PEDIDOS (🔥 OPTIMIZADO: Con filtros en la URL)
            const responsePedidos = await fetch(`${API_URL}/pedidos/?fecha_entrega=${fechaFormateada}`);
            let pedidos = [];
            if (responsePedidos.ok) {
                pedidos = await responsePedidos.json();
            }

            // 2. Cargar VENTAS NORMALES (Ruta) (🔥 OPTIMIZADO: Con filtros en la URL)
            const responseVentas = await fetch(`${API_URL}/ventas-ruta/?fecha=${fechaFormateada}`);
            let ventas = [];
            if (responseVentas.ok) {
                ventas = await responseVentas.json();
            }

            console.log(`✅ Datos cargados: ${pedidos.length} pedidos, ${ventas.length} ventas ruta`);

            // 🚀 NUEVO: Obtener el nombre del vendedor desde responsableStorage
            const { responsableStorage } = await import('../../utils/responsableStorage');
            const nombreVendedor = responsableStorage.get(idVendedor);

            // Función helper para filtrar
            const filtrarVendedorFecha = (item, esPedido) => {
                // Verificar fecha
                const fechaItem = (item.fecha_entrega || item.fecha || '').split('T')[0];
                const coincideFecha = fechaItem === fechaFormateada;

                // Excluir anulados
                const noAnulado = item.estado !== 'ANULADA';

                // Verificar vendedor
                let coincideVendedor = false;
                const vendedorItem = (item.vendedor || item.vendedor_id || '').toLowerCase().trim();
                const vendedorBuscado = (nombreVendedor || '').toLowerCase().trim();
                const idVendedorLower = idVendedor.toLowerCase();

                // Caso 1: ID directo "ID1"
                if (vendedorItem === idVendedorLower) {
                    coincideVendedor = true;
                }
                // Caso 2: Nombre (ID1)
                else if (vendedorItem.includes(`(${idVendedorLower})`)) {
                    coincideVendedor = true;
                }
                // Caso 3: Nombre coincide con responsable
                else if (vendedorBuscado && vendedorItem === vendedorBuscado) {
                    coincideVendedor = true;
                }

                return coincideFecha && coincideVendedor && noAnulado;
            };

            // Filtrar ambas listas
            const pedidosFiltrados = pedidos.filter(p => filtrarVendedorFecha(p, true));
            const ventasFiltradas = ventas.filter(v => filtrarVendedorFecha(v, false));

            console.log(`📊 Filtrados: ${pedidosFiltrados.length} pedidos, ${ventasFiltradas.length} ventas ruta`);

            // Combinar para pagos (Nequi/Daviplata/Efectivo sí deben sumar todo para el cuadre de caja)
            // 🆕 Diferenciar origen para la tabla detallada
            const todosLosItems = [
                ...pedidosFiltrados.map(p => ({ ...p, origen: 'PEDIDO' })),
                ...ventasFiltradas.map(v => ({ ...v, origen: 'VENTA' }))
            ];

            const pagosDetallados = [];

            // Calcular Total Pedidos EXCLUSIVAMENTE de los pedidos (para coincidir con el Modal)
            const sumaSoloPedidos = pedidosFiltrados.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

            const totales = todosLosItems.reduce((acc, item) => {
                const monto = parseFloat(item.total || 0);

                // NOTA IMPORTANTE: 
                // acc.total se usaba para "Total Pedidos". 
                // El usuario pide que este valor coincida con el Modal (Solo Pedidos).
                // Por tanto, NO sumamos las ventas ruta aquí, pero sí procesamos sus pagos.

                // Detectar método de pago
                const metodo = (item.metodo_pago || 'EFECTIVO').toUpperCase();

                if (metodo === 'NEQUI' || metodo === 'DAVIPLATA') {
                    if (metodo === 'NEQUI') acc.nequi += monto;
                    if (metodo === 'DAVIPLATA') acc.daviplata += monto;

                    // Priorizar Nombre del Negocio
                    const posibleNombre = item.nombre_negocio || item.negocio || item.razon_social || item.alias;

                    // 🔍 DEBUG
                    if (!posibleNombre && item.destinatario) {
                        // console.log(`🔍 Item Pago (Solo Destinatario): "${item.destinatario}"`, item);
                    }

                    let nombreFinal = posibleNombre ||
                        item.destinatario ||
                        item.cliente_nombre ||
                        'Cliente App';

                    // 🆕 MEJORA: Buscar si el nombre corresponde a un cliente con Alias (Nombre de Negocio)
                    if (clientesMapRef.current) {
                        try {
                            // Helper local para normalizar (por si acaso)
                            const norm = (t) => t ? t.toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';

                            const nombreKey = norm(nombreFinal);
                            const clienteEncontrado = clientesMapRef.current[nombreKey];

                            if (clienteEncontrado && clienteEncontrado.alias) {
                                // console.log(`✨ Reemplazando "${nombreFinal}" por Alias/Negocio "${clienteEncontrado.alias}"`);
                                nombreFinal = clienteEncontrado.alias;
                            }
                        } catch (e) {
                            console.warn("Error mapeando cliente:", e);
                        }
                    }

                    // Agregar al detalle
                    pagosDetallados.push({
                        concepto: nombreFinal.toUpperCase(),
                        nequi: metodo === 'NEQUI' ? monto : 0,
                        daviplata: metodo === 'DAVIPLATA' ? monto : 0,
                        origen: item.origen // 🆕 Flag para UI
                    });
                }

                return acc;
            }, { total: 0, nequi: 0, daviplata: 0 });

            // Asignar el total calculado solo de pedidos
            totales.total = sumaSoloPedidos;

            // Retornar estructura completa
            return {
                ...totales,
                pagosDetallados // 🆕 Retornar lista detallada de pagos
            };

        } catch (error) {
            console.error('❌ Error cargando datos vendedor:', error);
            return { total: 0, nequi: 0, daviplata: 0, pagosDetallados: [] };
        }
    };

    // 🆕 Cargar lista de clientes para mapeo de nombres -> negocios
    const clientesMapRef = useRef({});

    // Función auxiliar para normalizar strings (quitar tildes y espacios)
    const normalizarTexto = (texto) => {
        if (!texto) return '';
        return texto.toString().trim().toUpperCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Quitar tildes
    };

    useEffect(() => {
        const cargarClientes = async () => {
            try {
                // Solo cargar si no tenemos datos
                if (Object.keys(clientesMapRef.current).length > 0) return;

                const response = await fetch(`${API_URL}/clientes/`);
                if (response.ok) {
                    const clientes = await response.json();
                    const mapa = {};

                    clientes.forEach(c => {
                        // El "Negocio" suele ser el nombre completo o el alias
                        // El "Contacto" es la persona (Maria Lopez)
                        const nombreNegocio = c.nombre_completo || c.alias;
                        const nombreContacto = c.contacto;

                        // Indexar por Nombre de Negocio (por si acaso el pedido ya trae el negocio pero con variaciones)
                        if (nombreNegocio) {
                            mapa[normalizarTexto(nombreNegocio)] = { alias: nombreNegocio };
                        }

                        // Indexar por Alias explícito
                        if (c.alias) {
                            mapa[normalizarTexto(c.alias)] = { alias: c.alias };
                        }

                        // 🚀 CLAVE: Indexar por nombre de CONTACTO apuntando al Negocio
                        if (nombreContacto) {
                            mapa[normalizarTexto(nombreContacto)] = { alias: nombreNegocio };
                        }

                        // También intentar combinaciones de nombres si existen campos separados
                        if (c.primer_nombre && c.primer_apellido) {
                            const nombreArmado = `${c.primer_nombre} ${c.primer_apellido}`;
                            mapa[normalizarTexto(nombreArmado)] = { alias: nombreNegocio };
                        }
                    });

                    clientesMapRef.current = mapa;
                    console.log(`👥 Clientes cargados e indexados: ${Object.keys(mapa).length}`);
                }
            } catch (error) {
                console.error("Error cargando clientes:", error);
            }
        };

        cargarClientes();
    }, []); // Una sola vez al montar

    // 🚀 NUEVO: Actualización automática de pedidos en tiempo real (Polling cada 15s)
    useEffect(() => {
        let isMounted = true;

        // ... (Resto del useEffect)

        // Usar la función de normalización dentro del ciclo de items también
        // ... (Ver siguiente bloque de cambios para integrar `normalizarTexto` en el loop)
        const intervalId = setInterval(async () => {
            if (!idSheet || !fechaFormateadaLS) return;

            console.log(`🔄 Polling: Verificando nuevos pedidos para ${idSheet}...`);
            const resultadosPedidos = await cargarPedidosVendedor(fechaFormateadaLS, idSheet);

            // Extraer valores (manejo seguro por si devuelve solo número en versiones antiguas)
            const totalNuevo = typeof resultadosPedidos === 'object' ? resultadosPedidos.total : resultadosPedidos;
            const nequiNuevo = typeof resultadosPedidos === 'object' ? resultadosPedidos.nequi : 0;
            const daviNuevo = typeof resultadosPedidos === 'object' ? resultadosPedidos.daviplata : 0;
            const pagosDetalladosNuevo = typeof resultadosPedidos === 'object' ? resultadosPedidos.pagosDetallados : [];

            if (isMounted) {
                setDatosResumen(prev => {
                    // Solo actualizar si algún valor cambió
                    const cambioTotal = prev.totalPedidos !== totalNuevo;
                    const cambioNequi = (prev.nequi || 0) !== nequiNuevo;
                    const cambioDavi = (prev.daviplata || 0) !== daviNuevo;
                    // Comparación simple de longitud para arrays (profunda sería costosa)
                    const cambioDetalle = (prev.pagosDetallados?.length || 0) !== pagosDetalladosNuevo.length;

                    if (cambioTotal || cambioNequi || cambioDavi || cambioDetalle) {
                        console.log(`💰 Cambio detallado en pedidos: Total $${prev.totalPedidos}->${totalNuevo}, Nequi $${prev.nequi}->${nequiNuevo}`);
                        return {
                            ...prev,
                            totalPedidos: totalNuevo,
                            nequi: nequiNuevo,
                            daviplata: daviNuevo,
                            pagosDetallados: pagosDetalladosNuevo // 🆕 Guardar detalle
                        };
                    }
                    return prev;
                });
            }
        }, 15000); // 15 segundos

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [idSheet, fechaFormateadaLS]);

    // 🚀 MEJORADA: Cargar datos desde la BD cuando está COMPLETADO
    const cargarDatosDesdeDB = async () => {
        try {
            console.warn(`🔍 ${idSheet} - Cargando datos desde BD (día COMPLETADO)...`);

            // Formatear fecha para la API
            let fechaParaBD;
            if (fechaSeleccionada instanceof Date) {
                const year = fechaSeleccionada.getFullYear();
                const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
                const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
                fechaParaBD = `${year}-${month}-${day}`;
            } else {
                fechaParaBD = fechaSeleccionada;
            }

            console.warn(`📅 Parámetros de búsqueda:`, {
                vendedor_id: idSheet,
                dia: dia.toUpperCase(),
                fecha: fechaParaBD
            });

            // 🚀 NUEVO: Cargar directamente desde la API de cargue
            const endpoint = idSheet === 'ID1' ? 'cargue-id1' :
                idSheet === 'ID2' ? 'cargue-id2' :
                    idSheet === 'ID3' ? 'cargue-id3' :
                        idSheet === 'ID4' ? 'cargue-id4' :
                            idSheet === 'ID5' ? 'cargue-id5' : 'cargue-id6';

            const url = `${API_URL}/${endpoint}/?fecha=${fechaParaBD}&dia=${dia.toUpperCase()}`;
            console.warn(`🔍 ${idSheet} - Consultando: ${url}`);

            const fetchResponse = await fetch(url);
            const response = fetchResponse.ok ? await fetchResponse.json() : [];

            console.warn(`✅ ${idSheet} - Respuesta BD:`, response.length, 'registros');

            let productosDesdeDB = [];

            if (Array.isArray(response) && response.length > 0) { // Habilitado
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
                        vendidas: p.vendidas || 0,
                        vencidas: p.vencidas || 0,
                        lotesVencidos: lotesVencidos,
                        total: p.total !== undefined ? p.total : ((p.cantidad || 0) - (p.dctos || 0) + (p.adicional || 0) - (p.devoluciones || 0) - (p.vencidas || 0)),
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
                        vendidas: p.vendidas || 0,
                        vencidas: p.vencidas || 0,
                        lotesVencidos: lotesVencidos,
                        total: p.total !== undefined ? p.total : ((p.cantidad || 0) - (p.dctos || 0) + (p.adicional || 0) - (p.devoluciones || 0) - (p.vencidas || 0)),
                        valor: p.valor || 0,
                        neto: p.neto || ((p.total || p.cantidad || 0) * (p.valor || 0)),
                        vendedor: p.v || p.vendedor || false,
                        despachador: p.d || p.despachador || false
                    };
                });
            } else {
                console.warn(`⚠️ ${idSheet} - Formato de respuesta no reconocido:`, response);
            }

            // 🚀 LÓGICA ROBUSTA: Intentar mostrar datos siempre
            let productosFinales = [];

            if (products && products.length > 0) {
                // CASO 1: Tenemos contexto (Ideal) - Fusionar
                const ordenProductos = {};
                products.forEach((p, index) => {
                    ordenProductos[p.name] = index;
                });

                productosFinales = products.map(product => {
                    const productoBD = productosDesdeDB.find(p => p.producto === product.name);
                    if (productoBD) {
                        const valorReal = preciosLista[product.id] !== undefined ? preciosLista[product.id] : (productoBD.valor || Math.round(product.price * 0.65));
                        const totalReal = productoBD.total || 0;
                        return {
                            ...productoBD,
                            id: product.id || productoBD.id,
                            valor: valorReal,
                            neto: totalReal * valorReal,
                            vendedor: productoBD.vendedor || false,
                            despachador: productoBD.despachador || false
                        };
                    } else {
                        return {
                            id: product.id,
                            producto: product.name,
                            cantidad: 0,
                            dctos: 0,
                            adicional: 0,
                            devoluciones: 0,
                            vendidas: 0,
                            vencidas: 0,
                            lotesVencidos: [],
                            total: 0,
                            valor: preciosLista[product.id] !== undefined ? preciosLista[product.id] : Math.round(product.price * 0.65),
                            neto: 0,
                            vendedor: false,
                            despachador: false
                        };
                    }
                });
            } else if (productosDesdeDB.length > 0) {
                // CASO 2: Sin contexto pero con datos de BD
                console.warn(`⚠️ ${idSheet} - Sin contexto de productos, validando datos de BD`);
                productosFinales = productosDesdeDB;
            }

            // Validar si tenemos productos finales
            if (productosFinales.length > 0) {
                console.warn(`🚀 ${idSheet} - Actualizando estado con ${productosFinales.length} productos`);
                setProductosOperativos(productosFinales);

                // Calcular totales
                const totalNeto = productosFinales.reduce((sum, p) => sum + (p.neto || 0), 0);

                // Cargar pedidos solo si es necesario (evitar doble carga)
                const resultadoPedidos = await cargarPedidosVendedor(fechaSeleccionada, idSheet);
                const totalPedidosReal = typeof resultadoPedidos === 'object' ? resultadoPedidos.total : resultadoPedidos;
                const nequiReal = typeof resultadoPedidos === 'object' ? resultadoPedidos.nequi : 0;
                const daviplataReal = typeof resultadoPedidos === 'object' ? resultadoPedidos.daviplata : 0;

                const valoresForzados = {
                    totalDespacho: totalNeto,
                    totalPedidos: totalPedidosReal || 0,
                    nequi: nequiReal || 0,
                    daviplata: daviplataReal || 0,
                    // Estos valores fijos deberían venir de la BD idealmente, pero por ahora los mantenemos para no romper
                    totalDctos: 0,
                    venta: totalNeto + (totalPedidosReal || 0), // Aproximación
                    totalEfectivo: 0,
                };

                console.warn(`💰 ${idSheet} - Totales calculados:`, valoresForzados);
                setDatosResumen(prev => ({ ...prev, ...valoresForzados }));

            } else {
                console.warn(`⚠️ ${idSheet} - No se pudieron procesar productos (BD vacía y sin contexto), usando fallback`);
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

                // 🔧 Siempre mostrar TODOS los productos del contexto (tabla Producto)
                // Cargar datos de localStorage si existen, sino mostrar en 0
                const productosConDatos = products.map(product => {
                    // Buscar si existe en localStorage
                    const productoGuardado = datos.productos.find(p => p.producto === product.name);

                    if (productoGuardado) {
                        // 🆕 DEBUG: Log específico para productos con vencidas
                        if (productoGuardado.vencidas > 0) {
                            console.log(`🔍 ${idSheet} - ${product.name}: vencidas=${productoGuardado.vencidas}`);
                        }
                        return {
                            id: product.id,
                            producto: product.name,
                            cantidad: productoGuardado.cantidad || 0,
                            dctos: productoGuardado.dctos || 0,
                            adicional: productoGuardado.adicional || 0,
                            devoluciones: productoGuardado.devoluciones || 0,
                            vendidas: productoGuardado.vendidas || 0,
                            vencidas: productoGuardado.vencidas || 0,
                            lotesVencidos: productoGuardado.lotesVencidos || [],
                            total: productoGuardado.total || 0, // Se recalculará después
                            valor: preciosLista[product.id] !== undefined ? preciosLista[product.id] : (productoGuardado.valor || Math.round(product.price * 0.65)),
                            neto: productoGuardado.neto || 0,
                            vendedor: productoGuardado.vendedor || false,
                            despachador: productoGuardado.despachador || false
                        };
                    } else {
                        // No existe en localStorage, crear con valores en 0
                        return {
                            id: product.id,
                            producto: product.name,
                            cantidad: 0,
                            dctos: 0,
                            adicional: 0,
                            devoluciones: 0,
                            vendidas: 0,
                            vencidas: 0,
                            lotesVencidos: [],
                            total: 0,
                            valor: preciosLista[product.id] !== undefined ? preciosLista[product.id] : Math.round(product.price * 0.65),
                            neto: 0,
                            vendedor: false,
                            despachador: false
                        };
                    }
                });

                // 🧮 Recalcular totales para asegurar consistencia
                const productosConDatosRecalculados = recalcularTotales(productosConDatos);

                // 🆕 DEBUG: Mostrar productos recalculados con vencidas
                productosConDatosRecalculados.filter(p => p.vencidas > 0).forEach(p => {
                    console.log(`🧮 ${p.producto}: cant=${p.cantidad} + adic=${p.adicional} - venc=${p.vencidas} = TOTAL ${p.total}`);
                });

                console.log(`✅ ${idSheet} - Datos cargados correctamente desde localStorage`);
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
                valor: preciosLista[product.id] !== undefined ? preciosLista[product.id] : Math.round(product.price * 0.65),
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

    // ✅ ACTUALIZACIÓN: Siempre recalcular totales al cargar (para asegurar vencidas/devoluciones)
    useEffect(() => {
        // Si ya hay productos cargados desde el estado inicial, recalcular totales
        if (productosOperativos.length > 0 && Object.keys(preciosLista).length > 0) {
            console.log(`🔄 ${idSheet} - Productos ya cargados, recalculando totales...`);

            // 🆕 SIEMPRE recalcular totales para asegurar que vencidas/devoluciones se resten
            setProductosOperativos(prev => prev.map(p => {
                const cantidad = parseInt(p.cantidad) || 0;
                const dctos = parseInt(p.dctos) || 0;
                const adicional = parseInt(p.adicional) || 0;
                const devoluciones = parseInt(p.devoluciones) || 0;
                const vencidas = parseInt(p.vencidas) || 0;
                const nuevoPrecio = preciosLista[p.id] !== undefined ? preciosLista[p.id] : p.valor;

                const total = cantidad - dctos + adicional - devoluciones - vencidas;
                const neto = Math.round(total * nuevoPrecio);

                // Solo loguear si hay vencidas o devoluciones
                if (vencidas > 0 || devoluciones > 0) {
                    console.log(`🧮 ${p.producto}: ${cantidad} - ${dctos} + ${adicional} - ${devoluciones} - ${vencidas} = ${total}`);
                }

                return {
                    ...p,
                    valor: nuevoPrecio,
                    total: total,
                    neto: neto
                };
            }));
            return;
        }

        // Solo cargar si los precios ya están listos
        if (Object.keys(preciosLista).length === 0) {
            console.log(`⏳ ${idSheet} - Esperando precios antes de cargar datos...`);
            return;
        }

        console.log(`🔄 ${idSheet} - Cargando datos (dia: ${dia}, fecha: ${fechaFormateadaLS})`);

        // Resetear ref de contexto cuando cambia día/fecha
        contextoActualizadoRef.current = false;

        const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaFormateadaLS}`);

        // 🆕 CAMBIO: Cargar desde BD tanto en DESPACHO como en COMPLETADO
        if (estadoBoton === 'COMPLETADO' || estadoBoton === 'DESPACHO') {
            console.log(`🔍 ${idSheet} - Estado ${estadoBoton} detectado, cargando desde BD...`);
            cargarDatosDesdeDB();
        } else {
            console.log(`📂 ${idSheet} - Día no completado, cargando desde localStorage...`);
            cargarDatosGuardados();
        }
    }, [preciosLista]); // Solo depende de preciosLista, no de dia/idSheet/fecha (esos se manejan en el estado inicial)



    // 🚀 MEJORADO: Cargar datos al montar - SIEMPRE consulta servidor primero
    useEffect(() => {
        const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`);

        // 🆕 CAMBIO: Cargar desde BD tanto en DESPACHO como en COMPLETADO
        if (estadoBoton === 'COMPLETADO' || estadoBoton === 'DESPACHO') {
            console.log(`🔍 ${idSheet} - Componente montado con estado ${estadoBoton}, cargando desde BD...`);
            cargarDatosDesdeDB();
        } else {
            // 🚀 NUEVO: Siempre cargar datos al montar (para datos de app móvil)
            console.log(`🔍 ${idSheet} - Componente montado, cargando datos...`);
            cargarDatosGuardados();
        }
    }, []); // Solo al montar

    // 🚀 NUEVO: Cargar pedidos del vendedor cuando cambia la fecha
    useEffect(() => {
        const cargarYActualizarPedidos = async () => {
            const resultados = await cargarPedidosVendedor(fechaSeleccionada, idSheet);

            const total = typeof resultados === 'object' ? resultados.total : resultados;
            const nequi = typeof resultados === 'object' ? resultados.nequi : 0;
            const daviplata = typeof resultados === 'object' ? resultados.daviplata : 0;
            const pagosDetallados = typeof resultados === 'object' ? resultados.pagosDetallados : [];

            // Actualizar totalPedidos y pagos digitales
            setDatosResumen(prev => ({
                ...prev,
                totalPedidos: total,
                nequi: nequi,
                daviplata: daviplata,
                pagosDetallados: pagosDetallados // 🆕 Guardar detalle
            }));
        };

        if (fechaSeleccionada && idSheet) {
            cargarYActualizarPedidos();
        }

        // 🆕 Escuchar evento de nuevo pedido creado
        const handleNuevoPedido = () => {
            console.log(`📦 ${idSheet} - Nuevo pedido detectado, recargando total...`);
            cargarYActualizarPedidos();
        };

        window.addEventListener('pedidoCreado', handleNuevoPedido);
        window.addEventListener('pedidoActualizado', handleNuevoPedido);
        window.addEventListener('recargarPedidos', handleNuevoPedido); // 🆕 Para el botón de sincronizar

        return () => {
            window.removeEventListener('pedidoCreado', handleNuevoPedido);
            window.removeEventListener('pedidoActualizado', handleNuevoPedido);
            window.removeEventListener('recargarPedidos', handleNuevoPedido);
        };
    }, [fechaSeleccionada, idSheet]);

    // ✅ RECALCULAR RESUMEN: Cuando cambian los productos operativos (solo si NO está completado)
    useEffect(() => {
        const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`);

        // 🆕 CAMBIO: No recalcular automáticamente si está DESPACHO o COMPLETADO (usar valores de BD)
        if (estadoBoton === 'COMPLETADO' || estadoBoton === 'DESPACHO') {
            console.log(`⏭️ ${idSheet} - Estado ${estadoBoton}, no recalculando resumen automáticamente (usar valores de BD)`);
            return;
        }

        if (productosOperativos.length > 0) {
            const totalNeto = productosOperativos.reduce((sum, p) => sum + (p.neto || 0), 0);

            // 🚀 OPTIMIZACIÓN: Solo actualizar si el totalDespacho cambió
            setDatosResumen(prev => {
                // Si el totalDespacho no cambió, no hacer nada
                if (prev.totalDespacho === totalNeto) {
                    return prev;
                }

                console.log(`🧮 ${idSheet} - Total despacho cambió: ${prev.totalDespacho} -> ${totalNeto}`);
                console.log(`🧮 ${idSheet} - Productos con neto:`, productosOperativos.filter(p => p.neto > 0).map(p => `${p.producto}: ${p.neto}`));

                // 🔥 CRÍTICO: Preservar SIEMPRE totalPedidos, nequi y daviplata del estado anterior
                const nuevoEstado = {
                    ...prev,
                    totalDespacho: totalNeto,
                    totalPedidos: prev.totalPedidos, // 🚀 PRESERVAR
                    nequi: prev.nequi, // 🚀 PRESERVAR
                    daviplata: prev.daviplata, // 🚀 PRESERVAR
                    // Solo actualizar venta si no hay pedidos todavía
                    venta: prev.totalPedidos > 0 ? prev.venta : totalNeto,
                    totalEfectivo: prev.totalPedidos > 0 ? prev.totalEfectivo : totalNeto,
                };

                console.log(`💰 ${idSheet} - Valores preservados: totalPedidos=${nuevoEstado.totalPedidos}, nequi=${nuevoEstado.nequi}, daviplata=${nuevoEstado.daviplata}`);

                return nuevoEstado;
            });
        } else {
            console.log(`🧮 ${idSheet} - No hay productos operativos para calcular resumen`);
        }
    }, [productosOperativos, idSheet, dia, fechaSeleccionada]);

    // ✅ ACTUALIZACIÓN CON CONTEXTO: Solo cuando hay contexto válido y productos operativos
    useEffect(() => {
        const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaFormateadaLS}`);

        // No procesar contexto si el día está DESPACHO o COMPLETADO (usar datos de BD)
        // Si está DESPACHO o COMPLETADO, verificar si necesitamos fusionar con contexto
        if (estadoBoton === 'COMPLETADO' || estadoBoton === 'DESPACHO') {
            const faltanProductos = products && products.length > 0 && productosOperativos.length < products.length;

            if (faltanProductos) {
                console.log(`🔄 ${idSheet} - Detectada lista incompleta en modo ${estadoBoton}, re-fusionando con contexto...`);
                // Volver a cargar desde BD, ahora que tenemos contexto para fusionar
                cargarDatosDesdeDB();
            } else {
                console.log(`⏭️ ${idSheet} - Estado ${estadoBoton} y lista completa, omitiendo actualización`);
            }
            return;
        }

        // Evitar bucle infinito - solo actualizar una vez por cambio de contexto
        if (contextoActualizadoRef.current) {
            return;
        }

        const tieneContextoValido = products && products.length > 0 &&
            !(products.length === 1 && products[0].name === 'Servicio');

        if (tieneContextoValido && productosOperativos.length === 0) {
            console.log(`🔄 ${idSheet} - Contexto válido cargado, actualizando con mapeo...`);
            console.log(`📋 ${idSheet} - Productos en contexto:`, products.length);
            contextoActualizadoRef.current = true;
            cargarDatosGuardados();
        }
    }, [products]);

    // 🆕 POLLING INTELIGENTE: Auto-actualización cada 15 segundos (solo cuando la pestaña está visible)
    useEffect(() => {
        console.log(`🔄 ${idSheet} - Activando polling inteligente (cada 15 seg)`);

        // Variable para controlar si la pestaña está visible
        let isVisible = !document.hidden;

        const handleVisibilityChange = () => {
            isVisible = !document.hidden;
            if (isVisible) {
                // 🛡️ PROTECCIÓN: No recargar si hubo cambio manual reciente
                if (cambioManualRef.current) {
                    console.log(`🛡️ ${idSheet} - Cambio manual pendiente, omitiendo recarga por visibilidad`);
                    return;
                }
                console.log(`👁️ ${idSheet} - Pestaña visible, recargando datos...`);
                const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`);
                if (estadoBoton === 'COMPLETADO' || estadoBoton === 'DESPACHO') {
                    cargarDatosDesdeDB();
                } else {
                    cargarDatosGuardados();
                }
            } else {
                console.log(`🙈 ${idSheet} - Pestaña oculta, pausando polling`);
            }
        };

        // Intervalo de polling
        const pollingInterval = setInterval(() => {
            if (isVisible) {
                // 🛡️ PROTECCIÓN: No recargar si hubo cambio manual reciente
                if (cambioManualRef.current) {
                    console.log(`🛡️ ${idSheet} - Cambio manual pendiente, omitiendo polling`);
                    return;
                }

                console.log(`🔄 ${idSheet} - Polling automático (pestaña visible)`);
                const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`);

                // Si está completado, solo recargar si NO tenemos la lista completa
                if (estadoBoton === 'COMPLETADO' || estadoBoton === 'DESPACHO') {
                    // Verificar longitud actual vs contexto
                    const longitudTotalEsperada = products ? products.length : 0;
                    const longitudActual = productosOperativos.length;

                    if (longitudActual < longitudTotalEsperada && longitudTotalEsperada > 0) {
                        console.log(`🔄 ${idSheet} - Polling detectó lista incompleta (${longitudActual}/${longitudTotalEsperada}), recargando...`);
                        cargarDatosDesdeDB();
                    } else {
                        console.log(`✅ ${idSheet} - Polling omitido: Lista ya está completa y modo solo lectura`);
                    }
                } else {
                    // Si no está completado, cargar normal (localStorage)
                    cargarDatosGuardados();
                }
            }
        }, 15000); // 15 segundos

        // Listener para cambios de visibilidad
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(pollingInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            console.log(`🛑 ${idSheet} - Polling desactivado`);
        };
    }, [idSheet, dia, fechaSeleccionada]); // Recrear cuando cambien estos valores


    // Función deshabilitada - solo el botón DESPACHO afecta inventario
    const actualizarProducto = async (id, campo, valor) => {
        // 🚩 MARCAR QUE HUBO CAMBIO MANUAL DEL USUARIO
        cambioManualRef.current = true;
        console.log(`✏️ ${idSheet} - Cambio manual detectado en campo: ${campo}`);

        // 🆕 FIX: Actualizar localStorage INMEDIATAMENTE para checks (vendedor/despachador)
        // Esto evita que el polling sobrescriba los checks marcados
        // IMPORTANTE: Esto se ejecuta ANTES de cualquier otra lógica
        if (campo === 'vendedor' || campo === 'despachador') {
            try {
                const key = `cargue_${dia}_${idSheet}_${fechaFormateadaLS}`;
                const datosActuales = localStorage.getItem(key);

                console.log(`🔍 FIX CHECKS - Key: ${key}`);
                console.log(`🔍 FIX CHECKS - Campo: ${campo}, Valor: ${valor}`);
                console.log(`🔍 FIX CHECKS - Producto ID: ${id}`);

                if (datosActuales) {
                    const datos = JSON.parse(datosActuales);

                    if (datos.productos) {
                        const productoEncontrado = datos.productos.find(p => p.id === id);

                        if (productoEncontrado) {
                            console.log(`🔍 FIX CHECKS - Producto encontrado: ${productoEncontrado.producto}`);
                            console.log(`🔍 FIX CHECKS - Valor anterior: ${productoEncontrado[campo]}`);
                        }

                        datos.productos = datos.productos.map(p => {
                            if (p.id === id) {
                                return { ...p, [campo]: valor };
                            }
                            return p;
                        });

                        localStorage.setItem(key, JSON.stringify(datos));
                        console.log(`✅ LocalStorage actualizado: Producto ID ${id}.${campo} = ${valor}`);
                    } else {
                        console.warn(`⚠️ FIX CHECKS - No hay productos en localStorage`);
                    }
                } else {
                    console.warn(`⚠️ FIX CHECKS - No se encontró datos en localStorage con key: ${key}`);
                }
            } catch (error) {
                console.error(`❌ Error actualizando localStorage:`, error);
            }
        }

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

        // 🆕 SINCRONIZACIÓN EN TIEMPO REAL CON BD
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

        // Obtener nombre del producto
        const productoActual = productosOperativos.find(p => p.id === id);
        console.log(`🔍 DEBUG - Buscando producto ID=${id} en productosOperativos (${productosOperativos.length} productos)`);
        console.log(`🔍 DEBUG - Producto encontrado:`, productoActual ? productoActual.producto : 'NO ENCONTRADO');
        console.log(`🔍 DEBUG - Campo a sincronizar: ${campo}, Valor: ${valor}`);
        console.log(`🔍 DEBUG - Estado botón actual: ${estadoBoton}`);
        console.log(`🔍 DEBUG - Fecha para BD: ${fechaParaBD}`);

        if (productoActual) {
            console.log(`✅ DEBUG - Producto ${productoActual.producto} encontrado, iniciando sincronización...`);
            // Mapear nombres de campos del frontend al backend
            const campoBackend = campo === 'vendedor' ? 'v'
                : campo === 'despachador' ? 'd'
                    : campo === 'lotesVencidos' ? 'lotes_vencidos'  // 🆕 Mapear lotes vencidos
                        : campo;
            console.log(`🔄 Sincronizando: ${productoActual.producto} | ${campo} → ${campoBackend} = ${valor}`);

            // Obtener responsable actual
            const responsableActual = responsableStorage.get(idSheet) || 'Sistema';

            // 🆕 DEBOUNCE: Cancelar sincronización anterior si existe
            const timerKey = `${id}_${campo}`;
            if (debounceTimerRef.current[timerKey]) {
                clearTimeout(debounceTimerRef.current[timerKey]);
                console.log(`⏱️ Cancelando sincronización anterior de ${productoActual.producto}.${campo}`);
            }

            // 🆕 DEBOUNCE: Esperar antes de sincronizar
            // Para lotes vencidos usar debounce más corto
            const debounceTime = campo === 'lotesVencidos' ? 500 : 1500;

            debounceTimerRef.current[timerKey] = setTimeout(() => {
                // 🆕 Convertir lotesVencidos a JSON string para la BD
                let valorParaBD = valor;
                if (campo === 'lotesVencidos' || campoBackend === 'lotes_vencidos') {
                    // Convertir array a JSON string
                    valorParaBD = Array.isArray(valor) ? JSON.stringify(valor) : valor;
                    console.log(`📤 Enviando lotes_vencidos a BD: ${productoActual.producto} = ${valorParaBD}`);
                } else {
                    console.log(`📤 Enviando a BD después de debounce: ${productoActual.producto}.${campoBackend} = ${valor}`);
                }

                // Sincronizar con BD en tiempo real
                cargueRealtimeService.actualizarCampoProducto(
                    idSheet,
                    dia,
                    fechaParaBD,
                    productoActual.producto,
                    campoBackend === 'lotesVencidos' ? 'lotes_vencidos' : campoBackend,  // 🆕 Mapear nombre de campo
                    valorParaBD,
                    productoActual.valor || 0,
                    responsableActual
                ).then(result => {
                    if (result.success) {
                        console.log(`✅ BD sincronizada: ${productoActual.producto} | ${campoBackend} = ${valorParaBD} (${result.action})`);
                    } else {
                        console.error(`❌ Error sincronizando BD:`, result.error);
                        console.error(`❌ Error en sincronización:`, result.error);
                    }
                }).catch(err => {
                    console.error(`❌ Error en sincronización:`, err);
                });
            }, debounceTime);
        }
    }

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

            const response = await fetch(`${API_URL}/productos/${productoId}/actualizar_stock/`, {
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
    // 🚩 SOLO sincroniza al servidor si hubo CAMBIO MANUAL del usuario (evita registros fantasma)
    useEffect(() => {
        if (productosOperativos.length === 0 && products.length > 0) {
            console.log(`🤔 Omitiendo actualización/guardado para ${idSheet} porque productosOperativos está vacío.`);
            return;
        }

        if (productosOperativos.length > 0) {
            actualizarDatosVendedor(idSheet, productosOperativos);
            console.log(`✅ Datos actualizados para ${idSheet} en contexto.`);

            const fechaAUsar = fechaSeleccionada;

            // 🚩 SIEMPRE guardar en localStorage
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

            // 🚩 NUEVO: Solo sincronizar al servidor si hubo CAMBIO MANUAL
            if (!cambioManualRef.current) {
                console.log(`⏭️ ${idSheet} - Sin cambio manual, omitiendo sincronización al servidor`);
                return;
            }

            // Resetear bandera de cambio manual
            cambioManualRef.current = false;

            // 🚀 DESHABILITADO: Ya no usamos guardarDatos porque tenemos sincronización en tiempo real
            // con cargueRealtimeService.actualizarCampoProducto() que se llama en actualizarProducto()
            // Esto evita crear registros duplicados
            // if (cargueApiConfig.USAR_API) {
            //     console.log(`🚀 ${idSheet} - Cambio manual detectado, sincronizando al servidor...`);
            //     cargueHybridService.guardarDatos(dia, idSheet, fechaAUsar, productosOperativos, true);
            // }
            console.log(`📝 ${idSheet} - Cambio guardado en localStorage (sincronización en tiempo real activa)`);

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

    // 🔄 NUEVO: Escuchar evento de sincronización de checks V desde MenuSheets
    useEffect(() => {
        const handleChecksVActualizados = (e) => {
            const { dia: diaEvento, fecha: fechaEvento } = e.detail;

            // Solo procesar si es para este día y fecha
            if (diaEvento === dia && fechaEvento === fechaSeleccionada) {
                console.log(`🔄 ${idSheet} - Evento checksVActualizados recibido, recargando datos...`);

                // Recargar datos desde localStorage (que ya fue actualizado por MenuSheets)
                const key = `cargue_${dia}_${idSheet}_${fechaSeleccionada}`;
                const datosString = localStorage.getItem(key);

                if (datosString) {
                    try {
                        const datos = JSON.parse(datosString);
                        if (datos.productos && datos.productos.length > 0) {
                            // Actualizar productos con TODOS los datos nuevos Y RECALCULAR TOTALES
                            setProductosOperativos(prev => {
                                return prev.map(producto => {
                                    const productoActualizado = datos.productos.find(p => p.producto === producto.producto);
                                    if (productoActualizado) {
                                        // Tomar valores actualizados o mantener los existentes
                                        const cantidad = productoActualizado.cantidad ?? producto.cantidad ?? 0;
                                        const dctos = productoActualizado.dctos ?? producto.dctos ?? 0;
                                        const adicional = productoActualizado.adicional ?? producto.adicional ?? 0;
                                        const devoluciones = productoActualizado.devoluciones ?? producto.devoluciones ?? 0;
                                        const vencidas = productoActualizado.vencidas ?? producto.vencidas ?? 0;
                                        const valor = producto.valor || 0;

                                        // 🆕 RECALCULAR TOTAL y NETO
                                        const total = cantidad - dctos + adicional - devoluciones - vencidas;
                                        const neto = Math.round(total * valor);

                                        console.log(`🧮 ${producto.producto}: ${cantidad} - ${dctos} + ${adicional} - ${devoluciones} - ${vencidas} = ${total}`);

                                        return {
                                            ...producto,
                                            cantidad,
                                            dctos,
                                            adicional,
                                            devoluciones,
                                            vendidas: productoActualizado.vendidas ?? producto.vendidas ?? 0,
                                            vencidas,
                                            total,  // 🆕 TOTAL recalculado
                                            neto,   // 🆕 NETO recalculado
                                            vendedor: productoActualizado.vendedor || false,
                                            despachador: productoActualizado.despachador || false
                                        };
                                    }
                                    return producto;
                                });
                            });
                            console.log(`✅ ${idSheet} - Datos actualizados con TOTALES recalculados`);
                        }
                    } catch (error) {
                        console.error(`❌ ${idSheet} - Error procesando checksVActualizados:`, error);
                    }
                }
            }
        };

        window.addEventListener('checksVActualizados', handleChecksVActualizados);
        return () => window.removeEventListener('checksVActualizados', handleChecksVActualizados);
    }, [dia, idSheet, fechaSeleccionada]);

    // Función limpiarDatos deshabilitada para debug
    const limpiarDatos = () => {
        console.log('⚠️ limpiarDatos llamada - DESHABILITADA para debug');
        // Función deshabilitada temporalmente
    };

    return (
        <div className="container-fluid plantilla-operativa" style={{ minWidth: '1900px', paddingRight: '150px' }}>
            {/* 👤 CAMPO RESPONSABLE EDITABLE */}
            <div className="row mb-3">
                <div className="col-12">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
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

                            {/* 🆕 Botón para ver vendidas */}
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => setMostrarModalVendidas(true)}
                                title="Ver detalle de vendidas"
                                style={{ color: '#0d6efd', fontWeight: '500' }}
                            >
                                📊 Vendidas
                            </button>

                            {/* 🆕 Botón para ver pedidos */}
                            <BotonVerPedidos
                                dia={dia}
                                idSheet={idSheet}
                                fechaSeleccionada={fechaSeleccionada}
                            />


                        </div>
                        <div className="text-muted small">
                            {dia} - {fechaSeleccionada} - {idSheet}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div className="tabla-productos-container" style={{ flex: '1 1 auto' }}>
                            <TablaProductos
                                productos={productosOperativos}
                                onActualizarProducto={actualizarProducto}
                                dia={dia}
                                fechaSeleccionada={fechaSeleccionada}
                            />
                        </div>
                        <div style={{ flex: '0 0 450px' }}>
                            <ResumenVentas
                                datos={datosResumen}
                                productos={productosOperativos}
                                dia={dia}
                                idSheet={idSheet}
                                fechaSeleccionada={fechaSeleccionada}
                                estadoCompletado={localStorage.getItem(`estado_boton_${dia}_${fechaFormateadaLS}`) === 'COMPLETADO'}
                            />
                        </div>
                    </div>
                </div>
                <div className="col-12 mt-3">
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
                            estadoCompletado={
                                localStorage.getItem(`estado_boton_${dia}_${fechaFormateadaLS}`) === 'COMPLETADO' ||
                                localStorage.getItem(`estado_boton_${dia}_${idSheet}_${fechaFormateadaLS}`) === 'COMPLETADO' ||
                                localStorage.getItem(`estado_boton_${dia}`) === 'COMPLETADO'
                            }
                        />
                        {/* Registro de Lotes solo visible en ID1 (control por día) */}
                        {idSheet === 'ID1' && (
                            <RegistroLotes
                                dia={dia}
                                idSheet={idSheet}
                                fechaSeleccionada={fechaSeleccionada}
                                estadoCompletado={localStorage.getItem(`estado_boton_${dia}_${fechaFormateadaLS}`) === 'COMPLETADO'}
                            />
                        )}
                    </div>

                    <BotonCorreccionNuevo
                        dia={dia}
                        idSheet={idSheet}
                        fechaSeleccionada={fechaSeleccionada}
                        productos={productosOperativos}
                        estadoActual={localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`) || 'ALISTAMIENTO'}
                        onProductosActualizados={() => {

                            // Forzar recarga completa de datos
                            cargarDatosGuardados();

                            // Forzar re-render del componente
                            setTimeout(() => {
                                cargarDatosGuardados();
                            }, 100);
                        }}
                    />
                </div>
            </div>

            {/* 🆕 Modal de Vendidas */}
            {mostrarModalVendidas && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header" style={{
                                borderBottom: '3px solid #667eea'
                            }}>
                                <h5 className="modal-title fw-bold text-primary">📊 Detalle de Vendidas - {dia} {fechaSeleccionada}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setMostrarModalVendidas(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <table className="table table-sm table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Producto</th>
                                            <th className="text-center">Vendidas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productosOperativos
                                            .filter(p => (p.vendidas || 0) > 0)
                                            .map((p, idx) => (
                                                <tr key={idx}>
                                                    <td>{p.producto}</td>
                                                    <td className="text-center fw-bold text-success">{p.vendidas || 0}</td>
                                                </tr>
                                            ))}
                                        {productosOperativos.filter(p => (p.vendidas || 0) > 0).length === 0 && (
                                            <tr>
                                                <td colSpan="2" className="text-center text-muted">
                                                    No hay productos vendidos registrados
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot className="table-light">
                                        <tr>
                                            <th>TOTAL</th>
                                            <th className="text-center text-success">
                                                {productosOperativos.reduce((sum, p) => sum + (parseInt(p.vendidas) || 0), 0)}
                                            </th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setMostrarModalVendidas(false)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlantillaOperativa;