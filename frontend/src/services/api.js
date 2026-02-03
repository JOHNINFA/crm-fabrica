// Servicio para manejar las llamadas a la API
const searchParams = new URLSearchParams(window.location.search);
const configServerUrl = searchParams.get('serverUrl');

let FINAL_BASE_URL = '';

// Lógica de detección inteligente de URL de API
// Prioridad 1: Variable de entorno explícita (siempre gana)
// Prioridad 2: Detección automática según entorno (Dev vs Prod)

if (!process.env.REACT_APP_API_URL) {
  if (process.env.NODE_ENV === 'development') {
    // EN DESARROLLO: Si accedemos desde una IP de red (celular), usar esa IP y puerto 8000
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      FINAL_BASE_URL = `http://${window.location.hostname}:8000`;
    }
  } else {
    // EN PRODUCCIÓN (VPS): Asumimos que la API está servida bajo el mismo dominio (reverse proxy standard)
    // Ejemplo: tudominio.com/api -> backend
    FINAL_BASE_URL = window.location.origin;
  }
}

if (configServerUrl) {
  try {
    const urlObj = new URL(configServerUrl);
    if (urlObj.port === '3000') urlObj.port = '8000';
    FINAL_BASE_URL = urlObj.origin;
  } catch (e) {
    console.error('Error parseando serverUrl:', e);
  }
}

// Exportamos la constante para que otros archivos la usen
// Exportamos la constante para que otros archivos la usen
// Corrección crítica: Si FINAL_BASE_URL está vacío (producción relativa),
// API_URL debe ser simplemente '/api'.
// Si tiene valor (ej: http://localhost:8000), le pegamos '/api'
export const API_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL
  : (FINAL_BASE_URL === '' ? '/api' : `${FINAL_BASE_URL}/api`);

/**
 * Fetch con timeout de 5 segundos
 * Evita esperas largas cuando el servidor está caído
 */
const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: Servidor no responde')), timeout)
    )
  ]);
};

// Función para manejar errores de la API
const handleApiError = (error) => {
  console.warn('API no dis ponible, usando almacenamiento local:', error);
  return { error: 'API_UNAVAILABLE', message: 'API no disponible, usando almacenamiento local' };
};

// Función para convertir una imagen base64 a un archivo
const base64ToFile = (base64String, filename = 'image.jpg') => {
  if (!base64String || typeof base64String !== 'string' || !base64String.startsWith('data:')) {
    return null;
  }

  try {
    // Extraer el tipo MIME y los datos
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  } catch (error) {
    console.error('Error al convertir base64 a archivo:', error);
    return null;
  }
};

