import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { clienteService } from '../services/clienteService';
import usePageTitle from '../hooks/usePageTitle';
import './ClientesScreen.css';

// Días de la semana
const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

const ClientesScreen = () => {
  usePageTitle('Cliente');
  const navigate = useNavigate();
  const { id } = useParams();
  const [modoEdicion, setModoEdicion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Datos para los dropdowns
  const [vendedores, setVendedores] = useState([]);
  const [listaPrecios, setListaPrecios] = useState([]);
  const [rutas, setRutas] = useState([]);

  // Datos del cliente
  const [clienteData, setClienteData] = useState({
    tipo_identificacion: 'CC',
    identificacion: '',
    nombre_completo: '', // Nombre del contacto
    alias: '', // Nombre del negocio
    movil: '',
    direccion: '',
    dia_entrega: '',
    medio_pago_defecto: 'EFECTIVO',
    departamento: '',
    ciudad: '',
    vendedor_asignado: '',
    zona_barrio: '', // Usaremos para la ruta
    tipo_lista_precio: '',
    activo: true
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
    if (id) {
      cargarCliente(id);
      setModoEdicion(true);
    }
  }, [id]);

  const cargarDatosIniciales = async () => {
    try {
      // Cargar vendedores
      const resVendedores = await fetch('http://localhost:8000/api/vendedores/');
      if (resVendedores.ok) {
        setVendedores(await resVendedores.json());
      }

      // Cargar lista de precios
      const resPrecios = await fetch('http://localhost:8000/api/lista-precios/?activo=true');
      if (resPrecios.ok) {
        setListaPrecios(await resPrecios.json());
      }

      // Cargar rutas
      const resRutas = await fetch('http://localhost:8000/api/rutas/');
      if (resRutas.ok) {
        setRutas(await resRutas.json());
      }
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  };

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

  const handleChange = (field, value) => {
    setClienteData(prev => ({ ...prev, [field]: value }));
  };

  // Toggle día de entrega
  const toggleDia = (dia) => {
    const diasActuales = (clienteData.dia_entrega || '').split(',').map(d => d.trim()).filter(Boolean);
    let nuevosDias;

    if (diasActuales.includes(dia)) {
      nuevosDias = diasActuales.filter(d => d !== dia);
    } else {
      nuevosDias = [...diasActuales, dia];
    }

    handleChange('dia_entrega', nuevosDias.join(','));
  };

  const handleGuardar = async () => {
    // Validaciones básicas
    if (!clienteData.identificacion?.trim()) {
      alert('La identificación es obligatoria');
      return;
    }
    if (!clienteData.nombre_completo?.trim()) {
      alert('El nombre del contacto es obligatorio');
      return;
    }

    try {
      setGuardando(true);
      if (modoEdicion && id) {
        const resultado = await clienteService.update(id, clienteData);
        if (resultado && !resultado.error) {
          alert('✅ Cliente actualizado exitosamente');
          navigate('/clientes');
        }
      } else {
        const resultado = await clienteService.create(clienteData);
        if (resultado && !resultado.error) {
          alert('✅ Cliente creado exitosamente');
          navigate('/clientes');
        }
      }
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert('❌ Error al guardar cliente');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="clientes-container">
      <Container fluid>
        <Row>
          <Col md={12}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0" style={{ color: '#06386d', fontWeight: 'bold' }}>
                {modoEdicion ? `Editar Cliente` : 'Nuevo Cliente'}
              </h2>
              <Button variant="outline-secondary" onClick={() => navigate('/clientes')}>
                ← Regresar a Lista
              </Button>
            </div>

            {/* Formulario */}
            <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <Card.Body className="p-4">
                <div className="row g-3">

                  {/* Tipo Identificación e Identificación */}
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Tipo Identificación</label>
                    <select
                      className="form-select"
                      value={clienteData.tipo_identificacion || 'CC'}
                      onChange={(e) => handleChange('tipo_identificacion', e.target.value)}
                    >
                      <option value="CC">Cédula (CC)</option>
                      <option value="NIT">NIT</option>
                      <option value="RUT">RUT</option>
                      <option value="CE">Cédula Extranjería</option>
                      <option value="PASAPORTE">Pasaporte</option>
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Identificación *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={clienteData.identificacion || ''}
                      onChange={(e) => handleChange('identificacion', e.target.value)}
                      placeholder="Ej: 123456789"
                    />
                  </div>

                  {/* Nombre del Contacto */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Nombre del Contacto *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={clienteData.nombre_completo || ''}
                      onChange={(e) => handleChange('nombre_completo', e.target.value)}
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>

                  {/* Nombre del Negocio */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Nombre del Negocio</label>
                    <input
                      type="text"
                      className="form-control"
                      value={clienteData.alias || ''}
                      onChange={(e) => handleChange('alias', e.target.value)}
                      placeholder="Ej: Tienda El Sol"
                    />
                  </div>

                  {/* Celular */}
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Celular</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={clienteData.movil || ''}
                      onChange={(e) => handleChange('movil', e.target.value)}
                      placeholder="Ej: 3001234567"
                      maxLength={10}
                    />
                  </div>

                  {/* Método de Pago */}
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Método de Pago</label>
                    <select
                      className="form-select"
                      value={clienteData.medio_pago_defecto || 'EFECTIVO'}
                      onChange={(e) => handleChange('medio_pago_defecto', e.target.value)}
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="CREDITO">Crédito</option>
                      <option value="MIXTO">Mixto</option>
                    </select>
                  </div>

                  {/* Dirección */}
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">Dirección</label>
                    <input
                      type="text"
                      className="form-control"
                      value={clienteData.direccion || ''}
                      onChange={(e) => handleChange('direccion', e.target.value)}
                      placeholder="Ej: Calle 123 #45-67, Barrio Centro"
                    />
                  </div>

                  {/* Departamento y Ciudad */}
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Departamento</label>
                    <input
                      type="text"
                      className="form-control"
                      value={clienteData.departamento || ''}
                      onChange={(e) => handleChange('departamento', e.target.value)}
                      placeholder="Ej: Cundinamarca"
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Ciudad</label>
                    <input
                      type="text"
                      className="form-control"
                      value={clienteData.ciudad || ''}
                      onChange={(e) => handleChange('ciudad', e.target.value)}
                      placeholder="Ej: Bogotá"
                    />
                  </div>

                  {/* Vendedor */}
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Vendedor</label>
                    <select
                      className="form-select"
                      value={clienteData.vendedor_asignado || ''}
                      onChange={(e) => handleChange('vendedor_asignado', e.target.value)}
                    >
                      <option value="">Ninguno</option>
                      {vendedores.map(v => (
                        <option key={v.id_vendedor} value={v.nombre}>
                          {v.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Zona/Ruta */}
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Zona / Ruta</label>
                    <select
                      className="form-select"
                      value={clienteData.zona_barrio || ''}
                      onChange={(e) => handleChange('zona_barrio', e.target.value)}
                    >
                      <option value="">Sin ruta</option>
                      {rutas.map(r => (
                        <option key={r.id} value={r.nombre}>
                          {r.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lista de Precios */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Lista de Precios</label>
                    <select
                      className="form-select"
                      value={clienteData.tipo_lista_precio || ''}
                      onChange={(e) => handleChange('tipo_lista_precio', e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {listaPrecios.map(lp => (
                        <option key={lp.id} value={lp.nombre}>
                          {lp.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Días de Entrega */}
                  <div className="col-md-8">
                    <label className="form-label fw-semibold">Días de Entrega</label>
                    <div className="d-flex flex-wrap gap-2" style={{ marginTop: '8px' }}>
                      {DIAS_SEMANA.map((dia) => {
                        const diasActuales = (clienteData.dia_entrega || '').split(',').map(d => d.trim()).filter(Boolean);
                        const isChecked = diasActuales.includes(dia);

                        return (
                          <button
                            key={dia}
                            type="button"
                            onClick={() => toggleDia(dia)}
                            style={{
                              padding: '4px 8px', // Más pequeños
                              fontSize: '0.75rem', // Letra más pequeña
                              fontWeight: isChecked ? 'bold' : '500',
                              borderRadius: '12px', // Bordes más redondeados pero pequeños
                              backgroundColor: isChecked ? '#06386d' : 'transparent',
                              color: isChecked ? 'white' : '#06386d',
                              border: `1px solid ${isChecked ? '#06386d' : '#b0c4de'}`, // Borde más delgado
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              minWidth: '40px'
                            }}
                          >
                            {dia.substring(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Botones de Acción */}
                <div className="d-flex justify-content-between align-items-center mt-4 pt-3" style={{ borderTop: '1px solid #eee' }}>
                  <Form.Check
                    type="switch"
                    id="activar-cliente"
                    label={clienteData.activo ? "Cliente Activo" : "Cliente Inactivo"}
                    checked={clienteData.activo}
                    onChange={(e) => handleChange('activo', e.target.checked)}
                    style={{ fontSize: '0.9rem' }}
                  />
                  <div>
                    <Button
                      variant="outline-secondary"
                      className="me-2"
                      onClick={() => navigate('/clientes')}
                    >
                      Cancelar
                    </Button>
                    <button
                      type="button"
                      className="btn text-white"
                      onClick={handleGuardar}
                      disabled={guardando}
                      style={{
                        backgroundColor: 'rgb(6, 56, 109)',
                        borderColor: 'rgb(6, 56, 109)',
                        minWidth: '120px',
                        fontWeight: '600',
                        opacity: guardando ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgb(5, 45, 87)';
                        e.target.style.borderColor = 'rgb(5, 45, 87)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'rgb(6, 56, 109)';
                        e.target.style.borderColor = 'rgb(6, 56, 109)';
                      }}
                    >
                      {guardando ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Guardando...
                        </>
                      ) : (
                        modoEdicion ? 'Actualizar' : 'Guardar'
                      )}
                    </button>
                  </div>
                </div>

              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ClientesScreen;