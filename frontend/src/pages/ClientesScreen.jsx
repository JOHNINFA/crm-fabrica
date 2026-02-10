import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { clienteService } from '../services/clienteService';
import { API_URL } from '../services/api';
import usePageTitle from '../hooks/usePageTitle';
import './ClientesScreen.css';

// Días de la semana
const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

// 🆕 Departamentos y ciudades de Colombia
const DEPARTAMENTOS_CIUDADES = {
  'CUNDINAMARCA': [
    'BOGOTÁ', 'SOACHA', 'FACATATIVÁ', 'ZIPAQUIRÁ', 'CHÍA', 'MOSQUERA', 'FUSAGASUGÁ',
    'MADRID', 'FUNZA', 'CAJICÁ', 'SIBATÉ', 'TOCANCIPÁ', 'GIRARDOT', 'COTA', 'LA CALERA',
    'SOPÓ', 'TENJO', 'TABIO', 'SUBACHOQUE', 'EL ROSAL', 'BOJACÁ', 'ARBELÁEZ',
    'ANAPOIMA', 'ANOLAIMA', 'APULO', 'BELTRÁN', 'BITUIMA', 'CABRERA', 'CACHIPAY',
    'CAPARRAPÍ', 'CÁQUEZA', 'CARMEN DE CARUPA', 'CHAGUANÍ', 'CHIPAQUE', 'CHOACHÍ',
    'CHOCONTÁ', 'COGUA', 'CUCUNUBÁ', 'EL COLEGIO', 'EL PEÑÓN', 'EL ROSAL', 'FÓMEQUE',
    'FOSCA', 'GACHALÁ', 'GACHANCIPÁ', 'GACHETÁ', 'GAMA', 'GRANADA', 'GUACHETÁ',
    'GUADUAS', 'GUASCA', 'GUATAQUÍ', 'GUATAVITA', 'GUAYABAL DE SÍQUIMA', 'GUAYABETAL',
    'GUTIÉRREZ', 'JERUSALÉN', 'JUNÍN', 'LA MESA', 'LA PALMA', 'LA PEÑA', 'LA VEGA',
    'LENGUAZAQUE', 'MACHETÁ', 'MANTA', 'MEDINA', 'NARIÑO', 'NEMOCÓN', 'NILO',
    'NIMAIMA', 'NOCAIMA', 'PACHO', 'PAIME', 'PANDI', 'PARATEBUENO', 'PASCA',
    'PUERTO SALGAR', 'PULÍ', 'QUEBRADANEGRA', 'QUETAME', 'QUIPILE', 'RICAURTE',
    'SAN ANTONIO DEL TEQUENDAMA', 'SAN BERNARDO', 'SAN CAYETANO', 'SAN FRANCISCO',
    'SAN JUAN DE RIOSECO', 'SASAIMA', 'SESQUILÉ', 'SILVANIA', 'SIMIJACA', 'SUSA',
    'SUTATAUSA', 'SUESCA', 'SUPATA', 'SUSA', 'SUTATAUSA', 'TABIO', 'TAUSA',
    'TENA', 'TENJO', 'TIBACUY', 'TIBIRITA', 'TOCAIMA', 'TOCANCIPÁ', 'TOPAIPÍ',
    'UBALÁ', 'UBAQUE', 'UBATÉ', 'UNE', 'ÚTICA', 'VENECIA', 'VERGARA', 'VIANÍ',
    'VILLAGÓMEZ', 'VILLAPINZÓN', 'VILLETA', 'VIOTÁ', 'YACOPÍ', 'ZIPACÓN'
  ],
  'ANTIOQUIA': ['MEDELLÍN', 'BELLO', 'ITAGÜÍ', 'ENVIGADO', 'APARTADÓ', 'TURBO', 'RIONEGRO', 'SABANETA', 'CALDAS', 'LA ESTRELLA'],
  'VALLE DEL CAUCA': ['CALI', 'PALMIRA', 'BUENAVENTURA', 'TULUÁ', 'CARTAGO', 'BUGA', 'JAMUNDÍ', 'YUMBO'],
  'ATLÁNTICO': ['BARRANQUILLA', 'SOLEDAD', 'MALAMBO', 'SABANALARGA', 'PUERTO COLOMBIA'],
  'SANTANDER': ['BUCARAMANGA', 'FLORIDABLANCA', 'GIRÓN', 'PIEDECUESTA', 'BARRANCABERMEJA', 'SAN GIL'],
  'BOLÍVAR': ['CARTAGENA', 'MAGANGUÉ', 'TURBACO', 'ARJONA'],
  'NORTE DE SANTANDER': ['CÚCUTA', 'OCAÑA', 'PAMPLONA', 'VILLA DEL ROSARIO'],
  'TOLIMA': ['IBAGUÉ', 'ESPINAL', 'MELGAR', 'HONDA'],
  'HUILA': ['NEIVA', 'PITALITO', 'GARZÓN', 'LA PLATA'],
  'RISARALDA': ['PEREIRA', 'DOSQUEBRADAS', 'SANTA ROSA DE CABAL'],
  'QUINDÍO': ['ARMENIA', 'CALARCÁ', 'LA TEBAIDA', 'MONTENEGRO'],
  'CALDAS': ['MANIZALES', 'VILLAMARÍA', 'CHINCHINÁ'],
  'CAUCA': ['POPAYÁN', 'SANTANDER DE QUILICHAO', 'PUERTO TEJADA'],
  'NARIÑO': ['PASTO', 'TUMACO', 'IPIALES'],
  'MAGDALENA': ['SANTA MARTA', 'CIÉNAGA', 'FUNDACIÓN'],
  'CÓRDOBA': ['MONTERÍA', 'CERETÉ', 'LORICA', 'SAHAGÚN'],
  'CESAR': ['VALLEDUPAR', 'AGUACHICA', 'BOSCONIA'],
  'SUCRE': ['SINCELEJO', 'COROZAL', 'SAN MARCOS'],
  'LA GUAJIRA': ['RIOHACHA', 'MAICAO', 'URIBIA'],
  'META': ['VILLAVICENCIO', 'ACACÍAS', 'GRANADA'],
  'BOYACÁ': ['TUNJA', 'DUITAMA', 'SOGAMOSO', 'CHIQUINQUIRÁ'],
  'CASANARE': ['YOPAL', 'AGUAZUL', 'VILLANUEVA'],
  'ARAUCA': ['ARAUCA', 'TAME', 'SARAVENA'],
  'CAQUETÁ': ['FLORENCIA', 'SAN VICENTE DEL CAGUÁN'],
  'PUTUMAYO': ['MOCOA', 'PUERTO ASÍS'],
  'AMAZONAS': ['LETICIA'],
  'GUAINÍA': ['INÍRIDA'],
  'GUAVIARE': ['SAN JOSÉ DEL GUAVIARE'],
  'VAUPÉS': ['MITÚ'],
  'VICHADA': ['PUERTO CARREÑO']
};

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

  // 🆕 Tipos de negocio (cargados desde la API)
  const [tiposNegocio, setTiposNegocio] = useState([]);

  // Datos del cliente
  const [clienteData, setClienteData] = useState({
    tipo_identificacion: 'CC',
    identificacion: '',
    nombre_completo: '', // Nombre del contacto
    alias: '', // Nombre del negocio
    tipo_negocio: '', // 🆕 Tipo de negocio
    movil: '',
    direccion: '',
    dia_entrega: '',
    medio_pago_defecto: 'EFECTIVO',
    departamento: 'CUNDINAMARCA', // 🆕 Por defecto
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
      const vendedoresRes = await fetch(`${API_URL}/vendedores/`);
      if (vendedoresRes.ok) {
        const vendedoresData = await vendedoresRes.json();
        setVendedores(vendedoresData);
      }

      // Cargar listas de precios
      const listasRes = await fetch(`${API_URL}/lista-precios/`);
      if (listasRes.ok) {
        const listasData = await listasRes.json();
        setListaPrecios(listasData);
      }

      // Cargar rutas
      const rutasRes = await fetch(`${API_URL}/rutas/`);
      if (rutasRes.ok) {
        const rutasData = await rutasRes.json();
        setRutas(rutasData);
      }

      // 🆕 Cargar tipos de negocio
      const tiposRes = await fetch(`${API_URL}/tipos-negocio/`);
      if (tiposRes.ok) {
        const tiposData = await tiposRes.json();
        setTiposNegocio(tiposData.map(t => t.nombre).sort());
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
        // Si no tiene departamento, usar CUNDINAMARCA por defecto
        if (!cliente.departamento) {
          cliente.departamento = 'CUNDINAMARCA';
        }
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
                      onChange={(e) => handleChange('identificacion', e.target.value.toUpperCase())}
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
                      onChange={(e) => handleChange('nombre_completo', e.target.value.toUpperCase())}
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
                      onChange={(e) => handleChange('alias', e.target.value.toUpperCase())}
                      placeholder="Ej: Tienda El Sol"
                    />
                  </div>

                  {/* Tipo de Negocio */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Tipo de Negocio</label>
                    <select
                      className="form-select"
                      value={clienteData.tipo_negocio || ''}
                      onChange={(e) => {
                        const valor = e.target.value;
                        if (valor === 'OTRO') {
                          // Mostrar prompt para agregar nuevo tipo
                          const nuevoTipo = prompt('Ingrese el nuevo tipo de negocio:');
                          if (nuevoTipo && nuevoTipo.trim()) {
                            const tipoMayusculas = nuevoTipo.trim().toUpperCase();
                            // Guardar en la BD
                            fetch(`${API_URL}/tipos-negocio/`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ nombre: tipoMayusculas, activo: true })
                            })
                              .then(res => res.json())
                              .then(() => {
                                // Recargar tipos desde la BD
                                fetch(`${API_URL}/tipos-negocio/`)
                                  .then(res => res.json())
                                  .then(data => setTiposNegocio(data.map(t => t.nombre).sort()));
                              })
                              .catch(err => console.error('Error guardando tipo:', err));

                            handleChange('tipo_negocio', tipoMayusculas);
                          }
                        } else {
                          handleChange('tipo_negocio', valor);
                        }
                      }}
                    >
                      <option value="">Seleccionar...</option>
                      {tiposNegocio.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                      <option value="OTRO">➕ Agregar Otro...</option>
                    </select>
                  </div>

                  {/* Celular */}
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Celular/Teléfono</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={clienteData.movil || ''}
                      onChange={(e) => handleChange('movil', e.target.value)}
                      placeholder="Ej: 3001234567-3219876543"
                      maxLength={100}
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
                      onChange={(e) => handleChange('direccion', e.target.value.toUpperCase())}
                      placeholder="Ej: Calle 123 #45-67, Barrio Centro"
                    />
                  </div>

                  {/* Departamento y Ciudad */}
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Departamento</label>
                    <select
                      className="form-select"
                      value={clienteData.departamento || 'CUNDINAMARCA'}
                      onChange={(e) => {
                        handleChange('departamento', e.target.value);
                        // Limpiar ciudad al cambiar departamento
                        handleChange('ciudad', '');
                      }}
                    >
                      {Object.keys(DEPARTAMENTOS_CIUDADES).map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Ciudad</label>
                    <select
                      className="form-select"
                      value={clienteData.ciudad || ''}
                      onChange={(e) => handleChange('ciudad', e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {(() => {
                        const dept = clienteData.departamento || 'CUNDINAMARCA';
                        const ciudades = DEPARTAMENTOS_CIUDADES[dept] || [];
                        return ciudades.map(ciudad => (
                          <option key={ciudad} value={ciudad}>{ciudad}</option>
                        ));
                      })()}
                    </select>
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