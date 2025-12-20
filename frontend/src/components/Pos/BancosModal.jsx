/**
 * BancosModal.jsx
 * Modal para mostrar reporte de ventas por transferencia (NEQUI, DAVIPLATA, TARJETA, OTROS)
 * Con filtros por período: DÍA, SEMANA, MES
 * Diseño moderno y profesional
 */

import React, { useState, useEffect } from 'react';
import { Modal, Spinner } from 'react-bootstrap';
import { ventaService } from '../../services/api';

// Estilos inline para el diseño profesional
const styles = {
    modal: {
        borderRadius: '0.75rem',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    header: {
        backgroundColor: 'transparent',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #dee2e6'
    },
    headerTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        color: '#0056b3'
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: '#6b7280',
        cursor: 'pointer',
        padding: '0.25rem',
        transition: 'color 0.2s'
    },
    body: {
        padding: '1.5rem 2rem',
        backgroundColor: '#fff'
    },
    filterSection: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid #dee2e6',
        marginBottom: '2rem'
    },
    filterGroup: {
        display: 'flex',
        backgroundColor: '#f1f5f9',
        padding: '0.25rem',
        borderRadius: '0.5rem'
    },
    filterBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        border: 'none',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    filterBtnActive: {
        backgroundColor: '#163864',
        color: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    filterBtnInactive: {
        backgroundColor: 'transparent',
        color: '#6b7280'
    },
    dateLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: '#f8fafc',
        padding: '0.375rem 0.75rem',
        borderRadius: '9999px',
        border: '1px solid #e2e8f0',
        fontSize: '0.875rem',
        color: '#64748b'
    },
    cardsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
    },
    card: {
        padding: '1.25rem',
        borderRadius: '0 0.5rem 0.5rem 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.2s',
        borderLeft: '4px solid'
    },
    cardNequi: {
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        borderLeftColor: '#007bff'
    },
    cardDaviplata: {
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        borderLeftColor: '#dc3545'
    },
    cardTarjeta: {
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        borderLeftColor: '#28a745'
    },
    cardOtros: {
        backgroundColor: 'rgba(108, 117, 125, 0.1)',
        borderLeftColor: '#6c757d'
    },
    cardTitle: {
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontSize: '0.875rem',
        marginBottom: '0.25rem'
    },
    cardValue: {
        fontSize: '1.875rem',
        fontWeight: '700',
        color: '#1f2937'
    },
    totalBar: {
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        padding: '1rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#1f2937',
        marginBottom: '2rem'
    },
    totalLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '1.125rem',
        fontWeight: '500',
        color: '#374151'
    },
    totalBadge: {
        backgroundColor: '#163864',
        color: 'white',
        padding: '0.375rem 1rem',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '700'
    },
    emptyState: {
        padding: '3rem 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af'
    },
    emptyIcon: {
        backgroundColor: '#f3f4f6',
        padding: '1rem',
        borderRadius: '9999px',
        marginBottom: '0.75rem'
    },
    footer: {
        backgroundColor: '#f8fafc',
        padding: '1rem 1.5rem',
        borderTop: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.75rem'
    },
    btnSecondary: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 1.25rem',
        borderRadius: '0.5rem',
        border: '1px solid #d1d5db',
        backgroundColor: 'transparent',
        color: '#374151',
        fontWeight: '500',
        fontSize: '0.875rem',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    btnPrimary: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 1.25rem',
        borderRadius: '0.5rem',
        border: 'none',
        backgroundColor: '#007bff',
        color: 'white',
        fontWeight: '500',
        fontSize: '0.875rem',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0,123,255,0.2)',
        transition: 'all 0.2s'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.875rem'
    },
    tableHeader: {
        borderBottom: '2px solid #e5e7eb',
        color: '#4b5563',
        backgroundColor: 'transparent'
    },
    tableHeaderCell: {
        padding: '0.75rem 1rem',
        textAlign: 'left',
        fontWeight: '600'
    },
    tableRow: {
        borderBottom: '1px solid #e5e7eb'
    },
    tableCell: {
        padding: '0.75rem 1rem'
    },
    badge: {
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'uppercase'
    }
};

