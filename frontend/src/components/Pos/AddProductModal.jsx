import React, { useState, useEffect } from "react";
import { useModalContext } from '../../context/ModalContext';
import { useProducts } from '../../hooks/useUnifiedProducts';
import './AddProductModal.css';

const AddProductModal = ({ show, onClose, selectedProduct }) => {
  // Si se pasa show y onClose como props, usarlos; si no, usar el contexto
  const modalContext = useModalContext();
  const showModal = show !== undefined ? show : modalContext?.showAddProductModal;
  const closeModal = onClose || modalContext?.closeAddProductModal;
  const productToEdit = selectedProduct !== undefined ? selectedProduct : modalContext?.selectedProduct;

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
    ubicacionInventario: "PRODUCCION",
  });

  // Cargar datos del producto seleccionado
  useEffect(() => {
    if (productToEdit) {
      setFormData({
        nombre: productToEdit.name || "",
        precio: productToEdit.price || 0,
        categoria: productToEdit.category || "General",
        tipoMedida: productToEdit.measureType || "und",
        grupoContable: productToEdit.accountGroup || "",
        marca: productToEdit.brand || "GENERICA",
        impuesto: productToEdit.tax || "IVA(0%)",
        precioCompra: productToEdit.purchasePrice || 0,
        precioVenta: productToEdit.price || 0,
        imagen: productToEdit.image || null,
        existencias: productToEdit.stock || 0,
        ubicacionInventario: productToEdit.ubicacionInventario || "PRODUCCION",
      });
    }
  }, [productToEdit]);

  // Utilidades
  const resetForm = () => {
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

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Manejo de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateFormData('imagen', event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Manejo de categorías
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === "nueva_categoria") {
      setShowNewCategoryInput(true);
    } else {
      updateFormData('categoria', value);
    }
  };

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      const success = addCategory(newCategory.trim());
      if (success) {
        updateFormData('categoria', newCategory.trim());
        setNewCategory("");
        setShowNewCategoryInput(false);
      }
    }
  };

  const cancelNewCategory = () => {
    setShowNewCategoryInput(false);
    setNewCategory("");
  };

  // Envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    const productToSave = productToEdit
      ? { ...formData, id: productToEdit.id }
      : formData;

    addProduct(productToSave);
    closeModal();
    resetForm();
  };

  // Renderizar campo de entrada
  const renderInput = (label, field, type = "text", options = {}) => (
    <div className={options.colClass || "col-md-4"}>
      <label>{label}</label>
      <input
        type={type}
        className="form-control"
        value={formData[field]}
        onChange={(e) => updateFormData(field, type === "number" ? Number(e.target.value) : e.target.value)}
        placeholder={options.placeholder}
        {...options.props}
      />
    </div>
  );

  // Renderizar select
  const renderSelect = (label, field, options, colClass = "col-md-4") => (
    <div className={colClass}>
      <label>{label}</label>
      <select
        className="form-select"
        value={formData[field]}
        onChange={(e) => updateFormData(field, e.target.value)}
      >
        {options.map(option => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
    </div>
  );

  if (!showModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content add-product-modal">
        <div className="modal-header">
          <h4>{productToEdit ? 'Editar Producto' : 'Agregar Producto'}</h4>
          <button className="close-button" onClick={closeModal}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Imagen */}
          <div className="form-group image-upload">
            <label>Imagen del Producto</label>
            <div className="image-preview">
              {formData.imagen ? (
                <img src={formData.imagen} alt="Previsualización" className="preview-image" />
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

          {/* Información básica */}
          <div className="form-group row">
            {renderInput("Código de Barras", "codigoBarras", "text", { placeholder: "Código de Barras (EAN)" })}
            {renderInput("Referencia", "referencia", "text", { placeholder: "Referencia" })}
            {renderInput("Nombre", "nombre", "text")}
          </div>

          <div className="form-group row">
            {/* Categoría */}
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
                  <button type="button" className="btn btn-primary" onClick={handleAddNewCategory}>
                    <span className="material-icons" style={{ fontSize: '16px' }}>add</span>
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={cancelNewCategory}>
                    <span className="material-icons" style={{ fontSize: '16px' }}>close</span>
                  </button>
                </div>
              ) : (
                <select className="form-select" value={formData.categoria} onChange={handleCategoryChange}>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="nueva_categoria">+ Nueva Categoría</option>
                </select>
              )}
            </div>

            {/* Tipo de medida */}
            <div className="col-md-4">
              <label>Tipo de Medida</label>
              <div className="input-group">
                <span className="input-group-text">+ Tipo Medida</span>
                {renderSelect("", "tipoMedida", [
                  { value: "und", label: "Unidad (und)" },
                  { value: "kg", label: "Kilogramo (kg)" },
                  { value: "lb", label: "Libra (Lb)" },
                  { value: "l", label: "Litro (l)" }
                ], "").props.children[1]}
              </div>
            </div>

            {renderInput("Grupo Contable", "grupoContable")}
          </div>

          <div className="form-group row">
            {/* Marca */}
            <div className="col-md-4">
              <label>Marca</label>
              <div className="input-group">
                <span className="input-group-text">+ Marca</span>
                {renderSelect("", "marca", ["GENERICA", "Nike", "Adidas"], "").props.children[1]}
              </div>
            </div>

            {renderSelect("Impuesto", "impuesto", ["IVA(0%)", "IVA(5%)", "IVA(19%)"])}
            {renderInput("Existencias", "existencias", "number")}
          </div>

          {/* Ubicación en Inventario */}
          <div className="form-group row">
            <div className="col-md-12">
              <label>Ubicación en Inventario</label>
              <select
                className="form-select"
                value={formData.ubicacionInventario}
                onChange={(e) => updateFormData('ubicacionInventario', e.target.value)}
              >
                <option value="PRODUCCION">Producción</option>
                <option value="MAQUILA">Maquila</option>
              </select>
              <small className="text-muted">Define si este producto aparece en Producción o Maquilas en el módulo de Inventario</small>
            </div>
          </div>

          {/* Precios */}
          <div className="form-group">
            <h5>Precios - Clic Aquí</h5>
            <div className="row">
              {renderSelect("Impuestos", "impuesto", ["IVA(0%)", "IVA(5%)", "IVA(19%)"], "col-md-3")}
              {renderInput("Precio Compra", "precioCompra", "number", { colClass: "col-md-3" })}
              {renderInput("% Utilidad", "utilidad", "number", {
                colClass: "col-md-3",
                placeholder: "Porcentaje de utilidad"
              })}
              {renderInput("Precio Venta + Imp", "precioVenta", "number", { colClass: "col-md-3" })}
            </div>
          </div>

          {/* Botones */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
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