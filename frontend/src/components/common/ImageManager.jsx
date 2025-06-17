import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Badge } from 'react-bootstrap';
import { localImageService } from '../../services/localImageService';

const ImageManager = () => {
  const [showModal, setShowModal] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Cargar imágenes cuando se abre el modal
  useEffect(() => {
    if (showModal) {
      loadImages();
    }
  }, [showModal]);
  
  // Función para cargar todas las imágenes
  const loadImages = async () => {
    setLoading(true);
    try {
      const allImages = await localImageService.getAllImages();
      setImages(allImages);
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para exportar una imagen
  const exportImage = (image) => {
    try {
      // Crear un enlace para descargar la imagen
      const link = document.createElement('a');
      link.href = image.data;
      link.download = `producto_${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al exportar imagen:', error);
    }
  };
  
  // Función para eliminar una imagen
  const deleteImage = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta imagen?')) {
      try {
        await localImageService.deleteImage(id);
        loadImages(); // Recargar imágenes
      } catch (error) {
        console.error('Error al eliminar imagen:', error);
      }
    }
  };
  
  // Función para exportar todas las imágenes
  const exportAllImages = () => {
    images.forEach(image => {
      exportImage(image);
    });
  };
  
  return (
    <>
      <Button 
        variant="link" 
        onClick={() => setShowModal(true)}
        title="Administrar imágenes locales"
        style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
      >
        <i className="bi bi-images"></i> Imágenes
      </Button>
      
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Administrador de Imágenes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading ? (
            <p className="text-center">Cargando imágenes...</p>
          ) : (
            <>
              <div className="d-flex justify-content-between mb-3">
                <h5>Imágenes guardadas localmente: {images.length}</h5>
                {images.length > 0 && (
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={exportAllImages}
                  >
                    <i className="bi bi-download"></i> Exportar todas
                  </Button>
                )}
              </div>
              
              {images.length > 0 ? (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Vista previa</th>
                        <th>ID Producto</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {images.map(image => (
                        <tr key={image.id}>
                          <td style={{ width: '100px' }}>
                            <img 
                              src={image.data} 
                              alt="Vista previa" 
                              style={{ maxHeight: '50px', maxWidth: '100%' }} 
                            />
                          </td>
                          <td>{image.id}</td>
                          <td>{new Date(image.timestamp).toLocaleString()}</td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="me-2"
                              onClick={() => exportImage(image)}
                            >
                              <i className="bi bi-download"></i>
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => deleteImage(image.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <p className="text-center">No hay imágenes guardadas localmente.</p>
              )}
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

export default ImageManager;