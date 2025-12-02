import React from 'react';

const Detalles = ({ clienteData, setClienteData }) => {
  const handleChange = (field, value) => {
    setClienteData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="row g-3">
      <div className="col-md-6">
        <label className="form-label">Código Interno</label>
        <input 
          type="text" 
          className="form-control"
          value={clienteData.codigo_interno || ''}
          onChange={(e) => handleChange('codigo_interno', e.target.value)}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Número Matrícula</label>
        <input 
          type="text" 
          className="form-control"
          value={clienteData.numero_matricula || ''}
          onChange={(e) => handleChange('numero_matricula', e.target.value)}
        />
      </div>
      <div className="col-md-3">
        <label className="form-label">Estado Civil</label>
        <select 
          className="form-select"
          value={clienteData.estado_civil || 'SOLTERO'}
          onChange={(e) => handleChange('estado_civil', e.target.value)}
        >
          <option value="SOLTERO">Soltero(a)</option>
          <option value="CASADO">Casado(a)</option>
          <option value="DIVORCIADO">Divorciado(a)</option>
          <option value="VIUDO">Viudo(a)</option>
        </select>
      </div>
      <div className="col-md-3">
        <label className="form-label">Estrato Social - Económico</label>
        <input 
          type="number" 
          className="form-control" 
          min="1" 
          max="6"
          value={clienteData.estrato || 3}
          onChange={(e) => handleChange('estrato', parseInt(e.target.value))}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Clase Cliente</label>
        <select 
          className="form-select"
          value={clienteData.clase_cliente || 'GENERAL'}
          onChange={(e) => handleChange('clase_cliente', e.target.value)}
        >
          <option value="GENERAL">General</option>
          <option value="VIP">VIP</option>
          <option value="MAYORISTA">Mayorista</option>
        </select>
      </div>
      <div className="col-md-4">
        <label className="form-label">Fecha Nacimiento</label>
        <input 
          type="date" 
          className="form-control"
          value={clienteData.fecha_nacimiento || ''}
          onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
        />
      </div>
      <div className="col-md-4">
        <label className="form-label">Sexo</label>
        <select 
          className="form-select"
          value={clienteData.sexo || 'SIN_ESPECIFICAR'}
          onChange={(e) => handleChange('sexo', e.target.value)}
        >
          <option value="SIN_ESPECIFICAR">Sin Especificar</option>
          <option value="MASCULINO">Masculino</option>
          <option value="FEMENINO">Femenino</option>
        </select>
      </div>
    </div>
  );
};

export default Detalles;