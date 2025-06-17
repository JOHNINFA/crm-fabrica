import React from 'react';
import { Button } from 'react-bootstrap';
import { exportAllImages } from '../../utils/exportImages';

const ExportImagesButton = () => {
  const handleExport = () => {
    const results = exportAllImages();
    alert(`Exportación completada. ${results.filter(r => r.success).length} imágenes exportadas.`);
  };

  return (
    <Button 
      variant="link" 
      onClick={handleExport}
      title="Exportar imágenes de productos"
      style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
    >
      <i className="bi bi-download"></i> Exportar imágenes
    </Button>
  );
};

export default ExportImagesButton;