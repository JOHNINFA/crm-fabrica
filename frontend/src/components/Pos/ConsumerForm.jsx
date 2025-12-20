import React, { useState, useEffect, useRef } from "react";
import "./ConsumerForm.css";
import { clienteService } from "../../services/clienteService";
import { listaPrecioService } from "../../services/listaPrecioService";
import { useCajero } from "../../context/CajeroContext";
import { useScrollVisibility } from "../../hooks/useScrollVisibility";

export default function ConsumerForm({ date, seller, client, setDate, setSeller, setClient, sellers, priceList, setPriceList }) {
  const { cajeroLogueado, sucursalActiva, isAuthenticated } = useCajero();
  const [priceLists, setPriceLists] = useState([]);
  const isVisible = useScrollVisibility(false);

  useEffect(() => {
    cargarListasPrecios();
  }, []);

  const cargarListasPrecios = async () => {
    try {
      const listas = await listaPrecioService.getAll({ activo: true });

      // Obtener configuración de listas visibles en POS desde localStorage
      const listasVisiblesPos = JSON.parse(localStorage.getItem('listasVisiblesPos') || '{"CLIENTES": true}');

      // Filtrar solo las listas que están marcadas como visibles en POS
      const listasVisibles = listas.filter(lista => listasVisiblesPos[lista.nombre] === true);



      setPriceLists(listasVisibles);
      if (listasVisibles.length > 0 && !priceList) {
        const clienteLista = listasVisibles.find(l => l.nombre === 'CLIENTES');
        setPriceList(clienteLista ? 'CLIENTES' : listasVisibles[0].nombre);
      }
    } catch (error) {
      console.error('Error cargando listas:', error);
    }
  };
  const [clienteSuggestions, setClienteSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const suggestionRef = useRef(null);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setIsSearching(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Buscar clientes cuando se escribe
  const handleClientSearch = async (term) => {
    setSearchTerm(term);
    setClient(term);

    if (term.length < 2) {
      setClienteSuggestions([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const clientes = await clienteService.getAll();
      if (clientes && !clientes.error) {
        const termLower = term.toLowerCase();
        const filteredClientes = clientes.filter(c =>
          (c.nombre_completo || '').toLowerCase().includes(termLower) ||
          (c.alias || '').toLowerCase().includes(termLower) ||  // Buscar por nombre del negocio
          (c.identificacion || '').includes(term)
        ).slice(0, 5); // Limitar a 5 resultados

        setClienteSuggestions(filteredClientes);
      }
    } catch (error) {
      console.error('Error al buscar clientes:', error);
    }
  };

  // Seleccionar un cliente de las sugerencias
  const selectCliente = (cliente) => {
    // Usar el nombre del negocio si existe, si no usar el nombre del contacto
    setClient(cliente.alias || cliente.nombre_completo);
    setClienteSuggestions([]);
    setIsSearching(false);
  };



  return (
    <div
      className="consumer-form"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        backgroundColor: '#fff'
      }}
    >
      <div className="consumer-form-header">
        <div className="consumer-form-title-container position-relative">
          <input
            type="text"
            value={client}
            onChange={(e) => handleClientSearch(e.target.value)}
            onClick={(e) => e.target.select()}
            className="form-control consumer-form-title-input"
            autoComplete="off"
            placeholder="Buscar cliente..."
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              width: '370px',
              backgroundColor: '#ffffff',
              color: '#6c757d',
              height: '28px',
              padding: '2px 8px'
            }}
          />

          {/* Sugerencias de clientes */}
          {isSearching && clienteSuggestions.length > 0 && (
            <div
              ref={suggestionRef}
              className="cliente-suggestions"
            >
              {clienteSuggestions.map((cliente) => (
                <div
                  key={cliente.id}
                  className="cliente-suggestion-item"
                  onClick={() => selectCliente(cliente)}
                >
                  <div className="cliente-name" style={{ fontWeight: 'bold' }}>
                    {cliente.alias || cliente.nombre_completo}
                  </div>
                  <div className="cliente-id" style={{ fontSize: '11px', color: '#6c757d' }}>
                    {cliente.alias ? `${cliente.nombre_completo} • ` : ''}{cliente.identificacion}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="consumer-form-actions">
          <button
            title="Buscar cliente"
            onClick={() => setIsSearching(!isSearching)}
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>search</span>
          </button>
          <button
            className="btn-primary"
            title="Agregar cliente"
            onClick={() => window.location.href = '/clientes/nuevo'}
            disabled
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>person_add</span>
          </button>
          <button
            title="Limpiar"
            onClick={() => setClient("CONSUMIDOR FINAL")}
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>clear</span>
          </button>
        </div>
      </div>

      <div className="consumer-form-row">
        <div className="consumer-form-group">
          <label className="consumer-form-label">Fecha Documento</label>
          <input
            type="date"
            className="form-control consumer-form-title-input"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              fontSize: '12px',
              height: '28px',
              padding: '2px 8px'
            }}
          />
        </div>
        <div className="consumer-form-group">
          <label className="consumer-form-label">Lista de Precios</label>
          <div className="position-relative">
            <select
              className="form-control consumer-form-title-input"
              value={priceList}
              onChange={e => setPriceList(e.target.value)}
              style={{
                fontSize: '12px',
                height: '28px',
                padding: '2px 8px',
                paddingRight: '20px',
                appearance: 'none'
              }}
            >
              {priceLists.map(pl => (
                <option key={pl.id} value={pl.nombre}>{pl.nombre}</option>
              ))}
            </select>
            <span className="material-icons position-absolute" style={{
              right: '5px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '14px',
              pointerEvents: 'none',
              color: '#6c757d'
            }}>
              arrow_drop_down
            </span>
          </div>
        </div>
        <div className="consumer-form-group">
          <label className="consumer-form-label">Vendedor</label>
          <div className="position-relative">
            <select
              className="form-control consumer-form-title-input"
              value={seller}
              onChange={e => setSeller(e.target.value)}
              style={{
                fontSize: '12px',
                height: '28px',
                padding: '2px 8px',
                paddingRight: '20px',
                appearance: 'none'
              }}
            >
              {/* Cajero logueado */}
              {isAuthenticated && cajeroLogueado && (
                <optgroup label="CAJERO ACTIVO">
                  <option value={cajeroLogueado.nombre}>
                    {cajeroLogueado.nombre} (Cajero)
                  </option>
                </optgroup>
              )}

              {/* Vendedores de la sucursal */}
              <optgroup label="VENDEDORES">
                {sellers.map(vendedor => (
                  <option key={vendedor} value={vendedor}>
                    {vendedor}
                  </option>
                ))}
              </optgroup>

              {/* Fallback si no hay cajero logueado */}
              {!isAuthenticated && (
                <optgroup label="SISTEMA">
                  <option value="Sistema">Sistema</option>
                </optgroup>
              )}
            </select>
            <span className="material-icons position-absolute" style={{
              right: '5px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '14px',
              pointerEvents: 'none',
              color: '#6c757d'
            }}>
              arrow_drop_down
            </span>
          </div>

          {/* Información adicional del cajero */}
          {isAuthenticated && cajeroLogueado && sucursalActiva?.nombre && (
            <div style={{ fontSize: '10px', color: '#6c757d', marginTop: '2px' }}>
              <span className="material-icons" style={{ fontSize: '10px', verticalAlign: 'middle' }}>
                store
              </span>
              {sucursalActiva.nombre}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}