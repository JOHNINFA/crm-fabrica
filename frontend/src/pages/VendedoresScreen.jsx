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
    cargarVendedores();

    // Escuchar cambios de responsables desde Cargue
    const handleResponsableUpdate = () => {
      console.log('🔄 Responsable actualizado, recargando vendedores...');
      cargarVendedores();
    };

    window.addEventListener('responsableActualizado', handleResponsableUpdate);

    return () => {
      window.removeEventListener('responsableActualizado', handleResponsableUpdate);
    };
  }, []);

  const cargarVendedores = async () => {
    try {
      // 🚀 CORREGIDO: Cargar vendedores desde la API correcta
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/vendedores/`);

      if (response.ok) {
        const vendedoresDB = await response.json();
        console.log('✅ Vendedores desde BD:', vendedoresDB);

        // Mapear los vendedores de la BD al formato esperado
        const vendedoresFormateados = vendedoresDB.map(v => ({
          id: v.id_vendedor,
          nombre: v.nombre,
          idVendedor: v.id_vendedor,
          ruta: v.ruta || 'Sin ruta',
          fechaCreacion: v.fecha_creacion
        }));

        setVendedores(vendedoresFormateados);
        console.log('✅ Vendedores formateados:', vendedoresFormateados);
      } else {
        console.error('❌ Error cargando vendedores desde BD');
        // Fallback: crear vendedores por defecto
        const vendedoresPorDefecto = idsDisponibles.map(id => ({
          id: id,
          nombre: 'RESPONSABLE',
          idVendedor: id,
          ruta: 'Sin ruta',
          fechaCreacion: new Date().toISOString()
        }));
        setVendedores(vendedoresPorDefecto);
      }
    } catch (error) {
      console.error('Error cargando vendedores:', error);
      // Fallback: crear vendedores por defecto
      const vendedoresPorDefecto = idsDisponibles.map(id => ({
        id: id,
        nombre: 'RESPONSABLE',
        idVendedor: id,
        ruta: 'Sin ruta',
        fechaCreacion: new Date().toISOString()
      }));
      setVendedores(vendedoresPorDefecto);
    }
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

  const guardarVendedor = async () => {
    if (!validarFormulario()) return;

    try {
      console.log('📤 Enviando datos:', {
        id_vendedor: formData.idVendedor,
        responsable: formData.nombre.trim(),
        ruta: formData.ruta.trim()
      });

      // Guardar en la API de Cargue
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/vendedores/actualizar_responsable/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_vendedor: formData.idVendedor,
          responsable: formData.nombre.trim(),
          ruta: formData.ruta.trim()
        })
      });

      const data = await response.json();
      console.log('📥 Respuesta del servidor:', data);

      if (response.ok) {
        console.log('✅ Vendedor guardado exitosamente');
        await cargarVendedores(); // Recargar lista
        cerrarModal();
      } else {
        console.error('❌ Error del servidor:', data);
        setError(data.error || 'Error guardando el vendedor');
      }
    } catch (error) {
      console.error('❌ Error guardando vendedor:', error);
      setError('Error de conexión: ' + error.message);
    }
  };

  const eliminarVendedor = async (idVendedor) => {
    if (window.confirm('¿Está seguro de eliminar este vendedor? Esto lo restablecerá a "RESPONSABLE"')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/vendedores/actualizar_responsable/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id_vendedor: idVendedor,
            responsable: 'RESPONSABLE',
            ruta: ''
          })
        });

        if (response.ok) {
          console.log('✅ Vendedor eliminado');
          await cargarVendedores();
        } else {
          alert('Error eliminando el vendedor');
        }
      } catch (error) {
        console.error('Error eliminando vendedor:', error);
        alert('Error de conexión');
      }
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
                        onClick={() => eliminarVendedor(vendedor.idVendedor)}
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