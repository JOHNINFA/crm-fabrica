import React from 'react';

const InformacionBasica = ({ clienteData, setClienteData }) => {
  const handleChange = (field, value) => {
    setClienteData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="row g-3">
      {/* Fila 1 */}
      <div className="col-md-3">
        <label className="form-label">Régimen</label>
        <select 
          className="form-select"
          value={clienteData.regimen}
          onChange={(e) => handleChange('regimen', e.target.value)}
        >
          <option value="SIMPLIFICADO">Régimen Simplificado</option>
          <option value="COMUN">Régimen Común</option>
        </select>
      </div>
      <div className="col-md-3">
        <label className="form-label">Tipo Persona</label>
        <select 
          className="form-select"
          value={clienteData.tipo_persona}
          onChange={(e) => handleChange('tipo_persona', e.target.value)}
        >
          <option value="NATURAL">Natural</option>
          <option value="JURIDICA">Jurídica</option>
        </select>
      </div>
      <div className="col-md-3">
        <label className="form-label">Tipo Identificación</label>
        <select 
          className="form-select"
          value={clienteData.tipo_identificacion}
          onChange={(e) => handleChange('tipo_identificacion', e.target.value)}
        >
          <option value="CC">Cédula de ciudadanía</option>
          <option value="NIT">NIT</option>
          <option value="CE">Cédula de extranjería</option>
          <option value="PASAPORTE">Pasaporte</option>
        </select>
      </div>
      <div className="col-md-3">
        <label className="form-label">Tipo Contacto</label>
        <select 
          className="form-select"
          value={clienteData.tipo_contacto}
          onChange={(e) => handleChange('tipo_contacto', e.target.value)}
        >
          <option value="CLIENTE">CLIENTE</option>
          <option value="PROVEEDOR">PROVEEDOR</option>
        </select>
      </div>

      {/* Fila 2 */}
      <div className="col-md-3">
        <label className="form-label">Identificación *</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Identificación"
          value={clienteData.identificacion}
          onChange={(e) => handleChange('identificacion', e.target.value)}
          required
        />
      </div>
      <div className="col-md-3">
        <label className="form-label">Nombre completo *</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Nombre completo"
          value={clienteData.nombre_completo}
          onChange={(e) => handleChange('nombre_completo', e.target.value)}
          required
        />
      </div>
      <div className="col-md-3">
        <label className="form-label">Alias</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Alias"
          value={clienteData.alias}
          onChange={(e) => handleChange('alias', e.target.value)}
        />
      </div>
      <div className="col-md-3">
        <label className="form-label">Sucursal</label>
        <select 
          className="form-select"
          value={clienteData.sucursal}
          onChange={(e) => handleChange('sucursal', e.target.value)}
        >
          <option value="Todas">Todas</option>
          <option value="Principal">Principal</option>
        </select>
      </div>

      {/* Fila 3 */}
      <div className="col-md-3">
        <label className="form-label">Primer Nombre</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Primer Nombre"
          value={clienteData.primer_nombre}
          onChange={(e) => handleChange('primer_nombre', e.target.value)}
        />
      </div>
      <div className="col-md-3">
        <label className="form-label">Segundo Nombre</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Segundo Nombre"
          value={clienteData.segundo_nombre}
          onChange={(e) => handleChange('segundo_nombre', e.target.value)}
        />
      </div>
      <div className="col-md-3">
        <label className="form-label">Primer Apellido</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Primer Apellido"
          value={clienteData.primer_apellido}
          onChange={(e) => handleChange('primer_apellido', e.target.value)}
        />
      </div>
      <div className="col-md-3">
        <label className="form-label">Segundo Apellido</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Segundo Apellido"
          value={clienteData.segundo_apellido}
          onChange={(e) => handleChange('segundo_apellido', e.target.value)}
        />
      </div>

      {/* Fila 4 */}
      <div className="col-md-3">
        <label className="form-label">Teléfono # 1</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Teléfono # 1"
          value={clienteData.telefono_1}
          onChange={(e) => handleChange('telefono_1', e.target.value)}
        />
      </div>
      <div className="col-md-3">
        <label className="form-label">Móvil</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Celular"
          value={clienteData.movil}
          onChange={(e) => handleChange('movil', e.target.value)}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Email # 1</label>
        <input 
          type="email" 
          className="form-control" 
          placeholder="Email # 1"
          value={clienteData.email_1}
          onChange={(e) => handleChange('email_1', e.target.value)}
        />
      </div>

      {/* Fila 5 */}
      <div className="col-md-4">
        <label className="form-label">Contacto</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Contacto"
          value={clienteData.contacto}
          onChange={(e) => handleChange('contacto', e.target.value)}
        />
      </div>
      <div className="col-md-4">
        <label className="form-label">Teléfono Contacto</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Teléfono Contacto"
          value={clienteData.telefono_contacto}
          onChange={(e) => handleChange('telefono_contacto', e.target.value)}
        />
      </div>
      <div className="col-md-4">
        <label className="form-label">Medio Pago Por Defecto</label>
        <select 
          className="form-select"
          value={clienteData.medio_pago_defecto}
          onChange={(e) => handleChange('medio_pago_defecto', e.target.value)}
        >
          <option value="">Seleccionar...</option>
          <option value="EFECTIVO">Efectivo</option>
          <option value="TARJETA">Tarjeta</option>
          <option value="TRANSFERENCIA">Transferencia</option>
        </select>
      </div>
    </div>
  );
};

export default InformacionBasica;