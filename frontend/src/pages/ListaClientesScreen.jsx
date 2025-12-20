import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { clienteService } from '../services/clienteService';
import usePageTitle from '../hooks/usePageTitle';

const ListaClientesScreen = () => {
  usePageTitle('Clientes');
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const clientesData = await clienteService.getAll();
      if (clientesData && !clientesData.error) {
        setClientes(clientesData);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (cliente) => {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar el cliente "${cliente.alias || cliente.nombre_completo}"?\n\nEsta acción no se puede deshacer.`
    );

    if (confirmar) {
      try {
        const resultado = await clienteService.delete(cliente.id);
        if (resultado && !resultado.error) {
          alert('✅ Cliente eliminado exitosamente');
          cargarClientes(); // Recargar lista
        } else {
          alert('❌ Error al eliminar el cliente');
        }
      } catch (error) {
        console.error('Error eliminando cliente:', error);
        alert('❌ Error de conexión');
      }
    }
  };

  const clientesFiltrados = clientes.filter(cliente =>
    (cliente.nombre_completo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (cliente.alias || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (cliente.identificacion || '').includes(busqueda)
  );

  return (
    <div style={{ backgroundColor: '#f4f6f9', minHeight: '100vh', padding: '2rem' }}>
      <Container fluid>
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="mb-0">Gestión de Clientes</h2>
              <div>
                <Button
                  variant="outline-primary"
                  className="me-2"
                  onClick={() => navigate('/clientes/ia')}
                  style={{
                    color: '#06386d',
                    borderColor: '#06386d',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#06386d';
                    e.target.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#06386d';
                  }}
                >
                  <i className="bi bi-robot me-2"></i>
                  Asistente
                </Button>
                <Button
                  variant="success"
                  className="me-2"
                  onClick={() => navigate('/clientes/nuevo')}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Nuevo Cliente
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate('/remisiones')}
                >
                  Regresar a Pedidos
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Buscador */}
        <Row className="mb-3">
          <Col md={6}>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Buscar por nombre o identificación..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col md={6} className="text-end">
            <span className="text-muted">
              Total de clientes: {clientesFiltrados.length}
            </span>
          </Col>
        </Row>

        {/* Tabla de Clientes */}
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Lista de Clientes</h5>
              </Card.Header>
              <Card.Body className="p-0">
                {loading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-2">Cargando clientes...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Identificación</th>
                          <th>Negocio / Contacto</th>
                          <th>Teléfono</th>
                          <th>Días Visita</th>
                          <th>Ciudad</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientesFiltrados.length > 0 ? (
                          clientesFiltrados.map((cliente) => (
                            <tr key={cliente.id}>
                              <td>
                                <strong>{cliente.identificacion}</strong>
                                <br />
                                <small className="text-muted">{cliente.tipo_identificacion}</small>
                              </td>
                              <td>
                                <div>
                                  <strong>{cliente.alias || cliente.nombre_completo}</strong>
                                  {cliente.alias && cliente.nombre_completo && (
                                    <>
                                      <br />
                                      <small className="text-muted">Contacto: {cliente.nombre_completo}</small>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div>
                                  {cliente.telefono_1 && (
                                    <div>{cliente.telefono_1}</div>
                                  )}
                                  {cliente.movil && (
                                    <div>
                                      <small className="text-muted">Móvil: {cliente.movil}</small>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                {cliente.dia_entrega ? (
                                  <span style={{ color: '#06386d', fontSize: '0.85rem' }}>
                                    {cliente.dia_entrega.split(',').map(dia =>
                                      dia.trim().charAt(0).toUpperCase() + dia.trim().slice(1).toLowerCase()
                                    ).join(', ')}
                                  </span>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td>{cliente.ciudad || '-'}</td>
                              <td>
                                <span className={`badge ${cliente.activo ? 'bg-success' : 'bg-secondary'}`}>
                                  {cliente.activo ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
                                  title="Editar cliente"
                                >
                                  <i className="bi bi-pencil"></i>
                                </Button>
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => navigate(`/clientes/ver/${cliente.id}`)}
                                  title="Ver cliente"
                                >
                                  <i className="bi bi-eye"></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleEliminar(cliente)}
                                  title="Eliminar cliente"
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center p-4">
                              {busqueda ? 'No se encontraron clientes con ese criterio' : 'No hay clientes registrados'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ListaClientesScreen;