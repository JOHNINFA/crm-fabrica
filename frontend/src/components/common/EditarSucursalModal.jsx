import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { sucursalService } from '../../services/sucursalService';

const EditarSucursalModal = ({ show, onHide, sucursal, onSucursalEditada }) => {
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

    // Cargar datos de la sucursal cuando cambie
    useEffect(() => {
        if (sucursal) {
            setFormData({
                nombre: sucursal.nombre || '',
                direccion: sucursal.direccion || '',
                telefono: sucursal.telefono || '',
                email: sucursal.email || '',
                ciudad: sucursal.ciudad || '',
                departamento: sucursal.departamento || '',
                codigo_postal: sucursal.codigo_postal || '',
                es_principal: sucursal.es_principal || false,
                activo: sucursal.activo !== false
            });
        }
    }, [sucursal]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleClose = () => {
        setError('');
        onHide();
    };

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

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validarFormulario()) {
            return;
        }

        setLoading(true);

        try {
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

            const resultado = await sucursalService.update(sucursal.id, dataToSend);

            if (resultado && !resultado.error) {
                onSucursalEditada(resultado);
                handleClose();
            } else {
                setError(resultado?.message || 'Error al actualizar la sucursal');
            }
        } catch (error) {
            console.error('Error actualizando sucursal:', error);
            setError('Error al actualizar la sucursal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    <span className="material-icons me-2" style={{ verticalAlign: 'middle' }}>
                        edit
                    </span>
                    Editar Sucursal
                </Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && (
                        <Alert variant="danger" dismissible onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    <div className="row">
                        <div className="col-md-8">
                            <Form.Group className="mb-3">
                                <Form.Label>Nombre de la Sucursal *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    placeholder="Ej: Sucursal Centro"
                                    required
                                    disabled={loading}
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-4">
                            <Form.Group className="mb-3">
                                <Form.Label>Ciudad</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="ciudad"
                                    value={formData.ciudad}
                                    onChange={handleChange}
                                    placeholder="Ej: Bogotá"
                                    disabled={loading}
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Label>Dirección</Form.Label>
                        <Form.Control
                            type="text"
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                            placeholder="Ej: Calle 123 #45-67"
                            disabled={loading}
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
                                    placeholder="Ej: (601) 123-4567"
                                    disabled={loading}
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
                                    placeholder="Ej: sucursal@empresa.com"
                                    disabled={loading}
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Departamento</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="departamento"
                                    value={formData.departamento}
                                    onChange={handleChange}
                                    placeholder="Ej: Cundinamarca"
                                    disabled={loading}
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Código Postal</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="codigo_postal"
                                    value={formData.codigo_postal}
                                    onChange={handleChange}
                                    placeholder="Ej: 110111"
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
                                    name="es_principal"
                                    checked={formData.es_principal}
                                    onChange={handleChange}
                                    label="Sucursal Principal"
                                    disabled={loading}
                                />
                                <Form.Text className="text-muted">
                                    Solo puede haber una sucursal principal
                                </Form.Text>
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    name="activo"
                                    checked={formData.activo}
                                    onChange={handleChange}
                                    label="Sucursal Activa"
                                    disabled={loading}
                                />
                            </Form.Group>
                        </div>
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    className="me-2"
                                />
                                Actualizando...
                            </>
                        ) : (
                            <>
                                <span className="material-icons me-2" style={{ fontSize: 16 }}>
                                    save
                                </span>
                                Actualizar Sucursal
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default EditarSucursalModal;