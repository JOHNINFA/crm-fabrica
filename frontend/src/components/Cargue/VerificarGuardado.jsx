import React, { useState } from 'react';
import { Button, Alert, Table } from 'react-bootstrap';

const VerificarGuardado = ({ dia, fechaSeleccionada }) => {
    const [loading, setLoading] = useState(false);
    const [resultados, setResultados] = useState(null);
    const [error, setError] = useState('');

    const verificarDatosGuardados = async () => {
        setLoading(true);
        setError('');
        setResultados(null);

        try {
            console.log('🔍 VERIFICANDO DATOS GUARDADOS...');

            const fechaAUsar = fechaSeleccionada || new Date().toISOString().split('T')[0];
            const { cargueService } = await import('../../services/cargueService');

            // Consultar cargues guardados para hoy
            const carguesHoy = await cargueService.getAll({ fecha: fechaAUsar });

            if (carguesHoy.error) {
                throw new Error(carguesHoy.message);
            }

            console.log('📊 Cargues encontrados:', carguesHoy);

            // Organizar resultados
            const resumen = {
                totalCargues: carguesHoy.length,
                carguesPorVendedor: {},
                fechaConsultada: fechaAUsar,
                ultimoGuardado: null
            };

            // Mapear IDs de vendedor
            const vendedorMap = {
                1: 'ID1', 2: 'ID2', 3: 'ID3', 4: 'ID4', 5: 'ID5', 6: 'ID6', 7: 'BASE_CAJA'
            };

            carguesHoy.forEach(cargue => {
                const vendedorNombre = vendedorMap[cargue.vendedor] || `Vendedor ${cargue.vendedor}`;
                resumen.carguesPorVendedor[vendedorNombre] = {
                    id: cargue.id,
                    dia: cargue.dia,
                    usuario: cargue.usuario,
                    created_at: cargue.created_at
                };

                // Encontrar el más reciente
                if (!resumen.ultimoGuardado || new Date(cargue.created_at) > new Date(resumen.ultimoGuardado)) {
                    resumen.ultimoGuardado = cargue.created_at;
                }
            });

            setResultados(resumen);
            console.log('✅ VERIFICACIÓN COMPLETADA:', resumen);

        } catch (error) {
            console.error('❌ Error verificando datos:', error);
            setError(`Error verificando datos: ${error.message}`);
        }

        setLoading(false);
    };

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return 'N/A';
        return new Date(fechaISO).toLocaleString('es-CO');
    };

    return (
        <div className="mt-3">
            <Button
                variant="info"
                onClick={verificarDatosGuardados}
                disabled={loading}
                size="sm"
            >
                {loading ? '🔍 Verificando...' : '🔍 Verificar Guardado'}
            </Button>

            {error && (
                <Alert variant="danger" className="mt-2">
                    <strong>❌ Error:</strong> {error}
                </Alert>
            )}

            {resultados && (
                <div className="mt-3">
                    <Alert variant="success">
                        <strong>✅ Verificación Completada</strong>
                    </Alert>

                    <div className="mb-3">
                        <strong>📊 Resumen:</strong>
                        <ul className="mb-2">
                            <li><strong>Fecha consultada:</strong> {resultados.fechaConsultada}</li>
                            <li><strong>Total cargues encontrados:</strong> {resultados.totalCargues}</li>
                            <li><strong>Último guardado:</strong> {formatearFecha(resultados.ultimoGuardado)}</li>
                        </ul>
                    </div>

                    {resultados.totalCargues > 0 ? (
                        <Table bordered size="sm">
                            <thead>
                                <tr>
                                    <th>Vendedor/ID</th>
                                    <th>Día</th>
                                    <th>Usuario</th>
                                    <th>Fecha Guardado</th>
                                    <th>ID Cargue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(resultados.carguesPorVendedor).map(([vendedor, datos]) => (
                                    <tr key={vendedor}>
                                        <td><strong>{vendedor}</strong></td>
                                        <td>{datos.dia}</td>
                                        <td>{datos.usuario}</td>
                                        <td>{formatearFecha(datos.created_at)}</td>
                                        <td>#{datos.id}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <Alert variant="warning">
                            <strong>⚠️ No se encontraron cargues guardados</strong> para la fecha {resultados.fechaConsultada}
                        </Alert>
                    )}
                </div>
            )}
        </div>
    );
};

export default VerificarGuardado;