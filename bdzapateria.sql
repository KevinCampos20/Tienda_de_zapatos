-- =====================================================================
--  PROYECTO ZAPATERÍA (MIMO) - Base de datos RF01 a RF14
--  Motor: MySQL 8.0.16+ / MariaDB 10.4+  (InnoDB, utf8mb4)
--  Ejecutar:  mysql -u root -p < bdzapateria.sql
--
--  ¡ATENCIÓN!  Este script ELIMINA y vuelve a crear la base bdzapateria.
--  Es una regeneración limpia: cualquier dato previo se pierde.
--
--  Fuentes que sigue este script:
--    * Backend (apizaparteria): nombres de tablas/columnas que ya consultan
--      los modelos (clientes, trabajadores, productos, contrasena, estado...)
--    * RF01-RF14 (casos de uso, historias de usuario y diagramas de clases)
--    * Bitácora de endpoints (parámetros de entrada/respuesta de cada RF)
--    * Modelo_ER_MIMO_mejorado.pdf (entidades, PK/FK/UQ, cardinalidades)
-- =====================================================================

SET NAMES utf8mb4;

DROP DATABASE IF EXISTS bdzapateria;

CREATE DATABASE bdzapateria
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bdzapateria;

-- ---------------------------------------------------------------------
-- TRABAJADORES  (entidad ADMIN_USUARIOS del modelo ER)
-- RF03 login administrador/trabajador; RF04-RF06 gestión de catálogo.
-- El modelo ER la llama ADMIN_USUARIOS, pero LoginAdminModelo consulta
-- "trabajadores", así que se conserva ese nombre. Mismo contenido que el
-- ER: nombre, correo (UQ), contraseña con hash, rol y fecha de registro.
-- LoginAdminControlador exige estado='Activo' y rol='admin'.
-- ---------------------------------------------------------------------
CREATE TABLE trabajadores (
  idTrabajador  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(100)  NOT NULL,
  correo        VARCHAR(250)  NOT NULL,
  contrasena    VARCHAR(255)  NOT NULL,                       -- hash bcrypt
  rol           ENUM('admin','trabajador') NOT NULL DEFAULT 'trabajador',
  estado        ENUM('Activo','Inactivo')  NOT NULL DEFAULT 'Activo',
  fechaRegistro DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idTrabajador),
  UNIQUE KEY uq_trabajadores_correo (correo)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CLIENTES  (RF01 crear cuenta, RF02 login cliente)