// Servicios para Productos
export const productoService = {
  // Obtener todos los productos
  getAll: async () => {
    try {

      const response = await fetch(`${API_URL}/productos/`);
      if (!response.ok) throw new Error(`Error al obtener productos: ${response.status}`);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error('Error en getAll:', error);
      return handleApiError(error);
    }
  },

  // Obtener un producto por ID
  getById: async (id) => {
    try {

      const response = await fetch(`${API_URL}/productos/${id}/`);
      if (!response.ok) throw new Error(`Error al obtener producto con ID ${id}: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getById:', error);
      return handleApiError(error);
    }
  },

  // Crear un nuevo producto
  create: async (productoData) => {
    try {


      // Verificar si hay una imagen en formato base64
      if (productoData.imagen && typeof productoData.imagen === 'string' && productoData.imagen.startsWith('data:')) {
        // Usar FormData para enviar la imagen
        const formData = new FormData();

        // Convertir la imagen base64 a un archivo
        const imageFile = base64ToFile(productoData.imagen, 'producto.jpg');
        if (imageFile) {
          formData.append('imagen', imageFile);
        }

        // Agregar el resto de los datos del producto
        Object.keys(productoData).forEach(key => {
          if (key !== 'imagen' && productoData[key] !== null && productoData[key] !== undefined) {
            formData.append(key, productoData[key]);
          }
        });


        const response = await fetch(`${API_URL}/productos/`, {
          method: 'POST',
          body: formData,
          // No establecer Content-Type, fetch lo hará automáticamente con el boundary correcto
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Error al crear producto: ${response.status}`);
        }
        return await response.json();
      } else {
        // Sin imagen, usar JSON normal

        const response = await fetch(`${API_URL}/productos/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productoData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Error al crear producto: ${response.status}`);
        }
        return await response.json();
      }
    } catch (error) {
      console.error('Error en create:', error);
      return handleApiError(error);
    }
  },

  // Actualizar un producto existente
  update: async (id, productoData) => {
    try {
      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        console.error('ID de producto inválido:', id);
        return { error: true, message: `ID de producto inválido: ${id}` };
      }



      // Verificar primero si el producto existe
      try {
        const checkResponse = await fetch(`${API_URL}/productos/${id}/`);
        if (!checkResponse.ok) {
          console.error(`Producto con ID ${id} no encontrado`);
          return { error: true, message: `Producto con ID ${id} no encontrado` };
        }
      } catch (checkError) {
        console.error('Error al verificar producto:', checkError);
      }

      // Verificar si hay una imagen en formato base64
      if (productoData.imagen && typeof productoData.imagen === 'string' && productoData.imagen.startsWith('data:')) {
        // Usar FormData para enviar la imagen
        const formData = new FormData();

        // Convertir la imagen base64 a un archivo
        const imageFile = base64ToFile(productoData.imagen, 'producto.jpg');
        if (imageFile) {
          formData.append('imagen', imageFile);
        }

        // Agregar el resto de los datos del producto
        Object.keys(productoData).forEach(key => {
          if (key !== 'imagen' && productoData[key] !== null && productoData[key] !== undefined) {
            formData.append(key, productoData[key]);
          }
        });


        const response = await fetch(`${API_URL}/productos/${id}/`, {
          method: 'PATCH',
          body: formData,
          // No establecer Content-Type, fetch lo hará automáticamente con el boundary correcto
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error al actualizar producto ${id}:`, response.status, errorText);
          return { error: true, message: `Error al actualizar producto: ${response.status}` };
        }
        return await response.json();
      } else {
        // Sin imagen, usar JSON normal

        const response = await fetch(`${API_URL}/productos/${id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productoData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error al actualizar producto ${id}:`, response.status, errorText);
          return { error: true, message: `Error al actualizar producto con ID ${id}: ${response.status}` };
        }
        return await response.json();
      }
    } catch (error) {
      console.error('Error en update:', error);
      return handleApiError(error);
    }
  },

  // Actualizar el stock de un producto
  updateStock: async (id, cantidad, usuario, nota) => {
    try {
      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        console.error('ID de producto inválido:', id);
        return { error: true, message: `ID de producto inválido: ${id}` };
      }



      // Primero obtener el stock actual
      let stockActual = 0;
      let productoExiste = false;

      try {
        const getResponse = await fetch(`${API_URL}/productos/${id}/`);
        if (getResponse.ok) {
          const producto = await getResponse.json();
          stockActual = producto.stock_total || 0;
          productoExiste = true;
          console.log(`Stock actual en BD para producto ${id}: ${stockActual}`);
        } else {
          console.error(`Producto con ID ${id} no encontrado`);
          return { error: true, message: `Producto con ID ${id} no encontrado` };
        }
      } catch (getError) {
        console.warn('Error al obtener stock actual:', getError);
        return { error: true, message: `Error al obtener producto: ${getError.message}` };
      }

      // Si el producto no existe, no continuar
      if (!productoExiste) {
        return { error: true, message: `Producto con ID ${id} no encontrado` };
      }

      // Enviar actualización de stock
      try {
        const response = await fetch(`${API_URL}/productos/${id}/actualizar_stock/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cantidad,
            usuario,
            nota,
            stock_actual: stockActual // Enviar el stock actual para referencia
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error al actualizar stock del producto ${id}:`, response.status, errorText);
          return { error: true, message: `Error al actualizar stock: ${response.status}` };
        }

        const result = await response.json();
        console.log(`Stock actualizado exitosamente para producto ${id}. Nuevo stock: ${result.stock_actual || 'N/A'}`);
        return result;
      } catch (updateError) {
        console.error('Error en actualización de stock:', updateError);
        return { error: true, message: `Error en actualización de stock: ${updateError.message}` };
      }
    } catch (error) {
      console.error('Error general en updateStock:', error);
      return handleApiError(error);
    }
  },

  // Subir una imagen para un producto
  uploadImage: async (id, imageData) => {
    try {


      if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:')) {
        throw new Error('Formato de imagen inválido');
      }

      // Convertir la imagen base64 a un archivo
      const imageFile = base64ToFile(imageData, 'producto.jpg');
      if (!imageFile) {
        throw new Error('No se pudo convertir la imagen');
      }

      const formData = new FormData();
      formData.append('imagen', imageFile);

      const response = await fetch(`${API_URL}/productos/${id}/`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error al subir imagen: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en uploadImage:', error);
      return handleApiError(error);
    }
  },

  // Eliminar un producto FÍSICAMENTE
  delete: async (id) => {
    try {

      const response = await fetch(`${API_URL}/productos/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Error al eliminar producto: ${response.status}`);
      }


      return true;
    } catch (error) {
      console.error('Error en delete:', error);
      return handleApiError(error);
    }
  }
};

// Servicios para Categorías
export const categoriaService = {
  // Obtener todas las categorías
  getAll: async () => {
    try {

      const response = await fetch(`${API_URL}/categorias/`);
      if (!response.ok) throw new Error(`Error al obtener categorías: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getAll categorías:', error);
      return handleApiError(error);
    }
  },

  // Crear una nueva categoría
  create: async (nombre) => {
    try {

      const response = await fetch(`${API_URL}/categorias/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error al crear categoría: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en create categoría:', error);
      return handleApiError(error);
    }
  },

  // Anular un pedido
  anularPedido: async (id, motivo) => {
    try {
      // Intentar anular en el servidor
      try {
        const response = await fetch(`${API_URL}/pedidos/${id}/anular/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ motivo }),
        });

        if (response.ok) {
          const result = await response.json();
          return { success: true, message: result.message || 'Pedido anulado correctamente' };
        } else {
          // Si es 404, es posible que sea un pedido LOCAL no sincronizado
          if (response.status === 404) {
            console.warn('Pedido no encontrado en servidor, buscando en local...');
            throw new Error('NOT_FOUND_SERVER');
          }

          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al anular pedido');
        }
      } catch (apiError) {
        // Si falló por 404 o conexión, intentar anular localmente
        console.warn('Fallo anulación servidor:', apiError);

        const pedidosLocales = JSON.parse(localStorage.getItem('pedidos_sistema') || '[]');
        // Buscar por ID numérico o string
        const index = pedidosLocales.findIndex(p => p.id == id);

        if (index !== -1) {
          // Actualizar estado local
          pedidosLocales[index].estado = 'ANULADA';
          pedidosLocales[index].motivo_anulacion = motivo;
          localStorage.setItem('pedidos_sistema', JSON.stringify(pedidosLocales));

          return {
            success: true,
            message: 'Pedido local anulado correctamente (No sincronizado)'
          };
        }

        // Si no estaba en local tampoco, entonces sí es un error real
        if (apiError.message === 'NOT_FOUND_SERVER') {
          throw new Error('Pedido no encontrado ni en servidor ni en local');
        }

        return handleApiError(apiError);
      }

    } catch (error) {
      console.error('Error en anularPedido:', error);
      return { success: false, message: error.message };
    }
  },

  // Eliminar una categoría
  delete: async (id) => {
    try {

      const response = await fetch(`${API_URL}/categorias/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error al eliminar categoría: ${response.status}`);
      }

      // DELETE puede retornar 204 No Content
      if (response.status === 204) {
        return { success: true };
      }

      return await response.json();
    } catch (error) {
      console.error('Error en delete categoría:', error);
      return handleApiError(error);
    }
  },
};

