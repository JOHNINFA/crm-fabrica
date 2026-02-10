import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Form, Spinner, Modal } from 'react-bootstrap';
import { cargueApiConfig } from '../../services/cargueApiService';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const Herramientas = () => {
    const [apiEnabled, setApiEnabled] = useState(cargueApiConfig.USAR_API);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    // Estado para Modal de Reset Completo
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetInput, setResetInput] = useState('');

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

        if (confirmText && confirmText.trim().toUpperCase() !== 'ELIMINAR VENTAS') {
            alert('❌ Código incorrecto. Operación cancelada.');
            return;
        } else if (!confirmText) {
            return;
        }

        setLoading(true);
        setMessage({ type: 'info', text: 'Limpiando ventas de ruta...' });

        try {
            const response = await fetch(`${API_URL}/ventas-ruta/`);
            if (response.ok) {
                const data = await response.json();
                const ventas = Array.isArray(data) ? data : (data.results || []);
                let eliminadas = 0;

                console.log(`🧹 Eliminando ${ventas.length} ventas de ruta`);

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

        if (confirmText && confirmText.trim().toUpperCase() !== 'ELIMINAR PEDIDOS') {
            alert('❌ Código incorrecto. Operación cancelada.');
            return;
        } else if (!confirmText) {
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

        if (confirmText && confirmText.trim().toUpperCase() !== 'RESETEAR STOCK') {
            alert('❌ Código incorrecto. Operación cancelada.');
            return;
        } else if (!confirmText) {
            return;
        }

        setLoading(true);
        setMessage({ type: 'info', text: 'Reseteando stock de productos...' });

        try {
            const response = await fetch(`${API_URL}/stock/`);
            if (response.ok) {
                const stocks = await response.json();
                let reseteados = 0;

                for (const stock of stocks) {
                    try {
                        // PK del Stock es 'producto' (producto_id), no 'id'
                        const stockPk = stock.producto;
                        const resp = await fetch(`${API_URL}/stock/${stockPk}/`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                cantidad_actual: 0
                            })
                        });
                        if (resp.ok) {
                            reseteados++;
                        } else {
                            console.warn(`⚠️ Error HTTP ${resp.status} reseteando stock ${stockPk}`);
                        }
                    } catch (err) {
                        console.warn(`⚠️ Error reseteando stock:`, err);
                    }
                }

                setMessage({
                    type: 'success',
                    text: `✅ ${reseteados} productos con stock reseteado a 0`
                });
            } else {
                setMessage({
                    type: 'danger',
                    text: `❌ Error obteniendo stock: HTTP ${response.status}`
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

        if (confirmText && confirmText.trim().toUpperCase() !== 'ELIMINAR LOTES') {
            alert('❌ Código incorrecto. Operación cancelada.');
            return;
        } else if (!confirmText) {
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

    // 🆕 Lógica del Reset Completo (Ejecutada desde el Modal)
    const procesarResetCompleto = async () => {
        if (resetInput.trim().toUpperCase() !== 'RESET COMPLETO') {
            alert('❌ Código incorrecto. Debes escribir "RESET COMPLETO"');
            return;
        }

        setShowResetModal(false);
        setResetInput('');
        setLoading(true);

        try {
            let totalEliminado = 0;

            // 1. Limpiar Cargues
            setMessage({ type: 'info', text: '1/6: Limpiando cargues...' });
            const tablasALimpiar = [
                'cargue-id1', 'cargue-id2', 'cargue-id3', 'cargue-id4', 'cargue-id5', 'cargue-id6',
                'cargue-pagos',    // 🆕 Pagos
                'cargue-resumen',   // 🆕 Resúmenes y Estados
                'turnos'           // 🆕 Turnos de vendedores
            ];
            for (const tabla of tablasALimpiar) {
                try {
                    const getResponse = await fetch(`${API_URL}/${tabla}/`);
                    if (getResponse.ok) {
                        const data = await getResponse.json();
                        // 🆕 Soportar paginación (DRF usa .results par listas paginadas)
                        const registros = Array.isArray(data) ? data : (data.results || []);

                        console.log(`🧹 Limpiando ${registros.length} registros de ${tabla}`);

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
                const data = await ventasResp.json();
                const ventas = Array.isArray(data) ? data : (data.results || []);
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
            setMessage({ type: 'info', text: '5/6: Reseteando stock a 0...' });
            const stocksResp = await fetch(`${API_URL}/stock/`);
            if (stocksResp.ok) {
                const stocks = await stocksResp.json();
                for (const stock of stocks) {
                    try {
                        await fetch(`${API_URL}/stock/${stock.producto}/`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ cantidad_actual: 0 })
                        });
                        totalEliminado++;
                    } catch (err) { }
                }
            }

            // 6. Limpiar estados de botones (LocalStorage) y Cachés
            setMessage({ type: 'info', text: '6/6: Restaurando estados de botones y cachés...' });
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (
                    key.startsWith('estado_boton_') ||
                    key.startsWith('cargue_') ||
                    key.startsWith('resumen_cache_') ||
                    key.startsWith('conceptos_pagos_')
                )) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`🧹 ${keysToRemove.length} items eliminados del LocalStorage (estados, cargues, caché)`);

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

                {/* 🆕 SECCIÓN: Gestión de Turnos */}
                <div className="mb-3">
                    <h6 className="text-primary">🟢 Gestión de Turnos</h6>
                    <p className="text-muted small">
                        Herramienta para reabrir turnos cerrados accidentalmente.
                    </p>

                    <Form.Group className="mb-2">
                        <Form.Label>Vendedor</Form.Label>
                        <Form.Select
                            id="select-vendedor-turno"
                            defaultValue=""
                        >
                            <option value="">Seleccionar Vendedor</option>
                            <option value="ID1">JHONATHAN ONOFRES (ID1)</option>
                            <option value="ID2">IVAN MAURICIO (ID2)</option>
                            <option value="ID3">DIEGO BELTRÁN (ID3)</option>
                            <option value="ID4">YEISON (ID4)</option>
                            <option value="ID5">YULIAN (ID5)</option>
                            <option value="ID6">VENDEDOR 6 (ID6)</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Fecha del Turno (Opcional)</Form.Label>
                        <Form.Control
                            type="date"
                            id="input-fecha-turno"
                        />
                        <Form.Text className="text-muted">
                            Si se deja vacío, se reabrirá el último turno cerrado de este vendedor.
                        </Form.Text>
                    </Form.Group>

                    <Button
                        variant="success"
                        onClick={async () => {
                            const vendedor = document.getElementById('select-vendedor-turno').value;
                            const fecha = document.getElementById('input-fecha-turno').value;

                            if (!vendedor) {
                                alert('Por favor selecciona un vendedor');
                                return;
                            }

                            setLoading(true);
                            setMessage({ type: 'info', text: 'Reabriendo turno...' });

                            try {
                                const response = await fetch(`${API_URL}/turno/abrir-manual/`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        vendedor_id: vendedor,
                                        fecha: fecha || null
                                    })
                                });

                                const data = await response.json();

                                if (response.ok && data.success) {
                                    setMessage({
                                        type: 'success',
                                        text: `✅ ${data.message}`
                                    });
                                    // Limpiar campos
                                    document.getElementById('input-fecha-turno').value = '';
                                } else {
                                    setMessage({
                                        type: 'danger',
                                        text: `❌ Error: ${data.message || data.error || 'No se pudo reabrir el turno'}`
                                    });
                                }
                            } catch (error) {
                                console.error('Error reabriendo turno:', error);
                                setMessage({ type: 'danger', text: `Error de conexión: ${error.message}` });
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="d-flex align-items-center w-100 justify-content-center"
                        disabled={loading}
                    >
                        {loading ? (
                            <Spinner animation="border" size="sm" />
                        ) : (
                            <>
                                <span className="material-icons me-2">lock_open</span>
                                Reabrir Turno Cerrado
                            </>
                        )}
                    </Button>
                </div>

                <hr className="my-4" />

                {/* 🆕 SECCIÓN: Transacciones */}
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
                        onClick={() => setShowResetModal(true)}
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

            {/* MODAL DE CONFIRMACIÓN DE RESET COMPLETO */}
            <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered backdrop="static">
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title>🔥 PELIGRO: Reset Completo</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-light">
                    <Alert variant="warning">
                        <strong>¡ADVERTENCIA!</strong> Esta acción es irreversible.<br />
                        Se eliminarán permanentemente:
                        <ul className="mb-0 mt-2">
                            <li>Todos los Cargues</li>
                            <li>Ventas de Ruta</li>
                            <li>Pedidos</li>
                            <li>Lotes de Producción</li>
                            <li>El Stock de todos los productos será 0</li>
                        </ul>
                    </Alert>

                    <Form.Group className="mb-3">
                        <Form.Label>
                            Para confirmar, escribe: <span className="fw-bold text-danger">RESET COMPLETO</span>
                        </Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="RESET COMPLETO"
                            value={resetInput}
                            onChange={(e) => setResetInput(e.target.value)}
                            className="text-center fw-bold"
                            style={{ textTransform: 'uppercase' }}
                            autoFocus
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowResetModal(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={procesarResetCompleto}
                        disabled={resetInput.trim().toUpperCase() !== 'RESET COMPLETO'}
                    >
                        CONFIRMAR RESET
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
};

export default Herramientas;
