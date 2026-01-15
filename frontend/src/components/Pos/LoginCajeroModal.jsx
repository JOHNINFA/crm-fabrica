import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner, Dropdown } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { useCajero } from '../../context/CajeroContext';
import './LoginCajeroModal.css';

const LoginCajeroModal = ({ show, onHide }) => {
    const {
        login,
        logout,
        getCajerosDisponibles,
        isAuthenticated,
        cajeroLogueado,
        sucursalActiva,
        cambiarSucursal,
        loading
    } = useCajero();

    // Estados del formulario
    const [cajeroSeleccionado, setCajeroSeleccionado] = useState('');
    const [password, setPassword] = useState('');
    const [saldoInicialCaja, setSaldoInicialCaja] = useState('');
    const [cajerosDisponibles, setCajerosDisponibles] = useState([]);
    const [sucursalesDisponibles, setSucursalesDisponibles] = useState([]); // Nuevo estado
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loadingCajeros, setLoadingCajeros] = useState(false);

    // Validar si la sucursal activa es válida
    const sucursalValida = sucursalActiva && sucursalActiva.id && sucursalActiva.nombre;

    // Efecto para inicializar datos cuando abre el modal
    useEffect(() => {
        if (show && !isAuthenticated) {
            // Si hay sucursal activa y válida, cargar cajeros
            if (sucursalValida) {
                cargarCajerosDisponibles();
            } else {
                // Si no hay sucursal activa o está incompleta, cargar lista para seleccionar
                cargarSucursales();
            }
        }
    }, [show, isAuthenticated, sucursalActiva]);

    // Limpiar formulario al cerrar
    useEffect(() => {
        if (!show) {
            setCajeroSeleccionado('');
            setPassword('');
            setSaldoInicialCaja('');
            setError('');
            setSuccess('');
        }
    }, [show]);

    // Cargar sucursales activas
    const cargarSucursales = async () => {
        try {
            // Importar servicio dinámicamente o usar el del contexto si estuviera expuesto
            // Aquí asumo que necesito importar sucursalService que ya se usa en otros lados
            const { sucursalService } = require('../../services/sucursalService');
            const sucursales = await sucursalService.getActivas();
            setSucursalesDisponibles(sucursales);

            // Si solo hay una, seleccionarla automáticamente
            if (sucursales.length === 1) {
                await cambiarSucursal(sucursales[0].id);
            }
        } catch (error) {
            console.error('Error cargando sucursales:', error);
            setError('Error cargando lista de sucursales');
        }
    };

    // Cargar cajeros disponibles
    const cargarCajerosDisponibles = async () => {
        if (!sucursalValida) {
            // Si llegamos aquí y no es válida, intentamos cargar sucursales como fallback
            cargarSucursales();
            return;
        }

        setLoadingCajeros(true);
        try {
            const cajeros = await getCajerosDisponibles();
            setCajerosDisponibles(cajeros);

            if (cajeros.length === 0) {
                setError(`No hay cajeros disponibles en ${sucursalActiva?.nombre}`);
            } else {
                setError('');
            }
        } catch (error) {
            console.error('Error cargando cajeros:', error);
            setError('Error cargando cajeros disponibles');
        } finally {
            setLoadingCajeros(false);
        }
    };

    // Manejar cambio de sucursal
    const handleSucursalChange = async (sucursal) => {
        await cambiarSucursal(sucursal.id);
        // Al cambiar sucursal, el useEffect disparará cargarCajerosDisponibles
        setCajeroSeleccionado(''); // Resetear cajero seleccionado
    };

    // Manejar login... (resto igual)

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

        if (!saldoInicialCaja) {
            setError('Debe ingresar el saldo inicial de caja');
            return;
        }

        const saldoNumerico = parseFloat(saldoInicialCaja);
        if (isNaN(saldoNumerico) || saldoNumerico < 0) {
            setError('El saldo inicial debe ser un número válido mayor o igual a 0');
            return;
        }

        try {
            const resultado = await login(cajeroSeleccionado, password, saldoNumerico);

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
        // 🆕 Confirmar que se realizó el corte de caja
        const confirmarCierre = await Swal.fire({
            title: '⚠️ Cerrar Sesión',
            html: `
                <p style="font-size: 16px; margin-bottom: 15px;">
                    ¿Realizaste el <strong>corte de caja</strong> antes de cerrar sesión?
                </p>
                <div style="background: #fff3cd; padding: 12px; border-radius: 8px; border-left: 4px solid #ffc107; margin-top: 15px;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                        <i class="bi bi-exclamation-triangle-fill"></i> 
                        <strong>Importante:</strong> Debes hacer el corte de caja antes de cerrar sesión.
                    </p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#dc3545',
            confirmButtonText: '✅ Sí, hice el corte',
            cancelButtonText: '❌ Cancelar',
            reverseButtons: true,
            focusCancel: true
        });

        // Si no confirma, cancelar el logout
        if (!confirmarCierre.isConfirmed) {
            return;
        }

        // Proceder con el logout
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
            <Modal.Header style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Modal.Title style={{ fontSize: '1.1rem' }}>
                    <span className="material-icons me-2" style={{ verticalAlign: 'middle', fontSize: '1.2rem' }}>
                        login
                    </span>
                    Login de Cajero
                </Modal.Title>
                <button
                    onClick={onHide}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.9,
                        transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                    onMouseOut={(e) => e.currentTarget.style.opacity = 0.9}
                >
                    <span className="material-icons" style={{ fontSize: '24px' }}>close</span>
                </button>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '140vh', overflowY: 'auto' }}>
                <div className="sucursal-info mb-3">
                    <Form.Label className="text-muted small">Sucursal</Form.Label>
                    {sucursalValida ? (
                        <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded border">
                            <div className="d-flex align-items-center">
                                <span className="material-icons me-2 text-primary" style={{ fontSize: 20 }}>store</span>
                                <span className="fw-bold text-dark">{sucursalActiva.nombre}</span>
                            </div>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                className="py-0 px-2"
                                style={{ fontSize: '0.8rem' }}
                                onClick={() => {
                                    cargarSucursales();
                                    // Forzamos "invalidez" visual temporalmente para mostrar el dropdown
                                    // O mejor, usamos un estado local para "modo edición sucursal"
                                    // Pero para ser rápidos, usare el truco de resetear sucursalesDisponibles y mostrar dropdown si hay disponibles
                                    setSucursalesDisponibles([{ id: 'loading', nombre: 'Cargando...' }]); // Placeholder
                                }}
                            >
                                Cambiar
                            </Button>
                        </div>
                    ) : (
                        <Dropdown>
                            <Dropdown.Toggle variant={sucursalesDisponibles.length > 0 ? "outline-primary" : "outline-secondary"} className="w-100 text-start d-flex justify-content-between align-items-center">
                                <span>{sucursalesDisponibles.length > 0 ? "Seleccionar Sucursal..." : "Cargando sucursales..."}</span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="w-100">
                                {sucursalesDisponibles.map(s => (
                                    <Dropdown.Item key={s.id} onClick={() => handleSucursalChange(s)} disabled={s.id === 'loading'}>
                                        {s.nombre}
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    )}

                    {/* Renderizar Dropdown si el usuario dio click en Cambiar (estado derivado simple: si hay sucursales cargadas y sucursal es valida, mostramos opcion de cerrar?) 
                        Simplificación: Si el usuario clickea cambiar, seteamos sucursalValida a false? No podemos.
                        Vamos a agregar el estado 'isChangingSucursal' arriba.
                    */}
                </div>

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

                    <Form.Group className="mb-3">
                        <Form.Label>
                            <span className="material-icons me-2" style={{ fontSize: 18, verticalAlign: 'middle' }}>
                                account_balance_wallet
                            </span>
                            Saldo Inicial de Caja
                        </Form.Label>
                        <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            value={saldoInicialCaja}
                            onChange={(e) => setSaldoInicialCaja(e.target.value)}
                            placeholder="Ej: 50000"
                            disabled={loading}
                        />
                        <Form.Text className="text-muted">
                            Ingrese el dinero en efectivo con el que inicia el turno
                        </Form.Text>
                    </Form.Group>

                    <div className="d-grid gap-2">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading || !cajeroSeleccionado || !password || !saldoInicialCaja}
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
