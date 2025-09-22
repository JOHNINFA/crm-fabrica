/**
 * exportImages.js
 * 
 * Este script exporta las imágenes base64 de los productos a archivos
 * en la carpeta compartida.
 */

// Función para convertir una URL de datos (base64) a un Blob
const dataURLtoBlob = (dataUrl) => {
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
  
  return new Blob([u8arr], { type: mime });
};

// Función para descargar un Blob como archivo
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Función para exportar todas las imágenes base64 a archivos
const exportAllImages = () => {
  try {
    // Obtener productos de localStorage
    const productsStr = localStorage.getItem('products');
    if (!productsStr) {
      console.log('No hay productos en localStorage');
      return [];
    }
    
    const products = JSON.parse(productsStr);
    const results = [];
    
    console.log(`Exportando imágenes de ${products.length} productos...`);
    
    // Exportar cada imagen
    products.forEach(product => {
      if (product.image && typeof product.image === 'string' && product.image.startsWith('data:')) {
        console.log(`Exportando imagen para: ${product.name}`);
        
        // Convertir la imagen a Blob
        const blob = dataURLtoBlob(product.image);
        if (blob) {
          // Generar un nombre de archivo único
          const extension = product.image.split(';')[0].split('/')[1] || 'png';
          const filename = `producto_${product.id}_${Date.now()}.${extension}`;
          
          // Descargar la imagen
          downloadBlob(blob, filename);
          
          results.push({
            productId: product.id,
            productName: product.name,
            filename,
            success: true
          });
        } else {
          console.error(`Error al convertir imagen para ${product.name}`);
          results.push({
            productId: product.id,
            productName: product.name,
            success: false
          });
        }
      }
    });
    
    console.log('Exportación completada:', results);
    return results;
  } catch (error) {
    console.error('Error al exportar imágenes:', error);
    return [];
  }
};

// Exportar la función
export { exportAllImages };