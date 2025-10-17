// Configuración centralizada de la API
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const getApiUrl = (endpoint) => {
  // Remover /api del endpoint si ya está en la base URL
  const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
  return `${API_BASE_URL}${cleanEndpoint}`;
};
