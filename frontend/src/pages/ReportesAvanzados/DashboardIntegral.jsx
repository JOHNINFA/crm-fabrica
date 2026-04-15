import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Nav, Badge, Table, Alert } from 'react-bootstrap';
import { FaCalendarAlt, FaChartLine, FaBoxOpen, FaExclamationTriangle, FaMoneyBillWave, FaTruck, FaCashRegister, FaCheckCircle, FaClock } from 'react-icons/fa';
import './DashboardIntegral.css';
import { ordenarComoEnCargue } from './cargueOrden';

const API_URL = process.env.REACT_APP_API_URL || '/api';
const VENDEDORES_IDS = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];

const DashboardIntegral = ({ onVolver }) => {
    const [fechaConsulta, setFechaConsulta] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('general');
    const [metricasGenerales, setMetricasGenerales] = useState({});
    const [metricasId, setMetricasId] = useState({});
    const [showNequiDetail, setShowNequiDetail] = useState({});
    const [showDaviDetail, setShowDaviDetail] = useState({});
    const [modoFiltro, setModoFiltro] = useState('dia'); // 'dia' | 'semana' | 'mes' | 'rango'
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [mesConsulta, setMesConsulta] = useState(() => {
        const hoy = new Date();
        return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    });
    const [labelPeriodo, setLabelPeriodo] = useState('');

    const formatFechaCorta = (fechaStr) => {
        if (!fechaStr) return '';
        const [y, m, d] = fechaStr.split('-');
        return `${d}/${m}/${y}`;
    };

    const getDatesInRange = (inicio, fin) => {
        const dates = [];
        const current = new Date(inicio + 'T00:00:00');
        const end = new Date(fin + 'T00:00:00');
        while (current <= end) {
            const y = current.getFullYear();
            const m = String(current.getMonth() + 1).padStart(2, '0');
            const d = String(current.getDate()).padStart(2, '0');
            dates.push(`${y}-${m}-${d}`);
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    const getRango = () => {
        if (modoFiltro === 'dia') {
            return { inicio: fechaConsulta, fin: fechaConsulta };
        }
        if (modoFiltro === 'semana') {
            const d = new Date(fechaConsulta + 'T00:00:00');
            const dow = d.getDay();
            const diffLunes = dow === 0 ? -6 : 1 - dow;
            const lunes = new Date(d);
            lunes.setDate(d.getDate() + diffLunes);
            const domingo = new Date(lunes);
            domingo.setDate(lunes.getDate() + 6);
            const fmt = (dt) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
            return { inicio: fmt(lunes), fin: fmt(domingo) };
        }
        if (modoFiltro === 'mes') {
            const [y, m] = mesConsulta.split('-').map(Number);
            const ultimoDia = new Date(y, m, 0).getDate();
            return {
                inicio: `${y}-${String(m).padStart(2,'0')}-01`,
                fin: `${y}-${String(m).padStart(2,'0')}-${String(ultimoDia).padStart(2,'0')}`
            };
        }
        if (modoFiltro === 'rango') {
            if (!fechaInicio || !fechaFin) return null;
            return { inicio: fechaInicio, fin: fechaFin };
        }
        return null;
    };

    const getDiaSemana = (fechaStr) => {
        const dias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
        const fecha = new Date(fechaStr + 'T00:00:00');
        const indice = fecha.getDay() === 0 ? 6 : fecha.getDay() - 1;
        return dias[indice];
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0);

    const normalizeName = (name) => {
        if (!name) return '';
        return name.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
    };

    // ── Consulta Principal ──────────────────────────────────────────────────
    const consultarDatos = async () => {
        const rango = getRango();
        if (!rango) { setError('Selecciona un rango de fechas válido.'); return; }

        setLoading(true);
        setError(null);
        setSearched(true);

        try {
            const fechas = getDatesInRange(rango.inicio, rango.fin);
            const esRango = fechas.length > 1;

            // Calcular label del período
            const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
            if (modoFiltro === 'dia') setLabelPeriodo(rango.inicio);
            else if (modoFiltro === 'semana') setLabelPeriodo(`Semana ${formatFechaCorta(rango.inicio)} — ${formatFechaCorta(rango.fin)}`);
            else if (modoFiltro === 'mes') {
                const [y, m] = mesConsulta.split('-');
                setLabelPeriodo(`${meses[parseInt(m)-1]} ${y}`);
            }
            else setLabelPeriodo(`${formatFechaCorta(rango.inicio)} — ${formatFechaCorta(rango.fin)}`);

            const fechaSiguiente = new Date(rango.fin + 'T00:00:00');
            fechaSiguiente.setDate(fechaSiguiente.getDate() + 1);
            const fmt = (dt) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
            const fechaSiguienteStr = fmt(fechaSiguiente);

            // Ventas ruta y pedidos — soportan rango directo en backend
            const ventasRutaP = fetch(
                esRango
                    ? `${API_URL}/ventas-ruta/?fecha_inicio=${rango.inicio}&fecha_fin=${rango.fin}`
                    : `${API_URL}/ventas-ruta/?fecha=${rango.inicio}`
            ).then(r => r.ok ? r.json() : []);

            const pedidosP = esRango
                ? fetch(`${API_URL}/pedidos/?fecha_desde=${rango.inicio}&fecha_hasta=${rango.fin}`)
                    .then(r => r.ok ? r.json() : [])
                    .then(data => {
                        const arr = Array.isArray(data) ? data : (data.results || []);
                        return arr.filter(p => p.fecha_entrega >= rango.inicio && p.fecha_entrega <= rango.fin);
                    })
                : fetch(`${API_URL}/pedidos/?fecha_entrega=${rango.inicio}`).then(r => r.ok ? r.json() : []);

            const turnosP = fetch(`${API_URL}/turnos/?fecha_desde=${rango.inicio}&fecha_hasta=${fechaSiguienteStr}`)
                .then(r => r.ok ? r.json() : []).catch(() => []);

            const productosP = fetch(`${API_URL}/productos/`).then(r => r.ok ? r.json() : []).catch(() => []);

            const vendedoresCargueP = fetch(`${API_URL}/vendedores-cargue/`)
                .then(r => r.ok ? r.json() : []).catch(() => []);

            // Cargue: para día único igual que antes; para rango se acumula por producto
            let cargueAcumuladoPorId = {};
            VENDEDORES_IDS.forEach(id => { cargueAcumuladoPorId[id] = {}; });

            if (!esRango) {
                const dia = getDiaSemana(rango.inicio);
                const carguePromises = VENDEDORES_IDS.map(id =>
                    fetch(`${API_URL}/obtener-cargue/?vendedor_id=${id}&dia=${dia}&fecha=${rango.inicio}`)
                        .then(r => r.ok ? r.json() : {}).catch(() => ({}))
                );
                const cargues = await Promise.all(carguePromises);
                VENDEDORES_IDS.forEach((id, i) => { cargueAcumuladoPorId[id] = cargues[i]; });
            } else {
                // Rango: fetches secuenciales por fecha, acumulando por producto
                for (const fecha of fechas) {
                    const dia = getDiaSemana(fecha);
                    const carguePromises = VENDEDORES_IDS.map(id =>
                        fetch(`${API_URL}/obtener-cargue/?vendedor_id=${id}&dia=${dia}&fecha=${fecha}`)
                            .then(r => r.ok ? r.json() : {}).catch(() => ({}))
                    );
                    const cargues = await Promise.all(carguePromises);
                    VENDEDORES_IDS.forEach((id, i) => {
                        const cargueDelDia = cargues[i] || {};
                        Object.entries(cargueDelDia).forEach(([nombre, datos]) => {
                            if (!cargueAcumuladoPorId[id][nombre]) {
                                cargueAcumuladoPorId[id][nombre] = {
                                    ...datos,
                                    cantidad: 0, dctos: 0, adicional: 0,
                                    devoluciones: 0, vencidas: 0, total: 0, neto: 0,
                                    nequi: 0, daviplata: 0, descuentos: 0, base_caja: 0,
                                };
                            }
                            const acc = cargueAcumuladoPorId[id][nombre];
                            acc.cantidad     += parseInt(datos.cantidad     || 0);
                            acc.dctos        += parseInt(datos.dctos        || 0);
                            acc.adicional    += parseInt(datos.adicional    || 0);
                            acc.devoluciones += parseInt(datos.devoluciones || 0);
                            acc.vencidas     += parseInt(datos.vencidas     || 0);
                            acc.total        += parseInt(datos.total        || 0);
                            acc.neto         += parseFloat(datos.neto       || 0);
                            acc.nequi        += parseFloat(datos.nequi      || 0);
                            acc.daviplata    += parseFloat(datos.daviplata  || 0);
                            acc.descuentos   += parseFloat(datos.descuentos || 0);
                            acc.base_caja    += parseFloat(datos.base_caja  || 0);
                            if (!acc.valor && datos.valor) acc.valor = datos.valor;
                        });
                    });
                }
            }

            const ventasRutaData = await ventasRutaP;
            const pedidosData = await pedidosP;
            const turnosRaw = await turnosP;
            const productosRaw = await productosP;
            const vendedoresCargue = await vendedoresCargueP;

            // Mapa: "ID2" → "JAVIER TIBAVIJA" (normalizado a mayúsculas)
            const nombrePorId = {};
            vendedoresCargue.forEach(v => {
                if (v.id && v.nombre) nombrePorId[v.id] = v.nombre.trim().toUpperCase();
            });

            // Construir mapa de precios: nombre normalizado → precio_cargue (igual que PlantillaOperativa)
            const productosArr = Array.isArray(productosRaw) ? productosRaw : (productosRaw.results || []);
            const preciosMap = {};
            productosArr.forEach(p => {
                const nombre = normalizeName(p.nombre || p.name || '');
                let precio;
                if (p.precio_cargue !== null && p.precio_cargue !== undefined) {
                    precio = parseFloat(p.precio_cargue) || 0;
                } else {
                    const precioBase = parseFloat(p.precio || p.price || 0);
                    precio = precioBase > 0 ? Math.round(precioBase * 0.65) : 0;
                }
                if (nombre && precio > 0) preciosMap[nombre] = precio;
            });

            // POS por Turno (8am→8am)
            const ventanaInicio = new Date(`${rango.inicio}T08:00:00`);
            const ventanaFin = new Date(`${fechaSiguienteStr}T08:00:00`);
            const turnosData = Array.isArray(turnosRaw) ? turnosRaw : (turnosRaw.results || []);
            const turnosDia = turnosData.filter(t => {
                const inicio = new Date(t.fecha_inicio);
                return inicio >= ventanaInicio && inicio < ventanaFin;
            });

            const turnoActivo = turnosDia.find(t => t.estado === 'ACTIVO');
            const estadoTurno = turnoActivo ? 'ACTIVO' : (turnosDia.length > 0 ? 'CERRADO' : 'SIN_TURNO');
            const totalPosVentas = turnosDia.reduce((s, t) => s + parseFloat(t.total_ventas || 0), 0);
            const totalPosEfectivo = turnosDia.reduce((s, t) => s + parseFloat(t.total_efectivo || 0), 0);
            const totalPosDigital = turnosDia.reduce((s, t) => s + parseFloat(t.total_tarjeta || 0) + parseFloat(t.total_otros || 0), 0);
            const totalPos = totalPosVentas > 0 ? totalPosVentas : (totalPosEfectivo + totalPosDigital);

            // Procesamiento por ID
            let sumatoriaTotalIDs = 0;
            let totalDevolucionesGlobal = 0;
            const rankingsGlobales = {};
            const analisis_ids = {};

            VENDEDORES_IDS.forEach((idSheet, index) => {
                // obtener-cargue devuelve un dict {nombre_producto: {datos...}}
                const cargueObj = cargueAcumuladoPorId[idSheet] || {};
                // Convertir a array y aplicar el orden oficial
                const cargueDatosDesordenado = Object.entries(cargueObj).filter(([nombre]) => nombre !== '__pagos__').map(([nombre, datos]) => {
                    // Prioridad de precio (igual que PlantillaOperativa):
                    // 1. Catálogo actual (precio_cargue) — fuente de verdad
                    // 2. precios_alternos del cargue (VENDEDORES o CAJA)
                    // 3. datos.valor histórico como último recurso
                    const nombreNorm = normalizeName(nombre);
                    let precio = preciosMap[nombreNorm] || 0;
                    if (precio === 0 && datos.precios_alternos) {
                        precio = parseFloat(datos.precios_alternos["VENDEDORES"] || datos.precios_alternos["PRECIOS CAJA"] || 0);
                    }
                    if (precio === 0) {
                        precio = parseFloat(datos.valor || 0);
                    }
                    const esCanastilla = nombre.toUpperCase().includes('CANASTILLA');
                    if (esCanastilla) precio = 0;

                    const cant = parseInt(datos.cantidad || 0);
                    const dctos = parseInt(datos.dctos || 0);
                    const adic = parseInt(datos.adicional || 0);
                    const devol = parseInt(datos.devoluciones || 0);
                    const venc = parseInt(datos.vencidas || 0);
                    // Calcular neto igual que Cargue (ResumenVentas): total × valor
                    // Usar datos.total del endpoint (guardado en BD), no recalcular desde cant+adic-devol
                    const totalReal = parseInt(datos.total || 0);
                    const netoFinal = esCanastilla ? 0 : (totalReal * precio);

                    return {
                        producto: nombre,
                        cantidad: cant,
                        dctos, adicional: adic,
                        devoluciones: devol,
                        vencidas: venc,
                        total: totalReal,
                        valor: precio,
                        neto: netoFinal,
                        v: datos.v,
                        d: datos.d,
                        // Campos de resumen y cumplimiento
                        nequi: datos.nequi,
                        daviplata: datos.daviplata,
                        descuentos: datos.descuentos,
                        base_caja: datos.base_caja,
                        concepto: datos.concepto,
                        licencia_transporte: datos.licencia_transporte,
                        soat: datos.soat,
                        uniforme: datos.uniforme,
                        no_locion: datos.no_locion,
                        no_accesorios: datos.no_accesorios,
                        capacitacion_carnet: datos.capacitacion_carnet,
                        higiene: datos.higiene,
                        estibas: datos.estibas,
                        desinfeccion: datos.desinfeccion,
                    };
                });
                
                // Ordenar los productos como en el Cargue real
                const cargueDatos = ordenarComoEnCargue(cargueDatosDesordenado, getDiaSemana(rango.inicio), idSheet);
                
                const ventasID = ventasRutaData.filter(v => v.estado !== 'ANULADA' && v.vendedor_id === idSheet);
                const nombreVendedorId = nombrePorId[idSheet] || '';
                const pedidosID = pedidosData.filter(p => {
                    if (p.estado === 'ANULADA') return false;
                    // Primero intentar por asignado_a_id (pedidos asignados explícitamente)
                    if (p.asignado_a_id && p.asignado_a_id === idSheet) return true;
                    // Luego por nombre de vendedor (pedidos entregados desde app sin asignación explícita)
                    if (nombreVendedorId && p.vendedor && p.vendedor.trim().toUpperCase() === nombreVendedorId) return true;
                    return false;
                });

                let nequi = 0, daviplata = 0, efectivo = 0, descuentos = 0, totalPedidos = 0, totalRuta = 0;
                let clientesVencidas = {};
                let productosVentaRanking = {};
                let listaNequi = [], listaDavi = [];

                pedidosID.forEach(p => {
                    const total = parseFloat(p.total || 0);
                    totalPedidos += total;
                    if (p.metodo_pago === 'Nequi') {
                        nequi += total;
                        listaNequi.push({ cliente: p.cliente_nombre || p.nombre_negocio || 'Pedido CRM', valor: total });
                    }
                    else if (p.metodo_pago === 'Daviplata') {
                        daviplata += total;
                        listaDavi.push({ cliente: p.cliente_nombre || p.nombre_negocio || 'Pedido CRM', valor: total });
                    }
                    else efectivo += total;
                    descuentos += parseFloat(p.descuento || 0);
                    (p.productos_vencidos || []).forEach(vi => {
                        const cli = normalizeName(p.cliente_nombre || p.nombre_negocio || 'Desconocido');
                        clientesVencidas[cli] = (clientesVencidas[cli] || 0) + parseInt(vi.cantidad || 0);
                    });
                });

                ventasID.forEach(v => {
                    const total = parseFloat(v.total || 0);
                    totalRuta += total;
                    if (v.metodo_pago === 'Nequi') {
                        nequi += total;
                        listaNequi.push({ cliente: v.cliente_nombre || v.nombre_negocio || 'Cliente Ruta', valor: total });
                    }
                    else if (v.metodo_pago === 'Daviplata') {
                        daviplata += total;
                        listaDavi.push({ cliente: v.cliente_nombre || v.nombre_negocio || 'Cliente Ruta', valor: total });
                    }
                    else efectivo += total;
                    descuentos += parseFloat(v.descuento || v.descuento_aplicado || 0);
                    (v.productos_vencidos || []).forEach(vi => {
                        const cli = normalizeName(v.cliente_nombre || v.nombre_negocio || 'Cliente Ruta');
                        clientesVencidas[cli] = (clientesVencidas[cli] || 0) + parseInt(vi.cantidad || 0);
                    });

                });

                // Cargue físico — los campos resumen (total_despacho, venta, etc.) están en CADA registro
                // Datos del primer registro para cumplimiento y datos compartidos
                const primerRegistro = cargueDatos[0] || {};
                const jornadaCompletada = primerRegistro.v === true && primerRegistro.d === true;

                // Calcular totales desde todos los productos (excluyendo canastillas para valores de dinero bruto)
                let cargue_total_despacho = 0;
                cargueDatos.forEach(c => {
                    if (!c.producto.toUpperCase().includes('CANASTILLA')) {
                        const cant = parseInt(c.cantidad || 0);
                        const adic = parseInt(c.adicional || 0);
                        cargue_total_despacho += (cant + adic) * parseFloat(c.valor || 0);
                    }
                });
                // Nequi, daviplata, descuentos vienen de __pagos__ (CarguePagos) — no de filas de producto
                const pagosResumen     = cargueAcumuladoPorId[idSheet]['__pagos__'] || {};
                const cargue_nequi     = parseFloat(pagosResumen.nequi      || 0);
                const cargue_daviplata = parseFloat(pagosResumen.daviplata  || 0);
                const cargue_descuentos= parseFloat(pagosResumen.descuentos || 0);
                const cargue_pedidos   = parseFloat(primerRegistro.pedidos  || 0);
                const base_caja        = parseFloat(primerRegistro.base_caja|| 0);

                // Calcular neto total (suma de neto de cada producto) -> esto equivale al TOTAL DESPACHO de Cargue original
                let cargue_neto_total = 0;
                cargueDatos.forEach(c => { cargue_neto_total += parseFloat(c.neto || 0); });

                // Devoluciones y Vencidas por producto (para rankings)
                let cantDevol = 0, valorDevol = 0;
                let cantVencidasFvto = 0, valorVencidasFvto = 0;
                const topDevol = [];

                cargueDatos.forEach(c => {
                    const devol  = parseInt(c.devoluciones || 0);
                    const venc   = parseInt(c.vencidas     || 0);
                    const precio = parseFloat(c.valor      || 0);

                    if (venc > 0) {
                        cantVencidasFvto  += venc;
                        valorVencidasFvto += venc * precio;
                    }

                    if (venc > 0) {
                        cantDevol  += venc;
                        valorDevol += venc * precio;
                        const prod = normalizeName(c.producto);
                        topDevol.push({ nombre: prod, cantidad: venc, valor_perdido: venc * precio });
                        if (!rankingsGlobales[prod]) rankingsGlobales[prod] = { cantidad: 0, valor: 0 };
                        rankingsGlobales[prod].cantidad += venc;
                        rankingsGlobales[prod].valor    += venc * precio;
                    }

                    const vendidas = parseInt(c.total || 0);
                    if (vendidas > 0 && !c.producto.toUpperCase().includes('CANASTILLA')) {
                        const prod = normalizeName(c.producto);
                        productosVentaRanking[prod] = (productosVentaRanking[prod] || 0) + vendidas;
                    }
                });
                topDevol.sort((a, b) => b.cantidad - a.cantidad);

                const arrClientes = Object.entries(clientesVencidas).map(([nombre, cantidad]) => ({ nombre, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
                const arrProds = Object.entries(productosVentaRanking).map(([nombre, cantidad]) => ({ nombre, cantidad })).sort((a, b) => b.cantidad - a.cantidad);

                // Usar los totales calculados
                const recaudo = cargue_neto_total > 0 ? cargue_neto_total : (nequi + daviplata + efectivo);
                let cumplimiento = 0;
                if (cargue_total_despacho > 0) {
                    cumplimiento = Math.min(((cargue_neto_total / cargue_total_despacho) * 100).toFixed(1), 100);
                }

                totalDevolucionesGlobal += valorDevol;

                const despacho_venta_real = cargue_neto_total;
                const total_pedidos_real  = Math.max(totalPedidos, cargue_pedidos);
                sumatoriaTotalIDs += (cargue_neto_total + total_pedidos_real + base_caja); // Priorizar el mayor o cargue
                const venta_total_real    = despacho_venta_real + total_pedidos_real; // VENTA = VENTA RUTA + PEDIDOS

                analisis_ids[idSheet] = {
                    jornada_completada: jornadaCompletada,
                    despacho_inicial  : cargue_total_despacho,
                    despacho_venta    : despacho_venta_real,
                    total_pedidos     : total_pedidos_real,
                    venta_total       : venta_total_real + base_caja, // VENTA TOTAL = VENTA + BASE CAJA
                    total_recaudo     : (cargue_nequi + cargue_daviplata + (despacho_venta_real - cargue_nequi - cargue_daviplata)),
                    diferencia        : cargue_neto_total - cargue_total_despacho,
                    base_caja         : base_caja,
                    nequi: cargue_nequi,
                    daviplata: cargue_daviplata,
                    lista_nequi: listaNequi,
                    lista_davi: listaDavi,
                    efectivo: (despacho_venta_real + total_pedidos_real) - cargue_nequi - cargue_daviplata - cargue_descuentos,
                    descuentos: cargue_descuentos,
                    pedidos_vs_ruta   : { pedidos: totalPedidos, ruta: totalRuta },
                    devoluciones_fisicas: { cantidad: cantDevol, valor: valorDevol },
                    vencidas_fvto     : { cantidad: cantVencidasFvto, valor: valorVencidasFvto },
                    top_devueltos     : topDevol.slice(0, 5),
                    top_vendidos      : arrProds.slice(0, 5),
                    peores_clientes   : arrClientes.slice(0, 5),
                    cumplimiento,
                    // Datos crudos del cargue para tabla de productos y cumplimiento
                    productos_cargue  : cargueDatos,
                    responsable       : primerRegistro.responsable || '',
                    ruta              : primerRegistro.ruta || '',
                    cumplimiento_control: {
                        licencia_transporte: primerRegistro.licencia_transporte || '',
                        soat: primerRegistro.soat || '',
                        uniforme: primerRegistro.uniforme || '',
                        no_locion: primerRegistro.no_locion || '',
                        no_accesorios: primerRegistro.no_accesorios || '',
                        capacitacion_carnet: primerRegistro.capacitacion_carnet || '',
                        higiene: primerRegistro.higiene || '',
                        estibas: primerRegistro.estibas || '',
                        desinfeccion: primerRegistro.desinfeccion || '',
                    }
                };
            });

            const globalVencidasList = Object.entries(rankingsGlobales)
                .map(([nombre, d]) => ({ nombre, ...d })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);

            setMetricasGenerales({
                total_pos: totalPos,
                total_pos_efectivo: totalPosEfectivo,
                total_pos_digital: totalPosDigital,
                total_vendedores: sumatoriaTotalIDs,
                gran_total_dia: totalPos + sumatoriaTotalIDs,
                perdida_vencidas: totalDevolucionesGlobal,
                top_vencidas_globales: globalVencidasList,
                estado_turno: estadoTurno,
                turnos_dia: turnosDia.length,
            });

            setMetricasId(analisis_ids);

        } catch (err) {
            console.error(err);
            setError('Error calculando analíticas. Revisa los endpoints o intenta más tarde.');
        } finally {
            setLoading(false);
        }
    };

    // ── Render General ──────────────────────────────────────────────────────
    const renderMetricasGenerales = () => {
        if (!metricasGenerales.gran_total_dia && metricasGenerales.gran_total_dia !== 0) return null;

        const estadoBadge = metricasGenerales.estado_turno === 'ACTIVO'
            ? <Badge bg="success" className="ms-2"><FaClock className="me-1" />Turno POS ACTIVO</Badge>
            : metricasGenerales.estado_turno === 'CERRADO'
                ? <Badge bg="secondary" className="ms-2"><FaCheckCircle className="me-1" />Turno POS CERRADO</Badge>
                : <Badge bg="warning" text="dark" className="ms-2">Sin turno POS</Badge>;

        return (
            <div className="mt-4">
                <Row className="mb-4 g-3">
                    <Col md={4}>
                        <div className="metric-card">
                            <div className="metric-title"><FaChartLine className="me-2" />Venta Consolidada del Día</div>
                            <div className="metric-value text-primary">{formatCurrency(metricasGenerales.gran_total_dia)}</div>
                            <small className="text-muted">Sumatoria real de Calle y POS</small>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="metric-card success">
                            <div className="metric-title"><FaTruck className="me-2" />Total Calle (Vendedores)</div>
                            <div className="metric-value text-success">{formatCurrency(metricasGenerales.total_vendedores)}</div>
                            <small className="text-muted">Todo lo recolectado por los IDs</small>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="metric-card info">
                            <div className="metric-title"><FaCashRegister className="me-2" />Total POS (Mostrador)</div>
                            <div className="metric-value text-info">{formatCurrency(metricasGenerales.total_pos)}</div>
                            <small className="text-muted d-flex align-items-center flex-wrap">
                                Digital: {formatCurrency(metricasGenerales.total_pos_digital)} / Efectivo: {formatCurrency(metricasGenerales.total_pos_efectivo)}
                                {estadoBadge}
                            </small>
                        </div>
                    </Col>
                </Row>

                <Row>
                    <Col lg={6}>
                        <Card className="h-100 border-0 shadow-sm" style={{ borderLeft: '5px solid #dc3545' }}>
                            <Card.Body>
                                <h5 className="fw-bold mb-3 d-flex align-items-center text-danger">
                                    <FaExclamationTriangle className="me-2" /> Top Alertas de Producción (Devoluciones Globales)
                                </h5>
                                <div className="mb-3 d-flex justify-content-between align-items-center bg-light p-3 rounded">
                                    <span className="fw-bold">Pérdida estimada por devolución/vencimiento:</span>
                                    <span className="fs-5 fw-bold text-danger">{formatCurrency(metricasGenerales.perdida_vencidas)}</span>
                                </div>
                                <ul className="ranking-list">
                                    {metricasGenerales.top_vencidas_globales && metricasGenerales.top_vencidas_globales.length > 0
                                        ? metricasGenerales.top_vencidas_globales.map((item, idx) => (
                                            <li key={idx} className="ranking-item">
                                                <span><Badge bg="secondary" className="me-2">{idx + 1}</Badge>{item.nombre}</span>
                                                <div className="text-end">
                                                    <Badge bg="danger" className="me-2">{item.cantidad} unds</Badge>
                                                    <small className="text-muted">{formatCurrency(item.valor)}</small>
                                                </div>
                                            </li>
                                        ))
                                        : <div className="text-muted text-center my-4">Sin devoluciones registradas hoy.</div>
                                    }
                                </ul>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={6}>
                        <Card className="h-100 border-0 shadow-sm bg-light d-flex align-items-center justify-content-center">
                            <Card.Body className="text-center p-5">
                                <FaChartLine size={60} color="#cbd5e1" className="mb-3" />
                                <h5 className="text-muted">Módulo de Predicción IA (Próximamente)</h5>
                                <p className="text-muted small">El Agente IA utilizará esta data <br />para generar sugeridos inteligentes de producción.</p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* ── Tabla Comparativa entre IDs ── */}
                {Object.keys(metricasId).length > 0 && (
                    <Card className="border-0 shadow-sm mt-4">
                        <Card.Header className="bg-white border-bottom">
                            <h5 className="fw-bold mb-0" style={{ color: '#0c2c53' }}>
                                <FaTruck className="me-2" />Comparativo por ID — {labelPeriodo}
                            </h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div style={{ overflowX: 'auto' }}>
                                <Table hover size="sm" className="mb-0" style={{ fontSize: '0.85rem', minWidth: '700px' }}>
                                    <thead style={{ backgroundColor: '#0c2c53', color: 'white' }}>
                                        <tr>
                                            <th className="px-3 py-2">ID</th>
                                            <th className="text-center py-2">Estado</th>
                                            <th className="text-end py-2">Despacho Inicial</th>
                                            <th className="text-end py-2">Venta Ruta</th>
                                            <th className="text-end py-2">Pedidos</th>
                                            <th className="text-end py-2">Venta Total</th>
                                            <th className="text-end py-2">Efectivo</th>
                                            <th className="text-end py-2">Nequi</th>
                                            <th className="text-end py-2">Daviplata</th>
                                            <th className="text-end py-2">Vencidas</th>
                                            <th className="text-center py-2">Cumpl. %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {VENDEDORES_IDS.map(id => {
                                            const d = metricasId[id];
                                            if (!d) return (
                                                <tr key={id} style={{ backgroundColor: '#f8f9fa' }}>
                                                    <td className="px-3 py-2 fw-bold text-muted">{id}</td>
                                                    <td colSpan={10} className="text-center text-muted py-2">Sin datos</td>
                                                </tr>
                                            );
                                            return (
                                                <tr
                                                    key={id}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setActiveTab(id)}
                                                >
                                                    <td className="px-3 py-2 fw-bold" style={{ color: '#0c2c53' }}>{id}</td>
                                                    <td className="text-center py-2">
                                                        {d.jornada_completada
                                                            ? <Badge bg="success" style={{ fontSize: '0.7rem' }}>✅ OK</Badge>
                                                            : <Badge bg="warning" text="dark" style={{ fontSize: '0.7rem' }}>⚠️ Parcial</Badge>
                                                        }
                                                    </td>
                                                    <td className="text-end py-2 text-muted">{formatCurrency(d.despacho_inicial)}</td>
                                                    <td className="text-end py-2 fw-bold text-success">{formatCurrency(d.despacho_venta)}</td>
                                                    <td className="text-end py-2" style={{ color: '#e67e22' }}>{formatCurrency(d.total_pedidos)}</td>
                                                    <td className="text-end py-2 fw-bold" style={{ color: '#6f42c1' }}>{formatCurrency(d.venta_total)}</td>
                                                    <td className="text-end py-2">{formatCurrency(d.efectivo)}</td>
                                                    <td className="text-end py-2">{formatCurrency(d.nequi)}</td>
                                                    <td className="text-end py-2">{formatCurrency(d.daviplata)}</td>
                                                    <td className="text-end py-2 text-danger">{formatCurrency(d.vencidas_fvto?.valor || 0)}</td>
                                                    <td className="text-center py-2">
                                                        <Badge
                                                            bg={d.cumplimiento >= 80 ? 'success' : d.cumplimiento >= 50 ? 'warning' : 'danger'}
                                                            text={d.cumplimiento >= 50 && d.cumplimiento < 80 ? 'dark' : undefined}
                                                        >
                                                            {d.cumplimiento}%
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* Fila de totales */}
                                        <tr style={{ backgroundColor: '#e8f0fe', fontWeight: 'bold', borderTop: '2px solid #0c2c53' }}>
                                            <td className="px-3 py-2" style={{ color: '#0c2c53' }}>TOTAL</td>
                                            <td></td>
                                            <td className="text-end py-2">{formatCurrency(VENDEDORES_IDS.reduce((s, id) => s + (metricasId[id]?.despacho_inicial || 0), 0))}</td>
                                            <td className="text-end py-2 text-success">{formatCurrency(VENDEDORES_IDS.reduce((s, id) => s + (metricasId[id]?.despacho_venta || 0), 0))}</td>
                                            <td className="text-end py-2" style={{ color: '#e67e22' }}>{formatCurrency(VENDEDORES_IDS.reduce((s, id) => s + (metricasId[id]?.total_pedidos || 0), 0))}</td>
                                            <td className="text-end py-2" style={{ color: '#6f42c1' }}>{formatCurrency(VENDEDORES_IDS.reduce((s, id) => s + (metricasId[id]?.venta_total || 0), 0))}</td>
                                            <td className="text-end py-2">{formatCurrency(VENDEDORES_IDS.reduce((s, id) => s + (metricasId[id]?.efectivo || 0), 0))}</td>
                                            <td className="text-end py-2">{formatCurrency(VENDEDORES_IDS.reduce((s, id) => s + (metricasId[id]?.nequi || 0), 0))}</td>
                                            <td className="text-end py-2">{formatCurrency(VENDEDORES_IDS.reduce((s, id) => s + (metricasId[id]?.daviplata || 0), 0))}</td>
                                            <td className="text-end py-2 text-danger">{formatCurrency(VENDEDORES_IDS.reduce((s, id) => s + (metricasId[id]?.vencidas_fvto?.valor || 0), 0))}</td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                            <div className="text-muted px-3 py-2" style={{ fontSize: '0.75rem' }}>
                                💡 Haz click en cualquier fila para ver el detalle completo del ID
                            </div>
                        </Card.Body>
                    </Card>
                )}
            </div>
        );
    };

    // ── Render detalle por ID ───────────────────────────────────────────────
    const renderDetalleID = (id) => {
        const d = metricasId[id];
        if (!d) return <div className="text-center py-5 text-muted">Sin datos para este ID en la fecha seleccionada.</div>;

        return (
            <div className="mt-4">

                {/* Estado de la jornada */}
                <div className="mb-3">
                    {d.jornada_completada
                        ? <Badge bg="success" className="px-3 py-2 fs-6"><FaCheckCircle className="me-1" />Jornada COMPLETADA — Datos definitivos</Badge>
                        : <Badge bg="warning" text="dark" className="px-3 py-2 fs-6"><FaClock className="me-1" />Jornada EN PROCESO — Datos parciales</Badge>
                    }
                </div>

                {/* 4 KPIs principales — datos del panel Cargue */}
                <Row className="mb-4 g-3">
                    <Col lg={3} sm={6}>
                        <div className="metric-card">
                            <div className="metric-title">Total Despacho Inicial</div>
                            <div className="metric-value" style={{ color: '#0c2c53' }}>{formatCurrency(d.despacho_inicial + d.total_pedidos)}</div>
                            <small className="text-muted">Total despacho y pedidos</small>
                        </div>
                    </Col>
                    <Col lg={3} sm={6}>
                        <div className="metric-card success">
                            <div className="metric-title">Despacho Venta</div>
                            <div className="metric-value text-success">{formatCurrency(d.despacho_venta)}</div>
                            <small className="text-muted">Venta ruta</small>
                        </div>
                    </Col>
                    <Col lg={3} sm={6}>
                        <div className="metric-card warning">
                            <div className="metric-title">Total Pedidos</div>
                            <div className="metric-value" style={{ color: '#e67e22' }}>{formatCurrency(d.total_pedidos)}</div>
                            <small className="text-muted">Pedidos entregados</small>
                        </div>
                    </Col>
                    <Col lg={3} sm={6}>
                        <div className="metric-card" style={{ borderLeftColor: '#6f42c1' }}>
                            <div className="metric-title">Venta Total</div>
                            <div className="metric-value" style={{ color: '#6f42c1' }}>{formatCurrency(d.venta_total)}</div>
                            <small className="text-muted">Base Caja + Despacho + Pedidos</small>
                        </div>
                    </Col>
                </Row>

                {/* Formas de Ingreso / Pagos Digitales / Vencidas */}
                <Row className="mb-4 g-3">
                    <Col md={4} className="d-flex flex-column gap-3">
                        {/* EFECTIVO Card */}
                        <Card className="flex-fill border-0 shadow-sm" style={{ borderLeft: '4px solid #198754' }}>
                            <Card.Body className="d-flex justify-content-between align-items-center p-3">
                                <div>
                                    <h6 className="mb-0 fw-bold text-muted" style={{ fontSize: '0.8rem' }}>EFECTIVO TOTAL A ENTREGAR</h6>
                                    <h4 className="mb-0 fw-bold mt-1 text-success">{formatCurrency(d.efectivo + (d.base_caja || 0))}</h4>
                                    <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                                        Venta {formatCurrency(d.efectivo)} + Base {formatCurrency(d.base_caja || 0)}
                                    </div>
                                </div>
                                <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '40px', height: '40px', backgroundColor: '#d1e7dd' }}>
                                    <FaCashRegister className="text-success" />
                                </div>
                            </Card.Body>
                        </Card>

                        {/* DEDUCCIONES Card (Divided in 2) */}
                        <Card className="flex-fill border-0 shadow-sm" style={{ borderLeft: '4px solid #dc3545' }}>
                            <Card.Body className="p-3 d-flex flex-column justify-content-center">
                                <h6 className="mb-3 fw-bold text-muted" style={{ fontSize: '0.8rem' }}>DEDUCCIONES AL ID</h6>
                                <div className="d-flex justify-content-between">
                                    <div className="flex-fill border-end pe-3">
                                        <div className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>Dcto General (—)</div>
                                        <div className="fw-bold text-danger fs-5">{formatCurrency(d.descuentos)}</div>
                                    </div>
                                    <div className="flex-fill ps-3 text-end">
                                        <div className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>Vencidas FVTO (—)</div>
                                        <div className="fw-bold text-danger fs-5">{formatCurrency(d.vencidas_fvto.valor)}</div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4} className="d-flex flex-column gap-3">
                        <Card className="flex-fill border-0 shadow-sm clickable-card" 
                            style={{ borderLeft: '4px solid #E00969', cursor: 'pointer', transition: '0.2s' }}
                            onClick={() => setShowNequiDetail(prev => ({...prev, [activeTab]: !prev[activeTab]}))}
                        >
                            <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <h6 className="mb-0 fw-bold text-muted" style={{ fontSize: '0.8rem' }}>PAGOS NEQUI</h6>
                                    {d.lista_nequi?.length > 0 && <Badge bg="danger" pill>{d.lista_nequi.length}</Badge>}
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                    <h4 className="mb-0 fw-bold" style={{ color: '#E00969' }}>{formatCurrency(d.nequi)}</h4>
                                    <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '40px', height: '40px', backgroundColor: '#fdf2f8' }}>
                                        <FaMoneyBillWave style={{ color: '#E00969' }} />
                                    </div>
                                </div>
                                {showNequiDetail[activeTab] && d.lista_nequi?.length > 0 && (
                                    <div className="mt-3 border-top pt-2" style={{ fontSize: '0.75rem' }}>
                                        {d.lista_nequi.map((it, idx) => (
                                            <div key={idx} className="d-flex justify-content-between mb-1">
                                                <span className="text-muted text-truncate me-2">{it.cliente}</span>
                                                <span className="fw-bold">{formatCurrency(it.valor)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                        <Card className="flex-fill border-0 shadow-sm clickable-card" 
                            style={{ borderLeft: '4px solid #ED1A2A', cursor: 'pointer', transition: '0.2s' }}
                            onClick={() => setShowDaviDetail(prev => ({...prev, [activeTab]: !prev[activeTab]}))}
                        >
                            <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <h6 className="mb-0 fw-bold text-muted" style={{ fontSize: '0.8rem' }}>PAGOS DAVIPLATA</h6>
                                    {d.lista_davi?.length > 0 && <Badge bg="danger" pill>{d.lista_davi.length}</Badge>}
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                    <h4 className="mb-0 fw-bold" style={{ color: '#ED1A2A' }}>{formatCurrency(d.daviplata)}</h4>
                                    <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '40px', height: '40px', backgroundColor: '#fef2f2' }}>
                                        <FaMoneyBillWave style={{ color: '#ED1A2A' }} />
                                    </div>
                                </div>
                                {showDaviDetail[activeTab] && d.lista_davi?.length > 0 && (
                                    <div className="mt-3 border-top pt-2" style={{ fontSize: '0.75rem' }}>
                                        {d.lista_davi.map((it, idx) => (
                                            <div key={idx} className="d-flex justify-content-between mb-1">
                                                <span className="text-muted text-truncate me-2">{it.cliente}</span>
                                                <span className="fw-bold">{formatCurrency(it.valor)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="h-100 border-0 shadow-sm border-top border-3 border-danger">
                            <Card.Body className="d-flex flex-column">
                                <h6 className="fw-bold mb-0"><FaExclamationTriangle className="me-2 text-danger" />Vencidas (FVTO / Sellado / Hongo)</h6>
                                <div className="text-center d-flex flex-column justify-content-center align-items-center flex-grow-1">
                                    <div className="display-4 fw-bold text-danger">{d.vencidas_fvto.cantidad}</div>
                                    <div className="text-muted mb-2">Unidades Vencidas</div>
                                    <div><span className="badge bg-danger fs-6">{formatCurrency(d.vencidas_fvto.valor)}</span></div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Tabla de Productos del Cargue */}
                <Row className="mb-4">
                    <Col xs={12}>
                        <Card className="border-0 shadow-sm">
                            <Card.Header style={{ backgroundColor: '#0c2c53' }} className="text-white d-flex align-items-center justify-content-between">
                                <span><FaTruck className="me-2" />Detalle de Productos — Cargue {id}</span>
                                {d.responsable && <small className="text-light">Vendedor: {d.responsable}</small>}
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div style={{ overflowX: 'auto' }}>
                                    <Table striped hover size="sm" className="mb-0" style={{ fontSize: '0.85rem' }}>
                                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                                            <tr>
                                                <th>Producto</th>
                                                <th className="text-center">Cantidad</th>
                                                <th className="text-center">Dctos</th>
                                                <th className="text-center">Adicional</th>
                                                <th className="text-center">Devol.</th>
                                                <th className="text-center">Vencidas</th>
                                                <th className="text-center">Total</th>
                                                <th className="text-end">Valor</th>
                                                <th className="text-end">Neto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const productosManipulados = (d.productos_cargue || []).filter(p =>
                                                    parseInt(p.cantidad || 0) > 0 ||
                                                    parseInt(p.adicional || 0) > 0 ||
                                                    parseInt(p.devoluciones || 0) > 0 ||
                                                    parseInt(p.vencidas || 0) > 0 ||
                                                    parseInt(p.total || 0) > 0
                                                );

                                                if (productosManipulados.length === 0) {
                                                    return <tr><td colSpan="9" className="text-center text-muted py-3">Sin productos registrados o manipulados hoy.</td></tr>;
                                                }

                                                return productosManipulados.map((p, i) => {
                                                    const cant = parseInt(p.cantidad || 0);
                                                    const hasData = cant > 0;
                                                    return (
                                                        <tr key={i} style={{ backgroundColor: hasData ? '#f0fdf4' : 'inherit' }}>
                                                            <td className="fw-bold" style={{ minWidth: '180px' }}>{p.producto}</td>
                                                            <td className="text-center">{p.cantidad || 0}</td>
                                                            <td className="text-center">{p.dctos || 0}</td>
                                                            <td className="text-center">{p.adicional || 0}</td>
                                                            <td className="text-center" style={{ color: parseInt(p.devoluciones || 0) > 0 ? '#dc3545' : 'inherit', fontWeight: parseInt(p.devoluciones || 0) > 0 ? 'bold' : 'normal' }}>{p.devoluciones || 0}</td>
                                                            <td className="text-center" style={{ color: parseInt(p.vencidas || 0) > 0 ? '#dc3545' : 'inherit', fontWeight: parseInt(p.vencidas || 0) > 0 ? 'bold' : 'normal' }}>{p.vencidas || 0}</td>
                                                            <td className="text-center fw-bold">{p.total || 0}</td>
                                                            <td className="text-end" style={{ color: '#198754' }}>{formatCurrency(p.valor)}</td>
                                                            <td className="text-end fw-bold">{formatCurrency(p.neto)}</td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Rankings + Control de Cumplimiento */}
                <Row className="g-3 mb-4">
                    <Col lg={4}>
                        <Card className="h-100 shadow-sm border-0">
                            <Card.Header className="bg-white"><h6 className="mb-0 fw-bold">⭐ Top Productos Vendidos HOY</h6></Card.Header>
                            <Card.Body className="p-0">
                                <ul className="ranking-list px-3">
                                    {d.top_vendidos.length > 0
                                        ? d.top_vendidos.map((p, i) => (
                                            <li key={i} className="ranking-item">
                                                <span><strong>{i + 1}.</strong> <small>{p.nombre}</small></span>
                                                <Badge bg="success">{p.cantidad}</Badge>
                                            </li>
                                        ))
                                        : <div className="p-3 text-center text-muted">Sin datos.</div>
                                    }
                                </ul>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="h-100 shadow-sm border-0 border-top border-3 border-danger">
                            <Card.Header className="bg-white">
                                <h6 className="mb-0 fw-bold">🗑️ Detalle Productos Vencidos</h6>
                            </Card.Header>
                            <Card.Body className="p-0" style={{ overflowY: 'auto', maxHeight: '250px' }}>
                                {d.productos_cargue && d.productos_cargue.filter(p => parseInt(p.vencidas || 0) > 0).length > 0 ? (
                                    <Table hover size="sm" className="mb-0" style={{ fontSize: '0.85rem' }}>
                                        <thead className="bg-light sticky-top">
                                            <tr>
                                                <th className="ps-3 border-0">Producto</th>
                                                <th className="text-center border-0">Unds</th>
                                                <th className="text-end pe-3 border-0">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {d.productos_cargue.filter(p => parseInt(p.vencidas || 0) > 0).map((p, i) => (
                                                <tr key={i}>
                                                    <td className="ps-3 text-muted align-middle">{p.producto}</td>
                                                    <td className="text-center align-middle">
                                                        <Badge bg="danger" pill className="px-2 py-1">{p.vencidas}</Badge>
                                                    </td>
                                                    <td className="text-end pe-3 text-danger fw-bold align-middle">
                                                        {formatCurrency(parseInt(p.vencidas) * parseFloat(p.valor || 0))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <div className="p-4 text-center text-muted d-flex flex-column align-items-center justify-content-center h-100">
                                        <span className="fs-1 mb-2">🎉</span>
                                        <span>Sin productos vencidos hoy.</span>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="h-100 shadow-sm border-0">
                            <Card.Header className="bg-white"><h6 className="mb-0 fw-bold">📋 Control de Cumplimiento</h6></Card.Header>
                            <Card.Body className="p-0">
                                {(() => {
                                    const cc = d.cumplimiento_control || {};
                                    const items = [
                                        { label: 'Licencia Transporte', val: cc.licencia_transporte, section: 'MANIPULADOR' },
                                        { label: 'SOAT', val: cc.soat },
                                        { label: 'Uniforme', val: cc.uniforme },
                                        { label: 'No Loción', val: cc.no_locion },
                                        { label: 'No Accesorios', val: cc.no_accesorios },
                                        { label: 'Capacitación/Carnet', val: cc.capacitacion_carnet },
                                        { label: 'Higiene', val: cc.higiene, section: 'FURGÓN' },
                                        { label: 'Estibas', val: cc.estibas },
                                        { label: 'Desinfección', val: cc.desinfeccion },
                                    ];
                                    let currentSection = '';
                                    return (
                                        <Table size="sm" className="mb-0" style={{ fontSize: '0.85rem' }}>
                                            <tbody>
                                                {items.map((item, i) => {
                                                    const rows = [];
                                                    if (item.section && item.section !== currentSection) {
                                                        currentSection = item.section;
                                                        rows.push(
                                                            <tr key={`section-${i}`} style={{ backgroundColor: '#e9ecef' }}>
                                                                <td colSpan="2" className="fw-bold text-center small text-uppercase py-1">{item.section}</td>
                                                            </tr>
                                                        );
                                                    }
                                                    rows.push(
                                                        <tr key={i}>
                                                            <td className="text-muted">{item.label}</td>
                                                            <td className="text-end">
                                                                {item.val === 'C'
                                                                    ? <Badge bg="success" className="px-2">Cumple ✓</Badge>
                                                                    : item.val === 'NC'
                                                                        ? <Badge bg="danger" className="px-2">No Cumple ✗</Badge>
                                                                        : <span className="text-muted">—</span>
                                                                }
                                                            </td>
                                                        </tr>
                                                    );
                                                    return rows;
                                                })}
                                            </tbody>
                                        </Table>
                                    );
                                })()}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    };

    // ── JSX Principal ───────────────────────────────────────────────────────
    return (
        <div className="dashboard-integral-container">
            <Container fluid className="pt-4 px-lg-4">
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                    <div>
                        <h3 className="fw-bold mb-1" style={{ color: '#0c2c53' }}>Dashboard de Inteligencia / Optimización</h3>
                        <p className="text-muted mb-0">Consolidación de Cargue, APP Guerrero y CRM. POS por ventana de turno (8am→8am).</p>
                    </div>
                    <Button variant="outline-dark" onClick={onVolver}>
                        <i className="bi bi-arrow-left me-2"></i>Volver
                    </Button>
                </div>

                <Card className="border-0 shadow-sm mb-4">
                    <Card.Body>
                        {/* Selector de modo */}
                        <div className="d-flex gap-2 mb-3 flex-wrap">
                            {[
                                { key: 'dia', label: '📅 Día' },
                                { key: 'semana', label: '📆 Semana' },
                                { key: 'mes', label: '🗓️ Mes' },
                                { key: 'rango', label: '📊 Rango' },
                            ].map(({ key, label }) => (
                                <Button
                                    key={key}
                                    size="sm"
                                    variant={modoFiltro === key ? 'primary' : 'outline-secondary'}
                                    onClick={() => setModoFiltro(key)}
                                    style={modoFiltro === key ? { backgroundColor: '#0c2c53', border: 'none' } : {}}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>

                        <Row className="align-items-end g-2">
                            {/* Día */}
                            {modoFiltro === 'dia' && (
                                <Col xs="auto">
                                    <Form.Label className="fw-bold text-muted small text-uppercase mb-1">Fecha</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={fechaConsulta}
                                        onChange={e => setFechaConsulta(e.target.value)}
                                        style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef', maxWidth: '200px' }}
                                    />
                                </Col>
                            )}
                            {/* Semana */}
                            {modoFiltro === 'semana' && (
                                <Col xs="auto">
                                    <Form.Label className="fw-bold text-muted small text-uppercase mb-1">Cualquier día de la semana</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={fechaConsulta}
                                        onChange={e => setFechaConsulta(e.target.value)}
                                        style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef', maxWidth: '200px' }}
                                    />
                                    {fechaConsulta && (() => {
                                        const r = getRango();
                                        return r ? <small className="text-muted d-block mt-1">Semana: {formatFechaCorta(r.inicio)} — {formatFechaCorta(r.fin)}</small> : null;
                                    })()}
                                </Col>
                            )}
                            {/* Mes */}
                            {modoFiltro === 'mes' && (
                                <Col xs="auto">
                                    <Form.Label className="fw-bold text-muted small text-uppercase mb-1">Mes</Form.Label>
                                    <Form.Control
                                        type="month"
                                        value={mesConsulta}
                                        onChange={e => setMesConsulta(e.target.value)}
                                        style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef', maxWidth: '200px' }}
                                    />
                                </Col>
                            )}
                            {/* Rango */}
                            {modoFiltro === 'rango' && (
                                <>
                                    <Col xs="auto">
                                        <Form.Label className="fw-bold text-muted small text-uppercase mb-1">Desde</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={fechaInicio}
                                            onChange={e => setFechaInicio(e.target.value)}
                                            style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef', maxWidth: '180px' }}
                                        />
                                    </Col>
                                    <Col xs="auto">
                                        <Form.Label className="fw-bold text-muted small text-uppercase mb-1">Hasta</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={fechaFin}
                                            onChange={e => setFechaFin(e.target.value)}
                                            style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef', maxWidth: '180px' }}
                                        />
                                    </Col>
                                </>
                            )}
                            <Col xs="auto">
                                <Button
                                    variant="primary"
                                    onClick={consultarDatos}
                                    disabled={loading}
                                    style={{ backgroundColor: '#0c2c53', border: 'none' }}
                                >
                                    {loading ? <Spinner animation="border" size="sm" /> : <FaCalendarAlt className="me-1" />} Buscar
                                </Button>
                            </Col>
                            {searched && !loading && (
                                <Col xs="auto" className="ms-auto">
                                    <Badge bg="success" className="px-3 py-2 fs-6">✅ {labelPeriodo}</Badge>
                                    {metricasGenerales.estado_turno === 'ACTIVO' && (
                                        <Badge bg="warning" text="dark" className="px-3 py-2 fs-6 ms-2">
                                            <FaClock className="me-1" />Turno POS en curso — datos parciales
                                        </Badge>
                                    )}
                                </Col>
                            )}
                        </Row>
                    </Card.Body>
                </Card>

                {error && <Alert variant="danger">{error}</Alert>}

                {searched && !loading && !error && (
                    <>
                        <Nav variant="pills" className="nav-pills-custom mb-3 mt-4 overflow-auto flex-nowrap pb-2 border-bottom">
                            <Nav.Item>
                                <Nav.Link active={activeTab === 'general'} onClick={() => setActiveTab('general')}>
                                    🌐 Total Consolidado
                                </Nav.Link>
                            </Nav.Item>
                            {VENDEDORES_IDS.map(id => (
                                <Nav.Item key={id}>
                                    <Nav.Link active={activeTab === id} onClick={() => setActiveTab(id)}>
                                        <FaTruck className="me-2" />{id}
                                    </Nav.Link>
                                </Nav.Item>
                            ))}
                        </Nav>

                        <div className="tab-content py-2">
                            {activeTab === 'general' ? renderMetricasGenerales() : renderDetalleID(activeTab)}
                        </div>
                    </>
                )}
            </Container>
        </div>
    );
};

export default DashboardIntegral;
