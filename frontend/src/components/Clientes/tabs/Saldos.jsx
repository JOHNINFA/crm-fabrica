import React from 'react';

const Saldos = ({ clienteData, setClienteData }) => {
  const handleChange = (field, value) => {
    setClienteData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="row g-3">
      <div className="col-md-6">
        <label className="form-label">Puntos Acumulados</label>
        <input 
          type="text" 
          readOnly 
          className="form-control-plaintext" 
          value={clienteData.puntos_acumulados || 0}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Saldo Favor Bonos ($)</label>
        <input 
          type="text" 
          readOnly 
          className="form-control-plaintext" 
          value={clienteData.saldo_bonos || 0}
        />
      </div>
      <div className="col-md-4">
        <label className="form-label d-block">Permitir Ventas a Crédito</label>
        <div className="form-check form-check-inline">
          <input 
            className="form-check-input" 
            type="radio" 
            name="permiteVentaCredito" 
            id="creditoSi" 
            value="true"
            checked={clienteData.permite_venta_credito === true}
            onChange={(e) => handleChange('permite_venta_credito', true)}
          />
          <label className="form-check-label" htmlFor="creditoSi">SI</label>
        </div>
        <div className="form-check form-check-inline">
          <input 
            className="form-check-input" 
            type="radio" 
            name="permiteVentaCredito" 
            id="creditoNo" 
            value="false"
            checked={clienteData.permite_venta_credito === false}
            onChange={(e) => handleChange('permite_venta_credito', false)}
          />
          <label className="form-check-label" htmlFor="creditoNo">NO</label>
        </div>
      </div>
      <div className="col-md-4">
        <label className="form-label d-block">Facturar con Cartera Vencida</label>
        <div className="form-check form-check-inline">
          <input 
            className="form-check-input" 
            type="radio" 
            name="facturarCarteraVencida" 
            id="carteraSi" 
            value="true"
            checked={clienteData.facturar_cartera_vencida === true}
            onChange={(e) => handleChange('facturar_cartera_vencida', true)}
          />
          <label className="form-check-label" htmlFor="carteraSi">SI</label>
        </div>
        <div className="form-check form-check-inline">
          <input 
            className="form-check-input" 
            type="radio" 
            name="facturarCarteraVencida" 
            id="carteraNo" 
            value="false"
            checked={clienteData.facturar_cartera_vencida === false}
            onChange={(e) => handleChange('facturar_cartera_vencida', false)}
          />
          <label className="form-check-label" htmlFor="carteraNo">NO</label>
        </div>
      </div>
      <div className="col-md-4">
        <label className="form-label d-block">Permitir Cupo de Endeudamiento</label>
        <div className="form-check form-check-inline">
          <input 
            className="form-check-input" 
            type="radio" 
            name="permiteCupo" 
            id="cupoSi" 
            value="true"
            checked={clienteData.permite_cupo === true}
            onChange={(e) => handleChange('permite_cupo', true)}
          />
          <label className="form-check-label" htmlFor="cupoSi">SI</label>
        </div>
        <div className="form-check form-check-inline">
          <input 
            className="form-check-input" 
            type="radio" 
            name="permiteCupo" 
            id="cupoNo" 
            value="false"
            checked={clienteData.permite_cupo === false}
            onChange={(e) => handleChange('permite_cupo', false)}
          />
          <label className="form-check-label" htmlFor="cupoNo">NO</label>
        </div>
      </div>
      <div className="col-md-6">
        <label className="form-label">Cupo de Endeudamiento / Cartera</label>
        <input 
          type="number" 
          className="form-control"
          value={clienteData.cupo_endeudamiento}
          onChange={(e) => handleChange('cupo_endeudamiento', parseFloat(e.target.value) || 0)}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Días Vencimiento Cartera</label>
        <input 
          type="number" 
          className="form-control"
          value={clienteData.dias_vencimiento_cartera}
          onChange={(e) => handleChange('dias_vencimiento_cartera', parseInt(e.target.value) || 30)}
        />
      </div>
    </div>
  );
};

export default Saldos;