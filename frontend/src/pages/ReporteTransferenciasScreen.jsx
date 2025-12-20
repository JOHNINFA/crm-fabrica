
import React, { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import { ventaService } from '../services/api';

// Estilos inline del diseño (adaptados para pantalla completa)
const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        padding: '1rem', // Reducido de 2rem
        fontFamily: "'Inter', sans-serif"
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        maxWidth: '1200px',
        margin: '0 auto'
    },
    header: {
        backgroundColor: 'white',
        padding: '1rem 1.5rem', // Reducido
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e5e7eb'
    },
    headerTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#163864',
        fontSize: '1.25rem', // Reducido de 1.5rem
        fontWeight: '600'
    },
    filterSection: {
        padding: '1rem 1.5rem', // Reducido
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        borderBottom: '1px solid #f3f4f6'
    },
    filterGroup: {
        display: 'flex',
        backgroundColor: '#f1f5f9',
        padding: '0.2rem',
        borderRadius: '0.5rem'
    },
    filterBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 0.8rem', // Reducido
        borderRadius: '0.375rem',
        border: 'none',
        fontSize: '0.8rem', // Reducido
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
        gap: '0.4rem',
        backgroundColor: 'white',
        padding: '0.4rem 0.8rem', // Reducido
        borderRadius: '9999px',
        border: '1px solid #e2e8f0',
        fontSize: '0.8rem',
        color: '#64748b',
        fontWeight: '500'
    },
    content: {
        padding: '1.5rem' // Reducido de 2rem
    },
    cardsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
    },
    statCard: {
        padding: '1rem', // Reducido de 1.5rem
        borderRadius: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderLeft: '4px solid'
    },
    cardNequi: {
        backgroundColor: 'rgba(0, 123, 255, 0.05)',
        borderLeftColor: '#007bff'
    },
    cardDaviplata: {
        backgroundColor: 'rgba(220, 53, 69, 0.05)',
        borderLeftColor: '#dc3545'
    },
    cardTarjeta: {
        backgroundColor: 'rgba(40, 167, 69, 0.05)',
        borderLeftColor: '#28a745'
    },
    cardOtros: {
        backgroundColor: 'rgba(108, 117, 125, 0.05)',
        borderLeftColor: '#6c757d'
    },
    cardTitle: {
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontSize: '0.75rem', // Reducido
        marginBottom: '0.25rem'
    },
    cardValue: {
        fontSize: '1.5rem', // Reducido de 2rem
        fontWeight: '700',
        color: '#1f2937'
    },
    totalBar: {
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem', // Reducido significativamente
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#1f2937',
        marginBottom: '1.5rem'
    },
    totalLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '1rem', // Reducido
        fontWeight: '500',
        color: '#374151'
    },
    totalBadge: {
        backgroundColor: '#163864',
        color: 'white',
        padding: '0.35rem 1rem', // Reducido
        borderRadius: '9999px',
        fontSize: '0.85rem',
        fontWeight: '600'
    },
    tableContainer: {
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        overflow: 'hidden'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.95rem'
    },
    tableHeader: {
        borderBottom: '2px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        color: '#4b5563'
    },
    tableHeaderCell: {
        padding: '1rem 1.5rem',
        textAlign: 'left',
        fontWeight: '600',
        fontSize: '0.875rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },
    tableRow: {
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: 'white'
    },
    tableCell: {
        padding: '1rem 1.5rem',
        color: '#374151'
    },
    badge: {
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        display: 'inline-block'
    },
    button: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 1.25rem',
        borderRadius: '0.5rem',
        border: 'none',
        backgroundColor: '#163864',
        color: 'white',
        fontWeight: '500',
        fontSize: '0.875rem',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        transition: 'all 0.2s'
    }
};

