import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Table, Spinner, Alert, Badge, Tabs, Tab, Modal } from 'react-bootstrap';
import { cajaService } from '../services/cajaService';
import { ventaService, productoService } from '../services/api';
import { cajaValidaciones } from '../components/Pos/CajaValidaciones';

import { CajeroProvider, useCajero } from '../context/CajeroContext';
import '../styles/CajaScreen.css';

// Componente interno que usa el CajeroContext
const CajaScreenContent = () => {
    const navigate = useNavigate();
    const { cajeroLogueado, isAuthenticated, turnoActivo, sucursalActiva } = useCajero();
    const [cajero, setCajero] = useState('jose');
    const [banco, setBanco] = useState('Todos');
    const [fechaActual] = useState(new Date().toLocaleString('es-ES'));
    // Función para obtener fecha local en formato YYYY-MM-DD
    const getFechaLocal = () => {
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [fechaConsulta] = useState(getFechaLocal());
    const [fechaConsultaVentas, setFechaConsultaVentas] = useState(getFechaLocal());

    // Obtener saldo inicial del turno actual
    const { getSaldoInicialTurno } = useCajero();
    const saldoInicialTurno = getSaldoInicialTurno();

    console.log('💰 Saldo inicial del turno:', saldoInicialTurno);

    // Estados para los valores de caja
    const [valoresCaja, setValoresCaja] = useState({
        efectivo: 0,
        tarjetas: 0,
        transferencia: 0,
        consignacion: 0,
        qr: 0,
        rappipay: 0,
        bonos: 0
    });

    // Valores del sistema (cargados desde API)
    const [valoresSistema, setValoresSistema] = useState({
        efectivo: 0,
        tarjetas: 0,
        transferencia: 0,
        consignacion: 0,
        qr: 0,
        rappipay: 0,
        bonos: 0
    });

    // Estados adicionales
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resumenVentas, setResumenVentas] = useState(null);
    const [observaciones, setObservaciones] = useState('');
    const [validacion, setValidacion] = useState(null);
    const [recomendaciones, setRecomendaciones] = useState([]);
    const [ultimoArqueo, setUltimoArqueo] = useState(null);
    const [guardandoArqueo, setGuardandoArqueo] = useState(false);
    const [corteRealizado, setCorteRealizado] = useState(false);
    const [activeTab, setActiveTab] = useState('arqueo');

    // Actualizar cajero cuando se loguea
    useEffect(() => {
        if (isAuthenticated && cajeroLogueado) {
            console.log('🔄 Cajero logueado en Caja, actualizando:', cajeroLogueado.nombre);
            setCajero(cajeroLogueado.nombre);
        }
    }, [isAuthenticated, cajeroLogueado]);

    // Estados para ventas del día
    const [ventasDelDia, setVentasDelDia] = useState([]);
    const [loadingVentas, setLoadingVentas] = useState(false);
    const [showVentaModal, setShowVentaModal] = useState(false);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [showAnularModal, setShowAnularModal] = useState(false);
    const [confirmacionAnular, setConfirmacionAnular] = useState('');
    const [metricasVentas, setMetricasVentas] = useState({
        totalSinImpuestos: 0,
        totalImpuestos: 0,
        totalFacturado: 0,
        totalNeto: 0,
        totalPagado: 0
    });

    // Estados para modales adicionales
    const [showMovimientosBancarios, setShowMovimientosBancarios] = useState(false);
    const [movimientosBancarios, setMovimientosBancarios] = useState([]);

    // Estados para movimientos de caja
    const [movimientosCaja, setMovimientosCaja] = useState([]);
    const [showNuevoMovimiento, setShowNuevoMovimiento] = useState(false);
    const [tipoMovimiento, setTipoMovimiento] = useState('INGRESO');
    const [montoMovimiento, setMontoMovimiento] = useState('');
    const [conceptoMovimiento, setConceptoMovimiento] = useState('');
    const [fechaMovimientos, setFechaMovimientos] = useState(getFechaLocal());

    const [loadingMovimientos, setLoadingMovimientos] = useState(false);

    // Estados para historial de arqueos
    const [historialArqueos, setHistorialArqueos] = useState([]);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    const [fechaHistorialInicio, setFechaHistorialInicio] = useState(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [fechaHistorialFin, setFechaHistorialFin] = useState(getFechaLocal());
    const [estadisticasHistorial, setEstadisticasHistorial] = useState({
        totalArqueos: 0,
        sinDiferencias: 0,
        conDiferencias: 0,
        totalDiferencia: 0
    });
    const [showArqueoDetalleModal, setShowArqueoDetalleModal] = useState(false);
    const [arqueoDetalle, setArqueoDetalle] = useState(null);

    // Cargar datos de ventas del día
    const cargarDatosVentas = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('🔄 Cargando datos de caja para:', fechaConsulta);

            // CAMBIO: Usar directamente ventaService para consistencia con Tab "Ventas del Día"
            await cargarVentasDirectamente();

        } catch (error) {
            console.error('❌ Error cargando datos de caja:', error);
            setError('Error al cargar los datos de ventas del día');

            // Usar datos vacíos como fallback
            const datosVacios = {
                efectivo: 0,
                tarjetas: 0,
                transferencia: 0,
                consignacion: 0,
                qr: 0,
                rappipay: 0,
                bonos: 0
            };
            setValoresSistema(datosVacios);
            setResumenVentas({
                fecha: fechaConsulta,
                totalVentas: 0,
                resumenPorMetodo: datosVacios,
                totalGeneral: 0
            });
        } finally {
            setLoading(false);
        }
    };

    // Función de respaldo para cargar ventas directamente
    const cargarVentasDirectamente = async () => {
        try {
            console.log('🔄 Intentando cargar ventas directamente...');
            const ventasData = await ventaService.getAll();

            if (ventasData && Array.isArray(ventasData) && !ventasData.error) {
                // Obtener hora de inicio del turno actual
                let horaInicioTurno = null;
                const turnoGuardado = localStorage.getItem('turno_activo');
                if (turnoGuardado) {
                    try {
                        const turno = JSON.parse(turnoGuardado);
                        console.log('📦 Turno guardado:', turno);

                        // Intentar con fecha_inicio (API) o hora_inicio (fallback localStorage)
                        const fechaInicio = turno.fecha_inicio || turno.hora_inicio;

                        if (fechaInicio) {
                            horaInicioTurno = new Date(fechaInicio);
                            console.log('⏰ Turno iniciado en:', horaInicioTurno.toLocaleString('es-ES'));
                            console.log('⏰ Timestamp del turno:', horaInicioTurno.getTime());
                        } else {
                            console.warn('⚠️ Turno sin fecha_inicio ni hora_inicio');
                        }
                    } catch (error) {
                        console.error('❌ Error parseando turno:', error);
                    }
                } else {
                    console.warn('⚠️ No hay turno guardado en localStorage');
                }

                // Filtrar ventas del día actual, NO anuladas, y DESPUÉS del inicio del turno
                const ventasHoy = ventasData.filter(venta => {
                    // Usar solo la parte de fecha sin conversión UTC
                    const fechaVenta = venta.fecha.split('T')[0];
                    const esDelDia = fechaVenta === fechaConsulta;
                    const noEstaAnulada = venta.estado !== 'ANULADA';

                    // Si hay turno activo, filtrar por hora
                    let esDespuesDelTurno = true;
                    if (horaInicioTurno) {
                        const fechaVentaCompleta = new Date(venta.fecha);
                        esDespuesDelTurno = fechaVentaCompleta >= horaInicioTurno;

                        // Log detallado para debugging
                        if (esDelDia && noEstaAnulada) {
                            console.log(`🔍 Venta ${venta.id}:`, {
                                fecha: venta.fecha,
                                fechaVentaCompleta: fechaVentaCompleta.toLocaleString('es-ES'),
                                horaInicioTurno: horaInicioTurno.toLocaleString('es-ES'),
                                esDespuesDelTurno,
                                timestampVenta: fechaVentaCompleta.getTime(),
                                timestampTurno: horaInicioTurno.getTime()
                            });
                        }
                    }

                    return esDelDia && noEstaAnulada && esDespuesDelTurno;
                });

                console.log('📊 Ventas del turno actual (sin anuladas):', ventasHoy.length);
                if (horaInicioTurno) {
                    console.log('   Filtradas desde:', horaInicioTurno.toLocaleString('es-ES'));
                }

                // Contar ventas excluidas para información
                const todasVentasDelDia = ventasData.filter(venta => {
                    const fechaVenta = venta.fecha.split('T')[0];
                    return fechaVenta === fechaConsulta;
                });

                const ventasAnuladas = todasVentasDelDia.filter(v => v.estado === 'ANULADA');
                const ventasAntesDelTurno = horaInicioTurno ? todasVentasDelDia.filter(v => {
                    const fechaVentaCompleta = new Date(v.fecha);
                    return fechaVentaCompleta < horaInicioTurno && v.estado !== 'ANULADA';
                }) : [];

                if (ventasAnuladas.length > 0) {
                    console.log('🚫 Ventas anuladas excluidas:', ventasAnuladas.length);
                }
                if (ventasAntesDelTurno.length > 0) {
                    console.log('⏮️ Ventas de turnos anteriores excluidas:', ventasAntesDelTurno.length);
                }
                console.log('✅ Total ventas del día:', todasVentasDelDia.length);
                console.log('✅ Ventas incluidas en este arqueo:', ventasHoy.length);

                // Calcular resumen por método de pago manualmente
                const resumenPorMetodo = {
                    efectivo: 0,
                    tarjetas: 0,
                    transferencia: 0,
                    consignacion: 0,
                    qr: 0,
                    rappipay: 0,
                    bonos: 0
                };

                ventasHoy.forEach(venta => {
                    const metodo = (venta.metodo_pago || 'efectivo').toLowerCase();
                    const total = parseFloat(venta.total) || 0;

                    console.log(`💰 Venta válida: ${venta.id}, Estado: ${venta.estado}, Método: ${metodo}, Total: ${total}`);

                    switch (metodo) {
                        case 'efectivo':
                            resumenPorMetodo.efectivo += total;
                            break;
                        case 'tarjeta':
                        case 't_credito':
                        case 'tarjetas':
                            resumenPorMetodo.tarjetas += total;
                            break;
                        case 'transf':
                        case 'transferencia':
                            resumenPorMetodo.transferencia += total;
                            break;
                        case 'qr':
                            resumenPorMetodo.qr += total;
                            break;
                        case 'rappipay':
                            resumenPorMetodo.rappipay += total;
                            break;
                        case 'bonos':
                            resumenPorMetodo.bonos += total;
                            break;
                        default:
                            resumenPorMetodo.efectivo += total; // Por defecto a efectivo
                    }
                });

                // ✅ SUMAR EL SALDO INICIAL DEL TURNO AL EFECTIVO
                if (saldoInicialTurno > 0) {
                    console.log('💰 Sumando saldo inicial del turno al efectivo:', saldoInicialTurno);
                    resumenPorMetodo.efectivo += saldoInicialTurno;
                }

                const resumenCalculado = {
                    fecha: fechaConsulta,
                    totalVentas: ventasHoy.length,
                    resumenPorMetodo,
                    totalGeneral: Object.values(resumenPorMetodo).reduce((sum, val) => sum + val, 0),
                    saldoInicial: saldoInicialTurno  // Guardar para referencia
                };

                console.log('✅ Resumen calculado manualmente:', resumenCalculado);
                console.log('💰 EFECTIVO CALCULADO (con saldo inicial):', resumenPorMetodo.efectivo);
                console.log('   - Ventas en efectivo:', resumenPorMetodo.efectivo - saldoInicialTurno);
                console.log('   - Saldo inicial:', saldoInicialTurno);
                console.log('💳 TARJETAS CALCULADO:', resumenPorMetodo.tarjetas);
                console.log('🏦 TRANSFERENCIA CALCULADO:', resumenPorMetodo.transferencia);

                setResumenVentas(resumenCalculado);
                setValoresSistema(resumenPorMetodo);

                console.log('🎯 VALORES DEL SISTEMA ACTUALIZADOS EN ESTADO:', resumenPorMetodo);

            } else {
                console.warn('⚠️ No se pudieron cargar las ventas directamente');
                // Usar datos vacíos
                const datosVacios = {
                    efectivo: 0,
                    tarjetas: 0,
                    transferencia: 0,
                    consignacion: 0,
                    qr: 0,
                    rappipay: 0,
                    bonos: 0
                };
                setValoresSistema(datosVacios);
            }
        } catch (error) {
            console.error('❌ Error en cargarVentasDirectamente:', error);
        }
    };

    // Cargar último arqueo
    const cargarUltimoArqueo = async () => {
        try {
            console.log('🔍 Cargando último arqueo para cajero:', cajero);
            const ultimo = await cajaService.getUltimoArqueo(cajero);

            if (ultimo) {
                console.log('📋 Último arqueo encontrado:', ultimo);
                setUltimoArqueo(ultimo);

                // Si el último arqueo es de una fecha anterior, usar sus valores como base
                const fechaUltimoArqueo = ultimo.fecha; // Ya viene en formato YYYY-MM-DD
                const fechaHoy = getFechaLocal();

                if (fechaUltimoArqueo < fechaHoy) {
                    console.log('🆕 Nuevo día detectado, iniciando con valores en cero');

                    // Para un nuevo día, iniciar con saldo inicial del turno
                    setValoresCaja({
                        efectivo: saldoInicialTurno, // Saldo inicial del turno actual
                        tarjetas: 0,
                        transferencia: 0,
                        consignacion: 0,
                        qr: 0,
                        rappipay: 0,
                        bonos: 0
                    });

                    console.log('✅ Nuevo día iniciado con valores en cero');
                } else if (fechaUltimoArqueo === fechaHoy) {
                    console.log('📅 Ya existe arqueo para hoy');

                    // Verificar si es un nuevo turno
                    const ultimoLogin = localStorage.getItem('ultimo_login');
                    const ultimoLogout = localStorage.getItem('ultimo_logout');

                    let esNuevoTurno = false;
                    if (ultimoLogin && ultimoLogout) {
                        esNuevoTurno = new Date(ultimoLogin) > new Date(ultimoLogout);
                    } else if (ultimoLogin) {
                        const minutosDesdeLogin = (new Date() - new Date(ultimoLogin)) / 1000 / 60;
                        esNuevoTurno = minutosDesdeLogin < 2;
                    }

                    if (esNuevoTurno) {
                        console.log('🆕 Nuevo turno detectado, iniciando con valores en cero');
                        // Nuevo turno: empezar limpio
                        setValoresCaja({
                            efectivo: saldoInicialTurno,
                            tarjetas: 0,
                            transferencia: 0,
                            consignacion: 0,
                            qr: 0,
                            rappipay: 0,
                            bonos: 0
                        });
                    } else {
                        console.log('📅 Mismo turno, mostrando valores del arqueo actual');
                        // Mismo turno: mostrar valores del arqueo en progreso
                        if (ultimo.valores_caja) {
                            setValoresCaja({
                                efectivo: ultimo.valores_caja.efectivo || 0,
                                tarjetas: ultimo.valores_caja.tarjetas || 0,
                                transferencia: ultimo.valores_caja.transferencia || 0,
                                consignacion: ultimo.valores_caja.consignacion || 0,
                                qr: ultimo.valores_caja.qr || 0,
                                rappipay: ultimo.valores_caja.rappipay || 0,
                                bonos: ultimo.valores_caja.bonos || 0
                            });
                        }
                    }
                }
            } else {
                console.log('ℹ️ No se encontró arqueo anterior');
                setUltimoArqueo(null);
            }
        } catch (error) {
            console.error('❌ Error cargando último arqueo:', error);
            setUltimoArqueo(null);
        }
    };

    // Cargar ventas del día
    const cargarVentasDelDia = async (fechaConsultar = fechaConsultaVentas) => {
        setLoadingVentas(true);
        try {
            console.log('🔄 Cargando ventas del día para:', fechaConsultar);

            // Usar el mismo endpoint que InformeVentasGeneral pero filtrado por fecha
            const ventasData = await ventaService.getAll();

            if (ventasData && Array.isArray(ventasData) && !ventasData.error) {
                // Filtrar solo las ventas de la fecha seleccionada
                const ventasFecha = ventasData.filter(venta => {
                    // Usar solo la parte de fecha sin conversión UTC
                    const fechaVenta = venta.fecha.split('T')[0];
                    return fechaVenta === fechaConsultar;
                });

                setVentasDelDia(ventasFecha);
                calcularMetricasVentas(ventasFecha);
                console.log('📊 Ventas cargadas para', fechaConsultar, ':', ventasFecha.length);
            } else {
                console.error('Error al cargar ventas:', ventasData);
                setVentasDelDia([]);
                setMetricasVentas({
                    totalSinImpuestos: 0,
                    totalImpuestos: 0,
                    totalFacturado: 0,
                    totalNeto: 0,
                    totalPagado: 0
                });
            }
        } catch (error) {
            console.error('❌ Error cargando ventas del día:', error);
            setVentasDelDia([]);
            setMetricasVentas({
                totalSinImpuestos: 0,
                totalImpuestos: 0,
                totalFacturado: 0,
                totalNeto: 0,
                totalPagado: 0
            });
        } finally {
            setLoadingVentas(false);
        }
    };

    // Manejar cambio de fecha para consulta de ventas
    const handleCambioFechaVentas = (nuevaFecha) => {
        setFechaConsultaVentas(nuevaFecha);
        cargarVentasDelDia(nuevaFecha);
    };

    // Calcular métricas de ventas
    const calcularMetricasVentas = (ventasData) => {
        if (!ventasData || !Array.isArray(ventasData)) {
            console.warn('⚠️ ventasData no es un array válido:', ventasData);
            return;
        }

        // Filtrar solo ventas NO anuladas
        const ventasValidas = ventasData.filter(venta => venta.estado !== 'ANULADA');

        const totales = ventasValidas.reduce((acc, venta) => {
            acc.totalFacturado += parseFloat(venta.total || 0);
            acc.totalSinImpuestos += parseFloat(venta.subtotal || 0);
            acc.totalImpuestos += parseFloat(venta.impuestos || 0);
            acc.totalPagado += parseFloat(venta.dinero_entregado || 0);
            return acc;
        }, {
            totalSinImpuestos: 0,
            totalImpuestos: 0,
            totalFacturado: 0,
            totalPagado: 0
        });

        console.log('📊 Métricas calculadas (sin anuladas):', {
            totalVentas: ventasData.length,
            ventasValidas: ventasValidas.length,
            ventasAnuladas: ventasData.length - ventasValidas.length,
            totalFacturado: totales.totalFacturado
        });

        setMetricasVentas({
            ...totales,
            totalNeto: totales.totalFacturado
        });
    };

    // Mostrar detalle de venta
    const mostrarDetalleVenta = async (ventaId) => {
        try {
            console.log('🔍 Cargando detalle de venta:', ventaId);
            const ventaCompleta = await ventaService.getById(ventaId);
            if (ventaCompleta && !ventaCompleta.error) {
                setVentaSeleccionada(ventaCompleta);
                setShowVentaModal(true);
            }
        } catch (error) {
            console.error('Error al cargar detalle de venta:', error);
        }
    };

    // Función para abrir modal de anulación
    const abrirModalAnular = () => {
        setConfirmacionAnular('');
        setShowAnularModal(true);
    };

    // Anular venta
    const handleAnularVenta = async () => {
        if (confirmacionAnular.toUpperCase() !== 'SI') {
            alert('Debe escribir "SI" para confirmar la anulación');
            return;
        }

        const ventaId = ventaSeleccionada?.id;
        if (!ventaId) return;

        try {
            // 🔒 VALIDAR: No permitir anular si ya existe arqueo del día
            const fechaVenta = ventaSeleccionada.fecha.split('T')[0];
            console.log('🔍 Verificando arqueo para fecha:', fechaVenta);

            try {
                const arqueoExistente = await cajaService.getArqueosPorRango(fechaVenta, fechaVenta, cajero);

                if (arqueoExistente && arqueoExistente.length > 0) {
                    alert('❌ NO SE PUEDE ANULAR ESTA VENTA\n\n' +
                        '🔒 Ya existe un arqueo de caja guardado para este día.\n\n' +
                        '📋 Fecha del arqueo: ' + fechaVenta + '\n' +
                        '👤 Cajero: ' + cajero + '\n\n' +
                        '⚠️ Anular esta venta descuadraría el arqueo ya realizado.\n\n' +
                        '💡 Si necesita anular esta venta:\n' +
                        '   1. Contacte al supervisor/administrador\n' +
                        '   2. Elimine el arqueo del día desde el Historial\n' +
                        '   3. Anule la venta\n' +
                        '   4. Realice un nuevo arqueo con los valores correctos');

                    setShowAnularModal(false);
                    return;
                }
            } catch (error) {
                console.warn('⚠️ Error verificando arqueo:', error);
                // Si hay error verificando, permitir continuar (para no bloquear en caso de error de red)
            }

            console.log('🚫 Anulando venta:', ventaId);
            console.log('📦 Venta seleccionada:', ventaSeleccionada);

            // Si tenemos la venta seleccionada con detalles, devolver productos al inventario
            if (ventaSeleccionada && ventaSeleccionada.detalles && Array.isArray(ventaSeleccionada.detalles)) {
                console.log('📦 Devolviendo productos al inventario:', ventaSeleccionada.detalles.length, 'productos');

                // Devolver cada producto al inventario
                for (const detalle of ventaSeleccionada.detalles) {
                    // El campo puede ser 'producto_id' o 'producto'
                    const productoId = detalle.producto_id || detalle.producto;
                    const cantidad = parseInt(detalle.cantidad) || 0;

                    console.log('🔍 Procesando detalle:', detalle);
                    console.log('🔍 Producto ID encontrado:', productoId, 'Cantidad:', cantidad);

                    if (productoId && cantidad > 0) {
                        console.log(`🔄 Devolviendo ${cantidad} unidades del producto ${detalle.producto_nombre} (ID: ${productoId})`);

                        try {
                            // Usar el servicio updateStock para devolver las unidades
                            const resultadoStock = await productoService.updateStock(
                                productoId,
                                cantidad, // Cantidad positiva para sumar al inventario
                                'Sistema POS',
                                `Devolución por anulación de venta ${ventaId}`
                            );

                            console.log('📊 Resultado actualización stock:', resultadoStock);

                            if (resultadoStock && !resultadoStock.error) {
                                console.log(`✅ Devueltas ${cantidad} unidades de ${detalle.producto_nombre} al inventario`);
                            } else {
                                console.warn(`⚠️ Error devolviendo ${detalle.producto_nombre} al inventario:`, resultadoStock?.message);
                            }
                        } catch (stockError) {
                            console.error(`❌ Error actualizando stock de ${detalle.producto_nombre}:`, stockError);
                        }
                    } else {
                        console.warn('⚠️ Detalle sin producto ID válido o cantidad:', {
                            productoId,
                            cantidad,
                            detalle
                        });
                    }
                }
            } else {
                console.warn('⚠️ No se encontraron detalles de productos para devolver al inventario');
            }

            // Llamar al servicio para marcar la venta como anulada
            const resultado = await ventaService.anularVenta(ventaId);

            if (resultado && (resultado.success || !resultado.error)) {
                const mensaje = resultado.message || 'Venta anulada exitosamente';

                if (mensaje.includes('base de datos')) {
                    alert('✅ Venta anulada exitosamente.\n\n' +
                        '💾 Estado guardado en base de datos.\n' +
                        '📦 Los productos han sido devueltos al inventario.\n' +
                        '📊 Cambios visibles en todos los módulos.');
                } else {
                    alert('✅ Venta anulada exitosamente.\n\n' +
                        '📦 Los productos han sido devueltos al inventario.\n' +
                        '⚠️ Estado guardado localmente (se sincronizará cuando la API esté disponible).');
                }

                // Cerrar modales
                setShowAnularModal(false);
                setShowVentaModal(false);
                setConfirmacionAnular('');

                // Actualizar la venta seleccionada para cambio visual inmediato
                setVentaSeleccionada(prev => ({
                    ...prev,
                    estado: 'ANULADA'
                }));

                // Actualizar la venta en la lista de ventas del día
                setVentasDelDia(prev =>
                    prev.map(venta =>
                        venta.id === parseInt(ventaId)
                            ? { ...venta, estado: 'ANULADA' }
                            : venta
                    )
                );

                // Recargar datos del arqueo (para actualizar totales)
                cargarDatosVentas();
            } else {
                alert('❌ Error al anular la venta: ' + (resultado?.message || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error anulando venta:', error);
            alert('❌ Error al anular la venta: ' + error.message);
        }
    };

    // Agregar movimiento de caja
    const handleAgregarMovimiento = async () => {
        if (!montoMovimiento || !conceptoMovimiento) {
            alert('⚠️ Debe ingresar monto y concepto del movimiento');
            return;
        }

        const monto = parseFloat(montoMovimiento);
        if (isNaN(monto) || monto <= 0) {
            alert('⚠️ El monto debe ser un número válido mayor a 0');
            return;
        }

        try {
            const nuevoMovimiento = {
                tipo: tipoMovimiento,
                monto: monto, // Siempre positivo, el tipo determina si suma o resta
                concepto: conceptoMovimiento,
                fecha: getFechaLocal(),
                hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                cajero: cajero
            };

            // Guardar en la base de datos
            const movimientoGuardado = await cajaService.guardarMovimientoCaja(nuevoMovimiento);

            console.log('✅ Movimiento guardado en BD:', movimientoGuardado);

            // Agregar al estado local con el ID de la BD
            setMovimientosCaja(prev => [...prev, {
                ...movimientoGuardado, // Usar los datos del servidor
                id: movimientoGuardado.id
            }]);

            // Cambiar a la fecha actual para ver el movimiento recién agregado
            setFechaMovimientos(getFechaLocal());

            // Limpiar formulario
            setMontoMovimiento('');
            setConceptoMovimiento('');
            setShowNuevoMovimiento(false);

            alert(`✅ ${tipoMovimiento === 'EGRESO' ? 'SALIDA' : tipoMovimiento} de ${formatCurrency(monto)} registrado exitosamente`);
        } catch (error) {
            console.error('❌ Error al guardar movimiento:', error);
            alert('❌ Error al guardar el movimiento. Intente nuevamente.');
        }
    };

    // Cargar movimientos de caja desde BD
    const cargarMovimientosCaja = async () => {
        try {
            console.log('🔄 Cargando movimientos de caja para:', fechaConsulta, cajero);
            const movimientos = await cajaService.getMovimientosCaja(fechaConsulta, cajero);
            setMovimientosCaja(movimientos);
            console.log('✅ Movimientos de caja cargados:', movimientos.length);
        } catch (error) {
            console.error('❌ Error cargando movimientos de caja:', error);
            setMovimientosCaja([]);
        }
    };

    // Calcular total de movimientos de caja
    const totalMovimientosCaja = movimientosCaja.reduce((sum, mov) => {
        const monto = Math.abs(parseFloat(mov.monto) || 0); // Siempre positivo
        return sum + (mov.tipo === 'EGRESO' ? -monto : monto);
    }, 0);

    // Cargar movimientos bancarios
    const cargarMovimientosBancarios = async () => {
        setLoadingMovimientos(true);
        try {
            console.log('🏦 Cargando movimientos bancarios para:', fechaConsulta);
            const movimientos = await cajaService.getMovimientosBancarios(fechaConsulta, banco);
            setMovimientosBancarios(movimientos.movimientos || []);
            console.log('📊 Movimientos bancarios cargados:', movimientos.movimientos?.length || 0);
        } catch (error) {
            console.error('❌ Error cargando movimientos bancarios:', error);
            setMovimientosBancarios([]);
        } finally {
            setLoadingMovimientos(false);
        }
    };

    // Mostrar movimientos de caja
    const handleMovimientosCaja = () => {
        setShowMovimientosBancarios(true);
    };

    // Cargar historial de arqueos
    const cargarHistorialArqueos = async (fechaInicio = fechaHistorialInicio, fechaFin = fechaHistorialFin) => {
        setLoadingHistorial(true);
        try {
            console.log('🔄 Cargando historial de arqueos:', { fechaInicio, fechaFin, cajero });
            const arqueos = await cajaService.getArqueosPorRango(fechaInicio, fechaFin, cajero);

            setHistorialArqueos(arqueos);

            // Calcular estadísticas
            const stats = {
                totalArqueos: arqueos.length,
                sinDiferencias: arqueos.filter(a => Math.abs(parseFloat(a.total_diferencia)) < 0.01).length,
                conDiferencias: arqueos.filter(a => Math.abs(parseFloat(a.total_diferencia)) >= 0.01).length,
                totalDiferencia: arqueos.reduce((sum, a) => sum + parseFloat(a.total_diferencia || 0), 0)
            };
            setEstadisticasHistorial(stats);

            console.log('✅ Historial cargado:', arqueos.length, 'arqueos');
        } catch (error) {
            console.error('❌ Error cargando historial:', error);
            setHistorialArqueos([]);
        } finally {
            setLoadingHistorial(false);
        }
    };

    // Ver detalle de un arqueo
    const verDetalleArqueo = (arqueo) => {
        setArqueoDetalle(arqueo);
        setShowArqueoDetalleModal(true);
    };

    // Imprimir arqueo
    const imprimirArqueo = (arqueo) => {
        const printContent = `
            <html>
                <head>
                    <title>Arqueo de Caja - ${arqueo.fecha}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f8f9fa; }
                        .total-row { background-color: #e9ecef; font-weight: bold; }
                        .text-right { text-align: right; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>ARQUEO DE CAJA</h2>
                        <p>Fecha: ${new Date(arqueo.fecha).toLocaleDateString('es-ES')}</p>
                        <p>Cajero: ${arqueo.cajero}</p>
                        <p>Banco: ${arqueo.banco}</p>
                    </div>
                    
                    <h3>Valores del Sistema</h3>
                    <table>
                        <tr><th>Método</th><th class="text-right">Valor</th></tr>
                        ${Object.entries(arqueo.valores_sistema || {}).map(([metodo, valor]) => `
                            <tr><td>${metodo.toUpperCase()}</td><td class="text-right">${formatCurrency(valor)}</td></tr>
                        `).join('')}
                        <tr class="total-row"><td>TOTAL SISTEMA</td><td class="text-right">${formatCurrency(arqueo.total_sistema)}</td></tr>
                    </table>
                    
                    <h3>Valores en Caja</h3>
                    <table>
                        <tr><th>Método</th><th class="text-right">Valor</th></tr>
                        ${Object.entries(arqueo.valores_caja || {}).map(([metodo, valor]) => `
                            <tr><td>${metodo.toUpperCase()}</td><td class="text-right">${formatCurrency(valor)}</td></tr>
                        `).join('')}
                        <tr class="total-row"><td>TOTAL CAJA</td><td class="text-right">${formatCurrency(arqueo.total_caja)}</td></tr>
                    </table>
                    
                    <h3>Diferencias</h3>
                    <table>
                        <tr><th>Método</th><th class="text-right">Diferencia</th></tr>
                        ${Object.entries(arqueo.diferencias || {}).map(([metodo, valor]) => `
                            <tr><td>${metodo.toUpperCase()}</td><td class="text-right">${formatCurrency(valor)}</td></tr>
                        `).join('')}
                        <tr class="total-row"><td>TOTAL DIFERENCIA</td><td class="text-right">${formatCurrency(arqueo.total_diferencia)}</td></tr>
                    </table>
                    
                    ${arqueo.observaciones ? `<p><strong>Observaciones:</strong> ${arqueo.observaciones}</p>` : ''}
                    
                    <p style="margin-top: 30px; text-align: center; font-size: 10px;">
                        Generado: ${new Date().toLocaleString('es-ES')}
                    </p>
                </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    // Cargar historial cuando cambia el tab
    useEffect(() => {
        if (activeTab === 'historial') {
            cargarHistorialArqueos();
        }
    }, [activeTab]);

    // Generar comprobante diario de ventas
    const handleComprobanteDiario = () => {
        // Filtrar solo ventas válidas (no anuladas) para el comprobante
        const ventasValidas = ventasDelDia.filter(venta => venta.estado !== 'ANULADA');

        // Recalcular métricas solo con ventas válidas
        const metricasValidas = ventasValidas.reduce((acc, venta) => {
            acc.totalFacturado += parseFloat(venta.total || 0);
            acc.totalPagado += parseFloat(venta.dinero_entregado || 0);
            return acc;
        }, {
            totalFacturado: 0,
            totalPagado: 0
        });

        console.log('📊 Generando comprobante:');
        console.log('  - Fecha arqueo (fechaConsulta):', fechaConsulta);
        console.log('  - Fecha ventas (fechaConsultaVentas):', fechaConsultaVentas);
        console.log('  - Total ventas del día:', ventasDelDia.length);
        console.log('  - Ventas válidas (no anuladas):', ventasValidas.length);
        console.log('  - Ventas anuladas excluidas:', ventasDelDia.length - ventasValidas.length);
        console.log('  - Total facturado (válidas):', metricasValidas.totalFacturado);

        const printContent = `
            <html>
                <head>
                    <title>Comprobante Diario de Ventas</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 20px; 
                            font-size: 12px;
                        }
                        .header { 
                            text-align: center; 
                            margin-bottom: 30px; 
                            border-bottom: 2px solid #333; 
                            padding-bottom: 15px; 
                        }
                        .company-name { 
                            font-size: 18px; 
                            font-weight: bold; 
                            margin-bottom: 5px; 
                        }
                        .section { 
                            margin-bottom: 25px; 
                        }
                        .section h3 { 
                            color: #333; 
                            border-bottom: 1px solid #ccc; 
                            padding-bottom: 5px; 
                            font-size: 14px;
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-bottom: 15px; 
                        }
                        th, td { 
                            border: 1px solid #ddd; 
                            padding: 6px; 
                            text-align: left; 
                            font-size: 11px;
                        }
                        th { 
                            background-color: #f8f9fa; 
                            font-weight: bold; 
                        }
                        .total-row { 
                            background-color: #e9ecef; 
                            font-weight: bold; 
                        }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        .summary-box {
                            background-color: #f8f9fa;
                            padding: 15px;
                            border: 1px solid #ddd;
                            margin: 15px 0;
                        }
                        .summary-item {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 8px;
                        }
                        .summary-item:last-child {
                            border-top: 1px solid #333;
                            padding-top: 8px;
                            font-weight: bold;
                            font-size: 13px;
                        }
                        .ingreso { color: #198754; }
                        .egreso { color: #dc3545; }
                        .nota-box {
                            background-color: #fff3cd;
                            padding: 10px;
                            border-left: 4px solid #ffc107;
                            margin-top: 10px;
                            font-size: 11px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="company-name">COMPROBANTE DIARIO DE VENTAS</div>
                        <div>Cajero: ${cajero}</div>
                        <div>Banco: ${banco}</div>
                        <div>Generado: ${new Date().toLocaleString('es-ES')}</div>
                    </div>

                    <div class="section">
                        <h3>📊 RESUMEN GENERAL</h3>
                        <div class="summary-box">
                            <div class="summary-item">
                                <span>Total de Ventas:</span>
                                <span>${ventasValidas?.length || 0}</span>
                            </div>
                            <div class="summary-item">
                                <span>Total Facturado:</span>
                                <span>${formatCurrency(metricasValidas.totalFacturado)}</span>
                            </div>
                            <div class="summary-item">
                                <span>Total Pagado:</span>
                                <span>${formatCurrency(metricasValidas.totalPagado)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <h3>💳 RESUMEN POR MÉTODO DE PAGO</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Método de Pago</th>
                                    <th class="text-center">Cantidad</th>
                                    <th class="text-right">Monto Total</th>
                                    <th class="text-center">% del Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.entries(
            ventasValidas.reduce((acc, venta) => {
                const metodo = venta.metodo_pago || 'efectivo';
                if (!acc[metodo]) acc[metodo] = { cantidad: 0, total: 0 };
                acc[metodo].cantidad += 1;
                acc[metodo].total += parseFloat(venta.total || 0);
                return acc;
            }, {})
        ).map(([metodo, datos]) => {
            const porcentaje = metricasValidas.totalFacturado > 0 ?
                (datos.total / metricasValidas.totalFacturado * 100).toFixed(1) : '0.0';
            return `
                                        <tr>
                                            <td style="text-transform: capitalize;">${metodo}</td>
                                            <td class="text-center">${datos.cantidad}</td>
                                            <td class="text-right">${formatCurrency(datos.total)}</td>
                                            <td class="text-center">${porcentaje}%</td>
                                        </tr>
                                    `;
        }).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td>TOTAL</td>
                                    <td class="text-center">${ventasValidas?.length || 0}</td>
                                    <td class="text-right">${formatCurrency(metricasValidas.totalFacturado)}</td>
                                    <td class="text-center">100%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    ${movimientosCaja.length > 0 ? `
                        <div class="section">
                            <h3>💰 MOVIMIENTOS DE CAJA</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Hora</th>
                                        <th>Tipo</th>
                                        <th>Concepto</th>
                                        <th class="text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${movimientosCaja.map(mov => {
            const monto = Math.abs(parseFloat(mov.monto) || 0);
            const esEgreso = mov.tipo === 'EGRESO';
            return `
                                            <tr>
                                                <td>${mov.hora}</td>
                                                <td style="color: ${esEgreso ? '#dc3545' : '#198754'}; font-weight: bold;">
                                                    ${mov.tipo === 'EGRESO' ? 'SALIDA' : mov.tipo}
                                                </td>
                                                <td>${mov.concepto}</td>
                                                <td class="text-right" style="color: ${esEgreso ? '#dc3545' : '#198754'};">
                                                    ${esEgreso ? '- ' : '+ '}${formatCurrency(monto)}
                                                </td>
                                            </tr>
                                        `;
        }).join('')}
                                </tbody>
                                <tfoot>
                                    <tr class="total-row">
                                        <td colspan="3">SALDO NETO DE MOVIMIENTOS</td>
                                        <td class="text-right" style="color: ${totalMovimientosCaja < 0 ? '#dc3545' : '#198754'};">
                                            ${formatCurrency(totalMovimientosCaja)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                            <div style="background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin-top: 10px;">
                                <small style="color: #856404;">
                                    <strong>Nota:</strong> Este saldo se ${totalMovimientosCaja >= 0 ? 'suma' : 'resta'} del efectivo esperado en el arqueo de caja.
                                </small>
                            </div>
                        </div>
                    ` : ''}

                    <div class="section">
                        <h3>📋 DETALLE DE VENTAS</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th># Factura</th>
                                    <th>Cliente</th>
                                    <th>Vendedor</th>
                                    <th>Método</th>
                                    <th class="text-right">Total</th>
                                    <th>Hora</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ventasValidas.map((venta, index) => `
                                    <tr>
                                        <td>${venta.numero_factura || `PV${String(index + 1).padStart(3, '0')}`}</td>
                                        <td>${venta.cliente || 'CONSUMIDOR FINAL'}</td>
                                        <td>${venta.vendedor || 'Sistema'}</td>
                                        <td style="text-transform: capitalize;">${venta.metodo_pago}</td>
                                        <td class="text-right">${formatCurrency(parseFloat(venta.total || 0))}</td>
                                        <td>${new Date(venta.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="section">
                        <h3>🧮 ARQUEO DE CAJA</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Medio de Pago</th>
                                    <th class="text-right">Sistema</th>
                                    <th class="text-right">Caja</th>
                                    <th class="text-right">Diferencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${mediosPago.filter(m => !m.soloSistema).map(medio => `
                                    <tr>
                                        <td>${medio.label}</td>
                                        <td class="text-right">${formatCurrency(valoresSistema[medio.key])}</td>
                                        <td class="text-right">${formatCurrency(valoresCaja[medio.key])}</td>
                                        <td class="text-right">${formatCurrency(calcularDiferencia(medio.key))}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td>TOTALES</td>
                                    <td class="text-right">${formatCurrency(totalSistema)}</td>
                                    <td class="text-right">${formatCurrency(totalCaja)}</td>
                                    <td class="text-right">${formatCurrency(totalDiferencia)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    ${observaciones ? `
                        <div class="section">
                            <h3>📝 OBSERVACIONES</h3>
                            <div class="summary-box">
                                ${observaciones}
                            </div>
                        </div>
                    ` : ''}

                    <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666;">
                        <p>Documento generado automáticamente por el Sistema POS</p>
                        <p>Fecha de generación: ${new Date().toLocaleString('es-ES')}</p>
                    </div>
                </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    // Calcular diferencias
    const calcularDiferencia = (metodo) => {
        // Para efectivo, incluir movimientos de caja
        if (metodo === 'efectivo') {
            const efectivoSistema = valoresSistema[metodo] + totalMovimientosCaja;
            return valoresCaja[metodo] - efectivoSistema;
        }
        return valoresCaja[metodo] - valoresSistema[metodo];
    };

    // Calcular totales
    const totalSistema = Object.values(valoresSistema).reduce((sum, val) => sum + val, 0) + totalMovimientosCaja;
    const totalCaja = Object.values(valoresCaja).reduce((sum, val) => sum + val, 0);
    const totalDiferencia = totalCaja - totalSistema;

    // Formatear moneda
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Manejar cambios en inputs con validación
    const handleInputChange = (metodo, valor) => {
        console.log('🔵 Input ORIGINAL:', metodo, 'Valor RAW:', valor, 'Tipo:', typeof valor);

        const validacionNumero = cajaValidaciones.validarFormatoNumero(valor);

        console.log('💰 Input validado:', metodo, 'Valor ingresado:', valor, 'Valor validado:', validacionNumero.valor, 'Tipo validado:', typeof validacionNumero.valor);

        if (validacionNumero.esValido) {
            setValoresCaja(prev => {
                const nuevosValores = {
                    ...prev,
                    [metodo]: validacionNumero.valor
                };

                console.log('✅ Nuevos valores de caja COMPLETOS:', nuevosValores);
                console.log('✅ Valor específico de', metodo, ':', nuevosValores[metodo]);

                // Validar y generar recomendaciones en tiempo real
                setTimeout(() => {
                    const validacionGeneral = cajaValidaciones.validarValoresCaja(nuevosValores, valoresSistema);
                    setValidacion(validacionGeneral);

                    const diferencias = Object.keys(valoresSistema).reduce((acc, key) => {
                        acc[key] = nuevosValores[key] - valoresSistema[key];
                        return acc;
                    }, {});

                    const nuevasRecomendaciones = cajaValidaciones.generarRecomendaciones(
                        nuevosValores,
                        valoresSistema,
                        diferencias
                    );
                    setRecomendaciones(nuevasRecomendaciones);
                }, 100);

                return nuevosValores;
            });
        }
    };

    // Guardar arqueo con validaciones completas
    const handleGuardarArqueo = async () => {
        try {
            setGuardandoArqueo(true);

            console.log('💾 GUARDANDO ARQUEO - Valores actuales:');
            console.log('📊 valoresSistema:', valoresSistema);
            console.log('💰 valoresCaja:', valoresCaja);

            // 🔥 RECALCULAR TOTALES JUSTO ANTES DE GUARDAR
            const totalSistemaActual = Object.values(valoresSistema).reduce((sum, val) => sum + val, 0) + totalMovimientosCaja;
            const totalCajaActual = Object.values(valoresCaja).reduce((sum, val) => sum + val, 0);
            const totalDiferenciaActual = totalCajaActual - totalSistemaActual;

            console.log('🔢 totalSistema RECALCULADO:', totalSistemaActual);
            console.log('💵 totalCaja RECALCULADO:', totalCajaActual);
            console.log('📉 totalDiferencia RECALCULADO:', totalDiferenciaActual);

            // ✅ Validar IDs antes de enviar (no enviar timestamps de localStorage)
            const turnoIdValido = turnoActivo?.id && turnoActivo.id < 1000000 ? turnoActivo.id : null;
            const cajeroIdValido = cajeroLogueado?.id && cajeroLogueado.id < 1000000 ? cajeroLogueado.id : null;
            const sucursalIdValida = sucursalActiva?.id && sucursalActiva.id < 1000000 ? sucursalActiva.id : null;

            const datosArqueo = {
                fecha: fechaConsulta,
                cajero,
                banco,
                valoresSistema,
                valoresCaja,
                diferencias: Object.keys(valoresSistema).reduce((acc, key) => {
                    acc[key] = calcularDiferencia(key);
                    return acc;
                }, {}),
                totalSistema: totalSistemaActual,
                totalCaja: totalCajaActual,
                totalDiferencia: totalDiferenciaActual,
                observaciones,
                // ✅ Solo enviar IDs válidos (no timestamps de localStorage)
                turno_id: turnoIdValido,
                cajero_id: cajeroIdValido,
                sucursal_id: sucursalIdValida
            };

            console.log('🔍 IDs validados:', {
                turno: turnoIdValido,
                cajero: cajeroIdValido,
                sucursal: sucursalIdValida
            });

            console.log('📦 Datos del arqueo a guardar:', datosArqueo);

            // NOTA: Permitir múltiples arqueos por día (uno por turno)
            // No validar si existe arqueo previo - cada turno crea su propio arqueo
            console.log('💾 Guardando nuevo arqueo para el turno actual');

            // Validar antes de guardar
            const validacionGuardado = cajaValidaciones.validarAntesDeGuardar(datosArqueo);

            if (!validacionGuardado.esValido) {
                setValidacion(validacionGuardado);
                return;
            }

            // Validar horario
            const validacionHorario = cajaValidaciones.validarHorarioArqueo();
            if (validacionHorario.advertencia) {
                const confirmar = window.confirm(
                    `${validacionHorario.advertencia}\n\n¿Desea continuar con el arqueo?`
                );
                if (!confirmar) return;
            }

            await cajaService.guardarArqueoCaja(datosArqueo);

            // Mostrar mensaje de éxito con detalles
            const mensaje = `✅ Arqueo de caja guardado exitosamente

📊 Resumen:
• Total Sistema: ${formatCurrency(totalSistemaActual)}
• Total Caja: ${formatCurrency(totalCajaActual)}
• Diferencia: ${formatCurrency(totalDiferenciaActual)}
• Cajero: ${cajero}
• Fecha: ${fechaConsulta}`;

            // Mostrar mensaje de éxito más elegante
            setError(null);
            setValidacion({
                esValido: true,
                mensaje: `✅ Arqueo guardado exitosamente - Diferencia: ${formatCurrency(totalDiferenciaActual)}`,
                tipo: 'success'
            });

            // NO recargar el último arqueo para no sobrescribir los valores ingresados
            // await cargarUltimoArqueo();

            // Marcar que se realizó el corte de caja
            // NOTA: Este estado se limpiará automáticamente al hacer logout
            const corteKey = `corteRealizado_${cajero}_${fechaConsulta}`;
            setCorteRealizado(true);
            localStorage.setItem(corteKey, 'true');
            console.log('✅ Corte de caja guardado:', corteKey);

            // Limpiar después de 5 segundos
            setTimeout(() => {
                setValidacion(null);
                setRecomendaciones([]);
            }, 5000);

        } catch (error) {
            console.error('❌ Error guardando arqueo:', error);
            setError('Error al guardar el arqueo de caja: ' + error.message);
            setValidacion({
                esValido: false,
                mensaje: '❌ Error al guardar el arqueo: ' + error.message,
                tipo: 'error'
            });
        } finally {
            setGuardandoArqueo(false);
        }
    };

    // Refrescar datos
    const handleRefrescarDatos = () => {
        cargarDatosVentas();
        cargarUltimoArqueo();
        cargarVentasDelDia();
        cargarMovimientosCaja();
    };

    // Imprimir reporte
    const handleImprimir = () => {
        window.print();
    };

    // Cargar datos al montar el componente
    useEffect(() => {
        cargarDatosVentas();
        cargarUltimoArqueo();
        cargarVentasDelDia();
        cargarMovimientosCaja();

        // Verificar si ya se hizo el corte hoy
        const corteKey = `corteRealizado_${cajero}_${fechaConsulta}`;
        const yaSeHizoCorte = localStorage.getItem(corteKey) === 'true';

        // Verificar si es un nuevo login comparando timestamps
        const ultimoLogin = localStorage.getItem('ultimo_login');
        const ultimoLogout = localStorage.getItem('ultimo_logout');

        let esNuevoLogin = false;
        if (ultimoLogin && ultimoLogout) {
            // Si el login es más reciente que el logout, es un nuevo login
            esNuevoLogin = new Date(ultimoLogin) > new Date(ultimoLogout);
        } else if (ultimoLogin && !ultimoLogout) {
            // Si hay login pero no logout, verificar si es reciente (menos de 2 minutos)
            const minutosDesdeLogin = (new Date() - new Date(ultimoLogin)) / 1000 / 60;
            esNuevoLogin = minutosDesdeLogin < 2;
        }

        if (esNuevoLogin) {
            console.log('🆕 Nuevo login detectado, ignorando corte anterior');
            setCorteRealizado(false);

            // Limpiar valores de caja para empezar limpio
            setValoresCaja({
                efectivo: saldoInicialTurno,
                tarjetas: 0,
                transferencia: 0,
                consignacion: 0,
                qr: 0,
                rappipay: 0,
                bonos: 0
            });
        } else {
            // No es nuevo login, verificar corte normalmente
            setCorteRealizado(yaSeHizoCorte);
            console.log('📊 Verificando corte:', { corteKey, yaSeHizoCorte, esNuevoLogin });
        }
    }, [fechaConsulta, cajero, isAuthenticated, cajeroLogueado?.id]);

    const mediosPago = [
        { key: 'efectivo', label: 'Efectivo Disponible:', destacado: true },
        { key: 'tarjetas', label: 'Tarjetas (Débito y Crédito):' },
        { key: 'transferencia', label: 'Transferencia Disponible:' },
        { key: 'consignacion', label: 'Consignación Disponible:' },
        { key: 'qr', label: 'Qr Disponible:' },
        { key: 'rappipay', label: 'RAPPipay:' },
        { key: 'bonos', label: 'Bonos Disponible:', soloSistema: true }
    ];

    return (
        <div className="caja-screen">
            <style>
                {`
                    .table-row-hover:hover {
                        background-color: #f8f9fa !important;
                        transition: background-color 0.2s ease;
                        cursor: pointer;
                    }
                    .table-row-hover:hover td {
                        background-color: #f8f9fa !important;
                    }
                `}
            </style>
            {/* Header limpio y profesional */}
            <div className="caja-header">
                <Container fluid>
                    <Row className="align-items-center py-2">
                        <Col>
                            <div className="d-flex align-items-center">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => navigate('/pos')}
                                    className="me-3"
                                >
                                    <i className="bi bi-arrow-left me-1"></i>
                                    Volver al POS
                                </Button>
                                <div>
                                    <h2 className="mb-1">
                                        Arqueo de Caja
                                    </h2>
                                    <small className="text-muted">
                                        Fecha: {new Date().toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </small>
                                </div>
                            </div>
                        </Col>
                        <Col xs="auto">
                            <div className="d-flex gap-2">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={handleRefrescarDatos}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Spinner animation="border" size="sm" className="me-1" />
                                    ) : (
                                        <i className="bi bi-arrow-clockwise me-1"></i>
                                    )}
                                    Refrescar
                                </Button>
                                <Button variant="primary" size="sm" onClick={handleImprimir}>
                                    <i className="bi bi-printer me-1"></i>
                                    Imprimir
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Contenido principal */}
            <Container className="caja-content">
                {/* Alertas */}
                {error && (
                    <Alert variant="danger" className="mb-4">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </Alert>
                )}

                {ultimoArqueo && (
                    <Alert className="mb-4" style={{ backgroundColor: 'transparent', border: 'none', padding: '0.5rem 0', fontSize: '1.1rem' }}>
                        <i className="bi bi-info-circle me-2"></i>
                        <strong>Último arqueo:</strong> {ultimoArqueo.fecha} -
                        Diferencia: {formatCurrency(ultimoArqueo.total_diferencia || 0)}
                    </Alert>
                )}

                {/* Controles superiores */}
                <Card className="mb-4">
                    <Card.Body>
                        {/* Fila única con selectores y botones bien distribuidos */}
                        <Row className="align-items-end">
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label className="text-muted form-label-compact">Cajero:</Form.Label>
                                    <Form.Control
                                        value={cajero}
                                        size="sm"
                                        className="form-control-compact"
                                        disabled
                                        readOnly
                                        style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label className="text-muted form-label-compact">Bancos:</Form.Label>
                                    <Form.Select
                                        value={banco}
                                        onChange={(e) => setBanco(e.target.value)}
                                        size="sm"
                                        className="form-control-compact"
                                    >
                                        <option value="Todos">Todos</option>
                                        <option value="Caja General">Caja General</option>
                                        <option value="Bancolombia">Bancolombia</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={8}>
                                <div className="d-flex justify-content-end flex-wrap gap-2">
                                    <Button
                                        variant="dark"
                                        size="sm"
                                        className="btn-compact"
                                        onClick={handleMovimientosCaja}
                                        disabled={loadingMovimientos}
                                    >
                                        {loadingMovimientos ? (
                                            <Spinner animation="border" size="sm" className="me-1" />
                                        ) : (
                                            <i className="bi bi-bank me-1"></i>
                                        )}
                                        Movimientos de Caja
                                    </Button>
                                    <Button
                                        variant="success"
                                        size="sm"
                                        className="btn-compact"
                                        onClick={handleComprobanteDiario}
                                        disabled={(ventasDelDia?.length || 0) === 0}
                                    >
                                        <i className="bi bi-currency-dollar me-1"></i>
                                        Comprobante Diario de ventas
                                    </Button>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="btn-compact"
                                        onClick={handleRefrescarDatos}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <Spinner animation="border" size="sm" className="me-1" />
                                        ) : (
                                            <i className="bi bi-arrow-clockwise me-1"></i>
                                        )}
                                        Refrescar Datos
                                    </Button>
                                    <Button variant="outline-info" size="sm" className="btn-compact" onClick={async () => {
                                        console.log('🔍 DIAGNÓSTICO INICIADO');
                                        console.log('📅 Fecha consulta:', fechaConsulta);

                                        // Probar ventaService directamente
                                        try {
                                            const todasLasVentas = await ventaService.getAll();
                                            console.log('📊 Todas las ventas:', todasLasVentas);

                                            if (todasLasVentas && !todasLasVentas.error) {
                                                const ventasHoy = todasLasVentas.filter(venta => {
                                                    // Usar solo la parte de fecha sin conversión UTC
                                                    const fechaVenta = venta.fecha.split('T')[0];
                                                    console.log(`🔍 Comparando: ${fechaVenta} === ${fechaConsulta}`);
                                                    return fechaVenta === fechaConsulta;
                                                });
                                                console.log('📊 Ventas de hoy filtradas:', ventasHoy);

                                                ventasHoy.forEach(venta => {
                                                    console.log(`💰 Venta ID: ${venta.id}, Método: ${venta.metodo_pago}, Total: ${venta.total}, Fecha: ${venta.fecha}`);
                                                });
                                            }
                                        } catch (error) {
                                            console.error('❌ Error en diagnóstico:', error);
                                        }

                                        // Probar cajaService
                                        try {
                                            const resumenCaja = await cajaService.getResumenVentasDelDia(fechaConsulta);
                                            console.log('📊 Resumen caja service:', resumenCaja);
                                        } catch (error) {
                                            console.error('❌ Error en cajaService:', error);
                                        }
                                    }}>
                                        <i className="bi bi-bug me-1"></i>
                                        Debug
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Resumen del día */}
                {resumenVentas && (
                    <Card className="mb-4">
                        <Card.Body>
                            {/* Indicador de turno */}
                            {turnoActivo && (turnoActivo.fecha_inicio || turnoActivo.hora_inicio) && (
                                <Alert variant="info" className="mb-3 py-2">
                                    <small>
                                        <i className="bi bi-info-circle me-2"></i>
                                        <strong>Arqueo del Turno Actual:</strong> Mostrando solo las ventas realizadas desde el inicio de tu turno
                                        ({new Date(turnoActivo.fecha_inicio || turnoActivo.hora_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })})
                                    </small>
                                </Alert>
                            )}

                            <Row className="text-center">
                                <Col md={4}>
                                    <div className="stat-card">
                                        <div className="stat-value text-primary">
                                            {resumenVentas.totalVentas}
                                        </div>
                                        <div className="stat-label">Ventas del Turno</div>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="stat-card">
                                        <div className="stat-value text-success">
                                            {formatCurrency(resumenVentas.totalGeneral)}
                                        </div>
                                        <div className="stat-label">Monto Total</div>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="stat-card">
                                        <div className={`stat-value ${totalDiferencia < 0 ? 'text-danger' : totalDiferencia > 0 ? 'text-success' : 'text-secondary'}`}>
                                            {formatCurrency(totalDiferencia)}
                                        </div>
                                        <div className="stat-label">Diferencia Total</div>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                )}

                {/* Tabs principales */}
                <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
                    {/* Tab Arqueo */}
                    <Tab eventKey="arqueo" title="🧮 Arqueo de Caja">
                        <Card>
                            <Card.Header>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="mb-0">
                                            <i className="bi bi-calculator me-2"></i>
                                            Control de Efectivo y Medios de Pago
                                        </h5>
                                        {saldoInicialTurno > 0 && (
                                            <small className="text-muted">
                                                <i className="bi bi-wallet2 me-1"></i>
                                                Saldo inicial del turno: {formatCurrency(saldoInicialTurno)}
                                            </small>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={handleRefrescarDatos}
                                        title="Refrescar datos"
                                    >
                                        <i className="bi bi-arrow-clockwise"></i>
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {/* Alert de corte realizado */}
                                {corteRealizado && (
                                    <Alert variant="success" className="mb-3">
                                        <i className="bi bi-check-circle-fill me-2"></i>
                                        <strong>Corte de caja realizado.</strong> Los valores están bloqueados. Para realizar un nuevo corte, cierre sesión y vuelva a ingresar.
                                    </Alert>
                                )}

                                {/* Tabla de arqueo estilo limpio */}
                                <div className="table-responsive">
                                    <Table className="caja-table-page">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '40%' }}>Medio de Pago</th>
                                                <th style={{ width: '20%' }}>Sistema</th>
                                                <th style={{ width: '20%' }}>Saldo En Caja</th>
                                                <th style={{ width: '20%' }}>Diferencia</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mediosPago.map((medio) => {
                                                const diferencia = calcularDiferencia(medio.key);
                                                const valorSistema = valoresSistema[medio.key];
                                                const valorCaja = valoresCaja[medio.key];

                                                return (
                                                    <tr key={medio.key} className={medio.destacado ? 'fila-efectivo' : ''}>
                                                        <td className={medio.destacado ? 'fw-bold' : ''}>
                                                            {medio.label}
                                                        </td>
                                                        <td className="text-end">
                                                            {medio.key === 'efectivo' ? (
                                                                <div>
                                                                    <span className={valorSistema > 0 ? 'fw-bold' : ''}>{formatCurrency(valorSistema)}</span>
                                                                    {totalMovimientosCaja !== 0 && (
                                                                        <>
                                                                            <br />
                                                                            <small className={`text-${totalMovimientosCaja > 0 ? 'success' : 'danger'}`}>
                                                                                {totalMovimientosCaja > 0 ? '+' : ''}{formatCurrency(totalMovimientosCaja)} mov.
                                                                            </small>
                                                                            <br />
                                                                            <small className="text-muted">
                                                                                = {formatCurrency(valorSistema + totalMovimientosCaja)}
                                                                            </small>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className={valorSistema > 0 ? 'fw-bold' : ''}>{formatCurrency(valorSistema)}</span>
                                                            )}
                                                        </td>
                                                        <td className="text-center">
                                                            {!medio.soloSistema ? (
                                                                <Form.Control
                                                                    type="number"
                                                                    value={valorCaja}
                                                                    onChange={(e) => handleInputChange(medio.key, e.target.value)}
                                                                    onFocus={(e) => e.target.select()}
                                                                    className="text-end caja-input-page"
                                                                    style={{ width: '110px', margin: '0 auto' }}
                                                                    step="1"
                                                                    min="0"
                                                                    placeholder="0"
                                                                    disabled={corteRealizado}
                                                                />
                                                            ) : (
                                                                <span>-</span>
                                                            )}
                                                        </td>
                                                        <td className="text-end">
                                                            {!medio.soloSistema ? (
                                                                diferencia < 0 ? (
                                                                    <span className="diferencia-negativa">
                                                                        {formatCurrency(diferencia)}
                                                                    </span>
                                                                ) : diferencia > 0 ? (
                                                                    <span className="diferencia-positiva">
                                                                        {formatCurrency(diferencia)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="diferencia-cero">
                                                                        {formatCurrency(diferencia)}
                                                                    </span>
                                                                )
                                                            ) : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td className="fw-bold">Totales:</td>
                                                <td className="text-end fw-bold">{formatCurrency(totalSistema)}</td>
                                                <td className="text-end fw-bold">{formatCurrency(totalCaja)}</td>
                                                <td className="text-end">
                                                    {totalDiferencia < 0 ? (
                                                        <span className="diferencia-negativa">
                                                            {formatCurrency(totalDiferencia)}
                                                        </span>
                                                    ) : totalDiferencia > 0 ? (
                                                        <span className="diferencia-positiva">
                                                            {formatCurrency(totalDiferencia)}
                                                        </span>
                                                    ) : (
                                                        <span className="diferencia-cero fw-bold">
                                                            {formatCurrency(totalDiferencia)}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </Table>
                                </div>

                                {/* Movimientos de Caja */}
                                <Card className="mt-4">
                                    <Card.Header>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h6 className="mb-0">
                                                <i className="bi bi-arrow-left-right me-2"></i>
                                                Movimientos de Caja
                                            </h6>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => setShowNuevoMovimiento(true)}
                                            >
                                                <i className="bi bi-plus-circle me-1"></i>
                                                Agregar Movimiento
                                            </Button>
                                        </div>
                                    </Card.Header>
                                    <Card.Body>
                                        {movimientosCaja.length > 0 ? (
                                            <>
                                                <Table size="sm" className="mb-3">
                                                    <thead>
                                                        <tr>
                                                            <th>Hora</th>
                                                            <th>Tipo</th>
                                                            <th>Concepto</th>
                                                            <th className="text-end">Monto</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {movimientosCaja.map((mov) => (
                                                            <tr key={mov.id}>
                                                                <td>{mov.hora}</td>
                                                                <td>
                                                                    <Badge bg={mov.tipo === 'INGRESO' ? 'success' : 'danger'}>
                                                                        {mov.tipo}
                                                                    </Badge>
                                                                </td>
                                                                <td>{mov.concepto}</td>
                                                                <td className={`text-end ${mov.tipo === 'INGRESO' ? 'text-success' : 'text-danger'}`}>
                                                                    {mov.tipo === 'EGRESO' ? '- ' : '+ '}
                                                                    {formatCurrency(Math.abs(parseFloat(mov.monto) || 0))}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                                <div className="bg-light p-2 rounded">
                                                    <strong>Total Movimientos: </strong>
                                                    <span className={totalMovimientosCaja >= 0 ? 'text-success' : 'text-danger'}>
                                                        {formatCurrency(totalMovimientosCaja)}
                                                    </span>
                                                    <small className="text-muted ms-2">
                                                        (Este monto se suma/resta del efectivo esperado)
                                                    </small>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center text-muted py-3">
                                                <i className="bi bi-arrow-left-right fs-3 d-block mb-2"></i>
                                                <p>No hay movimientos de caja registrados</p>
                                                <small>Use el botón "Agregar Movimiento" para registrar ingresos o egresos</small>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>

                                {/* Campo de observaciones */}
                                <Row className="mt-4">
                                    <Col>
                                        <Form.Group>
                                            <Form.Label>
                                                <i className="bi bi-chat-text me-2"></i>
                                                Observaciones del Arqueo
                                            </Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={4}
                                                value={observaciones}
                                                onChange={(e) => setObservaciones(e.target.value)}
                                                placeholder="Ingrese observaciones sobre diferencias, incidentes o notas importantes..."
                                                maxLength={500}
                                                style={{ fontSize: '1rem' }}
                                            />
                                            <Form.Text className="text-muted">
                                                {observaciones?.length || 0}/500 caracteres
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Recomendaciones */}
                                {(recomendaciones?.length || 0) > 0 && (
                                    <div className="mt-4">
                                        <h6><i className="bi bi-lightbulb me-2"></i>Recomendaciones</h6>
                                        {recomendaciones.map((rec, index) => (
                                            <Alert key={index} variant={rec.tipo === 'error' ? 'danger' : rec.tipo === 'warning' ? 'warning' : 'info'} className="py-2">
                                                <i className={`bi ${rec.tipo === 'error' ? 'bi-x-circle-fill' : rec.tipo === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'} me-2`}></i>
                                                <small><strong>{rec.metodo}:</strong> {rec.mensaje}</small>
                                            </Alert>
                                        ))}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Tab>

                    {/* Tab Ventas del Día */}
                    <Tab eventKey="ventas" title="📊 Ventas del Día">
                        <Card>
                            <Card.Header>
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">
                                        <i className="bi bi-receipt me-2"></i>
                                        Ventas del Día - {fechaConsultaVentas}
                                    </h5>
                                    <div className="d-flex gap-2 align-items-center">
                                        <Form.Control
                                            type="date"
                                            value={fechaConsultaVentas}
                                            onChange={(e) => handleCambioFechaVentas(e.target.value)}
                                            style={{ width: '150px' }}
                                            className="form-control-sm"
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => handleCambioFechaVentas(getFechaLocal())}
                                            title="Ir a hoy"
                                        >
                                            <i className="bi bi-calendar-day"></i>
                                        </Button>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => cargarVentasDelDia()}
                                            disabled={loadingVentas}
                                        >
                                            {loadingVentas ? (
                                                <Spinner animation="border" size="sm" className="me-1" />
                                            ) : (
                                                <i className="bi bi-arrow-clockwise me-1"></i>
                                            )}
                                            Actualizar
                                        </Button>
                                        <Badge bg="primary" className="fs-6 px-3 py-2">
                                            {ventasDelDia?.length || 0} ventas
                                        </Badge>
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {/* Métricas rápidas */}
                                <Row className="mb-4">
                                    <Col md={4}>
                                        <Card className="border-0 bg-light">
                                            <Card.Body className="text-center py-2">
                                                <div className="h5 text-primary mb-1">{ventasDelDia?.length || 0}</div>
                                                <small className="text-muted">Total Ventas</small>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={4}>
                                        <Card className="border-0 bg-light">
                                            <Card.Body className="text-center py-2">
                                                <div className="h5 text-success mb-1">{formatCurrency(metricasVentas.totalFacturado)}</div>
                                                <small className="text-muted">Total Facturado</small>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={4}>
                                        <Card className="border-0 bg-light">
                                            <Card.Body className="text-center py-2">
                                                <div className="h5 text-info mb-1">{formatCurrency(metricasVentas.totalPagado)}</div>
                                                <small className="text-muted">Total Pagado</small>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* Tabla de ventas */}
                                {loadingVentas ? (
                                    <div className="text-center p-4">
                                        <Spinner animation="border" className="me-2" />
                                        <span>Cargando ventas del día...</span>
                                    </div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <Table hover className="mb-0" style={{ fontSize: '13px' }}>
                                            <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: '80px' }}># Factura</th>
                                                    <th>Cliente</th>
                                                    <th>Vendedor</th>
                                                    <th>Método Pago</th>
                                                    <th className="text-end">Total</th>
                                                    <th>Fecha</th>
                                                    <th>Estado</th>
                                                    <th className="text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(ventasDelDia?.length || 0) > 0 ? (
                                                    ventasDelDia.map((venta, index) => (
                                                        <tr
                                                            key={venta.id}
                                                            style={{ cursor: 'pointer' }}
                                                            className="table-row-hover"
                                                            onClick={() => mostrarDetalleVenta(venta.id)}
                                                        >
                                                            <td>
                                                                <Badge bg="secondary" className="font-monospace">
                                                                    {venta.numero_factura || `PV${String(index + 1).padStart(3, '0')}`}
                                                                </Badge>
                                                            </td>
                                                            <td>{venta.cliente || 'CONSUMIDOR FINAL'}</td>
                                                            <td>{venta.vendedor || 'Sistema'}</td>
                                                            <td>
                                                                <Badge
                                                                    bg={venta.metodo_pago === 'efectivo' ? 'success' :
                                                                        venta.metodo_pago === 'tarjeta' ? 'primary' : 'info'}
                                                                    className="text-capitalize"
                                                                >
                                                                    {venta.metodo_pago}
                                                                </Badge>
                                                            </td>
                                                            <td className="text-end fw-bold">
                                                                {formatCurrency(parseFloat(venta.total || 0))}
                                                            </td>
                                                            <td>
                                                                {new Date(venta.fecha).toLocaleString('es-ES', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    day: '2-digit',
                                                                    month: '2-digit'
                                                                })}
                                                            </td>
                                                            <td>
                                                                <Badge bg={
                                                                    venta.estado === 'ANULADA' ? 'danger' :
                                                                        venta.estado === 'PAGADO' ? 'success' : 'warning'
                                                                }>
                                                                    {venta.estado || 'PAGADO'}
                                                                </Badge>
                                                            </td>
                                                            <td className="text-center">
                                                                <Button
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        mostrarDetalleVenta(venta.id);
                                                                    }}
                                                                    title="Ver detalle"
                                                                >
                                                                    <i className="bi bi-eye"></i>
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="8" className="text-center p-4">
                                                            <div className="text-muted">
                                                                <i className="bi bi-receipt fs-1 d-block mb-2"></i>
                                                                No hay ventas registradas para el día {fechaConsultaVentas}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}

                                {/* Resumen por método de pago */}
                                {(ventasDelDia?.length || 0) > 0 && (
                                    <Card className="mt-4 bg-light">
                                        <Card.Body>
                                            <h6 className="mb-3">
                                                <i className="bi bi-pie-chart me-2"></i>
                                                Resumen por Método de Pago
                                            </h6>
                                            <Row>
                                                {Object.entries(
                                                    ventasDelDia
                                                        .filter(venta => venta.estado !== 'ANULADA') // Excluir anuladas
                                                        .reduce((acc, venta) => {
                                                            const metodo = venta.metodo_pago || 'efectivo';
                                                            acc[metodo] = (acc[metodo] || 0) + parseFloat(venta.total || 0);
                                                            return acc;
                                                        }, {})
                                                ).map(([metodo, total]) => (
                                                    <Col md={3} key={metodo} className="mb-2">
                                                        <div className="d-flex justify-content-between align-items-center p-2 bg-white rounded">
                                                            <span className="text-capitalize fw-bold">{metodo}:</span>
                                                            <span className="text-success fw-bold">{formatCurrency(total)}</span>
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                )}
                            </Card.Body>
                        </Card>
                    </Tab>


                    {/* Tab Historial */}
                    <Tab eventKey="historial" title="📅 Historial">
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">
                                    <i className="bi bi-clock-history me-2"></i>
                                    Historial de Arqueos
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="mb-4">
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Fecha Desde:</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={fechaHistorialInicio}
                                                onChange={(e) => setFechaHistorialInicio(e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Fecha Hasta:</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={fechaHistorialFin}
                                                onChange={(e) => setFechaHistorialFin(e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="d-flex gap-2 mb-4">
                                    <Button
                                        variant="info"
                                        onClick={() => cargarHistorialArqueos(fechaHistorialInicio, fechaHistorialFin)}
                                        disabled={loadingHistorial}
                                    >
                                        <i className="bi bi-search me-2"></i>
                                        {loadingHistorial ? 'Cargando...' : 'Consultar Historial'}
                                    </Button>
                                    <Button
                                        variant="outline-primary"
                                        onClick={() => {
                                            const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                            setFechaHistorialInicio(hace7Dias);
                                            setFechaHistorialFin(getFechaLocal());
                                            cargarHistorialArqueos(hace7Dias, getFechaLocal());
                                        }}
                                    >
                                        <i className="bi bi-calendar-week me-2"></i>
                                        Última Semana
                                    </Button>
                                    <Button
                                        variant="outline-success"
                                        onClick={() => {
                                            const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                            setFechaHistorialInicio(hace30Dias);
                                            setFechaHistorialFin(getFechaLocal());
                                            cargarHistorialArqueos(hace30Dias, getFechaLocal());
                                        }}
                                    >
                                        <i className="bi bi-calendar-month me-2"></i>
                                        Último Mes
                                    </Button>
                                </div>

                                {loadingHistorial ? (
                                    <div className="text-center py-5">
                                        <Spinner animation="border" variant="primary" />
                                        <p className="mt-2">Cargando historial...</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Tabla de historial */}
                                        <Table striped bordered hover responsive>
                                            <thead>
                                                <tr>
                                                    <th>Fecha</th>
                                                    <th>Cajero</th>
                                                    <th className="text-end">Total Sistema</th>
                                                    <th className="text-end">Total Caja</th>
                                                    <th className="text-end">Diferencia</th>
                                                    <th className="text-center">Estado</th>
                                                    <th className="text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {historialArqueos.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="7" className="text-center text-muted py-4">
                                                            No se encontraron arqueos en el período seleccionado
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    historialArqueos.map((arqueo) => {
                                                        const diferencia = parseFloat(arqueo.total_diferencia || 0);
                                                        const tieneDiferencia = Math.abs(diferencia) >= 0.01;

                                                        return (
                                                            <tr key={arqueo.id}>
                                                                <td>{new Date(arqueo.fecha).toLocaleDateString('es-ES')}</td>
                                                                <td>{arqueo.cajero}</td>
                                                                <td className="text-end">{formatCurrency(arqueo.total_sistema)}</td>
                                                                <td className="text-end">{formatCurrency(arqueo.total_caja)}</td>
                                                                <td className={`text-end ${tieneDiferencia ? (diferencia > 0 ? 'text-success' : 'text-danger') : 'text-muted'}`}>
                                                                    {formatCurrency(diferencia)}
                                                                </td>
                                                                <td className="text-center">
                                                                    <Badge bg={
                                                                        arqueo.estado === 'COMPLETADO' ? 'success' :
                                                                            arqueo.estado === 'REVISADO' ? 'info' :
                                                                                'warning'
                                                                    }>
                                                                        {arqueo.estado}
                                                                    </Badge>
                                                                </td>
                                                                <td className="text-center">
                                                                    <Button
                                                                        variant="outline-primary"
                                                                        size="sm"
                                                                        className="me-1"
                                                                        onClick={() => verDetalleArqueo(arqueo)}
                                                                        title="Ver detalle"
                                                                    >
                                                                        <i className="bi bi-eye"></i>
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline-secondary"
                                                                        size="sm"
                                                                        onClick={() => imprimirArqueo(arqueo)}
                                                                        title="Imprimir"
                                                                    >
                                                                        <i className="bi bi-printer"></i>
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </Table>

                                        {/* Estadísticas del período */}
                                        <Card className="bg-light mt-4">
                                            <Card.Body>
                                                <h6 className="mb-3">
                                                    <i className="bi bi-graph-up me-2"></i>
                                                    Estadísticas del Período
                                                </h6>
                                                <Row className="text-center">
                                                    <Col md={3}>
                                                        <div className="h5 text-primary mb-1">{estadisticasHistorial.totalArqueos}</div>
                                                        <small className="text-muted">Arqueos Realizados</small>
                                                    </Col>
                                                    <Col md={3}>
                                                        <div className="h5 text-success mb-1">{estadisticasHistorial.sinDiferencias}</div>
                                                        <small className="text-muted">Sin Diferencias</small>
                                                    </Col>
                                                    <Col md={3}>
                                                        <div className="h5 text-warning mb-1">{estadisticasHistorial.conDiferencias}</div>
                                                        <small className="text-muted">Con Diferencias</small>
                                                    </Col>
                                                    <Col md={3}>
                                                        <div className={`h5 mb-1 ${estadisticasHistorial.totalDiferencia < 0 ? 'text-danger' : estadisticasHistorial.totalDiferencia > 0 ? 'text-success' : 'text-muted'}`}>
                                                            {formatCurrency(estadisticasHistorial.totalDiferencia)}
                                                        </div>
                                                        <small className="text-muted">Diferencia Total</small>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    </Tab>


                </Tabs>

                {/* Modal de Detalle de Arqueo */}
                <Modal show={showArqueoDetalleModal} onHide={() => setShowArqueoDetalleModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>
                            <i className="bi bi-file-text me-2"></i>
                            Detalle de Arqueo
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {arqueoDetalle && (
                            <>
                                <Row className="mb-4">
                                    <Col md={6}>
                                        <p><strong>Fecha:</strong> {new Date(arqueoDetalle.fecha).toLocaleDateString('es-ES')}</p>
                                        <p><strong>Cajero:</strong> {arqueoDetalle.cajero}</p>
                                    </Col>
                                    <Col md={6}>
                                        <p><strong>Banco:</strong> {arqueoDetalle.banco}</p>
                                        <p><strong>Estado:</strong> <Badge bg={
                                            arqueoDetalle.estado === 'COMPLETADO' ? 'success' :
                                                arqueoDetalle.estado === 'REVISADO' ? 'info' : 'warning'
                                        }>{arqueoDetalle.estado}</Badge></p>
                                    </Col>
                                </Row>

                                <h6 className="mb-3">Valores del Sistema</h6>
                                <Table bordered size="sm" className="mb-4">
                                    <tbody>
                                        {Object.entries(arqueoDetalle.valores_sistema || {}).map(([metodo, valor]) => (
                                            <tr key={metodo}>
                                                <td><strong>{metodo.toUpperCase()}</strong></td>
                                                <td className="text-end">{formatCurrency(valor)}</td>
                                            </tr>
                                        ))}
                                        <tr className="table-secondary">
                                            <td><strong>TOTAL SISTEMA</strong></td>
                                            <td className="text-end"><strong>{formatCurrency(arqueoDetalle.total_sistema)}</strong></td>
                                        </tr>
                                    </tbody>
                                </Table>

                                <h6 className="mb-3">Valores en Caja</h6>
                                <Table bordered size="sm" className="mb-4">
                                    <tbody>
                                        {Object.entries(arqueoDetalle.valores_caja || {}).map(([metodo, valor]) => (
                                            <tr key={metodo}>
                                                <td><strong>{metodo.toUpperCase()}</strong></td>
                                                <td className="text-end">{formatCurrency(valor)}</td>
                                            </tr>
                                        ))}
                                        <tr className="table-secondary">
                                            <td><strong>TOTAL CAJA</strong></td>
                                            <td className="text-end"><strong>{formatCurrency(arqueoDetalle.total_caja)}</strong></td>
                                        </tr>
                                    </tbody>
                                </Table>

                                <h6 className="mb-3">Diferencias</h6>
                                <Table bordered size="sm" className="mb-4">
                                    <tbody>
                                        {Object.entries(arqueoDetalle.diferencias || {}).map(([metodo, valor]) => {
                                            const diff = parseFloat(valor);
                                            return (
                                                <tr key={metodo}>
                                                    <td><strong>{metodo.toUpperCase()}</strong></td>
                                                    <td className={`text-end ${diff < 0 ? 'text-danger' : diff > 0 ? 'text-success' : 'text-muted'}`}>
                                                        {formatCurrency(valor)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="table-secondary">
                                            <td><strong>TOTAL DIFERENCIA</strong></td>
                                            <td className={`text-end ${arqueoDetalle.total_diferencia < 0 ? 'text-danger' : arqueoDetalle.total_diferencia > 0 ? 'text-success' : 'text-muted'}`}>
                                                <strong>{formatCurrency(arqueoDetalle.total_diferencia)}</strong>
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>

                                {arqueoDetalle.observaciones && (
                                    <>
                                        <h6 className="mb-2">Observaciones</h6>
                                        <Alert variant="info">
                                            {arqueoDetalle.observaciones}
                                        </Alert>
                                    </>
                                )}
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowArqueoDetalleModal(false)}>
                            Cerrar
                        </Button>
                        <Button variant="primary" onClick={() => imprimirArqueo(arqueoDetalle)}>
                            <i className="bi bi-printer me-2"></i>
                            Imprimir
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Botones de acción */}
                <div className="caja-actions">
                    <Row>
                        <Col className="text-center">
                            <div className="d-flex justify-content-center gap-3">
                                <Button
                                    variant="outline-secondary"
                                    size="lg"
                                    onClick={() => navigate('/pos')}
                                >
                                    <i className="bi bi-x-lg me-2"></i>
                                    Cancelar
                                </Button>
                                <Button
                                    variant="success"
                                    size="lg"
                                    onClick={handleGuardarArqueo}
                                    disabled={guardandoArqueo || (validacion && !validacion.esValido) || corteRealizado}
                                >
                                    {guardandoArqueo ? (
                                        <Spinner animation="border" size="sm" className="me-2" />
                                    ) : corteRealizado ? (
                                        <i className="bi bi-check-circle me-2"></i>
                                    ) : (
                                        <i className="bi bi-save me-2"></i>
                                    )}
                                    {corteRealizado ? 'Corte Realizado' : 'Guardar Arqueo'}
                                </Button>
                                <Button variant="primary" size="lg" onClick={handleImprimir}>
                                    <i className="bi bi-printer me-2"></i>
                                    Imprimir Reporte
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* Indicadores de estado */}
                {(totalDiferencia !== 0 || (validacion && !validacion.esValido)) && (
                    <div className="text-center mt-3">
                        {totalDiferencia !== 0 && (
                            <Badge
                                bg={Math.abs(totalDiferencia) > 50000 ? 'danger' : 'warning'}
                                className="me-2 fs-6 px-3 py-2"
                            >
                                Diferencia: {formatCurrency(totalDiferencia)}
                            </Badge>
                        )}
                        {validacion && !validacion.esValido && (
                            <Badge bg="danger" className="fs-6 px-3 py-2">
                                {validacion.errores?.length || 0} errores encontrados
                            </Badge>
                        )}
                    </div>
                )}
            </Container>

            {/* Modal de Movimientos de Caja */}
            <Modal show={showMovimientosBancarios} onHide={() => setShowMovimientosBancarios(false)} size="lg" centered>
                <Modal.Header closeButton style={{ backgroundColor: '#0c2c53', color: 'white', borderBottom: 'none', padding: '0.75rem 1rem' }}>
                    <Modal.Title className="d-flex align-items-center justify-content-between w-100" style={{ fontSize: '1rem' }}>
                        <div className="d-flex align-items-center">
                            <i className="bi bi-arrow-left-right me-2" style={{ fontSize: '1rem' }}></i>
                            <span style={{ fontSize: '1rem' }}>Movimientos de Caja</span>
                        </div>
                        <div className="d-flex align-items-center" style={{ marginRight: '2rem' }}>
                            <span style={{ fontSize: '0.9rem', marginRight: '0.5rem' }}>{fechaMovimientos.split('-').reverse().join('/')}</span>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <i
                                    className="bi bi-calendar3"
                                    style={{
                                        fontSize: '1.1rem',
                                        cursor: 'pointer',
                                        padding: '0.2rem 0.4rem',
                                        borderRadius: '4px',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    onClick={(e) => e.currentTarget.nextSibling.showPicker()}
                                ></i>
                                <input
                                    type="date"
                                    value={fechaMovimientos}
                                    onChange={(e) => setFechaMovimientos(e.target.value)}
                                    style={{
                                        position: 'absolute',
                                        opacity: 0,
                                        width: '1px',
                                        height: '1px',
                                        pointerEvents: 'none'
                                    }}
                                />
                            </div>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1.5rem' }}>
                    <>
                        {/* Formulario para agregar nuevo movimiento */}
                        <Card className="mb-4 shadow-sm border-0">
                            <Card.Header style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #0c2c53' }}>
                                <h6 className="mb-0" style={{ color: '#0c2c53', fontWeight: '600' }}>
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Agregar Nuevo Movimiento
                                </h6>
                            </Card.Header>
                            <Card.Body style={{ backgroundColor: '#ffffff' }}>
                                <Row className="g-4">
                                    <Col md={2} sm={3}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Tipo</Form.Label>
                                            <Form.Select
                                                value={tipoMovimiento}
                                                onChange={(e) => setTipoMovimiento(e.target.value)}
                                                style={{ minWidth: '100px' }}
                                            >
                                                <option value="INGRESO">Ingreso</option>
                                                <option value="EGRESO">Salida</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={2} sm={3}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Monto</Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="0.00"
                                                value={montoMovimiento}
                                                onChange={(e) => setMontoMovimiento(e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                                min="0"
                                                step="0.01"
                                                style={{ minWidth: '110px' }}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={5} sm={12} style={{ paddingLeft: '1.5rem' }}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Concepto</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Descripción del movimiento"
                                                value={conceptoMovimiento}
                                                onChange={(e) => setConceptoMovimiento(e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3} sm={6} className="d-flex align-items-end">
                                        <Button
                                            variant="success"
                                            onClick={handleAgregarMovimiento}
                                            className="w-100 mb-3"
                                            disabled={!montoMovimiento || !conceptoMovimiento}
                                        >
                                            <i className="bi bi-plus me-1"></i>
                                            Agregar
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Resumen de movimientos */}
                        <Row className="mb-4">
                            <Col md={4}>
                                <Card className="border" style={{ backgroundColor: 'rgba(25, 135, 84, 0.1)', borderColor: 'rgba(25, 135, 84, 0.3)' }}>
                                    <Card.Body className="text-center py-2">
                                        <div className="h5 mb-1" style={{ color: '#198754' }}>
                                            {formatCurrency(
                                                movimientosCaja
                                                    .filter(mov => {
                                                        const fechaMov = mov.fecha ? mov.fecha.split('T')[0] : getFechaLocal();
                                                        return fechaMov === fechaMovimientos && mov.tipo === 'INGRESO';
                                                    })
                                                    .reduce((sum, mov) => sum + Math.abs(parseFloat(mov.monto) || 0), 0)
                                            )}
                                        </div>
                                        <small style={{ color: '#198754' }}>Total Ingresos</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="border" style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)', borderColor: 'rgba(220, 53, 69, 0.3)' }}>
                                    <Card.Body className="text-center py-2">
                                        <div className="h5 mb-1" style={{ color: '#dc3545' }}>
                                            {formatCurrency(
                                                movimientosCaja
                                                    .filter(mov => {
                                                        const fechaMov = mov.fecha ? mov.fecha.split('T')[0] : getFechaLocal();
                                                        return fechaMov === fechaMovimientos && mov.tipo === 'EGRESO';
                                                    })
                                                    .reduce((sum, mov) => sum + Math.abs(parseFloat(mov.monto) || 0), 0)
                                            )}
                                        </div>
                                        <small style={{ color: '#dc3545' }}>Total Egresos</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="border" style={{ backgroundColor: 'rgba(12, 44, 83, 0.1)', borderColor: 'rgba(12, 44, 83, 0.3)' }}>
                                    <Card.Body className="text-center py-2">
                                        <div className="h5 mb-1" style={{ color: '#0c2c53' }}>
                                            {formatCurrency(
                                                movimientosCaja
                                                    .filter(mov => {
                                                        const fechaMov = mov.fecha ? mov.fecha.split('T')[0] : getFechaLocal();
                                                        return fechaMov === fechaMovimientos;
                                                    })
                                                    .reduce((sum, mov) => {
                                                        const monto = Math.abs(parseFloat(mov.monto) || 0); // Siempre positivo
                                                        return sum + (mov.tipo === 'EGRESO' ? -monto : monto);
                                                    }, 0)
                                            )}
                                        </div>
                                        <small style={{ color: '#0c2c53' }}>Saldo Neto</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Información del cajero */}
                        <Alert className="mb-3" style={{ backgroundColor: 'rgba(12, 44, 83, 0.05)', border: '1px solid rgba(12, 44, 83, 0.2)', color: '#0c2c53' }}>
                            <i className="bi bi-info-circle me-2"></i>
                            <strong>Cajero:</strong> {cajero} |
                            <strong> Fecha:</strong> {fechaMovimientos.split('-').reverse().join('/')} |
                            <strong> Total movimientos:</strong> {movimientosCaja.filter(mov => {
                                const fechaMov = mov.fecha ? mov.fecha.split('T')[0] : getFechaLocal();
                                return fechaMov === fechaMovimientos;
                            }).length}
                        </Alert>

                        {/* Tabla de movimientos */}
                        {(() => {
                            const movimientosFiltrados = movimientosCaja.filter(mov => {
                                const fechaMov = mov.fecha ? mov.fecha.split('T')[0] : getFechaLocal();
                                return fechaMov === fechaMovimientos;
                            });

                            return movimientosFiltrados.length > 0 ? (
                                <Table striped bordered hover size="sm" className="shadow-sm">
                                    <thead style={{ backgroundColor: '#0c2c53', color: 'white' }}>
                                        <tr>
                                            <th style={{ width: '80px' }}>Hora</th>
                                            <th style={{ width: '100px' }}>Tipo</th>
                                            <th>Concepto</th>
                                            <th className="text-end" style={{ width: '120px' }}>Monto</th>
                                            <th className="text-end" style={{ width: '120px' }}>Saldo</th>
                                            <th style={{ width: '80px' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movimientosFiltrados.map((movimiento, index) => {
                                            const saldoAcumulado = movimientosFiltrados
                                                .slice(0, index + 1)
                                                .reduce((sum, mov) => {
                                                    const monto = Math.abs(parseFloat(mov.monto) || 0); // Siempre positivo
                                                    return sum + (mov.tipo === 'EGRESO' ? -monto : monto);
                                                }, 0);

                                            return (
                                                <tr key={movimiento.id || index}>
                                                    <td className="font-monospace">{movimiento.hora}</td>
                                                    <td>
                                                        <Badge bg={movimiento.tipo === 'INGRESO' ? 'success' : 'danger'}>
                                                            {movimiento.tipo === 'EGRESO' ? 'SALIDA' : movimiento.tipo}
                                                        </Badge>
                                                    </td>
                                                    <td>{movimiento.concepto}</td>
                                                    <td className={`text-end fw-bold ${movimiento.tipo === 'INGRESO' ? 'text-success' : 'text-danger'}`}>
                                                        {movimiento.tipo === 'EGRESO' ? '- ' : '+ '}
                                                        {formatCurrency(Math.abs(parseFloat(movimiento.monto) || 0))}
                                                    </td>
                                                    <td className="text-end fw-bold">
                                                        {formatCurrency(saldoAcumulado)}
                                                    </td>
                                                    <td className="text-center">
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={async () => {
                                                                if (window.confirm('¿Está seguro de eliminar este movimiento?')) {
                                                                    try {
                                                                        await cajaService.eliminarMovimientoCaja(movimiento.id);
                                                                        setMovimientosCaja(prev => prev.filter(mov => mov.id !== movimiento.id));
                                                                        console.log('✅ Movimiento eliminado de BD');
                                                                    } catch (error) {
                                                                        console.error('❌ Error al eliminar movimiento:', error);
                                                                        alert('Error al eliminar el movimiento');
                                                                    }
                                                                }
                                                            }}
                                                            title="Eliminar movimiento"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ backgroundColor: 'rgba(12, 44, 83, 0.1)' }}>
                                            <td colSpan="3" className="text-end fw-bold" style={{ color: '#0c2c53' }}>SALDO FINAL:</td>
                                            <td className="text-end fw-bold" style={{ color: '#0c2c53', fontSize: '1.1rem' }}>
                                                {formatCurrency(movimientosFiltrados.reduce((sum, mov) => {
                                                    const monto = Math.abs(parseFloat(mov.monto) || 0); // Siempre positivo
                                                    return sum + (mov.tipo === 'EGRESO' ? -monto : monto);
                                                }, 0))}
                                            </td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            ) : (
                                <div className="text-center text-muted p-4">
                                    <i className="bi bi-arrow-left-right fs-1 d-block mb-2"></i>
                                    <p>No hay movimientos de caja registrados para el día {fechaMovimientos.split('-').reverse().join('/')}</p>
                                    <small>Use el formulario superior para agregar ingresos o egresos</small>
                                </div>
                            );
                        })()}

                        {/* Nota informativa */}
                        <Alert className="mt-3 mb-0" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderLeft: '4px solid #ffc107' }}>
                            <small style={{ color: '#856404' }}>
                                <i className="bi bi-lightbulb-fill me-1"></i>
                                <strong>Nota:</strong> Los movimientos de caja registrados aquí se incluirán automáticamente
                                en el cálculo del arqueo de caja para determinar el saldo real esperado.
                            </small>
                        </Alert>
                    </>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
                    <Button variant="outline-secondary" onClick={() => setShowMovimientosBancarios(false)}>
                        <i className="bi bi-x-lg me-1"></i>
                        Cerrar
                    </Button>
                    <Button style={{ backgroundColor: '#0c2c53', borderColor: '#0c2c53', color: 'white' }} disabled={(movimientosCaja?.length || 0) === 0}>
                        <i className="bi bi-printer me-1"></i>
                        Imprimir
                    </Button>
                    <Button variant="success" disabled={(movimientosCaja?.length || 0) === 0}>
                        <i className="bi bi-file-earmark-excel me-1"></i>
                        Exportar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Detalle de Venta */}
            <Modal show={showVentaModal} onHide={() => setShowVentaModal(false)} size="xl" centered dialogClassName="modal-centered-custom">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-receipt me-2"></i>
                        Detalle de Venta - {ventaSeleccionada?.numero_factura || 'N/A'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '75vh', overflowY: 'auto', padding: '1.5rem' }}>
                    {ventaSeleccionada && (
                        <>
                            {/* Información de la venta */}
                            <Row className="mb-3">
                                <Col md={6}>
                                    <Card className="h-100 border-0 bg-light">
                                        <Card.Header style={{ backgroundColor: 'rgb(12, 44, 83)', color: 'white' }}>
                                            <strong><i className="bi bi-info-circle me-2"></i>Información General</strong>
                                        </Card.Header>
                                        <Card.Body>
                                            <p><strong>Cliente:</strong> {ventaSeleccionada.cliente || 'CONSUMIDOR FINAL'}</p>
                                            <p><strong>Vendedor:</strong> {ventaSeleccionada.vendedor || 'Sistema'}</p>
                                            <p><strong>Fecha:</strong> {new Date(ventaSeleccionada.fecha).toLocaleString('es-CO')}</p>
                                            <p><strong>Método de Pago:</strong>
                                                <Badge bg="primary" className="ms-2 text-capitalize">
                                                    {ventaSeleccionada.metodo_pago}
                                                </Badge>
                                            </p>
                                            <p><strong>Estado:</strong>
                                                <Badge bg={
                                                    ventaSeleccionada.estado === 'ANULADA' ? 'danger' :
                                                        ventaSeleccionada.estado === 'PAGADO' ? 'success' : 'warning'
                                                } className="ms-2">
                                                    {ventaSeleccionada.estado || 'PAGADO'}
                                                </Badge>
                                            </p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className="h-100 border-0 bg-light">
                                        <Card.Header className="bg-success text-white">
                                            <strong><i className="bi bi-calculator me-2"></i>Totales</strong>
                                        </Card.Header>
                                        <Card.Body>
                                            <p><strong>Subtotal:</strong>
                                                <span className="float-end">{formatCurrency(parseFloat(ventaSeleccionada.subtotal || 0))}</span>
                                            </p>
                                            <p><strong>Impuestos:</strong>
                                                <span className="float-end">{formatCurrency(parseFloat(ventaSeleccionada.impuestos || 0))}</span>
                                            </p>
                                            <p><strong>Descuentos:</strong>
                                                <span className="float-end">{formatCurrency(parseFloat(ventaSeleccionada.descuentos || 0))}</span>
                                            </p>
                                            <hr />
                                            <p className="fw-bold"><strong>Total:</strong>
                                                <span className="float-end text-success">{formatCurrency(parseFloat(ventaSeleccionada.total || 0))}</span>
                                            </p>
                                            <p><strong>Dinero Entregado:</strong>
                                                <span className="float-end">{formatCurrency(parseFloat(ventaSeleccionada.dinero_entregado || 0))}</span>
                                            </p>
                                            <p><strong>Devuelta:</strong>
                                                <span className="float-end">{formatCurrency(parseFloat(ventaSeleccionada.devuelta || 0))}</span>
                                            </p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Productos vendidos */}
                            <Card className="border-0">
                                <Card.Header style={{ backgroundColor: 'transparent', border: 'none', padding: '0.5rem 0' }}>
                                    <strong style={{ color: '#000000', fontSize: '16px' }}>Productos Vendidos</strong>
                                </Card.Header>
                                <Card.Body>
                                    {ventaSeleccionada?.detalles && (ventaSeleccionada.detalles?.length || 0) > 0 ? (
                                        <Table bordered hover size="sm" responsive style={{ marginBottom: 0 }}>
                                            <thead style={{ backgroundColor: '#e9ecef' }}>
                                                <tr>
                                                    <th style={{ minWidth: '200px', color: '#212529', fontWeight: '600' }}>PRODUCTO</th>
                                                    <th className="text-center" style={{ width: '100px', color: '#212529', fontWeight: '600' }}>CANTIDAD</th>
                                                    <th className="text-end" style={{ width: '120px', color: '#212529', fontWeight: '600' }}>PRECIO UNIT.</th>
                                                    <th className="text-end" style={{ width: '120px', color: '#212529', fontWeight: '600' }}>SUBTOTAL</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ventaSeleccionada.detalles.map((detalle, index) => (
                                                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                                                        <td><strong>{detalle.producto_nombre}</strong></td>
                                                        <td className="text-center" style={{ color: '#000000', fontWeight: '600' }}>
                                                            {detalle.cantidad}
                                                        </td>
                                                        <td className="text-end">{formatCurrency(parseFloat(detalle.precio_unitario || 0))}</td>
                                                        <td className="text-end fw-bold text-success">
                                                            {formatCurrency(parseFloat(detalle.subtotal || 0))}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr style={{ backgroundColor: '#fff3cd' }}>
                                                    <td colSpan="3" className="text-end fw-bold">TOTAL:</td>
                                                    <td className="text-end fw-bold fs-5 text-success">
                                                        {formatCurrency(parseFloat(ventaSeleccionada.total || 0))}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </Table>
                                    ) : (
                                        <div className="text-center text-muted p-4">
                                            <i className="bi bi-basket-x fs-1 d-block mb-2"></i>
                                            <p>No hay detalles de productos disponibles</p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Nota si existe */}
                            {ventaSeleccionada.nota && (
                                <Card className="mt-3 border-0">
                                    <Card.Header className="bg-warning">
                                        <strong><i className="bi bi-sticky me-2"></i>Nota</strong>
                                    </Card.Header>
                                    <Card.Body>
                                        <p className="mb-0">{ventaSeleccionada.nota}</p>
                                    </Card.Body>
                                </Card>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <div className="d-flex justify-content-between w-100">
                        <div className="d-flex gap-2">
                            <Button
                                onClick={abrirModalAnular}
                                disabled={ventaSeleccionada?.estado === 'ANULADA'}
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: ventaSeleccionada?.estado === 'ANULADA' ? '#6c757d' : '#dc3545',
                                    fontSize: '16px',
                                    fontWeight: '500'
                                }}
                                onMouseEnter={(e) => {
                                    if (ventaSeleccionada?.estado !== 'ANULADA') {
                                        e.target.style.backgroundColor = '#f8d7da';
                                        e.target.style.borderRadius = '4px';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                }}
                                title={ventaSeleccionada?.estado === 'ANULADA' ? 'Esta venta ya está anulada' : 'Anular esta venta'}
                            >
                                <i className="bi bi-x-circle me-2"></i>
                                {ventaSeleccionada?.estado === 'ANULADA' ? 'Ya Anulada' : 'Anular Venta'}
                            </Button>
                        </div>
                        <div className="d-flex gap-2">
                            <Button variant="outline-secondary" onClick={() => setShowVentaModal(false)}>
                                <i className="bi bi-x-lg me-1"></i>
                                Cerrar
                            </Button>
                            <Button style={{ backgroundColor: 'rgb(12, 44, 83)', borderColor: 'rgb(12, 44, 83)' }}>
                                <i className="bi bi-printer me-1"></i>
                                Imprimir Factura
                            </Button>
                        </div>
                    </div>
                </Modal.Footer>
            </Modal>

            {/* Mini Modal de confirmación para anular */}
            <Modal show={showAnularModal} onHide={() => setShowAnularModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Anulación</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-3">
                        ⚠️ <strong>¿Está seguro de anular esta venta?</strong>
                    </p>
                    <p className="text-muted small mb-3">
                        Esta acción marcará la venta como ANULADA y devolverá los productos al inventario.
                    </p>
                    <Form.Group>
                        <Form.Label>
                            Para confirmar, escriba <strong>SI</strong> en mayúsculas:
                        </Form.Label>
                        <Form.Control
                            type="text"
                            value={confirmacionAnular}
                            onChange={(e) => setConfirmacionAnular(e.target.value)}
                            placeholder="Escriba SI para confirmar"
                            autoFocus
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAnularModal(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleAnularVenta}
                        disabled={confirmacionAnular.toUpperCase() !== 'SI'}
                    >
                        Confirmar Anulación
                    </Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
};

// Componente principal que provee el CajeroContext
const CajaScreen = () => {
    return (
        <CajeroProvider>
            <CajaScreenContent />
        </CajeroProvider>
    );
};

export default CajaScreen;