import React from 'react';

const Configuracion = ({ clienteData, setClienteData }) => {
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
          <option value="GENERAL">General</option>
          <option value="MAYORISTA">Mayorista</option>
          <option value="VIP">VIP</option>
        </select>
      </div>
      <div className="col-md-4">
        <label className="form-label">Vendedor</label>
        <select 
          className="form-select"
          value={clienteData.vendedor_asignado || ''}
          onChange={(e) => handleChange('vendedor_asignado', e.target.value)}
        >
          <option value="">Ninguno</option>
          <option value="jose">Jose</option>
          <option value="maria">Maria</option>
          <option value="luis">Luis</option>
        </select>
      </div>
      <div className="col-md-4">
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