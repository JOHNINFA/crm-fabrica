/**
 * fileSystemImageService.js
 * 
 * Este servicio maneja el almacenamiento de imágenes en el sistema de archivos
 * a través del backend.
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Guardar una imagen en el sistema de archivos
const saveImageToFileSystem = async (imageData, productId, productName) => {
  try {
    if (!imageData || !imageData.startsWith('data:')) {
      return null;
    }
    
    // Enviar la imagen al backend
    const response = await fetch(`${API_URL}/productos/save_image/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData,
        productId,
        productName: productName || 'producto'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Error al guardar imagen: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Guardar la referencia a la imagen en localStorage
    const imageMapStr = localStorage.getItem('imageMap') || '{}';
    const imageMap = JSON.parse(imageMapStr);
    imageMap[productId] = {
      url: data.frontendUrl,
      filename: data.filename,
      timestamp: Date.now()
    };
    localStorage.setItem('imageMap', JSON.stringify(imageMap));
    
    // Devolver la URL de la imagen
    return data.frontendUrl;
  } catch (error) {
    console.error('Error al guardar imagen en sistema de archivos:', error);
    
    // Si falla la conexión con el backend, guardar en IndexedDB como respaldo
    try {
      const { localImageService } = await import('./localImageService');
      await localImageService.saveImage(productId, imageData);

    } catch (dbError) {
      console.error('Error al guardar imagen en IndexedDB:', dbError);
    }
    
    return null;
  }
};

// Obtener la URL de una imagen
const getImageUrl = (productId) => {
  try {
    const imageMapStr = localStorage.getItem('imageMap') || '{}';
    const imageMap = JSON.parse(imageMapStr);
    return imageMap[productId]?.url || null;
  } catch (error) {
    console.error('Error al obtener URL de imagen:', error);
    return null;
  }
};

export const fileSystemImageService = {
  saveImageToFileSystem,
  getImageUrl
};