// Servicios para Lotes
export const loteService = {
  // Obtener todos los lotes
  getAll: async (productoId = null) => {
    try {
      let url = `${API_URL}/lotes/`;
      if (productoId) url += `?producto=${productoId}`;


      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error al obtener lotes: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getAll lotes:', error);
      return handleApiError(error);
    }
  },

  // Crear un nuevo lote
  create: async (loteData) => {
    try {

      const response = await fetch(`${API_URL}/lotes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loteData),
      });

      if (!response.ok) throw new Error(`Error al crear lote: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en create lote:', error);
      return handleApiError(error);
    }
  },
};

// Servicio para limpiar tablas específicas
export const cleanTablesService = {
  // Limpiar tablas específicas
  cleanTables: async (tables = ['registro_inventario', 'lote']) => {
    try {

      const response = await fetch(`${API_URL}/admin/clean-tables/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tables }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error al limpiar tablas: ${response.status}`);
      }


      return await response.json();
    } catch (error) {
      console.error('Error al limpiar tablas:', error);
      return handleApiError(error);
    }
  },
};

// Servicios para Movimientos de Inventario
export const movimientoService = {
  // Obtener todos los movimientos
  getAll: async (params = {}) => {
    try {
      // Construir URL con parámetros de consulta
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) queryParams.append(key, params[key]);
      });

      const url = `${API_URL}/movimientos/?${queryParams.toString()}`;

      const response = await fetch(url);

      if (!response.ok) throw new Error(`Error al obtener movimientos: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getAll movimientos:', error);
      return handleApiError(error);
    }
  },

  // Crear un nuevo movimiento
  create: async (movimientoData) => {
    try {

      const response = await fetch(`${API_URL}/movimientos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movimientoData),
      });

      if (!response.ok) throw new Error(`Error al crear movimiento: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en create movimiento:', error);
      return handleApiError(error);
    }
  },
};

// Servicios para Ventas
export const ventaService = {
  // Obtener todas las ventas
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) queryParams.append(key, params[key]);
      });

      const url = `${API_URL}/ventas/?${queryParams.toString()}`;


      // Intentar con API primero
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();

          return data;
        }
      } catch (apiError) {
        console.warn('API no disponible para obtener ventas:', apiError);
      }

      // Fallback: usar localStorage

      const ventasGuardadas = localStorage.getItem('ventas_pos');

      if (ventasGuardadas) {
        let ventas = JSON.parse(ventasGuardadas);

        // Verificar ventas anuladas y actualizar estados
        const ventasAnuladas = JSON.parse(localStorage.getItem('ventas_anuladas') || '[]');
        if (ventasAnuladas.length > 0) {

          ventas = ventas.map(venta => {
            if (ventasAnuladas.includes(venta.id)) {
              return { ...venta, estado: 'ANULADA' };
            }
            return venta;
          });
        }


        return ventas;
      } else {

        return [];
      }

    } catch (error) {
      console.error('Error en getAll ventas:', error);
      return [];
    }
  },

  // Crear una nueva venta
  create: async (ventaData) => {
    try {
      // Intentar crear la venta en el servidor con timeout de 5 segundos
      const response = await fetchWithTimeout(`${API_URL}/ventas/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ventaData),
      }, 5000); // Timeout de 5 segundos

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error al crear venta: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Venta creada exitosamente en servidor:', data.numero_factura);

      return data;

    } catch (error) {
      console.error('⚠️ Error de conexión al crear venta:', error.message);

      // Importar offlineService dinámicamente
      try {
        const { offlineService } = await import('./offlineService');

        // Guardar venta offline usando IndexedDB
        const result = await offlineService.guardarVentaOffline(ventaData);

        console.log('✅ Venta guardada offline con UUID:', result.uuid);

        // Actualizar localStorage para historial inmediato
        const ventasLocales = JSON.parse(localStorage.getItem('ventas_pos') || '[]');
        const ventaOffline = {
          ...ventaData,
          id: result.uuid,
          numero_factura: result.numero_factura,
          fecha: new Date().toISOString(),
          estado: 'PAGADO',
          sincronizado: false,
          offline: true
        };

        ventasLocales.unshift(ventaOffline);
        localStorage.setItem('ventas_pos', JSON.stringify(ventasLocales));

        // Retornar éxito para que la UI continúe normalmente
        return {
          ...ventaOffline,
          success: true,
          offline: true,
          message: '⚠️ Venta guardada localmente (Sin conexión al servidor)'
        };

      } catch (offlineError) {
        console.error('❌ Error crítico al guardar offline:', offlineError);

        // Último intento: localStorage legacy
        try {
          const pendientes = JSON.parse(localStorage.getItem('ventas_pendientes') || '[]');
          const ventaOffline = {
            ...ventaData,
            id: `TEMP_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            fecha: new Date().toISOString(),
            estado: 'PAGADO',
            sincronizado: false,
            created_at_local: Date.now()
          };

          pendientes.push(ventaOffline);
          localStorage.setItem('ventas_pendientes', JSON.stringify(pendientes));

          const ventasLocales = JSON.parse(localStorage.getItem('ventas_pos') || '[]');
          ventasLocales.unshift(ventaOffline);
          localStorage.setItem('ventas_pos', JSON.stringify(ventasLocales));

          console.log('✅ Venta guardada localmente (fallback localStorage)');

          return {
            ...ventaOffline,
            success: true,
            offline: true,
            message: 'Venta guardada localmente (Sin conexión)'
          };

        } catch (localError) {
          console.error('❌ Error crítico: Falló incluso el guardado local:', localError);
          return handleApiError(error);
        }
      }
    }
  },

  // Obtener una venta por ID
  getById: async (id) => {
    try {


      // Intentar con API primero
      try {
        const response = await fetch(`${API_URL}/ventas/${id}/`);
        if (response.ok) {
          const data = await response.json();


          return data;
        } else {
          console.log('⚠️ API response not ok:', response.status);
        }
      } catch (apiError) {
        console.warn('⚠️ API no disponible para obtener venta por ID:', apiError);
      }

      // Fallback: buscar en localStorage

      const ventasGuardadas = localStorage.getItem('ventas_pos');


      if (ventasGuardadas) {
        const ventas = JSON.parse(ventasGuardadas);

        let venta = ventas.find(v => v.id === parseInt(id));

        if (venta) {
          // Verificar si está anulada
          const ventasAnuladas = JSON.parse(localStorage.getItem('ventas_anuladas') || '[]');
          if (ventasAnuladas.includes(parseInt(id))) {
            venta = { ...venta, estado: 'ANULADA' };

          }



          return venta;
        } else {
          console.log('❌ Venta no encontrada en localStorage con ID:', id);

        }
      }

      throw new Error('Venta no encontrada en API ni localStorage');

    } catch (error) {
      console.error('❌ Error en getById venta:', error);
      return { error: true, message: error.message };
    }
  },

  // Anular una venta
  anularVenta: async (id) => {
    try {


      // Intentar con API primero - usando PATCH para actualizar el estado
      try {

        const patchData = {
          estado: 'ANULADA'
        };


        const response = await fetch(`${API_URL}/ventas/${id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(patchData)
        });



        if (response.ok) {
          const result = await response.json();


          return {
            success: true,
            message: 'Venta anulada exitosamente en base de datos',
            venta: result
          };
        } else {
          const errorText = await response.text();
          console.log('⚠️ Error en PATCH:', response.status, response.statusText, errorText);
        }
      } catch (apiError) {
        console.error('❌ Error en PATCH:', apiError);
      }

      // Intentar con el endpoint específico de anulación
      try {
        const response = await fetch(`${API_URL}/ventas/${id}/anular/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            motivo: 'Anulada desde POS',
            devolver_inventario: true
          })
        });

        if (response.ok) {
          const result = await response.json();

          return result;
        } else {
          console.log('⚠️ Endpoint /anular/ no disponible:', response.status);
        }
      } catch (apiError) {
        console.warn('Endpoint /anular/ no disponible:', apiError);
      }

      // Fallback: marcar como anulada localmente (temporal hasta que API esté disponible)
      console.log('⚠️ API no disponible, usando fallback local temporal');


      // Crear lista de ventas anuladas para persistir el estado
      const ventasAnuladas = JSON.parse(localStorage.getItem('ventas_anuladas') || '[]');
      if (!ventasAnuladas.includes(parseInt(id))) {
        ventasAnuladas.push(parseInt(id));
        localStorage.setItem('ventas_anuladas', JSON.stringify(ventasAnuladas));

      }

      return {
        success: true,
        message: 'Venta anulada exitosamente (pendiente sincronización con base de datos)',
        venta: { id: parseInt(id), estado: 'ANULADA' }
      };

    } catch (error) {
      console.error('Error en anularVenta:', error);
      return {
        error: true,
        message: error.message || 'Error al anular la venta'
      };
    }
  },


};

// Servicios para Pedidos
export const pedidoService = {
  // Obtener todos los pedidos
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) queryParams.append(key, params[key]);
      });

      const url = `${API_URL}/pedidos/?${queryParams.toString()}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        console.warn('Error fetching pedidos:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error en getAll pedidos:', error);
      return [];
    }
  },

  // Crear un nuevo pedido
  create: async (remisionData) => {
    try {
      const response = await fetch(`${API_URL}/pedidos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(remisionData),
      });

      if (response.ok) {
        const result = await response.json();

        // 🆕 Disparar evento para actualizar Total Pedidos en Cargue
        window.dispatchEvent(new CustomEvent('pedidoCreado', { detail: result }));

        return result;
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error al crear pedido: ${response.status}`);
      }
    } catch (error) {
      console.error('Error en create pedido:', error);
      return handleApiError(error);
    }
  },

  // Obtener una remisión por ID
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/pedidos/${id}/`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Error al obtener pedido: ${response.status}`);
      }
    } catch (error) {
      console.error('Error en getById pedido:', error);
      return { error: true, message: error.message };
    }
  },

  // Anular un pedido
  anularPedido: async (id, motivo) => {
    try {
      const response = await fetch(`${API_URL}/pedidos/${id}/anular/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, message: errorData.error || 'Error al anular pedido' };
      }

      const result = await response.json();
      return { success: true, message: result.message };
    } catch (error) {
      console.error('Error en anularPedido:', error);
      return handleApiError(error);
    }
  },

  // Anular una remisión (alias para compatibilidad)
  anularRemision: async (id, motivo) => {
    return pedidoService.anularPedido(id, motivo);
  },

  // Actualizar estado de remisión
  updateEstado: async (id, nuevoEstado) => {
    try {


      const response = await fetch(`${API_URL}/pedidos/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (response.ok) {
        const result = await response.json();

        return result;
      } else {
        throw new Error(`Error al actualizar estado: ${response.status}`);
      }
    } catch (error) {
      console.error('Error en updateEstado remisión:', error);
      return handleApiError(error);
    }
  }
};



