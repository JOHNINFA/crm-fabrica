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
  const [showDisponibilidad, setShowDisponibilidad] = useState(false);

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
    disponible_pos: true,
    disponible_cargue: true,
    disponible_pedidos: true,
    disponible_inventario: true,
    disponible_app_cargue: true,
    disponible_app_sugeridos: true,
    disponible_app_rendimiento: true,
    disponible_app_ventas: true,
  });

  // Cargar datos del producto seleccionado
  useEffect(() => {
    if (productToEdit) {

      console.log('Disponibilidad:', {
        pos: productToEdit.disponible_pos,
        cargue: productToEdit.disponible_cargue,
        pedidos: productToEdit.disponible_pedidos,
        inventario: productToEdit.disponible_inventario,
        app_cargue: productToEdit.disponible_app_cargue,
        app_sugeridos: productToEdit.disponible_app_sugeridos,
        app_rendimiento: productToEdit.disponible_app_rendimiento,
        app_ventas: productToEdit.disponible_app_ventas
      });
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
        disponible_pos: productToEdit.disponible_pos !== undefined ? productToEdit.disponible_pos : true,
        disponible_cargue: productToEdit.disponible_cargue !== undefined ? productToEdit.disponible_cargue : true,
        disponible_pedidos: productToEdit.disponible_pedidos !== undefined ? productToEdit.disponible_pedidos : true,
        disponible_inventario: productToEdit.disponible_inventario !== undefined ? productToEdit.disponible_inventario : true,
        disponible_app_cargue: productToEdit.disponible_app_cargue !== undefined ? productToEdit.disponible_app_cargue : true,
        disponible_app_sugeridos: productToEdit.disponible_app_sugeridos !== undefined ? productToEdit.disponible_app_sugeridos : true,
        disponible_app_rendimiento: productToEdit.disponible_app_rendimiento !== undefined ? productToEdit.disponible_app_rendimiento : true,
        disponible_app_ventas: productToEdit.disponible_app_ventas !== undefined ? productToEdit.disponible_app_ventas : true,
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

          {/* 🆕 DISPONIBILIDAD POR MÓDULO - Expandible */}
          <div className="form-group">
            <div
              className="d-flex align-items-center justify-content-between p-2 border rounded"
              style={{ cursor: 'pointer', backgroundColor: '#f8f9fa' }}
              onClick={() => setShowDisponibilidad(!showDisponibilidad)}
            >
              <span className="fw-bold">
                <i className={`bi bi-${showDisponibilidad ? 'chevron-down' : 'chevron-right'} me-2`}></i>
                Disponibilidad por Módulo
              </span>
              <span className="badge bg-secondary">
                {[formData.disponible_pos, formData.disponible_cargue, formData.disponible_pedidos, formData.disponible_inventario, formData.disponible_app_cargue, formData.disponible_app_sugeridos, formData.disponible_app_rendimiento, formData.disponible_app_ventas].filter(Boolean).length}/8
              </span>
            </div>

            {showDisponibilidad && (
              <div className="border border-top-0 rounded-bottom p-3" style={{ backgroundColor: '#f8f9fa' }}>
                {/* CRM Web */}
                <div className="mb-4 p-3 bg-white rounded shadow-sm">
                  <h6 className="fw-bold mb-3" style={{ color: '#495057' }}>
                    <i className="bi bi-laptop me-2"></i>CRM Web
                  </h6>
                  <div className="row g-3">
                    <div className="col-6 col-md-3">
                      <div className="form-check form-switch d-flex align-items-center">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="disponible_pos"
                          checked={formData.disponible_pos}
                          onChange={(e) => updateFormData('disponible_pos', e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <label className="form-check-label ms-2" htmlFor="disponible_pos" style={{ cursor: 'pointer', userSelect: 'none', fontSize: '14px' }}>
                          POS
                        </label>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="form-check form-switch d-flex align-items-center">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="disponible_cargue"
                          checked={formData.disponible_cargue}
                          onChange={(e) => updateFormData('disponible_cargue', e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <label className="form-check-label ms-2" htmlFor="disponible_cargue" style={{ cursor: 'pointer', userSelect: 'none', fontSize: '14px' }}>
                          Cargue
                        </label>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="form-check form-switch d-flex align-items-center">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="disponible_pedidos"
                          checked={formData.disponible_pedidos}
                          onChange={(e) => updateFormData('disponible_pedidos', e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <label className="form-check-label ms-2" htmlFor="disponible_pedidos" style={{ cursor: 'pointer', userSelect: 'none', fontSize: '14px' }}>
                          Pedidos
                        </label>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="form-check form-switch d-flex align-items-center">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="disponible_inventario"
                          checked={formData.disponible_inventario}
                          onChange={(e) => updateFormData('disponible_inventario', e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <label className="form-check-label ms-2" htmlFor="disponible_inventario" style={{ cursor: 'pointer', userSelect: 'none', fontSize: '14px' }}>
                          Inventario
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* App Móvil */}
                <div className="p-3 bg-white rounded shadow-sm">
                  <h6 className="fw-bold mb-3" style={{ color: '#495057' }}>
                    <i className="bi bi-phone me-2"></i>App Móvil
                  </h6>
                  <div className="row g-3">
                    <div className="col-6 col-md-3">
                      <div className="form-check form-switch d-flex align-items-center">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="disponible_app_cargue"
                          checked={formData.disponible_app_cargue}
                          onChange={(e) => updateFormData('disponible_app_cargue', e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <label className="form-check-label ms-2" htmlFor="disponible_app_cargue" style={{ cursor: 'pointer', userSelect: 'none', fontSize: '14px' }}>
                          Cargue
                        </label>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="form-check form-switch d-flex align-items-center">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="disponible_app_sugeridos"
                          checked={formData.disponible_app_sugeridos}
                          onChange={(e) => updateFormData('disponible_app_sugeridos', e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <label className="form-check-label ms-2" htmlFor="disponible_app_sugeridos" style={{ cursor: 'pointer', userSelect: 'none', fontSize: '14px' }}>
                          Sugeridos
                        </label>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="form-check form-switch d-flex align-items-center">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="disponible_app_rendimiento"
                          checked={formData.disponible_app_rendimiento}
                          onChange={(e) => updateFormData('disponible_app_rendimiento', e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <label className="form-check-label ms-2" htmlFor="disponible_app_rendimiento" style={{ cursor: 'pointer', userSelect: 'none', fontSize: '14px' }}>
                          Rendimiento
                        </label>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="form-check form-switch d-flex align-items-center">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="disponible_app_ventas"
                          checked={formData.disponible_app_ventas}
                          onChange={(e) => updateFormData('disponible_app_ventas', e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <label className="form-check-label ms-2" htmlFor="disponible_app_ventas" style={{ cursor: 'pointer', userSelect: 'none', fontSize: '14px' }}>
                          Ventas
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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