export default function BancosModal({ show, onClose }) {
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [periodo, setPeriodo] = useState('dia');
    const [resumen, setResumen] = useState({
        NEQUI: 0,
        DAVIPLATA: 0,
        TARJETA: 0,
        OTROS: 0,
        total: 0,
        cantidad: 0
    });

    const getFechasPeriodo = () => {
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = hoy.getMonth();
        const day = hoy.getDate();

        let fechaInicio, fechaFin;

        switch (periodo) {
            case 'semana':
                const diaSemana = hoy.getDay();
                const diasAlLunes = diaSemana === 0 ? 6 : diaSemana - 1;
                fechaInicio = new Date(year, month, day - diasAlLunes);
                fechaFin = new Date(year, month, day);
                break;
            case 'mes':
                fechaInicio = new Date(year, month, 1);
                fechaFin = new Date(year, month, day);
                break;
            case 'dia':
            default:
                fechaInicio = new Date(year, month, day);
                fechaFin = new Date(year, month, day);
                break;
        }

        const formatFecha = (fecha) => {
            const y = fecha.getFullYear();
            const m = String(fecha.getMonth() + 1).padStart(2, '0');
            const d = String(fecha.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        return {
            inicio: formatFecha(fechaInicio),
            fin: formatFecha(fechaFin)
        };
    };

    const cargarVentas = async () => {
        setLoading(true);
        try {
            const { inicio, fin } = getFechasPeriodo();
            const todasVentas = await ventaService.getAll();

            if (todasVentas && Array.isArray(todasVentas)) {
                const metodosTransferencia = ['TRANSF', 'T_CREDITO', 'TARJETA'];

                const ventasFiltradas = todasVentas.filter(venta => {
                    const fechaVenta = venta.fecha.split('T')[0];
                    const esEnPeriodo = fechaVenta >= inicio && fechaVenta <= fin;
                    const esTransferencia = metodosTransferencia.includes(venta.metodo_pago?.toUpperCase());
                    const noAnulada = venta.estado !== 'ANULADA';

                    return esEnPeriodo && esTransferencia && noAnulada;
                });

                setVentas(ventasFiltradas);

                const nuevoResumen = {
                    NEQUI: 0,
                    DAVIPLATA: 0,
                    TARJETA: 0,
                    OTROS: 0,
                    total: 0,
                    cantidad: 0
                };

                ventasFiltradas.forEach(venta => {
                    const tipoBanco = (venta.banco || 'OTROS').toUpperCase();
                    const total = parseFloat(venta.total) || 0;

                    if (tipoBanco === 'NEQUI') {
                        nuevoResumen.NEQUI += total;
                    } else if (tipoBanco === 'DAVIPLATA') {
                        nuevoResumen.DAVIPLATA += total;
                    } else if (tipoBanco === 'TARJETA') {
                        nuevoResumen.TARJETA += total;
                    } else {
                        nuevoResumen.OTROS += total;
                    }

                    nuevoResumen.total += total;
                    nuevoResumen.cantidad += 1;
                });

                setResumen(nuevoResumen);
            }
        } catch (error) {
            console.error('Error cargando ventas:', error);
            setVentas([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show) {
            cargarVentas();
        }
    }, [show, periodo]);

    const formatCurrency = (amount) => {
        return `$${parseFloat(amount || 0).toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })}`;
    };

    const getPeriodoLabel = () => {
        const { inicio, fin } = getFechasPeriodo();
        if (periodo === 'dia') {
            return `Hoy (${inicio.split('-').reverse().join('/')})`;
        } else if (periodo === 'semana') {
            return `Semana (${inicio.split('-').reverse().join('/')} - ${fin.split('-').reverse().join('/')})`;
        } else {
            return `Mes (${inicio.split('-').reverse().join('/')} - ${fin.split('-').reverse().join('/')})`;
        }
    };

    const getBadgeStyle = (tipo) => {
        const baseStyle = { ...styles.badge };
        switch (tipo) {
            case 'NEQUI': return { ...baseStyle, backgroundColor: 'rgba(0,123,255,0.1)', color: '#007bff' };
            case 'DAVIPLATA': return { ...baseStyle, backgroundColor: 'rgba(220,53,69,0.1)', color: '#dc3545' };
            case 'TARJETA': return { ...baseStyle, backgroundColor: 'rgba(40,167,69,0.1)', color: '#28a745' };
            default: return { ...baseStyle, backgroundColor: 'rgba(108,117,125,0.1)', color: '#6c757d' };
        }
    };

    return (
        <Modal
            show={show}
            onHide={onClose}
            size="lg"
            centered
            scrollable={true}
            contentClassName="border-0"
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            <div style={styles.modal}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerTitle}>
                        <span className="material-icons" style={{ fontSize: '1.5rem' }}>account_balance</span>
                        <h5 style={{ margin: 0, fontWeight: '600', letterSpacing: '0.025em' }}>Reporte de Transferencias</h5>
                    </div>
                    <button
                        onClick={onClose}
                        style={styles.closeBtn}
                        onMouseOver={(e) => e.target.style.color = '#1f2937'}
                        onMouseOut={(e) => e.target.style.color = '#6b7280'}
                    >
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Body */}
                <div style={styles.body}>
                    {/* Filtros */}
                    <div style={styles.filterSection}>
                        <div style={styles.filterGroup}>
                            {[
                                { id: 'dia', icon: 'calendar_today', label: 'Día' },
                                { id: 'semana', icon: 'date_range', label: 'Semana' },
                                { id: 'mes', icon: 'calendar_month', label: 'Mes' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setPeriodo(filter.id)}
                                    style={{
                                        ...styles.filterBtn,
                                        ...(periodo === filter.id ? styles.filterBtnActive : styles.filterBtnInactive)
                                    }}
                                >
                                    <span className="material-icons" style={{ fontSize: '1.125rem' }}>{filter.icon}</span>
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                        <div style={styles.dateLabel}>
                            <span className="material-icons" style={{ fontSize: '0.875rem', color: '#9ca3af' }}>schedule</span>
                            {getPeriodoLabel()}
                        </div>
                    </div>

                    {/* Cards de Resumen */}
                    <div style={styles.cardsGrid}>
                        <div style={{ ...styles.card, ...styles.cardNequi }}>
                            <h3 style={{ ...styles.cardTitle, color: '#007bff' }}>Nequi</h3>
                            <p style={styles.cardValue}>{formatCurrency(resumen.NEQUI)}</p>
                        </div>
                        <div style={{ ...styles.card, ...styles.cardDaviplata }}>
                            <h3 style={{ ...styles.cardTitle, color: '#dc3545' }}>Daviplata</h3>
                            <p style={styles.cardValue}>{formatCurrency(resumen.DAVIPLATA)}</p>
                        </div>
                        <div style={{ ...styles.card, ...styles.cardTarjeta }}>
                            <h3 style={{ ...styles.cardTitle, color: '#28a745' }}>Tarjeta</h3>
                            <p style={styles.cardValue}>{formatCurrency(resumen.TARJETA)}</p>
                        </div>
                        <div style={{ ...styles.card, ...styles.cardOtros }}>
                            <h3 style={{ ...styles.cardTitle, color: '#6c757d' }}>Otros</h3>
                            <p style={styles.cardValue}>{formatCurrency(resumen.OTROS)}</p>
                        </div>
                    </div>

                    {/* Total Bar */}
                    <div style={styles.totalBar}>
                        <div style={styles.totalLabel}>
                            <span className="material-icons" style={{ color: '#163864' }}>analytics</span>
                            <span>Total Transferencias: <span style={{ fontWeight: '600' }}>{formatCurrency(resumen.total)}</span></span>
                        </div>
                        <div style={styles.totalBadge}>
                            {resumen.cantidad} ventas
                        </div>
                    </div>

                    {/* Contenido */}
                    {loading ? (
                        <div style={styles.emptyState}>
                            <Spinner animation="border" variant="primary" />
                            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>Cargando ventas...</p>
                        </div>
                    ) : ventas.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>
                                <span className="material-icons" style={{ fontSize: '2.5rem', color: '#d1d5db' }}>inbox</span>
                            </div>
                            <p style={{ fontSize: '0.875rem' }}>No hay registros de transferencias para el período seleccionado.</p>
                        </div>
                    ) : (
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table style={styles.table}>
                                <thead style={styles.tableHeader}>
                                    <tr>
                                        <th style={styles.tableHeaderCell}>Fecha</th>
                                        <th style={styles.tableHeaderCell}>Cliente</th>
                                        <th style={styles.tableHeaderCell}>Tipo</th>
                                        <th style={{ ...styles.tableHeaderCell, textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ventas.map((venta, idx) => (
                                        <tr key={venta.id || idx} style={styles.tableRow}>
                                            <td style={styles.tableCell}>
                                                {new Date(venta.fecha).toLocaleDateString('es-CO', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td style={styles.tableCell}>{venta.cliente || 'CONSUMIDOR FINAL'}</td>
                                            <td style={styles.tableCell}>
                                                <span style={getBadgeStyle(venta.banco?.toUpperCase() || 'OTROS')}>
                                                    {venta.banco || 'OTROS'}
                                                </span>
                                            </td>
                                            <td style={{ ...styles.tableCell, textAlign: 'right', fontWeight: '600' }}>
                                                {formatCurrency(venta.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <button
                        onClick={onClose}
                        style={styles.btnSecondary}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        <span className="material-icons" style={{ fontSize: '1.125rem' }}>close</span>
                        Cerrar
                    </button>
                    <button
                        onClick={cargarVentas}
                        style={styles.btnPrimary}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#0069d9'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
                    >
                        <span className="material-icons" style={{ fontSize: '1.125rem' }}>refresh</span>
                        Actualizar
                    </button>
                </div>
            </div>
        </Modal>
    );
}
