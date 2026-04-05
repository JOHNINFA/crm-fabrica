import React, { useState, useEffect, useMemo, useRef } from 'react';
import { cargueRealtimeService } from '../../services/cargueRealtimeService'; // 🆕 Sincronización tiempo real
import './RegistroLotes.css';

// 🔧 API URL configurable para desarrollo local y producción
const API_URL = process.env.REACT_APP_API_URL || '/api';

const RegistroLotes = ({ dia, idSheet, fechaSeleccionada, estadoCompletado = false }) => {
    const [loteInput, setLoteInput] = useState('');
    const [lotes, setLotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const pendingSyncInProgressRef = useRef(false);

    const fechaFormateadaLS = useMemo(() => {
        if (fechaSeleccionada instanceof Date) {
            const d = fechaSeleccionada;
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        return fechaSeleccionada || '';
    }, [fechaSeleccionada]);

    const lotesStorageKey = useMemo(
        () => `lotes_${dia}_${idSheet}_${fechaFormateadaLS}`,
        [dia, idSheet, fechaFormateadaLS]
    );

    const pendingLotesStorageKey = useMemo(
        () => `lotes_pending_${dia}_${idSheet}_${fechaFormateadaLS}`,
        [dia, idSheet, fechaFormateadaLS]
    );

    const readPendingLotes = () => {
        try {
            const raw = localStorage.getItem(pendingLotesStorageKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed?.lotes) ? parsed.lotes : null;
        } catch (error) {
            console.error('❌ Error leyendo lotes pendientes:', error);
            return null;
        }
    };

    const writePendingLotes = (nuevosLotes) => {
        if (!Array.isArray(nuevosLotes)) {
            localStorage.removeItem(pendingLotesStorageKey);
            return;
        }

        localStorage.setItem(
            pendingLotesStorageKey,
            JSON.stringify({
                lotes: nuevosLotes,
                updatedAt: Date.now()
            })
        );
    };

    const clearPendingLotes = (expectedLotes = undefined) => {
        const currentPending = readPendingLotes();
        if (!currentPending) return;

        if (expectedLotes !== undefined && JSON.stringify(currentPending) !== JSON.stringify(expectedLotes)) {
            return;
        }

        localStorage.removeItem(pendingLotesStorageKey);
    };

    const applyPendingLotes = (lotesBase = []) => {
        const pendingLotes = readPendingLotes();
        return pendingLotes || lotesBase;
    };

    const sincronizarLotes = async (nuevosLotes) => {
        const result = await cargueRealtimeService.actualizarCampoGlobal(
            idSheet,
            dia,
            fechaFormateadaLS,
            'lotes_produccion',
            JSON.stringify(nuevosLotes),
            'Sistema'
        );

        if (result.success && result.action !== 'pending_sync') {
            clearPendingLotes(nuevosLotes);
            console.log(`✅ LOTES sincronizados con BD (${result.action})`);
        } else if (result.success) {
            console.log('⏳ LOTES pendientes de producto base para sincronizarse');
        } else {
            console.error(`❌ Error sincronizando lotes:`, result.error);
        }

        return result;
    };

    // Cargar lotes al montar el componente
    useEffect(() => {
        if (dia && idSheet && fechaSeleccionada) {
            cargarLotes();
        }
    }, [dia, idSheet, fechaSeleccionada, estadoCompletado]);

    const cargarLotes = async () => {
        try {
            const fechaParaBD = fechaFormateadaLS;

            // Si está COMPLETADO, cargar desde BD
            if (estadoCompletado) {
                console.log(`🔍 LOTES - Día COMPLETADO, cargando desde BD: ${dia} - ${idSheet} - ${fechaParaBD}`);

                const endpoint = idSheet === 'ID1' ? 'cargue-id1' :
                    idSheet === 'ID2' ? 'cargue-id2' :
                        idSheet === 'ID3' ? 'cargue-id3' :
                            idSheet === 'ID4' ? 'cargue-id4' :
                                idSheet === 'ID5' ? 'cargue-id5' : 'cargue-id6';

                const url = `${API_URL}/${endpoint}/?dia=${dia.toUpperCase()}&fecha=${fechaParaBD}`;
                const response = await fetch(url);

                if (response.ok) {
                    const data = await response.json();

                    if (Array.isArray(data) && data.length > 0) {
                        // Buscar el campo de lotes en CUALQUIER registro (no solo el primero)
                        for (const registro of data) {
                            if (registro.lotes_produccion && registro.lotes_produccion !== '[]') {
                                try {
                                    const lotesDB = typeof registro.lotes_produccion === 'string'
                                        ? JSON.parse(registro.lotes_produccion)
                                        : registro.lotes_produccion;

                                    if (Array.isArray(lotesDB) && lotesDB.length > 0) {
                                        const lotesProtegidos = applyPendingLotes(lotesDB);
                                        setLotes(lotesProtegidos);
                                        return;
                                    }
                                } catch (error) {
                                    console.error('❌ Error parsing lotes desde BD:', error);
                                }
                            }
                        }
                    }
                }

                console.log('⚠️ LOTES - No se encontraron datos en BD');
                setLotes(applyPendingLotes([]));
                return;
            }

            // Cargar desde localStorage para días no completados
            const datosLocal = localStorage.getItem(lotesStorageKey);
            if (datosLocal) {
                try {
                    const lotesLocal = JSON.parse(datosLocal);

                    setLotes(applyPendingLotes(Array.isArray(lotesLocal) ? lotesLocal : []));
                } catch (error) {
                    console.error('❌ Error parsing localStorage:', error);
                    setLotes(applyPendingLotes([]));
                }
            } else {
                // 🆕 NUEVO: Si localStorage está vacío, intentar cargar desde BD
                console.log(`🔍 LOTES - No hay localStorage, intentando cargar desde BD...`);

                try {
                    const endpoint = idSheet === 'ID1' ? 'cargue-id1' :
                        idSheet === 'ID2' ? 'cargue-id2' :
                            idSheet === 'ID3' ? 'cargue-id3' :
                                idSheet === 'ID4' ? 'cargue-id4' :
                                    idSheet === 'ID5' ? 'cargue-id5' : 'cargue-id6';

                    const url = `${API_URL}/${endpoint}/?dia=${dia.toUpperCase()}&fecha=${fechaParaBD}`;
                    const response = await fetch(url);

                    if (response.ok) {
                        const data = await response.json();

                        if (Array.isArray(data) && data.length > 0) {
                            // Buscar el campo de lotes en CUALQUIER registro
                            for (const registro of data) {
                                if (registro.lotes_produccion && registro.lotes_produccion !== '[]') {
                                    try {
                                        const lotesDB = typeof registro.lotes_produccion === 'string'
                                            ? JSON.parse(registro.lotes_produccion)
                                            : registro.lotes_produccion;

                                        if (Array.isArray(lotesDB) && lotesDB.length > 0) {
                                            console.log(`✅ LOTES - Cargados desde BD:`, lotesDB);
                                            const lotesProtegidos = applyPendingLotes(lotesDB);
                                            setLotes(lotesProtegidos);
                                            // Guardar en localStorage para próximas cargas
                                            localStorage.setItem(lotesStorageKey, JSON.stringify(lotesProtegidos));
                                            return;
                                        }
                                    } catch (error) {
                                        console.error('❌ Error parsing lotes desde BD:', error);
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('❌ Error cargando lotes desde BD:', error);
                }

                setLotes(applyPendingLotes([]));
            }
        } catch (error) {
            console.error('❌ Error cargando lotes:', error);
            setLotes(applyPendingLotes([]));
        }
    };

    const guardarLotes = (nuevosLotes) => {
        localStorage.setItem(lotesStorageKey, JSON.stringify(nuevosLotes));
        writePendingLotes(nuevosLotes);

        console.log(`🔄 LOTES - Sincronizando con BD: ${idSheet} | ${dia} | ${fechaFormateadaLS}`);

        sincronizarLotes(nuevosLotes).catch(err => {
            console.error(`❌ Error en sincronización lotes:`, err);
        });
    };

    useEffect(() => {
        if (!fechaFormateadaLS || typeof window === 'undefined') return undefined;

        const flushPendingLotes = async () => {
            if (pendingSyncInProgressRef.current) return;
            if (typeof navigator !== 'undefined' && !navigator.onLine) return;

            const lotesPendientes = readPendingLotes();
            if (!lotesPendientes) return;

            pendingSyncInProgressRef.current = true;

            try {
                await sincronizarLotes(lotesPendientes);
            } catch (error) {
                console.error('❌ Error reintentando lotes pendientes:', error);
            } finally {
                pendingSyncInProgressRef.current = false;
            }
        };

        const handleOnline = () => {
            console.log(`🌐 ${idSheet} - Reintentando lotes pendientes...`);
            flushPendingLotes();
        };

        const intervalId = window.setInterval(flushPendingLotes, 10000);
        window.addEventListener('online', handleOnline);
        flushPendingLotes();

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('online', handleOnline);
        };
    }, [dia, idSheet, fechaFormateadaLS, pendingLotesStorageKey]);

    const agregarLote = () => {
        if (!loteInput.trim()) {
            alert('Por favor ingresa un número de lote');
            return;
        }

        // Verificar si el lote ya existe
        if (lotes.includes(loteInput.trim())) {
            alert('Este lote ya está registrado');
            return;
        }

        const nuevosLotes = [...lotes, loteInput.trim()];
        setLotes(nuevosLotes);
        guardarLotes(nuevosLotes);
        setLoteInput('');
    };

    const eliminarLote = (index) => {
        if (estadoCompletado) {

            return;
        }

        const nuevosLotes = lotes.filter((_, i) => i !== index);
        setLotes(nuevosLotes);
        guardarLotes(nuevosLotes);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            agregarLote();
        }
    };

    return (
        <div className="registro-lotes">
            <h6 className="lotes-title">REGISTRO DE LOTES</h6>

            {/* Input para agregar lote */}
            <div className="lotes-input-container">
                <input
                    type="text"
                    className="lotes-input"
                    placeholder="Número de lote"
                    value={loteInput}
                    onChange={(e) => setLoteInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={estadoCompletado}
                />
                <button
                    className="lotes-btn-agregar"
                    onClick={agregarLote}
                    disabled={estadoCompletado || !loteInput.trim()}
                >
                    +
                </button>
            </div>

            {/* Lista de lotes */}
            <div className="lotes-lista-container">
                <div className="lotes-lista-header">LOTES DEL DÍA:</div>
                <div className="lotes-lista">
                    {lotes.length > 0 ? (
                        lotes.map((lote, index) => (
                            <div key={index} className="lote-item">
                                <span className="lote-numero">• {lote}</span>
                                {!estadoCompletado && (
                                    <button
                                        className="lote-btn-eliminar"
                                        onClick={() => eliminarLote(index)}
                                        title="Eliminar lote"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="lotes-vacio">No hay lotes registrados</div>
                    )}
                </div>
            </div>

            {estadoCompletado && (
                <div className="lotes-completado-msg">
                    <small>🔒 Solo lectura</small>
                </div>
            )}
        </div>
    );
};

export default RegistroLotes;
