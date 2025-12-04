import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner, Dropdown } from 'react-bootstrap';
import { useCajeroPedidos } from '../../context/CajeroPedidosContext';
import { cajeroService } from '../../services/cajeroService';
import './LoginCajeroModal.css';

const LoginCajeroModal = ({ show, onHide }) => {
    const {
        login,
        logout,
        getCajerosDisponibles,
        isAuthenticated,
        cajeroLogueado,
        sucursalActiva,
        loading
    } = useCajeroPedidos();

    // Estados del formulario
    const [cajeroSeleccionado, setCajeroSeleccionado] = useState('');
    const [password, setPassword] = useState('');
    const [cajerosDisponibles, setCajerosDisponibles] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loadingCajeros, setLoadingCajeros] = useState(false);

    // Cargar cajeros disponibles al abrir el modal
    useEffect(() => {
        if (show && !isAuthenticated) {
            cargarCajerosDisponibles();
        }
    }, [show, isAuthenticated]);

    // Limpiar formulario al cerrar
    useEffect(() => {
        if (!show) {
            setCajeroSeleccionado('');
            setPassword('');
            setError('');
            setSuccess('');
        }
    }, [show]);

    // Cargar cajeros disponibles
    const cargarCajerosDisponibles = async () => {
        setLoadingCajeros(true);
        try {
            const cajeros = await getCajerosDisponibles();
            setCajerosDisponibles(cajeros);

            if (cajeros.length === 0) {
                setError('No hay cajeros disponibles para esta sucursal');
            }
        } catch (error) {
            console.error('Error cargando cajeros:', error);
            setError('Error cargando cajeros disponibles');
        } finally {
            setLoadingCajeros(false);
        }
    };

    // Manejar login
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!cajeroSeleccionado) {
            setError('Debe seleccionar un cajero');
            return;
        }

        if (!password) {
            setError('Debe ingresar la contraseña');
            return;
        }

        try {
            const resultado = await login(cajeroSeleccionado, password, 0);

            if (resultado.success) {
                setSuccess('Login exitoso. Iniciando turno...');
                setTimeout(() => {
                    onHide();
                }, 1500);
            } else {
                setError(resultado.message || 'Error en el login');
            }
        } catch (error) {
            console.error('Error en login:', error);
            setError('Error en el sistema de autenticación');
        }
    };

    // Manejar logout
    const handleLogout = async () => {
        try {
            const resultado = await logout();
            if (resultado.success) {
                setSuccess('Sesión cerrada exitosamente');
                setTimeout(() => {
                    onHide();
                }, 1000);
            }
        } catch (error) {
            console.error('Error en logout:', error);
            setError('Error cerrando sesión');
        }
    };

    // Función temporal de debug para PEDIDOS
    const handleDebugPedidos = async () => {
        setError('');
        setSuccess('');

        try {

            const resultado = await cajeroService.debugCajeroPedidos();



            if (resultado.success) {
                setSuccess(resultado.message || '✅ Cajero PEDIDOS corregido. Intenta hacer login ahora.');

                // Recargar cajeros disponibles
                setTimeout(() => {
                    cargarCajerosDisponibles();
                }, 1000);

                // Auto-completar el formulario
                setTimeout(() => {
                    setCajeroSeleccionado('REMISIONES');
                    setPassword('123456');
                }, 1500);
            } else {
                setError(resultado.message || 'Error desconocido en debug');
                console.error('Debug falló:', resultado);
            }
        } catch (error) {
            console.error('Error ejecutando debug:', error);
            setError('Error ejecutando debug: ' + error.message);
        }
    };

    // Si ya está autenticado, mostrar opción de logout
    if (isAuthenticated && cajeroLogueado) {
        return (
            <Modal show={show} onHide={onHide} centered size="md" backdrop="static" className="login-cajero-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Cajero Logueado</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="cajero-logueado-info">
                        <div className="mb-3">
                            <span className="material-icons">
                                account_circle
                            </span>
                        </div>
                        <h5>{cajeroLogueado.nombre}</h5>
                        <p className="text-muted mb-1">{sucursalActiva?.nombre}</p>
                        <small className="text-muted">Turno activo</small>
                    </div>

                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleLogout}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Spinner size="sm" className="me-2" />
                                Cerrando sesión...
                            </>
                        ) : (
                            'Cerrar Sesión'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }

    return (
        <Modal show={show} onHide={onHide} centered size="md" backdrop="static" className="login-cajero-modal">
            <Modal.Header closeButton style={{ padding: '0.75rem 1rem' }}>
                <Modal.Title style={{ fontSize: '1.1rem' }}>
                    <span className="material-icons me-2" style={{ verticalAlign: 'middle', fontSize: '1.2rem' }}>
                        login
                    </span>
                    Login de Cajero - Pedidos
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '140vh', overflowY: 'auto' }}>
                {sucursalActiva && (
                    <div className="sucursal-info">
                        <small className="text-muted">Sucursal:</small>
                        <div className="fw-bold">{sucursalActiva.nombre}</div>
                    </div>
                )}

                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleLogin}>
                    <Form.Group className="mb-3">
                        <Form.Label>Cajero</Form.Label>
                        {loadingCajeros ? (
                            <div className="text-center py-3">
                                <Spinner size="sm" className="me-2" />
                                Cargando cajeros...
                            </div>
                        ) : (
                            <Dropdown>
                                <Dropdown.Toggle
                                    variant="outline-secondary"
                                    className="w-100 text-start"
                                    disabled={cajerosDisponibles.length === 0}
                                >
                                    {cajeroSeleccionado || 'Seleccionar cajero...'}
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="w-100">
                                    {cajerosDisponibles.length > 0 ? (
                                        cajerosDisponibles.map((cajero) => (
                                            <Dropdown.Item
                                                key={cajero.id}
                                                onClick={() => setCajeroSeleccionado(cajero.nombre)}
                                            >
                                                <div className="d-flex align-items-center">
                                                    <span className="material-icons me-2">person</span>
                                                    <div>
                                                        <div>{cajero.nombre}</div>
                                                        <small className="text-muted">{cajero.rol}</small>
                                                    </div>
                                                </div>
                                            </Dropdown.Item>
                                        ))
                                    ) : (
                                        <Dropdown.Item disabled>
                                            No hay cajeros disponibles
                                        </Dropdown.Item>
                                    )}
                                </Dropdown.Menu>
                            </Dropdown>
                        )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Contraseña</Form.Label>
                        <Form.Control
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Ingrese su contraseña"
                            disabled={loading}
                        />
                    </Form.Group>

                    <div className="d-grid gap-2">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading || !cajeroSeleccionado || !password}
                        >
                            {loading ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons me-2" style={{ fontSize: 18 }}>
                                        login
                                    </span>
                                    Iniciar Sesión
                                </>
                            )}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default LoginCajeroModal;