export default function ReporteTransferenciasScreen() {
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
            case 'dia': default:
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

                // Ordenar por fecha descendente (más reciente primero)
                ventasFiltradas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

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
        cargarVentas();
    }, [periodo]);

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
        <div style={styles.container}>
            <div style={styles.card}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerTitle}>
                        <span className="material-icons" style={{ fontSize: '2rem' }}>account_balance</span>
                        Reporte de Transferencias
                    </div>
                    <button
                        onClick={cargarVentas}
                        style={styles.button}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#0d2540'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#163864'}
                    >
                        <span className="material-icons">refresh</span>
                        Actualizar
                    </button>
                </div>

                {/* Filters */}
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
                                <span className="material-icons" style={{ fontSize: '1.25rem' }}>{filter.icon}</span>
                                {filter.label}
                            </button>
                        ))}
                    </div>
                    <div style={styles.dateLabel}>
                        <span className="material-icons" style={{ fontSize: '1.25rem', color: '#163864' }}>schedule</span>
                        {getPeriodoLabel()}
                    </div>
                </div>

                {/* Content */}
                <div style={styles.content}>
                    {/* Stat Cards */}
                    <div style={styles.cardsGrid}>
                        <div style={{ ...styles.statCard, ...styles.cardNequi }}>
                            <h3 style={{ ...styles.cardTitle, color: '#007bff' }}>Nequi</h3>
                            <p style={styles.cardValue}>{formatCurrency(resumen.NEQUI)}</p>
                        </div>
                        <div style={{ ...styles.statCard, ...styles.cardDaviplata }}>
                            <h3 style={{ ...styles.cardTitle, color: '#dc3545' }}>Daviplata</h3>
                            <p style={styles.cardValue}>{formatCurrency(resumen.DAVIPLATA)}</p>
                        </div>
                        <div style={{ ...styles.statCard, ...styles.cardTarjeta }}>
                            <h3 style={{ ...styles.cardTitle, color: '#28a745' }}>Tarjeta</h3>
                            <p style={styles.cardValue}>{formatCurrency(resumen.TARJETA)}</p>
                        </div>
                        <div style={{ ...styles.statCard, ...styles.cardOtros }}>
                            <h3 style={{ ...styles.cardTitle, color: '#6c757d' }}>Otros</h3>
                            <p style={styles.cardValue}>{formatCurrency(resumen.OTROS)}</p>
                        </div>
                    </div>

                    {/* Total Bar */}
                    <div style={styles.totalBar}>
                        <div style={styles.totalLabel}>
                            <span className="material-icons" style={{ color: '#163864', fontSize: '2rem' }}>analytics</span>
                            <span>Total Transferencias: <span style={{ fontWeight: '700', fontSize: '1.5rem', marginLeft: '0.5rem' }}>{formatCurrency(resumen.total)}</span></span>
                        </div>
                        <div style={styles.totalBadge}>
                            {resumen.cantidad} transacciones
                        </div>
                    </div>

                    {/* Table */}
                    <div style={styles.tableContainer}>
                        {loading ? (
                            <div style={{ padding: '4rem', textAlign: 'center' }}>
                                <Spinner animation="border" variant="primary" />
                                <p style={{ marginTop: '1rem', color: '#6b7280' }}>Cargando datos...</p>
                            </div>
                        ) : ventas.length === 0 ? (
                            <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>
                                <span className="material-icons" style={{ fontSize: '4rem', marginBottom: '1rem', color: '#e5e7eb' }}>inbox</span>
                                <p>No hay registros de transferencias para este período.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={styles.table}>
                                    <thead style={styles.tableHeader}>
                                        <tr>
                                            <th style={styles.tableHeaderCell}>Fecha / Hora</th>
                                            <th style={styles.tableHeaderCell}>Cliente</th>
                                            <th style={styles.tableHeaderCell}>Tipo Transferencia</th>
                                            <th style={{ ...styles.tableHeaderCell, textAlign: 'right' }}>Total Venta</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ventas.map((venta, idx) => (
                                            <tr key={venta.id || idx} style={styles.tableRow}>
                                                <td style={styles.tableCell}>
                                                    {new Date(venta.fecha).toLocaleDateString('es-CO', {
                                                        year: 'numeric', month: '2-digit', day: '2-digit'
                                                    })}
                                                    <span style={{ color: '#9ca3af', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                                                        {new Date(venta.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                    </span>
                                                </td>
                                                <td style={{ ...styles.tableCell, fontWeight: '500' }}>{venta.cliente || 'Consumidor Final'}</td>
                                                <td style={styles.tableCell}>
                                                    <span style={getBadgeStyle(venta.banco?.toUpperCase() || 'OTROS')}>
                                                        {venta.banco || 'OTROS'}
                                                    </span>
                                                </td>
                                                <td style={{ ...styles.tableCell, textAlign: 'right', fontWeight: '700', fontSize: '1.1rem' }}>
                                                    {formatCurrency(venta.total)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
