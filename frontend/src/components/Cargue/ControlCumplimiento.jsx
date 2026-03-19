import React, { useState, useEffect, useMemo, useRef } from 'react';
import { cargueRealtimeService } from '../../services/cargueRealtimeService'; // 🆕 Sincronización tiempo real
import './ControlCumplimiento.css';

const ControlCumplimiento = ({ dia, idSheet, fechaSeleccionada, estadoCompletado = false }) => {
  const [cumplimiento, setCumplimiento] = useState({});
  const [loading, setLoading] = useState(false);
  const [cargaInicial, setCargaInicial] = useState(true);
  const pendingSyncInProgressRef = useRef(false);

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

  const fechaFormateadaLS = useMemo(() => {
    if (fechaSeleccionada instanceof Date) {
      return fechaSeleccionada.toISOString().split('T')[0];
    }
    return fechaSeleccionada || '';
  }, [fechaSeleccionada]);

  const cumplimientoStorageKey = useMemo(
    () => `cumplimiento_${dia}_${idSheet}_${fechaFormateadaLS}`,
    [dia, idSheet, fechaFormateadaLS]
  );

  const pendingCumplimientoStorageKey = useMemo(
    () => `cumplimiento_pending_${dia}_${idSheet}_${fechaFormateadaLS}`,
    [dia, idSheet, fechaFormateadaLS]
  );

  const readPendingFieldChanges = () => {
    try {
      const raw = localStorage.getItem(pendingCumplimientoStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error('❌ Error leyendo cumplimiento pendiente:', error);
      return {};
    }
  };

  const writePendingFieldChanges = (pendingChanges) => {
    const entries = Object.entries(pendingChanges || {}).filter(([, value]) => value && typeof value === 'object');
    if (entries.length === 0) {
      localStorage.removeItem(pendingCumplimientoStorageKey);
      return;
    }

    localStorage.setItem(
      pendingCumplimientoStorageKey,
      JSON.stringify(Object.fromEntries(entries))
    );
  };

  const markPendingFieldChange = (campo, valor) => {
    if (!campo) return;

    const pendingChanges = readPendingFieldChanges();
    pendingChanges[campo] = {
      value: valor || null,
      updatedAt: Date.now()
    };

    writePendingFieldChanges(pendingChanges);
  };

  const clearPendingFieldChange = (campo, expectedValue = undefined) => {
    if (!campo) return;

    const pendingChanges = readPendingFieldChanges();
    const pendingCampo = pendingChanges[campo];

    if (!pendingCampo) return;
    if (expectedValue !== undefined && pendingCampo.value !== expectedValue) return;

    delete pendingChanges[campo];
    writePendingFieldChanges(pendingChanges);
  };

  const applyPendingFieldChanges = (baseCumplimiento = {}) => {
    const pendingChanges = readPendingFieldChanges();
    if (Object.keys(pendingChanges).length === 0) {
      return baseCumplimiento;
    }

    const cumplimientoProtegido = { ...baseCumplimiento };
    Object.entries(pendingChanges).forEach(([campo, meta]) => {
      cumplimientoProtegido[campo] = meta?.value ?? null;
    });

    return cumplimientoProtegido;
  };

  const sincronizarCampoCumplimiento = async (campo, valor) => {
    const result = await cargueRealtimeService.actualizarCampoGlobal(
      idSheet,
      dia,
      fechaFormateadaLS,
      campo,
      valor || null,
      'Sistema'
    );

    if (result.success && result.action !== 'pending_sync') {
      clearPendingFieldChange(campo, valor || null);
      console.log(`✅ Cumplimiento sincronizado: ${campo} = ${valor} (${result.action})`);
    } else if (result.success) {
      console.log(`⏳ Cumplimiento pendiente de producto base: ${campo}`);
    } else {
      console.error(`❌ Error sincronizando cumplimiento:`, result.error);
    }

    return result;
  };

  // 🚀 MEJORADO: Cargar datos según el estado (COMPLETADO = BD, otros = localStorage)
  const cargarDatos = async () => {
    try {
      const fechaParaBD = fechaFormateadaLS;

      // 🚀 NUEVO: Si está COMPLETADO, cargar SIEMPRE desde BD
      if (estadoCompletado) {
        console.log(`🔍 CUMPLIMIENTO - Día COMPLETADO, cargando desde BD: ${dia} - ${idSheet} - ${fechaParaBD}`);
        // 🚀 CORREGIDO: Usar el mismo endpoint que los productos
        const endpoint = idSheet === 'ID1' ? 'cargue-id1' :
          idSheet === 'ID2' ? 'cargue-id2' :
            idSheet === 'ID3' ? 'cargue-id3' :
              idSheet === 'ID4' ? 'cargue-id4' :
                idSheet === 'ID5' ? 'cargue-id5' : 'cargue-id6';

        const url = `/api/${endpoint}/?dia=${dia.toUpperCase()}&fecha=${fechaParaBD}`;
        console.log(`🔍 CUMPLIMIENTO - URL: ${url}`);
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();


          // 🚀 CORREGIDO: Los datos vienen como array directo, no con results
          if (Array.isArray(data) && data.length > 0) {
            // 🔍 Buscar el primer registro que tenga datos de cumplimiento
            let registro = data.find(r =>
              r.licencia_transporte || r.soat || r.uniforme ||
              r.no_locion || r.no_accesorios || r.capacitacion_carnet ||
              r.higiene || r.estibas || r.desinfeccion
            );

            // Si no hay ninguno con datos, tomar el primero
            if (!registro) {
              registro = data[0];
            }



            const cumplimientoData = {};

            items.forEach(item => {
              const valor = registro[item.key];
              console.log(`🔍 CUMPLIMIENTO - ${item.key}: "${valor}"`);

              if (valor && valor !== null && valor !== '') {
                cumplimientoData[item.key] = valor;
              }
            });


            setCumplimiento(applyPendingFieldChanges(cumplimientoData));
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
      const datosLocal = localStorage.getItem(cumplimientoStorageKey);
      if (datosLocal) {
        try {
          const cumplimientoLocal = JSON.parse(datosLocal);

          setCumplimiento(applyPendingFieldChanges(cumplimientoLocal));
          setCargaInicial(false);
          return; // Si hay datos locales, usarlos
        } catch (error) {
          console.error('Error parsing localStorage:', error);
        }
      }

      // 🆕 NUEVO: Si no hay datos en localStorage, intentar cargar desde CargueIDx
      console.log(`🔍 CUMPLIMIENTO - No hay localStorage, cargando desde BD CargueIDx: ${dia} - ${idSheet} - ${fechaParaBD}`);

      const endpoint = idSheet === 'ID1' ? 'cargue-id1' :
        idSheet === 'ID2' ? 'cargue-id2' :
          idSheet === 'ID3' ? 'cargue-id3' :
            idSheet === 'ID4' ? 'cargue-id4' :
              idSheet === 'ID5' ? 'cargue-id5' : 'cargue-id6';

      const url = `/api/${endpoint}/?dia=${dia.toUpperCase()}&fecha=${fechaParaBD}`;
      console.log(`🔍 CUMPLIMIENTO - URL: ${url}`);
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ CUMPLIMIENTO - Datos desde BD:`, data.length, 'registros');

        if (Array.isArray(data) && data.length > 0) {
          // Buscar el primer registro que tenga datos de cumplimiento
          let registro = data.find(r =>
            r.licencia_transporte || r.soat || r.uniforme ||
            r.no_locion || r.no_accesorios || r.capacitacion_carnet ||
            r.higiene || r.estibas || r.desinfeccion
          );

          // Si no hay ninguno con datos, tomar el primero
          if (!registro) {
            registro = data[0];
          }

          const cumplimientoData = {};

          items.forEach(item => {
            const valor = registro[item.key];
            if (valor && valor !== null && valor !== '') {
              cumplimientoData[item.key] = valor;
              console.log(`✅ CUMPLIMIENTO - ${item.key}: "${valor}"`);
            }
          });

          if (Object.keys(cumplimientoData).length > 0) {
            const cumplimientoProtegido = applyPendingFieldChanges(cumplimientoData);
            setCumplimiento(cumplimientoProtegido);
            // Guardar en localStorage para próxima vez
            localStorage.setItem(cumplimientoStorageKey, JSON.stringify(cumplimientoProtegido));
            console.log(`💾 CUMPLIMIENTO - Datos de BD guardados en localStorage`);
          } else {
            setCumplimiento(applyPendingFieldChanges({}));
          }
        } else {
          setCumplimiento(applyPendingFieldChanges({}));
        }
      } else {
        console.log('❌ CUMPLIMIENTO - Error en response:', response.status);
        setCumplimiento(applyPendingFieldChanges({}));
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
      // Solo guardar en localStorage - el BotonLimpiar se encargará de enviar todo junto
      localStorage.setItem(cumplimientoStorageKey, JSON.stringify(nuevosCumplimientos));

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
  }, [cumplimiento, cargaInicial, cumplimientoStorageKey]);

  useEffect(() => {
    if (!fechaFormateadaLS || typeof window === 'undefined') return undefined;

    const flushPendingFieldChanges = async () => {
      if (pendingSyncInProgressRef.current) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      const pendingChanges = readPendingFieldChanges();
      const entries = Object.entries(pendingChanges);
      if (entries.length === 0) return;

      pendingSyncInProgressRef.current = true;

      try {
        for (const [campo, meta] of entries) {
          await sincronizarCampoCumplimiento(campo, meta?.value ?? null);
        }
      } catch (error) {
        console.error('❌ Error reintentando cumplimiento pendiente:', error);
      } finally {
        pendingSyncInProgressRef.current = false;
      }
    };

    const handleOnline = () => {
      console.log(`🌐 ${idSheet} - Reintentando cumplimiento pendiente...`);
      flushPendingFieldChanges();
    };

    const intervalId = window.setInterval(flushPendingFieldChanges, 10000);
    window.addEventListener('online', handleOnline);
    flushPendingFieldChanges();

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
    };
  }, [dia, idSheet, fechaFormateadaLS, pendingCumplimientoStorageKey]);

  const handleSeleccion = (itemKey, valor) => {
    const nuevosCumplimientos = {
      ...cumplimiento,
      [itemKey]: valor || null
    };

    setCumplimiento(nuevosCumplimientos);

    // Guardar inmediatamente en localStorage
    localStorage.setItem(cumplimientoStorageKey, JSON.stringify(nuevosCumplimientos));
    markPendingFieldChange(itemKey, valor || null);

    sincronizarCampoCumplimiento(itemKey, valor || null).catch(err => {
      console.error(`❌ Error en sincronización cumplimiento:`, err);
    });
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
