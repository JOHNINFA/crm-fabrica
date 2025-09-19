import React, { useState, useEffect } from "react";
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
import { useProductos } from "../../context/ProductosContext";
import { loteService } from "../../services/loteService";
import { registroInventarioService } from "../../services/registroInventarioService";
import { productoService } from "../../services/api";
import productosMaquilasData from "../../data/productosMaquilas";
import "../../styles/InventarioProduccion.css";
import "../../styles/TablaKardex.css";
import "../../styles/ActionButtons.css";

const InventarioMaquilas = () => {
  // Context y estados principales
  const { actualizarExistencias, agregarMovimientos, movimientos } =
    useProductos();

  // Estados de producción
  const [usuario, setUsuario] = useState("Usuario Predeterminado");
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
  const [cargando, setCargando] = useState(true);
  const [productosGrabados, setProductosGrabados] = useState({});

  // Estado para la tabla de confirmación
  const [datosGuardados, setDatosGuardados] = useState(null);

  // Estado para indicar que ya se grabó (sombreado de inputs)
  const [yaSeGrabo, setYaSeGrabo] = useState(false);

  // Estado para modal de edición de producción del día
  const [showModalEditarProduccion, setShowModalEditarProduccion] = useState(false);
  const [productoEditarProduccion, setProductoEditarProduccion] = useState(null);
  const [motivoEdicion, setMotivoEdicion] = useState("");

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

  // Cargar productos de maquila desde el archivo de datos
  const cargarProductosMaquila = async () => {
    try {
      setCargando(true);

      // Usar productos de maquila del archivo de datos
      const productosFormateados = productosMaquilasData.map((producto) => ({
        id: producto.id,
        nombre: producto.nombre?.toUpperCase() || "SIN NOMBRE",
        existencias: producto.existencias || 0,
        cantidad: 0,
        precio: producto.precio || 0,
        categoria: producto.categoria || "Maquila",
        imagen: producto.imagen || null,
      }));

      setProductos(productosFormateados);
      console.log("Productos de maquila cargados:", productosFormateados.length);
    } catch (error) {
      console.error("Error al cargar productos de maquila:", error);
      setMensaje({ texto: "Error al cargar productos de maquila", tipo: "danger" });
    } finally {
      setCargando(false);
    }
  };

  // Función para cargar datos de confirmación del día actual
  const cargarDatosConfirmacionActual = () => {
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
        console.log("✅ Datos de confirmación de maquila cargados para:", fechaStr);
      } catch (error) {
        console.error("Error al parsear datos de confirmación de maquila:", error);
      }
    }
  };

  // Inicialización del componente
  useEffect(() => {
    // Ejecutar carga inicial
    cargarProductosMaquila();

    // 🎯 NUEVO: Cargar datos de confirmación del día actual
    cargarDatosConfirmacionActual();
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
      mostrarMensaje("Debe ingresar un número de lote", "warning");
      return;
    }

    if (lotes.some((l) => l.numero === lote)) {
      mostrarMensaje("Este número de lote ya fue agregado", "warning");
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
    mostrarMensaje("Lote agregado correctamente", "success");
  };

  const handleEliminarLote = (id) => {
    setLotes(lotes.filter((lote) => lote.id !== id));
  };

  // Registrar producción de maquila
  const handleGrabarMovimiento = async () => {
    const productosConCantidad = productos.filter((p) => p.cantidad > 0);

    // Validaciones
    if (productosConCantidad.length === 0) {
      mostrarMensaje("No hay cantidades para registrar", "warning");
      return;
    }

    if (lotes.length === 0) {
      mostrarMensaje("Debe Ingresar Lote", "warning");
      return;
    }

    const fechaStr = fechaSeleccionada.toLocaleDateString("es-ES");
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
            "http://localhost:8000/api/registro-inventario/"
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
      } catch (error) {
        console.error("Error al guardar cantidad de maquila:", error);
      }
    }

    // Finalizar
    setProductos(nuevosProductos);
    actualizarExistencias(nuevosProductos);
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
        nombre: producto.nombre,
        cantidad: parseInt(producto.cantidad) || 0,
      })),
    };

    // 🎯 Persistir datos de confirmación en localStorage por fecha
    const fechaKey = `confirmacion_maquila_${fechaProduccion}`;
    localStorage.setItem(fechaKey, JSON.stringify(datosParaConfirmacion));

    // 🎯 Mostrar tabla de confirmación
    setDatosGuardados(datosParaConfirmacion);

    // 🎯 Limpiar TODOS los campos después de grabar
    const productosLimpios = productos.map((producto) => ({
      ...producto,
      cantidad: 0, // Limpiar cantidades
    }));
    setProductos(productosLimpios);

    // 🎯 Limpiar campos de lote y fecha vencimiento
    setLotes([]);
    setLote("");
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
      actualizarExistencias(nuevosProductos);

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

      console.log(`✅ Maquila editada: ${productoEditado.nombre} ${cantidadOriginal} → ${nuevaCantidadProduccion}`);
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
      actualizarExistencias(nuevosProductos);

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

        console.log("✅ Datos de confirmación de maquila actualizados después de editar");
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
    actualizarExistencias(nuevosProductos);

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

      if (registrosFromBD?.length > 0) {
        // Cargar usuario del día
        const usuarioDelDia = registrosFromBD[0].usuario;
        if (usuarioDelDia && usuarioDelDia !== "Sistema") {
          setUsuario(usuarioDelDia);
        }

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
            }
          }
        } else {
          setTimeout(() => handleDateSelect(date), 100);
          return;
        }
      } else {
        // 🎯 Resetear estados cuando no hay registros
        setUsuario("Usuario Predeterminado");
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
  };

  const handleCambiarUsuario = (nuevoUsuario) => {
    setUsuario(nuevoUsuario);
    mostrarMensaje("Usuario cambiado correctamente", "info");
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
              onClick={() => setShowModalUsuario(true)}
            >
              <i className="bi bi-person"></i> {usuario}
            </Button>
          </div>
        </Col>
      </Row>

      {/* Selector de fecha */}
      <Row className="mb-4">
        <Col xs={12} md={6}>
          <DateSelector onDateSelect={(date) => setFechaSeleccionada(date)} />
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
                  placeholder={yaSeGrabo ? "Lote registrado" : "Lote"}
                  value={lote}
                  onChange={(e) => setLote(e.target.value)}
                  className={`fw-bold me-1 compact-input ${yaSeGrabo ? 'input-grabado' : ''}`}
                  style={{ width: "498px" }}
                  disabled={yaSeGrabo}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAgregarLote}
                  disabled={yaSeGrabo}
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
                  className={`me-1 compact-input ${yaSeGrabo ? 'input-grabado' : ''}`}
                  disabled={yaSeGrabo}
                />
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleAgregarLote}
                  disabled={yaSeGrabo}
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
              productos={productos}
              onEditarClick={handleEditarClick}
              handleCantidadChange={handleCantidadChange}
              productosGrabados={productosGrabados}
              yaSeGrabo={yaSeGrabo}
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
              disabled={yaSeGrabo}
            >
              <i className="bi bi-save me-2"></i>
              {yaSeGrabo ? "Ya Grabado" : "Grabar Movimiento"}
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