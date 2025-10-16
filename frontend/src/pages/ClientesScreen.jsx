import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Nav } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { clienteService } from '../services/clienteService';
import './ClientesScreen.css';

// Componentes de pestañas
import InformacionBasica from '../components/Clientes/tabs/InformacionBasica';
import DatosGeograficos from '../components/Clientes/tabs/DatosGeograficos';
import Detalles from '../components/Clientes/tabs/Detalles';
import Configuracion from '../components/Clientes/tabs/Configuracion';
import Saldos from '../components/Clientes/tabs/Saldos';
import Contactos from '../components/Clientes/tabs/Contactos';

const ClientesScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('informacionBasica');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clienteData, setClienteData] = useState({
    regimen: 'SIMPLIFICADO',
    tipo_persona: 'NATURAL',
    tipo_identificacion: 'CC',
    identificacion: '',
    nombre_completo: '',
    alias: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    telefono_1: '',
    movil: '',
    email_1: '',
    contacto: '',
    telefono_contacto: '',
    pais: 'Colombia',
    departamento: '',
    ciudad: '',
    direccion: '',
    zona_barrio: '',
    tipo_contacto: 'CLIENTE',
    sucursal: 'Todas',
    medio_pago_defecto: '',
    nota: '',
    tipo_lista_precio: '',
    vendedor_asignado: '',
    centro_costo: '',
    dia_entrega: '',
    notificar_cartera: false,
    notificar_rotacion: false,
    cliente_predeterminado: false,
    permite_venta_credito: false,
    cupo_endeudamiento: 0,
    dias_vencimiento_cartera: 30,
    activo: true
  });

  // Cargar cliente si estamos editando
  useEffect(() => {
    if (id) {
      cargarCliente(id);
      setModoEdicion(true);
    }
  }, [id]);

  const cargarCliente = async (clienteId) => {
    try {
      setLoading(true);
      const cliente = await clienteService.getById(clienteId);
      if (cliente && !cliente.error) {
        setClienteData(cliente);
      }
    } catch (error) {
      console.error('Error al cargar cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    try {
      if (modoEdicion && id) {
        // Actualizar cliente existente
        const resultado = await clienteService.update(id, clienteData);
        if (resultado && !resultado.error) {
          alert('Cliente actualizado exitosamente');
          navigate('/clientes');
        }
      } else {
        // Crear nuevo cliente
        const resultado = await clienteService.create(clienteData);
        if (resultado && !resultado.error) {
          alert('Cliente creado exitosamente');
          navigate('/clientes');
        }
      }
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert('Error al guardar cliente');
    }
  };

  const limpiarFormulario = () => {
    setClienteData({
      regimen: 'SIMPLIFICADO',
      tipo_persona: 'NATURAL',
      tipo_identificacion: 'CC',
      identificacion: '',
      nombre_completo: '',
      alias: '',
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      telefono_1: '',
      movil: '',
      email_1: '',
      contacto: '',
      telefono_contacto: '',
      pais: 'Colombia',
      departamento: '',
      ciudad: '',
      direccion: '',
      zona_barrio: '',
      tipo_contacto: 'CLIENTE',
      sucursal: 'Todas',
      medio_pago_defecto: '',
      nota: '',
      tipo_lista_precio: '',
      vendedor_asignado: '',
      centro_costo: '',
      dia_entrega: '',
      notificar_cartera: false,
      notificar_rotacion: false,
      cliente_predeterminado: false,
      permite_venta_credito: false,
      cupo_endeudamiento: 0,
      dias_vencimiento_cartera: 30,
      activo: true
    });
    setActiveTab('informacionBasica');
  };

  const handleCancelar = () => {
    navigate('/clientes');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'informacionBasica':
        return <InformacionBasica clienteData={clienteData} setClienteData={setClienteData} />;
      case 'datosGeograficos':
        return <DatosGeograficos clienteData={clienteData} setClienteData={setClienteData} />;
      case 'detalles':
        return <Detalles clienteData={clienteData} setClienteData={setClienteData} />;
      case 'configuracion':
        return <Configuracion clienteData={clienteData} setClienteData={setClienteData} />;
      case 'saldos':
        return <Saldos clienteData={clienteData} setClienteData={setClienteData} />;
      case 'contactos':
        return <Contactos />;
      default:
        return <InformacionBasica clienteData={clienteData} setClienteData={setClienteData} />;
    }
  };

  return (
    <div className="clientes-container">
      <Container fluid>
        <Row>
          <Col md={12}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="mb-0">
                {modoEdicion ? `Editar Cliente - ${clienteData.identificacion}` : 'Nuevo Cliente'}
              </h2>
              <Button variant="light" onClick={() => navigate('/clientes')}>
                Regresar a Lista
              </Button>
            </div>

            {/* Navegación de Pestañas */}
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'informacionBasica'}
                  onClick={() => setActiveTab('informacionBasica')}
                >
                  <i className="bi bi-person-lines-fill me-2"></i>Información Básica
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'datosGeograficos'}
                  onClick={() => setActiveTab('datosGeograficos')}
                >
                  <i className="bi bi-geo-alt-fill me-2"></i>Datos Geográficos
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'detalles'}
                  onClick={() => setActiveTab('detalles')}
                >
                  <i className="bi bi-list-check me-2"></i>Detalles
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'configuracion'}
                  onClick={() => setActiveTab('configuracion')}
                >
                  <i className="bi bi-gear-fill me-2"></i>Configuración
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'saldos'}
                  onClick={() => setActiveTab('saldos')}
                >
                  <i className="bi bi-currency-dollar me-2"></i>Saldos
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'contactos'}
                  onClick={() => setActiveTab('contactos')}
                >
                  <i className="bi bi-person-rolodex me-2"></i>Contactos
                </Nav.Link>
              </Nav.Item>
            </Nav>

            {/* Contenido de la Pestaña */}
            <Card>
              <Card.Body className="p-4">
                {renderTabContent()}
              </Card.Body>
            </Card>

            {/* Botones de Acción */}
            <div className="mt-4 d-flex justify-content-between align-items-center">
              <div>
                <Form.Check
                  type="checkbox"
                  id="activar"
                  label="Activar / Inactivar"
                  checked={clienteData.activo}
                  onChange={(e) => setClienteData({ ...clienteData, activo: e.target.checked })}
                  className="d-inline-block me-3"
                />
              </div>
              <div>
                <Button variant="success" className="me-2" onClick={handleGuardar}>
                  {modoEdicion ? 'Actualizar' : 'Guardar'}
                </Button>
                <Button variant="light" onClick={handleCancelar}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ClientesScreen;