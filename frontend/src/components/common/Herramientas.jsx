import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Form, Spinner } from 'react-bootstrap';
import { cargueApiConfig } from '../../services/cargueApiService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const Herramientas = () => {
    const [apiEnabled, setApiEnabled] = useState(cargueApiConfig.USAR_API);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    const toggleApi = () => {
        if (apiEnabled) {
            cargueApiConfig.USAR_API = false;
            setApiEnabled(false);
            setMessage({ type: 'warning', text: 'Sincronización automática DESACTIVADA' });
        } else {
            cargueApiConfig.USAR_API = true;
            setApiEnabled(true);
            setMessage({ type: 'success', text: 'Sincronización automática ACTIVADA' });
        }
    };

    const limpiarLocalStorage = () => {
        if (window.confirm('¿Estás seguro de limpiar todo el almacenamiento local? Esto borrará datos no guardados.')) {
            localStorage.clear();
            sessionStorage.clear();
            setMessage({ type: 'info', text: 'Almacenamiento local limpiado correctamente. Recargando...' });
            setTimeout(() => window.location.reload(), 1500);
        }
    };

    const limpiarTodo = async () => {
        if (!window.confirm('⚠️ ADVERTENCIA: Esto limpiará TODA la información de Cargue (Base de Datos + LocalStorage). ¿Estás seguro?')) {
            return;
        }

        setLoading(true);

        try {
            // PASO 1: Desactivar sincronización automática
            setMessage({ type: 'info', text: '1/4: Desactivando sincronización automática...' });
            cargueApiConfig.USAR_API = false;
            setApiEnabled(false);

            // Esperar 2 segundos para que todas las pestañas dejen de guardar
            await new Promise(resolve => setTimeout(resolve, 2000));

            // PASO 2: Limpiar base de datos
            setMessage({ type: 'info', text: '2/4: Limpiando base de datos...' });
            const tablasALimpiar = ['cargue-id1', 'cargue-id2', 'cargue-id3', 'cargue-id4', 'cargue-id5', 'cargue-id6'];

            for (const tabla of tablasALimpiar) {
                try {
                    const getResponse = await fetch(`${API_URL}/${tabla}/`);
                    if (getResponse.ok) {
                        const registros = await getResponse.json();

                        for (const registro of registros) {
                            await fetch(`${API_URL}/${tabla}/${registro.id}/`, {
                                method: 'DELETE'
                            });
                        }
                        console.log(`✅ Tabla ${tabla} limpiada`);
                    }
                } catch (err) {
                    console.warn(`⚠️ Error limpiando ${tabla}:`, err);
                }
            }

            // PASO 3: Limpiar localStorage
            setMessage({ type: 'info', text: '3/4: Limpiando localStorage...' });
            localStorage.clear();
            sessionStorage.clear();

            // PASO 4: Reactivar sincronización automática
            setMessage({ type: 'info', text: '4/4: Reactivando sincronización automática...' });
            cargueApiConfig.USAR_API = true;
            setApiEnabled(true);

            setMessage({ type: 'success', text: '✅ Limpieza completa exitosa. Sincronización reactivada. Recargando...' });
            setTimeout(() => window.location.reload(), 2000);

        } catch (error) {
            console.error('❌ Error en limpieza completa:', error);
            setMessage({ type: 'danger', text: `Error: ${error.message}` });

            // En caso de error, asegurarnos de reactivar la sincronización
            cargueApiConfig.USAR_API = true;
            setApiEnabled(true);
        } finally {
            setLoading(false);
        }
    };

    // 🆕 NUEVA FUNCIÓN: Limpiar Ventas de Ruta
    const limpiarVentas = async () => {
        const confirmText = window.prompt(
            '⚠️ PELIGRO: Esto eliminará TODAS las ventas de ruta de la base de datos.\n\n' +
            'Esta acción NO se puede deshacer.\n\n' +
            'Para confirmar, escribe: ELIMINAR VENTAS'
        );

        if (confirmText !== 'ELIMINAR VENTAS') {
            setMessage({ type: 'warning', text: 'Operación cancelada' });
            return;
        }

        setLoading(true);
        setMessage({ type: 'info', text: 'Limpiando ventas de ruta...' });

        try {
            const response = await fetch(`${API_URL}/ventas-ruta/`);
            if (response.ok) {
                const ventas = await response.json();
                let eliminadas = 0;

                for (const venta of ventas) {
                    try {
                        await fetch(`${API_URL}/ventas-ruta/${venta.id}/`, {
                            method: 'DELETE'
                        });
                        eliminadas++;
                    } catch (err) {
                        console.warn(`⚠️ Error eliminando venta ${venta.id}:`, err);
                    }
                }

                setMessage({
                    type: 'success',
                    text: `✅ ${eliminadas} ventas eliminadas correctamente`
                });
            }
        } catch (error) {
            console.error('❌ Error limpiando ventas:', error);
            setMessage({ type: 'danger', text: `Error: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    // 🆕 NUEVA FUNCIÓN: Limpiar Pedidos
    const limpiarPedidos = async () => {
        const confirmText = window.prompt(
            '⚠️ PELIGRO: Esto eliminará TODOS los pedidos de la base de datos.\n\n' +
            'Esta acción NO se puede deshacer.\n\n' +
            'Para confirmar, escribe: ELIMINAR PEDIDOS'
        );

        if (confirmText !== 'ELIMINAR PEDIDOS') {
            setMessage({ type: 'warning', text: 'Operación cancelada' });
            return;
        }

        setLoading(true);
        setMessage({ type: 'info', text: 'Limpiando pedidos...' });

        try {
            const response = await fetch(`${API_URL}/pedidos/`);
            if (response.ok) {
                const pedidos = await response.json();
                let eliminados = 0;

                for (const pedido of pedidos) {
                    try {
                        await fetch(`${API_URL}/pedidos/${pedido.id}/`, {
                            method: 'DELETE'
                        });
                        eliminados++;
                    } catch (err) {
                        console.warn(`⚠️ Error eliminando pedido ${pedido.id}:`, err);
                    }
                }

                setMessage({
                    type: 'success',
                    text: `✅ ${eliminados} pedidos eliminados correctamente`
                });
            }
        } catch (error) {
            console.error('❌ Error limpiando pedidos:', error);
            setMessage({ type: 'danger', text: `Error: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    // 🆕 NUEVA FUNCIÓN: Resetear Stock a 0 (mantiene productos)
    const resetearStock = async () => {
        const confirmText = window.prompt(
            '⚠️ ADVERTENCIA: Esto pondrá el stock de TODOS los productos en 0.\n\n' +
            'Los productos NO se eliminarán, solo se resetea la cantidad.\n\n' +
            'Para confirmar, escribe: RESETEAR STOCK'
        );

        if (confirmText !== 'RESETEAR STOCK') {
            setMessage({ type: 'warning', text: 'Operación cancelada' });
            return;
        }

        setLoading(true);
        setMessage({ type: 'info', text: 'Reseteando stock de productos...' });

        try {
            const response = await fetch(`${API_URL}/stocks/`);
            if (response.ok) {
                const stocks = await response.json();
                let reseteados = 0;

                for (const stock of stocks) {
                    try {
                        // Actualizar stock a 0 en lugar de eliminarlo
                        await fetch(`${API_URL}/stocks/${stock.id}/`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                cantidad: 0
                            })
                        });
                        reseteados++;
                    } catch (err) {
                        console.warn(`⚠️ Error reseteando stock ${stock.id}:`, err);
                    }
                }

                setMessage({
                    type: 'success',
                    text: `✅ ${reseteados} productos con stock reseteado a 0`
                });
            }
        } catch (error) {
            console.error('❌ Error reseteando stock:', error);
            setMessage({ type: 'danger', text: `Error: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    // 🆕 NUEVA FUNCIÓN: Limpiar Lotes de Producción
    const limpiarLotes = async () => {
        const confirmText = window.prompt(
            '⚠️ PELIGRO: Esto eliminará TODOS los lotes de producción.\n\n' +
            'Esta acción NO se puede deshacer.\n\n' +
            'Para confirmar, escribe: ELIMINAR LOTES'
        );

        if (confirmText !== 'ELIMINAR LOTES') {
            setMessage({ type: 'warning', text: 'Operación cancelada' });
            return;
        }

        setLoading(true);
        setMessage({ type: 'info', text: 'Limpiando lotes de producción...' });

        try {
            const response = await fetch(`${API_URL}/lotes/`);
            if (response.ok) {
                const lotes = await response.json();
                let eliminados = 0;

                for (const lote of lotes) {
                    try {
                        await fetch(`${API_URL}/lotes/${lote.id}/`, {
                            method: 'DELETE'
                        });
                        eliminados++;
                    } catch (err) {
                        console.warn(`⚠️ Error eliminando lote ${lote.id}:`, err);
                    }
                }

                setMessage({
                    type: 'success',
                    text: `✅ ${eliminados} lotes eliminados correctamente`
                });
            }
        } catch (error) {
            console.error('❌ Error limpiando lotes:', error);
            setMessage({ type: 'danger', text: `Error: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    // 🆕 NUEVA FUNCIÓN: Limpieza Total de Transacciones (mantiene maestros)
    const limpiarTodasTransacciones = async () => {
        const confirmText = window.prompt(
            '⚠️ PELIGRO MÁXIMO: Esto eliminará TODAS las transacciones:\n\n' +
            '- Cargues\n' +
            '- Ventas de Ruta\n' +
            '- Pedidos\n' +
            '- Lotes\n' +
            '- Stock → 0\n\n' +
            'NO se eliminarán: Productos, Clientes, Vendedores, Usuarios\n\n' +
            'Para confirmar, escribe: RESET COMPLETO'
        );

        if (confirmText !== 'RESET COMPLETO') {
            setMessage({ type: 'warning', text: 'Operación cancelada' });
            return;
        }

        setLoading(true);

        try {
            let totalEliminado = 0;

            // 1. Limpiar Cargues
            setMessage({ type: 'info', text: '1/5: Limpiando cargues...' });
            const tablasALimpiar = ['cargue-id1', 'cargue-id2', 'cargue-id3', 'cargue-id4', 'cargue-id5', 'cargue-id6'];
            for (const tabla of tablasALimpiar) {
                try {
                    const getResponse = await fetch(`${API_URL}/${tabla}/`);
                    if (getResponse.ok) {
                        const registros = await getResponse.json();
                        for (const registro of registros) {
                            await fetch(`${API_URL}/${tabla}/${registro.id}/`, { method: 'DELETE' });
                            totalEliminado++;
                        }
                    }
                } catch (err) {
                    console.warn(`Error limpiando ${tabla}:`, err);
                }
            }

            // 2. Limpiar Ventas
            setMessage({ type: 'info', text: '2/5: Limpiando ventas...' });
            const ventasResp = await fetch(`${API_URL}/ventas-ruta/`);
            if (ventasResp.ok) {
                const ventas = await ventasResp.json();
                for (const venta of ventas) {
                    try {
                        await fetch(`${API_URL}/ventas-ruta/${venta.id}/`, { method: 'DELETE' });
                        totalEliminado++;
                    } catch (err) { }
                }
            }

            // 3. Limpiar Pedidos
            setMessage({ type: 'info', text: '3/5: Limpiando pedidos...' });
            const pedidosResp = await fetch(`${API_URL}/pedidos/`);
            if (pedidosResp.ok) {
                const pedidos = await pedidosResp.json();
                for (const pedido of pedidos) {
                    try {
                        await fetch(`${API_URL}/pedidos/${pedido.id}/`, { method: 'DELETE' });
                        totalEliminado++;
                    } catch (err) { }
                }
            }

            // 4. Limpiar Lotes
            setMessage({ type: 'info', text: '4/5: Limpiando lotes...' });
            const lotesResp = await fetch(`${API_URL}/lotes/`);
            if (lotesResp.ok) {
                const lotes = await lotesResp.json();
                for (const lote of lotes) {
                    try {
                        await fetch(`${API_URL}/lotes/${lote.id}/`, { method: 'DELETE' });
                        totalEliminado++;
                    } catch (err) { }
                }
            }

            // 5. Resetear Stock a 0
            setMessage({ type: 'info', text: '5/5: Reseteando stock a 0...' });
            const stocksResp = await fetch(`${API_URL}/stocks/`);
            if (stocksResp.ok) {
                const stocks = await stocksResp.json();
                for (const stock of stocks) {
                    try {
                        await fetch(`${API_URL}/stocks/${stock.id}/`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ cantidad: 0 })
                        });
                        totalEliminado++;
                    } catch (err) { }
                }
            }

            setMessage({
                type: 'success',
                text: `✅ Reset completo: ${totalEliminado} transacciones eliminadas/reseteadas. Recargando...`
            });
            setTimeout(() => window.location.reload(), 3000);

        } catch (error) {
            console.error('❌ Error en reset completo:', error);
            setMessage({ type: 'danger', text: `Error: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-sm">
            <Card.Header className="bg-white">
                <h5 className="mb-0">
                    <span className="material-icons me-2" style={{ verticalAlign: 'middle' }}>
                        build
                    </span>
                    Herramientas de Sistema
                </h5>
            </Card.Header>
            <Card.Body>
                {message && (
                    <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
                        {message.text}
                    </Alert>
                )}

                <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">Sincronización Automática</h6>
                        <span className={`badge bg-${apiEnabled ? 'success' : 'danger'}`}>
                            {apiEnabled ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                    </div>
                    <p className="text-muted small">
                        Controla si el sistema guarda automáticamente los cambios en el servidor.
                        Desactívalo para realizar mantenimiento o pruebas.
                    </p>
                    <Form.Check
                        type="switch"
                        id="api-switch"
                        label={apiEnabled ? "Sincronización Activada" : "Sincronización Desactivada"}
                        checked={apiEnabled}
                        onChange={toggleApi}
                        className="mb-2"
                        style={{ fontSize: '1.1rem' }}
                    />
                </div>

                <hr />

                <div className="mb-3">
                    <h6>Limpieza de Datos</h6>
                    <p className="text-muted small">
                        Elimina todos los datos almacenados localmente en el navegador.
                    </p>
                    <Button
                        variant="warning"
                        onClick={limpiarLocalStorage}
                        className="d-flex align-items-center w-100 justify-content-center mb-2"
                        disabled={loading}
                    >
                        <span className="material-icons me-2">delete_sweep</span>
                        Limpiar Solo LocalStorage
                    </Button>
                </div>

                <div className="mb-2">
                    <h6 className="text-danger">⚠️ Limpieza Completa</h6>
                    <p className="text-muted small">
                        Limpia TODA la información de Cargue: Base de Datos + LocalStorage.
                        Útil para empezar pruebas desde cero.
                    </p>
                    <Button
                        variant="danger"
                        onClick={limpiarTodo}
                        className="d-flex align-items-center w-100 justify-content-center"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Limpiando...
                            </>
                        ) : (
                            <>
                                <span className="material-icons me-2">delete_forever</span>
                                Limpiar TODO (BD + LocalStorage)
                            </>
                        )}
                    </Button>
                </div>

                <hr className="my-4" />

                {/* 🆕 SECCIÓN: Limpieza de Transacciones */}
                <div className="mb-3">
                    <h6 className="text-danger">⚠️ Limpieza de Transacciones</h6>
                    <p className="text-muted small">
                        Herramientas para limpiar datos transaccionales (Ventas, Pedidos).
                        <strong> Solo usar para pruebas. NO usar en producción con datos reales.</strong>
                    </p>

                    {/* Limpiar Ventas */}
                    <Button
                        variant="outline-danger"
                        onClick={limpiarVentas}
                        className="d-flex align-items-center w-100 justify-content-center mb-2"
                        disabled={loading}
                    >
                        <span className="material-icons me-2">receipt_long</span>
                        Limpiar Ventas de Ruta
                    </Button>

                    {/* Limpiar Pedidos */}
                    <Button
                        variant="outline-danger"
                        onClick={limpiarPedidos}
                        className="d-flex align-items-center w-100 justify-content-center mb-2"
                        disabled={loading}
                    >
                        <span className="material-icons me-2">shopping_cart</span>
                        Limpiar Pedidos
                    </Button>

                    {/* 🆕 Resetear Stock */}
                    <Button
                        variant="outline-warning"
                        onClick={resetearStock}
                        className="d-flex align-items-center w-100 justify-content-center mb-2"
                        disabled={loading}
                    >
                        <span className="material-icons me-2">inventory_2</span>
                        Resetear Stock a 0
                    </Button>

                    {/* 🆕 Limpiar Lotes */}
                    <Button
                        variant="outline-danger"
                        onClick={limpiarLotes}
                        className="d-flex align-items-center w-100 justify-content-center"
                        disabled={loading}
                    >
                        <span className="material-icons me-2">qr_code</span>
                        Limpiar Lotes de Producción
                    </Button>
                </div>

                <hr className="my-4" />

                {/* 🆕 SECCIÓN: Reset Completo para Piloto */}
                <div className="mb-3">
                    <h6 className="text-danger">🔥 Reset Completo (Piloto)</h6>
                    <p className="text-muted small">
                        <strong>Ideal para después del piloto:</strong> Elimina todas las transacciones de prueba
                        pero mantiene productos, clientes, vendedores y usuarios.
                    </p>

                    <Button
                        variant="danger"
                        onClick={limpiarTodasTransacciones}
                        className="d-flex align-items-center w-100 justify-content-center"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <span className="material-icons me-2">restart_alt</span>
                                Reset Completo de Transacciones
                            </>
                        )}
                    </Button>

                    <small className="text-muted d-block mt-2">
                        ✅ Elimina: Cargues, Ventas, Pedidos, Lotes, Stock→0<br />
                        ❌ NO elimina: Productos, Clientes, Vendedores, Usuarios
                    </small>
                </div>

                {/* Alerta de Advertencia */}
                <Alert variant="danger" className="mt-3">
                    <div className="d-flex align-items-start">
                        <span className="material-icons me-2">warning</span>
                        <div>
                            <strong>IMPORTANTE:</strong> Las opciones de limpieza de transacciones son
                            <strong> IRREVERSIBLES</strong>. Requieren confirmación por texto para evitar
                            borrados accidentales. No usar en ambiente de producción.
                        </div>
                    </div>
                </Alert>
            </Card.Body>
        </Card>
    );
};

export default Herramientas;
