import React, { useState, useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';
import { Form, Button, Row, Col, InputGroup } from 'react-bootstrap';
import ImageUploader from '../common/ImageUploader';

const ProductForm = ({ initialData = {}, onSave, onCancel }) => {
  const { categories } = useProducts();
  
  const [formData, setFormData] = useState({
    nombre: '',
    precioVenta: '',
    precioCompra: '',
    existencias: '',
    categoria: '',
    marca: '',
    impuesto: 'IVA(0%)',
    imagen: null,
    ...initialData
  });
  
  const [imagePreview, setImagePreview] = useState(initialData.image || null);
  const [validated, setValidated] = useState(false);
  
  // Actualizar el formulario si cambian los datos iniciales
  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.name || '',
        precioVenta: initialData.price || '',
        precioCompra: initialData.purchasePrice || '',
        existencias: initialData.stock || '',
        categoria: initialData.category || '',
        marca: initialData.brand || '',
        impuesto: initialData.tax || 'IVA(0%)',
        imagen: null,
        ...initialData
      });
      
      setImagePreview(initialData.image || null);
    }
  }, [initialData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = (imageData) => {
    console.log("Imagen seleccionada:", imageData ? "Imagen presente" : "Sin imagen");
    setFormData(prev => ({ ...prev, imagen: imageData }));
    setImagePreview(imageData);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    // Preparar datos para guardar
    const productData = {
      ...formData,
      // Asegurarse de que los valores numéricos sean números
      precioVenta: parseFloat(formData.precioVenta) || 0,
      precioCompra: parseFloat(formData.precioCompra) || 0,
      existencias: parseInt(formData.existencias) || 0,
    };
    
    console.log("Guardando producto con datos:", productData);
    console.log("Imagen:", imagePreview ? "Presente" : "No presente");
    
    // Si hay una imagen en el preview pero no en formData.imagen, usar la del preview
    if (!productData.imagen && imagePreview) {
      productData.imagen = imagePreview;
    }
    
    onSave(productData);
  };
  
  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Row className="mb-3">
        <Col md={8}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre del Producto</Form.Label>
            <Form.Control
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              placeholder="Nombre del producto"
            />
            <Form.Control.Feedback type="invalid">
              El nombre es obligatorio
            </Form.Control.Feedback>
          </Form.Group>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Precio de Venta</Form.Label>
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    name="precioVenta"
                    value={formData.precioVenta}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <Form.Control.Feedback type="invalid">
                    Ingrese un precio válido
                  </Form.Control.Feedback>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Precio de Compra</Form.Label>
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    name="precioCompra"
                    value={formData.precioCompra}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Existencias</Form.Label>
                <Form.Control
                  type="number"
                  name="existencias"
                  value={formData.existencias}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Categoría</Form.Label>
                <Form.Select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  Seleccione una categoría
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Marca</Form.Label>
                <Form.Control
                  type="text"
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange}
                  placeholder="Marca del producto"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Impuesto</Form.Label>
                <Form.Select
                  name="impuesto"
                  value={formData.impuesto}
                  onChange={handleChange}
                >
                  <option value="IVA(0%)">IVA(0%)</option>
                  <option value="IVA(5%)">IVA(5%)</option>
                  <option value="IVA(19%)">IVA(19%)</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Col>
        
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Imagen del Producto</Form.Label>
            <ImageUploader
              initialImage={imagePreview}
              onImageChange={handleImageChange}
              className="mb-3"
            />
            <div className="text-center text-muted small">
              Tamaño recomendado: 300x300 px
            </div>
          </Form.Group>
        </Col>
      </Row>
      
      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit">
          Guardar Producto
        </Button>
      </div>
    </Form>
  );
};

export default ProductForm;