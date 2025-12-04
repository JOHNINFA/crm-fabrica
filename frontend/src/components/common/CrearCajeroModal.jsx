import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { cajeroService } from '../../services/cajeroService';
import { sucursalService } from '../../services/sucursalService';

const CrearCajeroModal = ({ show, onHide, onCajeroCreado }) => {
    // Estados del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        password: '',
        confirmPassword: '',
        sucursal_id: '',
        rol: 'CAJERO',
        puede_hacer_descuentos: false,
        limite_descuento: 0,
        puede_anular_ventas: false,
        activo: true
    });

    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Cargar sucursales al abrir el modal
    useEffect(() => {
        if (show) {
            cargarSucursales();
        }
    }, [show]);

    // Limpiar formulario al cerrar
    useEffect(() => {
        if (!show) {
            setFormData({
                nombre: '',
                email: '',
                telefono: '',
                password: '',
                confirmPassword: '',
                sucursal_id: '',
                rol: 'CAJERO',
                puede_hacer_descuentos: false,
                limite_descuento: 0,
                puede_anular_ventas: false,
                activo: true
            });
            setError('');
            setSuccess('');
        }
    }, [show]);

    const cargarSucursales = async () => {
        try {
            const sucursalesData = await sucursalService.getAll();
            setSucursales(sucursalesData);
        } catch (error) {
            console.error('Error cargando sucursales:', error);
            setError('Error cargando sucursales');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validarFormulario = () => {
        if (!formData.nombre.trim()) {
            setError('El nombre es requerido');
            return false;
        }

        if (!formData.password) {
            setError('La contraseña es requerida');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return false;
        }

        if (!formData.sucursal_id) {
            setError('Debe seleccionar una sucursal');
            return false;
        }

        if (formData.puede_hacer_descuentos && formData.limite_descuento <= 0) {
            setError('Si puede hacer descuentos, debe especificar un límite mayor a 0');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validarFormulario()) {
            return;
        }

        setLoading(true);

        try {
            // Preparar datos para enviar (sin confirmPassword)
            const { confirmPassword, ...cajeroData } = formData;

            // Asegurar que sucursal_id sea un número
            cajeroData.sucursal_id = parseInt(cajeroData.sucursal_id);
            cajeroData.limite_descuento = parseFloat(cajeroData.limite_descuento);



            const resultado = await cajeroService.create(cajeroData);

            if (resultado && !resultado.error) {
                setSuccess('Cajero creado exitosamente');

                // Notificar al componente padre
                if (onCajeroCreado) {
                    onCajeroCreado(resultado);
                }

                // Cerrar modal después de un momento
                setTimeout(() => {
                    onHide();
                }, 1500);
            } else {
                setError(resultado.message || 'Error creando cajero');
            }
        } catch (error) {
            console.error('Error creando cajero:', error);
            setError('Error en el sistema al crear cajero');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>
                    <span className="material-icons me-2" style={{ verticalAlign: 'middle' }}>
                        person_add
                    </span>
                    Crear Nuevo Cajero
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Nombre *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    placeholder="Nombre completo del cajero"
                                    disabled={loading}
                                    required
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="correo@ejemplo.com"
                                    disabled={loading}
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Teléfono</Form.Label>
                                <Form.Control
                                    type="tel"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleInputChange}
                                    placeholder="3001234567"
                                    disabled={loading}
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Sucursal *</Form.Label>
                                <Form.Select
                                    name="sucursal_id"
                                    value={formData.sucursal_id}
                                    onChange={handleInputChange}
                                    disabled={loading}
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
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Contraseña *</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Contraseña segura"
                                    disabled={loading}
                                    required
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Confirmar Contraseña *</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Repetir contraseña"
                                    disabled={loading}
                                    required
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Rol</Form.Label>
                                <Form.Select
                                    name="rol"
                                    value={formData.rol}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                >
                                    <option value="CAJERO">Cajero</option>
                                    <option value="SUPERVISOR">Supervisor</option>
                                    <option value="ADMINISTRADOR">Administrador</option>
                                </Form.Select>
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    name="activo"
                                    label="Cajero activo"
                                    checked={formData.activo}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    name="puede_hacer_descuentos"
                                    label="Puede hacer descuentos"
                                    checked={formData.puede_hacer_descuentos}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Límite de descuento (%)</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="limite_descuento"
                                    value={formData.limite_descuento}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    disabled={loading || !formData.puede_hacer_descuentos}
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Check
                            type="checkbox"
                            name="puede_anular_ventas"
                            label="Puede anular ventas"
                            checked={formData.puede_anular_ventas}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Spinner size="sm" className="me-2" />
                            Creando...
                        </>
                    ) : (
                        <>
                            <span className="material-icons me-2" style={{ fontSize: 18 }}>
                                save
                            </span>
                            Crear Cajero
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CrearCajeroModal;