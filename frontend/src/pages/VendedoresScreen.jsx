import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert } from 'react-bootstrap';

const VendedoresScreen = () => {
  const [vendedores, setVendedores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    idVendedor: '',
    ruta: ''
  });
  const [error, setError] = useState('');

  const idsDisponibles = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];

  useEffect(() => {
    // Cargar vendedores del localStorage
    const vendedoresGuardados = localStorage.getItem('vendedores');
    if (vendedoresGuardados) {
      setVendedores(JSON.parse(vendedoresGuardados));
    }
  }, []);

  const guardarVendedores = (nuevosVendedores) => {
    localStorage.setItem('vendedores', JSON.stringify(nuevosVendedores));
    setVendedores(nuevosVendedores);
  };

  const abrirModal = (vendedor = null) => {
    if (vendedor) {
      setEditingVendedor(vendedor);
      setFormData({
        nombre: vendedor.nombre,
        idVendedor: vendedor.idVendedor,
        ruta: vendedor.ruta
      });
    } else {
      setEditingVendedor(null);
      setFormData({
        nombre: '',
        idVendedor: '',
        ruta: ''
      });
    }
    setError('');
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingVendedor(null);
    setFormData({ nombre: '', idVendedor: '', ruta: '' });
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validarFormulario = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return false;
    }
    if (!formData.idVendedor) {
      setError('Debe seleccionar un ID');
      return false;
    }
    if (!formData.ruta.trim()) {
      setError('La ruta es obligatoria');
      return false;
    }

    // Verificar si el ID ya está en uso (solo al crear o cambiar ID)
    const idEnUso = vendedores.some(v => 
      v.idVendedor === formData.idVendedor && 
      (!editingVendedor || editingVendedor.id !== v.id)
    );
    
    if (idEnUso) {
      setError(`El ${formData.idVendedor} ya está asignado a otro vendedor`);
      return false;
    }

    return true;
  };

  const guardarVendedor = () => {
    if (!validarFormulario()) return;

    const nuevoVendedor = {
      id: editingVendedor ? editingVendedor.id : Date.now(),
      nombre: formData.nombre.trim(),
      idVendedor: formData.idVendedor,
      ruta: formData.ruta.trim(),
      fechaCreacion: editingVendedor ? editingVendedor.fechaCreacion : new Date().toISOString()
    };

    let nuevosVendedores;
    if (editingVendedor) {
      nuevosVendedores = vendedores.map(v => 
        v.id === editingVendedor.id ? nuevoVendedor : v
      );
    } else {
      nuevosVendedores = [...vendedores, nuevoVendedor];
    }

    guardarVendedores(nuevosVendedores);
    cerrarModal();
  };

  const eliminarVendedor = (id) => {
    if (window.confirm('¿Está seguro de eliminar este vendedor?')) {
      const nuevosVendedores = vendedores.filter(v => v.id !== id);
      guardarVendedores(nuevosVendedores);
    }
  };

  const getIdsDisponibles = () => {
    const idsUsados = vendedores
      .filter(v => !editingVendedor || v.id !== editingVendedor.id)
      .map(v => v.idVendedor);
    return idsDisponibles.filter(id => !idsUsados.includes(id));
  };

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Vendedores</h2>
        <Button 
          variant="primary" 
          onClick={() => abrirModal()}
          style={{ backgroundColor: '#06386d', borderColor: '#06386d' }}
        >
          + Nuevo Vendedor
        </Button>
      </div>

      <div className="card">
        <div className="card-body">
          <Table striped bordered hover responsive>
            <thead style={{ backgroundColor: '#06386d', color: 'white' }}>
              <tr>
                <th>Nombre</th>
                <th>ID</th>
                <th>Ruta</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vendedores.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No hay vendedores registrados
                  </td>
                </tr>
              ) : (
                vendedores.map(vendedor => (
                  <tr key={vendedor.id}>
                    <td className="fw-bold">{vendedor.nombre}</td>
                    <td>
                      <span className="badge bg-primary">{vendedor.idVendedor}</span>
                    </td>
                    <td>{vendedor.ruta}</td>
                    <td>{new Date(vendedor.fechaCreacion).toLocaleDateString()}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => abrirModal(vendedor)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => eliminarVendedor(vendedor.id)}
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

      {/* Modal para crear/editar vendedor */}
      <Modal show={showModal} onHide={cerrarModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingVendedor ? 'Editar Vendedor' : 'Nuevo Vendedor'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre *</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ej: Wilson"
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>ID Vendedor *</Form.Label>
              <Form.Select
                name="idVendedor"
                value={formData.idVendedor}
                onChange={handleInputChange}
              >
                <option value="">Seleccionar ID...</option>
                {editingVendedor && (
                  <option value={editingVendedor.idVendedor}>
                    {editingVendedor.idVendedor} (Actual)
                  </option>
                )}
                {getIdsDisponibles().map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Ruta *</Form.Label>
              <Form.Control
                type="text"
                name="ruta"
                value={formData.ruta}
                onChange={handleInputChange}
                placeholder="Ej: RUTA NORTE, RUTA 485, CENTRO, etc."
              />
              <Form.Text className="text-muted">
                Puedes escribir cualquier nombre de ruta (RUTA 485, RUTA NORTE, etc.)
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cerrarModal}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={guardarVendedor}
            style={{ backgroundColor: '#06386d', borderColor: '#06386d' }}
          >
            {editingVendedor ? 'Actualizar' : 'Crear'} Vendedor
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default VendedoresScreen;