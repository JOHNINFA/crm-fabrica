/**
 * localImageService.js
 * 
 * Este servicio maneja el almacenamiento local de imágenes.
 * Guarda las imágenes en IndexedDB para acceso offline.
 */

// Crear y abrir la base de datos IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ProductImages', 1);
    
    request.onerror = (event) => {
      reject('Error al abrir la base de datos');
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
};

// Guardar una imagen en IndexedDB
const saveImage = async (productId, imageData) => {
  try {
    if (!imageData || !productId) return null;
    
    const db = await openDB();
    const transaction = db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');
    
    // Crear un objeto con la imagen
    const imageObject = {
      id: productId,
      data: imageData,
      timestamp: Date.now()
    };
    
    // Guardar la imagen
    const request = store.put(imageObject);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`Imagen guardada localmente para producto ${productId}`);
        resolve(true);
      };
      
      request.onerror = () => {
        console.error(`Error al guardar imagen para producto ${productId}`);
        reject(false);
      };
    });
  } catch (error) {
    console.error('Error al guardar imagen localmente:', error);
    return false;
  }
};

// Obtener una imagen de IndexedDB
const getImage = async (productId) => {
  try {
    if (!productId) return null;
    
    const db = await openDB();
    const transaction = db.transaction(['images'], 'readonly');
    const store = transaction.objectStore('images');
    
    const request = store.get(productId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error(`Error al obtener imagen para producto ${productId}`);
        reject(null);
      };
    });
  } catch (error) {
    console.error('Error al obtener imagen localmente:', error);
    return null;
  }
};

// Eliminar una imagen de IndexedDB
const deleteImage = async (productId) => {
  try {
    if (!productId) return false;
    
    const db = await openDB();
    const transaction = db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');
    
    const request = store.delete(productId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`Imagen eliminada localmente para producto ${productId}`);
        resolve(true);
      };
      
      request.onerror = () => {
        console.error(`Error al eliminar imagen para producto ${productId}`);
        reject(false);
      };
    });
  } catch (error) {
    console.error('Error al eliminar imagen localmente:', error);
    return false;
  }
};

// Obtener todas las imágenes de IndexedDB
const getAllImages = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction(['images'], 'readonly');
    const store = transaction.objectStore('images');
    
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('Error al obtener todas las imágenes');
        reject([]);
      };
    });
  } catch (error) {
    console.error('Error al obtener todas las imágenes localmente:', error);
    return [];
  }
};

export const localImageService = {
  saveImage,
  getImage,
  deleteImage,
  getAllImages
};