const express = require("express");

const VRutas = require("../../controlador/clientes/VisualizarProductosControlador"); // RF07
const DRutas = require("../../controlador/clientes/DetalleProductoControlador"); // RF08
const BRutas = require("../../controlador/clientes/BuscarProductosControlador"); // RF09
const FRutas = require("../../controlador/clientes/FiltrarProductosControlador"); // RF10

const router = express.Router();

router.get("/api/productos", VRutas.visualizarProductos); // RF07
// IMPORTANTE: las rutas fijas (/buscar, /filtrar) van ANTES que /:id
router.get("/api/productos/buscar", BRutas.buscarProductos); // RF09
router.get("/api/productos/filtrar", FRutas.filtrarProductos); // RF10
router.get("/api/productos/:id", DRutas.verDetalle); // RF08

module.exports = router;