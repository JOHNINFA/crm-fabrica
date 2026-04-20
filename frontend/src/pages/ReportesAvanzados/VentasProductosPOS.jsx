import React, { useState } from 'react';
import { Container, Row, Col, Button, Form, Table, Badge, Spinner } from 'react-bootstrap';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

function calcularRango(modo, fecha, rangoInicio, rangoFin, anio) {
    if (modo === 'dia') return { inicio: fecha, fin: fecha };
    if (modo === 'semana') {
        const d = new Date(fecha + 'T00:00:00');
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const lun = new Date(d); lun.setDate(d.getDate() + diff);
        const dom = new Date(lun); dom.setDate(lun.getDate() + 6);
        return { inicio: lun.toISOString().slice(0, 10), fin: dom.toISOString().slice(0, 10) };
    }
    if (modo === 'mes') {
        const d = new Date(fecha + 'T00:00:00');
        const ini = new Date(d.getFullYear(), d.getMonth(), 1);
        const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        return { inicio: ini.toISOString().slice(0, 10), fin: fin.toISOString().slice(0, 10) };
    }
    if (modo === 'rango') return { inicio: rangoInicio, fin: rangoFin };
    if (modo === 'anio') return { inicio: `${anio}-01-01`, fin: `${anio}-12-31` };
    return { inicio: fecha, fin: fecha };
}

const hoy = new Date().toISOString().slice(0, 10);
const anioActual = new Date().getFullYear();

