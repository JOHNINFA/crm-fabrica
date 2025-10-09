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
      const response = await fetch('http://localhost:8000/api/lista-precios/?activo=true');
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
      const response = await fetch('http://localhost:8000/api/vendedores/obtener_responsable/');
      if (response.ok) {
        const data = await response.json();
        console.log('Vendedores cargados:', data);
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
            <option key={vendedor.id} value={vendedor.responsable}>{vendedor.responsable} ({vendedor.id})</option>
          ))}
        </select>
      </div>
      <div className="col-md-3">
        <label className="form-label">Día de Entrega</label>
        <select 
          className="form-select"
          value={clienteData.dia_entrega || ''}
          onChange={(e) => handleChange('dia_entrega', e.target.value)}
        >
          <option value="">Sin día</option>
          <option value="LUNES">Lunes</option>
          <option value="MARTES">Martes</option>
          <option value="MIERCOLES">Miércoles</option>
          <option value="JUEVES">Jueves</option>
          <option value="VIERNES">Viernes</option>
          <option value="SABADO">Sábado</option>
        </select>
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