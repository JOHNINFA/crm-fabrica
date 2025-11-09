import React, { useState } from 'react';
import { useProducts } from '../../hooks/useUnifiedProducts';
import './CategoryManager.css';

const CategoryManager = ({ onClose }) => {
    const { categories, addCategory, removeCategory } = useProducts();
    const [newCategory, setNewCategory] = useState('');
    const [error, setError] = useState('');

    // Ya no hay categorías predeterminadas que no se puedan eliminar
    const defaultCategories = [];

    const handleAddCategory = () => {
        if (!newCategory.trim()) {
            setError('El nombre de la categoría no puede estar vacío');
            return;
        }

        if (categories.includes(newCategory.trim())) {
            setError('Esta categoría ya existe');
            return;
        }

        const success = addCategory(newCategory.trim());
        if (success) {
            setNewCategory('');
            setError('');
        } else {
            setError('No se pudo agregar la categoría');
        }
    };

    const handleRemoveCategory = async (category) => {
        const success = await removeCategory(category);
        if (!success) {
            setError(`No se pudo eliminar la categoría "${category}". Debe existir al menos una categoría.`);
        } else {
            setError(''); // Limpiar error si fue exitoso
        }
    };

    return (
        <div className="category-manager">
            <div className="category-manager-header">
                <h5>Gestionar Categorías</h5>
                <button className="close-button" onClick={onClose}>×</button>
            </div>

            <div className="category-manager-content">
                <div className="add-category-form">
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Nueva categoría"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleAddCategory}
                        >
                            <span className="material-icons" style={{ fontSize: '16px' }}>add</span>
                            Agregar
                        </button>
                    </div>
                    {error && <div className="error-message">{error}</div>}
                </div>

                <div className="category-list">
                    <h6>Categorías existentes</h6>
                    <ul>
                        {categories.map(category => (
                            <li key={category}>
                                <span>{category}</span>
                                <button
                                    className="delete-button"
                                    onClick={() => handleRemoveCategory(category)}
                                    title="Eliminar categoría"
                                >
                                    <span className="material-icons" style={{ fontSize: '16px' }}>delete</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="category-manager-footer">
                <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
            </div>
        </div>
    );
};

export default CategoryManager;