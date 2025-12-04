/**
 * sharedImageService.js
 * 
 * Este servicio maneja el almacenamiento de imágenes en una carpeta compartida
 * entre el frontend y el backend.
 */

// URL base para las imágenes compartidas
const SHARED_IMAGE_BASE_URL = '/images/productos/';

// Función para guardar una imagen en la carpeta compartida
const saveImageToShared = async (imageData, productId, productName) => {
  try {
    if (!imageData || !imageData.startsWith('data:')) {
      return null;
    }
    
    // Generar un nombre de archivo único basado en el ID del producto
    const extension = imageData.split(';')[0].split('/')[1] || 'png';
    const filename = `producto_${productId || 'nuevo'}_${Date.now()}.${extension}`;
    const imagePath = `${SHARED_IMAGE_BASE_URL}${filename}`;
    
    // En un entorno de desarrollo, no podemos escribir directamente en el sistema de archivos
    // desde el navegador. En su lugar, vamos a simular esto guardando la URL en localStorage
    // y proporcionando instrucciones para la implementación real.
    
    console.log(`
      INSTRUCCIONES PARA IMPLEMENTACIÓN REAL:
      --------------------------------------
      1. Crear un endpoint en el backend para recibir imágenes
      2. Enviar la imagen al backend usando FormData
      3. En el backend, guardar la imagen en la carpeta compartida
      4. Devolver la URL de la imagen guardada
      
      Por ahora, simularemos esto guardando la URL en localStorage.
    `);
    
    // Guardar la referencia a la imagen en localStorage
    const imageMapStr = localStorage.getItem('imageMap') || '{}';
    const imageMap = JSON.parse(imageMapStr);
    imageMap[productId] = {
      url: imagePath,
      dataUrl: imageData,
      filename
    };
    localStorage.setItem('imageMap', JSON.stringify(imageMap));
    
    // En una implementación real, aquí subiríamos la imagen al backend
    
    return imagePath;
  } catch (error) {
    console.error('Error al guardar imagen en carpeta compartida:', error);
    return null;
  }
};

// Función para obtener la URL de una imagen compartida
const getSharedImageUrl = (productId) => {
  try {
    const imageMapStr = localStorage.getItem('imageMap') || '{}';
    const imageMap = JSON.parse(imageMapStr);
    return imageMap[productId]?.url || null;
  } catch (error) {
    console.error('Error al obtener URL de imagen compartida:', error);
    return null;
  }
};

// Función para sincronizar imágenes con el backend
const syncImagesWithBackend = async () => {
  try {
    const imageMapStr = localStorage.getItem('imageMap') || '{}';
    const imageMap = JSON.parse(imageMapStr);
    
    // En una implementación real, aquí enviaríamos las imágenes al backend

    
    // Simular éxito
    return Object.keys(imageMap).map(productId => ({
      productId,
      success: true,
      url: imageMap[productId].url
    }));
  } catch (error) {
    console.error('Error al sincronizar imágenes con el backend:', error);
    return [];
  }
};

export const sharedImageService = {
  saveImageToShared,
  getSharedImageUrl,
  syncImagesWithBackend,
  SHARED_IMAGE_BASE_URL
};