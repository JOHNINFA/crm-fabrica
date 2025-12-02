import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Alert } from 'react-bootstrap';

const GestionBancos = () => {
    const [bancos, setBancos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingBanco, setEditingBanco] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        activo: true
    });
    const [error, setError] = useState('');

    // Cargar bancos desde localStorage
    useEffect(() => {
        const bancosGuardados = localStorage.getItem('bancos');
        if (bancosGuardados) {
            setBancos(JSON.parse(bancosGuardados));
        } else {
            // Bancos por defecto
            const bancosDefault = [
                { id: 1, nombre: 'Caja General', activo: true },
                { id: 2, nombre: 'Banco Davivienda', activo: true },
                { id: 3, nombre: 'Banco Bancolombia', activo: true }
            ];
            setBancos(bancosDefault);
            localStorage.setItem('bancos', JSON.stringify(bancosDefault));
        }
    }, []);

    // Guardar bancos en localStorage
    const guardarBancos = (nuevosBancos) => {
        setBancos(nuevosBancos);
        localStorage.setItem('bancos', JSON.stringify(nuevosBancos));
    };

    // Abrir modal para crear/editar
    const handleOpenModal = (banco = null) => {
        if (banco) {
            setEditingBanco(banco);
            setFormData({
                nombre: banco.nombre,
                activo: banco.activo
            });
        } else {
            setEditingBanco(null);
            setFormData({
                nombre: '',
                activo: true
            });
        }
        setError('');
        setShowModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setShowModal(false);
        setEditingBanco(null);
        setFormData({ nombre: '', activo: true });
        setError('');
    };

    // Guardar banco
    const handleSave = () => {
        if (!formData.nombre.trim()) {
            setError('El nombre del banco es requerido');
            return;
        }

        if (editingBanco) {
            // Editar banco existente
            const bancosActualizados = bancos.map(b =>
                b.id === editingBanco.id
                    ? { ...b, nombre: formData.nombre, activo: formData.activo }
                    : b
            );
            guardarBancos(bancosActualizados);
        } else {
            // Crear nuevo banco
            const nuevoBanco = {
                id: Date.now(),
                nombre: formData.nombre,
                activo: formData.activo
            };
            guardarBancos([...bancos, nuevoBanco]);
        }

        handleCloseModal();
    };

    // Eliminar banco
    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este banco?')) {
            const bancosActualizados = bancos.filter(b => b.id !== id);
            guardarBancos(bancosActualizados);
        }
    };

    // Cambiar estado activo/inactivo
    const toggleActivo = (id) => {
        const bancosActualizados = bancos.map(b =>
            b.id === id ? { ...b, activo: !b.activo } : b
        );
        guardarBancos(bancosActualizados);
    };

    return (
        <>
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <i className="bi bi-bank me-2"></i>
                        Gestión de Bancos
                    </h5>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenModal()}
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        Nuevo Banco
                    </Button>
                </Card.Header>
                <Card.Body>
                    <p className="text-muted">
                        Administra los bancos disponibles para registrar pagos en el sistema.
                    </p>

                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Estado</th>
                                <th style={{ width: '150px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bancos.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center text-muted">
                                        No hay bancos registrados
                                    </td>
                                </tr>
                            ) : (
                                bancos.map(banco => (
                                    <tr key={banco.id}>
                                        <td>{banco.nombre}</td>
                                        <td>
                                            <span
                                                className={`badge ${banco.activo ? 'bg-success' : 'bg-secondary'}`}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => toggleActivo(banco.id)}
                                            >
                                                {banco.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="me-2"
                                                onClick={() => handleOpenModal(banco)}
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(banco.id)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Modal para crear/editar banco */}
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingBanco ? 'Editar Banco' : 'Nuevo Banco'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre del Banco</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ej: Banco Davivienda"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Activo"
                                checked={formData.activo}
                                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        Guardar
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default GestionBancos;
