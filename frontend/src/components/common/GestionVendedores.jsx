import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Alert, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const GestionVendedores = () => {
    const [vendedores, setVendedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [vendedorEditando, setVendedorEditando] = useState(null);
    const [formData, setFormData] = useState({
        id_vendedor: '',
        nombre: '',
        password: '',
        activo: true
    });
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    // Cargar vendedores
    const cargarVendedores = async () => {
        setLoading(true);
        try {

            const response = await axios.get(`${API_URL}/vendedores/`);

            setVendedores(response.data);
        } catch (error) {
            console.error('❌ Error cargando vendedores:', error);
            console.error('Detalles del error:', error.response?.data);
            setMensaje({
                tipo: 'danger',
                texto: `Error al cargar la lista de vendedores: ${error.message}`
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarVendedores();
    }, []);

    // Manejar edición
    const handleEditar = (vendedor) => {
        setVendedorEditando(vendedor);
        setFormData({
            id_vendedor: vendedor.id_vendedor,
            nombre: vendedor.nombre,
            password: vendedor.password || '',
            activo: vendedor.activo
        });
        setShowModal(true);
    };

    // Manejar guardar
    const handleGuardar = async () => {
        if (!formData.nombre || !formData.password) {
            setMensaje({
                tipo: 'warning',
                texto: 'El nombre y la contraseña son obligatorios'
            });
            return;
        }

        try {
            const url = `${API_URL}/vendedores/${formData.id_vendedor}/`;
            const response = await axios.put(url, formData);

            setMensaje({
                tipo: 'success',
                texto: `Vendedor ${formData.id_vendedor} actualizado correctamente`
            });

            setShowModal(false);
            cargarVendedores();

            // Limpiar mensaje después de 3 segundos
            setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
        } catch (error) {
            console.error('Error guardando vendedor:', error);
            setMensaje({
                tipo: 'danger',
                texto: error.response?.data?.detail || 'Error al guardar el vendedor'
            });
        }
    };

    // Manejar creación de nuevo vendedor
    const handleNuevo = () => {
        setVendedorEditando(null);
        setFormData({
            id_vendedor: '',
            nombre: '',
            password: '1234',
            activo: true
        });
        setShowModal(true);
    };

    const handleCrear = async () => {
        if (!formData.id_vendedor || !formData.nombre || !formData.password) {
            setMensaje({
                tipo: 'warning',
                texto: 'Todos los campos son obligatorios'
            });
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/vendedores/`, formData);

            setMensaje({
                tipo: 'success',
                texto: `Vendedor ${formData.id_vendedor} creado correctamente`
            });

            setShowModal(false);
            cargarVendedores();

            setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
        } catch (error) {
            console.error('Error creando vendedor:', error);
            setMensaje({
                tipo: 'danger',
                texto: error.response?.data?.id_vendedor?.[0] || 'Error al crear el vendedor'
            });
        }
    };

    return (
        <div>
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="mb-0">
                            <span className="material-icons me-2" style={{ fontSize: 24, verticalAlign: 'middle' }}>
                                badge
                            </span>
                            Contraseñas de Vendedores
                        </h5>
                        <small className="text-muted">
                            Gestionar credenciales de acceso para la App Móvil
                        </small>
                    </div>
                    <button
                        className="btn btn-custom-save"
                        onClick={handleNuevo}
                        style={{ display: 'flex', alignItems: 'center' }}
                    >
                        <span className="material-icons me-1" style={{ fontSize: 16 }}>
                            add
                        </span>
                        Nuevo Vendedor
                    </button>
                </Card.Header>

                <Card.Body>
                    {mensaje.texto && (
                        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ tipo: '', texto: '' })}>
                            {mensaje.texto}
                        </Alert>
                    )}

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 text-muted">Cargando vendedores...</p>
                        </div>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th style={{ width: '15%' }}>ID</th>
                                    <th style={{ width: '30%' }}>Nombre</th>
                                    <th style={{ width: '25%' }}>Contraseña</th>
                                    <th style={{ width: '15%' }}>Estado</th>
                                    <th style={{ width: '15%' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendedores.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted py-4">
                                            No hay vendedores registrados
                                        </td>
                                    </tr>
                                ) : (
                                    vendedores.map(vendedor => (
                                        <tr key={vendedor.id_vendedor}>
                                            <td>
                                                <strong>{vendedor.id_vendedor}</strong>
                                            </td>
                                            <td>{vendedor.nombre}</td>
                                            <td>
                                                <code>{'•'.repeat(vendedor.password?.length || 4)}</code>
                                            </td>
                                            <td>
                                                {vendedor.activo ? (
                                                    <Badge bg="success">Activo</Badge>
                                                ) : (
                                                    <Badge bg="secondary">Inactivo</Badge>
                                                )}
                                            </td>
                                            <td>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handleEditar(vendedor)}
                                                >
                                                    <span className="material-icons" style={{ fontSize: 16 }}>
                                                        edit
                                                    </span>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    )}

                    <div className="alert alert-info mt-3">
                        <div className="d-flex align-items-start">
                            <span className="material-icons me-2">
                                info
                            </span>
                            <div>
                                <strong>Información importante:</strong>
                                <ul className="mb-0 mt-2">
                                    <li>Estos vendedores se usan para login en la <strong>App Móvil (AP Guerrero)</strong></li>
                                    <li>El ID debe ser único (ejemplo: ID1, ID2, ID3...)</li>
                                    <li>La contraseña debe tener al menos 4 caracteres</li>
                                    <li>Los cambios se reflejan inmediatamente en la App al hacer login</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Modal de edición/creación */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {vendedorEditando ? 'Editar Vendedor' : 'Nuevo Vendedor'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ paddingBottom: '1rem' }}>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>ID del Vendedor *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ejemplo: ID1, ID2, ID3..."
                                value={formData.id_vendedor}
                                onChange={(e) => setFormData({ ...formData, id_vendedor: e.target.value.toUpperCase() })}
                                disabled={vendedorEditando !== null}
                                style={{ textTransform: 'uppercase' }}
                            />
                            <Form.Text className="text-muted">
                                El ID no puede modificarse una vez creado
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Nombre del Vendedor *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ejemplo: Juan Pérez"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Contraseña *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Mínimo 4 caracteres"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <Form.Text className="text-muted">
                                Esta contraseña se usa en la App Móvil
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-1">
                            <Form.Check
                                type="switch"
                                id="activo-switch"
                                label="Vendedor activo"
                                checked={formData.activo}
                                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                style={{
                                    '--bs-form-switch-bg': formData.activo ? 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'-4 -4 8 8\'%3e%3ccircle r=\'3\' fill=\'%23fff\'/%3e%3c/svg%3e")' : 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'-4 -4 8 8\'%3e%3ccircle r=\'3\' fill=\'rgba(0,0,0,.25)\'/%3e%3c/svg%3e")'
                                }}
                                className={formData.activo ? 'custom-switch-active' : ''}
                            />
                            <Form.Text className="text-muted">
                                Solo los vendedores activos pueden hacer login
                            </Form.Text>
                            <style>{`
                                .custom-switch-active .form-check-input:checked {
                                    background-color: #002149 !important;
                                    border-color: #002149 !important;
                                }
                            `}</style>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowModal(false)}
                        style={{ minWidth: '120px' }}
                    >
                        Cancelar
                    </Button>
                    <button
                        onClick={vendedorEditando ? handleGuardar : handleCrear}
                        className="btn btn-custom-save"
                        style={{ minWidth: '150px' }}
                    >
                        {vendedorEditando ? 'Guardar Cambios' : 'Crear Vendedor'}
                    </button>
                    <style>{`
                        .btn-custom-save {
                            background-color: #002149;
                            border-color: #002149;
                            color: white;
                            font-weight: 500;
                        }
                        .btn-custom-save:hover {
                            background-color: #003366;
                            border-color: #003366;
                            color: white;
                        }
                        .btn-custom-save:focus, .btn-custom-save:active {
                            background-color: #001533 !important;
                            border-color: #001533 !important;
                            box-shadow: 0 0 0 0.25rem rgba(0, 33, 73, 0.5);
                        }
                    `}</style>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default GestionVendedores;