export default function VentasProductosPOS({ onVolver }) {
    const [modo, setModo] = useState('dia');
    const [fecha, setFecha] = useState(hoy);
    const [rangoInicio, setRangoInicio] = useState(hoy);
    const [rangoFin, setRangoFin] = useState(hoy);
    const [anio, setAnio] = useState(anioActual);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [descargando, setDescargando] = useState(false);
    const [error, setError] = useState('');
    const [buscado, setBuscado] = useState(false);
    const [busqueda, setBusqueda] = useState('');

    const getRango = () => calcularRango(modo, fecha, rangoInicio, rangoFin, anio);

    const buscar = async () => {
        const rango = getRango();
        if (!rango.inicio || !rango.fin) { setError('Selecciona fechas válidas'); return; }
        setLoading(true); setError(''); setBuscado(true);
        try {
            const res = await fetch(`${API_URL}/reportes/ventas-productos-pos/?fecha_inicio=${rango.inicio}&fecha_fin=${rango.fin}`);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            setData(await res.json());
        } catch (e) {
            setError('Error al consultar. Verifica la conexión.');
        } finally {
            setLoading(false);
        }
    };

    const descargarExcel = async () => {
        const rango = getRango();
        setDescargando(true);
        try {
            const res = await fetch(`${API_URL}/reportes/ventas-productos-pos/excel/?fecha_inicio=${rango.inicio}&fecha_fin=${rango.fin}`);
            if (!res.ok) throw new Error('Error al generar Excel');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ventas_pos_${rango.inicio}_${rango.fin}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('Error al descargar. Intenta de nuevo.');
        } finally {
            setDescargando(false);
        }
    };

    const productosFiltrados = data
        ? data.productos.filter(p => !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
        : [];

    const labelPeriodo = () => {
        const r = getRango();
        return r.inicio === r.fin ? r.inicio : `${r.inicio} → ${r.fin}`;
    };

    return (
        <div style={{ background: '#f4f7f6', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ background: '#0c2c53', color: 'white', padding: '1rem 0' }}>
                <Container>
                    <div className="d-flex align-items-center justify-content-between">
                        <h5 className="mb-0">🖥️ Ventas Productos POS</h5>
                        <Button size="sm" variant="outline-light" onClick={onVolver}>← Volver</Button>
                    </div>
                </Container>
            </div>

            <Container className="py-3">
                {/* Filtros de fecha */}
                <div style={{ background: 'white', borderRadius: 10, padding: '1rem 1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
                    <div className="d-flex gap-2 flex-wrap mb-3">
                        {['dia', 'semana', 'mes', 'rango', 'anio'].map(m => (
                            <Button key={m} size="sm"
                                variant={modo === m ? 'primary' : 'outline-secondary'}
                                onClick={() => setModo(m)}
                                style={modo === m ? { background: '#0c2c53', borderColor: '#0c2c53' } : {}}>
                                {m === 'dia' ? '📅 Día' : m === 'semana' ? '📅 Semana' : m === 'mes' ? '📅 Mes' : m === 'rango' ? '📊 Rango' : '📆 Año'}
                            </Button>
                        ))}
                    </div>
                    <Row className="g-2 align-items-end">
                        {(modo === 'dia' || modo === 'semana' || modo === 'mes') && (
                            <Col xs="auto">
                                <Form.Label style={{ fontSize: '0.8rem', color: '#6c757d' }}>FECHA</Form.Label>
                                <Form.Control type="date" size="sm" value={fecha} onChange={e => setFecha(e.target.value)} />
                            </Col>
                        )}
                        {modo === 'rango' && (
                            <>
                                <Col xs="auto">
                                    <Form.Label style={{ fontSize: '0.8rem', color: '#6c757d' }}>DESDE</Form.Label>
                                    <Form.Control type="date" size="sm" value={rangoInicio} onChange={e => setRangoInicio(e.target.value)} />
                                </Col>
                                <Col xs="auto">
                                    <Form.Label style={{ fontSize: '0.8rem', color: '#6c757d' }}>HASTA</Form.Label>
                                    <Form.Control type="date" size="sm" value={rangoFin} onChange={e => setRangoFin(e.target.value)} />
                                </Col>
                            </>
                        )}
                        {modo === 'anio' && (
                            <Col xs="auto">
                                <Form.Label style={{ fontSize: '0.8rem', color: '#6c757d' }}>AÑO</Form.Label>
                                <Form.Control type="number" size="sm" value={anio} min="2020" max="2099"
                                    onChange={e => setAnio(parseInt(e.target.value))} style={{ width: 100 }} />
                            </Col>
                        )}
                        <Col xs="auto">
                            <Button onClick={buscar} disabled={loading}
                                style={{ background: '#0c2c53', borderColor: '#0c2c53' }} size="sm">
                                {loading ? <Spinner size="sm" animation="border" /> : '🔍 Buscar'}
                            </Button>
                        </Col>
                    </Row>
                    {error && <div className="text-danger mt-2" style={{ fontSize: '0.85rem' }}>{error}</div>}
                </div>

                {/* Resumen cards */}
                {data && !loading && (
                    <div className="d-flex gap-3 flex-wrap mb-3">
                        <div style={{ background: 'white', borderRadius: 8, padding: '0.75rem 1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #0c2c53' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6c757d', textTransform: 'uppercase', fontWeight: 600 }}>Total Ventas POS</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0c2c53' }}>{fmt(data.total_ventas)}</div>
                        </div>
                        <div style={{ background: 'white', borderRadius: 8, padding: '0.75rem 1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #198754' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6c757d', textTransform: 'uppercase', fontWeight: 600 }}>Unidades vendidas</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#198754' }}>{data.total_unidades}</div>
                        </div>
                        <div style={{ background: 'white', borderRadius: 8, padding: '0.75rem 1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #6c757d' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6c757d', textTransform: 'uppercase', fontWeight: 600 }}>Productos distintos</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#495057' }}>{data.productos.length}</div>
                        </div>
                        <div style={{ background: 'white', borderRadius: 8, padding: '0.75rem 1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #6c757d' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6c757d', textTransform: 'uppercase', fontWeight: 600 }}>Período</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#495057' }}>{labelPeriodo()}</div>
                        </div>
                    </div>
                )}

                {/* Tabla */}
                {data && !loading && (
                    <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #e9ecef', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <strong style={{ color: '#0c2c53' }}>🛒 Productos vendidos en mostrador</strong>
                            <div className="d-flex gap-2 align-items-center">
                                <Form.Control
                                    type="text" size="sm" placeholder="🔍 Buscar producto..."
                                    value={busqueda} onChange={e => setBusqueda(e.target.value)}
                                    style={{ width: 200 }}
                                />
                                <Button size="sm" onClick={descargarExcel} disabled={descargando}
                                    style={{ background: '#198754', borderColor: '#198754', color: 'white', whiteSpace: 'nowrap' }}>
                                    {descargando ? <Spinner size="sm" animation="border" /> : '📥 Descargar Excel'}
                                </Button>
                            </div>
                        </div>

                        {productosFiltrados.length === 0 ? (
                            <div className="text-center text-muted py-4">Sin resultados</div>
                        ) : (
                            <div className="table-responsive">
                                <Table hover className="mb-0" style={{ fontSize: '0.9rem' }}>
                                    <thead style={{ background: '#f1f3f5' }}>
                                        <tr>
                                            <th style={{ width: 40 }}>#</th>
                                            <th>Producto</th>
                                            <th className="text-center">Cantidad</th>
                                            <th className="text-end">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productosFiltrados.map((p, i) => (
                                            <tr key={i}>
                                                <td className="text-muted">{i + 1}</td>
                                                <td>{p.nombre}</td>
                                                <td className="text-center">
                                                    <Badge bg="primary" style={{ fontSize: '0.85rem' }}>{p.cantidad}</Badge>
                                                </td>
                                                <td className="text-end fw-semibold">{fmt(p.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot style={{ background: '#e9ecef', fontWeight: 700 }}>
                                        <tr>
                                            <td colSpan={2}>TOTAL</td>
                                            <td className="text-center">{productosFiltrados.reduce((s, p) => s + p.cantidad, 0)}</td>
                                            <td className="text-end">{fmt(productosFiltrados.reduce((s, p) => s + p.total, 0))}</td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </div>
                        )}
                    </div>
                )}

                {loading && (
                    <div className="text-center py-5">
                        <Spinner animation="border" style={{ color: '#0c2c53' }} />
                        <div className="mt-2 text-muted">Cargando ventas POS...</div>
                    </div>
                )}

                {!buscado && (
                    <div className="text-center py-5 text-muted">
                        <div style={{ fontSize: '2.5rem' }}>🖥️</div>
                        <div>Selecciona un período y busca</div>
                    </div>
                )}

                {buscado && !loading && data && data.productos.length === 0 && (
                    <div className="text-center py-5 text-muted">
                        <div style={{ fontSize: '2.5rem' }}>🖥️</div>
                        <div>No hay ventas POS en este período</div>
                    </div>
                )}
            </Container>
        </div>
    );
}
