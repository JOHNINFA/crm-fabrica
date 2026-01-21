import React, { useState, useEffect } from 'react';

const Configuracion = ({ clienteData, setClienteData }) => {
  const [listaPrecios, setListaPrecios] = useState([]);
  const [vendedores, setVendedores] = useState([]);

  useEffect(() => {
    cargarListaPrecios();
    cargarVendedores();
  }, []);

  const cargarListaPrecios = async () => {
    try {
      const response = await fetch('/api/lista-precios/?activo=true');
      if (response.ok) {
        const data = await response.json();
        setListaPrecios(data);
      }
    } catch (error) {
      console.error('Error cargando listas de precios:', error);
    }
  };

  const cargarVendedores = async () => {
    try {
      // 🚀 CORREGIDO: Usar el endpoint correcto de vendedores
      const response = await fetch('/api/vendedores/');
      if (response.ok) {
        const data = await response.json();

        setVendedores(data);
      } else {
        console.error('Error en respuesta:', response.status);
      }
    } catch (error) {
      console.error('Error cargando vendedores:', error);
    }
  };

  const handleChange = (field, value) => {
    setClienteData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="row g-3">
      <div className="col-md-4">
        <label className="form-label">Tipo Lista Precio</label>
        <select
          className="form-select"
          value={clienteData.tipo_lista_precio || ''}
          onChange={(e) => handleChange('tipo_lista_precio', e.target.value)}
        >
          <option value="">Seleccionar...</option>
          {listaPrecios.map(lista => (
            <option key={lista.id} value={lista.nombre}>{lista.nombre}</option>
          ))}
        </select>
      </div>
      <div className="col-md-3">
        <label className="form-label">Vendedor</label>
        <select
          className="form-select"
          value={clienteData.vendedor_asignado || ''}
          onChange={(e) => handleChange('vendedor_asignado', e.target.value)}
        >
          <option value="">Ninguno</option>
          {vendedores.map(vendedor => (
            <option key={vendedor.id_vendedor} value={vendedor.nombre}>
              {vendedor.nombre} ({vendedor.id_vendedor})
            </option>
          ))}
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label">Días de Entrega</label>
        <div className="d-flex flex-wrap gap-2" style={{ marginTop: '8px' }}>
          {['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'].map((dia) => {
            // Verificar si el día está seleccionado
            const diasActuales = (clienteData.dia_entrega || '').split(',').map(d => d.trim()).filter(Boolean);
            const isChecked = diasActuales.includes(dia);

            const toggleDia = () => {
              let nuevoDias;
              if (isChecked) {
                // Quitar el día
                nuevoDias = diasActuales.filter(d => d !== dia);
              } else {
                // Agregar el día
                nuevoDias = [...diasActuales, dia];
              }
              handleChange('dia_entrega', nuevoDias.join(','));
            };

            return (
              <button
                key={dia}
                type="button"
                onClick={toggleDia}
                style={{
                  padding: '3px 8px',
                  fontSize: '0.7rem',
                  fontWeight: isChecked ? 'bold' : '500',
                  borderRadius: '12px',
                  backgroundColor: isChecked ? '#06386d' : 'transparent',
                  color: isChecked ? 'white' : '#06386d',
                  border: `1.5px solid ${isChecked ? '#06386d' : '#b0c4de'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {dia.substring(0, 3)}
              </button>
            );
          })}
        </div>
      </div>
      <div className="col-md-3">
        <label className="form-label">Centro de Costo</label>
        <select
          className="form-select"
          value={clienteData.centro_costo || ''}
          onChange={(e) => handleChange('centro_costo', e.target.value)}
        >
          <option value="">Ninguno</option>
          <option value="VENTAS">Ventas</option>
          <option value="ADMINISTRACION">Administración</option>
        </select>
      </div>
      <div className="col-12">
        <label className="form-label">Nota</label>
        <textarea
          className="form-control"
          rows="3"
          value={clienteData.nota}
          onChange={(e) => handleChange('nota', e.target.value)}
        ></textarea>
      </div>
      <div className="col-12">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="notificarCartera"
            checked={clienteData.notificar_cartera || false}
            onChange={(e) => handleChange('notificar_cartera', e.target.checked)}
          />
          <label className="form-check-label" htmlFor="notificarCartera">
            Notificar Cartera
          </label>
        </div>
      </div>
      <div className="col-12">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="notificarRotacion"
            checked={clienteData.notificar_rotacion || false}
            onChange={(e) => handleChange('notificar_rotacion', e.target.checked)}
          />
          <label className="form-check-label" htmlFor="notificarRotacion">
            Notificar Rotación Productos
          </label>
        </div>
      </div>
      <div className="col-12">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="clientePredeterminado"
            checked={clienteData.cliente_predeterminado || false}
            onChange={(e) => handleChange('cliente_predeterminado', e.target.checked)}
          />
          <label className="form-check-label" htmlFor="clientePredeterminado">
            Cliente Predeterminado
          </label>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;