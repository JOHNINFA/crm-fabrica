import React, { useState } from 'react';
import { Button } from 'react-bootstrap';

const LotesVencidos = ({ lotes = [], onLotesChange, disabled = false }) => {
  const [mostrarLotes, setMostrarLotes] = useState(false);

  // Agregar nuevo lote
  const agregarLote = () => {
    if (disabled) return; // 🔒 No permitir agregar si está deshabilitado
    const nuevosLotes = [...lotes, { lote: '', motivo: '' }];
    onLotesChange(nuevosLotes);
    setMostrarLotes(true);
  };

  // Eliminar lote
  const eliminarLote = (index) => {
    if (disabled) return; // 🔒 No permitir eliminar si está deshabilitado
    const nuevosLotes = lotes.filter((_, i) => i !== index);
    onLotesChange(nuevosLotes);
    if (nuevosLotes.length === 0) {
      setMostrarLotes(false);
    }
  };

  // Actualizar lote
  const actualizarLote = (index, campo, valor) => {
    if (disabled) return; // 🔒 No permitir actualizar si está deshabilitado
    const nuevosLotes = [...lotes];
    nuevosLotes[index] = { ...nuevosLotes[index], [campo]: valor };
    onLotesChange(nuevosLotes);
  };

  return (
    <div style={{ width: '100%', maxWidth: '110px' }}>
      {/* Botón para agregar primer lote o mostrar resumen */}
      {lotes.length === 0 ? (
        <Button
          variant="outline-primary"
          size="sm"
          onClick={agregarLote}
          disabled={disabled}
          style={{
            fontSize: '10px',
            padding: '1px 6px',
            width: '100%',
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
        >
          + Lote
        </Button>
      ) : (
        <div>
          {/* Resumen compacto */}
          <div
            style={{
              fontSize: '11px',
              cursor: disabled ? 'default' : 'pointer', // 🚀 CORREGIDO: Sin cursor pointer si está deshabilitado
              color: disabled ? '#6c757d' : '#06386d', // 🚀 CORREGIDO: Color gris si está deshabilitado
              fontWeight: 'bold',
              opacity: disabled ? 0.7 : 1
            }}
            onClick={disabled ? undefined : () => setMostrarLotes(!mostrarLotes)} // 🚀 CORREGIDO: Sin onClick si está deshabilitado
          >
            {/* 🔍 DEBUG: Mostrar información de lotes */}
            {console.log(`🔍 LotesVencidos - Cantidad de lotes:`, lotes.length, 'Lotes:', lotes)}
            {lotes.length} lote{lotes.length > 1 ? 's' : ''} {disabled ? '' : (mostrarLotes ? '▼' : '▶')}
          </div>

          {/* Lista expandible de lotes */}
          {mostrarLotes && (
            <div style={{
              position: 'absolute',
              zIndex: 1000,
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              minWidth: '200px'
            }}>
              {lotes.map((lote, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '4px',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    placeholder="Lote"
                    value={lote.lote}
                    onChange={(e) => actualizarLote(index, 'lote', e.target.value)}
                    disabled={disabled}
                    style={{
                      width: '80px',
                      fontSize: '11px',
                      padding: '2px 4px',
                      border: '1px solid #ccc',
                      borderRadius: '2px',
                      backgroundColor: disabled ? '#f8f9fa' : 'white',
                      cursor: disabled ? 'not-allowed' : 'text'
                    }}
                  />
                  <select
                    value={lote.motivo}
                    onChange={(e) => actualizarLote(index, 'motivo', e.target.value)}
                    disabled={disabled}
                    style={{
                      width: '80px',
                      fontSize: '11px',
                      padding: '2px',
                      border: '1px solid #ccc',
                      borderRadius: '2px',
                      backgroundColor: disabled ? '#f8f9fa' : 'white',
                      cursor: disabled ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">-</option>
                    <option value="HONGO">HONGO</option>
                    <option value="FVTO">FVTO</option>
                    <option value="SELLADO">SELLADO</option>
                  </select>
                  <button
                    onClick={() => eliminarLote(index)}
                    disabled={disabled}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: disabled ? '#6c757d' : '#dc3545',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      padding: '0 4px',
                      opacity: disabled ? 0.5 : 1
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                {!disabled && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={agregarLote}
                    style={{ fontSize: '10px', padding: '2px 6px' }}
                  >
                    + Otro
                  </Button>
                )}
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setMostrarLotes(false)}
                  style={{ fontSize: '10px', padding: '2px 6px' }}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LotesVencidos;