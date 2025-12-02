import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, Alert, Modal } from 'react-bootstrap';
import { useUsuarios } from '../../context/UsuariosContext';

const GestionUsuarios = () => {
    const { 
        usuarios, 
        sucursales, 
        loading, 
        crearUsuario, 
        actualizarUsuario, 
        eliminarUsuario,
        getUsuariosPorModulo 
    } = useUsuarios();

    const [filtroModulo, setFiltroModulo] = useState('TODOS');
    const [showModal, setShowModal] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [usuarioPassword, setUsuarioPassword] = useState(null);
    const [nuevaPassword, setNuevaPassword] = useState('');

    // Estados del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        password: '',
        sucursal_id: '',
        rol: 'CAJERO',
        modulo_asignado: 'POS', // POS, REMISIONES, AMBOS
        activo: true,
        puede_hacer_descuentos: false,
        limite_descuento: 0,
        puede_anular_ventas: false
    });

    const usuariosFiltrados = filtroModulo === 'TODOS' 
        ? usuarios 
        : getUsuariosPorModulo(filtroModulo);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            let resultado;
            if (usuarioEditando) {
                resultado = await actualizarUsuario(usuarioEditando.id, formData);
            } else {
                resultado = await crearUsuario(formData);
            }

            if (resultado.success) {
                setMensaje({ 
                    tipo: 'success', 
                    texto: `Usuario ${usuarioEditando ? 'actualizado' : 'creado'} exitosamente` 
                });
                handleCloseModal();
            } else {
                setMensaje({ tipo: 'danger', texto: resultado.error });
            }
        } catch (error) {
            setMensaje({ tipo: 'danger', texto: 'Error al procesar la solicitud' });
        }

        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    };

    const handleEdit = (usuario) => {
        setUsuarioEditando(usuario);
        setFormData({
            nombre: usuario.nombre || '',
            email: usuario.email || '',
            telefono: usuario.telefono || '',
            password: '', // No mostrar password actual
            sucursal_id: usuario.sucursal_id || usuario.sucursal || '',
            rol: usuario.rol || 'CAJERO',
            modulo_asignado: usuario.modulo_asignado || 'POS',
            activo: usuario.activo !== false,
            puede_hacer_descuentos: usuario.puede_hacer_descuentos || false,
            limite_descuento: usuario.limite_descuento || 0,
            puede_anular_ventas: usuario.puede_anular_ventas || false
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setUsuarioEditando(null);
        setFormData({
            nombre: '',
            email: '',
            telefono: '',
            password: '',
            sucursal_id: '',
            rol: 'CAJERO',
            modulo_asignado: 'POS',
            activo: true,
            puede_hacer_descuentos: false,
            limite_descuento: 0,
            puede_anular_ventas: false
        });
    };

    const handleRestablecerPassword = (usuario) => {
        setUsuarioPassword(usuario);
        setNuevaPassword('');
        setShowPasswordModal(true);
    };

    const handleGuardarPassword = async () => {
        if (!nuevaPassword || nuevaPassword.length < 3) {
            setMensaje({ tipo: 'danger', texto: 'La contraseña debe tener al menos 3 caracteres' });
            return;
        }

        try {
            const resultado = await actualizarUsuario(usuarioPassword.id, { password: nuevaPassword });
            if (resultado.success) {
                setMensaje({ tipo: 'success', texto: 'Contraseña actualizada exitosamente' });
                setShowPasswordModal(false);
                setUsuarioPassword(null);
                setNuevaPassword('');
            } else {
                setMensaje({ tipo: 'danger', texto: resultado.error });
            }
        } catch (error) {
            setMensaje({ tipo: 'danger', texto: 'Error al actualizar contraseña' });
        }

        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    };

    const getSucursalNombre = (sucursalId) => {
        const sucursal = sucursales.find(s => s.id === parseInt(sucursalId));
        return sucursal ? sucursal.nombre : 'Sin asignar';
    };

    const getModuloBadge = (usuario) => {
        const modulo = usuario.modulo_asignado || 'POS';
        const colores = {
            'POS': 'primary',
            'REMISIONES': 'success', 
            'AMBOS': 'warning'
        };
        return <Badge bg={colores[modulo] || 'secondary'}>{modulo}</Badge>;
    };

    return (
        <Container fluid className="py-4">
            {/* Header */}
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="mb-1">
                                <i className="bi bi-people me-2"></i>
                                Gestión de Usuarios
                            </h2>
                            <small className="text-muted">
                                Administrar usuarios para POS y Remisiones
                            </small>
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => setShowModal(true)}
                        >
                            <i className="bi bi-person-plus me-2"></i>
                            Nuevo Usuario
                        </Button>
                    </div>
                </Col>
            </Row>

            {/* Mensaje */}
            {mensaje.texto && (
                <Row className="mb-3">
                    <Col>
                        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ tipo: '', texto: '' })}>
                            {mensaje.texto}
                        </Alert>
                    </Col>
                </Row>
            )}

            {/* Filtros */}
            <Row className="mb-4">
                <Col md={4}>
                    <Form.Group>
                        <Form.Label>Filtrar por módulo:</Form.Label>
                        <Form.Select 
                            value={filtroModulo} 
                            onChange={(e) => setFiltroModulo(e.target.value)}
                        >
                            <option value="TODOS">Todos los usuarios</option>
                            <option value="POS">Solo POS (Vendedores)</option>
                            <option value="REMISIONES">Solo Remisiones</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            {/* Estadísticas */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h4 className="text-primary">{usuarios.length}</h4>
                            <small className="text-muted">Total Usuarios</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h4 className="text-success">{getUsuariosPorModulo('POS').length}</h4>
                            <small className="text-muted">Usuarios POS</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h4 className="text-info">{getUsuariosPorModulo('REMISIONES').length}</h4>
                            <small className="text-muted">Usuarios Remisiones</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h4 className="text-warning">{usuarios.filter(u => u.activo).length}</h4>
                            <small className="text-muted">Activos</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Tabla de usuarios */}
            <Row>
                <Col>
                    <Card>
                        <Card.Header>
                            <h6 className="mb-0">
                                <i className="bi bi-list me-2"></i>
                                Lista de Usuarios ({usuariosFiltrados.length})
                            </h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive hover className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Email</th>
                                        <th>Sucursal</th>
                                        <th>Rol</th>
                                        <th>Módulo</th>
                                        <th>Estado</th>
                                        <th>Permisos</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuariosFiltrados.map(usuario => (
                                        <tr key={usuario.id}>
                                            <td>
                                                <Badge bg="secondary">{usuario.id}</Badge>
                                            </td>
                                            <td>
                                                <div className="fw-bold">{usuario.nombre}</div>
                                                {usuario.telefono && (
                                                    <small className="text-muted">{usuario.telefono}</small>
                                                )}
                                            </td>
                                            <td>{usuario.email || 'N/A'}</td>
                                            <td>
                                                <Badge bg="info">
                                                    {getSucursalNombre(usuario.sucursal_id || usuario.sucursal)}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge bg={
                                                    usuario.rol === 'ADMINISTRADOR' ? 'danger' :
                                                    usuario.rol === 'SUPERVISOR' ? 'warning' : 'secondary'
                                                }>
                                                    {usuario.rol}
                                                </Badge>
                                            </td>
                                            <td>{getModuloBadge(usuario)}</td>
                                            <td>
                                                <Badge bg={usuario.activo ? 'success' : 'secondary'}>
                                                    {usuario.activo ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-1 flex-wrap">
                                                    {usuario.puede_hacer_descuentos && (
                                                        <Badge bg="primary" title={`Límite: ${usuario.limite_descuento}%`}>
                                                            Descuentos
                                                        </Badge>
                                                    )}
                                                    {usuario.puede_anular_ventas && (
                                                        <Badge bg="warning">Anular</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-1">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleEdit(usuario)}
                                                        title="Editar usuario"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </Button>
                                                    <Button
                                                        variant="outline-warning"
                                                        size="sm"
                                                        onClick={() => handleRestablecerPassword(usuario)}
                                                        title="Restablecer contraseña"
                                                    >
                                                        <i className="bi bi-key"></i>
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => eliminarUsuario(usuario.id)}
                                                        title="Eliminar usuario"
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Modal para crear/editar usuario */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg" centered style={{maxHeight: '90vh'}}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-person me-2"></i>
                        {usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body style={{maxHeight: '70vh', overflowY: 'auto'}}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nombre *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Teléfono</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.telefono}
                                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Contraseña {usuarioEditando ? '(dejar vacío para mantener)' : '*'}</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        required={!usuarioEditando}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Sucursal *</Form.Label>
                                    <Form.Select
                                        value={formData.sucursal_id}
                                        onChange={(e) => setFormData({...formData, sucursal_id: e.target.value})}
                                        required
                                    >
                                        <option value="">Seleccionar sucursal...</option>
                                        {sucursales.map(sucursal => (
                                            <option key={sucursal.id} value={sucursal.id}>
                                                {sucursal.nombre}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Rol *</Form.Label>
                                    <Form.Select
                                        value={formData.rol}
                                        onChange={(e) => setFormData({...formData, rol: e.target.value})}
                                        required
                                    >
                                        <option value="CAJERO">Cajero</option>
                                        <option value="SUPERVISOR">Supervisor</option>
                                        <option value="ADMINISTRADOR">Administrador</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Módulo Asignado *</Form.Label>
                                    <Form.Select
                                        value={formData.modulo_asignado}
                                        onChange={(e) => setFormData({...formData, modulo_asignado: e.target.value})}
                                        required
                                    >
                                        <option value="POS">Solo POS (Vendedor)</option>
                                        <option value="REMISIONES">Solo Remisiones</option>
                                        <option value="AMBOS">POS y Remisiones</option>
                                    </Form.Select>
                                    <Form.Text className="text-muted">
                                        POS: Usuario se comporta como vendedor. Remisiones: Solo usuario sin función de venta.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        label="Usuario activo"
                                        checked={formData.activo}
                                        onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        
                        <div className="d-flex gap-2 justify-content-end mt-4">
                            <Button variant="secondary" onClick={handleCloseModal}>
                                Cancelar
                            </Button>
                            <Button variant="primary" type="submit">
                                <i className="bi bi-check-lg me-2"></i>
                                {usuarioEditando ? 'Actualizar' : 'Crear'} Usuario
                            </Button>
                        </div>
                    </Modal.Body>
                </Form>
            </Modal>

            {/* Modal para restablecer contraseña */}
            <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-key me-2"></i>
                        Restablecer Contraseña
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {usuarioPassword && (
                        <>
                            <div className="alert alert-info">
                                <strong>Usuario:</strong> {usuarioPassword.nombre}
                            </div>
                            <Form.Group className="mb-3">
                                <Form.Label>Nueva Contraseña *</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={nuevaPassword}
                                    onChange={(e) => setNuevaPassword(e.target.value)}
                                    placeholder="Ingrese la nueva contraseña"
                                    autoFocus
                                />
                                <Form.Text className="text-muted">
                                    Mínimo 3 caracteres
                                </Form.Text>
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleGuardarPassword}>
                        <i className="bi bi-check-lg me-2"></i>
                        Guardar Contraseña
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default GestionUsuarios;