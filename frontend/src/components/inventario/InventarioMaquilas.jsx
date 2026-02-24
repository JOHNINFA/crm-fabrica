import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Swal from 'sweetalert2';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert,
  Card,
  Table,
} from "react-bootstrap";
import TablaInventario from "./TablaInventario";
import TablaConfirmacionProduccion from "./TablaConfirmacionProduccion";
import ModalEditarExistencias from "./ModalEditarExistencias";
import ModalCambiarUsuario from "./ModalCambiarUsuario";
import ModalEditarCantidades from "./ModalEditarCantidades";
import DateSelector from "../common/DateSelector";
import { useProductos } from "../../hooks/useUnifiedProducts";
import { loteService } from "../../services/loteService";
import { registroInventarioService } from "../../services/registroInventarioService";
import { productoService, API_URL } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { obtenerNombreUsuarioInventario } from "../../utils/inventarioUsuario";
import productosMaquilasData from "../../data/productosMaquilas";
import "../../styles/InventarioProduccion.css";
import "../../styles/TablaKardex.css";
import "../../styles/ActionButtons.css";

const normalizarNombreProducto = (nombre = "") => String(nombre).trim().toUpperCase();

const unirLotesUnicos = (...lotesTexto) => {
  const lotes = lotesTexto
    .filter(Boolean)
    .flatMap((texto) => String(texto).split(","))
    .map((l) => l.trim())
    .filter(Boolean);

  return [...new Set(lotes)].join(", ");
};

const combinarDatosConfirmacion = (actual, nuevo) => {
  if (!actual) return nuevo;

  const acumulado = new Map();
  (actual.productos || []).forEach((p) => {
    const key = normalizarNombreProducto(p.nombre);
    acumulado.set(key, { ...p, nombre: key, cantidad: Number(p.cantidad) || 0 });
  });

  (nuevo.productos || []).forEach((p) => {
    const key = normalizarNombreProducto(p.nombre);
    const previo = acumulado.get(key);
    if (previo) {
      acumulado.set(key, {
        ...previo,
        cantidad: (Number(previo.cantidad) || 0) + (Number(p.cantidad) || 0),
      });
      return;
    }
    acumulado.set(key, { ...p, nombre: key, cantidad: Number(p.cantidad) || 0 });
  });

  const vencimientos = [actual.fechaVencimiento, nuevo.fechaVencimiento].filter(Boolean);
  const fechaVencimientoUnica = [...new Set(vencimientos)].length === 1 ? vencimientos[0] : null;

  return {
    ...actual,
    ...nuevo,
    lote: unirLotesUnicos(actual.lote, nuevo.lote),
    fechaVencimiento: fechaVencimientoUnica,
    fechaCreacion: new Date().toISOString(),
    productos: Array.from(acumulado.values()),
  };
};

const construirConfirmacionDesdeBackend = (registrosMaquila = [], lotesDelDia = [], usuario = "Usuario Predeterminado") => {
  const acumulado = new Map();
  registrosMaquila.forEach((registro) => {
    const nombre = normalizarNombreProducto(registro.producto_nombre || registro.productoNombre);
    if (!nombre) return;

    const cantidadRegistro = Number(registro.entradas || registro.cantidad || 0);
    const previo = acumulado.get(nombre);
    acumulado.set(nombre, {
      nombre,
      cantidad: (previo?.cantidad || 0) + cantidadRegistro,
    });
  });

  const lotesUnicos = [...new Set((lotesDelDia || []).map((l) => l?.lote).filter(Boolean))];
  const vencimientos = [...new Set((lotesDelDia || []).map((l) => l?.fecha_vencimiento).filter(Boolean))];

  if (acumulado.size === 0) return null;

  return {
    lote: lotesUnicos.join(", "),
    fechaVencimiento: vencimientos.length === 1 ? vencimientos[0] : null,
    fechaCreacion: new Date().toISOString(),
    usuario,
    productos: Array.from(acumulado.values()),
  };
};

