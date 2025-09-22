// Modal simple para corregir cantidades - VERSIÓN DE PRUEBA
import React, { useState } from 'react';

const ModalCorreccionSimple = ({ productos, dia, idSheet, fechaSeleccionada, onClose, onGuardar }) => {
    const [productosEditados, setProductosEditados] = useState(
        productos.map(p => ({
            id: p.id,
            nombre: p.producto,
            cantidadOriginal: p.cantidad || 0,
            cantidadNueva: p.cantidad || 0
        }))
    );

    const handleCambio = (index, valor) => {
        console.log(`📝 Cambiando producto ${index} a valor ${valor}`);
        const nuevos = [...productosEditados];
        nuevos[index].cantidadNueva = parseInt(valor) || 0;
        setProductosEditados(nuevos);
    };

    const handleGuardar = () => {
        console.log('💾 GUARDANDO CAMBIOS...');
        alert('💾 Función guardar ejecutada');

        // Actualizar localStorage
        try {
            const fechaAUsar = fechaSeleccionada || new Date().toISOString().split('T')[0];
            const key = `cargue_${dia}_${idSheet}_${fechaAUsar}`;

            const datosActuales = localStorage.getItem(key);
            if (datosActuales) {
                const datos = JSON.parse(datosActuales);

                // Actualizar productos
                productosEditados.forEach(productoEditado => {
                    const productoEnDatos = datos.productos.find(p => p.id === productoEditado.id);
                    if (productoEnDatos && productoEditado.cantidadOriginal !== productoEditado.cantidadNueva) {
                        productoEnDatos.cantidad = productoEditado.cantidadNueva;
                        productoEnDatos.total = productoEditado.cantidadNueva - (productoEnDatos.dctos || 0) + (productoEnDatos.adicional || 0) - (productoEnDatos.devoluciones || 0) - (productoEnDatos.vencidas || 0);
                        productoEnDatos.neto = Math.round(productoEnDatos.total * productoEnDatos.valor);

                        console.log(`✅ Actualizado: ${productoEditado.nombre} - ${productoEditado.cantidadOriginal} → ${productoEditado.cantidadNueva}`);
                    }
                });

                datos.timestamp = Date.now();
                localStorage.setItem(key, JSON.stringify(datos));

                console.log('✅ Datos guardados en localStorage');
                alert('✅ Cambios guardados exitosamente');

                if (onGuardar) {
                    onGuardar();
                }

                onClose();
            }
        } catch (error) {
            console.error('❌ Error guardando:', error);
            alert('❌ Error guardando cambios');
        }
    };



    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1050
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
                maxWidth: '800px',
                maxHeight: '600px',
                width: '90%',
                overflow: 'auto'
            }}>
                <h4>🔧 Corregir Cantidades - {dia} {idSheet}</h4>

                <div style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginBottom: '20px'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                            <tr>
                                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Producto</th>
                                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Original</th>
                                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Nueva</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productosEditados.map((producto, index) => (
                                <tr key={producto.id}>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px' }}>
                                        {producto.nombre}
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        <span style={{
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px'
                                        }}>
                                            {producto.cantidadOriginal}
                                        </span>
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        <input
                                            type="number"
                                            value={producto.cantidadNueva}
                                            onChange={(e) => handleCambio(index, e.target.value)}
                                            min="0"
                                            style={{
                                                width: '60px',
                                                textAlign: 'center',
                                                padding: '4px',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                                backgroundColor: producto.cantidadOriginal !== producto.cantidadNueva ? '#fff3cd' : 'white'
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>



                    <button
                        onClick={handleGuardar}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        💾 GUARDAR
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalCorreccionSimple;