import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Modal } from 'react-bootstrap';
import rutasService from '../../services/rutasService';

const ReporteVentasRuta = () => {
    const [ventas, setVentas] = useState([]);
    const [vendedores, setVendedores] = useState([]);
    const [filtros, setFiltros] = useState({
        vendedor_id: '',
        fecha: new Date().toISOString().split('T')[0] // Hoy
    });
    const [loading, setLoading] = useState(false);

    // Modal Detalle
    const [showModal, setShowModal] = useState(false);
    const [selectedVenta, setSelectedVenta] = useState(null);

    useEffect(() => {
        cargarVendedores();
        cargarVentas();
    }, []);

    const cargarVendedores = async () => {
        try {
            const data = await rutasService.obtenerVendedores();
            setVendedores(data);
        } catch (err) {
            console.error(err);
        }
    };

    const cargarVentas = async () => {
        setLoading(true);
        try {
            const data = await rutasService.obtenerVentasRuta(filtros.vendedor_id, filtros.fecha);
            setVentas(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        cargarVentas();
    };

    const calcularTotalDia = () => {
        return ventas.reduce((acc, venta) => acc + parseFloat(venta.total), 0);
    };

    return (
        <Container fluid>
            {/* FILTROS */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Form onSubmit={handleFilterSubmit}>
                        <Row className="align-items-end">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Fecha</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={filtros.fecha}
                                        onChange={e => setFiltros({ ...filtros, fecha: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Vendedor</Form.Label>
                                    <Form.Select
                                        value={filtros.vendedor_id}
                                        onChange={e => setFiltros({ ...filtros, vendedor_id: e.target.value })}
                                    >
                                        <option value="">Todos</option>
                                        {vendedores.map(v => (
                                            <option key={v.id_vendedor} value={v.id_vendedor}>{v.nombre}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Button type="submit" variant="primary" className="w-100">
                                    🔍 Buscar Ventas
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* RESUMEN */}
            <Row className="mb-4">
                <Col md={4}>
                    <Card className="bg-success text-white">
                        <Card.Body>
                            <h3>${calcularTotalDia().toLocaleString()}</h3>
                            <p className="mb-0">Total Ventas</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="bg-info text-white">
                        <Card.Body>
                            <h3>{ventas.length}</h3>
                            <p className="mb-0">Cantidad de Pedidos</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* TABLA */}
            <Card className="shadow-sm">
                <Card.Header className="bg-white">
                    <h5 className="mb-0">Listado de Ventas</h5>
                </Card.Header>
                <Card.Body>
                    <Table responsive hover>
                        <thead>
                            <tr>
                                <th>Hora</th>
                                <th>Vendedor</th>
                                <th>Cliente</th>
                                <th>Total</th>
                                <th>Pago</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventas.map(venta => (
                                <tr key={venta.id}>
                                    <td>{new Date(venta.fecha).toLocaleTimeString()}</td>
                                    <td>{venta.vendedor_nombre}</td>
                                    <td>{venta.cliente_nombre}</td>
                                    <td>${parseFloat(venta.total).toLocaleString()}</td>
                                    <td><Badge bg="secondary">{venta.metodo_pago}</Badge></td>
                                    <td>
                                        <Button variant="outline-primary" size="sm" onClick={() => {
                                            setSelectedVenta(venta);
                                            setShowModal(true);
                                        }}>
                                            Ver Detalle
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {ventas.length === 0 && (
                                <tr><td colSpan="6" className="text-center p-4">No se encontraron ventas</td></tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* MODAL DETALLE */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Detalle de Venta</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedVenta && (
                        <>
                            <Row className="mb-3">
                                <Col><strong>Cliente:</strong> {selectedVenta.cliente_nombre}</Col>
                                <Col><strong>Vendedor:</strong> {selectedVenta.vendedor_nombre}</Col>
                                <Col><strong>Fecha:</strong> {new Date(selectedVenta.fecha).toLocaleString()}</Col>
                            </Row>
                            <Table striped bordered size="sm">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Cant</th>
                                        <th>Precio</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedVenta.detalles.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.producto}</td>
                                            <td>{item.cantidad}</td>
                                            <td>${item.precio?.toLocaleString()}</td>
                                            <td>${(item.cantidad * item.precio).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                                        <td><strong>${parseFloat(selectedVenta.total).toLocaleString()}</strong></td>
                                    </tr>
                                </tfoot>
                            </Table>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cerrar</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ReporteVentasRuta;
