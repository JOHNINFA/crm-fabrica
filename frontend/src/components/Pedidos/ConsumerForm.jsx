import React, { useState, useEffect, useRef } from "react";
import "./ConsumerForm.css";
import { clienteService } from "../../services/clienteService";
import { listaPrecioService } from "../../services/listaPrecioService";
import { useCajeroPedidos } from "../../context/CajeroPedidosContext";

export default function ConsumerForm({ date, seller, client, setDate, setSeller, setClient, sellers, priceList, setPriceList }) {
    // Manejo seguro del contexto
    let cajeroLogueado, sucursalActiva, isAuthenticated;

    try {
        const context = useCajeroPedidos();
        cajeroLogueado = context.cajeroLogueado;
        sucursalActiva = context.sucursalActiva;
        isAuthenticated = context.isAuthenticated;
    } catch (error) {
        console.warn('Error accediendo al contexto de cajero en Pedidos:', error);
        cajeroLogueado = null;
        sucursalActiva = null;
        isAuthenticated = false;
    }

    const [priceLists, setPriceLists] = useState([]);

    useEffect(() => {
        cargarListasPrecios();
    }, []);

    const cargarListasPrecios = async () => {
        try {
            const listas = await listaPrecioService.getAll({ activo: true });
            setPriceLists(listas);
            if (listas.length > 0 && !priceList) {
                const clienteLista = listas.find(l => l.nombre === 'CLIENTES');
                setPriceList(clienteLista ? 'CLIENTES' : listas[0].nombre);
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
                const filteredClientes = clientes.filter(c =>
                    c.nombre_completo.toLowerCase().includes(term.toLowerCase()) ||
                    c.identificacion.includes(term)
                ).slice(0, 5); // Limitar a 5 resultados

                setClienteSuggestions(filteredClientes);
            }
        } catch (error) {
            console.error('Error al buscar clientes:', error);
        }
    };

    // Seleccionar un cliente de las sugerencias
    const selectCliente = (cliente) => {
        setClient(cliente.nombre_completo);
        setClienteSuggestions([]);
        setIsSearching(false);
    };
    return (
        <div className="consumer-form">
            <div className="consumer-form-header">
                <div className="consumer-form-title-container position-relative">
                    <input
                        type="text"
                        value={client}
                        onChange={(e) => handleClientSearch(e.target.value)}
                        onClick={(e) => e.target.select()}
                        className="form-control consumer-form-title-input"
                        autoComplete="off"
                        placeholder="Buscar destinatario..."
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
                                    <div className="cliente-name">{cliente.nombre_completo}</div>
                                    <div className="cliente-id">{cliente.identificacion}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="consumer-form-actions">
                    <button
                        title="Buscar destinatario"
                        onClick={() => setIsSearching(!isSearching)}
                    >
                        <span className="material-icons" style={{ fontSize: '16px' }}>search</span>
                    </button>
                    <button
                        className="btn-primary"
                        title="Agregar destinatario"
                        onClick={() => window.location.href = '/clientes/nuevo'}
                    >
                        <span className="material-icons" style={{ fontSize: '16px' }}>person_add</span>
                    </button>
                    <button
                        title="Limpiar"
                        onClick={() => setClient("")}
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
                            {/* Vendedores de la sucursal */}
                            {sellers.map(vendedor => (
                                <option key={vendedor} value={vendedor}>
                                    {vendedor}
                                </option>
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