import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { cajeroService } from '../services/cajeroService';
import { sucursalService } from '../services/sucursalService';

const CajerosScreen = () => {
    const navigate = useNavigate();
    const [cajeros, setCajeros] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Estados del modal
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editando, setEditando] = useState(false);
    const [cajeroEditando, setCajeroEditando] = useState(null);
    const [cajeroAEliminar, setCajeroAEliminar] = useState(null);

    // Estados del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        password: '',
        confirmarPassword: '',
        sucursal_id: '',
        modulo_asignado: 'POS',
        rol: 'CAJERO',
        puede_hacer_descuentos: false,
        limite_descuento: 0,
        puede_anular_ventas: false,
        activo: true
    });

    // Cargar sucursales
    const cargarSucursales = async () => {
        try {
            const data = await sucursalService.getActivas();
            setSucursales(data);

            // Seleccionar primera sucursal por defecto
            if (data.length > 0 && !sucursalSeleccionada) {
                setSucursalSeleccionada(data[0].id.toString());
            }
        } catch (error) {
            console.error('Error cargando sucursales:', error);
            setError('Error al cargar las sucursales');
        }
    };

    // Cargar cajeros por sucursal
    const cargarCajeros = async () => {
        if (!sucursalSeleccionada) return;

        setLoading(true);
        setError(null);
        try {
            const data = await cajeroService.getBySucursal(sucursalSeleccionada);
            setCajeros(data);
        } catch (error) {
            console.error('Error cargando cajeros:', error);
            setError('Error al cargar los cajeros');
        } finally {
            setLoading(false);
        }
    };

    // Cargar datos al montar y cuando cambia la sucursal
    useEffect(() => {
        cargarSucursales();
    }, []);

    useEffect(() => {
        if (sucursalSeleccionada) {
            cargarCajeros();
        }
    }, [sucursalSeleccionada]);

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
    const handleNuevoCajero = () => {
        setFormData({
            nombre: '',
            password: '',
            confirmarPassword: '',
            sucursal_id: sucursalSeleccionada,
            modulo_asignado: 'POS',
            rol: 'CAJERO',
            puede_hacer_descuentos: false,
            limite_descuento: 0,
            puede_anular_ventas: false,
            activo: true
        });
        setEditando(false);
        setCajeroEditando(null);
        setShowModal(true);
    };

    // Abrir modal para editar
    const handleEditarCajero = (cajero) => {
        console.log('Editando cajero:', cajero);

        // Validar que el cajero tenga las propiedades necesarias
        if (!cajero || typeof cajero !== 'object') {
            setError('Error: Cajero inválido seleccionado');
            return;
        }

        // Obtener sucursal_id de forma segura
        const sucursalId = cajero.sucursal_id || cajero.sucursal || '';

        setFormData({
            nombre: cajero.nombre || '',
            password: '',
            confirmarPassword: '',
            sucursal_id: sucursalId ? sucursalId.toString() : sucursalSeleccionada,
            activo: cajero.activo !== undefined ? cajero.activo : true
        });
        setEditando(true);
        setCajeroEditando(cajero);
        setShowModal(true);
    };

    // Cerrar modal
    const handleCerrarModal = () => {
        setShowModal(false);
        setFormData({
            nombre: '',
            password: '',
            confirmarPassword: '',
            sucursal_id: sucursalSeleccionada,
            activo: true
        });
        setEditando(false);
        setCajeroEditando(null);
    };

    // Manejar cambios en el formulario
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Guardar cajero
    const handleGuardarCajero = async (e) => {
        e.preventDefault();

        if (!formData.nombre.trim()) {
            setError('El nombre del cajero es obligatorio');
            return;
        }

        if (!editando && !formData.password) {
            setError('La contraseña es obligatoria para nuevos cajeros');
            return;
        }

        if (formData.password && formData.password !== formData.confirmarPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (!formData.sucursal_id) {
            setError('Debe seleccionar una sucursal');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const dataToSend = {
                nombre: formData.nombre.trim(),
                sucursal_id: parseInt(formData.sucursal_id),
                activo: formData.activo
            };

            // Solo incluir password si se proporcionó
            if (formData.password) {
                dataToSend.password = formData.password;
            }

            if (editando) {
                await cajeroService.update(cajeroEditando.id, dataToSend);
                setSuccess('Cajero actualizado exitosamente');
            } else {
                await cajeroService.create(dataToSend);
                setSuccess('Cajero creado exitosamente');
            }

            handleCerrarModal();
            await cargarCajeros();
        } catch (error) {
            console.error('Error guardando cajero:', error);
            setError(editando ? 'Error al actualizar el cajero' : 'Error al crear el cajero');
        } finally {
            setLoading(false);
        }
    };

    // Cambiar estado de cajero
    const handleCambiarEstado = async (cajero) => {
        if (!cajero || !cajero.id) {
            setError('Error: Cajero inválido seleccionado');
            return;
        }

        setLoading(true);
        try {
            const datosActualizados = {
                nombre: cajero.nombre,
                sucursal_id: cajero.sucursal_id || cajero.sucursal,
                activo: !cajero.activo
            };

            await cajeroService.update(cajero.id, datosActualizados);
            setSuccess(`Cajero ${cajero.activo ? 'desactivado' : 'activado'} exitosamente`);
            await cargarCajeros();
        } catch (error) {
            console.error('Error cambiando estado:', error);
            setError('Error al cambiar el estado del cajero');
        } finally {
            setLoading(false);
        }
    };

    // Abrir modal de confirmación para eliminar
    const handleEliminarCajero = (cajero) => {
        if (!cajero || !cajero.id) {
            setError('Error: Cajero inválido seleccionado');
            return;
        }
        setCajeroAEliminar(cajero);
        setShowDeleteModal(true);
    };

    // Confirmar eliminación de cajero
    const confirmarEliminarCajero = async () => {
        if (!cajeroAEliminar) return;

        setLoading(true);
        try {
            await cajeroService.delete(cajeroAEliminar.id);
            setSuccess(`Cajero "${cajeroAEliminar.nombre}" eliminado exitosamente`);
            setShowDeleteModal(false);
            setCajeroAEliminar(null);
            await cargarCajeros();
        } catch (error) {
            console.error('Error eliminando cajero:', error);
            setError('Error al eliminar el cajero');
        } finally {
            setLoading(false);
        }
    };

    // Cancelar eliminación
    const cancelarEliminarCajero = () => {
        setShowDeleteModal(false);
        setCajeroAEliminar(null);
    };

    // Obtener nombre de sucursal
    const getNombreSucursal = (sucursalId) => {
        if (!sucursalId && sucursalId !== 0) return 'N/A';
        const sucursal = sucursales.find(s => s.id === parseInt(sucursalId));
        return sucursal ? sucursal.nombre : `ID: ${sucursalId}`;
    };

    return (
        <div className="cajeros-screen" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
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
                                        <i className="bi bi-people me-2"></i>
                                        Gestión de Cajeros
                                    </h2>
                                    <small className="text-muted">
                                        Administra los cajeros por sucursal
                                    </small>
                                </div>
                            </div>
                        </Col>
                        <Col xs="auto">
                            <Button
                                variant="primary"
                                onClick={handleNuevoCajero}
                                disabled={loading || !sucursalSeleccionada}
                            >
                                <i className="bi bi-plus-lg me-1"></i>
                                Nuevo Cajero
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

                {/* Selector de sucursal */}
                <Card className="mb-4">
                    <Card.Body>
                        <Row className="align-items-center">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        <i className="bi bi-building me-1"></i>
                                        Seleccionar Sucursal:
                                    </Form.Label>
                                    <Form.Select
                                        value={sucursalSeleccionada}
                                        onChange={(e) => setSucursalSeleccionada(e.target.value)}
                                        disabled={loading}
                                    >
                                        <option value="">Seleccione una sucursal...</option>
                                        {sucursales.map((sucursal) => (
                                            <option key={sucursal.id} value={sucursal.id}>
                                                {sucursal.nombre}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <div className="text-end">
                                    <small className="text-muted">
                                        Los cajeros se gestionan por sucursal independiente
                                    </small>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Tabla de cajeros */}
                {sucursalSeleccionada && (
                    <Card>
                        <Card.Header>
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    <i className="bi bi-list me-2"></i>
                                    Cajeros - {getNombreSucursal(parseInt(sucursalSeleccionada))}
                                </h5>
                                <Badge bg="primary" className="fs-6">
                                    {cajeros.length} cajeros
                                </Badge>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {loading ? (
                                <div className="text-center p-4">
                                    <Spinner animation="border" className="me-2" />
                                    <span>Cargando cajeros...</span>
                                </div>
                            ) : cajeros.length > 0 ? (
                                <Table striped hover className="mb-0">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Sucursal</th>
                                            <th>Estado</th>
                                            <th>Fecha Creación</th>
                                            <th width="180">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cajeros.map((cajero, index) => {
                                            // Validar que el cajero sea válido
                                            if (!cajero || typeof cajero !== 'object') {
                                                console.warn(`Cajero inválido en índice ${index}:`, cajero);
                                                return null;
                                            }

                                            return (
                                                <tr key={cajero.id || index}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <i className="bi bi-person-circle me-2" style={{ fontSize: '1.5rem' }}></i>
                                                            <strong>{cajero.nombre || 'Sin nombre'}</strong>
                                                        </div>
                                                    </td>
                                                    <td>{getNombreSucursal(cajero.sucursal_id || cajero.sucursal)}</td>
                                                    <td>
                                                        <Badge bg={cajero.activo ? 'success' : 'secondary'}>
                                                            {cajero.activo ? 'Activo' : 'Inactivo'}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        {cajero.fecha_creacion
                                                            ? new Date(cajero.fecha_creacion).toLocaleDateString('es-ES')
                                                            : 'N/A'
                                                        }
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                onClick={() => handleEditarCajero(cajero)}
                                                                title="Editar"
                                                                disabled={!cajero.id}
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </Button>
                                                            <Button
                                                                variant={cajero.activo ? 'outline-warning' : 'outline-success'}
                                                                size="sm"
                                                                onClick={() => handleCambiarEstado(cajero)}
                                                                title={cajero.activo ? 'Desactivar' : 'Activar'}
                                                                disabled={!cajero.id}
                                                            >
                                                                <i className={`bi ${cajero.activo ? 'bi-pause' : 'bi-play'}`}></i>
                                                            </Button>
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => handleEliminarCajero(cajero)}
                                                                title="Eliminar"
                                                                disabled={!cajero.id}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="text-center p-5">
                                    <i className="bi bi-people" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                                    <h5 className="mt-3 text-muted">No hay cajeros registrados</h5>
                                    <p className="text-muted">
                                        Crea el primer cajero para la sucursal {getNombreSucursal(parseInt(sucursalSeleccionada))}
                                    </p>
                                    <Button variant="primary" onClick={handleNuevoCajero}>
                                        <i className="bi bi-plus-lg me-1"></i>
                                        Crear Primer Cajero
                                    </Button>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                )}

                {!sucursalSeleccionada && (
                    <Card>
                        <Card.Body className="text-center p-5">
                            <i className="bi bi-building" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                            <h5 className="mt-3 text-muted">Selecciona una sucursal</h5>
                            <p className="text-muted">
                                Primero debes seleccionar una sucursal para ver y gestionar sus cajeros
                            </p>
                        </Card.Body>
                    </Card>
                )}
            </Container>

            {/* Modal para crear/editar cajero */}
            <Modal show={showModal} onHide={handleCerrarModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className={`bi ${editando ? 'bi-pencil' : 'bi-plus-lg'} me-2`}></i>
                        {editando ? 'Editar Cajero' : 'Nuevo Cajero'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleGuardarCajero}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <i className="bi bi-person me-1"></i>
                                        Nombre del Cajero *
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                        placeholder="Ej: Juan Pérez, María García..."
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <i className="bi bi-building me-1"></i>
                                        Sucursal *
                                    </Form.Label>
                                    <Form.Select
                                        name="sucursal_id"
                                        value={formData.sucursal_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Seleccione una sucursal...</option>
                                        {sucursales.map((sucursal) => (
                                            <option key={sucursal.id} value={sucursal.id}>
                                                {sucursal.nombre}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <i className="bi bi-lock me-1"></i>
                                        Contraseña {editando ? '(dejar vacío para no cambiar)' : '*'}
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Contraseña de acceso"
                                        required={!editando}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <i className="bi bi-lock-fill me-1"></i>
                                        Confirmar Contraseña {editando ? '' : '*'}
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="confirmarPassword"
                                        value={formData.confirmarPassword}
                                        onChange={handleInputChange}
                                        placeholder="Confirmar contraseña"
                                        required={!editando && formData.password}
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
                                        label="Cajero activo"
                                    />
                                    <Form.Text className="text-muted">
                                        Los cajeros inactivos no podrán hacer login en el sistema
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
                            {editando ? 'Actualizar' : 'Crear'} Cajero
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal de confirmación para eliminar cajero */}
            <Modal show={showDeleteModal} onHide={cancelarEliminarCajero} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="text-danger">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Eliminar Cajero
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center mb-3">
                        <i className="bi bi-person-x" style={{ fontSize: '3rem', color: '#dc3545' }}></i>
                    </div>

                    <p className="text-center mb-3">
                        ¿Está seguro que desea eliminar el cajero?
                    </p>

                    {cajeroAEliminar && (
                        <div className="card">
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-sm-4">
                                        <strong>Nombre:</strong>
                                    </div>
                                    <div className="col-sm-8">
                                        {cajeroAEliminar.nombre}
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-sm-4">
                                        <strong>Sucursal:</strong>
                                    </div>
                                    <div className="col-sm-8">
                                        {getNombreSucursal(cajeroAEliminar.sucursal_id || cajeroAEliminar.sucursal)}
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-sm-4">
                                        <strong>Estado:</strong>
                                    </div>
                                    <div className="col-sm-8">
                                        <Badge bg={cajeroAEliminar.activo ? 'success' : 'secondary'}>
                                            {cajeroAEliminar.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="alert alert-warning mt-3">
                        <div className="d-flex align-items-center">
                            <i className="bi bi-info-circle me-2"></i>
                            <div>
                                <strong>Nota:</strong> Esta acción desactivará el cajero permanentemente.
                                El cajero no podrá iniciar sesión pero se mantendrá el historial de sus transacciones.
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={cancelarEliminarCajero} disabled={loading}>
                        <i className="bi bi-x-lg me-1"></i>
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={confirmarEliminarCajero}
                        disabled={loading}
                    >
                        {loading ? (
                            <Spinner animation="border" size="sm" className="me-1" />
                        ) : (
                            <i className="bi bi-trash me-1"></i>
                        )}
                        Eliminar Cajero
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CajerosScreen;