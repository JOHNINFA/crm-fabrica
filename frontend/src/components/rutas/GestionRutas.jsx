import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge, Alert } from 'react-bootstrap';
import rutasService from '../../services/rutasService';

const GestionRutas = () => {
    const [rutas, setRutas] = useState([]);
    const [vendedores, setVendedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal Ruta
    const [showModal, setShowModal] = useState(false);
    const [editingRuta, setEditingRuta] = useState(null);
    const [formData, setFormData] = useState({ nombre: '', vendedor: '' });

    // Clientes
    const [selectedRuta, setSelectedRuta] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [showClienteModal, setShowClienteModal] = useState(false);
    const [clienteForm, setClienteForm] = useState({
        nombre_negocio: '',
        nombre_contacto: '',
        direccion: '',
        telefono: '',
        tipo_negocio: '',
        dia_visita: [],  // Ahora es un array para múltiples días
        orden: 0
    });
    const [editingCliente, setEditingCliente] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [rutasData, vendedoresData] = await Promise.all([
                rutasService.obtenerRutas(),
                rutasService.obtenerVendedores()
            ]);
            setRutas(rutasData);
            setVendedores(vendedoresData);
        } catch (err) {
            setError('Error al cargar datos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRuta = async (e) => {
        e.preventDefault();
        try {
            if (editingRuta) {
                await rutasService.actualizarRuta(editingRuta.id, formData);
            } else {
                await rutasService.crearRuta(formData);
            }
            setShowModal(false);
            cargarDatos();
        } catch (err) {
            alert('Error al guardar ruta');
        }
    };

    const handleSelectRuta = async (ruta) => {
        setSelectedRuta(ruta);
        try {
            const clientesData = await rutasService.obtenerClientesRuta(ruta.id);
            setClientes(clientesData);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveCliente = async (e) => {
        e.preventDefault();
        try {
            // Convertir array de días a string separado por comas
            const diasString = Array.isArray(clienteForm.dia_visita)
                ? clienteForm.dia_visita.join(',')
                : clienteForm.dia_visita;

            const data = {
                ...clienteForm,
                dia_visita: diasString,
                ruta: selectedRuta.id
            };

            if (editingCliente) {
                await rutasService.actualizarClienteRuta(editingCliente.id, data);
            } else {
                await rutasService.crearClienteRuta(data);
            }
            setShowClienteModal(false);
            handleSelectRuta(selectedRuta); // Recargar clientes
        } catch (err) {
            alert('Error al guardar cliente');
        }
    };

    const handleDeleteCliente = async (id) => {
        if (window.confirm('¿Eliminar cliente?')) {
            await rutasService.eliminarClienteRuta(id);
            handleSelectRuta(selectedRuta);
        }
    };

    return (
        <Container fluid>
            <Row>
                {/* LISTA DE RUTAS */}
                <Col md={4}>
                    <Card className="shadow-sm mb-4">
                        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Rutas</h5>
                            <Button variant="light" size="sm" onClick={() => {
                                setEditingRuta(null);
                                setFormData({ nombre: '', vendedor: '' });
                                setShowModal(true);
                            }}>
                                + Nueva
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="list-group list-group-flush">
                                {rutas.map(ruta => (
                                    <button
                                        key={ruta.id}
                                        className={`list-group-item list-group-item-action ${selectedRuta?.id === ruta.id ? 'active' : ''}`}
                                        onClick={() => handleSelectRuta(ruta)}
                                    >
                                        <div className="d-flex w-100 justify-content-between">
                                            <h6 className="mb-1">{ruta.nombre}</h6>
                                            <small>{ruta.vendedor_nombre || 'Sin vendedor'}</small>
                                        </div>
                                    </button>
                                ))}
                                {rutas.length === 0 && <div className="p-3 text-center text-muted">No hay rutas creadas</div>}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* DETALLE DE CLIENTES */}
                <Col md={8}>
                    {selectedRuta ? (
                        <Card className="shadow-sm">
                            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Clientes de: {selectedRuta.nombre}</h5>
                                <Button variant="success" size="sm" onClick={() => {
                                    setEditingCliente(null);
                                    setClienteForm({
                                        nombre_negocio: '', nombre_contacto: '', direccion: '', telefono: '', tipo_negocio: '',
                                        dia_visita: [],  // Array vacío para nuevo cliente
                                        orden: clientes.length + 1
                                    });
                                    setShowClienteModal(true);
                                }}>
                                    + Agregar Cliente
                                </Button>
                            </Card.Header>
                            <Card.Body>
                                <Table responsive hover size="sm">
                                    <thead>
                                        <tr>
                                            <th>Orden</th>
                                            <th>Negocio</th>
                                            <th>Tipo</th>
                                            <th>Día</th>
                                            <th>Dirección</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clientes.map(cliente => (
                                            <tr key={cliente.id}>
                                                <td>{cliente.orden}</td>
                                                <td>{cliente.nombre_negocio}</td>
                                                <td><Badge bg="secondary">{cliente.tipo_negocio || 'N/A'}</Badge></td>
                                                <td>
                                                    {cliente.dia_visita ? cliente.dia_visita.split(',').map((dia, idx) => (
                                                        <Badge key={idx} bg="info" className="me-1">{dia.trim()}</Badge>
                                                    )) : <Badge bg="secondary">N/A</Badge>}
                                                </td>
                                                <td>{cliente.direccion}</td>
                                                <td>
                                                    <Button variant="link" size="sm" onClick={() => {
                                                        setEditingCliente(cliente);
                                                        // Convertir string de días a array para edición
                                                        const diasArray = cliente.dia_visita ? cliente.dia_visita.split(',') : [];
                                                        setClienteForm({
                                                            ...cliente,
                                                            dia_visita: diasArray
                                                        });
                                                        setShowClienteModal(true);
                                                    }}>✏️</Button>
                                                    <Button variant="link" size="sm" className="text-danger" onClick={() => handleDeleteCliente(cliente.id)}>🗑️</Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {clientes.length === 0 && (
                                            <tr><td colSpan="6" className="text-center">No hay clientes en esta ruta</td></tr>
                                        )}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    ) : (
                        <Alert variant="info">Selecciona una ruta para ver sus clientes</Alert>
                    )}
                </Col>
            </Row>

            {/* MODAL RUTA */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton><Modal.Title>{editingRuta ? 'Editar Ruta' : 'Nueva Ruta'}</Modal.Title></Modal.Header>
                <Form onSubmit={handleSaveRuta}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre de la Ruta</Form.Label>
                            <Form.Control required type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Vendedor Asignado</Form.Label>
                            <Form.Select value={formData.vendedor} onChange={e => setFormData({ ...formData, vendedor: e.target.value })}>
                                <option value="">Seleccionar...</option>
                                {vendedores.map(v => (
                                    <option key={v.id_vendedor} value={v.id_vendedor}>{v.nombre}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button variant="primary" type="submit">Guardar</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* MODAL CLIENTE */}
            <Modal show={showClienteModal} onHide={() => setShowClienteModal(false)} scrollable={true} size="lg">
                <Modal.Header closeButton><Modal.Title>{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</Modal.Title></Modal.Header>
                <Form onSubmit={handleSaveCliente}>
                    <Modal.Body className="pb-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nombre Negocio</Form.Label>
                                    <Form.Control required type="text" value={clienteForm.nombre_negocio} onChange={e => setClienteForm({ ...clienteForm, nombre_negocio: e.target.value })} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Orden</Form.Label>
                                    <Form.Control type="number" value={clienteForm.orden} onChange={e => setClienteForm({ ...clienteForm, orden: e.target.value })} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Tipo de Negocio</Form.Label>
                                    <Form.Control type="text" placeholder="Ej: Supermercado, Carnicería, etc." value={clienteForm.tipo_negocio} onChange={e => setClienteForm({ ...clienteForm, tipo_negocio: e.target.value })} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Teléfono</Form.Label>
                                    <Form.Control type="text" value={clienteForm.telefono} onChange={e => setClienteForm({ ...clienteForm, telefono: e.target.value })} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Dirección</Form.Label>
                            <Form.Control type="text" value={clienteForm.direccion} onChange={e => setClienteForm({ ...clienteForm, direccion: e.target.value })} />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label>Días de Visita</Form.Label>
                            <div className="d-flex flex-wrap gap-3">
                                {['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'].map(dia => (
                                    <Form.Check
                                        key={dia}
                                        type="checkbox"
                                        id={`dia-${dia}`}
                                        label={dia}
                                        checked={Array.isArray(clienteForm.dia_visita) && clienteForm.dia_visita.includes(dia)}
                                        onChange={(e) => {
                                            const dias = Array.isArray(clienteForm.dia_visita) ? [...clienteForm.dia_visita] : [];
                                            if (e.target.checked) {
                                                dias.push(dia);
                                            } else {
                                                const index = dias.indexOf(dia);
                                                if (index > -1) dias.splice(index, 1);
                                            }
                                            setClienteForm({ ...clienteForm, dia_visita: dias });
                                        }}
                                    />
                                ))}
                            </div>
                            <Form.Text className="text-muted">
                                Selecciona uno o más días en los que se visitará este cliente
                            </Form.Text>
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

export default GestionRutas;
