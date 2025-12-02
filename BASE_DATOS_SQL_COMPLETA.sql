-- ============================================
-- SCRIPT SQL COMPLETO - BASE DE DATOS FABRICA
-- Sistema CRM Fábrica de Arepas
-- PostgreSQL 14+
-- ============================================

-- Conectarse a PostgreSQL y crear base de datos
-- psql -U postgres
-- CREATE DATABASE fabrica;
-- \c fabrica

-- ============================================
-- TABLA: api_categoria
-- ============================================
CREATE TABLE api_categoria (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);

-- ============================================
-- TABLA: api_producto
-- ============================================
CREATE TABLE api_producto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) DEFAULT 0,
    precio_compra DECIMAL(10,2) DEFAULT 0,
    stock_total INTEGER DEFAULT 0,
    categoria_id INTEGER REFERENCES api_categoria(id) ON DELETE SET NULL,
    imagen VARCHAR(200),
    codigo_barras VARCHAR(100),
    marca VARCHAR(100) DEFAULT 'GENERICA',
    impuesto VARCHAR(20) DEFAULT 'IVA(0%)',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- ============================================
-- TABLA: api_lote
-- ============================================
CREATE TABLE api_lote (
    id SERIAL PRIMARY KEY,
    lote VARCHAR(100) NOT NULL,
    fecha_vencimiento DATE,
    usuario VARCHAR(100) DEFAULT 'Sistema',
    fecha_produccion DATE DEFAULT '2025-06-17',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: api_movimientoinventario
-- ============================================
CREATE TABLE api_movimientoinventario (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES api_producto(id) ON DELETE CASCADE,
    lote_id INTEGER REFERENCES api_lote(id) ON DELETE SET NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
    cantidad INTEGER NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario VARCHAR(100) NOT NULL,
    nota TEXT
);

-- ============================================
-- TABLA: api_registroinventario
-- ============================================
CREATE TABLE api_registroinventario (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL,
    producto_nombre VARCHAR(255) NOT NULL,
    cantidad INTEGER DEFAULT 0,
    entradas INTEGER DEFAULT 0,
    salidas INTEGER DEFAULT 0,
    saldo INTEGER DEFAULT 0,
    tipo_movimiento VARCHAR(20) DEFAULT 'ENTRADA',
    fecha_produccion DATE DEFAULT '2025-06-17',
    usuario VARCHAR(100) DEFAULT 'Sistema',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: api_venta
-- ============================================
CREATE TABLE api_venta (
    id SERIAL PRIMARY KEY,
    numero_factura VARCHAR(50) UNIQUE NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vendedor VARCHAR(100) DEFAULT 'Sistema',
    cliente VARCHAR(255) DEFAULT 'CONSUMIDOR FINAL',
    metodo_pago VARCHAR(20) DEFAULT 'EFECTIVO' CHECK (metodo_pago IN ('EFECTIVO', 'TARJETA', 'T_CREDITO', 'QR', 'TRANSF', 'RAPPIPAY', 'BONOS', 'OTROS')),
    subtotal DECIMAL(10,2) DEFAULT 0,
    impuestos DECIMAL(10,2) DEFAULT 0,
    descuentos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    dinero_entregado DECIMAL(10,2) DEFAULT 0,
    devuelta DECIMAL(10,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'PAGADO' CHECK (estado IN ('PAGADO', 'PENDIENTE', 'CANCELADO', 'ANULADA')),
    nota TEXT,
    banco VARCHAR(100) DEFAULT 'Caja General',
    centro_costo VARCHAR(100),
    bodega VARCHAR(100) DEFAULT 'Principal'
);

-- ============================================
-- TABLA: api_detalleventa
-- ============================================
CREATE TABLE api_detalleventa (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER NOT NULL REFERENCES api_venta(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES api_producto(id) ON DELETE CASCADE,
    cantidad INTEGER DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- ============================================
-- TABLA: api_cliente
-- ============================================
CREATE TABLE api_cliente (
    id SERIAL PRIMARY KEY,
    regimen VARCHAR(20) DEFAULT 'SIMPLIFICADO' CHECK (regimen IN ('SIMPLIFICADO', 'COMUN')),
    tipo_persona VARCHAR(20) DEFAULT 'NATURAL' CHECK (tipo_persona IN ('NATURAL', 'JURIDICA')),
    tipo_identificacion VARCHAR(20) DEFAULT 'CC' CHECK (tipo_identificacion IN ('CC', 'NIT', 'CE', 'PASAPORTE')),
    identificacion VARCHAR(50) UNIQUE NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    alias VARCHAR(100),
    primer_nombre VARCHAR(100),
    segundo_nombre VARCHAR(100),
    primer_apellido VARCHAR(100),
    segundo_apellido VARCHAR(100),
    telefono_1 VARCHAR(20),
    movil VARCHAR(20),
    email_1 VARCHAR(254),
    contacto VARCHAR(255),
    telefono_contacto VARCHAR(20),
    pais VARCHAR(100) DEFAULT 'Colombia',
    departamento VARCHAR(100),
    ciudad VARCHAR(100),
    direccion TEXT,
    zona_barrio VARCHAR(255),
    tipo_contacto VARCHAR(50) DEFAULT 'CLIENTE',
    sucursal VARCHAR(100) DEFAULT 'Todas',
    medio_pago_defecto VARCHAR(50),
    nota TEXT,
    tipo_lista_precio VARCHAR(100),
    vendedor_asignado VARCHAR(100),
    centro_costo VARCHAR(100),
    dia_entrega VARCHAR(20),
    notificar_cartera BOOLEAN DEFAULT FALSE,
    notificar_rotacion BOOLEAN DEFAULT FALSE,
    cliente_predeterminado BOOLEAN DEFAULT FALSE,
    permite_venta_credito BOOLEAN DEFAULT FALSE,
    cupo_endeudamiento DECIMAL(12,2) DEFAULT 0,
    dias_vencimiento_cartera INTEGER DEFAULT 30,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: api_listaprecio
-- ============================================
CREATE TABLE api_listaprecio (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    tipo VARCHAR(20) DEFAULT 'CLIENTE' CHECK (tipo IN ('CLIENTE', 'PROVEEDOR', 'EMPLEADO')),
    empleado VARCHAR(100),
    sucursal VARCHAR(100) DEFAULT 'Principal',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: api_precioproducto
-- ============================================
CREATE TABLE api_precioproducto (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES api_producto(id) ON DELETE CASCADE,
    lista_precio_id INTEGER NOT NULL REFERENCES api_listaprecio(id) ON DELETE CASCADE,
    precio DECIMAL(10,2) NOT NULL,
    utilidad_porcentaje DECIMAL(5,2) DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(producto_id, lista_precio_id)
);

-- ============================================
-- TABLAS: api_cargueid1 a api_cargueid6
-- ============================================
CREATE TABLE api_cargueid1 (
    id SERIAL PRIMARY KEY,
    dia VARCHAR(10) NOT NULL CHECK (dia IN ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO')),
    fecha DATE NOT NULL,
    v BOOLEAN DEFAULT FALSE,
    d BOOLEAN DEFAULT FALSE,
    producto VARCHAR(255),
    cantidad INTEGER DEFAULT 0,
    dctos INTEGER DEFAULT 0,
    adicional INTEGER DEFAULT 0,
    devoluciones INTEGER DEFAULT 0,
    vencidas INTEGER DEFAULT 0,
    lotes_vencidos TEXT,
    total INTEGER DEFAULT 0,
    valor DECIMAL(10,2) DEFAULT 0,
    neto DECIMAL(12,2) DEFAULT 0,
    concepto VARCHAR(255),
    descuentos DECIMAL(10,2) DEFAULT 0,
    nequi DECIMAL(10,2) DEFAULT 0,
    daviplata DECIMAL(10,2) DEFAULT 0,
    base_caja DECIMAL(10,2) DEFAULT 0,
    total_despacho DECIMAL(12,2) DEFAULT 0,
    total_pedidos DECIMAL(10,2) DEFAULT 0,
    total_dctos DECIMAL(10,2) DEFAULT 0,
    venta DECIMAL(12,2) DEFAULT 0,
    total_efectivo DECIMAL(12,2) DEFAULT 0,
    licencia_transporte VARCHAR(2) CHECK (licencia_transporte IN ('C', 'NC')),
    soat VARCHAR(2) CHECK (soat IN ('C', 'NC')),
    uniforme VARCHAR(2) CHECK (uniforme IN ('C', 'NC')),
    no_locion VARCHAR(2) CHECK (no_locion IN ('C', 'NC')),
    no_accesorios VARCHAR(2) CHECK (no_accesorios IN ('C', 'NC')),
    capacitacion_carnet VARCHAR(2) CHECK (capacitacion_carnet IN ('C', 'NC')),
    higiene VARCHAR(2) CHECK (higiene IN ('C', 'NC')),
    estibas VARCHAR(2) CHECK (estibas IN ('C', 'NC')),
    desinfeccion VARCHAR(2) CHECK (desinfeccion IN ('C', 'NC')),
    usuario VARCHAR(100) DEFAULT 'Sistema',
    responsable VARCHAR(100) DEFAULT 'RESPONSABLE',
    ruta VARCHAR(100) DEFAULT '',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repetir para ID2, ID3, ID4, ID5, ID6
CREATE TABLE api_cargueid2 (LIKE api_cargueid1 INCLUDING ALL);
CREATE TABLE api_cargueid3 (LIKE api_cargueid1 INCLUDING ALL);
CREATE TABLE api_cargueid4 (LIKE api_cargueid1 INCLUDING ALL);
CREATE TABLE api_cargueid5 (LIKE api_cargueid1 INCLUDING ALL);
CREATE TABLE api_cargueid6 (LIKE api_cargueid1 INCLUDING ALL);

-- ============================================
-- TABLA: api_produccion
-- ============================================
CREATE TABLE api_produccion (
    id SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    producto VARCHAR(255) NOT NULL,
    cantidad INTEGER DEFAULT 0,
    lote VARCHAR(100),
    congelado BOOLEAN DEFAULT FALSE,
    fecha_congelado TIMESTAMP,
    usuario_congelado VARCHAR(100),
    usuario VARCHAR(100) DEFAULT 'Sistema',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: api_produccionsolicitada
-- ============================================
CREATE TABLE api_produccionsolicitada (
    id SERIAL PRIMARY KEY,
    dia VARCHAR(10) NOT NULL CHECK (dia IN ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO')),
    fecha DATE NOT NULL,
    producto_nombre VARCHAR(255) NOT NULL,
    cantidad_solicitada INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dia, fecha, producto_nombre)
);

-- ============================================
-- TABLA: api_sucursal
-- ============================================
CREATE TABLE api_sucursal (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(254),
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    codigo_postal VARCHAR(10),
    activo BOOLEAN DEFAULT TRUE,
    es_principal BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: api_cajero
-- ============================================
CREATE TABLE api_cajero (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(254),
    telefono VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    sucursal_id INTEGER NOT NULL REFERENCES api_sucursal(id) ON DELETE CASCADE,
    rol VARCHAR(20) DEFAULT 'CAJERO' CHECK (rol IN ('CAJERO', 'SUPERVISOR', 'ADMINISTRADOR')),
    activo BOOLEAN DEFAULT TRUE,
    puede_hacer_descuentos BOOLEAN DEFAULT FALSE,
    limite_descuento DECIMAL(5,2) DEFAULT 0,
    puede_anular_ventas BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP,
    UNIQUE(nombre, sucursal_id)
);

-- ============================================
-- TABLA: api_turno
-- ============================================
CREATE TABLE api_turno (
    id SERIAL PRIMARY KEY,
    cajero_id INTEGER NOT NULL REFERENCES api_cajero(id) ON DELETE CASCADE,
    sucursal_id INTEGER NOT NULL REFERENCES api_sucursal(id) ON DELETE CASCADE,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'CERRADO', 'SUSPENDIDO')),
    base_inicial DECIMAL(10,2) DEFAULT 0,
    arqueo_final DECIMAL(10,2) DEFAULT 0,
    diferencia DECIMAL(10,2) DEFAULT 0,
    total_ventas DECIMAL(12,2) DEFAULT 0,
    total_efectivo DECIMAL(12,2) DEFAULT 0,
    total_tarjeta DECIMAL(12,2) DEFAULT 0,
    total_otros DECIMAL(12,2) DEFAULT 0,
    numero_transacciones INTEGER DEFAULT 0,
    notas_apertura TEXT,
    notas_cierre TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: api_ventacajero
-- ============================================
CREATE TABLE api_ventacajero (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER UNIQUE NOT NULL REFERENCES api_venta(id) ON DELETE CASCADE,
    cajero_id INTEGER NOT NULL REFERENCES api_cajero(id) ON DELETE CASCADE,
    turno_id INTEGER REFERENCES api_turno(id) ON DELETE CASCADE,
    sucursal_id INTEGER NOT NULL REFERENCES api_sucursal(id) ON DELETE CASCADE,
    terminal VARCHAR(50) DEFAULT 'POS-001',
    numero_transaccion VARCHAR(100)
);

-- ============================================
-- TABLA: api_arqueocaja
-- ============================================
CREATE TABLE api_arqueocaja (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    cajero VARCHAR(100) NOT NULL,
    banco VARCHAR(100) DEFAULT 'Caja General',
    valores_sistema JSONB DEFAULT '{}',
    total_sistema DECIMAL(12,2) DEFAULT 0,
    valores_caja JSONB DEFAULT '{}',
    total_caja DECIMAL(12,2) DEFAULT 0,
    diferencias JSONB DEFAULT '{}',
    total_diferencia DECIMAL(12,2) DEFAULT 0,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'COMPLETADO' CHECK (estado IN ('PENDIENTE', 'COMPLETADO', 'REVISADO')),
    cajero_logueado_id INTEGER REFERENCES api_cajero(id) ON DELETE SET NULL,
    sucursal_id INTEGER REFERENCES api_sucursal(id) ON DELETE SET NULL,
    turno_id INTEGER REFERENCES api_turno(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fecha, cajero, banco)
);

-- ============================================
-- TABLA: api_remision
-- ============================================
CREATE TABLE api_remision (
    id SERIAL PRIMARY KEY,
    numero_remision VARCHAR(50) UNIQUE NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vendedor VARCHAR(100) NOT NULL,
    destinatario VARCHAR(255) NOT NULL,
    direccion_entrega TEXT NOT NULL,
    telefono_contacto VARCHAR(20),
    fecha_entrega DATE,
    tipo_remision VARCHAR(20) DEFAULT 'ENTREGA' CHECK (tipo_remision IN ('ENTREGA', 'TRASLADO', 'DEVOLUCION', 'MUESTRA')),
    transportadora VARCHAR(100) DEFAULT 'Propia',
    subtotal DECIMAL(10,2) DEFAULT 0,
    impuestos DECIMAL(10,2) DEFAULT 0,
    descuentos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_TRANSITO', 'ENTREGADA', 'ANULADA')),
    nota TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: api_detalleremision
-- ============================================
CREATE TABLE api_detalleremision (
    id SERIAL PRIMARY KEY,
    remision_id INTEGER NOT NULL REFERENCES api_remision(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES api_producto(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================
CREATE INDEX idx_producto_categoria ON api_producto(categoria_id);
CREATE INDEX idx_producto_activo ON api_producto(activo);
CREATE INDEX idx_venta_fecha ON api_venta(fecha);
CREATE INDEX idx_venta_estado ON api_venta(estado);
CREATE INDEX idx_venta_vendedor ON api_venta(vendedor);
CREATE INDEX idx_cliente_identificacion ON api_cliente(identificacion);
CREATE INDEX idx_cliente_activo ON api_cliente(activo);
CREATE INDEX idx_remision_fecha ON api_remision(fecha);
CREATE INDEX idx_remision_estado ON api_remision(estado);
CREATE INDEX idx_turno_cajero ON api_turno(cajero_id);
CREATE INDEX idx_turno_estado ON api_turno(estado);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar categorías
INSERT INTO api_categoria (nombre) VALUES
('Arepas'),
('Almojabanas'),
('Semillas'),
('Maíz'),
('General');

-- Insertar sucursal principal
INSERT INTO api_sucursal (nombre, direccion, ciudad, activo, es_principal) VALUES
('Principal', 'Calle Principal 123', 'Bogotá', TRUE, TRUE);

-- Insertar cajero de prueba (password: 12345 hasheado con SHA256)
INSERT INTO api_cajero (nombre, password, sucursal_id, rol, activo) VALUES
('prueba1', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', 1, 'CAJERO', TRUE);

-- Insertar productos de ejemplo
INSERT INTO api_producto (nombre, precio, precio_compra, stock_total, categoria_id, marca, activo) VALUES
('AREPA TIPO OBLEA 500Gr', 2500.00, 1500.00, 100, 1, 'GENERICA', TRUE),
('AREPA MEDIANA 330Gr', 2000.00, 1200.00, 150, 1, 'GENERICA', TRUE),
('AREPA QUESO CORRIENTE 450Gr', 3900.00, 2500.00, 80, 1, 'GENERICA', TRUE);

-- Insertar cliente de prueba
INSERT INTO api_cliente (identificacion, nombre_completo, tipo_identificacion, tipo_persona, regimen, telefono_1, direccion, ciudad, activo) VALUES
('1234567890', 'Cliente Prueba', 'CC', 'NATURAL', 'SIMPLIFICADO', '3001234567', 'Calle 123 #45-67', 'Bogotá', TRUE);

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Verificar tablas creadas
-- \dt

-- Verificar datos insertados
-- SELECT * FROM api_categoria;
-- SELECT * FROM api_producto;
-- SELECT * FROM api_sucursal;
-- SELECT * FROM api_cajero;
