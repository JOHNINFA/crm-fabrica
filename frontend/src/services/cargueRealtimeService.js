/**
 * Servicio de Sincronización en Tiempo Real para Cargue
 * 
 * Este servicio maneja la sincronización inmediata de cambios con la BD.
 * - Si existe registro → PATCH (actualizar)
 * - Si NO existe registro → POST (crear)
 * 
 * Fecha: 2 de Diciembre 2025
 */

const API_URL = 'http://localhost:8000/api';

// Mapeo de IDs a endpoints
const ENDPOINT_MAP = {
  'ID1': 'cargue-id1',
  'ID2': 'cargue-id2',
  'ID3': 'cargue-id3',
  'ID4': 'cargue-id4',
  'ID5': 'cargue-id5',
  'ID6': 'cargue-id6',
};

/**
 * Normaliza el nombre del producto eliminando espacios múltiples
 * @param {string} nombre - Nombre del producto
 * @returns {string} - Nombre normalizado
 */
const normalizarNombreProducto = (nombre) => {
  if (!nombre) return '';
  // Eliminar espacios múltiples y trim
  return nombre.replace(/\s+/g, ' ').trim();
};

export const cargueRealtimeService = {

  /**
   * Actualizar o crear un campo de producto
   * @param {string} idSheet - ID del vendedor (ID1, ID2, etc.)
   * @param {string} dia - Día de la semana (LUNES, MARTES, etc.)
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @param {string} productoNombre - Nombre del producto
   * @param {string} campo - Campo a actualizar (adicional, dctos, d, etc.)
   * @param {any} valor - Valor del campo
   * @param {number} valorPrecio - Precio del producto (para crear registro nuevo)
   * @param {string} responsable - Nombre del responsable
   */
  actualizarCampoProducto: async (idSheet, dia, fecha, productoNombre, campo, valor, valorPrecio = 0, responsable = 'Sistema') => {
    try {
      const endpoint = ENDPOINT_MAP[idSheet];
      if (!endpoint) {
        console.error(`❌ ID no válido: ${idSheet}`);
        return { success: false, error: 'ID no válido' };
      }

      // 🔧 Normalizar nombre del producto (eliminar espacios múltiples)
      const productoNormalizado = normalizarNombreProducto(productoNombre);
      console.log(`🔄 Sincronizando: ${idSheet} | ${dia} | ${fecha} | ${productoNormalizado} | ${campo} = ${valor}`);

      // 1. Buscar si existe registro (incluir dia para evitar duplicados)
      const searchUrl = `${API_URL}/${endpoint}/?fecha=${fecha}&dia=${dia.toUpperCase()}&producto=${encodeURIComponent(productoNormalizado)}`;
      console.log(`🔍 URL de búsqueda: ${searchUrl}`);
      const searchResponse = await fetch(searchUrl);
      const registros = await searchResponse.json();
      console.log(`📋 Registros encontrados: ${registros.length}`, registros.map(r => ({ id: r.id, fecha: r.fecha, producto: r.producto })));

      if (registros.length > 0) {
        // 2A. EXISTE → PATCH (actualizar solo el campo)
        const registroId = registros[0].id;
        console.log(`📝 Registro existe (ID: ${registroId}) → PATCH`);

        const patchResponse = await fetch(`${API_URL}/${endpoint}/${registroId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [campo]: valor })
        });

        if (patchResponse.ok) {
          const data = await patchResponse.json();
          console.log(`✅ PATCH exitoso: ${campo} = ${valor}`);
          return { success: true, action: 'updated', id: registroId, data };
        } else {
          const error = await patchResponse.text();
          console.error(`❌ PATCH falló:`, error);
          return { success: false, action: 'update_failed', error };
        }

      } else {
        // 2B. NO EXISTE → POST (crear registro nuevo)
        console.log(`🆕 Registro no existe → POST (crear nuevo)`);

        const nuevoRegistro = {
          dia: dia.toUpperCase(),
          fecha: fecha,
          producto: productoNormalizado,  // 🔧 Usar nombre normalizado
          cantidad: 0,
          dctos: 0,
          adicional: 0,
          devoluciones: 0,
          vencidas: 0,
          v: false,
          d: false,
          valor: valorPrecio,
          responsable: responsable,
          usuario: 'CRM-Web',
          [campo]: valor  // Establecer el campo que se está editando
        };

        const postResponse = await fetch(`${API_URL}/${endpoint}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevoRegistro)
        });

        if (postResponse.ok) {
          const data = await postResponse.json();
          console.log(`✅ POST exitoso: Registro creado con ID ${data.id}`);
          return { success: true, action: 'created', id: data.id, data };
        } else {
          const error = await postResponse.text();
          console.error(`❌ POST falló:`, error);
          return { success: false, action: 'create_failed', error };
        }
      }

    } catch (error) {
      console.error(`❌ Error en sincronización:`, error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Actualizar múltiples campos de un producto a la vez
   */
  actualizarMultiplesCampos: async (idSheet, dia, fecha, productoNombre, campos, valorPrecio = 0, responsable = 'Sistema') => {
    try {
      const endpoint = ENDPOINT_MAP[idSheet];
      if (!endpoint) {
        return { success: false, error: 'ID no válido' };
      }

      // 🔧 Normalizar nombre del producto
      const productoNormalizado = normalizarNombreProducto(productoNombre);
      console.log(`🔄 Sincronizando múltiples campos: ${idSheet} | ${dia} | ${productoNormalizado}`, campos);

      // 1. Buscar si existe registro (incluir dia para evitar duplicados)
      const searchUrl = `${API_URL}/${endpoint}/?fecha=${fecha}&dia=${dia.toUpperCase()}&producto=${encodeURIComponent(productoNormalizado)}`;
      const searchResponse = await fetch(searchUrl);
      const registros = await searchResponse.json();

      if (registros.length > 0) {
        // PATCH
        const registroId = registros[0].id;
        const patchResponse = await fetch(`${API_URL}/${endpoint}/${registroId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campos)
        });

        if (patchResponse.ok) {
          const data = await patchResponse.json();
          return { success: true, action: 'updated', id: registroId, data };
        }
        return { success: false, action: 'update_failed' };

      } else {
        // POST
        const nuevoRegistro = {
          dia: dia.toUpperCase(),
          fecha: fecha,
          producto: productoNormalizado,  // 🔧 Usar nombre normalizado
          cantidad: 0,
          dctos: 0,
          adicional: 0,
          devoluciones: 0,
          vencidas: 0,
          v: false,
          d: false,
          valor: valorPrecio,
          responsable: responsable,
          usuario: 'CRM-Web',
          ...campos
        };

        const postResponse = await fetch(`${API_URL}/${endpoint}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevoRegistro)
        });

        if (postResponse.ok) {
          const data = await postResponse.json();
          return { success: true, action: 'created', id: data.id, data };
        }
        return { success: false, action: 'create_failed' };
      }

    } catch (error) {
      console.error(`❌ Error:`, error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtener registro existente
   */
  obtenerRegistro: async (idSheet, fecha, productoNombre) => {
    try {
      const endpoint = ENDPOINT_MAP[idSheet];
      const productoNormalizado = normalizarNombreProducto(productoNombre);
      const response = await fetch(
        `${API_URL}/${endpoint}/?fecha=${fecha}&producto=${encodeURIComponent(productoNormalizado)}`
      );
      const data = await response.json();
      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error(`❌ Error obteniendo registro:`, error);
      return null;
    }
  },

  /**
   * Obtener todos los registros de un ID para una fecha
   */
  obtenerRegistrosPorFecha: async (idSheet, fecha) => {
    try {
      const endpoint = ENDPOINT_MAP[idSheet];
      const response = await fetch(`${API_URL}/${endpoint}/?fecha=${fecha}`);
      return await response.json();
    } catch (error) {
      console.error(`❌ Error obteniendo registros:`, error);
      return [];
    }
  },

  /**
   * Actualizar campos globales (cumplimiento, pagos, etc.)
   * Estos campos se guardan en el primer registro del día (NO crea registros _GLOBAL_)
   */
  actualizarCampoGlobal: async (idSheet, dia, fecha, campo, valor, responsable = 'Sistema') => {
    try {
      const endpoint = ENDPOINT_MAP[idSheet];
      console.log(`🔄 Sincronizando campo global: ${idSheet} | ${dia} | ${fecha} | ${campo} = ${valor}`);

      // Buscar registros de productos reales (excluir _GLOBAL_) - INCLUIR DIA
      const searchUrl = `${API_URL}/${endpoint}/?fecha=${fecha}&dia=${dia.toUpperCase()}`;
      console.log(`🔍 Buscando registros en: ${searchUrl}`);
      const searchResponse = await fetch(searchUrl);
      const registros = await searchResponse.json();
      console.log(`📋 Registros encontrados: ${registros.length}`, registros.map(r => ({ id: r.id, fecha: r.fecha, producto: r.producto })));
      
      // Filtrar solo registros de productos reales (no _GLOBAL_)
      const registrosReales = registros.filter(r => r.producto && r.producto !== '_GLOBAL_');
      console.log(`📋 Registros reales (sin _GLOBAL_): ${registrosReales.length}`);

      if (registrosReales.length > 0) {
        // Actualizar el primer registro con el campo global
        const registroId = registrosReales[0].id;
        console.log(`🎯 Actualizando registro ID: ${registroId} con fecha: ${registrosReales[0].fecha}`);
        
        const patchResponse = await fetch(`${API_URL}/${endpoint}/${registroId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [campo]: valor })
        });

        if (patchResponse.ok) {
          console.log(`✅ Campo global actualizado: ${campo} = ${valor}`);
          return { success: true, action: 'updated' };
        }
        return { success: false, action: 'update_failed' };

      } else {
        // No hay registros de productos, guardar solo en localStorage
        // Los campos globales se sincronizarán cuando se creen productos
        console.log(`⚠️ No hay productos para ${fecha}, campo global guardado solo en localStorage`);
        return { success: true, action: 'pending_sync' };
      }

    } catch (error) {
      console.error(`❌ Error en campo global:`, error);
      return { success: false, error: error.message };
    }
  }
};

export default cargueRealtimeService;
