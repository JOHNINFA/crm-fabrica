import React, { useState, useEffect } from 'react';
import {
    Button,
    Table,
    Badge,
    Alert,
    Card,
    Form,
    InputGroup,
    Dropdown,
    ButtonGroup,
    Spinner
} from 'react-bootstrap';
import CrearCajeroModal from './CrearCajeroModal';
import EditarCajeroModal from './EditarCajeroModal';
import EliminarCajeroModal from './EliminarCajeroModal';
import { cajeroService } from '../../services/cajeroService';
import { sucursalService } from '../../services/sucursalService';

const GestionCajeros = () => {
    // Estados principales
    const [cajeros, setCajeros] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Estados de modales
    const [showCrearModal, setShowCrearModal] = useState(false);
    const [showEditarModal, setShowEditarModal] = useState(false);
    const [showEliminarModal, setShowEliminarModal] = useState(false);
    const [cajeroSeleccionado, setCajeroSeleccionado] = useState(null);

    // Estados de filtros
    const [filtros, setFiltros] = useState({
        busqueda: '',
        sucursal: '',
        rol: '',
        estado: ''
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [cajerosData, sucursalesData] = await Promise.all([
                cajeroService.getAll(),
                sucursalService.getAll()
            ]);

            setCajeros(cajerosData);
            setSucursales(sucursalesData);
            setError('');
        } catch (error) {
            console.error('Error cargando datos:', error);
            setError('Error cargando datos');
        } finally {
            setLoading(false);
        }
    };

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const cajerosFiltrados = cajeros.filter(cajero => {
        // Validar que el cajero tenga las propiedades básicas
        if (!cajero || typeof cajero !== 'object') return false;

        const cumpleBusqueda = !filtros.busqueda ||
            (cajero.nombre && cajero.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase())) ||
            (cajero.email && cajero.email.toLowerCase().includes(filtros.busqueda.toLowerCase()));

        // Manejar sucursal de forma segura
        const sucursalId = cajero.sucursal_id || cajero.sucursal;
        const cumpleSucursal = !filtros.sucursal ||
            (sucursalId !== null && sucursalId !== undefined && sucursalId.toString() === filtros.sucursal);

        const cumpleRol = !filtros.rol || (cajero.rol && cajero.rol === filtros.rol);

        const cumpleEstado = !filtros.estado ||
            (filtros.estado === 'activo' && cajero.activo === true) ||
            (filtros.estado === 'inactivo' && cajero.activo === false);

        return cumpleBusqueda && cumpleSucursal && cumpleRol && cumpleEstado;
    });

    const handleCajeroCreado = (nuevoCajero) => {

        setSuccess('Cajero creado exitosamente');
        cargarDatos();
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleCajeroActualizado = (cajeroActualizado) => {

        setSuccess('Cajero actualizado exitosamente');
        cargarDatos();
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleCajeroEliminado = (cajeroEliminado) => {

        setSuccess('Cajero eliminado exitosamente');
        cargarDatos();
        setTimeout(() => setSuccess(''), 3000);
    };

    const abrirEditarModal = (cajero) => {
        setCajeroSeleccionado(cajero);
        setShowEditarModal(true);
    };

    const abrirEliminarModal = (cajero) => {
        setCajeroSeleccionado(cajero);
        setShowEliminarModal(true);
    };

    const getSucursalNombre = (sucursalId) => {
        if (!sucursalId && sucursalId !== 0) return 'Sin sucursal';
        const sucursal = sucursales.find(s => s.id === parseInt(sucursalId));
        return sucursal ? sucursal.nombre : `ID: ${sucursalId}`;
    };

    const limpiarFiltros = () => {
        setFiltros({
            busqueda: '',
            sucursal: '',
            rol: '',
            estado: ''
        });
    };

    return (
        <div className="container-fluid mt-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">
                        <span className="material-icons me-2" style={{ verticalAlign: 'middle' }}>
                            people
                        </span>
                        Gestión de Cajeros
                    </h2>
                    <p className="text-muted mb-0">
                        Administrar cajeros del sistema POS
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setShowCrearModal(true)}
                    size="lg"
                >
                    <span className="material-icons me-2" style={{ fontSize: 18 }}>
                        person_add
                    </span>
                    Nuevo Cajero
                </Button>
            </div>

            {/* Alertas */}
            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

            {/* Filtros */}
            <Card className="mb-4">
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">
                            <span className="material-icons me-2" style={{ fontSize: 18, verticalAlign: 'middle' }}>
                                filter_list
                            </span>
                            Filtros
                        </h6>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={limpiarFiltros}
                        >
                            Limpiar
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    <div className="row g-3">
                        <div className="col-md-3">
                            <Form.Label>Buscar</Form.Label>
                            <InputGroup>
                                <InputGroup.Text>
                                    <span className="material-icons" style={{ fontSize: 18 }}>
                                        search
                                    </span>
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Nombre o email..."
                                    value={filtros.busqueda}
                                    onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                                />
                            </InputGroup>
                        </div>
                        <div className="col-md-3">
                            <Form.Label>Sucursal</Form.Label>
                            <Form.Select
                                value={filtros.sucursal}
                                onChange={(e) => handleFiltroChange('sucursal', e.target.value)}
                            >
                                <option value="">Todas las sucursales</option>
                                {sucursales.map(sucursal => (
                                    <option key={sucursal.id} value={sucursal.id}>
                                        {sucursal.nombre}
                                    </option>
                                ))}
                            </Form.Select>
                        </div>
                        <div className="col-md-3">
                            <Form.Label>Rol</Form.Label>
                            <Form.Select
                                value={filtros.rol}
                                onChange={(e) => handleFiltroChange('rol', e.target.value)}
                            >
                                <option value="">Todos los roles</option>
                                <option value="CAJERO">Cajero</option>
                                <option value="SUPERVISOR">Supervisor</option>
                                <option value="ADMINISTRADOR">Administrador</option>
                            </Form.Select>
                        </div>
                        <div className="col-md-3">
                            <Form.Label>Estado</Form.Label>
                            <Form.Select
                                value={filtros.estado}
                                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                            >
                                <option value="">Todos los estados</option>
                                <option value="activo">Activos</option>
                                <option value="inactivo">Inactivos</option>
                            </Form.Select>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Estadísticas rápidas */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <Card className="text-center">
                        <Card.Body>
                            <h4 className="text-primary">{cajeros.length}</h4>
                            <small className="text-muted">Total Cajeros</small>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-3">
                    <Card className="text-center">
                        <Card.Body>
                            <h4 className="text-success">{cajeros.filter(c => c.activo).length}</h4>
                            <small className="text-muted">Activos</small>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-3">
                    <Card className="text-center">
                        <Card.Body>
                            <h4 className="text-warning">{cajeros.filter(c => c.rol === 'SUPERVISOR').length}</h4>
                            <small className="text-muted">Supervisores</small>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-3">
                    <Card className="text-center">
                        <Card.Body>
                            <h4 className="text-info">{cajerosFiltrados.length}</h4>
                            <small className="text-muted">Filtrados</small>
                        </Card.Body>
                    </Card>
                </div>
            </div>

            {/* Tabla de cajeros */}
            <Card>
                <Card.Header>
                    <h6 className="mb-0">
                        Lista de Cajeros ({cajerosFiltrados.length})
                    </h6>
                </Card.Header>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </Spinner>
                            <div className="mt-2">Cargando cajeros...</div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Email</th>
                                        <th>Teléfono</th>
                                        <th>Sucursal</th>
                                        <th>Rol</th>
                                        <th>Estado</th>
                                        <th>Permisos</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cajerosFiltrados.length > 0 ? (
                                        cajerosFiltrados.map(cajero => (
                                            <tr key={cajero.id}>
                                                <td>
                                                    <code>{cajero.id}</code>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <span className="material-icons me-2 text-muted">
                                                            person
                                                        </span>
                                                        <strong>{cajero.nombre}</strong>
                                                    </div>
                                                </td>
                                                <td>{cajero.email || <span className="text-muted">N/A</span>}</td>
                                                <td>{cajero.telefono || <span className="text-muted">N/A</span>}</td>
                                                <td>
                                                    <Badge bg="info">
                                                        {getSucursalNombre(cajero.sucursal_id || cajero.sucursal)}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Badge bg={
                                                        cajero.rol === 'ADMINISTRADOR' ? 'danger' :
                                                            cajero.rol === 'SUPERVISOR' ? 'warning' : 'secondary'
                                                    }>
                                                        {cajero.rol}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Badge bg={cajero.activo ? 'success' : 'secondary'}>
                                                        {cajero.activo ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1 flex-wrap">
                                                        {cajero.puede_hacer_descuentos && (
                                                            <Badge
                                                                bg="primary"
                                                                title={`Límite: ${cajero.limite_descuento}%`}
                                                                style={{ cursor: 'help' }}
                                                            >
                                                                Descuentos
                                                            </Badge>
                                                        )}
                                                        {cajero.puede_anular_ventas && (
                                                            <Badge bg="warning">
                                                                Anular
                                                            </Badge>
                                                        )}
                                                        {!cajero.puede_hacer_descuentos && !cajero.puede_anular_ventas && (
                                                            <span className="text-muted small">Sin permisos especiales</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <Dropdown as={ButtonGroup}>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => abrirEditarModal(cajero)}
                                                        >
                                                            <span className="material-icons" style={{ fontSize: 16 }}>
                                                                edit
                                                            </span>
                                                        </Button>

                                                        <Dropdown.Toggle
                                                            split
                                                            variant="outline-primary"
                                                            size="sm"
                                                        />

                                                        <Dropdown.Menu>
                                                            <Dropdown.Item onClick={() => abrirEditarModal(cajero)}>
                                                                <span className="material-icons me-2" style={{ fontSize: 16 }}>
                                                                    edit
                                                                </span>
                                                                Editar
                                                            </Dropdown.Item>
                                                            <Dropdown.Divider />
                                                            <Dropdown.Item
                                                                className="text-danger"
                                                                onClick={() => abrirEliminarModal(cajero)}
                                                            >
                                                                <span className="material-icons me-2" style={{ fontSize: 16 }}>
                                                                    delete
                                                                </span>
                                                                Eliminar
                                                            </Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="text-center py-5">
                                                <div className="text-muted">
                                                    <span className="material-icons mb-2" style={{ fontSize: 48 }}>
                                                        people_outline
                                                    </span>
                                                    <div>No se encontraron cajeros</div>
                                                    {Object.values(filtros).some(f => f) && (
                                                        <small>Intenta ajustar los filtros</small>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Modales */}
            <CrearCajeroModal
                show={showCrearModal}
                onHide={() => setShowCrearModal(false)}
                onCajeroCreado={handleCajeroCreado}
            />

            <EditarCajeroModal
                show={showEditarModal}
                onHide={() => setShowEditarModal(false)}
                cajero={cajeroSeleccionado}
                onCajeroActualizado={handleCajeroActualizado}
            />

            <EliminarCajeroModal
                show={showEliminarModal}
                onHide={() => setShowEliminarModal(false)}
                cajero={cajeroSeleccionado}
                onCajeroEliminado={handleCajeroEliminado}
            />
        </div>
    );
};

export default GestionCajeros;