// ========================================
// SERVICIO PARA CONFIGURACIÓN DE IMPRESIÓN
// ========================================

export const configuracionImpresionService = {
  // Obtener configuración activa
  getActiva: async () => {
    try {
      const response = await fetch(`${API_URL}/configuracion-impresion/activa/`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error al obtener configuración de impresión:', error);
      // Retornar configuración por defecto
      return {
        id: null,
        nombre_negocio: 'MI NEGOCIO',
        nit_negocio: '',
        direccion_negocio: '',
        telefono_negocio: '',
        email_negocio: '',
        encabezado_ticket: '',
        pie_pagina_ticket: '',
        mensaje_agradecimiento: '¡Gracias por su compra!',
        logo: null,
        ancho_papel: '80mm',
        mostrar_logo: true,
        mostrar_codigo_barras: false,
        impresora_predeterminada: '',
        resolucion_facturacion: '',
        regimen_tributario: '',
        activo: true
      };
    }
  },

  // Obtener todas las configuraciones
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/configuracion-impresion/`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error al obtener configuraciones:', error);
      return [];
    }
  },

  // Crear nueva configuración
  create: async (configData) => {
    try {
      const formData = new FormData();

      // Agregar campos de texto
      Object.keys(configData).forEach(key => {
        if (key !== 'logo' && configData[key] !== null && configData[key] !== undefined) {
          formData.append(key, configData[key]);
        }
      });

      // Agregar logo si existe
      if (configData.logo && configData.logo instanceof File) {
        formData.append('logo', configData.logo);
      }

      const response = await fetch(`${API_URL}/configuracion-impresion/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error al crear configuración:', error);
      return { error: true, message: error.message };
    }
  },

  // Actualizar configuración existente
  update: async (id, configData) => {
    try {
      const formData = new FormData();

      // Agregar campos de texto
      Object.keys(configData).forEach(key => {
        if (key !== 'logo' && configData[key] !== null && configData[key] !== undefined) {
          formData.append(key, configData[key]);
        }
      });

      // Agregar logo si existe y es un archivo nuevo
      if (configData.logo && configData.logo instanceof File) {
        formData.append('logo', configData.logo);
      }

      const response = await fetch(`${API_URL}/configuracion-impresion/${id}/`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      return { error: true, message: error.message };
    }
  },

  // Eliminar configuración
  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/configuracion-impresion/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar configuración:', error);
      return { error: true, message: error.message };
    }
  }
};
