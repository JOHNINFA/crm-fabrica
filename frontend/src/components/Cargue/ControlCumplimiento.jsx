import React, { useState, useEffect } from 'react';
import './ControlCumplimiento.css';

const ControlCumplimiento = ({ dia, idSheet, fechaSeleccionada, estadoCompletado = false }) => {
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

  // 🚀 MEJORADO: Cargar datos según el estado (COMPLETADO = BD, otros = localStorage)
  const cargarDatos = async () => {
    try {
      const fechaAUsar = fechaSeleccionada;
      const keyLocal = `cumplimiento_${dia}_${idSheet}_${fechaAUsar}`;

      // 🚀 NUEVO: Si está COMPLETADO, cargar SIEMPRE desde BD
      if (estadoCompletado) {
        console.log(`🔍 CUMPLIMIENTO - Día COMPLETADO, cargando desde BD: ${dia} - ${idSheet} - ${fechaAUsar}`);
        // 🚀 CORREGIDO: Usar el mismo endpoint que los productos
        const endpoint = idSheet === 'ID1' ? 'cargue-id1' :
          idSheet === 'ID2' ? 'cargue-id2' :
            idSheet === 'ID3' ? 'cargue-id3' :
              idSheet === 'ID4' ? 'cargue-id4' :
                idSheet === 'ID5' ? 'cargue-id5' : 'cargue-id6';

        const url = `http://localhost:8000/api/${endpoint}/?dia=${dia.toUpperCase()}&fecha=${fechaAUsar}`;
        console.log(`🔍 CUMPLIMIENTO - URL: ${url}`);
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          console.log('🔍 CUMPLIMIENTO - Respuesta completa de BD:', data);

          // 🚀 CORREGIDO: Los datos vienen como array directo, no con results
          if (Array.isArray(data) && data.length > 0) {
            const registro = data[0]; // Tomar el primer registro
            console.log('🔍 CUMPLIMIENTO - Primer registro:', registro);

            const cumplimientoData = {};

            items.forEach(item => {
              const valor = registro[item.key];
              console.log(`🔍 CUMPLIMIENTO - ${item.key}: "${valor}"`);

              if (valor && valor !== null && valor !== '') {
                cumplimientoData[item.key] = valor;
              }
            });

            console.log('✅ CUMPLIMIENTO - Datos procesados:', cumplimientoData);
            setCumplimiento(cumplimientoData);
            setCargaInicial(false);
            return;
          } else {
            console.log('⚠️ CUMPLIMIENTO - No hay datos en el array');
          }
        } else {
          console.log('❌ CUMPLIMIENTO - Error en response:', response.status, response.statusText);
        }

        console.log('⚠️ CUMPLIMIENTO - No se encontraron datos en BD');
        setCumplimiento({});
        setCargaInicial(false);
        return;
      }

      // Lógica original para días no completados
      // 1. Intentar cargar desde localStorage primero
      const datosLocal = localStorage.getItem(keyLocal);
      if (datosLocal) {
        try {
          const cumplimientoLocal = JSON.parse(datosLocal);
          console.log('✅ CUMPLIMIENTO - Datos cargados desde localStorage:', cumplimientoLocal);
          setCumplimiento(cumplimientoLocal);
          setCargaInicial(false);
          return; // Si hay datos locales, usarlos
        } catch (error) {
          console.error('Error parsing localStorage:', error);
        }
      }

      // 2. Si no hay datos locales, cargar desde PostgreSQL
      console.log(`🔍 CUMPLIMIENTO - Cargando desde PostgreSQL: ${dia} - ${idSheet} - ${fechaAUsar}`);
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

  // ✅ CORREGIDO: Solo guardar en localStorage - se enviará junto con el cargue principal
  const guardarDatos = async (nuevosCumplimientos) => {
    if (loading) return;

    setLoading(true);
    try {
      const fechaAUsar = fechaSeleccionada;
      const keyLocal = `cumplimiento_${dia}_${idSheet}_${fechaAUsar}`;

      // Solo guardar en localStorage - el BotonLimpiar se encargará de enviar todo junto
      localStorage.setItem(keyLocal, JSON.stringify(nuevosCumplimientos));
      console.log('✅ Cumplimiento guardado en localStorage para envío posterior');

    } catch (error) {
      console.error('❌ Error guardando cumplimiento:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente o cuando cambie el estado
  useEffect(() => {
    if (dia && idSheet && fechaSeleccionada) {
      cargarDatos();
    }
  }, [dia, idSheet, fechaSeleccionada, estadoCompletado]);

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
    const fechaAUsar = fechaSeleccionada;
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