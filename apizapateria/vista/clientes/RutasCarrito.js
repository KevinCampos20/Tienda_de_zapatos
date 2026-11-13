const express = require("express");

const VCRutas = require("../../controlador/clientes/VisualizarCarritoControlador"); // RF12
const ACRutas = require("../../controlador/clientes/AgregarCarritoControlador"); // RF13
const ECRutas = require("../../controlador/clientes/EliminarCarritoControlador"); // RF14

const router = express.Router();

router.get("/api/carrito", VCRutas.verCarrito); // RF12
router.post("/api/carrito/agregar", ACRutas.agregarProducto); // RF13
router.delete("/api/carrito/eliminar/:id", ECRutas.eliminarProducto); // RF14

module.exports = router;
