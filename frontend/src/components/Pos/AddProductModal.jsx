import React, { useState, useEffect } from "react";
import { useModalContext } from '../../context/ModalContext';
import { useProducts } from '../../context/ProductContext';
import './AddProductModal.css';

const AddProductModal = () => {
  const {
    showAddProductModal,
    closeAddProductModal,
    selectedProduct
  } = useModalContext();

  const { addProduct, categories, addCategory } = useProducts();
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    precio: 0,
    categoria: "General",
    tipoMedida: "und",
    grupoContable: "",
    marca: "GENERICA",
    impuesto: "IVA(0%)",
    precioCompra: 0,
    precioVenta: 0,
    imagen: null,
    existencias: 0,
  });

  // Cuando se selecciona un producto para editar, rellenar el formulario
  useEffect(() => {
    if (selectedProduct) {
      setFormData({
        nombre: selectedProduct.name || "",
        precio: selectedProduct.price || 0,
        categoria: selectedProduct.category || "General",
        tipoMedida: selectedProduct.measureType || "und",
        grupoContable: selectedProduct.accountGroup || "",
        marca: selectedProduct.brand || "GENERICA",
        impuesto: selectedProduct.tax || "IVA(0%)",
        precioCompra: selectedProduct.purchasePrice || 0,
        precioVenta: selectedProduct.price || 0,
        imagen: selectedProduct.image || null,
        existencias: selectedProduct.stock || 0,
      });
    }
  }, [selectedProduct]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, imagen: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === "nueva_categoria") {
      setShowNewCategoryInput(true);
    } else {
      setFormData({ ...formData, categoria: value });
    }
  };

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      const success = addCategory(newCategory.trim());
      if (success) {
        setFormData({ ...formData, categoria: newCategory.trim() });
        setNewCategory("");
        setShowNewCategoryInput(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addProduct(formData);
    closeAddProductModal();
    setFormData({
      nombre: "",
      precio: 0,
      categoria: "General",
      tipoMedida: "und",
      grupoContable: "",
      marca: "GENERICA",
      impuesto: "IVA(0%)",
      precioCompra: 0,
      precioVenta: 0,
      imagen: null,
      existencias: 0,
    });
    setShowNewCategoryInput(false);
    setNewCategory("");
  };

  if (!showAddProductModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h4>{selectedProduct ? 'Editar Producto' : 'Agregar Producto'}</h4>
          <button className="close-button" onClick={closeAddProductModal}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Campo de Subida de Imagen */}
          <div className="form-group image-upload">
            <label>Imagen del Producto</label>
            <div className="image-preview">
              {formData.imagen ? (
                <img src={formData.imagen} alt="Previsualización de la imagen" className="preview-image" />
              ) : (
                <span className="placeholder">Clic en la imagen para cambiarla</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
              id="imageInput"
            />
            <label htmlFor="imageInput" className="btn btn-secondary">
              Seleccionar Imagen
            </label>
          </div>

          {/* Sección Básica */}
          <div className="form-group row">
            <div className="col-md-4">
              <label>Código de Barras</label>
              <input
                type="text"
                className="form-control"
                placeholder="Código de Barras (EAN)"
              />
            </div>
            <div className="col-md-4">
              <label>Referencia</label>
              <input
                type="text"
                className="form-control"
                placeholder="Referencia"
              />
            </div>
            <div className="col-md-4">
              <label>Nombre</label>
              <input
                type="text"
                className="form-control"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group row">
            <div className="col-md-4">
              <label>Categoría</label>
              {showNewCategoryInput ? (
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Nueva categoría"
                  />
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleAddNewCategory}
                  >
                    <span className="material-icons" style={{fontSize: '16px'}}>add</span>
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowNewCategoryInput(false);
                      setNewCategory("");
                    }}
                  >
                    <span className="material-icons" style={{fontSize: '16px'}}>close</span>
                  </button>
                </div>
              ) : (
                <select
                  className="form-select"
                  value={formData.categoria}
                  onChange={handleCategoryChange}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="nueva_categoria">+ Nueva Categoría</option>
                </select>
              )}
            </div>
            <div className="col-md-4">
              <label>Tipo de Medida</label>
              <div className="input-group">
                <span className="input-group-text">+ Tipo Medida</span>
                <select
                  className="form-select"
                  value={formData.tipoMedida}
                  onChange={(e) => setFormData({ ...formData, tipoMedida: e.target.value })}
                >
                  <option value="und">Unidad (und)</option>
                  <option value="kg">Kilogramo (kg)</option>
                  <option value="lb">Libra (Lb)</option>
                  <option value="l">Litro (l)</option>
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <label>Grupo Contable</label>
              <input
                type="text"
                className="form-control"
                value={formData.grupoContable}
                onChange={(e) => setFormData({ ...formData, grupoContable: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group row">
            <div className="col-md-4">
              <label>Marca</label>
              <div className="input-group">
                <span className="input-group-text">+ Marca</span>
                <select
                  className="form-select"
                  value={formData.marca}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                >
                  <option>GENERICA</option>
                  <option>Nike</option>
                  <option>Adidas</option>
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <label>Impuesto</label>
              <select
                className="form-select"
                value={formData.impuesto}
                onChange={(e) => setFormData({ ...formData, impuesto: e.target.value })}
              >
                <option>IVA(0%)</option>
                <option>IVA(5%)</option>
                <option>IVA(19%)</option>
              </select>
            </div>
            <div className="col-md-4">
              <label>Existencias</label>
              <input
                type="number"
                className="form-control"
                value={formData.existencias}
                onChange={(e) => setFormData({ ...formData, existencias: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Sección de Precios */}
          <div className="form-group">
            <h5>Precios - Clic Aquí</h5>
            <div className="row">
              <div className="col-md-3">
                <label>Impuestos</label>
                <select
                  className="form-select"
                  value={formData.impuesto}
                  onChange={(e) => setFormData({ ...formData, impuesto: e.target.value })}
                >
                  <option>IVA(0%)</option>
                  <option>IVA(5%)</option>
                  <option>IVA(19%)</option>
                </select>
              </div>
              <div className="col-md-3">
                <label>Precio Compra</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.precioCompra}
                  onChange={(e) => setFormData({ ...formData, precioCompra: Number(e.target.value) })}
                />
              </div>
              <div className="col-md-3">
                <label>% Utilidad</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Porcentaje de utilidad"
                />
              </div>
              <div className="col-md-3">
                <label>Precio Venta + Imp</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.precioVenta}
                  onChange={(e) => setFormData({ ...formData, precioVenta: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeAddProductModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;