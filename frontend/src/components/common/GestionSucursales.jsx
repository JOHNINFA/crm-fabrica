import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { sucursalService } from '../../services/sucursalService';
import CrearSucursalModal from './CrearSucursalModal';
import EditarSucursalModal from './EditarSucursalModal';
import EliminarSucursalModal from './EliminarSucursalModal';

const GestionSucursales = () => {
    // Estados principales
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para modales
    const [showCrearModal, setShowCrearModal] = useState(false);
    const [showEditarModal, setShowEditarModal] = useState(false);
    const [showEliminarModal, setShowEliminarModal] = useState(false);
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);

    // Cargar sucursales al montar el componente
    useEffect(() => {
        cargarSucursales();
    }, []);

    // Función para cargar sucursales
    const cargarSucursales = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await sucursalService.getAll();
            setSucursales(data);

        } catch (error) {
            console.error('❌ Error cargando sucursales:', error);
            setError('Error al cargar las sucursales');
        } finally {
            setLoading(false);
        }
    };

    // Manejar creación de sucursal
    const handleCrearSucursal = () => {
        setShowCrearModal(true);
    };

    // Manejar edición de sucursal
    const handleEditarSucursal = (sucursal) => {
        setSucursalSeleccionada(sucursal);
        setShowEditarModal(true);
    };

    // Manejar eliminación de sucursal
    const handleEliminarSucursal = (sucursal) => {
        setSucursalSeleccionada(sucursal);
        setShowEliminarModal(true);
    };

    // Manejar cambio de estado (activar/inactivar)
    const handleCambiarEstado = async (sucursal) => {
        try {
            const nuevoEstado = !sucursal.activo;
            await sucursalService.update(sucursal.id, { activo: nuevoEstado });

            // Actualizar la lista local
            setSucursales(prev =>
                prev.map(s =>
                    s.id === sucursal.id
                        ? { ...s, activo: nuevoEstado }
                        : s
                )
            );

            console.log(`✅ Sucursal ${nuevoEstado ? 'activada' : 'inactivada'}:`, sucursal.nombre);
        } catch (error) {
            console.error('❌ Error cambiando estado de sucursal:', error);
            setError('Error al cambiar el estado de la sucursal');
        }
    };

    // Callback para actualizar lista después de operaciones CRUD
    const handleSucursalCreada = (nuevaSucursal) => {
        setSucursales(prev => [...prev, nuevaSucursal]);
        setShowCrearModal(false);
    };

    const handleSucursalEditada = (sucursalEditada) => {
        setSucursales(prev =>
            prev.map(s =>
                s.id === sucursalEditada.id ? sucursalEditada : s
            )
        );
        setShowEditarModal(false);
        setSucursalSeleccionada(null);
    };

    const handleSucursalEliminada = (sucursalId) => {
        setSucursales(prev =>
            prev.map(s =>
                s.id === sucursalId
                    ? { ...s, activo: false }
                    : s
            )
        );
        setShowEliminarModal(false);
        setSucursalSeleccionada(null);
    };

    // Formatear fecha
    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A';
        return new Date(fecha).toLocaleDateString('es-ES');
    };

    if (loading) {
        return (
            <Container className="py-4">
                <div className="text-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </Spinner>
                    <p className="mt-2">Cargando sucursales...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            {/* Header */}
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="mb-1">
                                <span className="material-icons me-2" style={{ verticalAlign: 'middle' }}>
                                    business
                                </span>
                                Gestión de Sucursales
                            </h2>
                            <small className="text-muted">
                                Administrar sucursales del sistema
                            </small>
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleCrearSucursal}
                            className="d-flex align-items-center"
                        >
                            <span className="material-icons me-2" style={{ fontSize: 18 }}>
                                add
                            </span>
                            Nueva Sucursal
                        </Button>
                    </div>
                </Col>
            </Row>

            {/* Error Alert */}
            {error && (
                <Row className="mb-3">
                    <Col>
                        <Alert variant="danger" dismissible onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    </Col>
                </Row>
            )}

            {/* Estadísticas */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h4 className="text-primary">{sucursales.length}</h4>
                            <small className="text-muted">Total Sucursales</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h4 className="text-success">{sucursales.filter(s => s.activo).length}</h4>
                            <small className="text-muted">Activas</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h4 className="text-warning">{sucursales.filter(s => !s.activo).length}</h4>
                            <small className="text-muted">Inactivas</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h4 className="text-info">{sucursales.filter(s => s.es_principal).length}</h4>
                            <small className="text-muted">Principal</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Tabla de sucursales */}
            <Row>
                <Col>
                    <Card>
                        <Card.Header>
                            <h6 className="mb-0">
                                <span className="material-icons me-2" style={{ fontSize: 18, verticalAlign: 'middle' }}>
                                    list
                                </span>
                                Lista de Sucursales
                            </h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {sucursales.length === 0 ? (
                                <div className="text-center py-5">
                                    <span className="material-icons text-muted" style={{ fontSize: 48 }}>
                                        business_center
                                    </span>
                                    <p className="text-muted mt-2">No hay sucursales registradas</p>
                                    <Button variant="primary" onClick={handleCrearSucursal}>
                                        Crear Primera Sucursal
                                    </Button>
                                </div>
                            ) : (
                                <Table responsive hover className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>ID</th>
                                            <th>Nombre</th>
                                            <th>Dirección</th>
                                            <th>Teléfono</th>
                                            <th>Estado</th>
                                            <th>Tipo</th>
                                            <th>Fecha Creación</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sucursales.map((sucursal) => (
                                            <tr key={sucursal.id}>
                                                <td>
                                                    <Badge bg="secondary">{sucursal.id}</Badge>
                                                </td>
                                                <td>
                                                    <div className="fw-bold">{sucursal.nombre}</div>
                                                    {sucursal.ciudad && (
                                                        <small className="text-muted">{sucursal.ciudad}</small>
                                                    )}
                                                </td>
                                                <td>
                                                    <small>{sucursal.direccion || 'No especificada'}</small>
                                                </td>
                                                <td>
                                                    {sucursal.telefono || 'No especificado'}
                                                </td>
                                                <td>
                                                    <Badge
                                                        bg={sucursal.activo ? 'success' : 'secondary'}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleCambiarEstado(sucursal)}
                                                        title="Click para cambiar estado"
                                                    >
                                                        {sucursal.activo ? 'Activa' : 'Inactiva'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {sucursal.es_principal ? (
                                                        <Badge bg="primary">Principal</Badge>
                                                    ) : (
                                                        <Badge bg="outline-secondary">Sucursal</Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    <small>{formatearFecha(sucursal.fecha_creacion)}</small>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handleEditarSucursal(sucursal)}
                                                            title="Editar sucursal"
                                                        >
                                                            <span className="material-icons" style={{ fontSize: 16 }}>
                                                                edit
                                                            </span>
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleEliminarSucursal(sucursal)}
                                                            title="Eliminar sucursal"
                                                            disabled={sucursal.es_principal}
                                                        >
                                                            <span className="material-icons" style={{ fontSize: 16 }}>
                                                                delete
                                                            </span>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Modales */}
            <CrearSucursalModal
                show={showCrearModal}
                onHide={() => setShowCrearModal(false)}
                onSucursalCreada={handleSucursalCreada}
            />

            <EditarSucursalModal
                show={showEditarModal}
                onHide={() => {
                    setShowEditarModal(false);
                    setSucursalSeleccionada(null);
                }}
                sucursal={sucursalSeleccionada}
                onSucursalEditada={handleSucursalEditada}
            />

            <EliminarSucursalModal
                show={showEliminarModal}
                onHide={() => {
                    setShowEliminarModal(false);
                    setSucursalSeleccionada(null);
                }}
                sucursal={sucursalSeleccionada}
                onSucursalEliminada={handleSucursalEliminada}
            />
        </Container>
    );
};

export default GestionSucursales;