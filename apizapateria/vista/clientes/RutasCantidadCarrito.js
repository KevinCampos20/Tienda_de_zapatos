const express = require("express");

const CRutas = require("../../controlador/clientes/GestionarCantidadControlador"); // RF11

const router = express.Router();

router.put("/api/carrito/cantidad", CRutas.actualizarCantidad); // RF11

module.exports = router;