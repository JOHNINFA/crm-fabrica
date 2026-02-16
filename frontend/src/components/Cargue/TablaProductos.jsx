import React, { useState, useEffect } from 'react';
import { Table } from 'react-bootstrap';
import LotesVencidos from './LotesVencidos';

const TablaProductos = ({ productos, onActualizarProducto, dia, fechaSeleccionada, onInteractionStart }) => {
    const [estadoBoton, setEstadoBoton] = useState('ALISTAMIENTO');
    const [esCompletado, setEsCompletado] = useState(false);
    const camposBloqueados = false;

    const todosListosParaDespacho = () => {
        const productosConCantidad = productos.filter(p => (p.cantidad || 0) > 0);
        if (productosConCantidad.length === 0) return false;
        return productosConCantidad.every(p => p.despachador);
    };

    const botonAlistamientoHabilitado = estadoBoton === 'ALISTAMIENTO_ACTIVO' && todosListosParaDespacho();

    useEffect(() => {
        const actualizarEstado = () => {
            const estado = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`) || 'ALISTAMIENTO';
            setEstadoBoton(estado);
            setEsCompletado(estado === 'COMPLETADO');
        };
        actualizarEstado();
        const interval = setInterval(actualizarEstado, 1500);
        return () => clearInterval(interval);
    }, [dia, fechaSeleccionada]);

    const handleInputChange = (id, campo, valor) => {
        if (esCompletado) return;
        if (botonAlistamientoHabilitado && ['devoluciones', 'vencidas'].includes(campo)) {
            alert('Productos listos para despacho - DEVOLUCIONES y VENCIDAS no se pueden modificar');
            return;
        }
        if (campo === 'lotesVencidos') {
            console.log(`🔍 LOTES: Actualizando lotes para producto ${id}:`, valor);
        }
        onActualizarProducto(id, campo, valor);
    };

    const handleCheckboxChange = (id, campo, checked) => {
        if (onInteractionStart) onInteractionStart();
        if (esCompletado) return;
        const producto = productos.find(p => p.id === id);
        if (checked && producto && producto.total <= 0) return;
        if (campo === 'despachador' && camposBloqueados) return;
        onActualizarProducto(id, campo, checked);
    };

    const handleFocus = (e) => {
        if (onInteractionStart) onInteractionStart();
        e.target.select();
    };

    const handleKeyDown = (e, index, campo) => {
        if (onInteractionStart) onInteractionStart();
        const columnas = ['dctos', 'adicional', 'devoluciones', 'vencidas'];
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const direction = e.key === 'ArrowUp' ? -1 : 1;
            const nextId = `input-${campo}-${index + direction}`;
            const nextElement = document.getElementById(nextId);
            if (nextElement) {
                nextElement.focus();
                setTimeout(() => nextElement.select(), 0);
            }
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const currentIndex = columnas.indexOf(campo);
            if (currentIndex !== -1) {
                const direction = e.key === 'ArrowLeft' ? -1 : 1;
                const nextCampoIndex = currentIndex + direction;
                if (nextCampoIndex >= 0 && nextCampoIndex < columnas.length) {
                    const nextCampo = columnas[nextCampoIndex];
                    const nextId = `input-${nextCampo}-${index}`;
                    const nextElement = document.getElementById(nextId);
                    if (nextElement && !nextElement.disabled) {
                        e.preventDefault();
                        nextElement.focus();
                        setTimeout(() => nextElement.select(), 0);
                    }
                }
            }
        }
    };

    const formatValor = (valor) => {
        if (!valor) return '$0';
        return '$' + Math.round(parseFloat(valor)).toLocaleString();
    };

    const formatNeto = (neto) => {
        if (!neto) return '$0';
        return '$' + Math.round(neto).toLocaleString();
    };

    return (
        <div>
            {esCompletado && (
                <div className="alert alert-success mb-2" role="alert">
                    <strong>🎉 JORNADA COMPLETADA</strong> - Los datos se muestran en modo solo lectura
                </div>
            )}

            <Table bordered hover className="tabla-productos">
                <thead className="table-header">
                    <tr>
                        <th style={{ textAlign: 'center' }}>V</th>
                        <th style={{ textAlign: 'center' }}>D</th>
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
                                    onChange={() => { }}
                                    onClick={(e) => e.preventDefault()}
                                    title="Solo se puede marcar desde la App Móvil"
                                    style={{ accentColor: '#06386d', cursor: 'default', opacity: 1 }}
                                />
                            </td>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={!!p.despachador}
                                    onChange={(e) => handleCheckboxChange(p.id, 'despachador', e.target.checked)}
                                    disabled={esCompletado || camposBloqueados}
                                    style={{
                                        accentColor: '#06386d',
                                        opacity: (esCompletado || camposBloqueados) ? 0.4 : 1,
                                        cursor: (esCompletado || camposBloqueados) ? 'not-allowed' : 'pointer'
                                    }}
                                />
                            </td>
                            <td className="producto-nombre">{p.producto}</td>
                            <td>
                                <input
                                    type="number" value={p.cantidad || 0}
                                    onChange={(e) => handleInputChange(p.id, 'cantidad', e.target.value)}
                                    onFocus={handleFocus}
                                    className="form-control form-control-sm text-center" min="0"
                                    disabled={true} readOnly={true}
                                    style={{ backgroundColor: 'transparent', cursor: 'not-allowed', color: 'black', border: 'none' }}
                                    title="Solo se puede modificar desde la App Móvil"
                                />
                            </td>
                            <td>
                                <input
                                    id={`input-dctos-${index}`} type="number" value={p.dctos || 0}
                                    onChange={(e) => handleInputChange(p.id, 'dctos', e.target.value)}
                                    onFocus={handleFocus} onKeyDown={(e) => handleKeyDown(e, index, 'dctos')}
                                    className="form-control form-control-sm text-center" min="0"
                                    disabled={esCompletado || camposBloqueados}
                                    style={(esCompletado || camposBloqueados) ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed', opacity: 0.6 } : {}}
                                />
                            </td>
                            <td>
                                <input
                                    id={`input-adicional-${index}`} type="number" value={p.adicional || 0}
                                    onChange={(e) => handleInputChange(p.id, 'adicional', e.target.value)}
                                    onFocus={handleFocus} onKeyDown={(e) => handleKeyDown(e, index, 'adicional')}
                                    className="form-control form-control-sm text-center" min="0"
                                    disabled={esCompletado || camposBloqueados}
                                    style={(esCompletado || camposBloqueados) ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed', opacity: 0.6 } : {}}
                                />
                            </td>
                            <td>
                                <input
                                    id={`input-devoluciones-${index}`} type="number" value={p.devoluciones || 0}
                                    onChange={(e) => handleInputChange(p.id, 'devoluciones', e.target.value)}
                                    onFocus={handleFocus} onKeyDown={(e) => handleKeyDown(e, index, 'devoluciones')}
                                    className="form-control form-control-sm text-center" min="0"
                                    disabled={esCompletado || botonAlistamientoHabilitado}
                                    style={(esCompletado || botonAlistamientoHabilitado) ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
                                />
                            </td>
                            <td>
                                <input
                                    id={`input-vencidas-${index}`} type="number" value={p.vencidas || 0}
                                    onChange={(e) => handleInputChange(p.id, 'vencidas', e.target.value)}
                                    onFocus={handleFocus} onKeyDown={(e) => handleKeyDown(e, index, 'vencidas')}
                                    className="form-control form-control-sm text-center" min="0"
                                    disabled={esCompletado || botonAlistamientoHabilitado}
                                    style={(esCompletado || botonAlistamientoHabilitado) ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
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
                            <td className="text-center valor-cell">{formatValor(p.valor)}</td>
                            <td className="text-center neto-cell">{formatNeto(p.neto)}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default TablaProductos;
