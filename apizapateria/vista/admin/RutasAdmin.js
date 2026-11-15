const express = require("express");

const LRutas = require("../../controlador/admin/LoginAdminControlador"); // RF03
const PRutas = require("../../controlador/admin/RegistrarProductoAdminControlador"); // RF04
const MRutas = require("../../controlador/admin/ModificarProductoAdminControlador"); // RF05
const ERutas = require("../../controlador/admin/EliminarProductoAdminControlador"); // RF06

const router = express.Router();

router.post("/api/auth/login/admin", LRutas.validarCredencial); // RF03
router.post("/api/admin/productos", PRutas.registrarProducto); // RF04
router.put("/api/admin/productos/:id", MRutas.modificarProducto); // RF05
router.delete("/api/admin/productos/:id", ERutas.eliminarProducto); // RF06

module.exports = router;
