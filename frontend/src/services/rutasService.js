import axios from 'axios';

import { API_URL } from './api';
// const API_URL = 'http://localhost:8000/api'; // REPLACED


const rutasService = {
    // Rutas
    obtenerRutas: async () => {
        const response = await axios.get(`${API_URL}/rutas/`);
        return response.data;
    },
    crearRuta: async (ruta) => {
        const response = await axios.post(`${API_URL}/rutas/`, ruta);
        return response.data;
    },
    actualizarRuta: async (id, ruta) => {
        const response = await axios.put(`${API_URL}/rutas/${id}/`, ruta);
        return response.data;
    },
    eliminarRuta: async (id) => {
        await axios.delete(`${API_URL}/rutas/${id}/`);
    },

    // Clientes de Ruta
    obtenerClientesRuta: async (rutaId, dia) => {
        let url = `${API_URL}/clientes-ruta/`;
        const params = [];
        if (rutaId && rutaId !== 'todas') params.push(`ruta=${rutaId}`);
        if (dia) params.push(`dia=${dia}`);

        if (params.length > 0) url += `?${params.join('&')}`;

        const response = await axios.get(url);
        return response.data;
    },
    crearClienteRuta: async (cliente) => {
        const response = await axios.post(`${API_URL}/clientes-ruta/`, cliente);
        return response.data;
    },
    actualizarClienteRuta: async (id, cliente) => {
        const response = await axios.put(`${API_URL}/clientes-ruta/${id}/`, cliente);
        return response.data;
    },
    eliminarClienteRuta: async (id) => {
        await axios.delete(`${API_URL}/clientes-ruta/${id}/`);
    },

    // Ventas Ruta
    obtenerVentasRuta: async (vendedorId, fecha, clienteId, rutaId, fechaInicio, fechaFin) => {
        let url = `${API_URL}/ventas-ruta/`;
        const params = [];
        if (vendedorId) params.push(`vendedor_id=${vendedorId}`);
        if (fecha) params.push(`fecha=${fecha}`);
        if (clienteId) params.push(`cliente_id=${clienteId}`);
        if (rutaId && rutaId !== 'todas') params.push(`ruta_id=${rutaId}`);
        if (fechaInicio) params.push(`fecha_inicio=${fechaInicio}`);
        if (fechaFin) params.push(`fecha_fin=${fechaFin}`);

        if (params.length > 0) url += `?${params.join('&')}`;

        const response = await axios.get(url);
        return response.data;
    },

    // Reportes de Ventas
    obtenerReportesVentas: async (periodo, vendedorId, fechaInicio, fechaFin) => {
        let url = `${API_URL}/ventas-ruta/reportes/?periodo=${periodo}`;
        if (vendedorId) url += `&vendedor_id=${vendedorId}`;
        if (fechaInicio) url += `&fecha_inicio=${fechaInicio}`;
        if (fechaFin) url += `&fecha_fin=${fechaFin}`;

        const response = await axios.get(url);
        return response.data;
    },

    // Vendedores (Auxiliar)
    obtenerVendedores: async () => {
        const response = await axios.get(`${API_URL}/vendedores/`);
        return response.data;
    },

    // 🆕 Orden de Clientes por Día
    obtenerOrdenClientes: async (rutaId, dia) => {
        const response = await axios.get(`${API_URL}/ruta-orden/obtener_orden/`, {
            params: { ruta_id: rutaId, dia: dia.toUpperCase() }
        });
        return response.data;
    },

    guardarOrdenClientes: async (rutaId, dia, clientesIds) => {
        const response = await axios.post(`${API_URL}/ruta-orden/`, {
            ruta_id: rutaId,
            dia: dia.toUpperCase(),
            clientes_ids: clientesIds
        });
        return response.data;
    }
};

export default rutasService;
