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

    const handleGuardar = async () => {
        console.log('💾 Guardando correcciones...');

        // Filtrar solo productos modificados
        const productosModificados = productosEditados.filter(
            p => p.cantidadOriginal !== p.cantidadNueva
        );

        if (productosModificados.length === 0) {
            alert('⚠️ No hay cambios para guardar');
            return;
        }

        try {
            // 1. Guardar en BD primero
            console.log(`🔄 Sincronizando ${productosModificados.length} productos con BD...`);

            const API_URL = process.env.REACT_APP_API_URL || '/api';

            const promesas = productosModificados.map(producto =>
                fetch(`${API_URL}/cargue-corregir-cantidad/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        vendedor_id: idSheet,
                        dia: dia.toUpperCase(),
                        fecha: fechaSeleccionada,
                        producto: producto.nombre,
                        nueva_cantidad: producto.cantidadNueva
                    })
                }).then(res => res.json())
            );

            const resultados = await Promise.all(promesas);

            // Verificar errores
            const errores = resultados.filter(r => !r.success);
            if (errores.length > 0) {
                console.error('❌ Errores guardando:', errores);
                alert(`❌ Error guardando ${errores.length} producto(s). Revisa la consola para más detalles.`);
                return;
            }

            console.log('✅ Todos los productos guardados en BD');

            // 2. Actualizar localStorage (sincronización local)
            const fechaAUsar = fechaSeleccionada;
            const key = `cargue_${dia}_${idSheet}_${fechaAUsar}`;

            const datosActuales = localStorage.getItem(key);
            if (datosActuales) {
                const datos = JSON.parse(datosActuales);

                productosEditados.forEach(productoEditado => {
                    const productoEnDatos = datos.productos.find(p => p.id === productoEditado.id);
                    if (productoEnDatos && productoEditado.cantidadOriginal !== productoEditado.cantidadNueva) {
                        productoEnDatos.cantidad = productoEditado.cantidadNueva;

                        const cantidad = parseInt(productoEditado.cantidadNueva) || 0;
                        const dctos = parseInt(productoEnDatos.dctos) || 0;
                        const adicional = parseInt(productoEnDatos.adicional) || 0;
                        const devoluciones = parseInt(productoEnDatos.devoluciones) || 0;
                        const vencidas = parseInt(productoEnDatos.vencidas) || 0;

                        productoEnDatos.total = cantidad - dctos + adicional - devoluciones - vencidas;
                        productoEnDatos.neto = Math.round(productoEnDatos.total * productoEnDatos.valor);

                        console.log(`✅ localStorage: ${productoEditado.nombre} - ${productoEditado.cantidadOriginal} → ${productoEditado.cantidadNueva}`);
                    }
                });

                datos.timestamp = Date.now();
                localStorage.setItem(key, JSON.stringify(datos));
            }

            alert(`✅ ${productosModificados.length} producto(s) corregido(s) exitosamente`);

            if (onGuardar) {
                onGuardar();
            }

            onClose();

        } catch (error) {
            console.error('❌ Error guardando:', error);
            alert('❌ Error guardando cambios. Intenta de nuevo.');
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