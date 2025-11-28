import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Modal, Spinner, Tabs, Tab, Alert } from 'react-bootstrap';
import rutasService from '../../services/rutasService';

const ReporteVentasRuta = () => {
    const [activeTab, setActiveTab] = useState('ventas');

    // ========== ESTADOS PESTAÑA VENTAS ==========
    const [ventas, setVentas] = useState([]);
    const [vendedores, setVendedores] = useState([]);
    const [filtros, setFiltros] = useState({
        vendedor_id: '',
        fecha: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedVenta, setSelectedVenta] = useState(null);

    // ========== ESTADOS PESTAÑA CLIENTES ==========
    const [selectedVendedor, setSelectedVendedor] = useState(null);
    const [clientesVendedor, setClientesVendedor] = useState([]);
    const [loadingClientes, setLoadingClientes] = useState(false);
    const [showClienteModal, setShowClienteModal] = useState(false);
    const [editingCliente, setEditingCliente] = useState(null);
    const [clienteForm, setClienteForm] = useState({
        nombre_negocio: '', nombre_contacto: '', direccion: '', telefono: '', tipo_negocio: '', dia_visita: [], orden: 0
    });

    // ========== ESTADOS PESTAÑA REPORTES ==========
    const [reportes, setReportes] = useState(null);
    const [loadingReportes, setLoadingReportes] = useState(false);
    const [filtrosReporte, setFiltrosReporte] = useState({
        periodo: 'mes', vendedor_id: '', fecha_inicio: '', fecha_fin: ''
    });

    useEffect(() => {
        cargarVendedores();
        cargarVentas();
    }, []);

    // ========== FUNCIONES VENTAS ==========
    const cargarVendedores = async () => {
        try {
            const data = await rutasService.obtenerVendedores();
            setVendedores(data);
        } catch (err) { console.error(err); }
    };

    const cargarVentas = async () => {
        setLoading(true);
        try {
            const data = await rutasService.obtenerVentasRuta(filtros.vendedor_id, filtros.fecha);
            setVentas(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const calcularTotalDia = () => ventas.reduce((acc, v) => acc + parseFloat(v.total), 0);

    // ========== FUNCIONES CLIENTES ==========
    const cargarClientesVendedor = async (vendedor) => {
        setSelectedVendedor(vendedor);
        setLoadingClientes(true);
        try {
            const rutas = await rutasService.obtenerRutas();
            const rutaVendedor = rutas.find(r => r.vendedor === vendedor.id || r.vendedor_nombre === vendedor.nombre);
            if (rutaVendedor) {
                const clientes = await rutasService.obtenerClientesRuta(rutaVendedor.id);
                setClientesVendedor(clientes);
            } else { setClientesVendedor([]); }
        } catch (err) { console.error(err); }
        finally { setLoadingClientes(false); }
    };

    const handleSaveCliente = async (e) => {
        e.preventDefault();
        try {
            const rutas = await rutasService.obtenerRutas();
            const rutaVendedor = rutas.find(r => r.vendedor === selectedVendedor.id || r.vendedor_nombre === selectedVendedor.nombre);
            if (!rutaVendedor) { alert('El vendedor no tiene una ruta asignada'); return; }
            const diasString = Array.isArray(clienteForm.dia_visita) ? clienteForm.dia_visita.join(',') : clienteForm.dia_visita;
            const data = { ...clienteForm, dia_visita: diasString, ruta: rutaVendedor.id };
            if (editingCliente) { await rutasService.actualizarClienteRuta(editingCliente.id, data); }
            else { await rutasService.crearClienteRuta(data); }
            setShowClienteModal(false);
            cargarClientesVendedor(selectedVendedor);
        } catch (err) { alert('Error al guardar cliente'); }
    };

    const handleDeleteCliente = async (id) => {
        if (window.confirm('¿Eliminar este cliente?')) {
            await rutasService.eliminarClienteRuta(id);
            cargarClientesVendedor(selectedVendedor);
        }
    };

    // ========== FUNCIONES REPORTES ==========
    const cargarReportes = async () => {
        setLoadingReportes(true);
        try {
            const data = await rutasService.obtenerReportesVentas(
                filtrosReporte.periodo, filtrosReporte.vendedor_id, filtrosReporte.fecha_inicio, filtrosReporte.fecha_fin
            );
            setReportes(data);
        } catch (err) { console.error(err); }
        finally { setLoadingReportes(false); }
    };

    return (
        <Container fluid>
            <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
                {/* PESTAÑA VENTAS */}
                <Tab eventKey="ventas" title={<><i className="bi bi-cart-check me-1"></i> Ventas del Día</>}>
                    <Card className="mb-4 shadow-sm">
                        <Card.Body>
                            <Form onSubmit={(e) => { e.preventDefault(); cargarVentas(); }}>
                                <Row className="align-items-end">
                                    <Col md={4}>
                                        <Form.Group><Form.Label>Fecha</Form.Label>
                                            <Form.Control type="date" value={filtros.fecha} onChange={e => setFiltros({ ...filtros, fecha: e.target.value })} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group><Form.Label>Vendedor</Form.Label>
                                            <Form.Select value={filtros.vendedor_id} onChange={e => setFiltros({ ...filtros, vendedor_id: e.target.value })}>
                                                <option value="">Todos</option>
                                                {vendedores.map(v => <option key={v.id_vendedor} value={v.id_vendedor}>{v.nombre}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}><Button type="submit" variant="primary" className="w-100">🔍 Buscar</Button></Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>
                    <Row className="mb-4">
                        <Col md={4}><Card className="bg-success text-white"><Card.Body><h3>${calcularTotalDia().toLocaleString()}</h3><p className="mb-0">Total Ventas</p></Card.Body></Card></Col>
                        <Col md={4}><Card className="bg-info text-white"><Card.Body><h3>{ventas.length}</h3><p className="mb-0">Cantidad de Pedidos</p></Card.Body></Card></Col>
                    </Row>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Listado de Ventas</h5>
                            <Button variant="outline-primary" size="sm" onClick={cargarVentas} disabled={loading}>
                                {loading ? <><Spinner animation="border" size="sm" className="me-1" />Cargando...</> : <><i className="bi bi-arrow-repeat"></i> Recargar</>}
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            <Table responsive hover>
                                <thead><tr><th>Hora</th><th>Vendedor</th><th>Negocio</th><th>Cliente</th><th>Total</th><th>Acciones</th></tr></thead>
                                <tbody>
                                    {ventas.map(venta => (
                                        <tr key={venta.id}>
                                            <td>{new Date(venta.fecha).toLocaleTimeString()}</td>
                                            <td>{venta.vendedor_nombre}</td>
                                            <td>{venta.nombre_negocio || '-'}</td>
                                            <td>{venta.cliente_nombre}</td>
                                            <td>${parseFloat(venta.total).toLocaleString()}</td>
                                            <td><Button variant="outline-primary" size="sm" onClick={() => { setSelectedVenta(venta); setShowModal(true); }}>Ver</Button></td>
                                        </tr>
                                    ))}
                                    {ventas.length === 0 && <tr><td colSpan="6" className="text-center p-4">No hay ventas</td></tr>}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>


                {/* PESTAÑA CLIENTES POR VENDEDOR */}
                <Tab eventKey="clientes" title={<><i className="bi bi-people me-1"></i> Clientes por Vendedor</>}>
                    <Row>
                        <Col md={4}>
                            <Card className="shadow-sm mb-4">
                                <Card.Header className="bg-primary text-white"><h6 className="mb-0">Vendedores</h6></Card.Header>
                                <Card.Body className="p-0">
                                    <div className="list-group list-group-flush">
                                        {vendedores.map(v => (
                                            <button key={v.id_vendedor} className={`list-group-item list-group-item-action ${selectedVendedor?.id_vendedor === v.id_vendedor ? 'active' : ''}`} onClick={() => cargarClientesVendedor(v)}>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span>{v.nombre}</span><Badge bg="secondary">{v.id_vendedor}</Badge>
                                                </div>
                                            </button>
                                        ))}
                                        {vendedores.length === 0 && <div className="p-3 text-center text-muted">No hay vendedores</div>}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={8}>
                            {selectedVendedor ? (
                                <Card className="shadow-sm">
                                    <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">Clientes de: {selectedVendedor.nombre}</h5>
                                        <Button variant="success" size="sm" onClick={() => { setEditingCliente(null); setClienteForm({ nombre_negocio: '', nombre_contacto: '', direccion: '', telefono: '', tipo_negocio: '', dia_visita: [], orden: clientesVendedor.length + 1 }); setShowClienteModal(true); }}>+ Agregar</Button>
                                    </Card.Header>
                                    <Card.Body>
                                        {loadingClientes ? <div className="text-center p-4"><Spinner animation="border" /></div> : (
                                            <Table responsive hover size="sm">
                                                <thead><tr><th>#</th><th>Negocio</th><th>Contacto</th><th>Teléfono</th><th>Días</th><th>Acciones</th></tr></thead>
                                                <tbody>
                                                    {clientesVendedor.map(c => (
                                                        <tr key={c.id}>
                                                            <td>{c.orden}</td>
                                                            <td><strong>{c.nombre_negocio}</strong><br /><small className="text-muted">{c.tipo_negocio}</small></td>
                                                            <td>{c.nombre_contacto}</td>
                                                            <td>{c.telefono}</td>
                                                            <td>{c.dia_visita?.split(',').map((d, i) => <Badge key={i} bg="info" className="me-1">{d}</Badge>)}</td>
                                                            <td>
                                                                <Button variant="link" size="sm" onClick={() => { setEditingCliente(c); setClienteForm({ ...c, dia_visita: c.dia_visita ? c.dia_visita.split(',') : [] }); setShowClienteModal(true); }}>✏️</Button>
                                                                <Button variant="link" size="sm" className="text-danger" onClick={() => handleDeleteCliente(c.id)}>🗑️</Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {clientesVendedor.length === 0 && <tr><td colSpan="6" className="text-center p-4">No hay clientes</td></tr>}
                                                </tbody>
                                            </Table>
                                        )}
                                    </Card.Body>
                                </Card>
                            ) : <Alert variant="info">Selecciona un vendedor para ver sus clientes</Alert>}
                        </Col>
                    </Row>
                </Tab>

                {/* PESTAÑA REPORTES */}
                <Tab eventKey="reportes" title={<><i className="bi bi-graph-up me-1"></i> Reportes</>}>
                    <Card className="mb-4 shadow-sm">
                        <Card.Body>
                            <Form onSubmit={(e) => { e.preventDefault(); cargarReportes(); }}>
                                <Row className="align-items-end">
                                    <Col md={3}>
                                        <Form.Group><Form.Label>Período</Form.Label>
                                            <Form.Select value={filtrosReporte.periodo} onChange={e => setFiltrosReporte({ ...filtrosReporte, periodo: e.target.value })}>
                                                <option value="dia">Hoy</option>
                                                <option value="semana">Última Semana</option>
                                                <option value="mes">Este Mes</option>
                                                <option value="trimestre">Último Trimestre</option>
                                                <option value="semestre">Último Semestre</option>
                                                <option value="año">Este Año</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group><Form.Label>Vendedor</Form.Label>
                                            <Form.Select value={filtrosReporte.vendedor_id} onChange={e => setFiltrosReporte({ ...filtrosReporte, vendedor_id: e.target.value })}>
                                                <option value="">Todos</option>
                                                {vendedores.map(v => <option key={v.id_vendedor} value={v.id_vendedor}>{v.nombre}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}><Form.Group><Form.Label>Desde</Form.Label><Form.Control type="date" value={filtrosReporte.fecha_inicio} onChange={e => setFiltrosReporte({ ...filtrosReporte, fecha_inicio: e.target.value })} /></Form.Group></Col>
                                    <Col md={2}><Form.Group><Form.Label>Hasta</Form.Label><Form.Control type="date" value={filtrosReporte.fecha_fin} onChange={e => setFiltrosReporte({ ...filtrosReporte, fecha_fin: e.target.value })} /></Form.Group></Col>
                                    <Col md={2}><Button type="submit" variant="primary" className="w-100" disabled={loadingReportes}>{loadingReportes ? <Spinner animation="border" size="sm" /> : '📊 Generar'}</Button></Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>
                    {reportes ? (
                        <>
                            <Row className="mb-4">
                                <Col md={4}><Card className="bg-success text-white"><Card.Body><h3>${reportes.total_general?.toLocaleString()}</h3><p className="mb-0">Total Ventas</p></Card.Body></Card></Col>
                                <Col md={4}><Card className="bg-info text-white"><Card.Body><h3>{reportes.cantidad_ventas}</h3><p className="mb-0">Cantidad de Ventas</p></Card.Body></Card></Col>
                                <Col md={4}><Card className="bg-warning text-dark"><Card.Body><h6>{reportes.fecha_inicio} - {reportes.fecha_fin}</h6><p className="mb-0">Período</p></Card.Body></Card></Col>
                            </Row>
                            <Row>
                                <Col md={6} className="mb-4">
                                    <Card className="shadow-sm h-100">
                                        <Card.Header className="bg-primary text-white"><h6 className="mb-0">💼 Ventas por Vendedor</h6></Card.Header>
                                        <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            <Table size="sm" hover>
                                                <thead><tr><th>Vendedor</th><th>Ventas</th><th>Total</th></tr></thead>
                                                <tbody>{reportes.ventas_por_vendedor?.map((v, i) => <tr key={i}><td>{v.vendedor__nombre}</td><td>{v.cantidad}</td><td className="text-success fw-bold">${v.total?.toLocaleString()}</td></tr>)}</tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6} className="mb-4">
                                    <Card className="shadow-sm h-100">
                                        <Card.Header className="bg-info text-white"><h6 className="mb-0">🏪 Top Clientes</h6></Card.Header>
                                        <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            <Table size="sm" hover>
                                                <thead><tr><th>Negocio/Cliente</th><th>Ventas</th><th>Total</th></tr></thead>
                                                <tbody>{reportes.ventas_por_cliente?.map((c, i) => <tr key={i}><td><strong>{c.nombre_negocio || c.cliente_nombre}</strong><br /><small className="text-muted">{c.cliente_nombre}</small></td><td>{c.cantidad}</td><td className="text-success fw-bold">${c.total?.toLocaleString()}</td></tr>)}</tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={12}>
                                    <Card className="shadow-sm">
                                        <Card.Header className="bg-warning text-dark"><h6 className="mb-0">📦 Ventas por Producto</h6></Card.Header>
                                        <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            <Table size="sm" hover>
                                                <thead><tr><th>Producto</th><th>Cantidad</th><th>Total</th></tr></thead>
                                                <tbody>{reportes.ventas_por_producto?.map((p, i) => <tr key={i}><td>{p.producto}</td><td>{p.cantidad}</td><td className="text-success fw-bold">${p.total?.toLocaleString()}</td></tr>)}</tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    ) : <Alert variant="info">Selecciona un período y haz clic en "Generar" para ver los reportes</Alert>}
                </Tab>
            </Tabs>


            {/* MODAL DETALLE VENTA */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" scrollable>
                <Modal.Header closeButton><Modal.Title>Detalle de Venta</Modal.Title></Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {selectedVenta && (
                        <>
                            <Row className="mb-3">
                                {selectedVenta.nombre_negocio && <Col xs={12} className="mb-2"><strong>Negocio:</strong> <span className="text-primary fw-bold">{selectedVenta.nombre_negocio}</span></Col>}
                                <Col><strong>Cliente:</strong> {selectedVenta.cliente_nombre}</Col>
                                <Col><strong>Vendedor:</strong> {selectedVenta.vendedor_nombre}</Col>
                                <Col><strong>Fecha:</strong> {new Date(selectedVenta.fecha).toLocaleString()}</Col>
                            </Row>
                            <Table striped bordered size="sm">
                                <thead><tr><th>Producto</th><th>Cant</th><th>Precio</th><th>Subtotal</th></tr></thead>
                                <tbody>
                                    {selectedVenta.detalles?.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.nombre || item.producto || 'Sin nombre'}</td>
                                            <td>{item.cantidad}</td>
                                            <td>${item.precio?.toLocaleString()}</td>
                                            <td>${(item.cantidad * item.precio).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot><tr><td colSpan="3" className="text-end"><strong>Total:</strong></td><td><strong>${parseFloat(selectedVenta.total).toLocaleString()}</strong></td></tr></tfoot>
                            </Table>
                            {selectedVenta.productos_vencidos?.length > 0 && (
                                <div className="mt-4">
                                    <h6 className="text-danger border-bottom pb-2">⚠️ Productos Vencidos</h6>
                                    <Table striped bordered size="sm">
                                        <thead className="table-danger"><tr><th>Producto</th><th>Cantidad</th><th>Motivo</th></tr></thead>
                                        <tbody>{selectedVenta.productos_vencidos.map((item, idx) => <tr key={idx}><td>{item.producto}</td><td>{item.cantidad}</td><td>{item.motivo}</td></tr>)}</tbody>
                                    </Table>
                                </div>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowModal(false)}>Cerrar</Button></Modal.Footer>
            </Modal>

            {/* MODAL CLIENTE */}
            <Modal show={showClienteModal} onHide={() => setShowClienteModal(false)} size="lg">
                <Modal.Header closeButton><Modal.Title>{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</Modal.Title></Modal.Header>
                <Form onSubmit={handleSaveCliente}>
                    <Modal.Body>
                        <Row>
                            <Col md={8}><Form.Group className="mb-3"><Form.Label>Nombre Negocio</Form.Label><Form.Control required value={clienteForm.nombre_negocio} onChange={e => setClienteForm({ ...clienteForm, nombre_negocio: e.target.value })} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Orden</Form.Label><Form.Control type="number" value={clienteForm.orden} onChange={e => setClienteForm({ ...clienteForm, orden: e.target.value })} /></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Contacto</Form.Label><Form.Control value={clienteForm.nombre_contacto} onChange={e => setClienteForm({ ...clienteForm, nombre_contacto: e.target.value })} /></Form.Group></Col>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Teléfono</Form.Label><Form.Control value={clienteForm.telefono} onChange={e => setClienteForm({ ...clienteForm, telefono: e.target.value })} /></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Tipo Negocio</Form.Label><Form.Control placeholder="Ej: Tienda, Supermercado" value={clienteForm.tipo_negocio} onChange={e => setClienteForm({ ...clienteForm, tipo_negocio: e.target.value })} /></Form.Group></Col>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Dirección</Form.Label><Form.Control value={clienteForm.direccion} onChange={e => setClienteForm({ ...clienteForm, direccion: e.target.value })} /></Form.Group></Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Días de Visita</Form.Label>
                            <div className="d-flex flex-wrap gap-3">
                                {['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'].map(dia => (
                                    <Form.Check key={dia} type="checkbox" label={dia} checked={Array.isArray(clienteForm.dia_visita) && clienteForm.dia_visita.includes(dia)}
                                        onChange={(e) => {
                                            const dias = Array.isArray(clienteForm.dia_visita) ? [...clienteForm.dia_visita] : [];
                                            if (e.target.checked) dias.push(dia);
                                            else { const idx = dias.indexOf(dia); if (idx > -1) dias.splice(idx, 1); }
                                            setClienteForm({ ...clienteForm, dia_visita: dias });
                                        }}
                                    />
                                ))}
                            </div>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowClienteModal(false)}>Cancelar</Button>
                        <Button variant="primary" type="submit">Guardar</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default ReporteVentasRuta;
