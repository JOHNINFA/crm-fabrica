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

export default function HistorialClientes({ onVolver }) {
    const [modo, setModo] = useState('dia');
    const [fecha, setFecha] = useState(hoy);
    const [rangoInicio, setRangoInicio] = useState(hoy);
    const [rangoFin, setRangoFin] = useState(hoy);
    const [anio, setAnio] = useState(anioActual);

    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [buscado, setBuscado] = useState(false);

    const [filtroId, setFiltroId] = useState('TODOS');
    const [busqueda, setBusqueda] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

    const buscar = async () => {
        const rango = calcularRango(modo, fecha, rangoInicio, rangoFin, anio);
        if (!rango.inicio || !rango.fin) { setError('Selecciona fechas válidas'); return; }
        setLoading(true); setError(''); setBuscado(true); setClienteSeleccionado(null);
        try {
            const res = await fetch(`${API_URL}/reportes/historial-clientes/?fecha_inicio=${rango.inicio}&fecha_fin=${rango.fin}`);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const data = await res.json();
            setClientes(Array.isArray(data) ? data : []);
        } catch (e) {
            setError('Error al consultar. Verifica la conexión.');
        } finally {
            setLoading(false);
        }
    };

    // IDs únicos encontrados
    const idsDisponibles = ['TODOS', ...Array.from(new Set(clientes.map(c => c.vendedor_id))).filter(id => id !== 'SIN_ID').sort()];

    const clientesFiltrados = clientes.filter(c => {
        const matchId = filtroId === 'TODOS' || c.vendedor_id === filtroId;
        const matchBusqueda = !busqueda || c.nombre_negocio.toLowerCase().includes(busqueda.toLowerCase());
        return matchId && matchBusqueda;
    });

    // Agrupar por vendedor_id
    const agrupados = {};
    clientesFiltrados.forEach(c => {
        const gid = c.vendedor_id || 'SIN_ID';
        if (!agrupados[gid]) agrupados[gid] = { vendedor_nombre: c.vendedor_nombre, clientes: [] };
        agrupados[gid].clientes.push(c);
    });

    const labelPeriodo = () => {
        const r = calcularRango(modo, fecha, rangoInicio, rangoFin, anio);
        if (r.inicio === r.fin) return r.inicio;
        return `${r.inicio} → ${r.fin}`;
    };

    // ── VISTA DETALLE DE CLIENTE ──────────────────────────────────
    if (clienteSeleccionado) {
        const c = clienteSeleccionado;
        return (
            <div style={{ background: '#f4f7f6', minHeight: '100vh' }}>
                <div style={{ background: '#0c2c53', color: 'white', padding: '1rem 1.5rem' }}>
                    <Container>
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <h5 className="mb-0">{c.nombre_negocio}</h5>
                                {c.nombre_contacto && <small style={{ opacity: 0.8 }}>{c.nombre_contacto}</small>}
                            </div>
                            <div className="d-flex gap-2 align-items-center">
                                <Badge bg={c.origen === 'RUTA' ? 'info' : 'warning'} text="dark">
                                    {c.origen} — {c.vendedor_id}
                                </Badge>
                                <Button size="sm" variant="outline-light" onClick={() => setClienteSeleccionado(null)}>
                                    ← Volver
                                </Button>
                            </div>
                        </div>
                    </Container>
                </div>

                <Container className="py-3">
                    <div className="d-flex gap-3 mb-4 flex-wrap">
                        <div style={{ background: 'white', borderRadius: 8, padding: '0.75rem 1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #0c2c53' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6c757d', textTransform: 'uppercase', fontWeight: 600 }}>Total compras</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0c2c53' }}>{fmt(c.total_ventas)}</div>
                        </div>
                        <div style={{ background: 'white', borderRadius: 8, padding: '0.75rem 1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #198754' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6c757d', textTransform: 'uppercase', fontWeight: 600 }}>Visitas / Pedidos</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#198754' }}>{c.num_ventas}</div>
                        </div>
                        <div style={{ background: 'white', borderRadius: 8, padding: '0.75rem 1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #6c757d' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6c757d', textTransform: 'uppercase', fontWeight: 600 }}>Período</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#495057' }}>{labelPeriodo()}</div>
                        </div>
                    </div>

                    {/* Compras */}
                    <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: '1.5rem', overflow: 'hidden' }}>
                        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #e9ecef', background: '#f8f9fa' }}>
                            <strong style={{ color: '#0c2c53' }}>🛒 Compras del período</strong>
                        </div>
                        {c.productos.length === 0 ? (
                            <div className="text-center text-muted py-4">Sin compras registradas</div>
                        ) : (
                            <div className="table-responsive">
                                <Table hover className="mb-0" style={{ fontSize: '0.9rem' }}>
                                    <thead style={{ background: '#f1f3f5' }}>
                                        <tr>
                                            <th>Producto</th>
                                            <th className="text-center">Cantidad</th>
                                            <th className="text-end">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {c.productos.map((p, i) => (
                                            <tr key={i}>
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
                                            <td>TOTAL</td>
                                            <td className="text-center">{c.productos.reduce((s, p) => s + p.cantidad, 0)}</td>
                                            <td className="text-end">{fmt(c.total_ventas)}</td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </div>
                        )}
                    </div>

                    {/* Vencidas */}
                    <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #e9ecef', background: '#fff3cd' }}>
                            <strong style={{ color: '#856404' }}>⚠️ Vencidas reportadas</strong>
                        </div>
                        {c.vencidas.length === 0 ? (
                            <div className="text-center text-muted py-4">Sin vencidas en este período</div>
                        ) : (
                            <div className="table-responsive">
                                <Table hover className="mb-0" style={{ fontSize: '0.9rem' }}>
                                    <thead style={{ background: '#f1f3f5' }}>
                                        <tr>
                                            <th>Producto</th>
                                            <th className="text-center">Cantidad</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {c.vencidas.map((v, i) => (
                                            <tr key={i}>
                                                <td>{v.nombre}</td>
                                                <td className="text-center">
                                                    <Badge bg="warning" text="dark" style={{ fontSize: '0.85rem' }}>{v.cantidad}</Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot style={{ background: '#e9ecef', fontWeight: 700 }}>
                                        <tr>
                                            <td>TOTAL</td>
                                            <td className="text-center">{c.vencidas.reduce((s, v) => s + v.cantidad, 0)}</td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </div>
                        )}
                    </div>
                </Container>
            </div>
        );
    }

    // ── VISTA LISTA DE CLIENTES ───────────────────────────────────
    return (
        <div style={{ background: '#f4f7f6', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ background: '#0c2c53', color: 'white', padding: '1rem 0' }}>
                <Container>
                    <div className="d-flex align-items-center justify-content-between">
                        <h5 className="mb-0">👤 Historial de Clientes</h5>
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

                {/* Filtros ID + Buscador */}
                {buscado && !loading && clientes.length > 0 && (
                    <div style={{ background: 'white', borderRadius: 10, padding: '0.75rem 1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
                        <div className="d-flex gap-2 flex-wrap mb-2">
                            {idsDisponibles.map(id => (
                                <Button key={id} size="sm"
                                    variant={filtroId === id ? 'primary' : 'outline-secondary'}
                                    onClick={() => setFiltroId(id)}
                                    style={filtroId === id ? { background: '#0c2c53', borderColor: '#0c2c53' } : {}}>
                                    {id === 'TODOS' ? '🌐 Todos' : `🚚 ${id}`}
                                </Button>
                            ))}
                        </div>
                        <Form.Control
                            type="text"
                            size="sm"
                            placeholder="🔍 Buscar cliente por nombre..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                        />
                    </div>
                )}

                {/* Resultados */}
                {loading && (
                    <div className="text-center py-5">
                        <Spinner animation="border" style={{ color: '#0c2c53' }} />
                        <div className="mt-2 text-muted">Cargando historial...</div>
                    </div>
                )}

                {buscado && !loading && clientes.length === 0 && (
                    <div className="text-center py-5 text-muted">
                        <div style={{ fontSize: '2.5rem' }}>👤</div>
                        <div>No hay clientes con compras en este período</div>
                    </div>
                )}

                {!buscado && (
                    <div className="text-center py-5 text-muted">
                        <div style={{ fontSize: '2.5rem' }}>📅</div>
                        <div>Selecciona un período y busca</div>
                    </div>
                )}

                {buscado && !loading && Object.keys(agrupados).length > 0 && (
                    Object.entries(agrupados).sort(([a], [b]) => a.localeCompare(b)).map(([vid, grupo]) => (
                        <div key={vid} style={{ marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.5rem 1rem', background: '#0c2c53', color: 'white', borderRadius: '8px 8px 0 0', fontWeight: 700, fontSize: '0.9rem' }}>
                                🚚 {vid} {grupo.vendedor_nombre ? `— ${grupo.vendedor_nombre}` : ''}
                                <span style={{ float: 'right', opacity: 0.8 }}>{grupo.clientes.length} clientes</span>
                            </div>
                            <div style={{ background: 'white', borderRadius: '0 0 8px 8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                                {grupo.clientes.map((c, i) => (
                                    <div key={i}
                                        onClick={() => setClienteSeleccionado(c)}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '0.75rem 1.25rem', cursor: 'pointer',
                                            borderBottom: i < grupo.clientes.length - 1 ? '1px solid #f1f3f5' : 'none',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#212529' }}>{c.nombre_negocio}</div>
                                            {c.nombre_contacto && (
                                                <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>{c.nombre_contacto}</div>
                                            )}
                                            <div className="d-flex gap-2 mt-1">
                                                <Badge bg={c.origen === 'RUTA' ? 'info' : 'warning'} text="dark" style={{ fontSize: '0.7rem' }}>
                                                    {c.origen}
                                                </Badge>
                                                {c.vencidas.length > 0 && (
                                                    <Badge bg="warning" text="dark" style={{ fontSize: '0.7rem' }}>
                                                        ⚠️ {c.vencidas.reduce((s, v) => s + v.cantidad, 0)} vencidas
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <div style={{ fontWeight: 700, color: '#0c2c53', fontSize: '1rem' }}>{fmt(c.total_ventas)}</div>
                                            <div style={{ fontSize: '0.78rem', color: '#6c757d' }}>{c.num_ventas} visita{c.num_ventas !== 1 ? 's' : ''} · {c.productos.length} producto{c.productos.length !== 1 ? 's' : ''}</div>
                                            <div style={{ color: '#adb5bd', fontSize: '0.85rem', marginTop: 2 }}>→</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </Container>
        </div>
    );
}
