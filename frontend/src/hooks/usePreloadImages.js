// Hook para precargar y cachear imágenes de productos en IndexedDB
import { useEffect } from 'react';
import { localImageService } from '../services/localImageService';

// Función para convertir imagen URL a base64
const imageUrlToBase64 = async (url) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error convirtiendo imagen a base64:', error);
        return null;
    }
};

export const usePreloadImages = (products) => {
    useEffect(() => {
        if (!products || products.length === 0) return;

        const preloadAndCache = async () => {
            // 🆕 Limpiar imágenes antiguas antes de cachear nuevas
            await localImageService.cleanOldImages();

            // 🆕 Verificar espacio (si es mayor a 50MB, intentar limpiar)
            const size = await localImageService.getStorageSize();
            if (size > 50) {
                console.warn('⚠️ Storage > 50MB. Ejecutando limpieza profunda...');
                await localImageService.cleanOldImages(); // Reintentar
            }

            let cached = 0;

            for (const product of products) {
                if (product.image && product.image.startsWith('http')) {
                    try {
                        // Verificar si ya está en IndexedDB
                        const existingImage = await localImageService.getImage(product.id);

                        if (!existingImage) {
                            // Convertir a base64 y guardar
                            const base64 = await imageUrlToBase64(product.image);
                            if (base64) {
                                try {
                                    await localImageService.saveImage(product.id, base64);
                                    cached++;
                                } catch (e) {
                                    console.error('Error guardando imagen (posible cuota excedida):', e);
                                    // Si falla guardar, probablemente está lleno
                                    // Intentar limpiar todo como último recurso
                                    if (size > 80) { // Si > 80MB
                                        await localImageService.clearAllImages();
                                    }
                                    break; // Detener cacheo para no saturar errores inútilmente
                                }
                            }
                        }
                    } catch (error) {
                        console.warn(`Error cacheando imagen del producto ${product.id}:`, error);
                    }
                }
            }

            if (cached > 0) {
                console.log(`✅ Cacheadas ${cached} imágenes nuevas en IndexedDB`);
            }
        };

        preloadAndCache();
    }, [products]);
};

export default usePreloadImages;
