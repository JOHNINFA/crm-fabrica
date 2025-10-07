import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Table, Spinner, Alert, Badge, Tabs, Tab, Modal } from 'react-bootstrap';
import { cajaService } from '../services/cajaService';
import { ventaService } from '../services/api';
import { cajaValidaciones } from '../components/Pos/CajaValidaciones';
import CajaReportes from '../components/Pos/CajaReportes';
import '../styles/CajaScreen.css';

const CajaScreen = () => {
    const navigate = useNavigate();
    const [cajero, setCajero] = useState('jose');
    const [banco, setBanco] = useState('Todos');
    const [fechaActual] = useState(new Date().toLocaleString('es-ES'));
    const [fechaConsulta] = useState(new Date().toISOString().split('T')[0]);

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
    const [showReportesModal, setShowReportesModal] = useState(false);

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

            if (ventasData && !ventasData.error) {
                // Filtrar ventas del día actual
                const ventasHoy = ventasData.filter(venta => {
                    const fechaVenta = new Date(venta.fecha).toISOString().split('T')[0];
                    return fechaVenta === fechaConsulta;
                });

                console.log('📊 Ventas del día encontradas:', ventasHoy.length);

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

                    console.log(`💰 Venta: ${venta.id}, Método: ${metodo}, Total: ${total}`);

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
            const ultimo = await cajaService.getUltimoArqueo(cajero);
            setUltimoArqueo(ultimo);
        } catch (error) {
            console.error('Error cargando último arqueo:', error);
        }
    };

    // Cargar ventas del día
    const cargarVentasDelDia = async () => {
        setLoadingVentas(true);
        try {
            console.log('🔄 Cargando ventas del día para:', fechaConsulta);

            // Usar el mismo endpoint que InformeVentasGeneral pero filtrado por fecha
            const ventasData = await ventaService.getAll();

            if (ventasData && !ventasData.error) {
                // Filtrar solo las ventas del día actual
                const ventasHoy = ventasData.filter(venta => {
                    const fechaVenta = new Date(venta.fecha).toISOString().split('T')[0];
                    return fechaVenta === fechaConsulta;
                });

                setVentasDelDia(ventasHoy);
                calcularMetricasVentas(ventasHoy);
                console.log('📊 Ventas del día cargadas:', ventasHoy.length);
            } else {
                console.error('Error al cargar ventas:', ventasData);
                setVentasDelDia([]);
            }
        } catch (error) {
            console.error('❌ Error cargando ventas del día:', error);
            setVentasDelDia([]);
        } finally {
            setLoadingVentas(false);
        }
    };

    // Calcular métricas de ventas
    const calcularMetricasVentas = (ventasData) => {
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

    // Mostrar movimientos bancarios
    const handleMovimientosBancos = async () => {
        await cargarMovimientosBancarios();
        setShowMovimientosBancarios(true);
    };

    // Generar comprobante diario de ventas
    const handleComprobanteDiario = () => {
        const fechaFormateada = new Date(fechaConsulta).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        const printContent = `
            <html>
                <head>
                    <title>Comprobante Diario de Ventas - ${fechaFormateada}</title>
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
                        <div>Fecha: ${fechaFormateada}</div>
                        <div>Cajero: ${cajero}</div>
                        <div>Banco: ${banco}</div>
                        <div>Generado: ${new Date().toLocaleString('es-ES')}</div>
                    </div>

                    <div class="section">
                        <h3>📊 RESUMEN GENERAL</h3>
                        <div class="summary-box">
                            <div class="summary-item">
                                <span>Total de Ventas:</span>
                                <span>${ventasDelDia.length}</span>
                            </div>
                            <div class="summary-item">
                                <span>Total Facturado:</span>
                                <span>${formatCurrency(metricasVentas.totalFacturado)}</span>
                            </div>
                            <div class="summary-item">
                                <span>Total Pagado:</span>
                                <span>${formatCurrency(metricasVentas.totalPagado)}</span>
                            </div>
                            <div class="summary-item">
                                <span>Promedio por Venta:</span>
                                <span>${ventasDelDia.length > 0 ? formatCurrency(metricasVentas.totalFacturado / ventasDelDia.length) : '$0'}</span>
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
            ventasDelDia.reduce((acc, venta) => {
                const metodo = venta.metodo_pago || 'efectivo';
                if (!acc[metodo]) acc[metodo] = { cantidad: 0, total: 0 };
                acc[metodo].cantidad += 1;
                acc[metodo].total += parseFloat(venta.total || 0);
                return acc;
            }, {})
        ).map(([metodo, datos]) => {
            const porcentaje = metricasVentas.totalFacturado > 0 ?
                (datos.total / metricasVentas.totalFacturado * 100).toFixed(1) : '0.0';
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
                                    <td class="text-center">${ventasDelDia.length}</td>
                                    <td class="text-right">${formatCurrency(metricasVentas.totalFacturado)}</td>
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
                                ${ventasDelDia.map((venta, index) => `
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
        return valoresCaja[metodo] - valoresSistema[metodo];
    };

    // Calcular totales
    const totalSistema = Object.values(valoresSistema).reduce((sum, val) => sum + val, 0);
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

            alert(mensaje);

            // Limpiar validaciones
            setValidacion(null);
            setRecomendaciones([]);

        } catch (error) {
            console.error('❌ Error guardando arqueo:', error);
            setError('Error al guardar el arqueo de caja: ' + error.message);
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
                        <Row className="align-items-center">
                            <Col md={6}>
                                <Row>
                                    <Col md={6}>
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
                                    <Col md={6}>
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
                                </Row>
                            </Col>
                            <Col md={6}>
                                <div className="d-flex justify-content-end gap-2">
                                    <Button
                                        variant="dark"
                                        size="sm"
                                        className="btn-compact"
                                        onClick={handleMovimientosBancos}
                                        disabled={loadingMovimientos}
                                    >
                                        {loadingMovimientos ? (
                                            <Spinner animation="border" size="sm" className="me-1" />
                                        ) : (
                                            <i className="bi bi-bank me-1"></i>
                                        )}
                                        Movimientos Bancos
                                    </Button>
                                    <Button
                                        variant="success"
                                        size="sm"
                                        className="btn-compact"
                                        onClick={handleComprobanteDiario}
                                        disabled={ventasDelDia.length === 0}
                                    >
                                        <i className="bi bi-currency-dollar me-1"></i>
                                        Comprobante Diario de ventas
                                    </Button>
                                    <Button variant="outline-primary" size="sm" className="btn-compact" onClick={handleRefrescarDatos}>
                                        <i className="bi bi-arrow-clockwise me-1"></i>
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
                                                    const fechaVenta = new Date(venta.fecha).toISOString().split('T')[0];
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
                                <h5 className="mb-0">
                                    <i className="bi bi-calculator me-2"></i>
                                    Control de Efectivo y Medios de Pago
                                </h5>
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
                                                            <span className={valorSistema > 0 ? 'fw-bold' : ''}>{formatCurrency(valorSistema)}</span>
                                                        </td>
                                                        <td className="text-center">
                                                            {!medio.soloSistema ? (
                                                                <Form.Control
                                                                    type="text"
                                                                    value={valorCaja.toLocaleString('es-CO')}
                                                                    onChange={(e) => handleInputChange(medio.key, e.target.value)}
                                                                    className="text-end caja-input-page"
                                                                    style={{ width: '110px', margin: '0 auto' }}
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
                                                {observaciones.length}/500 caracteres
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Recomendaciones */}
                                {recomendaciones.length > 0 && (
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
                                        Ventas del Día - {new Date(fechaConsulta).toLocaleDateString('es-ES')}
                                    </h5>
                                    <div className="d-flex gap-2">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={cargarVentasDelDia}
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
                                            {ventasDelDia.length} ventas
                                        </Badge>
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {/* Métricas rápidas */}
                                <Row className="mb-4">
                                    <Col md={3}>
                                        <Card className="border-0 bg-light">
                                            <Card.Body className="text-center py-2">
                                                <div className="h5 text-primary mb-1">{ventasDelDia.length}</div>
                                                <small className="text-muted">Total Ventas</small>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="border-0 bg-light">
                                            <Card.Body className="text-center py-2">
                                                <div className="h5 text-success mb-1">{formatCurrency(metricasVentas.totalFacturado)}</div>
                                                <small className="text-muted">Total Facturado</small>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="border-0 bg-light">
                                            <Card.Body className="text-center py-2">
                                                <div className="h5 text-info mb-1">{formatCurrency(metricasVentas.totalPagado)}</div>
                                                <small className="text-muted">Total Pagado</small>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="border-0 bg-light">
                                            <Card.Body className="text-center py-2">
                                                <div className="h5 text-warning mb-1">
                                                    {ventasDelDia.length > 0 ? formatCurrency(metricasVentas.totalFacturado / ventasDelDia.length) : '$0'}
                                                </div>
                                                <small className="text-muted">Promedio por Venta</small>
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
                                                {ventasDelDia.length > 0 ? (
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
                                                                <Badge bg={venta.estado === 'PAGADO' ? 'success' : 'warning'}>
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
                                                                No hay ventas registradas para el día {new Date(fechaConsulta).toLocaleDateString('es-ES')}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}

                                {/* Resumen por método de pago */}
                                {ventasDelDia.length > 0 && (
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

                    {/* Tab Reportes */}
                    <Tab eventKey="reportes" title="📈 Reportes">
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">
                                    <i className="bi bi-graph-up me-2"></i>
                                    Reportes y Estadísticas
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="mb-4">
                                    <Col md={8}>
                                        <p className="text-muted mb-3">
                                            Genera reportes detallados de ventas, movimientos bancarios y estadísticas del día.
                                        </p>
                                        <div className="d-flex gap-3">
                                            <Button
                                                variant="primary"
                                                size="lg"
                                                onClick={() => setShowReportesModal(true)}
                                            >
                                                <i className="bi bi-file-earmark-text me-2"></i>
                                                Generar Reporte Completo
                                            </Button>
                                            <Button variant="outline-success" size="lg">
                                                <i className="bi bi-file-earmark-excel me-2"></i>
                                                Exportar Excel
                                            </Button>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="bg-light p-3 rounded">
                                            <h6><i className="bi bi-info-circle me-2"></i>Información</h6>
                                            <small className="text-muted">
                                                Los reportes incluyen:
                                                <ul className="mt-2 mb-0">
                                                    <li>Resumen de ventas por método</li>
                                                    <li>Estadísticas por vendedor</li>
                                                    <li>Movimientos bancarios</li>
                                                    <li>Gráficos y análisis</li>
                                                </ul>
                                            </small>
                                        </div>
                                    </Col>
                                </Row>

                                {/* Resumen rápido */}
                                {resumenVentas && (
                                    <Card className="bg-light">
                                        <Card.Body>
                                            <h6 className="mb-3">
                                                <i className="bi bi-speedometer2 me-2"></i>
                                                Resumen Rápido del Día
                                            </h6>
                                            <Row className="text-center">
                                                <Col md={3}>
                                                    <div className="border-end">
                                                        <div className="h4 text-primary mb-1">
                                                            {resumenVentas.totalVentas}
                                                        </div>
                                                        <small className="text-muted">Ventas Realizadas</small>
                                                    </div>
                                                </Col>
                                                <Col md={3}>
                                                    <div className="border-end">
                                                        <div className="h4 text-success mb-1">
                                                            {formatCurrency(resumenVentas.totalGeneral)}
                                                        </div>
                                                        <small className="text-muted">Total Recaudado</small>
                                                    </div>
                                                </Col>
                                                <Col md={3}>
                                                    <div className="border-end">
                                                        <div className="h4 text-info mb-1">
                                                            {formatCurrency(valoresSistema.efectivo)}
                                                        </div>
                                                        <small className="text-muted">Efectivo Sistema</small>
                                                    </div>
                                                </Col>
                                                <Col md={3}>
                                                    <div className={`h4 mb-1 ${totalDiferencia < 0 ? 'text-danger' : totalDiferencia > 0 ? 'text-success' : 'text-secondary'}`}>
                                                        {formatCurrency(totalDiferencia)}
                                                    </div>
                                                    <small className="text-muted">Diferencia Total</small>
                                                </Col>
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
                                {validacion.errores.length} errores encontrados
                            </Badge>
                        )}
                    </div>
                )}
            </Container>

            {/* Modal de Movimientos Bancarios */}
            <Modal show={showMovimientosBancarios} onHide={() => setShowMovimientosBancarios(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-bank me-2"></i>
                        Movimientos Bancarios - {new Date(fechaConsulta).toLocaleDateString('es-ES')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingMovimientos ? (
                        <div className="text-center p-4">
                            <Spinner animation="border" className="me-2" />
                            <span>Cargando movimientos bancarios...</span>
                        </div>
                    ) : (
                        <>
                            {/* Resumen de movimientos */}
                            <Row className="mb-4">
                                <Col md={4}>
                                    <Card className="border-0 bg-success text-white">
                                        <Card.Body className="text-center py-2">
                                            <div className="h5 mb-1">
                                                {formatCurrency(
                                                    movimientosBancarios
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
                                                    Math.abs(movimientosBancarios
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
                                                {formatCurrency(
                                                    movimientosBancarios.reduce((sum, mov) => sum + mov.monto, 0)
                                                )}
                                            </div>
                                            <small>Saldo Neto</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Información del banco */}
                            <Alert variant="info" className="mb-3">
                                <i className="bi bi-info-circle me-2"></i>
                                <strong>Banco seleccionado:</strong> {banco} |
                                <strong> Fecha:</strong> {new Date(fechaConsulta).toLocaleDateString('es-ES')} |
                                <strong> Total movimientos:</strong> {movimientosBancarios.length}
                            </Alert>

                            {/* Tabla de movimientos */}
                            {movimientosBancarios.length > 0 ? (
                                <Table striped bordered hover size="sm">
                                    <thead className="table-dark">
                                        <tr>
                                            <th style={{ width: '80px' }}>Hora</th>
                                            <th style={{ width: '100px' }}>Tipo</th>
                                            <th>Concepto</th>
                                            <th className="text-end" style={{ width: '120px' }}>Monto</th>
                                            <th className="text-end" style={{ width: '120px' }}>Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movimientosBancarios.map((movimiento, index) => {
                                            const saldoAcumulado = movimientosBancarios
                                                .slice(0, index + 1)
                                                .reduce((sum, mov) => sum + mov.monto, 0);

                                            return (
                                                <tr key={movimiento.id || index}>
                                                    <td className="font-monospace">{movimiento.hora}</td>
                                                    <td>
                                                        <Badge bg={movimiento.tipo === 'Ingreso' ? 'success' : 'danger'}>
                                                            {movimiento.tipo}
                                                        </Badge>
                                                    </td>
                                                    <td>{movimiento.concepto}</td>
                                                    <td className={`text-end fw-bold ${movimiento.monto > 0 ? 'text-success' : 'text-danger'}`}>
                                                        {movimiento.monto > 0 ? '+' : ''}{formatCurrency(movimiento.monto)}
                                                    </td>
                                                    <td className="text-end fw-bold">
                                                        {formatCurrency(saldoAcumulado)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="table-warning">
                                            <td colSpan="3" className="text-end fw-bold">SALDO FINAL:</td>
                                            <td className="text-end fw-bold">
                                                {formatCurrency(movimientosBancarios.reduce((sum, mov) => sum + mov.monto, 0))}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            ) : (
                                <div className="text-center text-muted p-4">
                                    <i className="bi bi-bank fs-1 d-block mb-2"></i>
                                    <p>No hay movimientos bancarios registrados para el día {new Date(fechaConsulta).toLocaleDateString('es-ES')}</p>
                                    <small>Banco: {banco}</small>
                                </div>
                            )}

                            {/* Nota informativa */}
                            <Alert variant="light" className="mt-3 mb-0">
                                <small className="text-muted">
                                    <i className="bi bi-lightbulb me-1"></i>
                                    <strong>Nota:</strong> Los movimientos mostrados corresponden a las transacciones registradas
                                    en el sistema para el banco seleccionado en la fecha indicada.
                                </small>
                            </Alert>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowMovimientosBancarios(false)}>
                        <i className="bi bi-x-lg me-1"></i>
                        Cerrar
                    </Button>
                    <Button variant="primary" disabled={movimientosBancarios.length === 0}>
                        <i className="bi bi-printer me-1"></i>
                        Imprimir Movimientos
                    </Button>
                    <Button variant="success" disabled={movimientosBancarios.length === 0}>
                        <i className="bi bi-file-earmark-excel me-1"></i>
                        Exportar Excel
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Detalle de Venta */}
            <Modal show={showVentaModal} onHide={() => setShowVentaModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-receipt me-2"></i>
                        Detalle de Venta - {ventaSeleccionada?.numero_factura || 'N/A'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
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
                                                <Badge bg={ventaSeleccionada.estado === 'PAGADO' ? 'success' : 'warning'} className="ms-2">
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
                                    {ventaSeleccionada.detalles && ventaSeleccionada.detalles.length > 0 ? (
                                        <Table striped bordered hover size="sm">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th>Producto</th>
                                                    <th className="text-center">Cantidad</th>
                                                    <th className="text-end">Precio Unit.</th>
                                                    <th className="text-end">Subtotal</th>
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
                    <Button variant="outline-secondary" onClick={() => setShowVentaModal(false)}>
                        <i className="bi bi-x-lg me-1"></i>
                        Cerrar
                    </Button>
                    <Button variant="primary">
                        <i className="bi bi-printer me-1"></i>
                        Imprimir Factura
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Reportes */}
            <CajaReportes
                show={showReportesModal}
                onClose={() => setShowReportesModal(false)}
                fechaConsulta={fechaConsulta}
                cajero={cajero}
            />
        </div>
    );
};

export default CajaScreen;