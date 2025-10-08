import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { sucursalService } from '../services/sucursalService';

const SucursalesScreen = () => {
    const navigate = useNavigate();
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Estados del modal
    const [showModal, setShowModal] = useState(false);
    const [editando, setEditando] = useState(false);
    const [sucursalEditando, setSucursalEditando] = useState(null);

    // Estados del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        telefono: '',
        activo: true
    });

    // Cargar sucursales
    const cargarSucursales = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await sucursalService.getAll();
            setSucursales(data);
        } catch (error) {
            console.error('Error cargando sucursales:', error);
            setError('Error al cargar las sucursales');
        } finally {
            setLoading(false);
        }
    };

    // Cargar datos al montar
    useEffect(() => {
        cargarSucursales();
    }, []);

    // Limpiar alertas
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    // Abrir modal para crear
    const handleNuevaSucursal = () => {
        setFormData({
            nombre: '',
            direccion: '',
            telefono: '',
            activo: true
        });
        setEditando(false);
        setSucursalEditando(null);
        setShowModal(true);
    };

    // Abrir modal para editar
    const handleEditarSucursal = (sucursal) => {
        setFormData({
            nombre: sucursal.nombre,
            direccion: sucursal.direccion || '',
            telefono: sucursal.telefono || '',
            activo: sucursal.activo
        });
        setEditando(true);
        setSucursalEditando(sucursal);
        setShowModal(true);
    };

    // Cerrar modal
    const handleCerrarModal = () => {
        setShowModal(false);
        setFormData({
            nombre: '',
            direccion: '',
            telefono: '',
            activo: true
        });
        setEditando(false);
        setSucursalEditando(null);
    };

    // Manejar cambios en el formulario
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Guardar sucursal
    const handleGuardarSucursal = async (e) => {
        e.preventDefault();

        if (!formData.nombre.trim()) {
            setError('El nombre de la sucursal es obligatorio');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (editando) {
                await sucursalService.update(sucursalEditando.id, formData);
                setSuccess('Sucursal actualizada exitosamente');
            } else {
                await sucursalService.create(formData);
                setSuccess('Sucursal creada exitosamente');
            }

            handleCerrarModal();
            await cargarSucursales();
        } catch (error) {
            console.error('Error guardando sucursal:', error);
            setError(editando ? 'Error al actualizar la sucursal' : 'Error al crear la sucursal');
        } finally {
            setLoading(false);
        }
    };

    // Cambiar estado de sucursal
    const handleCambiarEstado = async (sucursal) => {
        setLoading(true);
        try {
            await sucursalService.update(sucursal.id, {
                ...sucursal,
                activo: !sucursal.activo
            });
            setSuccess(`Sucursal ${sucursal.activo ? 'desactivada' : 'activada'} exitosamente`);
            await cargarSucursales();
        } catch (error) {
            console.error('Error cambiando estado:', error);
            setError('Error al cambiar el estado de la sucursal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sucursales-screen" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #dee2e6', padding: '1rem 0' }}>
                <Container>
                    <Row className="align-items-center">
                        <Col>
                            <div className="d-flex align-items-center">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => navigate('/cajero')}
                                    className="me-3"
                                >
                                    <i className="bi bi-arrow-left me-1"></i>
                                    Volver
                                </Button>
                                <div>
                                    <h2 className="mb-1">
                                        <i className="bi bi-building me-2"></i>
                                        Gestión de Sucursales
                                    </h2>
                                    <small className="text-muted">
                                        Administra las sucursales de tu negocio
                                    </small>
                                </div>
                            </div>
                        </Col>
                        <Col xs="auto">
                            <Button
                                variant="primary"
                                onClick={handleNuevaSucursal}
                                disabled={loading}
                            >
                                <i className="bi bi-plus-lg me-1"></i>
                                Nueva Sucursal
                            </Button>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Contenido principal */}
            <Container className="py-4">
                {/* Alertas */}
                {error && (
                    <Alert variant="danger" className="mb-4">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert variant="success" className="mb-4">
                        <i className="bi bi-check-circle me-2"></i>
                        {success}
                    </Alert>
                )}

                {/* Tabla de sucursales */}
                <Card>
                    <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <i className="bi bi-list me-2"></i>
                                Lista de Sucursales
                            </h5>
                            <Badge bg="primary" className="fs-6">
                                {sucursales.length} sucursales
                            </Badge>
                        </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                        {loading ? (
                            <div className="text-center p-4">
                                <Spinner animation="border" className="me-2" />
                                <span>Cargando sucursales...</span>
                            </div>
                        ) : sucursales.length > 0 ? (
                            <Table striped hover className="mb-0">
                                <thead className="table-dark">
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Dirección</th>
                                        <th>Teléfono</th>
                                        <th>Estado</th>
                                        <th>Fecha Creación</th>
                                        <th width="150">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sucursales.map((sucursal) => (
                                        <tr key={sucursal.id}>
                                            <td>
                                                <strong>{sucursal.nombre}</strong>
                                            </td>
                                            <td>{sucursal.direccion || '-'}</td>
                                            <td>{sucursal.telefono || '-'}</td>
                                            <td>
                                                <Badge bg={sucursal.activo ? 'success' : 'secondary'}>
                                                    {sucursal.activo ? 'Activa' : 'Inactiva'}
                                                </Badge>
                                            </td>
                                            <td>
                                                {new Date(sucursal.fecha_creacion).toLocaleDateString('es-ES')}
                                            </td>
                                            <td>
                                                <div className="d-flex gap-1">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleEditarSucursal(sucursal)}
                                                        title="Editar"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </Button>
                                                    <Button
                                                        variant={sucursal.activo ? 'outline-warning' : 'outline-success'}
                                                        size="sm"
                                                        onClick={() => handleCambiarEstado(sucursal)}
                                                        title={sucursal.activo ? 'Desactivar' : 'Activar'}
                                                    >
                                                        <i className={`bi ${sucursal.activo ? 'bi-pause' : 'bi-play'}`}></i>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : (
                            <div className="text-center p-5">
                                <i className="bi bi-building" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                                <h5 className="mt-3 text-muted">No hay sucursales registradas</h5>
                                <p className="text-muted">Crea tu primera sucursal para comenzar</p>
                                <Button variant="primary" onClick={handleNuevaSucursal}>
                                    <i className="bi bi-plus-lg me-1"></i>
                                    Crear Primera Sucursal
                                </Button>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Container>

            {/* Modal para crear/editar sucursal */}
            <Modal show={showModal} onHide={handleCerrarModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className={`bi ${editando ? 'bi-pencil' : 'bi-plus-lg'} me-2`}></i>
                        {editando ? 'Editar Sucursal' : 'Nueva Sucursal'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleGuardarSucursal}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <i className="bi bi-building me-1"></i>
                                        Nombre de la Sucursal *
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                        placeholder="Ej: Centro Norte, Sur, Principal..."
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <i className="bi bi-telephone me-1"></i>
                                        Teléfono
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleInputChange}
                                        placeholder="Ej: (601) 123-4567"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <i className="bi bi-geo-alt me-1"></i>
                                        Dirección
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="direccion"
                                        value={formData.direccion}
                                        onChange={handleInputChange}
                                        placeholder="Dirección completa de la sucursal..."
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        name="activo"
                                        checked={formData.activo}
                                        onChange={handleInputChange}
                                        label="Sucursal activa"
                                    />
                                    <Form.Text className="text-muted">
                                        Las sucursales inactivas no aparecerán en el sistema de cajeros
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCerrarModal}>
                            <i className="bi bi-x-lg me-1"></i>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? (
                                <Spinner animation="border" size="sm" className="me-1" />
                            ) : (
                                <i className={`bi ${editando ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i>
                            )}
                            {editando ? 'Actualizar' : 'Crear'} Sucursal
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default SucursalesScreen;