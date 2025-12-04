import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { sucursalService } from '../../services/sucursalService';

const CrearSucursalModal = ({ show, onHide, onSucursalCreada }) => {
    // Estados del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        telefono: '',
        email: '',
        ciudad: '',
        departamento: '',
        codigo_postal: '',
        es_principal: false,
        activo: true
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Manejar cambios en el formulario
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Limpiar formulario
    const limpiarFormulario = () => {
        setFormData({
            nombre: '',
            direccion: '',
            telefono: '',
            email: '',
            ciudad: '',
            departamento: '',
            codigo_postal: '',
            es_principal: false,
            activo: true
        });
        setError('');
    };

    // Manejar cierre del modal
    const handleClose = () => {
        limpiarFormulario();
        onHide();
    };

    // Validar formulario
    const validarFormulario = () => {
        if (!formData.nombre.trim()) {
            setError('El nombre de la sucursal es requerido');
            return false;
        }

        if (formData.nombre.trim().length < 3) {
            setError('El nombre debe tener al menos 3 caracteres');
            return false;
        }

        if (formData.email && !isValidEmail(formData.email)) {
            setError('El email no tiene un formato válido');
            return false;
        }

        return true;
    };

    // Validar email
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Manejar envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validarFormulario()) {
            return;
        }

        setLoading(true);

        try {

            
            // Preparar datos para envío
            const dataToSend = {
                ...formData,
                nombre: formData.nombre.trim(),
                direccion: formData.direccion.trim() || null,
                telefono: formData.telefono.trim() || null,
                email: formData.email.trim() || null,
                ciudad: formData.ciudad.trim() || null,
                departamento: formData.departamento.trim() || null,
                codigo_postal: formData.codigo_postal.trim() || null
            };

            const resultado = await sucursalService.create(dataToSend);

            if (resultado && !resultado.error) {

                onSucursalCreada(resultado);
                limpiarFormulario();
            } else {
                setError(resultado?.error || 'Error al crear la sucursal');
            }
        } catch (error) {
            console.error('❌ Error al crear sucursal:', error);
            setError(error.message || 'Error al crear la sucursal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-building me-2"></i>
                    Crear Nueva Sucursal
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && (
                        <Alert variant="danger" dismissible onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    <Form.Group className="mb-3">
                        <Form.Label>Nombre de la Sucursal *</Form.Label>
                        <Form.Control
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ej: Sucursal Centro"
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Dirección</Form.Label>
                        <Form.Control
                            type="text"
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                            placeholder="Dirección completa"
                        />
                    </Form.Group>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Teléfono</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    placeholder="Teléfono de contacto"
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
                                    onChange={handleChange}
                                    placeholder="correo@ejemplo.com"
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Ciudad</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="ciudad"
                                    value={formData.ciudad}
                                    onChange={handleChange}
                                    placeholder="Ciudad"
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Departamento</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="departamento"
                                    value={formData.departamento}
                                    onChange={handleChange}
                                    placeholder="Departamento"
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Label>Código Postal</Form.Label>
                        <Form.Control
                            type="text"
                            name="codigo_postal"
                            value={formData.codigo_postal}
                            onChange={handleChange}
                            placeholder="Código postal"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Check
                            type="checkbox"
                            name="es_principal"
                            label="Marcar como sucursal principal"
                            checked={formData.es_principal}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Check
                            type="checkbox"
                            name="activo"
                            label="Sucursal activa"
                            checked={formData.activo}
                            onChange={handleChange}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Creando...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-lg me-2"></i>
                                Crear Sucursal
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default CrearSucursalModal;