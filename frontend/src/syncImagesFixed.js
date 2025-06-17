// Script mejorado para sincronizar imágenes con el backend
// Ejecutar en la consola del navegador

// Función para convertir una URL de datos (base64) a un objeto File
const dataURLtoFile = (dataUrl, filename) => {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return null;
  }
  
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};

// Función para crear un producto en el backend
const createProduct = async (product) => {
  try {
    const response = await fetch('http://localhost:8000/api/productos/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre: product.name,
        descripcion: product.description || '',
        precio: product.price || 0,
        precio_compra: product.purchasePrice || 0,
        stock_total: product.stock || 0,
        categoria: 1, // Usar categoría por defecto (ID 1)
        marca: product.brand || 'GENERICA',
        impuesto: product.tax || 'IVA(0%)',
        activo: true
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Error al crear producto: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al crear producto:', error);
    return null;
  }
};

// Función para subir una imagen al servidor
const uploadImage = async (imageData, product) => {
  try {
    // Verificar si el producto existe en el backend
    let backendProduct;
    try {
      const response = await fetch(`http://localhost:8000/api/productos/${product.id}/`);
      if (!response.ok) {
        console.log(`Producto ${product.id} no existe en el backend, creándolo...`);
        backendProduct = await createProduct(product);
        if (!backendProduct) {
          throw new Error(`No se pudo crear el producto ${product.name}`);
        }
      } else {
        backendProduct = await response.json();
      }
    } catch (error) {
      console.log(`Error al verificar producto ${product.id}, creándolo...`);
      backendProduct = await createProduct(product);
      if (!backendProduct) {
        throw new Error(`No se pudo crear el producto ${product.name}`);
      }
    }
    
    // Si la imagen es una URL de datos (base64), convertirla a File
    let imageFile;
    if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      const extension = imageData.split(';')[0].split('/')[1] || 'png';
      const filename = `producto_${backendProduct.id}.${extension}`;
      imageFile = dataURLtoFile(imageData, filename);
    } else if (imageData instanceof File) {
      imageFile = imageData;
    } else {
      console.warn('Formato de imagen no soportado:', typeof imageData);
      return null;
    }
    
    if (!imageFile) {
      return null;
    }
    
    // Crear FormData para enviar la imagen
    const formData = new FormData();
    formData.append('imagen', imageFile);
    
    // Actualizar la imagen del producto
    const response = await fetch(`http://localhost:8000/api/productos/${backendProduct.id}/`, {
      method: 'PATCH',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Error al actualizar imagen del producto ${backendProduct.id}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.imagen; // Devolver la URL de la imagen en el servidor
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return null;
  }
};

// Sincronizar todas las imágenes de productos en localStorage con el backend
const syncAllImages = async () => {
  try {
    // Obtener productos de localStorage
    const productsStr = localStorage.getItem('products');
    if (!productsStr) {
      console.log('No hay productos en localStorage');
      return [];
    }
    
    const products = JSON.parse(productsStr);
    const results = [];
    
    console.log(`Sincronizando ${products.length} productos...`);
    
    // Sincronizar cada imagen
    for (const product of products) {
      console.log(`Procesando producto: ${product.name}`);
      
      if (product.image && typeof product.image === 'string' && product.image.startsWith('data:')) {
        console.log(`Subiendo imagen para: ${product.name}`);
        const imageUrl = await uploadImage(product.image, product);
        
        if (imageUrl) {
          console.log(`Imagen subida exitosamente para ${product.name}: ${imageUrl}`);
          // Actualizar la URL de la imagen en localStorage
          product.image = imageUrl;
          results.push({
            productId: product.id,
            productName: product.name,
            success: true,
            imageUrl
          });
        } else {
          console.error(`Error al subir imagen para ${product.name}`);
          results.push({
            productId: product.id,
            productName: product.name,
            success: false
          });
        }
      } else {
        console.log(`El producto ${product.name} no tiene imagen o no está en formato base64`);
      }
    }
    
    // Guardar productos actualizados en localStorage
    localStorage.setItem('products', JSON.stringify(products));
    
    console.log('Sincronización completada:', results);
    return results;
  } catch (error) {
    console.error('Error al sincronizar imágenes:', error);
    return [];
  }
};

// Ejecutar la sincronización
syncAllImages().then(results => {
  console.log(`Sincronización finalizada. ${results.filter(r => r.success).length} imágenes subidas correctamente.`);
});