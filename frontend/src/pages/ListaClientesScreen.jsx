import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { clienteService } from '../services/clienteService';

const ListaClientesScreen = () => {
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

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.identificacion.includes(busqueda)
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
                  variant="success" 
                  className="me-2"
                  onClick={() => navigate('/clientes/nuevo')}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Nuevo Cliente
                </Button>
                <Button 
                  variant="outline-secondary"
                  onClick={() => navigate('/pos')}
                >
                  Regresar al POS
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
                          <th>Nombre Completo</th>
                          <th>Teléfono</th>
                          <th>Email</th>
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
                                  {cliente.nombre_completo}
                                  {cliente.alias && (
                                    <>
                                      <br />
                                      <small className="text-muted">({cliente.alias})</small>
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
                              <td>{cliente.email_1 || '-'}</td>
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
                                  className="me-2"
                                  onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
                                >
                                  <i className="bi bi-pencil"></i> Editar
                                </Button>
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={() => navigate(`/clientes/ver/${cliente.id}`)}
                                >
                                  <i className="bi bi-eye"></i> Ver
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