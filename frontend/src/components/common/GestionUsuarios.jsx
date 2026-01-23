import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, Alert, Modal } from 'react-bootstrap';
import { useUsuarios } from '../../context/UsuariosContext';
import rutasService from '../../services/rutasService';

const GestionUsuarios = () => {
    const {
        usuarios,
        vendedores,
        rutas: rutasContext,  // 🆕 Rutas del contexto
        sucursales,
        loading,
        crearUsuario,
        crearVendedor,
        actualizarUsuario,
        eliminarUsuario,
        getUsuariosPorModulo,
        getUsuariosUnificados,
        getRutasVendedor  // 🆕 Función para obtener rutas de un vendedor
    } = useUsuarios();

    // 🆕 Estado para rutas (para el select del formulario)
    const [rutas, setRutas] = useState([]);

    useEffect(() => {
        cargarRutas();
    }, []);

    const cargarRutas = async () => {
        try {
            const data = await rutasService.obtenerRutas();
            setRutas(data);
        } catch (error) {
            console.error('Error cargando rutas:', error);
        }
    };

    const [filtroModulo, setFiltroModulo] = useState('TODOS');
    const [showModal, setShowModal] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [usuarioPassword, setUsuarioPassword] = useState(null);
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [passwordsVisibles, setPasswordsVisibles] = useState({});  // 🆕 {id: true/false}

    // Estados del formulario
    const [formData, setFormData] = useState({
        codigo: '', // 🆕 ID personalizado
        nombre: '',
        ruta: '', // 🆕 Campo para Vendedores App
        email: '',
        telefono: '',
        password: '',
        sucursal: '',
        rol: 'CAJERO',
        activo: true,
        puede_hacer_descuentos: false,
        limite_descuento: 0,
        puede_anular_ventas: false,
        // 🆕 Permisos por módulo
        acceso_app_movil: false,
        acceso_pos: false,
        acceso_pedidos: false,
        acceso_cargue: false,
        acceso_produccion: false,
        acceso_inventario: false,
        acceso_reportes: false,
        acceso_configuracion: false
    });

    // 🆕 Usar lista unificada
    const todosLosUsuarios = getUsuariosUnificados();
    const usuariosFiltrados = filtroModulo === 'TODOS'
        ? todosLosUsuarios
        : filtroModulo === 'APP'
            ? todosLosUsuarios.filter(u => u.acceso_app_movil)
            : filtroModulo === 'POS'
                ? todosLosUsuarios.filter(u => u.acceso_pos)
                : filtroModulo === 'REMISIONES'
                    ? todosLosUsuarios.filter(u => u.acceso_pedidos)
                    : todosLosUsuarios;

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let resultado;

            // 🆕 Determinar si es vendedor de app o usuario de sistema
            const esVendedorApp = formData.rol === 'VENDEDOR';

            if (usuarioEditando) {
                // 🔧 Preparar datos para actualizar usuario del sistema
                const datosActualizar = esVendedorApp ? {
                    nombre: formData.nombre,
                    ruta: formData.ruta,
                    password: formData.password || undefined, // Solo si tiene valor
                    activo: formData.activo,
                    telefono: formData.telefono
                } : {
                    // Usuario del sistema - incluir TODOS los campos, especialmente permisos
                    nombre: formData.nombre,
                    email: formData.email,
                    telefono: formData.telefono,
                    rol: formData.rol,
                    activo: formData.activo,
                    puede_hacer_descuentos: formData.puede_hacer_descuentos,
                    limite_descuento: formData.limite_descuento,
                    puede_anular_ventas: formData.puede_anular_ventas,
                    // 🔐 PERMISOS DE ACCESO - Asegurar que se envíen explícitamente
                    acceso_app_movil: formData.acceso_app_movil,
                    acceso_pos: formData.acceso_pos,
                    acceso_pedidos: formData.acceso_pedidos,
                    acceso_cargue: formData.acceso_cargue,
                    acceso_produccion: formData.acceso_produccion,
                    acceso_inventario: formData.acceso_inventario,
                    acceso_reportes: formData.acceso_reportes,
                    acceso_configuracion: formData.acceso_configuracion
                };

                // Solo incluir password si tiene valor
                if (formData.password) {
                    datosActualizar.password = formData.password;
                }

                // Incluir sucursal si tiene valor
                if (formData.sucursal_id) {
                    datosActualizar.sucursal = formData.sucursal_id;
                }

                console.log('📤 Actualizando usuario:', usuarioEditando.id, datosActualizar);

                resultado = await actualizarUsuario(
                    usuarioEditando.id,
                    datosActualizar,
                    usuarioEditando.es_vendedor_app
                );
            } else {
                if (esVendedorApp) {
                    // Crear vendedor de App Móvil
                    resultado = await crearVendedor({
                        id_vendedor: formData.codigo, // 🆕 Enviar ID manual
                        nombre: formData.nombre,
                        ruta: formData.ruta, // 🆕 Enviar ruta
                        password: formData.password || '1234',
                        activo: formData.activo,
                        telefono: formData.telefono
                    });
                } else {
                    // Crear usuario de sistema
                    resultado = await crearUsuario(formData);
                }
            }

            if (resultado.success) {
                setMensaje({
                    tipo: 'success',
                    texto: `${esVendedorApp ? 'Vendedor' : 'Usuario'} ${usuarioEditando ? 'actualizado' : 'creado'} exitosamente`
                });

                // 🆕 Disparar evento global para sincronizar otros componentes (solo para vendedores)
                if (esVendedorApp) {
                    window.dispatchEvent(new CustomEvent('vendedorActualizado', {
                        detail: { id_vendedor: formData.codigo, nombre: formData.nombre }
                    }));
                }

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
            codigo: usuario.codigo || '',
            nombre: usuario.nombre || '',
            ruta: usuario.ruta || '', // 🆕 Cargar ruta
            email: usuario.email || '',
            telefono: usuario.telefono || '',
            password: '',
            sucursal: usuario.sucursal || '',
            rol: usuario.rol || 'CAJERO',
            activo: usuario.activo !== false,
            puede_hacer_descuentos: usuario.puede_hacer_descuentos || false,
            limite_descuento: usuario.limite_descuento || 0,
            puede_anular_ventas: usuario.puede_anular_ventas || false,
            acceso_app_movil: usuario.acceso_app_movil || false,
            acceso_pos: usuario.acceso_pos || false,
            acceso_pedidos: usuario.acceso_pedidos || false,
            acceso_cargue: usuario.acceso_cargue || false,
            acceso_produccion: usuario.acceso_produccion || false,
            acceso_inventario: usuario.acceso_inventario || false,
            acceso_reportes: usuario.acceso_reportes || false,
            acceso_configuracion: usuario.acceso_configuracion || false
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
            sucursal: '',
            rol: 'CAJERO',
            activo: true,
            puede_hacer_descuentos: false,
            limite_descuento: 0,
            puede_anular_ventas: false,
            acceso_app_movil: false,
            acceso_pos: false,
            acceso_pedidos: false,
            acceso_cargue: false,
            acceso_produccion: false,
            acceso_inventario: false,
            acceso_reportes: false,
            acceso_configuracion: false
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

    // 🆕 Mostrar badges de permisos
    const getPermisosBadges = (usuario) => {
        const permisos = [];
        if (usuario.acceso_app_movil) permisos.push(<Badge bg="success" className="me-1" key="app">App</Badge>);
        if (usuario.acceso_pos) permisos.push(<Badge bg="primary" className="me-1" key="pos">POS</Badge>);
        if (usuario.acceso_pedidos) permisos.push(<Badge bg="info" className="me-1" key="ped">Pedidos</Badge>);
        if (usuario.acceso_cargue) permisos.push(<Badge bg="warning" text="dark" className="me-1" key="car">Cargue</Badge>);
        if (usuario.acceso_produccion) permisos.push(<Badge bg="secondary" className="me-1" key="prod">Producción</Badge>);
        if (usuario.acceso_inventario) permisos.push(<Badge bg="dark" className="me-1" key="inv">Inventario</Badge>);
        if (usuario.acceso_reportes) permisos.push(<Badge bg="danger" className="me-1" key="rep">Reportes</Badge>);
        if (usuario.acceso_configuracion) permisos.push(<Badge bg="purple" style={{ backgroundColor: '#6f42c1' }} className="me-1" key="conf">Config</Badge>);
        return permisos.length > 0 ? permisos : <span className="text-muted">Sin permisos</span>;
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
                                Gestión Unificada de Usuarios
                            </h2>
                            <small className="text-muted">
                                Administrar usuarios del sistema y vendedores App Móvil
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
                        <Form.Select value={filtroModulo} onChange={(e) => setFiltroModulo(e.target.value)}>
                            <option value="TODOS">Todos los usuarios</option>
                            <option value="APP">App Móvil (Vendedores)</option>
                            <option value="POS">POS (Punto de Venta)</option>
                            <option value="REMISIONES">Pedidos/Remisiones</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            {/* Estadísticas */}
            <Row className="mb-4">
                <Col md={3} sm={6} className="mb-2">
                    <Card className="text-center h-100">
                        <Card.Body>
                            <h4 className="text-primary">{todosLosUsuarios.length}</h4>
                            <small className="text-muted">Total Usuarios</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3} sm={6} className="mb-2">
                    <Card className="text-center h-100 border-success">
                        <Card.Body>
                            <h4 className="text-success">{todosLosUsuarios.filter(u => u.es_vendedor_app).length}</h4>
                            <small className="text-muted">📱 Vendedores App</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3} sm={6} className="mb-2">
                    <Card className="text-center h-100 border-primary">
                        <Card.Body>
                            <h4 className="text-info">{todosLosUsuarios.filter(u => u.acceso_pos).length}</h4>
                            <small className="text-muted">🛒 Usuarios POS</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3} sm={6} className="mb-2">
                    <Card className="text-center h-100 border-warning">
                        <Card.Body>
                            <h4 className="text-warning">{todosLosUsuarios.filter(u => u.activo).length}</h4>
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
                            <Table responsive hover className="mb-0" size="sm">
                                <thead className="table-light">
                                    <tr>
                                        <th>Código</th>
                                        <th>Nombre</th>
                                        <th>Contraseña</th>
                                        <th>Rol</th>
                                        <th>Estado</th>
                                        <th>Accesos</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuariosFiltrados.map(usuario => {
                                        const key = `${usuario.es_vendedor_app ? 'v' : 'u'}-${usuario.id}`;
                                        const mostrarPassword = passwordsVisibles[key];
                                        return (
                                            <tr key={key}>
                                                <td>
                                                    <Badge bg={usuario.es_vendedor_app ? 'success' : 'dark'}>
                                                        {usuario.codigo || `ID${usuario.id}`}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="fw-bold">{usuario.nombre}</div>
                                                    {usuario.email && <small className="text-muted">{usuario.email}</small>}
                                                    {usuario.es_vendedor_app && <small className="text-success d-block">📱 App Móvil</small>}
                                                    {/* 🆕 Mostrar múltiples rutas del vendedor */}
                                                    {usuario.es_vendedor_app && getRutasVendedor && (
                                                        <div className="mt-1">
                                                            {getRutasVendedor(usuario.codigo).length > 0 ? (
                                                                <small style={{ color: '#163864' }}>
                                                                    <i className="bi bi-geo-alt me-1"></i>
                                                                    {getRutasVendedor(usuario.codigo).map(r => r.nombre).join(', ')}
                                                                </small>
                                                            ) : usuario.ruta ? (
                                                                <small style={{ color: '#163864' }}>
                                                                    <i className="bi bi-geo-alt me-1"></i>
                                                                    {usuario.ruta}
                                                                </small>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-1">
                                                        {usuario.password_visible ? (
                                                            <>
                                                                <code className="bg-light px-2 py-1 rounded">
                                                                    {mostrarPassword ? usuario.password_visible : '••••'}
                                                                </code>
                                                                <Button
                                                                    variant="link"
                                                                    size="sm"
                                                                    className="p-0 text-muted"
                                                                    onClick={() => setPasswordsVisibles(prev => ({ ...prev, [key]: !prev[key] }))}
                                                                    title={mostrarPassword ? 'Ocultar' : 'Ver'}
                                                                >
                                                                    <i className={`bi bi-eye${mostrarPassword ? '-slash' : ''}`}></i>
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <small className="text-muted fst-italic">No visible (resetear)</small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge bg={
                                                        usuario.rol === 'ADMINISTRADOR' ? 'danger' :
                                                            usuario.rol === 'VENDEDOR' ? 'success' :
                                                                usuario.rol === 'REMISIONES' ? 'info' :
                                                                    usuario.rol === 'SUPERVISOR' ? 'warning' : 'primary'
                                                    }>
                                                        {usuario.rol}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Badge bg={usuario.activo ? 'success' : 'secondary'}>
                                                        {usuario.activo ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1 flex-wrap">
                                                        {getPermisosBadges(usuario)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <Button variant="outline-primary" size="sm" onClick={() => handleEdit(usuario)} title="Editar"><i className="bi bi-pencil"></i></Button>
                                                        <Button variant="outline-warning" size="sm" onClick={() => handleRestablecerPassword(usuario)} title="Contraseña"><i className="bi bi-key"></i></Button>
                                                        <Button variant="outline-danger" size="sm" onClick={() => eliminarUsuario(usuario.id, usuario.es_vendedor_app)} title="Eliminar"><i className="bi bi-trash"></i></Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Modal para crear/editar usuario */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg" centered style={{ maxHeight: '90vh' }}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-person me-2"></i>
                        {usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <Row>
                            <Col md={12}>
                                <div className="alert alert-info py-2 mb-3">
                                    <small><i className="bi bi-info-circle me-1"></i>
                                        Para <b>Vendedores App</b>, el ID (ej: ID1, ID2) es obligatorio para vincular con rutas.
                                        Para <b>Otros</b>, se genera automáticamente si se deja vacío.
                                    </small>
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Código / ID {formData.rol === 'VENDEDOR' && '*'}</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder={formData.rol === 'VENDEDOR' ? 'Ej: ID1' : 'Automático'}
                                        value={formData.codigo}
                                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                        required={formData.rol === 'VENDEDOR'}
                                        disabled={usuarioEditando} // El ID no se debe cambiar una vez creado
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nombre *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {formData.rol === 'VENDEDOR' && usuarioEditando && (
                            <Row>
                                <Col md={12}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Rutas Asignadas</Form.Label>
                                        <div className="p-2 bg-light rounded border">
                                            {getRutasVendedor(formData.codigo).length > 0 ? (
                                                <span style={{ color: '#163864', fontWeight: '500' }}>
                                                    <i className="bi bi-geo-alt me-1"></i>
                                                    {getRutasVendedor(formData.codigo).map(r => r.nombre).join(', ')}
                                                </span>
                                            ) : (
                                                <span className="text-muted">Sin rutas asignadas</span>
                                            )}
                                        </div>
                                        <Form.Text className="text-muted">
                                            Las rutas se administran desde Gestión de Rutas
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}

                        {/* Campos para VENDEDORES App */}
                        {formData.rol === 'VENDEDOR' && (
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Teléfono</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={formData.telefono}
                                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                            placeholder="Ej: 3001234567"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Contraseña {usuarioEditando ? '(dejar vacío para mantener)' : '*'}</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required={!usuarioEditando}
                                            placeholder={usuarioEditando ? 'Nueva contraseña...' : 'Contraseña'}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}

                        {/* Campos para USUARIOS del sistema (no vendedores) */}
                        {formData.rol !== 'VENDEDOR' && (
                            <>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Teléfono</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.telefono}
                                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Contraseña {usuarioEditando ? '(dejar vacío para mantener)' : '*'}</Form.Label>
                                            <Form.Control
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                required={!usuarioEditando}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Sucursal *</Form.Label>
                                            <Form.Select
                                                value={formData.sucursal_id}
                                                onChange={(e) => setFormData({ ...formData, sucursal_id: e.target.value })}
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
                                </Row>
                            </>
                        )}

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Rol *</Form.Label>
                                    <Form.Select
                                        value={formData.rol}
                                        onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                                        required
                                        disabled={usuarioEditando} // No cambiar rol una vez creado
                                    >
                                        <option value="CAJERO">Cajero POS</option>
                                        <option value="VENDEDOR">Vendedor App Móvil</option>
                                        <option value="REMISIONES">Remisiones/Pedidos</option>
                                        <option value="SUPERVISOR">Supervisor</option>
                                        <option value="ADMINISTRADOR">Administrador</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Check type="checkbox" label="Usuario activo" checked={formData.activo} onChange={(e) => setFormData({ ...formData, activo: e.target.checked })} />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* 🆕 PERMISOS POR MÓDULO */}
                        <Card className="mb-3 border-primary">
                            <Card.Header className="bg-primary text-white py-2">
                                <strong>🔐 Permisos de Acceso a Módulos</strong>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={4}><Form.Check type="switch" label="📱 App Móvil (Ventas Ruta)" checked={formData.acceso_app_movil} onChange={(e) => setFormData({ ...formData, acceso_app_movil: e.target.checked })} /></Col>
                                    <Col md={4}><Form.Check type="switch" label="🛒 POS (Punto de Venta)" checked={formData.acceso_pos} onChange={(e) => setFormData({ ...formData, acceso_pos: e.target.checked })} /></Col>
                                    <Col md={4}><Form.Check type="switch" label="📦 Pedidos/Remisiones" checked={formData.acceso_pedidos} onChange={(e) => setFormData({ ...formData, acceso_pedidos: e.target.checked })} /></Col>
                                </Row>
                                <Row className="mt-2">
                                    <Col md={4}><Form.Check type="switch" label="📋 Cargue Vendedores" checked={formData.acceso_cargue} onChange={(e) => setFormData({ ...formData, acceso_cargue: e.target.checked })} /></Col>
                                    <Col md={4}><Form.Check type="switch" label="🏭 Producción/Planeación" checked={formData.acceso_produccion} onChange={(e) => setFormData({ ...formData, acceso_produccion: e.target.checked })} /></Col>
                                    <Col md={4}><Form.Check type="switch" label="📦 Inventario" checked={formData.acceso_inventario} onChange={(e) => setFormData({ ...formData, acceso_inventario: e.target.checked })} /></Col>
                                </Row>
                                <Row className="mt-2">
                                    <Col md={4}><Form.Check type="switch" label="📊 Reportes" checked={formData.acceso_reportes} onChange={(e) => setFormData({ ...formData, acceso_reportes: e.target.checked })} /></Col>
                                    <Col md={4}><Form.Check type="switch" label="⚙️ Configuración/Admin" checked={formData.acceso_configuracion} onChange={(e) => setFormData({ ...formData, acceso_configuracion: e.target.checked })} /></Col>
                                </Row>
                            </Card.Body>
                        </Card>

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