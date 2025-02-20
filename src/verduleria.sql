-- Crear la base de datos
CREATE DATABASE ferreleria;

-- Seleccionar la base de datos
\c ferreleria;

-- Tabla de sucursales
CREATE TABLE sucursales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(255) NOT NULL
);

-- Tabla de roles de usuario
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL -- Ejemplo: 'admin', 'empleado'
);

-- Tabla de usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    sucursal_id INT REFERENCES sucursales(id) ON DELETE SET NULL,
    rol_id INT REFERENCES roles(id) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo_medida VARCHAR(10) CHECK (tipo_medida IN ('kg', 'unidad')),
    costo DECIMAL(10, 2) NOT NULL,
    margen_ganancia DECIMAL(5, 2) NOT NULL,
    precio DECIMAL(10, 2) GENERATED ALWAYS AS (costo * (1 + margen_ganancia / 100)) STORED
);

-- Tabla de órdenes de compra
CREATE TABLE ordenes_compra (
    id SERIAL PRIMARY KEY,
    sucursal_id INT REFERENCES sucursales(id) ON DELETE CASCADE,
    vendedor_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    total DECIMAL(10, 2) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de detalles de orden (productos en la orden)
CREATE TABLE detalles_orden (
    id SERIAL PRIMARY KEY,
    orden_id INT REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
    cantidad DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

-- Insertar roles por defecto
INSERT INTO roles (nombre) VALUES ('admin'), ('empleado');
