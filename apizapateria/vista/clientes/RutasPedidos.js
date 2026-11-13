const express = require("express");

const RPRutas = require("../../controlador/clientes/RealizarPedidoControlador"); // RF15
const CPRutas = require("../../controlador/clientes/ConsultarPedidoControlador"); // RF16
const MPRutas = require("../../controlador/clientes/MisPedidosControlador"); // RF17

const router = express.Router();

router.post("/api/pedidos", RPRutas.realizarPedido); // RF15
// IMPORTANTE: la ruta fija (/mis-pedidos) va ANTES que /:id
router.get("/api/pedidos/mis-pedidos", MPRutas.misPedidos); // RF17
router.get("/api/pedidos/:id", CPRutas.consultarPedido); // RF16

module.exports = router;
