// Servicio para manejar las llamadas a la API
const API_URL = 'http://localhost:8000/api';

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
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`Error al obtener ventas: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getAll ventas:', error);
      return handleApiError(error);
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
      console.log('Intentando obtener venta por ID:', id);
      const response = await fetch(`${API_URL}/ventas/${id}/`);
      if (!response.ok) throw new Error(`Error al obtener venta: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getById venta:', error);
      return handleApiError(error);
    }
  },
};