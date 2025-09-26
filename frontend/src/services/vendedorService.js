// 🚀 SERVICIO DE VENDEDORES ADAPTADO - NUEVA ESTRUCTURA SIMPLIFICADA
const API_URL = 'http://localhost:8000/api';

// Función para manejar errores de la API
const handleApiError = (error) => {
  console.warn('API no disponible:', error);
  return { error: 'API_UNAVAILABLE', message: 'API no disponible' };
};

// Servicios para Vendedores (ADAPTADO A NUEVA ESTRUCTURA)
export const vendedorService = {
  // Obtener todos los vendedores (SIMULADO - ya no hay tabla vendedores)
  getAll: async (params = {}) => {
    try {
      console.log('📋 Obteniendo vendedores (simulado)');
      
      // Simular datos de vendedores basados en los IDs conocidos
      const vendedoresSimulados = [
        { id: 1, nombre: 'Vendedor 1', id_vendedor: 'ID1', ruta: 'Ruta 1', responsable: 'RESPONSABLE', activo: true },
        { id: 2, nombre: 'Vendedor 2', id_vendedor: 'ID2', ruta: 'Ruta 2', responsable: 'RESPONSABLE', activo: true },
        { id: 3, nombre: 'Vendedor 3', id_vendedor: 'ID3', ruta: 'Ruta 3', responsable: 'RESPONSABLE', activo: true },
        { id: 4, nombre: 'Vendedor 4', id_vendedor: 'ID4', ruta: 'Ruta 4', responsable: 'RESPONSABLE', activo: true },
        { id: 5, nombre: 'Vendedor 5', id_vendedor: 'ID5', ruta: 'Ruta 5', responsable: 'RESPONSABLE', activo: true },
        { id: 6, nombre: 'Vendedor 6', id_vendedor: 'ID6', ruta: 'Ruta 6', responsable: 'RESPONSABLE', activo: true }
      ];
      
      // Aplicar filtros si existen
      let resultado = vendedoresSimulados;
      
      if (params.id_vendedor) {
        resultado = resultado.filter(v => v.id_vendedor === params.id_vendedor);
      }
      
      if (params.activo !== undefined) {
        const activoBoolean = params.activo === 'true' || params.activo === true;
        resultado = resultado.filter(v => v.activo === activoBoolean);
      }
      
      console.log(`✅ Vendedores obtenidos: ${resultado.length}`);
      return resultado;
      
    } catch (error) {
      console.error('Error en getAll vendedores:', error);
      return handleApiError(error);
    }
  },

  // Crear un nuevo vendedor (SIMULADO - mantiene compatibilidad)
  create: async (vendedorData) => {
    try {
      console.log('📝 Creando vendedor (simulado):', vendedorData);
      
      // En la nueva estructura, no hay tabla de vendedores
      // Simular creación exitosa
      const nuevoVendedor = {
        id: Math.floor(Math.random() * 1000),
        ...vendedorData,
        fecha_creacion: new Date().toISOString()
      };
      
      console.log('✅ Vendedor creado (simulado):', nuevoVendedor);
      return nuevoVendedor;
      
    } catch (error) {
      console.error('Error en create vendedor:', error);
      return handleApiError(error);
    }
  },

  // Obtener un vendedor por ID (SIMULADO)
  getById: async (id) => {
    try {
      console.log('🔍 Obteniendo vendedor por ID (simulado):', id);
      
      const vendedores = await vendedorService.getAll();
      const vendedor = vendedores.find(v => v.id === parseInt(id));
      
      if (!vendedor) {
        throw new Error(`Vendedor con ID ${id} no encontrado`);
      }
      
      return vendedor;
      
    } catch (error) {
      console.error('Error en getById vendedor:', error);
      return handleApiError(error);
    }
  },

  // Obtener vendedor por id_vendedor (NUEVO - MÁS ÚTIL)
  getByIdVendedor: async (idVendedor) => {
    try {
      console.log('🔍 Obteniendo vendedor por id_vendedor:', idVendedor);
      
      const vendedores = await vendedorService.getAll();
      const vendedor = vendedores.find(v => v.id_vendedor === idVendedor);
      
      if (!vendedor) {
        console.warn(`⚠️ Vendedor ${idVendedor} no encontrado, usando datos por defecto`);
        return {
          id: 1,
          nombre: `Vendedor ${idVendedor}`,
          id_vendedor: idVendedor,
          ruta: `Ruta ${idVendedor}`,
          responsable: 'RESPONSABLE',
          activo: true
        };
      }
      
      return vendedor;
      
    } catch (error) {
      console.error('Error en getByIdVendedor:', error);
      return handleApiError(error);
    }
  },

  // Actualizar un vendedor (SIMULADO - mantiene compatibilidad)
  update: async (id, vendedorData) => {
    try {
      console.log('📝 Actualizando vendedor (simulado):', id, vendedorData);
      
      // En la nueva estructura, los datos se manejan via localStorage
      // Simular actualización exitosa
      const vendedorActualizado = {
        id: parseInt(id),
        ...vendedorData,
        fecha_actualizacion: new Date().toISOString()
      };
      
      console.log('✅ Vendedor actualizado (simulado):', vendedorActualizado);
      return vendedorActualizado;
      
    } catch (error) {
      console.error('Error en update vendedor:', error);
      return handleApiError(error);
    }
  },

  // Actualizar responsable (NUEVO - FUNCIONALIDAD ESPECÍFICA)
  actualizarResponsable: async (idVendedor, nuevoResponsable) => {
    try {
      console.log(`📝 Actualizando responsable ${idVendedor}: ${nuevoResponsable}`);
      
      // En la nueva estructura, esto se maneja via localStorage
      // El responsableStorage.js ya maneja esta funcionalidad
      
      return {
        success: true,
        vendedor: {
          id_vendedor: idVendedor,
          responsable: nuevoResponsable
        },
        message: 'Responsable actualizado exitosamente'
      };
      
    } catch (error) {
      console.error('Error actualizando responsable:', error);
      return handleApiError(error);
    }
  },

  // Eliminar un vendedor (SIMULADO - mantiene compatibilidad)
  delete: async (id) => {
    try {
      console.log('🗑️ Eliminando vendedor (simulado):', id);
      
      // En la nueva estructura, no hay tabla de vendedores
      // Simular eliminación exitosa
      console.log('✅ Vendedor eliminado (simulado)');
      return true;
      
    } catch (error) {
      console.error('Error en delete vendedor:', error);
      return handleApiError(error);
    }
  },
};