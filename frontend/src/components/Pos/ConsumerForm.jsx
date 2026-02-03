import React, { useState, useEffect, useRef } from "react";
import "./ConsumerForm.css";
import { clienteService } from "../../services/clienteService";
import { listaPrecioService } from "../../services/listaPrecioService";
import { vendedorService } from "../../services/vendedorService"; // 🆕
import { useCajero } from "../../context/CajeroContext";
import { useScrollVisibility } from "../../hooks/useScrollVisibility";
import { cajonService } from "../../services/cajonService";

export default function ConsumerForm({
  date, seller, setSeller, client, setDate, setClient,
  priceList, setPriceList, setAddress, setPhone
}) {
  const { cajeroLogueado, sucursalActiva, isAuthenticated } = useCajero();
  const [priceLists, setPriceLists] = useState([]);
  const [vendedores, setVendedores] = useState([]); // 🆕
  const isVisible = useScrollVisibility(false);

  useEffect(() => {
    cargarListasPrecios();
    cargarVendedores(); // 🆕
  }, []);

  const cargarListasPrecios = async () => {
    try {
      const listas = await listaPrecioService.getAll({ activo: true });
      const listasVisibles = listas.filter(lista =>
        lista.visible_pos === true || lista.nombre === 'PRECIOS CAJA'
      );
      setPriceLists(listasVisibles);
      if (listasVisibles.length > 0 && (!priceList || !listasVisibles.some(l => l.nombre === priceList))) {
        const listaDefault = listasVisibles.find(l => l.nombre === 'PRECIOS CAJA') || listasVisibles[0];
        setPriceList(listaDefault.nombre);
      }
    } catch (error) {
      console.error('Error cargando listas:', error);
    }
  };

  // 🆕 Cargar lista de vendedores
  const cargarVendedores = async () => {
    try {
      const data = await vendedorService.getAll();
      if (data && Array.isArray(data)) {
        setVendedores(data);
      }
    } catch (error) {
      console.error("Error cargando vendedores", error);
    }
  };

  const [clienteSuggestions, setClienteSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const suggestionRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setIsSearching(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClientSearch = async (term) => {
    setSearchTerm(term);
    setClient(term);

    // Si borra el cliente, limpiar datos extra
    if (!term) {
      setAddress("");
      setPhone("");
    }

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
          (c.alias || '').toLowerCase().includes(termLower) ||
          (c.identificacion || '').includes(term)
        ).slice(0, 5);

        setClienteSuggestions(filteredClientes);
      }
    } catch (error) {
      console.error('Error al buscar clientes:', error);
    }
  };

  const selectCliente = (cliente) => {
    setClient(cliente.alias || cliente.nombre_completo);

    // 🆕 Autocompletar Address y Phone
    setAddress(cliente.direccion || "");
    const tel = cliente.movil || cliente.telefono_1 || cliente.telefono_contacto || "";
    setPhone(tel);

    // 🆕 Actualizar Lista de Precios si el cliente tiene una asignada
    if (cliente.tipo_lista_precio) {
      setPriceList(cliente.tipo_lista_precio);
    }

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
              width: '320px',
              backgroundColor: '#ffffff',
              color: '#6c757d',
              height: '28px',
              padding: '2px 8px'
            }}
          />

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
            title="Agregar cliente POS"
            onClick={() => {
              sessionStorage.setItem('origenModulo', 'pos');
              window.location.href = '/#/clientes/nuevo';
            }}
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>person_add</span>
          </button>
          <button
            title="Abrir cajón monedero"
            onClick={async () => {
              const resultado = await cajonService.abrirCajon();
              if (!resultado.success) {
                alert(`⚠️ ${resultado.message}`);
              }
            }}
            style={{ backgroundColor: '#28a745', color: 'white', display: 'none' }}
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>point_of_sale</span>
          </button>
          <button
            title="Limpiar"
            onClick={() => {
              setClient("CONSUMIDOR FINAL");
              setAddress("");
              setPhone("");
              setSeller(cajeroLogueado?.nombre || 'POS'); // Reset vendedor también
            }}
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
              value={priceList || 'CLIENTES'}
              onChange={e => setPriceList(e.target.value)}
              style={{
                fontSize: '12px',
                height: '28px',
                padding: '2px 8px',
                paddingRight: '20px',
                appearance: 'none'
              }}
            >
              {priceLists.length === 0 ? (
                <option value={priceList || 'CLIENTES'}>{priceList || 'CLIENTES'}</option>
              ) : (
                priceLists.map(pl => (
                  <option key={pl.id} value={pl.nombre}>{pl.nombre}</option>
                ))
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
        </div>
        <div className="consumer-form-group">
          <label className="consumer-form-label">Atendido por</label>
          {/* 🆕 Convertido a Select editable */}
          <div className="position-relative">
            <select
              className="form-control consumer-form-title-input"
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              style={{
                fontSize: '12px',
                height: '28px',
                padding: '2px 8px',
                fontWeight: 'bold',
                color: '#495057',
                appearance: 'none'
              }}
            >
              {/* Opción por defecto: Cajero Actual */}
              <option value={cajeroLogueado?.nombre || 'POS'}>{cajeroLogueado?.nombre || 'POS'}</option>

              {/* Lista de Vendedores */}
              {vendedores.map(v => (
                <option key={v.id} value={v.nombre}>{v.nombre}</option>
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

          {isAuthenticated && cajeroLogueado && sucursalActiva?.nombre && (
            <div style={{ fontSize: '10px', color: '#6c757d', marginTop: '2px' }}>
              <span className="material-icons" style={{ fontSize: '10px', verticalAlign: 'middle' }}>
                store
              </span>
              {sucursalActiva.nombre}
            </div>
          )}
        </div>
      </div >
    </div >
  );
}