const InventarioMaquilas = () => {
  // Context y estados principales
  const { agregarMovimientos, movimientos } = useProductos();
  const { usuario: usuarioSesion } = useAuth();
  const nombreUsuarioLogueado = useMemo(
    () => obtenerNombreUsuarioInventario(usuarioSesion),
    [usuarioSesion]
  );

  // Estados de producción
  const [usuario, setUsuario] = useState(() => obtenerNombreUsuarioInventario(usuarioSesion));
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [lote, setLote] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [lotes, setLotes] = useState([]);

  // Estados de UI
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalUsuario, setShowModalUsuario] = useState(false);
  const [showModalCantidades, setShowModalCantidades] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [productos, setProductos] = useState([]);

  // 🆕 REF para mantener el estado actualizado dentro de los timers
  const productosRef = useRef(productos);

  // Sincronizar ref con estado
  useEffect(() => {
    productosRef.current = productos;
  }, [productos]);

  useEffect(() => {
    setUsuario(nombreUsuarioLogueado);
  }, [nombreUsuarioLogueado]);

  const [cargando, setCargando] = useState(true);
  const [productosGrabados, setProductosGrabados] = useState({});

  // Estado para la tabla de confirmación
  const [datosGuardados, setDatosGuardados] = useState(null);

  // Estado para indicar que ya se grabó (sombreado de inputs)
  const [yaSeGrabo, setYaSeGrabo] = useState(false);



  // 🛡️ PERSISTENCIA: Estado para controlar restauración
  const [restauracionCompleta, setRestauracionCompleta] = useState(false);
  // Bloqueo para evitar restauración mientras se cargan datos de la nueva fecha
  const [procesandoCambioFecha, setProcesandoCambioFecha] = useState(false);

  // 🛡️ PERSISTENCIA: Clave dinámica por fecha
  const fechaKeyStr = useMemo(() => {
    if (!fechaSeleccionada) return "";
    return `${fechaSeleccionada.getFullYear()}-${String(fechaSeleccionada.getMonth() + 1).padStart(2, "0")}-${String(fechaSeleccionada.getDate()).padStart(2, "0")}`;
  }, [fechaSeleccionada]);

  // 🛡️ PERSISTENCIA: Resetear flag al cambiar fecha (ELIMINADO - Se hace en handleDateSelect para evitar race condition)
  // useEffect(() => {
  //   setRestauracionCompleta(false);
  // }, [fechaKeyStr]);

  // 🛡️ PERSISTENCIA: Función para restaurar datos (Extraída para uso manual)
  const restaurarDatosDeLocalStorage = useCallback((fechaK) => {
    // Si no hay productos cargados, abortar restauración (se reintentará cuando carguen)
    if (productosRef.current.length === 0) {
      return;
    }



    const lotesGuardados = localStorage.getItem(`inv_maq_lotes_${fechaK}`);
    const cantidadesGuardadas = localStorage.getItem(`inv_maq_cantidades_${fechaK}`);

    if (lotesGuardados) {
      try {
        const parsedLotes = JSON.parse(lotesGuardados);
        if (Array.isArray(parsedLotes) && parsedLotes.length > 0) {
          setLotes(parsedLotes);
        }
      } catch (e) { console.error("Error restaurando lotes", e); }
    }

    if (cantidadesGuardadas) {
      try {
        const mapaCantidades = JSON.parse(cantidadesGuardadas);
        setProductos(prev => prev.map(p => {
          return mapaCantidades[p.id] ? { ...p, cantidad: mapaCantidades[p.id] } : p;
        }));
      } catch (e) { console.error("Error restaurando cantidades", e); }
    }

    // Marcar como completa para permitir el auto-guardado subsiguiente
    setRestauracionCompleta(true);
  }, []);

  // 🛡️ PERSISTENCIA: Restaurar datos al cargar productos INICIALMENTE
  useEffect(() => {
    // Si estamos procesando cambio de fecha, ESPERAR.
    if (procesandoCambioFecha) {
      return;
    }

    // Si es la carga inicial (o F5), productos ya cargaron, y aún no hemos restaurado
    if (productos.length > 0 && !restauracionCompleta && fechaKeyStr) {
      const timer = setTimeout(() => {
        restaurarDatosDeLocalStorage(fechaKeyStr);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [productos.length, fechaKeyStr, restaurarDatosDeLocalStorage, procesandoCambioFecha]);


  // 🛡️ PERSISTENCIA: Auto-guardar lotes
  useEffect(() => {
    if (restauracionCompleta && fechaKeyStr) {
      if (lotes.length > 0) {
        localStorage.setItem(`inv_maq_lotes_${fechaKeyStr}`, JSON.stringify(lotes));
      } else {
        localStorage.setItem(`inv_maq_lotes_${fechaKeyStr}`, JSON.stringify([]));
      }
    }
  }, [lotes, restauracionCompleta, fechaKeyStr]);

  // 🛡️ PERSISTENCIA: Auto-guardar cantidades
  useEffect(() => {
    if (restauracionCompleta && fechaKeyStr) {
      const mapaCantidades = {};
      const hayCantidades = productos.some(p => p.cantidad > 0);
      if (hayCantidades) {
        productos.forEach(p => { if (p.cantidad > 0) mapaCantidades[p.id] = p.cantidad; });
        localStorage.setItem(`inv_maq_cantidades_${fechaKeyStr}`, JSON.stringify(mapaCantidades));
      } else {
        // Solo limpiar si había datos antes (evitar borrar al cargar página vacía)
        const datosGuardados = localStorage.getItem(`inv_maq_cantidades_${fechaKeyStr}`);
        if (datosGuardados) {
          localStorage.removeItem(`inv_maq_cantidades_${fechaKeyStr}`);
        }
      }
    }
  }, [productos, restauracionCompleta, fechaKeyStr]);

  // Estado para modal de edición de producción del día
  const [showModalEditarProduccion, setShowModalEditarProduccion] = useState(false);
  const [productoEditarProduccion, setProductoEditarProduccion] = useState(null);
  const [motivoEdicion, setMotivoEdicion] = useState("");

  // Memorizar productos ordenados y filtrados para Maquilas
  const productosOrdenados = useMemo(() => {
    // Filtrar solo productos de Maquila
    const productosFiltrados = productos.filter(p =>
      p.ubicacionInventario === 'MAQUILA'
    );

    // Ordenar los productos filtrados
    return productosFiltrados.sort((a, b) => {
      const ordenA = a.orden !== undefined ? a.orden : 999999;
      const ordenB = b.orden !== undefined ? b.orden : 999999;

      if (ordenA !== ordenB) {
        return ordenA - ordenB;
      }

      return (a.id || 0) - (b.id || 0);
    });
  }, [productos]);

  // Filtrar movimientos por fecha seleccionada
  const movimientosFiltrados = movimientos.filter((movimiento) => {
    if (!movimiento.fecha) return false;

    try {
      const fechaMovimiento = movimiento.fecha.includes("-")
        ? new Date(movimiento.fecha)
        : new Date(movimiento.fecha.split("/").reverse().join("-"));

      return (
        fechaMovimiento.toDateString() === fechaSeleccionada.toDateString()
      );
    } catch (error) {
      console.error("Error al procesar fecha:", error);
      return false;
    }
  });

  // Cargar productos de maquila desde la BD
  const cargarProductosMaquila = async () => {
    try {
      // No mostrar loading si ya hay productos (evita el salto visual)
      if (productos.length === 0) {
        setCargando(true);
      }

      // Cargar productos desde la API
      const response = await fetch(`${API_URL}/productos/`);
      if (!response.ok) {
        throw new Error("Error al cargar productos desde BD");
      }

      const productosFromBD = await response.json();


      // Filtrar solo productos de MAQUILA
      const productosMaquila = productosFromBD.filter(p =>
        p.ubicacion_inventario === 'MAQUILA'
      );



      // Formatear productos
      const productosFormateados = productosMaquila.map((producto) => {
        // 🆕 Preservar cantidad si el producto ya existe (usando REF actualizada)
        const productoExistente = productosRef.current.find(p => p.id === producto.id);
        const cantidadActual = productoExistente?.cantidad || 0;

        return {
          id: producto.id,
          nombre: producto.nombre?.toUpperCase() || "SIN NOMBRE",
          existencias: producto.stock_total || 0,
          cantidad: cantidadActual, // 🔥 Preservar cantidad del usuario
          precio: parseFloat(producto.precio) || 0,
          categoria: producto.categoria_nombre || "Maquila",
          imagen: producto.imagen || null,
          orden: producto.orden || 0,
          ubicacionInventario: producto.ubicacion_inventario
        };
      });

      // Ordenar por campo orden
      const productosOrdenados = productosFormateados.sort((a, b) => {
        const ordenA = a.orden !== undefined ? a.orden : 999999;
        const ordenB = b.orden !== undefined ? b.orden : 999999;

        if (ordenA !== ordenB) {
          return ordenA - ordenB;
        }

        return (a.id || 0) - (b.id || 0);
      });

      setProductos(productosOrdenados);

    } catch (error) {
      console.error("Error al cargar productos de maquila:", error);
      setMensaje({ texto: "Error al cargar productos de maquila", tipo: "danger" });
    } finally {
      setCargando(false);
    }
  };

  // Función para cargar datos de confirmación del día actual
  const cargarDatosConfirmacionActual = async () => {
    const fechaActual = new Date();
    const fechaStr = `${fechaActual.getFullYear()}-${String(
      fechaActual.getMonth() + 1
    ).padStart(2, "0")}-${String(fechaActual.getDate()).padStart(2, "0")}`;

    const fechaKey = `confirmacion_maquila_${fechaStr}`;
    const datosConfirmacionGuardados = localStorage.getItem(fechaKey);

    if (datosConfirmacionGuardados) {
      try {
        const datosParseados = JSON.parse(datosConfirmacionGuardados);
        setDatosGuardados(datosParseados);
        setYaSeGrabo(true);

      } catch (error) {
        console.error("Error al parsear datos de confirmación de maquila:", error);
      }
      return;
    }

    try {
      const [lotesDelDia, registrosDelDia] = await Promise.all([
        loteService.getByFecha(fechaStr),
        registroInventarioService.getByFecha(fechaStr),
      ]);

      const registrosMaquila = (registrosDelDia || []).filter(
        (r) => r.tipo_movimiento === 'ENTRADA_MAQUILA'
      );

      const resumen = construirConfirmacionDesdeBackend(registrosMaquila, lotesDelDia, usuario);
      if (resumen) {
        localStorage.setItem(fechaKey, JSON.stringify(resumen));
        setDatosGuardados(resumen);
        setYaSeGrabo(true);
      }
    } catch (error) {
      console.error("Error cargando confirmación de maquila actual:", error);
    }
  };

  // Inicialización del componente
  useEffect(() => {
    // Ejecutar carga inicial
    cargarProductosMaquila();

    // 🎯 Cargar datos de confirmación del día actual
    cargarDatosConfirmacionActual();

    // Event listeners con debounce para evitar recargas mientras se edita
    let debounceTimer = null;

    const handleStorageChange = (e) => {
      if (e.key === "productos" || e.key === "products") {
        // Debounce de 2 segundos - solo recarga si no hay actividad
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {

          cargarProductosMaquila();
        }, 2000);
      }
    };

    const handleProductosUpdated = () => {
      // Debounce de 2 segundos
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {

        cargarProductosMaquila();
      }, 2000);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("productosUpdated", handleProductosUpdated);

    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("productosUpdated", handleProductosUpdated);
    };
  }, []);

  // Manejadores de eventos
  const handleEditarClick = (producto) => {
    // Si ya se grabó, editar producción del día, sino editar existencias
    if (yaSeGrabo) {
      setProductoEditarProduccion(producto);
      setShowModalEditarProduccion(true);
    } else {
      setProductoEditar(producto);
      setShowModalEditar(true);
    }
  };

  const handleCantidadChange = (id, cantidad) => {
    const cantidadNumerica = parseInt(cantidad) || 0;
    const productoActual = productos.find((p) => p.id === id);

    if (!productoActual || productoActual.cantidad === cantidadNumerica) return;

    const nuevosProductos = productos.map((producto) =>
      producto.id === id
        ? { ...producto, cantidad: cantidadNumerica }
        : producto
    );

    setProductos(nuevosProductos);
  };

  // Gestión de lotes
  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3000);
  };

  const handleAgregarLote = () => {
    if (!lote) {
      Swal.fire({
        icon: 'warning',
        title: 'Falta información',
        text: 'Debe ingresar un número de lote',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    // 🆕 Validación estricta de fecha de vencimiento
    if (!fechaVencimiento) {
      Swal.fire({
        icon: 'warning',
        title: 'Falta información',
        text: 'Debe seleccionar una fecha de vencimiento',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (lotes.some((l) => l.numero === lote)) {
      Swal.fire({
        icon: 'error',
        title: 'Duplicado',
        text: 'Este número de lote ya fue agregado',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    const nuevoLote = {
      id: Date.now(),
      numero: lote,
      fechaVencimiento: fechaVencimiento || "",
    };

    setLotes([...lotes, nuevoLote]);
    setLote("");
    setFechaVencimiento("");
    Swal.fire({
      icon: 'success',
      title: 'Lote agregado',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000
    });
  };

  const handleEliminarLote = (id) => {
    setLotes(lotes.filter((lote) => lote.id !== id));
  };

  // Registrar producción de maquila
  const handleGrabarMovimiento = async () => {
    const productosConCantidad = productos.filter((p) => p.cantidad > 0);

    // Validaciones con SweetAlert
    if (productosConCantidad.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin datos',
        text: 'No hay productos con cantidades para registrar',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (lotes.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Falta Lote',
        text: 'Debe ingresar al menos un lote antes de grabar',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    // Crear lista HTML para el resumen
    const listaProductosHtml = productosConCantidad
      .map(p => `<li style="text-align: left; margin-bottom: 5px;">
                  <strong>${p.nombre}:</strong> ${p.cantidad} und.
                 </li>`)
      .join('');

    const fechaStr = fechaSeleccionada.toLocaleDateString("es-ES", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Confirmación con SweetAlert
    const confirmacion = await Swal.fire({
      title: '¿Grabar Maquila?',
      html: `
        <div style="text-align: left; font-size: 0.95rem;">
          <p>Se registrará la maquila para: <br><strong>${fechaStr}</strong></p>
          <p class="mb-2">Productos a registrar:</p>
          <ul style="max-height: 200px; overflow-y: auto; padding-left: 20px; background: #f8fafc; padding: 10px; border-radius: 6px;">
            ${listaProductosHtml}
          </ul>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: '<i class="bi bi-save"></i> Sí, Grabar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    // <-- Continuar con el proceso de grabado original -->
    const fechaCorta = fechaSeleccionada.toLocaleDateString("es-ES");
    const hora = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Preparar datos
    const nuevosMovimientos = [];
    const nuevosProductos = productos.map((producto) => {
      if (producto.cantidad > 0) {
        const existenciasActuales = parseInt(producto.existencias) || 0;
        const cantidadAAgregar = parseInt(producto.cantidad) || 0;

        // Crear movimiento
        const loteInfo = lotes.map((l) => l.numero).join(", ");
        nuevosMovimientos.push({
          id: Date.now() + Math.random(),
          fecha: fechaStr,
          hora,
          producto: producto.nombre,
          cantidad: cantidadAAgregar,
          tipo: "Entrada",
          usuario,
          lote: loteInfo,
          fechaVencimiento: lotes[0]?.fechaVencimiento
            ? new Date(
              lotes[0].fechaVencimiento + "T00:00:00"
            ).toLocaleDateString("es-ES")
            : "-",
          registrado: true,
        });

        return {
          ...producto,
          existencias: existenciasActuales + cantidadAAgregar,
          cantidad: cantidadAAgregar,
        };
      }
      return producto;
    });

    // Guardar lotes en BD
    const fechaProduccion = `${fechaSeleccionada.getFullYear()}-${String(
      fechaSeleccionada.getMonth() + 1
    ).padStart(2, "0")}-${String(fechaSeleccionada.getDate()).padStart(
      2,
      "0"
    )}`;

    for (const loteLocal of lotes) {
      try {
        const loteData = {
          lote: loteLocal.numero,
          fechaVencimiento: loteLocal.fechaVencimiento || null,
          fechaProduccion,
          usuario,
        };

        await loteService.create(loteData);
      } catch (error) {
        console.error("Error al guardar lote de maquila:", error);
      }
    }

    // Guardar cantidades en BD
    for (const producto of productosConCantidad) {
      try {
        const cantidadMovimiento = producto.cantidad;

        // Calcular saldo acumulado
        let saldoActual;
        try {
          const response = await fetch(
            `${API_URL}/registro-inventario/`
          );
          if (response.ok) {
            const todosRegistros = await response.json();
            const registrosProducto = todosRegistros.filter(
              (r) => r.producto_id === producto.id
            );

            if (registrosProducto.length > 0) {
              const ultimoRegistro = registrosProducto.sort(
                (a, b) =>
                  new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
              )[0];
              saldoActual = ultimoRegistro.saldo + cantidadMovimiento;
            } else {
              saldoActual = cantidadMovimiento;
            }
          } else {
            saldoActual = (producto.existencias || 0) + cantidadMovimiento;
          }
        } catch (error) {
          saldoActual = (producto.existencias || 0) + cantidadMovimiento;
        }

        const registroData = {
          productoId: producto.id,
          productoNombre: producto.nombre,
          cantidad: cantidadMovimiento,
          entradas: cantidadMovimiento > 0 ? cantidadMovimiento : 0,
          salidas: cantidadMovimiento < 0 ? Math.abs(cantidadMovimiento) : 0,
          saldo: saldoActual,
          tipoMovimiento: "ENTRADA_MAQUILA",
          fechaProduccion,
          usuario,
        };

        await registroInventarioService.create(registroData);

        // 🔥 NUEVO: Crear MovimientoInventario ENTRADA (actualiza stock automáticamente)
        try {
          const movimientoData = {
            producto: producto.id,
            tipo: 'ENTRADA',
            cantidad: cantidadMovimiento,
            usuario: usuario,
            nota: `Maquila: ${lotes.map((l) => l.numero).join(", ")}`
          };

          const responseMovimiento = await fetch(`${API_URL}/movimientos/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(movimientoData)
          });

          if (!responseMovimiento.ok) {
            const errorText = await responseMovimiento.text();
            throw new Error(
              `Error al crear movimiento: ${responseMovimiento.status} - ${errorText}`
            );
          }

          console.log(`✅ Movimiento ENTRADA creado: ${producto.nombre} +${cantidadMovimiento}`);
        } catch (stockError) {
          console.error("Error al crear movimiento de inventario:", stockError);
        }
      } catch (error) {
        console.error("Error al guardar cantidad de maquila:", error);
      }
    }


    // Finalizar
    setProductos(nuevosProductos);
    // ❌ NO actualizar contexto global - Maquila maneja su propio estado
    // actualizarExistencias(nuevosProductos);  // ← Esto sobrescribe los productos de Producción
    agregarMovimientos(nuevosMovimientos);
    setProductosGrabados({});

    mostrarMensaje(`Maquila registrada para ${fechaStr}`, "success");

    // 🎯 Preparar datos para la tabla de confirmación
    const datosParaConfirmacion = {
      lote: lotes.map((l) => l.numero).join(", "),
      fechaVencimiento: lotes[0]?.fechaVencimiento || null,
      fechaCreacion: new Date().toISOString(),
      usuario: usuario,
      productos: productosConCantidad.map((producto) => ({
        nombre: normalizarNombreProducto(producto.nombre),
        cantidad: parseInt(producto.cantidad) || 0,
      })),
    };

    // 🎯 Persistir datos de confirmación en localStorage por fecha
    const fechaKey = `confirmacion_maquila_${fechaProduccion}`;
    const datosAcumulados = combinarDatosConfirmacion(datosGuardados, datosParaConfirmacion);
    localStorage.setItem(fechaKey, JSON.stringify(datosAcumulados));

    // 🎯 Mostrar tabla de confirmación
    setDatosGuardados(datosAcumulados);

    // 🎯 Limpiar TODOS los campos después de grabar
    const productosLimpios = productos.map((producto) => ({
      ...producto,
      cantidad: 0, // Limpiar cantidades
    }));
    setProductos(productosLimpios);

    // 🎯 Limpiar campos de lote y fecha vencimiento
    setLotes([]);
    setLote("");

    // 🛡️ PERSISTENCIA: Limpiar localStorage (Solo para la fecha actual)
    const fechaKeyLimpieza = `${fechaSeleccionada.getFullYear()}-${String(fechaSeleccionada.getMonth() + 1).padStart(2, "0")}-${String(fechaSeleccionada.getDate()).padStart(2, "0")}`;
    localStorage.removeItem(`inv_maq_lotes_${fechaKeyLimpieza}`);
    localStorage.removeItem(`inv_maq_cantidades_${fechaKeyLimpieza}`);
    setFechaVencimiento("");

    // 🎯 Activar indicador visual de que ya se grabó
    setYaSeGrabo(true);
  };

  // Función para editar producción del día específico
  const handleEditarProduccionDia = async (id, nuevaCantidadProduccion, motivo = "") => {
    try {
      const productoEditado = productos.find((p) => p.id === id);
      if (!productoEditado) {
        setMensaje({ texto: "Producto no encontrado", tipo: "danger" });
        return;
      }

      // Obtener la cantidad original de producción del día desde datosGuardados
      const productoEnConfirmacion = datosGuardados?.productos?.find(
        (p) => p.nombre === productoEditado.nombre
      );
      const cantidadOriginal = productoEnConfirmacion?.cantidad || 0;
      const diferenciaCantidad = nuevaCantidadProduccion - cantidadOriginal;

      // Actualizar existencias basado en la diferencia
      const nuevasExistencias = productoEditado.existencias + diferenciaCantidad;

      // Actualizar productos localmente manteniendo el orden
      const nuevosProductos = productos.map((producto) =>
        producto.id === id
          ? {
            ...producto,
            existencias: nuevasExistencias,
          }
          : producto
      );

      setProductos(nuevosProductos);
      // ❌ NO actualizar contexto global
      // actualizarExistencias(nuevosProductos);

      // 🔥 NUEVO: Crear MovimientoInventario AJUSTE (actualiza stock automáticamente)
      try {
        const movimientoData = {
          producto: id,
          tipo: diferenciaCantidad > 0 ? 'ENTRADA' : 'SALIDA',
          cantidad: Math.abs(diferenciaCantidad),
          usuario: usuario,
          nota: `Edición Maquila: ${cantidadOriginal}→${nuevaCantidadProduccion}`
        };

        const responseMovimiento = await fetch(`${API_URL}/movimientos/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(movimientoData)
        });

        if (!responseMovimiento.ok) {
          const errorText = await responseMovimiento.text();
          throw new Error(
            `Error al crear movimiento: ${responseMovimiento.status} - ${errorText}`
          );
        }

        console.log(`✅ Movimiento AJUSTE creado: ${productoEditado.nombre} ${diferenciaCantidad > 0 ? '+' : ''}${diferenciaCantidad}`);
      } catch (stockError) {
        console.error("Error al crear movimiento de inventario:", stockError);
      }

      // Actualizar datos de confirmación
      if (datosGuardados) {
        const productosActualizados = datosGuardados.productos.map((prod) => {
          if (prod.nombre === productoEditado.nombre) {
            return {
              ...prod,
              cantidad: nuevaCantidadProduccion,
              editado: true,
              cantidadOriginal: cantidadOriginal,
              fechaEdicion: new Date().toLocaleString("es-ES"),
              motivoEdicion: motivo || "No especificado",
            };
          }
          return prod;
        });

        const datosActualizados = {
          ...datosGuardados,
          productos: productosActualizados,
        };

        // Actualizar tabla de confirmación visible
        setDatosGuardados(datosActualizados);

        // Actualizar datos persistidos en localStorage
        const fechaStr = `${fechaSeleccionada.getFullYear()}-${String(
          fechaSeleccionada.getMonth() + 1
        ).padStart(2, "0")}-${String(fechaSeleccionada.getDate()).padStart(2, "0")}`;
        const fechaKey = `confirmacion_maquila_${fechaStr}`;
        localStorage.setItem(fechaKey, JSON.stringify(datosActualizados));
      }

      // Crear movimiento de ajuste si hay diferencia
      if (diferenciaCantidad !== 0) {
        const nuevoMovimiento = {
          id: Date.now(),
          fecha: fechaSeleccionada.toLocaleDateString("es-ES"),
          hora: new Date().toLocaleTimeString("es-ES"),
          producto: productoEditado.nombre,
          cantidad: Math.abs(diferenciaCantidad),
          tipo: diferenciaCantidad > 0 ? "ENTRADA" : "SALIDA",
          usuario,
          lote: `Edición: ${cantidadOriginal}→${nuevaCantidadProduccion}`,
          fechaVencimiento: "-",
          registrado: true,
          nota: `Motivo: ${motivo || "No especificado"}`,
        };
        agregarMovimientos([nuevoMovimiento]);
      }

      setMensaje({
        texto: `Maquila del día actualizada: ${cantidadOriginal} → ${nuevaCantidadProduccion}`,
        tipo: "success",
      });


    } catch (error) {
      console.error("Error al editar maquila del día:", error);
      setMensaje({ texto: "Error al editar maquila del día", tipo: "danger" });
    } finally {
      setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3000);
    }
  };

  const handleEditarExistencias = async (id, nuevasExistencias) => {
    try {
      const productoEditado = productos.find((p) => p.id === id);
      if (!productoEditado) {
        setMensaje({ texto: "Producto no encontrado", tipo: "danger" });
        return;
      }

      const diferenciaExistencias =
        nuevasExistencias - productoEditado.existencias;

      // Actualizar productos localmente
      const nuevosProductos = productos.map((producto) =>
        producto.id === id
          ? {
            ...producto,
            existencias: nuevasExistencias,
            cantidad: (producto.cantidad || 0) + diferenciaExistencias,
          }
          : producto
      );

      setProductos(nuevosProductos);
      // ❌ NO actualizar contexto global
      // actualizarExistencias(nuevosProductos);

      // 🔥 NUEVO: Crear MovimientoInventario AJUSTE (actualiza stock automáticamente)
      try {
        const movimientoData = {
          producto: id,
          tipo: diferenciaExistencias > 0 ? 'ENTRADA' : 'SALIDA',
          cantidad: Math.abs(diferenciaExistencias),
          usuario: usuario,
          nota: `Edición Existencias: ${productoEditado.existencias}→${nuevasExistencias}`
        };

        const responseMovimiento = await fetch(`${API_URL}/movimientos/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(movimientoData)
        });

        if (!responseMovimiento.ok) {
          const errorText = await responseMovimiento.text();
          throw new Error(
            `Error al crear movimiento: ${responseMovimiento.status} - ${errorText}`
          );
        }

        console.log(`✅ Movimiento AJUSTE creado: ${productoEditado.nombre} ${diferenciaExistencias > 0 ? '+' : ''}${diferenciaExistencias}`);
      } catch (stockError) {
        console.error("Error al crear movimiento de inventario:", stockError);
      }

      // Crear movimiento si hay diferencia
      if (diferenciaExistencias !== 0) {
        const nuevoMovimiento = {
          id: Date.now(),
          fecha: fechaSeleccionada.toLocaleDateString("es-ES"),
          hora: new Date().toLocaleTimeString("es-ES"),
          producto: productoEditado.nombre,
          cantidad: Math.abs(diferenciaExistencias),
          tipo: diferenciaExistencias > 0 ? "ENTRADA" : "SALIDA",
          usuario,
          lote: "Ajuste",
          fechaVencimiento: "-",
          registrado: true,
        };
        agregarMovimientos([nuevoMovimiento]);
      }

      // 🎯 Si ya se grabó, actualizar también los datos de confirmación
      if (yaSeGrabo && datosGuardados) {
        const productosActualizados = datosGuardados.productos.map((prod) => {
          if (prod.nombre === productoEditado.nombre) {
            return {
              ...prod,
              cantidad: (prod.cantidad || 0) + diferenciaExistencias,
            };
          }
          return prod;
        });

        const datosActualizados = {
          ...datosGuardados,
          productos: productosActualizados,
        };

        // Actualizar tabla de confirmación visible
        setDatosGuardados(datosActualizados);

        // Actualizar datos persistidos en localStorage
        const fechaStr = `${fechaSeleccionada.getFullYear()}-${String(
          fechaSeleccionada.getMonth() + 1
        ).padStart(2, "0")}-${String(fechaSeleccionada.getDate()).padStart(2, "0")}`;
        const fechaKey = `confirmacion_maquila_${fechaStr}`;
        localStorage.setItem(fechaKey, JSON.stringify(datosActualizados));


      }

      setMensaje({
        texto: "Existencias actualizadas correctamente",
        tipo: "success",
      });
    } catch (error) {
      console.error("Error al actualizar existencias:", error);
      setMensaje({ texto: "Error al actualizar existencias", tipo: "danger" });
    } finally {
      setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3000);
    }
  };

  // Guardar cantidades desde modal
  const handleGuardarCantidades = (existencias) => {
    const nuevosProductos = productos.map((producto) => ({
      ...producto,
      existencias: existencias[producto.id] || 0,
    }));

    setProductos(nuevosProductos);
    // ❌ NO actualizar contexto global
    // actualizarExistencias(nuevosProductos);

    // Crear movimientos para productos modificados
    const hora = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const nuevosMovimientos = productos
      .map((producto) => {
        const nuevaExistencia = existencias[producto.id] || 0;
        const diferencia = nuevaExistencia - (producto.existencias || 0);

        return diferencia !== 0
          ? {
            id: Date.now() + Math.random(),
            fecha: fechaSeleccionada.toLocaleDateString("es-ES"),
            hora,
            producto: producto.nombre,
            cantidad: Math.abs(diferencia),
            tipo: diferencia > 0 ? "Entrada" : "Salida",
            usuario,
            lote: "Ajuste",
            fechaVencimiento: "-",
            registrado: true,
          }
          : null;
      })
      .filter(Boolean);

    if (nuevosMovimientos.length > 0) {
      agregarMovimientos(nuevosMovimientos);
    }

    setMensaje({
      texto: "Existencias actualizadas correctamente",
      tipo: "success",
    });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3000);
  };

  const handleDateSelect = async (date) => {
    // 🛡️ PERSISTENCIA: Bloquear auto-guardado y resetear flag SÍNCRONAMENTE
    setProcesandoCambioFecha(true);
    setRestauracionCompleta(false);
    console.log('🔄 handleDateSelect: Reseteando restauracionCompleta');

    setFechaSeleccionada(date);

    // Limpiar campos
    [setLote, setFechaVencimiento, setLotes, setProductosGrabados].forEach(
      (fn) => fn(fn === setLotes || fn === setProductosGrabados ? [] : "")
    );

    const fechaStr = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    // 🎯 Cargar datos de confirmación persistidos
    const fechaKey = `confirmacion_maquila_${fechaStr}`;
    const datosConfirmacionGuardados = localStorage.getItem(fechaKey);

    try {
      // Cargar lotes desde BD
      const lotesFromBD = await loteService.getByFecha(fechaStr);

      // Cargar cantidades desde BD
      const registrosFromBD = await registroInventarioService.getByFecha(
        fechaStr
      );

      // 🔥 FILTRAR solo registros de MAQUILA
      const registrosMaquila = registrosFromBD?.filter(
        r => r.tipo_movimiento === 'ENTRADA_MAQUILA'
      ) || [];

      if (registrosMaquila.length > 0) {
        // Cargar usuario del día
        const usuarioDelDia = registrosMaquila[0].usuario;

        // 🎯 Mantener inputs limpios, solo mostrar tabla de confirmación
        if (productos.length > 0) {
          // Resetear cantidades en inputs (mantener limpios)
          const productosLimpios = productos.map((producto) => ({
            ...producto,
            cantidad: 0, // Mantener inputs en 0
          }));
          setProductos(productosLimpios);

          // 🎯 Cargar datos de confirmación desde localStorage si existen
          if (datosConfirmacionGuardados) {
            try {
              const datosParseados = JSON.parse(datosConfirmacionGuardados);
              setDatosGuardados(datosParseados);
              setYaSeGrabo(true); // Activar indicador visual
            } catch (parseError) {
              console.error("Error al parsear datos de confirmación de maquila:", parseError);
              const resumen = construirConfirmacionDesdeBackend(registrosMaquila, lotesFromBD, usuarioDelDia || usuario);
              setDatosGuardados(resumen);
              setYaSeGrabo(Boolean(resumen));
            }
          } else {
            const resumen = construirConfirmacionDesdeBackend(registrosMaquila, lotesFromBD, usuarioDelDia || usuario);
            setDatosGuardados(resumen);
            setYaSeGrabo(Boolean(resumen)); // Hay registros de maquila para el día
          }
        } else {
          setTimeout(() => handleDateSelect(date), 100);
          return;
        }
      } else {
        // 🎯 Resetear estados cuando no hay registros
        setUsuario(nombreUsuarioLogueado);
        setDatosGuardados(null);
        setYaSeGrabo(false); // Desactivar indicador visual
        if (productos.length > 0) {
          const productosReseteados = productos.map((producto) => ({
            ...producto,
            cantidad: 0,
          }));
          setProductos(productosReseteados);
        }
      }
    } catch (error) {
      console.error("Error al cargar datos de maquila:", error);
      setDatosGuardados(null);
      setYaSeGrabo(false); // Desactivar indicador visual en caso de error
      const productosReseteados = productos.map((producto) => ({
        ...producto,
        cantidad: 0,
      }));
      setProductos(productosReseteados);
    }

    // Desbloquear para permitir que el useEffect restaure los datos
    setProcesandoCambioFecha(false);
  };

  const handleCambiarUsuario = () => {
    setUsuario(nombreUsuarioLogueado);
    mostrarMensaje("Usuario de Inventario tomado desde la sesión activa", "info");
  };

  return (
    <Container fluid className="py-4">
      {/* Encabezado y controles */}
      <Row className="mb-4">
        <Col>
          <div className="header-buttons">
            <Button
              variant="outline-primary"
              className="mb-2 mb-md-0 me-md-2"
              onClick={handleCambiarUsuario}
              title="Usuario tomado desde la sesión actual"
            >
              <i className="bi bi-person"></i> {usuario}
            </Button>
          </div>
        </Col>
      </Row>

      {/* Selector de fecha */}
      <Row className="mb-4">
        <Col xs={12} md={6}>
          <DateSelector onDateSelect={handleDateSelect} />
        </Col>
      </Row>

      {/* Mensajes de alerta */}
      {mensaje.texto && (
        <Row className="mb-4">
          <Col>
            <Alert
              variant={mensaje.tipo}
              dismissible
              onClose={() => setMensaje({ texto: "", tipo: "" })}
            >
              {mensaje.texto}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Fila con lotes y tabla de lotes */}
      <Row className="mb-4">
        {/* Campos de Lote y Fecha de Vencimiento */}
        <Col xs={12} md={6} className="mb-3 mb-md-0">
          <Card className="p-2 h-100">
            <Form.Group className="mb-2">
              <Form.Label
                className="fw-bold small-text"
                style={{ color: "#1e293b" }}
              >
                LOTE
              </Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  placeholder="Lote"
                  value={lote}
                  onChange={(e) => setLote(e.target.value)}
                  className="fw-bold me-1 compact-input"
                  style={{ width: "498px" }}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAgregarLote}
                >
                  <i className="bi bi-plus-circle"></i>
                </Button>
              </div>
            </Form.Group>

            <Form.Group>
              <Form.Label
                className="fw-bold small-text"
                style={{ color: "#1e293b" }}
              >
                VENCIMIENTO
              </Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className="me-1 compact-input"
                />
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleAgregarLote}
                >
                  <i className="bi bi-calendar-plus"></i>
                </Button>
              </div>
            </Form.Group>
          </Card>
        </Col>

        {/* Tabla de lotes */}
        <Col xs={12} md={6}>
          <Card className="p-3 h-100">
            <h6 className="mb-2 fw-bold" style={{ color: "#1e293b" }}>
              Lotes Agregados:
            </h6>
            {lotes.length > 0 ? (
              <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                <div className="table-responsive">
                  <Table className="table-kardex" size="sm">
                    <thead>
                      <tr>
                        <th>Lote</th>
                        <th>Vencimiento</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lotes.map((lote) => (
                        <tr key={lote.id}>
                          <td>{lote.numero}</td>
                          <td>
                            {lote.fechaVencimiento
                              ? new Date(
                                lote.fechaVencimiento + "T00:00:00"
                              ).toLocaleDateString("es-ES")
                              : "-"}
                          </td>
                          <td className="text-center">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleEliminarLote(lote.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            ) : (
              <p className="text-muted">No hay lotes agregados</p>
            )}
          </Card>
        </Col>
      </Row>

      {/* Tabla de inventario */}
      <Row className="mb-4">
        <Col>
          <div className="table-responsive">
            <TablaInventario
              productos={productosOrdenados}
              onEditarClick={handleEditarClick}
              handleCantidadChange={handleCantidadChange}
              productosGrabados={productosGrabados}
              yaSeGrabo={yaSeGrabo}
              lotesIngresados={lotes.length > 0} // 🆕 Validar si hay lotes antes de permitir cantidades
              permitirMultiplesRegistros={true}
            />
          </div>
        </Col>
      </Row>

      {/* Botón grabar movimiento */}
      <Row className="mb-4">
        <Col>
          <div className="botones-container">
            {/* Botón editar para pantallas pequeñas */}
            <Button
              variant="primary"
              className="d-md-none editar-global-btn"
              onClick={() => setShowModalCantidades(true)}
            >
              <i className="bi bi-pencil-square me-2"></i> Editar
            </Button>

            <Button
              variant="success"
              className="action-button me-2"
              onClick={handleGrabarMovimiento}
            >
              <i className="bi bi-save me-2"></i>
              {yaSeGrabo ? "Agregar Movimiento" : (
                <>
                  <span className="d-none d-md-inline">Grabar Movimiento</span>
                  <span className="d-md-none">Grabar</span>
                </>
              )}
            </Button>

            {/* Botón para desbloquear productos grabados */}
            {Object.keys(productosGrabados).length > 0 && (
              <Button
                variant="outline-secondary"
                onClick={() => setProductosGrabados({})}
                className="me-2"
              >
                <i className="bi bi-unlock me-2"></i> Desbloquear Campos
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {/* Tabla de confirmación de producción */}
      {datosGuardados && datosGuardados.productos && datosGuardados.productos.length > 0 && (
        <Row className="mt-5 mb-4 justify-content-center">
          <Col xs={12} lg={11}>
            <TablaConfirmacionProduccion
              tipo="Maquila"
              datosGuardados={datosGuardados}
              onCerrar={() => {
                setDatosGuardados(null);
                setYaSeGrabo(false);
              }}
            />
          </Col>
        </Row>
      )}

      {/* Modales */}
      <ModalEditarExistencias
        show={showModalEditar}
        onHide={() => setShowModalEditar(false)}
        producto={productoEditar}
        onEditar={handleEditarExistencias}
      />

      <ModalCambiarUsuario
        show={showModalUsuario}
        onHide={() => setShowModalUsuario(false)}
        usuarioActual={usuario}
        onCambiar={handleCambiarUsuario}
      />

      <ModalEditarCantidades
        show={showModalCantidades}
        onHide={() => setShowModalCantidades(false)}
        productos={productos}
        onGuardar={handleGuardarCantidades}
      />

      {/* Modal para editar producción del día */}
      {showModalEditarProduccion && productoEditarProduccion && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-pencil-square me-2"></i>
                  Editar Maquila del Día
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModalEditarProduccion(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p><strong>Producto:</strong> {productoEditarProduccion.nombre}</p>
                <p><strong>Cantidad actual registrada:</strong> {
                  datosGuardados?.productos?.find(p => p.nombre === productoEditarProduccion.nombre)?.cantidad || 0
                } unidades</p>

                <div className="mb-3">
                  <label className="form-label">Nueva cantidad de maquila:</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    defaultValue={datosGuardados?.productos?.find(p => p.nombre === productoEditarProduccion.nombre)?.cantidad || 0}
                    id="nuevaCantidadProduccion"
                    onFocus={(e) => e.target.select()}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Motivo de la edición: <span className="text-danger">*</span></label>
                  <select
                    className="form-select mb-2"
                    id="motivoEdicionSelect"
                    onChange={(e) => {
                      const motivoPersonalizado = document.getElementById('motivoPersonalizado');
                      if (e.target.value === 'otro') {
                        motivoPersonalizado.style.display = 'block';
                        motivoPersonalizado.focus();
                      } else {
                        motivoPersonalizado.style.display = 'none';
                      }
                    }}
                  >
                    <option value="">Seleccionar motivo...</option>
                    <option value="Error de digitación">Error de digitación</option>
                    <option value="Corrección de conteo">Corrección de conteo</option>
                    <option value="Producto dañado">Producto dañado</option>
                    <option value="Ajuste de inventario">Ajuste de inventario</option>
                    <option value="otro">Otro motivo...</option>
                  </select>

                  <input
                    type="text"
                    className="form-control"
                    id="motivoPersonalizado"
                    placeholder="Especificar otro motivo..."
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModalEditarProduccion(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const nuevaCantidad = parseInt(document.getElementById('nuevaCantidadProduccion').value) || 0;
                    const motivoSelect = document.getElementById('motivoEdicionSelect').value;
                    const motivoPersonalizado = document.getElementById('motivoPersonalizado').value;

                    let motivoFinal = motivoSelect;
                    if (motivoSelect === 'otro' && motivoPersonalizado.trim()) {
                      motivoFinal = motivoPersonalizado.trim();
                    }

                    if (!motivoFinal) {
                      alert('Por favor selecciona o especifica un motivo para la edición');
                      return;
                    }

                    handleEditarProduccionDia(productoEditarProduccion.id, nuevaCantidad, motivoFinal);
                    setShowModalEditarProduccion(false);
                  }}
                >
                  <i className="bi bi-check-lg me-1"></i>
                  Actualizar Maquila
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default InventarioMaquilas;
