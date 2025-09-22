import React, { useState } from 'react';
import { Button, Modal, ProgressBar } from 'react-bootstrap';

const ImageSyncButton = () => {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [showModal, setShowModal] = useState(false);

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
      setSyncing(true);
      setProgress(0);
      setResults([]);
      setShowModal(true);
      
      // Obtener productos de localStorage
      const productsStr = localStorage.getItem('products');
      if (!productsStr) {
        console.log('No hay productos en localStorage');
        setSyncing(false);
        return [];
      }
      
      const products = JSON.parse(productsStr);
      const productsWithImages = products.filter(p => p.image && typeof p.image === 'string' && p.image.startsWith('data:'));
      
      console.log(`Sincronizando ${productsWithImages.length} productos con imágenes...`);
      
      const results = [];
      let completed = 0;
      
      // Sincronizar cada imagen
      for (const product of productsWithImages) {
        console.log(`Procesando producto: ${product.name}`);
        
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
        
        completed++;
        setProgress(Math.round((completed / productsWithImages.length) * 100));
      }
      
      // Guardar productos actualizados en localStorage
      localStorage.setItem('products', JSON.stringify(products));
      
      console.log('Sincronización completada:', results);
      setResults(results);
      setSyncing(false);
      return results;
    } catch (error) {
      console.error('Error al sincronizar imágenes:', error);
      setSyncing(false);
      return [];
    }
  };

  return (
    <>
      <Button 
        variant="info" 
        onClick={syncAllImages} 
        disabled={syncing}
      >
        {syncing ? 'Sincronizando...' : 'Sincronizar Imágenes con Servidor'}
      </Button>
      
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Sincronización de Imágenes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {syncing ? (
            <>
              <p>Sincronizando imágenes con el servidor...</p>
              <ProgressBar now={progress} label={`${progress}%`} />
            </>
          ) : (
            <>
              <p>Sincronización completada</p>
              <ul>
                {results.map((result, index) => (
                  <li key={index}>
                    {result.productName}: {result.success ? 'Éxito' : 'Error'}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ImageSyncButton;