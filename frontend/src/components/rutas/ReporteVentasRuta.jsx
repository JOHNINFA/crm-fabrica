import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Modal, Spinner, Tabs, Tab, Alert } from 'react-bootstrap';
import rutasService from '../../services/rutasService';
import './ReporteVentasRuta.css';

const ReporteVentasRuta = () => {
    const [activeTab, setActiveTab] = useState('ventas');

    // ========== ESTADOS PESTAÑA VENTAS ==========
    const [ventas, setVentas] = useState([]);
    const [pedidosEntregados, setPedidosEntregados] = useState([]); // 🆕 Pedidos entregados
    const [vendedores, setVendedores] = useState([]);
    const [filtros, setFiltros] = useState({
        vendedor_id: '',
        fecha: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedVenta, setSelectedVenta] = useState(null);
    const [selectedPedido, setSelectedPedido] = useState(null); // 🆕 Para modal de pedido
    const [showPedidoModal, setShowPedidoModal] = useState(false); // 🆕 Modal pedido

    // ========== ESTADOS PESTAÑA CLIENTES ==========
    const [rutas, setRutas] = useState([]);
    const [selectedVendedor, setSelectedVendedor] = useState(null);
    const [selectedRutaId, setSelectedRutaId] = useState('');
    const [clientesVendedor, setClientesVendedor] = useState([]);
    const [loadingClientes, setLoadingClientes] = useState(false);
    const [showClienteModal, setShowClienteModal] = useState(false);
    const [editingCliente, setEditingCliente] = useState(null);
    const [clienteForm, setClienteForm] = useState({
        nombre_negocio: '', nombre_contacto: '', direccion: '', telefono: '', tipo_negocio: '', dia_visita: [], orden: 0
    });

    // ========== ESTADOS PESTAÑA REPORTES ==========
    const [reportes, setReportes] = useState(null);
    const [loadingReportes, setLoadingReportes] = useState(false);
    const [filtrosReporte, setFiltrosReporte] = useState({
        periodo: 'mes', vendedor_id: '', fecha_inicio: '', fecha_fin: ''
    });

    // ========== ESTADOS PESTAÑA HISTORIAL ==========
    const [clienteHistorial, setClienteHistorial] = useState(null);
    const [statsCliente, setStatsCliente] = useState(null);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    // eslint-disable-next-line
    const [historialVentas, setHistorialVentas] = useState([]);
    const [resumenClientes, setResumenClientes] = useState([]);
    const [periodoAnalisis, setPeriodoAnalisis] = useState('mes'); // dia, semana, mes, anio, personalizado, todo
    const [rangoPersonalizado, setRangoPersonalizado] = useState({
        inicio: new Date().toISOString().split('T')[0],
        fin: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        cargarVendedores();
        cargarRutas();
        cargarVentas();
    }, []);

    // 🆕 Auto-consultar análisis cuando cambian filtros rápidos
    useEffect(() => {
        if (selectedRutaId && periodoAnalisis !== 'personalizado') {
            cargarAnalisisRuta(selectedRutaId);
        }
    }, [selectedRutaId, periodoAnalisis]);

    // ========== FUNCIONES CARGA ==========
    const cargarRutas = async () => {
        try {
            const data = await rutasService.obtenerRutas();
            setRutas(data);
        } catch (e) { console.error(e); }
    };

    // ========== FUNCIONES VENTAS ==========
    const cargarVendedores = async () => {
        try {
            const data = await rutasService.obtenerVendedores();
            setVendedores(data);
        } catch (err) { console.error(err); }
    };

    const cargarVentas = async () => {
        setLoading(true);
        try {
            // Cargar ventas de ruta (app móvil)
            const data = await rutasService.obtenerVentasRuta(filtros.vendedor_id, filtros.fecha);
            setVentas(data);

            // 🆕 Cargar pedidos entregados del día
            const vendedorNombre = filtros.vendedor_id
                ? vendedores.find(v => v.id_vendedor === filtros.vendedor_id)?.nombre
                : null;
            await cargarPedidosEntregados(filtros.fecha, vendedorNombre);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // 🆕 Cargar pedidos entregados del día
    const cargarPedidosEntregados = async (fecha, vendedorNombre) => {
        try {
            // El endpoint no filtra bien, traemos todos y filtramos en frontend
            let url = `/api/pedidos/`;
            const response = await fetch(url);
            if (response.ok) {
                let pedidos = await response.json();

                // 1. Filtrar por fecha de entrega exacta
                pedidos = pedidos.filter(p => p.fecha_entrega === fecha);

                // 2. Filtrar SOLO estado ENTREGADA (no pendientes ni anulados)
                pedidos = pedidos.filter(p => p.estado === 'ENTREGADA');

                // 3. Filtrar por vendedor si aplica
                if (vendedorNombre) {
                    pedidos = pedidos.filter(p =>
                        p.vendedor?.toUpperCase() === vendedorNombre.toUpperCase()
                    );
                }

                setPedidosEntregados(pedidos);
                console.log(`📦 Pedidos ENTREGADOS para ${fecha}:`, pedidos.length, pedidos.map(p => p.numero_pedido));
            }
        } catch (err) {
            console.error('Error cargando pedidos:', err);
            setPedidosEntregados([]);
        }
    };

    const calcularTotalDia = () => ventas.reduce((acc, v) => acc + parseFloat(v.total), 0);
    const calcularTotalPedidos = () => pedidosEntregados.reduce((acc, p) => acc + parseFloat(p.total || 0), 0);

    // ========== FUNCIONES CLIENTES ==========
    const cargarClientesVendedor = async (vendedor) => {
        setSelectedVendedor(vendedor);
        setLoadingClientes(true);
        try {
            const rutas = await rutasService.obtenerRutas();
            const rutaVendedor = rutas.find(r => r.vendedor === vendedor.id || r.vendedor_nombre === vendedor.nombre);
            if (rutaVendedor) {
                const clientes = await rutasService.obtenerClientesRuta(rutaVendedor.id);
                setClientesVendedor(clientes);
            } else { setClientesVendedor([]); }
        } catch (err) { console.error(err); }
        finally { setLoadingClientes(false); }
    };

    const handleSaveCliente = async (e) => {
        e.preventDefault();
        try {
            const rutas = await rutasService.obtenerRutas();
            const rutaVendedor = rutas.find(r => r.vendedor === selectedVendedor.id || r.vendedor_nombre === selectedVendedor.nombre);
            if (!rutaVendedor) { alert('El vendedor no tiene una ruta asignada'); return; }
            const diasString = Array.isArray(clienteForm.dia_visita) ? clienteForm.dia_visita.join(',') : clienteForm.dia_visita;
            const data = { ...clienteForm, dia_visita: diasString, ruta: rutaVendedor.id };
            if (editingCliente) { await rutasService.actualizarClienteRuta(editingCliente.id, data); }
            else { await rutasService.crearClienteRuta(data); }
            setShowClienteModal(false);
            cargarClientesVendedor(selectedVendedor);
        } catch (err) { alert('Error al guardar cliente'); }
    };

    const handleDeleteCliente = async (id) => {
        if (window.confirm('¿Eliminar este cliente?')) {
            await rutasService.eliminarClienteRuta(id);
            cargarClientesVendedor(selectedVendedor);
        }
    };



    // ========== FUNCIONES ANÁLISIS RUTA ==========

    const getFechaLocal = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Acción manual del botón Consultar
    const handleConsultarAnalisis = () => {
        if (!selectedRutaId) {
            alert("Por favor seleccione una ruta primero");
            return;
        }
        cargarAnalisisRuta(selectedRutaId);
    };

    const cargarAnalisisRuta = async (rutaId) => {
        if (!rutaId) return;
        setLoadingHistorial(true);
        setResumenClientes([]);
        setStatsCliente(null);
        setClienteHistorial(null);

        try {
            // Calcular fechas según periodo
            let fechaInicio = null;
            let fechaFin = null;
            const hoy = new Date();

            if (periodoAnalisis === 'dia') {
                fechaInicio = getFechaLocal(hoy);
                fechaFin = fechaInicio;
            } else if (periodoAnalisis === 'semana') {
                const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
                const primerDia = new Date(hoy);
                primerDia.setDate(hoy.getDate() - diaSemana + 1);
                fechaInicio = getFechaLocal(primerDia);
                fechaFin = getFechaLocal(hoy);
            } else if (periodoAnalisis === 'mes') {
                const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                fechaInicio = getFechaLocal(primerDia);
                fechaFin = getFechaLocal(hoy);
            } else if (periodoAnalisis === 'anio') {
                const primerDia = new Date(hoy.getFullYear(), 0, 1);
                fechaInicio = getFechaLocal(primerDia);
                fechaFin = getFechaLocal(hoy);
            } else if (periodoAnalisis === 'personalizado') {
                fechaInicio = rangoPersonalizado.inicio;
                fechaFin = rangoPersonalizado.fin;
            }

            // 1. Obtener CLIENTES MAESTROS de la ruta y VENTAS filtradas por fecha (Range Buffer para Timezones)
            // Ampliamos el rango de búsqueda en API (+1 día) para asegurar que traemos ventas que por UTC caen en el día siguiente
            const apiFechaFin = new Date(fechaFin);
            apiFechaFin.setDate(apiFechaFin.getDate() + 1);
            const apiFechaFinStr = getFechaLocal(apiFechaFin);

            const [clientesMaestros, ventasRaw] = await Promise.all([
                rutasService.obtenerClientesRuta(rutaId),
                rutasService.obtenerVentasRuta(null, null, null, rutaId, fechaInicio, apiFechaFinStr)
            ]);

            // 2. Filtrado EXACTO por fecha LOCAL
            // Como pedimos un rango más amplio, ahora filtramos en memoria las ventas que REALMENTE pertenecen al día local seleccionado
            const ventas = ventasRaw.filter(v => {
                const fechaVenta = new Date(v.fecha);
                const fechaVentaLocal = getFechaLocal(fechaVenta);
                return fechaVentaLocal >= fechaInicio && fechaVentaLocal <= fechaFin;
            });

            // 3. Cruzar información: Para cada cliente maestro, calcular sus métricas
            const resumen = clientesMaestros.map(cliente => {
                // Filtrar ventas de este cliente
                // Intentamos coincidir por ID de cliente o por nombre de negocio (fallback)
                const ventasCliente = ventas.filter(v =>
                    v.cliente === cliente.id ||
                    (v.nombre_negocio && v.nombre_negocio.trim().toLowerCase() === cliente.nombre_negocio.trim().toLowerCase())
                );

                let totalVencidos = 0;
                let mapVencidos = {};
                let totalCompras = 0;

                ventasCliente.forEach(v => {
                    totalCompras += parseFloat(v.total || 0);
                    // Procesar vencidos
                    if (v.productos_vencidos && Array.isArray(v.productos_vencidos)) {
                        v.productos_vencidos.forEach(p => {
                            const cant = parseInt(p.cantidad) || 0;
                            totalVencidos += cant;
                            const k = p.nombre || p.producto;
                            mapVencidos[k] = (mapVencidos[k] || 0) + cant;
                        });
                    }
                });

                // Encontrar producto más devuelto
                let productoMasDevuelto = '-';
                let maxDev = 0;
                Object.entries(mapVencidos).forEach(([prod, cant]) => {
                    if (cant > maxDev) {
                        maxDev = cant;
                        productoMasDevuelto = `${prod} (${cant})`;
                    }
                });

                return {
                    id: cliente.id,
                    nombre: cliente.nombre_negocio,
                    cantidadVisitas: ventasCliente.length,
                    totalVencidos,
                    productoMasDevuelto,
                    promedioCompra: ventasCliente.length > 0 ? totalCompras / ventasCliente.length : 0,
                    historial: ventasCliente,
                    stats: { totalCompras, promedioVenta: ventasCliente.length > 0 ? totalCompras / ventasCliente.length : 0 }
                };
            });

            // 4. Filtrar: Solo mostrar clientes que tuvieron ACTIVIDAD (ventas o devoluciones) en este periodo
            // para evitar llenar la tabla con clientes que no se visitaron.
            const resumenFiltrado = resumen.filter(c => c.cantidadVisitas > 0 || c.totalVencidos > 0);

            // 5. Ordenar: Primero los que tienen más vencidos
            resumenFiltrado.sort((a, b) => b.totalVencidos - a.totalVencidos || b.totalCompras - a.totalCompras);

            setResumenClientes(resumenFiltrado);

            if (resumenFiltrado.length === 0) {
                alert('No se encontró actividad de ventas o devoluciones para esta ruta en el periodo seleccionado.');
            }

        } catch (e) {
            console.error(e);
            alert('Error al cargar análisis: ' + e.message);
        } finally {
            setLoadingHistorial(false);
        }
    };

    // Ver detalle de un cliente específico desde la tabla de análisis
    const verDetalleCliente = (clienteResumen) => {
        // Buscar info completa si existe
        let clienteInfo = clientesVendedor.find(c => c.id === clienteResumen.id);
        // Si no está en clientesVendedor (porque es de otra ruta o no cargado), construimos objeto básico
        if (!clienteInfo) {
            clienteInfo = { id: clienteResumen.id, nombre_negocio: clienteResumen.nombre || clienteResumen.cliente_nombre, dia_visita: 'Histórico' };
        }

        setClienteHistorial(clienteInfo);

        // CORRECCIÓN: Usar .historial que es lo que guardamos en cargarAnalisisRuta
        const ventas = clienteResumen.historial || [];
        setHistorialVentas(ventas);
        calcularStatsCliente(ventas);

        // Scroll automático al detalle
        setTimeout(() => {
            const el = document.getElementById('detalle-cliente-stats');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // ========== FUNCIONES HISTORIAL DETALLE ==========
    const handleClienteHistorialSelect = async (clienteId) => {
        const cliente = clientesVendedor.find(c => c.id == clienteId);
        setClienteHistorial(cliente);
        if (!cliente) return;

        setLoadingHistorial(true);
        try {
            // Traer TODAS las ventas históricas de este cliente
            const ventasHist = await rutasService.obtenerVentasRuta(null, null, cliente.id);
            setHistorialVentas(ventasHist);
            calcularStatsCliente(ventasHist);
        } catch (e) { console.error(e); }
        finally { setLoadingHistorial(false); }
    };

    const calcularStatsCliente = (ventas) => {
        let totalGeneral = 0;
        let mapProductos = {};
        let mapVencidos = {};
        let totalDevoluciones = 0;

        ventas.forEach(v => {
            totalGeneral += parseFloat(v.total);

            // Productos comprados
            v.detalles?.forEach(d => {
                const prod = d.nombre || d.producto;
                if (!mapProductos[prod]) mapProductos[prod] = { cant: 0, total: 0 };
                mapProductos[prod].cant += d.cantidad;
                mapProductos[prod].total += (d.cantidad * (d.precio || 0));
            });

            // Vencidos
            v.productos_vencidos?.forEach(d => {
                const prod = d.producto;
                if (!mapVencidos[prod]) mapVencidos[prod] = 0;
                mapVencidos[prod] += d.cantidad;
                totalDevoluciones += d.cantidad; // Cantidad total de unidades devueltas
            });
        });

        // Ordenar Top Productos
        const topProductos = Object.entries(mapProductos)
            .map(([k, v]) => ({ producto: k, ...v }))
            .sort((a, b) => b.cant - a.cant)
            .slice(0, 10);

        // Ordenar Top Vencidos
        const topVencidos = Object.entries(mapVencidos)
            .map(([k, v]) => ({ producto: k, cantidad: v }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 10);

        setStatsCliente({
            totalCompras: totalGeneral,
            promedioVenta: ventas.length ? totalGeneral / ventas.length : 0,
            tasaDevolucion: ventas.length ? (totalDevoluciones / (ventas.length * 10)) : 0, // Aprox unidades por venta
            topProductos,
            topVencidos,
            totalVentas: ventas.length,
            ultimaVenta: ventas.length ? ventas[0].fecha : null
        });
    };

    // ========== FUNCIONES REPORTES ==========
    const cargarReportes = async () => {
        setLoadingReportes(true);
        try {
            const data = await rutasService.obtenerReportesVentas(
                filtrosReporte.periodo, filtrosReporte.vendedor_id, filtrosReporte.fecha_inicio, filtrosReporte.fecha_fin
            );
            setReportes(data);
        } catch (err) { console.error(err); }
        finally { setLoadingReportes(false); }
    };

    // ========== FUNCIÓN IMPRIMIR TICKET ==========
    const imprimirTicket = (venta) => {
        if (!venta) return;

        const fecha = new Date(venta.fecha);
        const fechaStr = fecha.toLocaleDateString('es-CO');
        const horaStr = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

        let productosHTML = '';
        venta.detalles?.forEach(item => {
            const nombre = item.nombre || item.producto || 'Sin nombre';
            const subtotal = item.cantidad * item.precio;
            productosHTML += '<div class="producto"><span class="nombre">' + nombre + '</span><br><span class="detalle">' + item.cantidad + ' x $' + (item.precio?.toLocaleString() || 0) + '</span><span class="subtotal">$' + subtotal.toLocaleString() + '</span></div>';
        });

        const ticketHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ticket Venta #${venta.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;font-size:12px;width:72mm;margin:0 auto;padding:10px}
.header{text-align:center;margin-bottom:10px}
.header h2{font-size:16px;margin:0}
.header p{font-size:10px;color:#666}
.divider{border-top:1px dashed #000;margin:8px 0}
.info-row{display:flex;justify-content:space-between;font-size:11px;margin:3px 0}
.producto{margin:8px 0}
.producto .nombre{font-weight:bold;font-size:11px}
.producto .detalle{font-size:10px}
.producto .subtotal{float:right;font-size:11px}
.total-row{display:flex;justify-content:space-between;font-weight:bold;font-size:14px;margin:10px 0}
.footer{text-align:center;font-size:9px;margin-top:10px}
@media print{@page{margin:5mm;size:80mm auto}}
</style></head>
<body>
<div class="header"><h2>AP GUERRERO</h2><p>Distribuidora de Alimentos</p></div>
<div class="divider"></div>
<div class="info-row"><span>Fecha:</span><span>${fechaStr}</span></div>
<div class="info-row"><span>Hora:</span><span>${horaStr}</span></div>
<div class="info-row"><span>Venta #:</span><span>${venta.id}</span></div>
<div class="divider"></div>
${venta.nombre_negocio ? '<div class="info-row"><span>Negocio:</span><span>' + venta.nombre_negocio + '</span></div>' : ''}
<div class="info-row"><span>Cliente:</span><span>${venta.cliente_nombre}</span></div>
<div class="info-row"><span>Vendedor:</span><span>${venta.vendedor_nombre}</span></div>
<div class="divider"></div>
${productosHTML}
<div class="divider"></div>
<div class="total-row"><span>TOTAL:</span><span>$${parseFloat(venta.total).toLocaleString()}</span></div>
<div class="divider"></div>
<div class="footer"><p>¡Gracias por su compra!</p><p>AP Guerrero - ${fechaStr}</p></div>
</body></html>`;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);
        iframe.contentDocument.write(ticketHTML);
        iframe.contentDocument.close();
        iframe.contentWindow.focus();
        setTimeout(() => {
            iframe.contentWindow.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 300);
    };


    return (
        <Container fluid>
            <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
                {/* PESTAÑA VENTAS */}
                <Tab eventKey="ventas" title={<><i className="bi bi-cart-check me-1"></i> Ventas del Día</>}>
                    {/* Filtro Moderno */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4 mt-2">
                        <div>
                            <h4 className="fw-bold text-dark mb-1">Ventas de Ruta</h4>
                            <p className="text-secondary small mb-0">Monitorea el rendimiento de tus vendedores en tiempo real.</p>
                        </div>
                        <Form onSubmit={(e) => { e.preventDefault(); cargarVentas(); }} className="d-flex gap-2 filter-bar p-0 mb-0">
                            <div className="d-flex flex-column gap-1">
                                <label className="text-secondary fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Fecha</label>
                                <Form.Control type="date" value={filtros.fecha} onChange={e => setFiltros({ ...filtros, fecha: e.target.value })} className="filter-select h-auto bg-white border-0 shadow-sm" />
                            </div>
                            <div className="d-flex flex-column gap-1">
                                <label className="text-secondary fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Vendedor</label>
                                <Form.Select value={filtros.vendedor_id} onChange={e => setFiltros({ ...filtros, vendedor_id: e.target.value })} className="filter-select h-auto bg-white border-0 shadow-sm">
                                    <option value="">Todos los vendedores</option>
                                    {vendedores.map(v => <option key={v.id_vendedor} value={v.id_vendedor}>{v.nombre}</option>)}
                                </Form.Select>
                            </div>
                            <Button type="submit" className="align-self-end btn btn-primary px-4 shadow-sm border-0 bg-primary" style={{ height: '38px', borderRadius: '0.5rem' }}>
                                <i className="bi bi-funnel-fill"></i>
                            </Button>
                        </Form>
                    </div>

                    {/* KPIs Cards */}
                    <Row className="mb-4 g-4">
                        <Col md={3} sm={6}>
                            <div className="kpi-card kpi-blue">
                                <div className="kpi-content">
                                    <div className="kpi-label">Ventas Ruta</div>
                                    <div className="kpi-value">${calcularTotalDia().toLocaleString()}</div>
                                    <div className="kpi-trend positive"><i className="bi bi-graph-up me-1"></i>Hoy</div>
                                </div>
                                <div className="kpi-icon-wrapper"><i className="bi bi-phone"></i></div>
                            </div>
                        </Col>
                        <Col md={3} sm={6}>
                            <div className="kpi-card kpi-green">
                                <div className="kpi-content">
                                    <div className="kpi-label">Cant. Ventas</div>
                                    <div className="kpi-value">{ventas.length}</div>
                                    <div className="kpi-trend neutral">Transacciones</div>
                                </div>
                                <div className="kpi-icon-wrapper"><i className="bi bi-bag-check"></i></div>
                            </div>
                        </Col>
                        <Col md={3} sm={6}>
                            <div className="kpi-card kpi-indigo">
                                <div className="kpi-content">
                                    <div className="kpi-label">Pedidos Entregados</div>
                                    <div className="kpi-value">${calcularTotalPedidos().toLocaleString()}</div>
                                    <div className="kpi-trend positive"><i className="bi bi-check-circle me-1"></i>Cobrado</div>
                                </div>
                                <div className="kpi-icon-wrapper"><i className="bi bi-truck"></i></div>
                            </div>
                        </Col>
                        <Col md={3} sm={6}>
                            <div className="kpi-card kpi-amber">
                                <div className="kpi-content">
                                    <div className="kpi-label">Cant. Pedidos</div>
                                    <div className="kpi-value">{pedidosEntregados.length}</div>
                                    <div className="kpi-trend neutral">Entregas</div>
                                </div>
                                <div className="kpi-icon-wrapper"><i className="bi bi-box-seam"></i></div>
                            </div>
                        </Col>
                    </Row>

                    {/* Tabla Ventas Moderna */}
                    <div className="modern-card">
                        <div className="modern-card-header">
                            <div className="modern-card-title">
                                <span className="kpi-icon-wrapper bg-light text-success me-2 border" style={{ width: '2.5rem', height: '2.5rem' }}><i className="bi bi-phone"></i></span>
                                Ventas de Ruta (App Móvil)
                            </div>
                            <Button variant="link" className="text-decoration-none text-primary fw-bold small p-0" onClick={cargarVentas}>
                                <i className="bi bi-arrow-clockwise me-1"></i> Recargar
                            </Button>
                        </div>
                        <div className="table-responsive">
                            <Table className="modern-table" hover>
                                <thead><tr><th>Hora</th><th>Vendedor</th><th>Negocio</th><th>Cliente</th><th>Total</th><th className="text-end">Acciones</th></tr></thead>
                                <tbody>
                                    {ventas.map(venta => (
                                        <tr key={venta.id}>
                                            <td className="text-muted small">{new Date(venta.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="fw-medium">{venta.vendedor_nombre}</td>
                                            <td>{venta.nombre_negocio || '-'}</td>
                                            <td className="text-muted small">{venta.cliente_nombre}</td>
                                            <td className="fw-bold text-primary">${parseFloat(venta.total).toLocaleString()}</td>
                                            <td className="text-end">
                                                <button className="btn-icon-modern me-1" onClick={() => imprimirTicket(venta)} title="Imprimir Ticket"><i className="bi bi-printer"></i></button>
                                                <button className="btn-icon-modern text-primary" onClick={() => { setSelectedVenta(venta); setShowModal(true); }} title="Ver Detalle"><i className="bi bi-eye"></i></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {ventas.length === 0 && <tr><td colSpan="6" className="text-center p-5 text-muted fst-italic">No hay ventas registradas para este filtro</td></tr>}
                                </tbody>
                            </Table>
                        </div>
                    </div>

                    {/* Tabla Pedidos Moderna */}
                    <div className="modern-card">
                        <div className="modern-card-header">
                            <div className="modern-card-title">
                                <span className="kpi-icon-wrapper bg-light text-primary me-2 border" style={{ width: '2.5rem', height: '2.5rem' }}><i className="bi bi-truck"></i></span>
                                Pedidos Entregados
                            </div>
                            <span className="badge-modern badge-neutral-modern border">{pedidosEntregados.length} pedidos hoy</span>
                        </div>
                        <div className="table-responsive">
                            <Table className="modern-table" hover>
                                <thead><tr><th># Pedido</th><th>Negocio</th><th>Dirección</th><th>Estado</th><th>Total</th><th className="text-end">Acciones</th></tr></thead>
                                <tbody>
                                    {pedidosEntregados.map(pedido => (
                                        <tr key={pedido.id}>
                                            <td><span className="badge-modern badge-neutral-modern text-dark border">#{pedido.numero_pedido}</span></td>
                                            <td className="fw-medium">{pedido.destinatario || '-'}</td>
                                            <td className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>{pedido.direccion_entrega || '-'}</td>
                                            <td>
                                                <span className={`badge-modern ${pedido.estado === 'ENTREGADA' ? 'badge-success-modern' : 'badge-warning-modern'}`}>
                                                    {pedido.estado}
                                                </span>
                                            </td>
                                            <td className="fw-bold">${parseFloat(pedido.total || 0).toLocaleString()}</td>
                                            <td className="text-end">
                                                <button className="btn-icon-modern text-primary" onClick={() => { setSelectedPedido(pedido); setShowPedidoModal(true); }}><i className="bi bi-eye"></i></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {pedidosEntregados.length === 0 && <tr><td colSpan="6" className="text-center p-5 text-muted fst-italic">No hay pedidos entregados este día</td></tr>}
                                </tbody>
                            </Table>
                        </div>
                        <div className="p-3 text-center border-top border-light">
                            <small className="text-muted cursor-pointer hover-text-primary">Ver todos los pedidos</small>
                        </div>
                    </div>
                </Tab>



                {/* PESTAÑA HISTORIAL CLIENTE / ANÁLISIS RUTA */}
                <Tab eventKey="historial" title={<><i className="bi bi-bar-chart-lines me-1"></i> Análisis de Ruta</>}>
                    <div className="mb-4 mt-3 d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="fw-bold text-dark mb-1">Análisis de Desempeño por Ruta</h4>
                            <p className="text-secondary small mb-0">
                                Evalúa el comportamiento de compra y devoluciones de tus clientes.
                                <span className="ms-2 badge-modern badge-neutral-modern border py-1 px-2 text-primary">
                                    <i className="bi bi-calendar3 me-1"></i>
                                    {periodoAnalisis === 'dia' ? 'Hoy' :
                                        periodoAnalisis === 'semana' ? 'Esta Semana' :
                                            periodoAnalisis === 'mes' ? 'Este Mes' :
                                                periodoAnalisis === 'anio' ? 'Este Año' :
                                                    periodoAnalisis === 'todo' ? 'Histórico Total' : 'Rango Personalizado'}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* SEARCH SECTION MODERNA */}
                    <div className="search-section">
                        <div className="d-flex flex-column flex-md-row gap-4 align-items-end">
                            <div className="flex-grow-1 w-100">
                                <label className="text-secondary small fw-bold text-uppercase mb-2">1. Seleccionar Ruta</label>
                                <div className="position-relative">
                                    <Form.Select
                                        className="search-select"
                                        value={selectedRutaId}
                                        onChange={e => setSelectedRutaId(e.target.value)}
                                        style={{ paddingRight: '2.5rem' }}
                                    >
                                        <option value="">-- Seleccione Ruta Geográfica --</option>
                                        <option value="todas">📍 TODAS LAS RUTAS</option>
                                        {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre} ({r.dia_visita})</option>)}
                                    </Form.Select>
                                    <i className="bi bi-chevron-down text-muted position-absolute" style={{ right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}></i>
                                </div>
                            </div>

                            <div className="w-100" style={{ maxWidth: '200px' }}>
                                <label className="text-secondary small fw-bold text-uppercase mb-2">2. Periodo</label>
                                <div className="position-relative">
                                    <Form.Select
                                        className="search-select"
                                        value={periodoAnalisis}
                                        onChange={e => setPeriodoAnalisis(e.target.value)}
                                    >
                                        <option value="dia">Día (Hoy)</option>
                                        <option value="semana">Esta Semana</option>
                                        <option value="mes">Este Mes</option>
                                        <option value="anio">Este Año</option>
                                        <option value="personalizado">📅 Personalizado</option>
                                        <option value="todo">Todo el Historial</option>
                                    </Form.Select>
                                </div>
                            </div>

                            {periodoAnalisis === 'personalizado' && (
                                <>
                                    <div className="w-100" style={{ maxWidth: '180px' }}>
                                        <label className="text-secondary small fw-bold text-uppercase mb-2">Desde</label>
                                        <Form.Control
                                            type="date"
                                            className="search-select"
                                            value={rangoPersonalizado.inicio}
                                            onChange={e => setRangoPersonalizado({ ...rangoPersonalizado, inicio: e.target.value })}
                                        />
                                    </div>
                                    <div className="w-100" style={{ maxWidth: '180px' }}>
                                        <label className="text-secondary small fw-bold text-uppercase mb-2">Hasta</label>
                                        <Form.Control
                                            type="date"
                                            className="search-select"
                                            value={rangoPersonalizado.fin}
                                            onChange={e => setRangoPersonalizado({ ...rangoPersonalizado, fin: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="d-flex gap-3 w-100 w-md-auto">
                                <button
                                    className="btn-consultar"
                                    onClick={handleConsultarAnalisis}
                                    disabled={loadingHistorial || !selectedRutaId}
                                >
                                    {loadingHistorial ? <Spinner animation="border" size="sm" /> : <><i className="bi bi-search"></i> Consultar</>}
                                </button>
                            </div>

                            {/* Stats Badge */}
                            {!loadingHistorial && resumenClientes.length > 0 && (
                                <div className="stats-badge ms-md-auto mt-3 mt-md-0 w-100 w-md-auto justify-content-center">
                                    <i className="bi bi-check-circle-fill"></i> {resumenClientes.length} Clientes Analizados
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TABLA RESUMEN DE CLIENTES MODERNA */}
                    {!loadingHistorial && resumenClientes.length > 0 && (
                        <div className="modern-card border shadow-sm">
                            <div className="modern-card-header bg-white border-bottom py-3">
                                <div className="d-flex align-items-center gap-2">
                                    <i className="bi bi-flag-fill text-danger fs-5"></i>
                                    <h6 className="mb-0 fw-bold text-dark">Clientes con más Devoluciones (Vencidos)</h6>
                                </div>
                            </div>
                            <div className="table-responsive">
                                <Table className="modern-table align-middle m-0" hover>
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4">Negocio</th>
                                            <th className="text-center">Visitas</th>
                                            <th className="text-center">Total Vencidos</th>
                                            <th>Producto Principal</th>
                                            <th>Valor Prom.</th>
                                            <th className="text-end pe-4">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resumenClientes.map((c, idx) => {
                                            // Lógica de color según vencidos
                                            let color = 'slate';
                                            if (c.totalVencidos > 5) color = 'red';
                                            else if (c.totalVencidos > 0) color = 'amber';
                                            else if (c.totalVisitas > 0) color = 'blue';

                                            // Lógica stripe
                                            let stripeClass = `indicator-${color}`;
                                            let pillClass = `pill-${color}`;

                                            return (
                                                <tr key={c.id} className="position-relative hover-shadow-sm transition-all">
                                                    <td className="ps-4 py-3 position-relative">
                                                        <div className={`indicator-bar ${stripeClass}`}></div>
                                                        <div className="fw-bold text-dark ms-2">{c.nombre}</div>
                                                    </td>
                                                    <td className="text-center text-secondary fw-medium">{c.cantidadVisitas}</td>
                                                    <td className="text-center">
                                                        <span className={`pill-badge ${pillClass}`}>
                                                            {c.totalVencidos} unids
                                                        </span>
                                                    </td>
                                                    <td className="text-muted small">{c.productoMasDevuelto || '-'}</td>
                                                    <td className="fw-medium text-dark">${c.promedioCompra.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                    <td className="text-end pe-4">
                                                        <button className="btn-chevron" onClick={() => verDetalleCliente(c)} title="Ver detalle">
                                                            <i className="bi bi-chevron-right fs-5"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                            <div className="p-3 bg-light text-center border-top">
                                <small className="text-muted fw-bold text-uppercase cursor-pointer hover-text-primary">Ver Lista Completa</small>
                            </div>
                        </div>
                    )}

                    {statsCliente && (
                        <div id="detalle-cliente-stats" className="border-top pt-5 mt-5">
                            <div className="d-flex align-items-center mb-4">
                                <span className="kpi-icon-wrapper bg-light text-primary me-3 border shadow-sm" style={{ width: '3.5rem', height: '3.5rem' }}>
                                    <i className="bi bi-shop fs-3"></i>
                                </span>
                                <div>
                                    <div className="text-uppercase text-secondary small fw-bold tracking-wider">Detalle del Cliente</div>
                                    <h3 className="fw-bold text-dark mb-0">{clienteHistorial?.nombre_negocio || clienteHistorial?.nombre}</h3>
                                </div>
                            </div>

                            {/* DASHBOARD RESUMEN MODERNO */}
                            <Row className="mb-5 g-4">
                                <Col md={3} sm={6}>
                                    <div className="kpi-card kpi-blue h-100 border-0 shadow-sm" style={{ backgroundColor: '#f8fafc' }}>
                                        <div className="kpi-content">
                                            <div className="kpi-label">Total Compras</div>
                                            <div className="kpi-value">${statsCliente.totalCompras.toLocaleString()}</div>
                                            <div className="kpi-trend positive"><i className="bi bi-cash-stack me-1"></i>Facturado</div>
                                        </div>
                                        <div className="kpi-icon-wrapper bg-white shadow-sm text-primary"><i className="bi bi-currency-dollar"></i></div>
                                    </div>
                                </Col>
                                <Col md={3} sm={6}>
                                    <div className="kpi-card kpi-indigo h-100 border-0 shadow-sm" style={{ backgroundColor: '#f8fafc' }}>
                                        <div className="kpi-content">
                                            <div className="kpi-label">Promedio Venta</div>
                                            <div className="kpi-value">${statsCliente.promedioVenta.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                            <div className="kpi-trend neutral">Por visita</div>
                                        </div>
                                        <div className="kpi-icon-wrapper bg-white shadow-sm text-indigo"><i className="bi bi-calculator"></i></div>
                                    </div>
                                </Col>
                                <Col md={3} sm={6}>
                                    <div className="kpi-card kpi-green h-100 border-0 shadow-sm" style={{ backgroundColor: '#f8fafc' }}>
                                        <div className="kpi-content">
                                            <div className="kpi-label">Total Visitas</div>
                                            <div className="kpi-value">{statsCliente.totalVentas}</div>
                                            <div className="kpi-trend positive"><i className="bi bi-calendar-check me-1"></i>Ventas</div>
                                        </div>
                                        <div className="kpi-icon-wrapper bg-white shadow-sm text-success"><i className="bi bi-geo-alt"></i></div>
                                    </div>
                                </Col>
                                <Col md={3} sm={6}>
                                    <div className="kpi-card h-100 border-0 shadow-sm" style={{ backgroundColor: '#fef2f2' }}> {/* Red tint background */}
                                        <div className="kpi-content">
                                            <div className="kpi-label text-danger">Top Vencido</div>
                                            <div className="kpi-value text-danger" style={{ fontSize: '1.1rem', wordBreak: 'break-word' }}>
                                                {statsCliente.topVencidos.length > 0 ? statsCliente.topVencidos[0].producto : 'Sin vencidos'}
                                            </div>
                                            <div className="kpi-trend neutral text-danger-emphasis">
                                                {statsCliente.topVencidos.length > 0 ? `${statsCliente.topVencidos[0].cantidad} unidades` : 'Excelente'}
                                            </div>
                                        </div>
                                        <div className="kpi-icon-wrapper bg-white shadow-sm text-danger"><i className="bi bi-exclamation-octagon"></i></div>
                                    </div>
                                </Col>
                            </Row>

                            <Row>
                                {/* TOP PRODUCTOS */}
                                <Col md={6} className="mb-4">
                                    <div className="modern-card h-100">
                                        <div className="modern-card-header">
                                            <div className="modern-card-title">
                                                <i className="bi bi-star-fill text-warning me-2"></i> Productos Más Vendidos
                                            </div>
                                        </div>
                                        <div className="table-responsive">
                                            <Table className="modern-table" hover>
                                                <thead><tr><th>Producto</th><th className="text-center">Cant</th><th className="text-end">Total $</th></tr></thead>
                                                <tbody>
                                                    {statsCliente.topProductos.map((p, i) => (
                                                        <tr key={i}>
                                                            <td className="fw-medium text-dark">{p.producto}</td>
                                                            <td className="text-center">
                                                                <span className="badge-modern badge-neutral-modern border">{p.cant}</span>
                                                            </td>
                                                            <td className="text-end fw-bold text-dark">${p.total.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                    {statsCliente.topProductos.length === 0 && <tr><td colSpan="3" className="text-center p-4 text-muted">Sin datos de ventas</td></tr>}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </div>
                                </Col>

                                {/* TOP VENCIDOS */}
                                <Col md={6} className="mb-4">
                                    <div className="modern-card h-100 border-danger-subtle">
                                        <div className="modern-card-header bg-danger-subtle bg-opacity-10">
                                            <div className="modern-card-title text-danger">
                                                <i className="bi bi-recycle me-2"></i> Historial de Devoluciones
                                            </div>
                                        </div>
                                        <div className="table-responsive">
                                            <Table className="modern-table" hover>
                                                <thead><tr><th>Producto</th><th className="text-center">Cant. Devuelta</th></tr></thead>
                                                <tbody>
                                                    {statsCliente.topVencidos.map((p, i) => (
                                                        <tr key={i}>
                                                            <td className="fw-medium text-dark">{p.producto}</td>
                                                            <td className="text-center">
                                                                <span className="badge-modern badge-simple text-danger bg-danger-subtle border border-danger-subtle px-3">
                                                                    -{p.cantidad}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {statsCliente.topVencidos.length === 0 && <tr><td colSpan="2" className="text-center p-5 text-muted fst-italic">Este cliente no tiene registro de vencidos recientes 👏</td></tr>}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    )}

                </Tab>

                {/* PESTAÑA REPORTES (ORIGINAL) */}
                <Tab eventKey="reportes" title={<><i className="bi bi-graph-up me-1"></i> Reportes</>}>
                    <Card className="mb-4 shadow-sm">
                        <Card.Body>
                            <Form onSubmit={(e) => { e.preventDefault(); cargarReportes(); }}>
                                <Row className="align-items-end">
                                    <Col md={3}>
                                        <Form.Group><Form.Label>Período</Form.Label>
                                            <Form.Select value={filtrosReporte.periodo} onChange={e => setFiltrosReporte({ ...filtrosReporte, periodo: e.target.value })}>
                                                <option value="dia">Hoy</option>
                                                <option value="semana">Última Semana</option>
                                                <option value="mes">Este Mes</option>
                                                <option value="trimestre">Último Trimestre</option>
                                                <option value="semestre">Último Semestre</option>
                                                <option value="año">Este Año</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group><Form.Label>Vendedor</Form.Label>
                                            <Form.Select value={filtrosReporte.vendedor_id} onChange={e => setFiltrosReporte({ ...filtrosReporte, vendedor_id: e.target.value })}>
                                                <option value="">Todos</option>
                                                {vendedores.map(v => <option key={v.id_vendedor} value={v.id_vendedor}>{v.nombre}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}><Form.Group><Form.Label>Desde</Form.Label><Form.Control type="date" value={filtrosReporte.fecha_inicio} onChange={e => setFiltrosReporte({ ...filtrosReporte, fecha_inicio: e.target.value })} /></Form.Group></Col>
                                    <Col md={2}><Form.Group><Form.Label>Hasta</Form.Label><Form.Control type="date" value={filtrosReporte.fecha_fin} onChange={e => setFiltrosReporte({ ...filtrosReporte, fecha_fin: e.target.value })} /></Form.Group></Col>
                                    <Col md={2}><Button type="submit" variant="primary" className="w-100" disabled={loadingReportes}>{loadingReportes ? <Spinner animation="border" size="sm" /> : '📊 Generar'}</Button></Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>
                    {reportes ? (
                        <>
                            <Row className="mb-4">
                                <Col md={4}><Card className="bg-success text-white"><Card.Body><h3>${reportes.total_general?.toLocaleString()}</h3><p className="mb-0">Total Ventas</p></Card.Body></Card></Col>
                                <Col md={4}><Card className="bg-info text-white"><Card.Body><h3>{reportes.cantidad_ventas}</h3><p className="mb-0">Cantidad de Ventas</p></Card.Body></Card></Col>
                                <Col md={4}><Card className="bg-warning text-dark"><Card.Body><h6>{reportes.fecha_inicio} - {reportes.fecha_fin}</h6><p className="mb-0">Período</p></Card.Body></Card></Col>
                            </Row>
                            <Row>
                                <Col md={6} className="mb-4">
                                    <Card className="shadow-sm h-100">
                                        <Card.Header className="bg-primary text-white"><h6 className="mb-0">💼 Ventas por Vendedor</h6></Card.Header>
                                        <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            <Table size="sm" hover>
                                                <thead><tr><th>Vendedor</th><th>Ventas</th><th>Total</th></tr></thead>
                                                <tbody>{reportes.ventas_por_vendedor?.map((v, i) => <tr key={i}><td>{v.vendedor__nombre}</td><td>{v.cantidad}</td><td className="text-success fw-bold">${v.total?.toLocaleString()}</td></tr>)}</tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6} className="mb-4">
                                    <Card className="shadow-sm h-100">
                                        <Card.Header className="bg-info text-white"><h6 className="mb-0">🏪 Top Clientes</h6></Card.Header>
                                        <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            <Table size="sm" hover>
                                                <thead><tr><th>Negocio/Cliente</th><th>Ventas</th><th>Total</th></tr></thead>
                                                <tbody>{reportes.ventas_por_cliente?.map((c, i) => <tr key={i}><td><strong>{c.nombre_negocio || c.cliente_nombre}</strong><br /><small className="text-muted">{c.cliente_nombre}</small></td><td>{c.cantidad}</td><td className="text-success fw-bold">${c.total?.toLocaleString()}</td></tr>)}</tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={12}>
                                    <Card className="shadow-sm">
                                        <Card.Header className="bg-warning text-dark"><h6 className="mb-0">📦 Ventas por Producto</h6></Card.Header>
                                        <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            <Table size="sm" hover>
                                                <thead><tr><th>Producto</th><th>Cantidad</th><th>Total</th></tr></thead>
                                                <tbody>{reportes.ventas_por_producto?.map((p, i) => <tr key={i}><td>{p.producto}</td><td>{p.cantidad}</td><td className="text-success fw-bold">${p.total?.toLocaleString()}</td></tr>)}</tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    ) : <Alert variant="info">Selecciona un período y haz clic en "Generar" para ver los reportes</Alert>}
                </Tab>
            </Tabs>


            {/* MODAL DETALLE VENTA */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" scrollable>
                <Modal.Header closeButton><Modal.Title>Detalle de Venta</Modal.Title></Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {selectedVenta && (
                        <>
                            <Row className="mb-3">
                                {selectedVenta.nombre_negocio && <Col xs={12} className="mb-2"><strong>Negocio:</strong> <span className="text-primary fw-bold">{selectedVenta.nombre_negocio}</span></Col>}
                                <Col><strong>Cliente:</strong> {selectedVenta.cliente_nombre}</Col>
                                <Col><strong>Vendedor:</strong> {selectedVenta.vendedor_nombre}</Col>
                                <Col><strong>Fecha:</strong> {new Date(selectedVenta.fecha).toLocaleString()}</Col>
                            </Row>
                            <Table striped bordered size="sm">
                                <thead><tr><th>Producto</th><th>Cant</th><th>Precio</th><th>Subtotal</th></tr></thead>
                                <tbody>
                                    {selectedVenta.detalles?.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.nombre || item.producto || 'Sin nombre'}</td>
                                            <td>{item.cantidad}</td>
                                            <td>${item.precio?.toLocaleString()}</td>
                                            <td>${(item.cantidad * item.precio).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot><tr><td colSpan="3" className="text-end"><strong>Total:</strong></td><td><strong>${parseFloat(selectedVenta.total).toLocaleString()}</strong></td></tr></tfoot>
                            </Table>
                            {selectedVenta.productos_vencidos?.length > 0 && (
                                <div className="mt-4">
                                    <h6 className="text-danger border-bottom pb-2">⚠️ Productos Vencidos</h6>
                                    <Table striped bordered size="sm">
                                        <thead className="table-danger"><tr><th>Producto</th><th>Cantidad</th><th>Evidencias</th></tr></thead>
                                        <tbody>{selectedVenta.productos_vencidos.map((item, idx) => {
                                            const evidencias = selectedVenta.evidencias?.filter(e => e.producto_id === item.id) || [];
                                            return (
                                                <tr key={idx}>
                                                    <td>{item.producto}</td>
                                                    <td>{item.cantidad}</td>
                                                    <td>
                                                        {evidencias.length > 0 ? (
                                                            <div className="d-flex flex-wrap gap-2">
                                                                {evidencias.map((ev, i) => (
                                                                    <img
                                                                        key={i}
                                                                        src={ev.imagen.startsWith('http') ? ev.imagen : `http://localhost:8000${ev.imagen}`}
                                                                        alt={`Evidencia ${i + 1}`}
                                                                        style={{ maxWidth: '100px', maxHeight: '80px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ddd' }}
                                                                        onClick={() => window.open(ev.imagen.startsWith('http') ? ev.imagen : `http://localhost:8000${ev.imagen}`, '_blank')}
                                                                    />
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">{item.motivo || 'Sin foto'}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}</tbody>
                                    </Table>
                                </div>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success" onClick={() => imprimirTicket(selectedVenta)}>
                        <i className="bi bi-printer me-1"></i> Imprimir Ticket
                    </Button>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cerrar</Button>
                </Modal.Footer>
            </Modal>

            {/* MODAL DETALLE PEDIDO */}
            <Modal show={showPedidoModal} onHide={() => setShowPedidoModal(false)} size="lg" scrollable>
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>📦 Detalle de Pedido</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {selectedPedido && (
                        <>
                            <Row className="mb-3">
                                <Col xs={12} className="mb-2">
                                    <Badge bg="primary" className="me-2">{selectedPedido.numero_pedido}</Badge>
                                    <Badge bg={selectedPedido.estado === 'ENTREGADA' ? 'success' : 'warning'}>{selectedPedido.estado}</Badge>
                                </Col>
                                <Col md={6}><strong>Cliente:</strong> {selectedPedido.cliente_nombre || '-'}</Col>
                                <Col md={6}><strong>Teléfono:</strong> {selectedPedido.telefono || '-'}</Col>
                                <Col md={12} className="mt-2"><strong>Dirección:</strong> {selectedPedido.direccion_entrega || '-'}</Col>
                                <Col md={6} className="mt-2"><strong>Fecha Entrega:</strong> {selectedPedido.fecha_entrega}</Col>
                                <Col md={6} className="mt-2"><strong>Vendedor:</strong> {selectedPedido.vendedor || '-'}</Col>
                            </Row>
                            <hr />
                            <h6>Productos del Pedido:</h6>
                            <Table striped bordered size="sm">
                                <thead><tr><th>Producto</th><th>Cant</th><th>Precio</th><th>Subtotal</th></tr></thead>
                                <tbody>
                                    {selectedPedido.detalles_info?.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.producto_nombre || item.producto || 'Sin nombre'}</td>
                                            <td>{item.cantidad}</td>
                                            <td>${parseFloat(item.precio_unitario || 0).toLocaleString()}</td>
                                            <td>${parseFloat(item.subtotal || item.cantidad * item.precio_unitario || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot><tr><td colSpan="3" className="text-end"><strong>Total:</strong></td><td><strong>${parseFloat(selectedPedido.total || 0).toLocaleString()}</strong></td></tr></tfoot>
                            </Table>
                            {selectedPedido.notas && (
                                <Alert variant="info" className="mt-3">
                                    <strong>Notas:</strong> {selectedPedido.notas}
                                </Alert>
                            )}

                            {/* 🆕 NOVEDADES/VENCIDAS del Pedido */}
                            {selectedPedido.novedades && selectedPedido.novedades.length > 0 && (
                                <div className="mt-4">
                                    <h6 className="text-danger border-bottom pb-2">⚠️ Novedades / Productos Devueltos</h6>
                                    <Table striped bordered size="sm">
                                        <thead className="table-warning">
                                            <tr><th>Producto</th><th>Cantidad</th><th>Motivo</th></tr>
                                        </thead>
                                        <tbody>
                                            {selectedPedido.novedades.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>{item.producto || '-'}</td>
                                                    <td><Badge bg="danger">{item.cantidad}</Badge></td>
                                                    <td><small>{item.motivo || 'Sin especificar'}</small></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}

                            {/* 🆕 FOTOS DE EVIDENCIA del Pedido */}
                            {selectedPedido.evidencias && selectedPedido.evidencias.length > 0 && (
                                <div className="mt-4">
                                    <h6 className="text-info border-bottom pb-2">📷 Fotos de Evidencia</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {selectedPedido.evidencias.map((ev, i) => (
                                            <img
                                                key={i}
                                                src={ev.imagen.startsWith('http') ? ev.imagen : `http://localhost:8000${ev.imagen}`}
                                                alt={`Evidencia ${i + 1}`}
                                                style={{ maxWidth: '150px', maxHeight: '120px', cursor: 'pointer', borderRadius: '8px', border: '2px solid #ddd', objectFit: 'cover' }}
                                                onClick={() => window.open(ev.imagen.startsWith('http') ? ev.imagen : `http://localhost:8000${ev.imagen}`, '_blank')}
                                                title={`${ev.producto_nombre || 'Producto'} - ${ev.motivo || 'Sin motivo'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPedidoModal(false)}>Cerrar</Button>
                </Modal.Footer>
            </Modal>

            {/* MODAL CLIENTE */}
            <Modal show={showClienteModal} onHide={() => setShowClienteModal(false)} size="lg">
                <Modal.Header closeButton><Modal.Title>{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</Modal.Title></Modal.Header>
                <Form onSubmit={handleSaveCliente}>
                    <Modal.Body>
                        <Row>
                            <Col md={8}><Form.Group className="mb-3"><Form.Label>Nombre Negocio</Form.Label><Form.Control required value={clienteForm.nombre_negocio} onChange={e => setClienteForm({ ...clienteForm, nombre_negocio: e.target.value })} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Orden</Form.Label><Form.Control type="number" value={clienteForm.orden} onChange={e => setClienteForm({ ...clienteForm, orden: e.target.value })} /></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Contacto</Form.Label><Form.Control value={clienteForm.nombre_contacto} onChange={e => setClienteForm({ ...clienteForm, nombre_contacto: e.target.value })} /></Form.Group></Col>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Teléfono</Form.Label><Form.Control value={clienteForm.telefono} onChange={e => setClienteForm({ ...clienteForm, telefono: e.target.value })} /></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Tipo Negocio</Form.Label><Form.Control placeholder="Ej: Tienda, Supermercado" value={clienteForm.tipo_negocio} onChange={e => setClienteForm({ ...clienteForm, tipo_negocio: e.target.value })} /></Form.Group></Col>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Dirección</Form.Label><Form.Control value={clienteForm.direccion} onChange={e => setClienteForm({ ...clienteForm, direccion: e.target.value })} /></Form.Group></Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Días de Visita</Form.Label>
                            <div className="d-flex flex-wrap gap-3">
                                {['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'].map(dia => (
                                    <Form.Check key={dia} type="checkbox" label={dia} checked={Array.isArray(clienteForm.dia_visita) && clienteForm.dia_visita.includes(dia)}
                                        onChange={(e) => {
                                            const dias = Array.isArray(clienteForm.dia_visita) ? [...clienteForm.dia_visita] : [];
                                            if (e.target.checked) dias.push(dia);
                                            else { const idx = dias.indexOf(dia); if (idx > -1) dias.splice(idx, 1); }
                                            setClienteForm({ ...clienteForm, dia_visita: dias });
                                        }}
                                    />
                                ))}
                            </div>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowClienteModal(false)}>Cancelar</Button>
                        <Button variant="primary" type="submit">Guardar</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container >
    );
};

export default ReporteVentasRuta;
