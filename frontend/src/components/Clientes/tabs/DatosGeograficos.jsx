import React from 'react';

const DatosGeograficos = ({ clienteData, setClienteData }) => {
  const handleChange = (field, value) => {
    setClienteData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="row g-3">
      <div className="col-md-4">
        <label className="form-label">País</label>
        <select 
          className="form-select"
          value={clienteData.pais}
          onChange={(e) => handleChange('pais', e.target.value)}
        >
          <option value="Colombia">Colombia</option>
          <option value="Venezuela">Venezuela</option>
          <option value="Ecuador">Ecuador</option>
        </select>
      </div>
      <div className="col-md-4">
        <label className="form-label">Departamento/Provincia/Estado</label>
        <input 
          type="text" 
          className="form-control"
          value={clienteData.departamento}
          onChange={(e) => handleChange('departamento', e.target.value)}
        />
      </div>
      <div className="col-md-4">
        <label className="form-label">Ciudad</label>
        <input 
          type="text" 
          className="form-control"
          value={clienteData.ciudad}
          onChange={(e) => handleChange('ciudad', e.target.value)}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Dirección</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Dirección"
          value={clienteData.direccion}
          onChange={(e) => handleChange('direccion', e.target.value)}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Zona/Barrio/Distrito</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Zona / Barrio"
          value={clienteData.zona_barrio}
          onChange={(e) => handleChange('zona_barrio', e.target.value)}
        />
      </div>
    </div>
  );
};

export default DatosGeograficos;