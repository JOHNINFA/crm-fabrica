import React, { useState, useEffect } from 'react';
import './ControlCumplimiento.css';

const ControlCumplimiento = ({ dia, idSheet, fechaSeleccionada }) => {
  const [cumplimiento, setCumplimiento] = useState({});
  const [loading, setLoading] = useState(false);
  const [cargaInicial, setCargaInicial] = useState(true);

  const items = [
    { key: 'licencia_transporte', label: 'Licencia de transporte' },
    { key: 'soat', label: 'SOAT' },
    { key: 'uniforme', label: 'Uniforme' },
    { key: 'no_locion', label: 'No loción' },
    { key: 'no_accesorios', label: 'No accesorios' },
    { key: 'capacitacion_carnet', label: 'Capacitación/Carnet' },
    { key: 'higiene', label: 'Higiene' },
    { key: 'estibas', label: 'Estibas' },
    { key: 'desinfeccion', label: 'Desinfección' }
  ];

  // Cargar datos desde localStorage primero, luego PostgreSQL
  const cargarDatos = async () => {
    try {
      const fechaAUsar = fechaSeleccionada || new Date().toISOString().split('T')[0];
      const keyLocal = `cumplimiento_${dia}_${idSheet}_${fechaAUsar}`;
      
      // 1. Intentar cargar desde localStorage primero
      const datosLocal = localStorage.getItem(keyLocal);
      if (datosLocal) {
        try {
          const cumplimientoLocal = JSON.parse(datosLocal);
          console.log('✅ Datos cargados desde localStorage:', cumplimientoLocal);
          setCumplimiento(cumplimientoLocal);
          setCargaInicial(false);
          return; // Si hay datos locales, usarlos
        } catch (error) {
          console.error('Error parsing localStorage:', error);
        }
      }
      
      // 2. Si no hay datos locales, cargar desde PostgreSQL
      console.log(`🔍 Cargando desde PostgreSQL: ${dia} - ${idSheet} - ${fechaAUsar}`);
      const url = `http://localhost:8000/api/control-cumplimiento/?dia=${dia.toUpperCase()}&id_sheet=${idSheet}&fecha=${fechaAUsar}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const registro = data.results[0];
          const cumplimientoData = {};
          
          items.forEach(item => {
            if (registro[item.key] && registro[item.key] !== null) {
              cumplimientoData[item.key] = registro[item.key];
            }
          });
          
          setCumplimiento(cumplimientoData);
          // Guardar en localStorage para próxima vez
          localStorage.setItem(keyLocal, JSON.stringify(cumplimientoData));
        } else {
          setCumplimiento({});
        }
      }
      setCargaInicial(false);
    } catch (error) {
      console.error('❌ Error cargando cumplimiento:', error);
      setCargaInicial(false);
    }
  };

  // Guardar datos en PostgreSQL
  const guardarDatos = async (nuevosCumplimientos) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const fechaAUsar = fechaSeleccionada || new Date().toISOString().split('T')[0];
      
      // Siempre intentar obtener el registro existente primero
      const responseGet = await fetch(`http://localhost:8000/api/control-cumplimiento/?dia=${dia.toUpperCase()}&id_sheet=${idSheet}&fecha=${fechaAUsar}`);
      
      if (responseGet.ok) {
        const existingData = await responseGet.json();
        
        if (existingData.results && existingData.results.length > 0) {
          // Actualizar registro existente
          const registroId = existingData.results[0].id;
          const response = await fetch(`http://localhost:8000/api/control-cumplimiento/${registroId}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(nuevosCumplimientos)
          });
          
          if (response.ok) {
            console.log('✅ Cumplimiento actualizado');
          } else {
            console.error('❌ Error actualizando:', await response.text());
          }
        } else {
          // Crear nuevo registro solo si no existe
          const datosCompletos = {
            dia: dia.toUpperCase(),
            id_sheet: idSheet,
            fecha: fechaAUsar,
            usuario: 'Sistema',
            ...nuevosCumplimientos
          };
          
          const response = await fetch('http://localhost:8000/api/control-cumplimiento/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosCompletos)
          });
          
          if (response.ok) {
            console.log('✅ Cumplimiento creado');
          } else {
            console.error('❌ Error creando:', await response.text());
          }
        }
      }
    } catch (error) {
      console.error('❌ Error guardando cumplimiento:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (dia && idSheet) {
      cargarDatos();
    }
  }, [dia, idSheet, fechaSeleccionada]);

  // Guardar datos cuando cambie el cumplimiento (solo si no es la carga inicial)
  useEffect(() => {
    if (Object.keys(cumplimiento).length > 0 && !cargaInicial) {
      guardarDatos(cumplimiento);
    }
  }, [cumplimiento, cargaInicial]);

  const handleSeleccion = (itemKey, valor) => {
    const nuevosCumplimientos = {
      ...cumplimiento,
      [itemKey]: valor || null
    };
    
    setCumplimiento(nuevosCumplimientos);
    
    // Guardar inmediatamente en localStorage
    const fechaAUsar = fechaSeleccionada || new Date().toISOString().split('T')[0];
    const keyLocal = `cumplimiento_${dia}_${idSheet}_${fechaAUsar}`;
    localStorage.setItem(keyLocal, JSON.stringify(nuevosCumplimientos));
  };

  return (
    <div className="control-cumplimiento">
      <h6 className="cumplimiento-title">CONTROL DE CUMPLIMIENTO</h6>
      <div className="cumplimiento-tabla">
        <div className="cumplimiento-header">
          <div className="cumplimiento-header-manipulador">MANIPULADOR</div>
        </div>
        {items.slice(0, 6).map((item, index) => (
          <div key={index} className="cumplimiento-fila">
            <div className="cumplimiento-item">{item.label}</div>
            <div className="cumplimiento-selector">
              {cumplimiento[item.key] ? (
                <div 
                  className="cumplimiento-resultado"
                  onClick={() => handleSeleccion(item.key, '')}
                >
                  {cumplimiento[item.key]}
                </div>
              ) : (
                <select
                  value={''}
                  onChange={(e) => handleSeleccion(item.key, e.target.value)}
                  className="cumplimiento-dropdown"
                  disabled={loading}
                >
                  <option value="">▼</option>
                  <option value="C">C</option>
                  <option value="NC">NC</option>
                </select>
              )}
            </div>
          </div>
        ))}
        <div className="cumplimiento-header">
          <div className="cumplimiento-header-manipulador">FURGÓN</div>
        </div>
        {items.slice(6).map((item, index) => (
          <div key={index + 6} className="cumplimiento-fila">
            <div className="cumplimiento-item">{item.label}</div>
            <div className="cumplimiento-selector">
              {cumplimiento[item.key] ? (
                <div 
                  className="cumplimiento-resultado"
                  onClick={() => handleSeleccion(item.key, '')}
                >
                  {cumplimiento[item.key]}
                </div>
              ) : (
                <select
                  value={''}
                  onChange={(e) => handleSeleccion(item.key, e.target.value)}
                  className="cumplimiento-dropdown"
                  disabled={loading}
                >
                  <option value="">▼</option>
                  <option value="C">C</option>
                  <option value="NC">NC</option>
                </select>
              )}
            </div>
          </div>
        ))}
        <div className="cumplimiento-leyenda">
          <div className="cumplimiento-leyenda-texto">CUMPLE : C&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NO CUMPLE : NC</div>
        </div>
      </div>
      {loading && (
        <div className="cumplimiento-loading">
          <small className="text-muted">💾 Guardando...</small>
        </div>
      )}
    </div>
  );
};

export default ControlCumplimiento;