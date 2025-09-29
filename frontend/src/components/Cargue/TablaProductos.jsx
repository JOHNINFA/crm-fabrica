import React, { useState, useEffect } from 'react';
import { Table } from 'react-bootstrap';
import LotesVencidos from './LotesVencidos';

const TablaProductos = ({ productos, onActualizarProducto, dia, fechaSeleccionada }) => {
  const [estadoBoton, setEstadoBoton] = useState('ALISTAMIENTO');
  const [esCompletado, setEsCompletado] = useState(false);

  // Actualizar estado del botón en tiempo real
  useEffect(() => {
    const actualizarEstado = () => {
      const estado = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`) || 'ALISTAMIENTO';
      setEstadoBoton(estado);
      setEsCompletado(estado === 'COMPLETADO');
    };

    actualizarEstado();
    const interval = setInterval(actualizarEstado, 500); // Verificar cada 500ms
    return () => clearInterval(interval);
  }, [dia, fechaSeleccionada]);
  const [editingValor, setEditingValor] = useState(null);

  const handleInputChange = (id, campo, valor) => {
    // 🔒 No permitir cambios si está COMPLETADO
    if (esCompletado) {
      console.log(`🔒 Cambio bloqueado - Jornada COMPLETADA`);
      return;
    }

    onActualizarProducto(id, campo, valor);
  };

  const handleCheckboxChange = (id, campo, checked) => {
    // 🔒 No permitir cambios si está COMPLETADO
    if (esCompletado) {
      console.log(`🔒 Checkbox bloqueado - Jornada COMPLETADA`);
      return;
    }

    // Solo permitir marcar si el producto tiene total > 0
    const producto = productos.find(p => p.id === id);
    if (checked && producto && producto.total <= 0) {
      return; // No hacer nada si intenta marcar sin cantidad
    }

    // Controlar casilla D según estado del botón
    if (campo === 'despachador' && estadoBoton === 'ALISTAMIENTO') {
      return; // No permitir marcar D en estado ALISTAMIENTO
    }

    console.log(`Checkbox ${campo} para producto ${id}: ${checked}`);
    onActualizarProducto(id, campo, checked);
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  const handleDoubleClickValor = (id) => {
    setEditingValor(id);
  };

  const handleBlurValor = () => {
    setEditingValor(null);
  };

  const handleKeyDownValor = (e) => {
    if (e.key === 'Enter') {
      setEditingValor(null);
    }
  };

  return (
    <div>
      {/* 🎉 Indicador de estado COMPLETADO */}
      {esCompletado && (
        <div className="alert alert-success mb-2" role="alert">
          <strong>🎉 JORNADA COMPLETADA</strong> - Los datos se muestran en modo solo lectura
        </div>
      )}

      <Table bordered hover className="tabla-productos">
        <thead className="table-header">
          <tr>
            <th>V</th>
            <th>D</th>
            <th>PRODUCTOS</th>
            <th>CANTIDAD</th>
            <th>DCTOS.</th>
            <th>ADICIONAL</th>
            <th>DEVOLUCIONES</th>
            <th>VENCIDAS</th>
            <th colSpan="2" style={{ width: '120px', minWidth: '120px' }}>LOTES VENCIDOS</th>
            <th>TOTAL</th>
            <th>VALOR</th>
            <th>NETO</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p, index) => (
            <tr key={`${p.id}-${p.producto}`} className="table-row">
              <td>
                <input
                  type="checkbox"
                  checked={!!p.vendedor}
                  onChange={(e) => handleCheckboxChange(p.id, 'vendedor', e.target.checked)}
                  disabled={esCompletado}
                  style={{
                    accentColor: '#06386d',
                    opacity: esCompletado ? 0.4 : 1,
                    cursor: esCompletado ? 'not-allowed' : 'pointer'
                  }}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={!!p.despachador}
                  onChange={(e) => handleCheckboxChange(p.id, 'despachador', e.target.checked)}
                  disabled={esCompletado || estadoBoton === 'ALISTAMIENTO'}
                  style={{
                    accentColor: '#06386d',
                    opacity: (esCompletado || estadoBoton === 'ALISTAMIENTO') ? 0.4 : 1,
                    cursor: (esCompletado || estadoBoton === 'ALISTAMIENTO') ? 'not-allowed' : 'pointer'
                  }}
                />
              </td>
              <td className="producto-nombre">{p.producto}</td>
              <td>
                <input
                  type="number"
                  value={p.cantidad || 0}
                  onChange={(e) => handleInputChange(p.id, 'cantidad', e.target.value)}
                  onFocus={handleFocus}
                  className="form-control form-control-sm text-center"
                  min="0"
                  disabled={esCompletado}
                  style={esCompletado ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={p.dctos || 0}
                  onChange={(e) => handleInputChange(p.id, 'dctos', e.target.value)}
                  onFocus={handleFocus}
                  className="form-control form-control-sm text-center"
                  min="0"
                  disabled={esCompletado}
                  style={esCompletado ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={p.adicional || 0}
                  onChange={(e) => handleInputChange(p.id, 'adicional', e.target.value)}
                  onFocus={handleFocus}
                  className="form-control form-control-sm text-center"
                  min="0"
                  disabled={esCompletado}
                  style={esCompletado ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={p.devoluciones || 0}
                  onChange={(e) => handleInputChange(p.id, 'devoluciones', e.target.value)}
                  onFocus={handleFocus}
                  className="form-control form-control-sm text-center"
                  min="0"
                  disabled={esCompletado}
                  style={esCompletado ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={p.vencidas || 0}
                  onChange={(e) => handleInputChange(p.id, 'vencidas', e.target.value)}
                  onFocus={handleFocus}
                  className="form-control form-control-sm text-center"
                  min="0"
                  disabled={esCompletado}
                  style={esCompletado ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
                />
              </td>
              <td colSpan="2" style={{ position: 'relative', width: '120px', padding: '4px' }}>
                <LotesVencidos
                  lotes={p.lotesVencidos || []}
                  onLotesChange={(lotes) => handleInputChange(p.id, 'lotesVencidos', lotes)}
                  disabled={esCompletado}
                />
              </td>
              <td className="text-center total-cell">{p.total || 0}</td>
              <td className="text-end valor-cell" onDoubleClick={() => handleDoubleClickValor(p.id)}>
                {editingValor === p.id ? (
                  <input
                    type="text"
                    value={p.valor ? `$${p.valor.toLocaleString()}` : ''}
                    onChange={(e) => {
                      const numValue = e.target.value.replace(/[^0-9]/g, '');
                      handleInputChange(p.id, 'valor', numValue ? parseInt(numValue) : 0);
                    }}
                    onBlur={handleBlurValor}
                    onKeyDown={handleKeyDownValor}
                    autoFocus
                    className="text-end"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      width: '100%',
                      textAlign: 'right',
                      color: '#cc0000',
                      fontWeight: 'bold'
                    }}
                  />
                ) : (
                  p.valor ? `$${p.valor.toLocaleString()}` : ''
                )}
              </td>
              <td className="text-end neto-cell">
                {p.neto ? `$${Math.round(p.neto).toLocaleString()}` : '$0'}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default TablaProductos;