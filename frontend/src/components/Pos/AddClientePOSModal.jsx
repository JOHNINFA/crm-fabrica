import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { clienteService } from '../../services/clienteService';

const AddClientePOSModal = ({ show, onHide, onClienteCreado }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        identificacion: '',
        nombre_completo: '',
        alias: '',
        telefono_1: '',
        movil: '',
        direccion: '',
        ciudad: 'BOGOTA',
        tipo_contacto: 'CLIENTE_POS', // Marcar como cliente POS
        activo: true
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validaciones básicas
        if (!formData.identificacion || !formData.nombre_completo) {
            setError('La identificación y el nombre son obligatorios');
            return;
        }

        try {
            setLoading(true);

            // Crear cliente con tipo_contacto = CLIENTE_POS
            const clienteData = {
                ...formData,
                tipo_contacto: 'CLIENTE_POS', // Forzar tipo POS
                tipo_persona: 'NATURAL',
                tipo_identificacion: 'CC',
                regimen: 'SIMPLIFICADO'
            };

            const resultado = await clienteService.create(clienteData);

            if (resultado && !resultado.error) {
                // Notificar al componente padre
                if (onClienteCreado) {
                    onClienteCreado(resultado);
                }

                // Limpiar y cerrar
                setFormData({
                    identificacion: '',
                    nombre_completo: '',
                    alias: '',
                    telefono_1: '',
                    movil: '',
                    direccion: '',
                    ciudad: 'BOGOTA',
                    tipo_contacto: 'CLIENTE_POS',
                    activo: true
                });
                onHide();
            } else {
                setError(resultado.message || 'Error al crear el cliente');
            }
        } catch (err) {
            console.error('Error creando cliente:', err);
            setError('Error de conexión. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-person-plus me-2"></i>
                    Nuevo Cliente POS
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Identificación <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.identificacion}
                                    onChange={(e) => handleChange('identificacion', e.target.value)}
                                    placeholder="Ej: 1234567890"
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nombre Completo <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.nombre_completo}
                                    onChange={(e) => handleChange('nombre_completo', e.target.value)}
                                    placeholder="Ej: Juan Pérez"
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nombre del Negocio (Opcional)</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.alias}
                                    onChange={(e) => handleChange('alias', e.target.value)}
                                    placeholder="Ej: Tienda La Esperanza"
                                />
                                <Form.Text className="text-muted">
                                    Si no se especifica, se usará el nombre completo
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Teléfono</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.telefono_1}
                                    onChange={(e) => handleChange('telefono_1', e.target.value)}
                                    placeholder="Ej: 3001234567"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Móvil</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.movil}
                                    onChange={(e) => handleChange('movil', e.target.value)}
                                    placeholder="Ej: 3109876543"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>Dirección</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.direccion}
                                    onChange={(e) => handleChange('direccion', e.target.value)}
                                    placeholder="Ej: Calle 123 # 45-67"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>Ciudad</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.ciudad}
                                    onChange={(e) => handleChange('ciudad', e.target.value)}
                                    placeholder="Ej: Bogotá"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Alert variant="info" className="mb-0">
                        <i className="bi bi-info-circle me-2"></i>
                        Este cliente se guardará como <strong>Cliente POS</strong> (sin días de visita).
                        <br />
                        <small className="text-muted">
                            Puedes convertirlo a Cliente de Pedidos más adelante desde la Gestión de Clientes.
                        </small>
                    </Alert>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    Cancelar
                </Button>
                <Button variant="success" onClick={handleSubmit} disabled={loading}>
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Guardando...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-check-circle me-2"></i>
                            Guardar Cliente
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddClientePOSModal;
