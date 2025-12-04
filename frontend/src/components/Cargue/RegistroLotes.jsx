import React, { useState, useEffect } from 'react';
import { cargueRealtimeService } from '../../services/cargueRealtimeService'; // 🆕 Sincronización tiempo real
import './RegistroLotes.css';

const RegistroLotes = ({ dia, idSheet, fechaSeleccionada, estadoCompletado = false }) => {
    const [loteInput, setLoteInput] = useState('');
    const [lotes, setLotes] = useState([]);
    const [loading, setLoading] = useState(false);

    // Cargar lotes al montar el componente
    useEffect(() => {
        if (dia && idSheet && fechaSeleccionada) {
            cargarLotes();
        }
    }, [dia, idSheet, fechaSeleccionada, estadoCompletado]);

    const cargarLotes = async () => {
        try {
            // Convertir fecha a formato YYYY-MM-DD para la API y localStorage
            let fechaParaBD;
            if (fechaSeleccionada instanceof Date) {
                const year = fechaSeleccionada.getFullYear();
                const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
                const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
                fechaParaBD = `${year}-${month}-${day}`;
            } else {
                fechaParaBD = fechaSeleccionada;
            }

            const keyLocal = `lotes_${dia}_${idSheet}_${fechaParaBD}`;

            // Si está COMPLETADO, cargar desde BD
            if (estadoCompletado) {
                console.log(`🔍 LOTES - Día COMPLETADO, cargando desde BD: ${dia} - ${idSheet} - ${fechaParaBD}`);

                const endpoint = idSheet === 'ID1' ? 'cargue-id1' :
                    idSheet === 'ID2' ? 'cargue-id2' :
                        idSheet === 'ID3' ? 'cargue-id3' :
                            idSheet === 'ID4' ? 'cargue-id4' :
                                idSheet === 'ID5' ? 'cargue-id5' : 'cargue-id6';

                const url = `http://localhost:8000/api/${endpoint}/?dia=${dia.toUpperCase()}&fecha=${fechaParaBD}`;
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

                                        setLotes(lotesDB);
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
                setLotes([]);
                return;
            }

            // Cargar desde localStorage para días no completados
            const datosLocal = localStorage.getItem(keyLocal);
            if (datosLocal) {
                try {
                    const lotesLocal = JSON.parse(datosLocal);

                    setLotes(Array.isArray(lotesLocal) ? lotesLocal : []);
                } catch (error) {
                    console.error('❌ Error parsing localStorage:', error);
                    setLotes([]);
                }
            } else {
                setLotes([]);
            }
        } catch (error) {
            console.error('❌ Error cargando lotes:', error);
            setLotes([]);
        }
    };

    const guardarLotes = (nuevosLotes) => {
        // Convertir fecha a formato YYYY-MM-DD para consistencia
        let fechaParaBD;
        if (fechaSeleccionada instanceof Date) {
            const year = fechaSeleccionada.getFullYear();
            const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
            const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
            fechaParaBD = `${year}-${month}-${day}`;
        } else {
            fechaParaBD = fechaSeleccionada;
        }

        const keyLocal = `lotes_${dia}_${idSheet}_${fechaParaBD}`;
        localStorage.setItem(keyLocal, JSON.stringify(nuevosLotes));


        console.log(`🔄 LOTES - Sincronizando con BD: ${idSheet} | ${dia} | ${fechaParaBD}`);

        cargueRealtimeService.actualizarCampoGlobal(
            idSheet,
            dia,
            fechaParaBD,
            'lotes_produccion',
            JSON.stringify(nuevosLotes),
            'Sistema'
        ).then(result => {
            if (result.success) {
                console.log(`✅ LOTES sincronizados con BD (${result.action})`);
            } else {
                console.error(`❌ Error sincronizando lotes:`, result.error);
            }
        }).catch(err => {
            console.error(`❌ Error en sincronización lotes:`, err);
        });
    };

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
