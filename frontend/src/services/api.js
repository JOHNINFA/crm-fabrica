// Servicio para manejar las llamadas a la API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Función para manejar errores de la API
const handleApiError = (error) => {
  console.warn('API no disponible, usando almacenamiento local:', error);
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
      console.log('Intentando obtener productos desde:', `${API_URL}/productos/`);
      const response = await fetch(`${API_URL}/productos/`);
      if (!response.ok) throw new Error(`Error al obtener productos: ${response.status}`);
      const data = await response.json();
      console.log('Productos obtenidos:', data.length);
      return data;
    } catch (error) {
      console.error('Error en getAll:', error);
      return handleApiError(error);
    }
  },

  // Obtener un producto por ID
  getById: async (id) => {
    try {
      console.log('Intentando obtener producto por ID:', id);
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
      console.log('Intentando crear producto:', productoData);
      
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
        
        console.log('Enviando FormData con imagen');
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
        console.log('Enviando JSON sin imagen');
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
      
      console.log('Intentando actualizar producto:', id, productoData);
      
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
        
        console.log('Enviando FormData con imagen');
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
        console.log('Enviando JSON sin imagen');
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
      
      console.log('Intentando actualizar stock:', id, cantidad);
      
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
      console.log('Intentando subir imagen para producto:', id);
      
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
      console.log('🔥 Eliminando producto FÍSICAMENTE:', id);
      const response = await fetch(`${API_URL}/productos/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Error al eliminar producto: ${response.status}`);
      }

      console.log('✅ Producto eliminado de la BD');
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
      console.log('Intentando obtener categorías');
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
      console.log('Intentando crear categoría:', nombre);
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

  // Eliminar una categoría
  delete: async (id) => {
    try {
      console.log('Intentando eliminar categoría con ID:', id);
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
      
      console.log('Intentando obtener lotes:', url);
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
      console.log('Intentando crear lote:', loteData);
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
      console.log('Intentando limpiar tablas:', tables);
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
      
      console.log('Tablas limpiadas correctamente');
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
      console.log('Intentando obtener movimientos:', url);
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
      console.log('Intentando crear movimiento:', movimientoData);
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
      console.log('Intentando obtener ventas:', url);
      
      // Intentar con API primero
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Ventas obtenidas desde API:', data.length);
          return data;
        }
      } catch (apiError) {
        console.warn('API no disponible para obtener ventas:', apiError);
      }

      // Fallback: usar localStorage
      console.log('🔄 Usando localStorage para obtener ventas...');
      const ventasGuardadas = localStorage.getItem('ventas_pos');
      
      if (ventasGuardadas) {
        let ventas = JSON.parse(ventasGuardadas);
        
        // Verificar ventas anuladas y actualizar estados
        const ventasAnuladas = JSON.parse(localStorage.getItem('ventas_anuladas') || '[]');
        if (ventasAnuladas.length > 0) {
          console.log('🔍 Aplicando estados de ventas anuladas:', ventasAnuladas);
          ventas = ventas.map(venta => {
            if (ventasAnuladas.includes(venta.id)) {
              return { ...venta, estado: 'ANULADA' };
            }
            return venta;
          });
        }
        
        console.log('✅ Ventas obtenidas desde localStorage:', ventas.length);
        return ventas;
      } else {
        console.log('ℹ️ No hay ventas en localStorage');
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
      console.log('Intentando crear venta:', ventaData);
      const response = await fetch(`${API_URL}/ventas/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ventaData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error al crear venta: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en create venta:', error);
      return handleApiError(error);
    }
  },

  // Obtener una venta por ID
  getById: async (id) => {
    try {
      console.log('🔍 Intentando obtener venta por ID:', id);
      
      // Intentar con API primero
      try {
        const response = await fetch(`${API_URL}/ventas/${id}/`);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Venta obtenida desde API:', data);
          console.log('📦 Detalles en API:', data.detalles);
          return data;
        } else {
          console.log('⚠️ API response not ok:', response.status);
        }
      } catch (apiError) {
        console.warn('⚠️ API no disponible para obtener venta por ID:', apiError);
      }

      // Fallback: buscar en localStorage
      console.log('🔄 Buscando venta en localStorage...');
      const ventasGuardadas = localStorage.getItem('ventas_pos');
      console.log('📋 Ventas en localStorage:', ventasGuardadas ? 'Encontradas' : 'No encontradas');
      
      if (ventasGuardadas) {
        const ventas = JSON.parse(ventasGuardadas);
        console.log('📋 Total ventas en localStorage:', ventas.length);
        let venta = ventas.find(v => v.id === parseInt(id));
        
        if (venta) {
          // Verificar si está anulada
          const ventasAnuladas = JSON.parse(localStorage.getItem('ventas_anuladas') || '[]');
          if (ventasAnuladas.includes(parseInt(id))) {
            venta = { ...venta, estado: 'ANULADA' };
            console.log('🔍 Venta marcada como ANULADA');
          }
          
          console.log('✅ Venta encontrada en localStorage:', venta);
          console.log('📦 Detalles en localStorage:', venta.detalles);
          return venta;
        } else {
          console.log('❌ Venta no encontrada en localStorage con ID:', id);
          console.log('📋 IDs disponibles:', ventas.map(v => v.id));
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
      console.log('Intentando anular venta:', id);
      
      // Intentar con API primero - usando PATCH para actualizar el estado
      try {
        console.log('🔄 Intentando PATCH a:', `${API_URL}/ventas/${id}/`);
        const patchData = {
          estado: 'ANULADA'
        };
        console.log('📤 Datos a enviar:', patchData);
        
        const response = await fetch(`${API_URL}/ventas/${id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(patchData)
        });

        console.log('📥 Respuesta PATCH:', response.status, response.statusText);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Venta anulada exitosamente con API (PATCH):', result);
          console.log('🔍 Estado en respuesta:', result.estado);
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
          console.log('✅ Venta anulada exitosamente con API (POST anular):', result);
          return result;
        } else {
          console.log('⚠️ Endpoint /anular/ no disponible:', response.status);
        }
      } catch (apiError) {
        console.warn('Endpoint /anular/ no disponible:', apiError);
      }

      // Fallback: marcar como anulada localmente (temporal hasta que API esté disponible)
      console.log('⚠️ API no disponible, usando fallback local temporal');
      console.log('🔍 ID de venta a anular:', id);
      
      // Crear lista de ventas anuladas para persistir el estado
      const ventasAnuladas = JSON.parse(localStorage.getItem('ventas_anuladas') || '[]');
      if (!ventasAnuladas.includes(parseInt(id))) {
        ventasAnuladas.push(parseInt(id));
        localStorage.setItem('ventas_anuladas', JSON.stringify(ventasAnuladas));
        console.log('✅ Venta marcada como anulada localmente:', id);
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
      console.log('Intentando obtener pedidos:', url);
      
      // Intentar con API primero
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Pedidos obtenidos desde API:', data.length);
          return data;
        }
      } catch (apiError) {
        console.warn('API no disponible para obtener pedidos:', apiError);
      }

      // Fallback: usar localStorage
      console.log('🔄 Usando localStorage para obtener pedidos...');
      const pedidosGuardados = localStorage.getItem('pedidos_sistema');
      
      if (pedidosGuardados) {
        let pedidos = JSON.parse(pedidosGuardados);
        
        // Verificar pedidos anulados y actualizar estados
        const pedidosAnulados = JSON.parse(localStorage.getItem('pedidos_anulados') || '[]');
        if (pedidosAnulados.length > 0) {
          console.log('🔍 Aplicando estados de pedidos anulados:', pedidosAnulados);
          pedidos = pedidos.map(pedido => {
            if (pedidosAnulados.includes(pedido.id)) {
              return { ...pedido, estado: 'ANULADA' };
            }
            return pedido;
          });
        }
        
        console.log('✅ Pedidos obtenidos desde localStorage:', pedidos.length);
        return pedidos;
      } else {
        console.log('ℹ️ No hay pedidos en localStorage');
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
      console.log('Intentando crear pedido:', remisionData);
      
      // Intentar con API primero
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
          console.log('✅ Pedido creado exitosamente en API:', result);
          
          // 🆕 Disparar evento para actualizar Total Pedidos en Cargue
          window.dispatchEvent(new CustomEvent('pedidoCreado', { detail: result }));
          
          return result;
        } else {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Error al crear pedido: ${response.status}`);
        }
      } catch (apiError) {
        console.warn('API no disponible, guardando en localStorage:', apiError);
        
        // Fallback: guardar en localStorage
        const pedidosGuardados = JSON.parse(localStorage.getItem('pedidos_sistema') || '[]');
        
        // Generar ID único y número de pedido
        const nuevoId = Date.now();
        const numeroPedido = `PED-${String(nuevoId).slice(-6)}`;
        
        const nuevoPedido = {
          id: nuevoId,
          numero_pedido: numeroPedido,
          ...remisionData,
          fecha_creacion: new Date().toISOString()
        };
        
        pedidosGuardados.push(nuevoPedido);
        localStorage.setItem('pedidos_sistema', JSON.stringify(pedidosGuardados));
        
        console.log('✅ Pedido guardado en localStorage:', nuevoPedido);
        
        // 🆕 Disparar evento para actualizar Total Pedidos en Cargue
        window.dispatchEvent(new CustomEvent('pedidoCreado', { detail: nuevoPedido }));
        
        return nuevoPedido;
      }
    } catch (error) {
      console.error('Error en create pedido:', error);
      return handleApiError(error);
    }
  },

  // Obtener una remisión por ID
  getById: async (id) => {
    try {
      console.log('🔍 Intentando obtener remisión por ID:', id);
      
      // Intentar con API primero
      try {
        const response = await fetch(`${API_URL}/pedidos/${id}/`);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Remisión obtenida desde API:', data);
          return data;
        } else {
          console.log('⚠️ API response not ok:', response.status);
        }
      } catch (apiError) {
        console.warn('⚠️ API no disponible para obtener remisión por ID:', apiError);
      }

      // Fallback: buscar en localStorage
      console.log('🔄 Buscando remisión en localStorage...');
      const remisionesGuardadas = localStorage.getItem('remisiones_sistema');
      
      if (remisionesGuardadas) {
        const remisiones = JSON.parse(remisionesGuardadas);
        let remision = remisiones.find(r => r.id === parseInt(id));
        
        if (remision) {
          // Verificar si está anulada
          const remisionesAnuladas = JSON.parse(localStorage.getItem('remisiones_anuladas') || '[]');
          if (remisionesAnuladas.includes(parseInt(id))) {
            remision = { ...remision, estado: 'ANULADA' };
          }
          
          console.log('✅ Remisión encontrada en localStorage:', remision);
          return remision;
        } else {
          console.log('❌ Remisión no encontrada en localStorage con ID:', id);
        }
      }
      
      throw new Error('Remisión no encontrada en API ni localStorage');
      
    } catch (error) {
      console.error('❌ Error en getById remisión:', error);
      return { error: true, message: error.message };
    }
  },

  // Anular un pedido (remisión)
  anularPedido: async (id, motivo = 'Anulado desde gestión de pedidos') => {
    try {
      console.log('🔴 Intentando anular pedido:', id, 'Motivo:', motivo);
      
      // Intentar con el endpoint específico de anulación
      try {
        const response = await fetch(`${API_URL}/pedidos/${id}/anular/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ motivo })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Pedido anulado exitosamente con API:', result);
          return { 
            success: true, 
            message: result.message || 'Pedido anulado exitosamente',
            pedido: result.pedido
          };
        } else {
          const errorData = await response.json();
          console.error('❌ Error al anular pedido:', errorData);
          throw new Error(errorData.detail || `Error ${response.status}`);
        }
      } catch (apiError) {
        console.error('❌ Error en API al anular pedido:', apiError);
        throw apiError;
      }
      
    } catch (error) {
      console.error('❌ Error en anularPedido:', error);
      return { 
        error: true, 
        message: error.message || 'Error al anular el pedido'
      };
    }
  },

  // Anular una remisión (alias para compatibilidad)
  anularRemision: async (id, motivo) => {
    return pedidoService.anularPedido(id, motivo);
  },

  // Actualizar estado de remisión
  updateEstado: async (id, nuevoEstado) => {
    try {
      console.log('Actualizando estado de remisión:', id, 'a', nuevoEstado);
      
      const response = await fetch(`${API_URL}/pedidos/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Estado de remisión actualizado:', result);
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
