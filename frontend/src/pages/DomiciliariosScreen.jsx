import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import usePageTitle from '../hooks/usePageTitle';
import { API_URL } from '../services/api';

const DomiciliariosScreen = () => {
    usePageTitle('Domiciliarios');
    const navigate = useNavigate();
    const [domiciliarios, setDomiciliarios] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingDomiciliario, setEditingDomiciliario] = useState(null);
    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        identificacion: '',
        telefono: '',
        email: '',
        direccion: '',
        vehiculo: '',
        placa: '',
        activo: true
    });
    const [error, setError] = useState('');

    useEffect(() => {
        cargarDomiciliarios();
    }, []);

    const cargarDomiciliarios = async () => {
        try {
            const response = await fetch(`${API_URL}/domiciliarios/`);

            if (response.ok) {
                const domiciliariosDB = await response.json();

                setDomiciliarios(domiciliariosDB);
            } else {
                console.error('❌ Error cargando domiciliarios desde BD');
                setDomiciliarios([]);
            }
        } catch (error) {
            console.error('Error cargando domiciliarios:', error);
            setDomiciliarios([]);
        }
    };

    const abrirModal = (domiciliario = null) => {
        if (domiciliario) {
            setEditingDomiciliario(domiciliario);
            setFormData({
                codigo: domiciliario.codigo,
                nombre: domiciliario.nombre,
                identificacion: domiciliario.identificacion || '',
                telefono: domiciliario.telefono || '',
                email: domiciliario.email || '',
                direccion: domiciliario.direccion || '',
                vehiculo: domiciliario.vehiculo || '',
                placa: domiciliario.placa || '',
                activo: domiciliario.activo
            });
        } else {
            setEditingDomiciliario(null);
            setFormData({
                codigo: '',
                nombre: '',
                identificacion: '',
                telefono: '',
                email: '',
                direccion: '',
                vehiculo: 'Moto',
                placa: '',
                activo: true
            });
        }
        setError('');
        setShowModal(true);
    };

    const cerrarModal = () => {
        setShowModal(false);
        setEditingDomiciliario(null);
        setFormData({
            codigo: '',
            nombre: '',
            identificacion: '',
            telefono: '',
            email: '',
            direccion: '',
            vehiculo: '',
            placa: '',
            activo: true
        });
        setError('');
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validarFormulario = () => {
        if (!formData.codigo.trim()) {
            setError('El código es obligatorio (Ej: DOM1, DOM2)');
            return false;
        }
        if (!formData.nombre.trim()) {
            setError('El nombre es obligatorio');
            return false;
        }

        // Verificar si el código ya está en uso (solo al crear o cambiar código)
        const codigoEnUso = domiciliarios.some(d =>
            d.codigo === formData.codigo &&
            (!editingDomiciliario || editingDomiciliario.codigo !== d.codigo)
        );

        if (codigoEnUso) {
            setError(`El código ${formData.codigo} ya está asignado a otro domiciliario`);
            return false;
        }

        return true;
    };

    const guardarDomiciliario = async () => {
        if (!validarFormulario()) return;

        try {
            const url = editingDomiciliario
                ? `${API_URL}/domiciliarios/${editingDomiciliario.codigo}/`
                : `${API_URL}/domiciliarios/`;

            const method = editingDomiciliario ? 'PUT' : 'POST';



            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();


            if (response.ok) {

                await cargarDomiciliarios();
                cerrarModal();
            } else {
                console.error('❌ Error del servidor:', data);
                setError(data.error || 'Error guardando el domiciliario');
            }
        } catch (error) {
            console.error('❌ Error guardando domiciliario:', error);
            setError('Error de conexión: ' + error.message);
        }
    };

    const eliminarDomiciliario = async (codigo) => {
        if (window.confirm('¿Está seguro de eliminar este domiciliario?')) {
            try {
                const response = await fetch(
                    `${API_URL}/domiciliarios/${codigo}/`,
                    { method: 'DELETE' }
                );

                if (response.ok || response.status === 204) {

                    await cargarDomiciliarios();
                } else {
                    alert('Error eliminando el domiciliario');
                }
            } catch (error) {
                console.error('Error eliminando domiciliario:', error);
                alert('Error de conexión');
            }
        }
    };

    return (
        <div className="container-fluid mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                    <Button
                        variant="outline-secondary"
                        className="me-3 d-flex align-items-center"
                        onClick={() => navigate('/remisiones')}
                        style={{ border: 'none', background: 'transparent', color: '#6c757d', padding: 0, marginRight: '15px' }}
                    >
                        <span className="material-icons" style={{ fontSize: '24px' }}>arrow_back</span>
                    </Button>
                    <h2 className="m-0">🛵 Gestión de Domiciliarios</h2>
                </div>
                <button
                    className="btn"
                    onClick={() => abrirModal()}
                    style={{ backgroundColor: '#002149', borderColor: '#002149', color: 'white' }}
                >
                    + Nuevo Domiciliario
                </button>
            </div>

            <div className="card">
                <div className="card-body">
                    <Table striped bordered hover responsive>
                        <thead style={{ backgroundColor: '#002149', color: 'white' }}>
                            <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Teléfono</th>
                                <th>Vehículo</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {domiciliarios.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted">
                                        No hay domiciliarios registrados
                                    </td>
                                </tr>
                            ) : (
                                domiciliarios.map(domiciliario => (
                                    <tr key={domiciliario.codigo}>
                                        <td>
                                            <span className="badge bg-success">{domiciliario.codigo}</span>
                                        </td>
                                        <td className="fw-bold">{domiciliario.nombre}</td>
                                        <td>{domiciliario.telefono || '-'}</td>
                                        <td>{domiciliario.vehiculo || '-'} {domiciliario.placa && `(${domiciliario.placa})`}</td>
                                        <td>
                                            <span className={`badge ${domiciliario.activo ? 'bg-success' : 'bg-secondary'}`}>
                                                {domiciliario.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="me-2"
                                                onClick={() => abrirModal(domiciliario)}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => eliminarDomiciliario(domiciliario.codigo)}
                                            >
                                                Eliminar
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>
            </div>

            {/* Modal para crear/editar domiciliario */}
            <Modal show={showModal} onHide={cerrarModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingDomiciliario ? 'Editar Domiciliario' : 'Nuevo Domiciliario'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form>
                        <div className="row">
                            {/* Código */}
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Código *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="codigo"
                                        value={formData.codigo}
                                        onChange={handleInputChange}
                                        placeholder="Ej: DOM1"
                                        disabled={!!editingDomiciliario}
                                        autoFocus
                                    />
                                </Form.Group>
                            </div>

                            {/* Nombre */}
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Nombre Completo *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                        placeholder="Ej: Carlos Rodríguez"
                                    />
                                </Form.Group>
                            </div>

                            {/* Teléfono */}
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Teléfono</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleInputChange}
                                        placeholder="Ej: 3001234567"
                                    />
                                </Form.Group>
                            </div>

                            {/* Vehículo */}
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Tipo de Vehículo</Form.Label>
                                    <Form.Select
                                        name="vehiculo"
                                        value={formData.vehiculo}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Moto">Moto</option>
                                        <option value="Carro">Carro</option>
                                    </Form.Select>
                                </Form.Group>
                            </div>

                            {/* Placa */}
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Placa</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="placa"
                                        value={formData.placa}
                                        onChange={handleInputChange}
                                        placeholder="ABC123"
                                    />
                                </Form.Group>
                            </div>

                            {/* Estado Activo */}
                            <div className="col-md-6 d-flex align-items-center">
                                <Form.Group className="mb-3 mt-4">
                                    <Form.Check
                                        type="checkbox"
                                        name="activo"
                                        label="Domiciliario activo"
                                        checked={formData.activo}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </div>
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={cerrarModal}>
                        Cancelar
                    </Button>
                    <button
                        className="btn"
                        onClick={guardarDomiciliario}
                        style={{ backgroundColor: '#002149', borderColor: '#002149', color: 'white' }}
                    >
                        {editingDomiciliario ? 'Actualizar' : 'Crear'} Domiciliario
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default DomiciliariosScreen;
