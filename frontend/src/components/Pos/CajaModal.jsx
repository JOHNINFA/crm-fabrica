import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Spinner, Alert, Row, Col, Badge } from 'react-bootstrap';
import { cajaService } from '../../services/cajaService';
import { cajaValidaciones, AlertasValidacion, RecomendacionesCaja } from './CajaValidaciones';
import CajaReportes from './CajaReportes';
import './CajaModal.css';

const CajaModal = ({ show, onClose }) => {
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

    // Estados de carga y errores
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resumenVentas, setResumenVentas] = useState(null);

    // Estados adicionales
    const [observaciones, setObservaciones] = useState('');
    const [validacion, setValidacion] = useState(null);
    const [recomendaciones, setRecomendaciones] = useState([]);
    const [showReportes, setShowReportes] = useState(false);
    const [ultimoArqueo, setUltimoArqueo] = useState(null);
    const [guardandoArqueo, setGuardandoArqueo] = useState(false);

    // Cargar datos de ventas del día
    const cargarDatosVentas = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('🔄 Cargando datos de caja para:', fechaConsulta);

            const resumen = await cajaService.getResumenVentasDelDia(fechaConsulta);

            console.log('📊 Resumen de ventas cargado:', resumen);

            setResumenVentas(resumen);
            setValoresSistema(resumen.resumenPorMetodo);

        } catch (error) {
            console.error('❌ Error cargando datos de caja:', error);
            setError('Error al cargar los datos de ventas del día');

            // Usar datos de ejemplo si falla la API
            const datosEjemplo = {
                efectivo: 3543902.00,
                tarjetas: 0.00,
                transferencia: 1178314.00,
                consignacion: 0.00,
                qr: 0.00,
                rappipay: 6000.00,
                bonos: 30000.00
            };
            setValoresSistema(datosEjemplo);
        } finally {
            setLoading(false);
        }
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
            minimumFractionDigits: 2
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

            // Validar consistencia histórica
            if (ultimoArqueo) {
                const validacionHistorica = cajaValidaciones.validarConsistenciaHistorica(datosArqueo, ultimoArqueo);
                if (validacionHistorica.advertencias?.length > 0) {
                    const confirmar = window.confirm(
                        `Advertencias encontradas:\n${validacionHistorica.advertencias.join('\n')}\n\n¿Desea continuar?`
                    );
                    if (!confirmar) return;
                }
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

    // Cargar datos al abrir el modal
    useEffect(() => {
        if (show) {
            cargarDatosVentas();
            cargarUltimoArqueo();
        }
    }, [show, fechaConsulta, cajero]);

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
        <Modal show={show} onHide={onClose} size="xl" className="caja-modal" centered={false}>
            <Modal.Header closeButton className="caja-modal-header">
                <Modal.Title>
                    <div className="d-flex flex-column">
                        <h4 className="mb-1">
                            <i className="bi bi-cash-stack me-2"></i>
                            Arqueo de Caja
                        </h4>
                        <small className="text-muted">Fecha: {fechaActual}</small>
                    </div>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="caja-modal-body">
                {/* Alertas de validación */}
                <AlertasValidacion
                    validacion={validacion}
                    onClose={() => setValidacion(null)}
                />

                {/* Alerta de error */}
                {error && (
                    <Alert variant="danger" className="mb-3">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </Alert>
                )}

                {/* Información del último arqueo */}
                {ultimoArqueo && (
                    <Alert variant="info" className="mb-3">
                        <i className="bi bi-info-circle me-2"></i>
                        <strong>Último arqueo:</strong> {ultimoArqueo.fecha} -
                        Diferencia: {formatCurrency(ultimoArqueo.total_diferencia || 0)}
                    </Alert>
                )}

                {/* Controles superiores */}
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                    <div className="d-flex align-items-center gap-4">
                        <div className="d-flex align-items-center">
                            <label className="form-label me-2 mb-0 text-muted">Cajero:</label>
                            <Form.Select
                                size="sm"
                                value={cajero}
                                onChange={(e) => setCajero(e.target.value)}
                                style={{ width: '150px' }}
                            >
                                <option value="jose">jose</option>
                                <option value="Wilson">Wilson</option>
                            </Form.Select>
                        </div>
                        <div className="d-flex align-items-center">
                            <label className="form-label me-2 mb-0 text-muted">Bancos:</label>
                            <Form.Select
                                size="sm"
                                value={banco}
                                onChange={(e) => setBanco(e.target.value)}
                                style={{ width: '120px' }}
                            >
                                <option value="Todos">Todos</option>
                                <option value="Caja General">Caja General</option>
                                <option value="Bancolombia">Bancolombia</option>
                            </Form.Select>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <Button variant="outline-secondary" size="sm">
                            <i className="bi bi-trending-up me-1"></i>
                            Movimientos Bancos
                        </Button>
                        <Button variant="primary" size="sm">
                            <i className="bi bi-receipt me-1"></i>
                            Comprobante Diario
                        </Button>
                        <Button
                            variant="info"
                            size="sm"
                            onClick={() => setShowReportes(true)}
                        >
                            <i className="bi bi-graph-up me-1"></i>
                            Ver Reportes
                        </Button>
                        <Button
                            variant="link"
                            size="sm"
                            className="text-primary"
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
                    </div>
                </div>

                {/* Información de resumen */}
                {resumenVentas && (
                    <div className="mb-3 p-2 bg-light rounded">
                        <small className="text-muted">
                            <strong>Resumen del día:</strong> {resumenVentas.totalVentas} ventas por un total de {formatCurrency(resumenVentas.totalGeneral)}
                        </small>
                    </div>
                )}

                {/* Tabla de arqueo */}
                <div className="table-responsive">
                    <Table className="caja-table">
                        <thead>
                            <tr className="table-light">
                                <th style={{ width: '35%', padding: '1rem 0.75rem' }}>Medio de Pago</th>
                                <th style={{ width: '18%', padding: '1rem 0.75rem' }} className="text-center">Sistema</th>
                                <th style={{ width: '18%', padding: '1rem 0.75rem' }} className="text-center">Saldo en Caja</th>
                                <th style={{ width: '14%', padding: '1rem 0.75rem' }} className="text-center">Calculado</th>
                                <th style={{ width: '15%', padding: '1rem 0.75rem' }} className="text-center">Diferencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mediosPago.map((medio) => {
                                const diferencia = calcularDiferencia(medio.key);
                                const valorSistema = valoresSistema[medio.key];
                                const valorCaja = valoresCaja[medio.key];

                                return (
                                    <tr key={medio.key}>
                                        <td className={medio.destacado ? 'fw-bold' : ''}>
                                            {medio.label}
                                        </td>
                                        <td className="text-center">
                                            {medio.destacado ? (
                                                <span className="badge bg-primary fs-6 px-3 py-2">
                                                    {formatCurrency(valorSistema)}
                                                </span>
                                            ) : (
                                                <span className="fw-bold">{formatCurrency(valorSistema)}</span>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            {!medio.soloSistema ? (
                                                <Form.Control
                                                    type="text"
                                                    size="md"
                                                    value={valorCaja.toLocaleString('es-CO')}
                                                    onChange={(e) => handleInputChange(medio.key, e.target.value)}
                                                    className="text-end caja-input"
                                                    style={{ width: '150px', margin: '0 auto', fontSize: '0.95rem', padding: '0.5rem' }}
                                                />
                                            ) : (
                                                <span>-</span>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            {formatCurrency(valorCaja)}
                                        </td>
                                        <td className={`text-center ${diferencia < 0 ? 'text-danger' : diferencia > 0 ? 'text-success' : ''}`}>
                                            {!medio.soloSistema ? formatCurrency(diferencia) : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="table-secondary fw-bold">
                                <td>Totales:</td>
                                <td className="text-center">{formatCurrency(totalSistema)}</td>
                                <td className="text-center" colSpan="2">{formatCurrency(totalCaja)}</td>
                                <td className={`text-center ${totalDiferencia < 0 ? 'text-danger' : totalDiferencia > 0 ? 'text-success' : ''}`}>
                                    {formatCurrency(totalDiferencia)}
                                </td>
                            </tr>
                        </tfoot>
                    </Table>
                </div>

                {/* Resumen de estado */}
                <div className="mt-4 p-3 bg-light rounded">
                    <div className="row text-center">
                        <div className="col-md-4">
                            <div className="caja-stat">
                                <div className="caja-stat-value text-primary">
                                    {formatCurrency(totalSistema)}
                                </div>
                                <div className="caja-stat-label">Total Sistema</div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="caja-stat">
                                <div className="caja-stat-value text-info">
                                    {formatCurrency(totalCaja)}
                                </div>
                                <div className="caja-stat-label">Total en Caja</div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="caja-stat">
                                <div className={`caja-stat-value ${totalDiferencia < 0 ? 'text-danger' : totalDiferencia > 0 ? 'text-success' : 'text-secondary'}`}>
                                    {formatCurrency(totalDiferencia)}
                                </div>
                                <div className="caja-stat-label">Diferencia Total</div>
                            </div>
                        </div>
                    </div>
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
                                rows={3}
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                placeholder="Ingrese observaciones sobre diferencias, incidentes o notas importantes..."
                                maxLength={500}
                            />
                            <Form.Text className="text-muted">
                                {observaciones.length}/500 caracteres
                            </Form.Text>
                        </Form.Group>
                    </Col>
                </Row>

                {/* Recomendaciones */}
                <RecomendacionesCaja recomendaciones={recomendaciones} />
            </Modal.Body>

            <Modal.Footer className="caja-modal-footer">
                <div className="d-flex justify-content-between align-items-center w-100">
                    <div>
                        {/* Indicador de estado */}
                        {totalDiferencia !== 0 && (
                            <Badge
                                bg={Math.abs(totalDiferencia) > 50000 ? 'danger' : 'warning'}
                                className="me-2"
                            >
                                Diferencia: {formatCurrency(totalDiferencia)}
                            </Badge>
                        )}
                        {validacion && !validacion.esValido && (
                            <Badge bg="danger">
                                {validacion.errores.length} errores
                            </Badge>
                        )}
                    </div>

                    <div className="d-flex gap-2">
                        <Button variant="outline-secondary" onClick={onClose}>
                            <i className="bi bi-x-lg me-1"></i>
                            Cerrar
                        </Button>
                        <Button
                            variant="success"
                            onClick={handleGuardarArqueo}
                            disabled={guardandoArqueo || (validacion && !validacion.esValido)}
                        >
                            {guardandoArqueo ? (
                                <Spinner animation="border" size="sm" className="me-1" />
                            ) : (
                                <i className="bi bi-save me-1"></i>
                            )}
                            Guardar Arqueo
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => setShowReportes(true)}
                        >
                            <i className="bi bi-printer me-1"></i>
                            Imprimir Reporte
                        </Button>
                    </div>
                </div>
            </Modal.Footer>

            {/* Modal de Reportes */}
            <CajaReportes
                show={showReportes}
                onClose={() => setShowReportes(false)}
                fechaConsulta={fechaConsulta}
                cajero={cajero}
            />
        </Modal>
    );
};

export default CajaModal;