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
    const { cajeroLogueado, isAuthenticated } = useCajero();
    const [cajero, setCajero] = useState('jose');
    const [banco, setBanco] = useState('Caja General');
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


    const [loadingMovimientos, setLoadingMovimientos] = useState(false);

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
                // Filtrar ventas del día actual Y que NO estén anuladas
                const ventasHoy = ventasData.filter(venta => {
                    // Usar solo la parte de fecha sin conversión UTC
                    const fechaVenta = venta.fecha.split('T')[0];
                    const esDelDia = fechaVenta === fechaConsulta;
                    const noEstaAnulada = venta.estado !== 'ANULADA';

                    return esDelDia && noEstaAnulada;
                });

                console.log('📊 Ventas del día encontradas (sin anuladas):', ventasHoy.length);

                // Contar ventas anuladas para información
                const ventasAnuladas = ventasData.filter(venta => {
                    const fechaVenta = venta.fecha.split('T')[0];
                    return fechaVenta === fechaConsulta && venta.estado === 'ANULADA';
                });

                if (ventasAnuladas.length > 0) {
                    console.log('🚫 Ventas anuladas excluidas del arqueo:', ventasAnuladas.length);
                }

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

                const resumenCalculado = {
                    fecha: fechaConsulta,
                    totalVentas: ventasHoy.length,
                    resumenPorMetodo,
                    totalGeneral: Object.values(resumenPorMetodo).reduce((sum, val) => sum + val, 0)
                };

                console.log('✅ Resumen calculado manualmente:', resumenCalculado);
                console.log('💰 EFECTIVO CALCULADO:', resumenPorMetodo.efectivo);
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
                    console.log('📅 Ya existe arqueo para hoy, mostrando valores actuales');

                    // Si ya hay arqueo para hoy, mostrar esos valores
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

        const totales = ventasData.reduce((acc, venta) => {
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

    // Anular venta
    const handleAnularVenta = async (ventaId) => {
        if (!ventaId) return;

        const confirmar = window.confirm(
            '⚠️ ¿Está seguro de anular esta venta?\n\n' +
            'Esta acción:\n' +
            '• Marcará la venta como ANULADA\n' +
            '• Devolverá TODOS los productos al inventario\n' +
            '• Actualizará las existencias automáticamente\n' +
            '• No se puede deshacer\n\n' +
            '¿Desea continuar?'
        );

        if (!confirmar) return;

        try {
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
            alert('❌ Error al anular la venta. Intente nuevamente.');
        }
    };

    // Agregar movimiento de caja
    const handleAgregarMovimiento = () => {
        if (!montoMovimiento || !conceptoMovimiento) {
            alert('⚠️ Debe ingresar monto y concepto del movimiento');
            return;
        }

        const monto = parseFloat(montoMovimiento);
        if (isNaN(monto) || monto <= 0) {
            alert('⚠️ El monto debe ser un número válido mayor a 0');
            return;
        }

        const nuevoMovimiento = {
            id: Date.now(),
            tipo: tipoMovimiento,
            monto: tipoMovimiento === 'EGRESO' ? -monto : monto,
            concepto: conceptoMovimiento,
            fecha: new Date().toISOString(),
            hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            cajero: cajero
        };

        setMovimientosCaja(prev => [...prev, nuevoMovimiento]);

        // Limpiar formulario
        setMontoMovimiento('');
        setConceptoMovimiento('');
        setShowNuevoMovimiento(false);

        console.log('💰 Movimiento agregado:', nuevoMovimiento);
        alert(`✅ ${tipoMovimiento} de ${formatCurrency(monto)} registrado exitosamente`);
    };

    // Calcular total de movimientos de caja
    const totalMovimientosCaja = movimientosCaja.reduce((sum, mov) => sum + mov.monto, 0);

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
                            <div class="summary-item">
                                <span>Promedio por Venta:</span>
                                <span>${(ventasValidas?.length || 0) > 0 ? formatCurrency(metricasValidas.totalFacturado / ventasValidas.length) : '$0'}</span>
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
        const validacionNumero = cajaValidaciones.validarFormatoNumero(valor);

        if (validacionNumero.esValido) {
            setValoresCaja(prev => {
                const nuevosValores = {
                    ...prev,
                    [metodo]: validacionNumero.valor
                };

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
                totalSistema,
                totalCaja,
                totalDiferencia,
                observaciones
            };

            // Validar que no exista arqueo para hoy
            if (ultimoArqueo) {
                const fechaUltimoArqueo = ultimoArqueo.fecha; // Ya viene en formato YYYY-MM-DD
                const fechaHoy = getFechaLocal();

                if (fechaUltimoArqueo === fechaHoy) {
                    const confirmar = window.confirm(
                        `⚠️ Ya existe un arqueo para hoy (${fechaHoy})\n\n` +
                        `Último arqueo: ${ultimoArqueo.cajero} - ${ultimoArqueo.banco}\n` +
                        `Diferencia anterior: ${formatCurrency(ultimoArqueo.total_diferencia || 0)}\n\n` +
                        `¿Desea actualizar el arqueo existente?`
                    );

                    if (!confirmar) {
                        return;
                    }
                }
            }

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
• Total Sistema: ${formatCurrency(totalSistema)}
• Total Caja: ${formatCurrency(totalCaja)}
• Diferencia: ${formatCurrency(totalDiferencia)}
• Cajero: ${cajero}
• Fecha: ${fechaConsulta}`;

            // Mostrar mensaje de éxito más elegante
            setError(null);
            setValidacion({
                esValido: true,
                mensaje: `✅ Arqueo guardado exitosamente - Diferencia: ${formatCurrency(totalDiferencia)}`,
                tipo: 'success'
            });

            // Recargar el último arqueo para actualizar la interfaz
            await cargarUltimoArqueo();

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
    }, [fechaConsulta, cajero]);

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
                    <Alert variant="info" className="mb-4">
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
                                    <Form.Select
                                        value={cajero}
                                        onChange={(e) => setCajero(e.target.value)}
                                        size="sm"
                                        className="form-control-compact"
                                    >
                                        <option value="jose">jose</option>
                                        <option value="Wilson">Wilson</option>
                                    </Form.Select>
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
                            <Row className="text-center">
                                <Col md={3}>
                                    <div className="stat-card">
                                        <div className="stat-value text-primary">
                                            {resumenVentas.totalVentas}
                                        </div>
                                        <div className="stat-label">Total Ventas</div>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="stat-card">
                                        <div className="stat-value text-success">
                                            {formatCurrency(resumenVentas.totalGeneral)}
                                        </div>
                                        <div className="stat-label">Monto Total</div>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="stat-card">
                                        <div className="stat-value text-info">
                                            {formatCurrency(resumenVentas.totalGeneral / resumenVentas.totalVentas || 0)}
                                        </div>
                                        <div className="stat-label">Promedio por Venta</div>
                                    </div>
                                </Col>
                                <Col md={3}>
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
                                                                <td className={`text-end ${mov.monto > 0 ? 'text-success' : 'text-danger'}`}>
                                                                    {formatCurrency(Math.abs(mov.monto))}
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
                                                    ventasDelDia.reduce((acc, venta) => {
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
                                                defaultValue={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Fecha Hasta:</Form.Label>
                                            <Form.Control
                                                type="date"
                                                defaultValue={fechaConsulta}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="d-flex gap-2 mb-4">
                                    <Button variant="info">
                                        <i className="bi bi-search me-2"></i>
                                        Consultar Historial
                                    </Button>
                                    <Button variant="outline-primary">
                                        <i className="bi bi-calendar-week me-2"></i>
                                        Última Semana
                                    </Button>
                                    <Button variant="outline-success">
                                        <i className="bi bi-calendar-month me-2"></i>
                                        Último Mes
                                    </Button>
                                </div>

                                {/* Tabla de historial */}
                                <Table striped bordered hover>
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
                                        {/* Datos de ejemplo */}
                                        <tr>
                                            <td>{new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}</td>
                                            <td>jose</td>
                                            <td className="text-end">{formatCurrency(4500000)}</td>
                                            <td className="text-end">{formatCurrency(4498000)}</td>
                                            <td className="text-end text-danger">{formatCurrency(-2000)}</td>
                                            <td className="text-center">
                                                <Badge bg="success">Cerrado</Badge>
                                            </td>
                                            <td className="text-center">
                                                <Button variant="outline-primary" size="sm" className="me-1">
                                                    <i className="bi bi-eye"></i>
                                                </Button>
                                                <Button variant="outline-secondary" size="sm">
                                                    <i className="bi bi-printer"></i>
                                                </Button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>{new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}</td>
                                            <td>Wilson</td>
                                            <td className="text-end">{formatCurrency(3800000)}</td>
                                            <td className="text-end">{formatCurrency(3800000)}</td>
                                            <td className="text-end text-success">{formatCurrency(0)}</td>
                                            <td className="text-center">
                                                <Badge bg="success">Cerrado</Badge>
                                            </td>
                                            <td className="text-center">
                                                <Button variant="outline-primary" size="sm" className="me-1">
                                                    <i className="bi bi-eye"></i>
                                                </Button>
                                                <Button variant="outline-secondary" size="sm">
                                                    <i className="bi bi-printer"></i>
                                                </Button>
                                            </td>
                                        </tr>
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
                                                <div className="h5 text-primary mb-1">7</div>
                                                <small className="text-muted">Arqueos Realizados</small>
                                            </Col>
                                            <Col md={3}>
                                                <div className="h5 text-success mb-1">5</div>
                                                <small className="text-muted">Sin Diferencias</small>
                                            </Col>
                                            <Col md={3}>
                                                <div className="h5 text-warning mb-1">2</div>
                                                <small className="text-muted">Con Diferencias</small>
                                            </Col>
                                            <Col md={3}>
                                                <div className="h5 text-info mb-1">{formatCurrency(28500000)}</div>
                                                <small className="text-muted">Total Manejado</small>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Card.Body>
                        </Card>
                    </Tab>


                </Tabs>

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
                                    disabled={guardandoArqueo || (validacion && !validacion.esValido)}
                                >
                                    {guardandoArqueo ? (
                                        <Spinner animation="border" size="sm" className="me-2" />
                                    ) : (
                                        <i className="bi bi-save me-2"></i>
                                    )}
                                    Guardar Arqueo
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
            <Modal show={showMovimientosBancarios} onHide={() => setShowMovimientosBancarios(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-arrow-left-right me-2"></i>
                        Movimientos de Caja - {getFechaLocal().split('-').reverse().join('/')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <>
                        {/* Formulario para agregar nuevo movimiento */}
                        <Card className="mb-4">
                            <Card.Header className="bg-primary text-white">
                                <h6 className="mb-0">
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Agregar Nuevo Movimiento
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={3}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Tipo</Form.Label>
                                            <Form.Select
                                                value={tipoMovimiento}
                                                onChange={(e) => setTipoMovimiento(e.target.value)}
                                            >
                                                <option value="INGRESO">Ingreso</option>
                                                <option value="EGRESO">Egreso</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Monto</Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="0.00"
                                                value={montoMovimiento}
                                                onChange={(e) => setMontoMovimiento(e.target.value)}
                                                min="0"
                                                step="0.01"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
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
                                    <Col md={2} className="d-flex align-items-end">
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
                                <Card className="border-0 bg-success text-white">
                                    <Card.Body className="text-center py-2">
                                        <div className="h5 mb-1">
                                            {formatCurrency(
                                                movimientosCaja
                                                    .filter(mov => mov.monto > 0)
                                                    .reduce((sum, mov) => sum + mov.monto, 0)
                                            )}
                                        </div>
                                        <small>Total Ingresos</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="border-0 bg-danger text-white">
                                    <Card.Body className="text-center py-2">
                                        <div className="h5 mb-1">
                                            {formatCurrency(
                                                Math.abs(movimientosCaja
                                                    .filter(mov => mov.monto < 0)
                                                    .reduce((sum, mov) => sum + mov.monto, 0))
                                            )}
                                        </div>
                                        <small>Total Egresos</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="border-0 bg-primary text-white">
                                    <Card.Body className="text-center py-2">
                                        <div className="h5 mb-1">
                                            {formatCurrency(totalMovimientosCaja)}
                                        </div>
                                        <small>Saldo Neto</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Información del cajero */}
                        <Alert variant="info" className="mb-3">
                            <i className="bi bi-info-circle me-2"></i>
                            <strong>Cajero:</strong> {cajero} |
                            <strong> Fecha:</strong> {getFechaLocal().split('-').reverse().join('/')} |
                            <strong> Total movimientos:</strong> {movimientosCaja?.length || 0}
                        </Alert>

                        {/* Tabla de movimientos */}
                        {(movimientosCaja?.length || 0) > 0 ? (
                            <Table striped bordered hover size="sm">
                                <thead className="table-dark">
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
                                    {movimientosCaja.map((movimiento, index) => {
                                        const saldoAcumulado = movimientosCaja
                                            .slice(0, index + 1)
                                            .reduce((sum, mov) => sum + mov.monto, 0);

                                        return (
                                            <tr key={movimiento.id || index}>
                                                <td className="font-monospace">{movimiento.hora}</td>
                                                <td>
                                                    <Badge bg={movimiento.tipo === 'INGRESO' ? 'success' : 'danger'}>
                                                        {movimiento.tipo}
                                                    </Badge>
                                                </td>
                                                <td>{movimiento.concepto}</td>
                                                <td className={`text-end fw-bold ${movimiento.monto > 0 ? 'text-success' : 'text-danger'}`}>
                                                    {movimiento.monto > 0 ? '+' : ''}{formatCurrency(Math.abs(movimiento.monto))}
                                                </td>
                                                <td className="text-end fw-bold">
                                                    {formatCurrency(saldoAcumulado)}
                                                </td>
                                                <td className="text-center">
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (window.confirm('¿Está seguro de eliminar este movimiento?')) {
                                                                setMovimientosCaja(prev => prev.filter(mov => mov.id !== movimiento.id));
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
                                    <tr className="table-warning">
                                        <td colSpan="3" className="text-end fw-bold">SALDO FINAL:</td>
                                        <td className="text-end fw-bold">
                                            {formatCurrency(totalMovimientosCaja)}
                                        </td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </Table>
                        ) : (
                            <div className="text-center text-muted p-4">
                                <i className="bi bi-arrow-left-right fs-1 d-block mb-2"></i>
                                <p>No hay movimientos de caja registrados para el día {getFechaLocal().split('-').reverse().join('/')}</p>
                                <small>Use el formulario superior para agregar ingresos o egresos</small>
                            </div>
                        )}

                        {/* Nota informativa */}
                        <Alert variant="light" className="mt-3 mb-0">
                            <small className="text-muted">
                                <i className="bi bi-lightbulb me-1"></i>
                                <strong>Nota:</strong> Los movimientos de caja registrados aquí se incluirán automáticamente
                                en el cálculo del arqueo de caja para determinar el saldo real esperado.
                            </small>
                        </Alert>
                    </>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowMovimientosBancarios(false)}>
                        <i className="bi bi-x-lg me-1"></i>
                        Cerrar
                    </Button>
                    <Button variant="primary" disabled={(movimientosCaja?.length || 0) === 0}>
                        <i className="bi bi-printer me-1"></i>
                        Imprimir Movimientos
                    </Button>
                    <Button variant="success" disabled={(movimientosCaja?.length || 0) === 0}>
                        <i className="bi bi-file-earmark-excel me-1"></i>
                        Exportar Excel
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
                                        <Card.Header className="bg-primary text-white">
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
                                <Card.Header className="bg-info text-white">
                                    <strong><i className="bi bi-basket me-2"></i>Productos Vendidos</strong>
                                </Card.Header>
                                <Card.Body>
                                    {ventaSeleccionada?.detalles && (ventaSeleccionada.detalles?.length || 0) > 0 ? (
                                        <Table striped bordered hover size="sm" responsive>
                                            <thead className="table-dark">
                                                <tr>
                                                    <th style={{ minWidth: '200px' }}>Producto</th>
                                                    <th className="text-center" style={{ width: '100px' }}>Cantidad</th>
                                                    <th className="text-end" style={{ width: '120px' }}>Precio Unit.</th>
                                                    <th className="text-end" style={{ width: '120px' }}>Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ventaSeleccionada.detalles.map((detalle, index) => (
                                                    <tr key={index}>
                                                        <td><strong>{detalle.producto_nombre}</strong></td>
                                                        <td className="text-center">
                                                            <Badge bg="secondary">{detalle.cantidad}</Badge>
                                                        </td>
                                                        <td className="text-end">{formatCurrency(parseFloat(detalle.precio_unitario || 0))}</td>
                                                        <td className="text-end fw-bold text-success">
                                                            {formatCurrency(parseFloat(detalle.subtotal || 0))}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="table-warning">
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
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleAnularVenta(ventaSeleccionada?.id)}
                                disabled={ventaSeleccionada?.estado === 'ANULADA'}
                                title={ventaSeleccionada?.estado === 'ANULADA' ? 'Esta venta ya está anulada' : 'Anular esta venta'}
                            >
                                <i className="bi bi-x-circle me-1"></i>
                                {ventaSeleccionada?.estado === 'ANULADA' ? 'Ya Anulada' : 'Anular Venta'}
                            </Button>
                        </div>
                        <div className="d-flex gap-2">
                            <Button variant="outline-secondary" onClick={() => setShowVentaModal(false)}>
                                <i className="bi bi-x-lg me-1"></i>
                                Cerrar
                            </Button>
                            <Button variant="primary">
                                <i className="bi bi-printer me-1"></i>
                                Imprimir Factura
                            </Button>
                        </div>
                    </div>
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