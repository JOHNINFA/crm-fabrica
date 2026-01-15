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

// 🆕 Limpiar imágenes antiguas (más de 30 días)
const cleanOldImages = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');

    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const images = request.result;
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000); // 30 días en ms

        let deleted = 0;

        images.forEach(img => {
          if (img.timestamp && img.timestamp < thirtyDaysAgo) {
            store.delete(img.id);
            deleted++;
          }
        });

        if (deleted > 0) {
          console.log(`🧹 Limpiadas ${deleted} imágenes antiguas de IndexedDB`);
        }

        resolve(deleted);
      };

      request.onerror = () => {
        console.error('Error al limpiar imágenes antiguas');
        reject(0);
      };
    });
  } catch (error) {
    console.error('Error al limpiar imágenes antiguas:', error);
    return 0;
  }
};

// 🆕 Obtener tamaño aproximado del storage
const getStorageSize = async () => {
  try {
    const images = await getAllImages();
    let totalSize = 0;

    images.forEach(img => {
      if (img.data) {
        // Estimar tamaño en bytes (base64 tiene ~1.33x el tamaño real)
        totalSize += img.data.length;
      }
    });

    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
    console.log(`📦 Tamaño total de imágenes en IndexedDB: ${sizeInMB} MB`);

    return parseFloat(sizeInMB);
  } catch (error) {
    console.error('Error al calcular tamaño del storage:', error);
    return 0;
  }
};

// 🆕 Limpieza completa de la base de datos (emergencia)
const clearAllImages = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');

    const request = store.clear();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log('🧹 Todas las imágenes han sido eliminadas de IndexedDB');
        resolve(true);
      };

      request.onerror = () => {
        console.error('Error al limpiar todas las imágenes');
        reject(false);
      };
    });
  } catch (error) {
    console.error('Error al limpiar todas las imágenes:', error);
    return false;
  }
};

export const localImageService = {
  saveImage,
  getImage,
  deleteImage,
  getAllImages,
  cleanOldImages,      // 🆕 Limpiar imágenes antiguas
  getStorageSize,      // 🆕 Ver tamaño del storage
  clearAllImages       // 🆕 Limpieza de emergencia
};