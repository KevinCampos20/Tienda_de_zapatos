const express = require("express");
const CRutas = require("../../controlador/clientes/CrearClienteControlador"); //RF01
const LCRutas = require("../../controlador/clientes/LoginClienteControlador"); //RF02

const router = express.Router();

router.post("/api/auth/register", CRutas.crearCliente); // RF01
router.post("/api/auth/login/cliente", LCRutas.validarCredencial); // RF02

module.exports = router;