-- Columnas = las que inserta CrearClienteModelo. 'estado' lleva DEFAULT
-- porque el INSERT no lo envía y el login rechaza a quien no sea 'Activo'.
-- Unicidad: correo y numeroDocumento (el controlador responde 409 ante
-- "Duplicate entry"). Collation _ci: el login normaliza el correo a
-- minúsculas y debe encontrar también correos guardados con mayúsculas.
-- ---------------------------------------------------------------------
CREATE TABLE clientes (
  idCliente       INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  tipoDocumento   VARCHAR(3)    NOT NULL,                     -- CC, TI, CE
  numeroDocumento VARCHAR(10)   NOT NULL,                     -- 8 a 10 dígitos
  nombres         VARCHAR(100)  NOT NULL,
  direccion       VARCHAR(200)  NOT NULL,
  telefono        VARCHAR(10)   NOT NULL,                     -- 10 dígitos
  correo          VARCHAR(250)  NOT NULL,
  contrasena      VARCHAR(255)  NOT NULL,                     -- hash bcrypt
  estado          ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  fechaRegistro   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idCliente),
  UNIQUE KEY uq_clientes_documento (numeroDocumento),
  UNIQUE KEY uq_clientes_correo (correo),
  CONSTRAINT ck_clientes_tipodoc CHECK (tipoDocumento IN ('CC','TI','CE'))
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- PRODUCTOS  (RF04 a RF10)
-- Atributos del diagrama de clases Producto + descripcion (RF04, RF08 y
-- modelo ER) + estado (lo inserta RegistrarProductoAdminModelo).
-- Cada fila es un zapato en UNA talla (modelo ER básico, sin variantes):
-- el mismo modelo en 3 tallas = 3 filas.
-- RF04 "producto repetido" = mismo nombre + marca + talla.
-- RF06 eliminar = estado 'Inactivo' (borrado lógico): el producto sale del
-- catálogo, pero no se rompe el historial de detalle_pedidos que lo cita.
-- Catálogo visible = estado 'Activo'. Agotado (RF08-A2) = stock = 0.
-- Validaciones de rango del árbol de requisitos: precio > 0, stock >= 0.
-- ---------------------------------------------------------------------
CREATE TABLE productos (
  idProducto  INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(100)   NOT NULL,
  descripcion VARCHAR(500)   NOT NULL,
  marca       VARCHAR(50)    NOT NULL,
  categoria   VARCHAR(50)    NOT NULL,
  talla       VARCHAR(10)    NOT NULL,
  precio      DECIMAL(10,2)  NOT NULL,
  stock       INT            NOT NULL DEFAULT 0,
  imagen      VARCHAR(500)   NULL,                            -- URL, opcional
  estado      ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (idProducto),
  UNIQUE KEY uq_producto (nombre, marca, talla),
  KEY idx_productos_categoria (categoria),                    -- RF10 filtros
  KEY idx_productos_marca (marca),
  KEY idx_productos_talla (talla),
  KEY idx_productos_precio (precio),
  CONSTRAINT ck_productos_precio CHECK (precio > 0),
  CONSTRAINT ck_productos_stock  CHECK (stock >= 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CARRITOS  (RF11, RF12)
-- Diagrama de clases Carrito: idCarrito, idCliente, fechaCreacion, total.
-- Relación Cliente 1 : 0..1 Carrito  ->  UNIQUE sobre idCliente.
-- ---------------------------------------------------------------------
CREATE TABLE carritos (
  idCarrito     INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  idCliente     INT UNSIGNED  NOT NULL,
  fechaCreacion DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total         DECIMAL(12,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (idCarrito),
  UNIQUE KEY uq_carrito_cliente (idCliente),
  CONSTRAINT fk_carritos_cliente FOREIGN KEY (idCliente)
    REFERENCES clientes (idCliente) ON DELETE CASCADE,
  CONSTRAINT ck_carritos_total CHECK (total >= 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CARRITO_ITEMS  (entidad CARRITO_ITEMS del ER / clase ItemCarrito)
-- UNIQUE (carrito, producto): un producto = una línea; si se vuelve a
-- agregar, se actualiza la cantidad (recomendación del modelo ER).
-- cantidad > 0 (RF11-A2). RF11 no toca el inventario real: el stock solo
-- se descuenta al confirmar el pedido (RF13).
-- subtotal = cantidad x precioUnitario, calculado por la base de datos,
-- así nunca queda inconsistente (RF11 / RF12 piden recalcularlo).
-- ---------------------------------------------------------------------
CREATE TABLE carrito_items (
  idItem         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  idCarrito      INT UNSIGNED  NOT NULL,
  idProducto     INT UNSIGNED  NOT NULL,
  cantidad       INT           NOT NULL,
  precioUnitario DECIMAL(10,2) NOT NULL,
  fechaAgregado  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal       DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * precioUnitario) STORED,
  PRIMARY KEY (idItem),
  UNIQUE KEY uq_item_producto (idCarrito, idProducto),
  KEY idx_items_producto (idProducto),
  CONSTRAINT fk_items_carrito  FOREIGN KEY (idCarrito)
    REFERENCES carritos (idCarrito)   ON DELETE CASCADE,
  CONSTRAINT fk_items_producto FOREIGN KEY (idProducto)
    REFERENCES productos (idProducto) ON DELETE CASCADE,
  CONSTRAINT ck_items_cantidad CHECK (cantidad > 0),
  CONSTRAINT ck_items_precio   CHECK (precioUnitario > 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- PEDIDOS  (RF13, RF14)
-- Diagrama de clases Pedido: idPedido, idCliente, fecha, estado, total.
-- + direccionEnvio y metodoPago: parámetros de entrada de RF13 en la
-- bitácora (POST /api/pedidos). (La bitácora responde "fechaCreacion":
-- en la consulta usar  fecha AS fechaCreacion.)
-- Estados de RF14: pendiente, confirmado, enviado, entregado.
-- idCliente sin CASCADE: un cliente con pedidos no se puede borrar.
-- Índice (idCliente, fecha): listado "Mis pedidos" del cliente.
-- ---------------------------------------------------------------------
CREATE TABLE pedidos (
  idPedido       INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  idCliente      INT UNSIGNED  NOT NULL,
  fecha          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado         ENUM('pendiente','confirmado','enviado','entregado')
                 NOT NULL DEFAULT 'pendiente',
  total          DECIMAL(12,2) NOT NULL,
  direccionEnvio VARCHAR(200)  NOT NULL,
  metodoPago     VARCHAR(50)   NOT NULL,
  PRIMARY KEY (idPedido),
  KEY idx_pedidos_cliente_fecha (idCliente, fecha),
  CONSTRAINT fk_pedidos_cliente FOREIGN KEY (idCliente)
    REFERENCES clientes (idCliente),
  CONSTRAINT ck_pedidos_total CHECK (total >= 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- DETALLE_PEDIDOS  (entidad DETALLE_PEDIDOS del ER / clase DetallePedido)
-- precioUnitario = precio vigente al momento de la compra (histórico).
-- idProducto sin CASCADE (RESTRICT): protege el historial de compras.
-- ---------------------------------------------------------------------
CREATE TABLE detalle_pedidos (
  idDetalle      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  idPedido       INT UNSIGNED  NOT NULL,
  idProducto     INT UNSIGNED  NOT NULL,
  cantidad       INT           NOT NULL,
  precioUnitario DECIMAL(10,2) NOT NULL,
  subtotal       DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * precioUnitario) STORED,
  PRIMARY KEY (idDetalle),
  KEY idx_detalle_pedido (idPedido),
  KEY idx_detalle_producto (idProducto),
  CONSTRAINT fk_detalle_pedido   FOREIGN KEY (idPedido)
    REFERENCES pedidos (idPedido)     ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto FOREIGN KEY (idProducto)
    REFERENCES productos (idProducto),
  CONSTRAINT ck_detalle_cantidad CHECK (cantidad > 0),
  CONSTRAINT ck_detalle_precio   CHECK (precioUnitario > 0)
) ENGINE=InnoDB;

-- =====================================================================
--  DATOS INICIALES
-- =====================================================================

-- Administrador:  admin@zapateria.com  /  Admin123*   (cámbiala en producción)
INSERT INTO trabajadores (nombre, correo, contrasena, rol, estado) VALUES
('Administrador', 'admin@zapateria.com',
 '$2b$10$/kuJJgpDBcTmvI5VEZ0C0OYlEa2rPhy3pORO9H.h4JPCAMBgm5Pd2',
 'admin', 'Activo');

-- Productos de ejemplo para probar RF07 a RF10 (incluye uno agotado: RF08-A2)
INSERT INTO productos (nombre, descripcion, marca, categoria, talla, precio, stock, imagen) VALUES
('Tenis Runner Pro',    'Tenis deportivos livianos para correr',    'Nike',          'Deportivo', '40', 189900.00, 15, NULL),
('Tenis Runner Pro',    'Tenis deportivos livianos para correr',    'Nike',          'Deportivo', '42', 189900.00, 10, NULL),
('Tenis Urban Classic', 'Tenis casuales de uso diario',             'Adidas',        'Casual',    '39', 159900.00,  8, NULL),
('Mocasín Elegance',    'Mocasín de cuero para ocasiones formales', 'Hush Puppies',  'Formal',    '41', 229900.00,  5, NULL),
('Bota Trail Max',      'Bota de montaña impermeable',              'Columbia',      'Botas',     '43', 279900.00,  0, NULL),
('Sandalia Verano',     'Sandalia cómoda para clima cálido',        'Crocs',         'Sandalias', '38',  89900.00, 20, NULL);
