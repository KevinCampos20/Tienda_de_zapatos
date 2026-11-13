/*
RF-15 realizar pedido (cliente) funcion realizarPedido
POST /api/pedidos
Body (JSON): { "idCliente": 1, "direccionEnvio": "Calle 123 #45-67", "metodoPago": "Tarjeta de Crédito / Débito" }
OJO: idCliente se recibe en el body de forma TEMPORAL, mientras el equipo no
tenga login con token (JWT). Cuando exista, el idCliente saldrá del token.
*/
const modelo = require("../../modelo/clientes/RealizarPedidoModelo");

class RealizarPedidoControlador {
  static async realizarPedido(req, res) {
    const { idCliente, direccionEnvio, metodoPago } = req.body ?? {};

    // ------------ validaciones ------------
    const validaciones = [
      RealizarPedidoControlador.verid(idCliente, "del cliente"),
      RealizarPedidoControlador.verdir(direccionEnvio),
      RealizarPedidoControlador.verpago(metodoPago),
    ];

    const error = validaciones.find((e) => e !== null);
    if (error) {
      return res.status(400).json({ error });
    }
    // ------------ fin validaciones ------------

    try {
      const r = await modelo.registrarPedido(
        Number(idCliente),
        String(direccionEnvio).trim(),
        String(metodoPago).trim(),
      );

      if (r.resultado === "CLIENTE_NO_EXISTE") {
        return res
          .status(404)
          .json({ error: "El cliente no existe o está inactivo." });
      }

      // A1: no hay productos en el carrito
      if (r.resultado === "CARRITO_VACIO") {
        return res.status(400).json({
          error: "Tu carrito está vacío. Agrega productos antes de realizar el pedido.",
        });
      }

      // A2: algún producto fue eliminado del catálogo (RF06)
      if (r.resultado === "PRODUCTO_NO_DISPONIBLE") {
        return res.status(409).json({
          error: `El producto "${r.nombre}" ya no está disponible. Elimínalo del carrito para continuar.`,
        });
      }

      // A3: inventario insuficiente
      if (r.resultado === "STOCK_INSUFICIENTE") {
        return res.status(409).json({
          error: `No hay inventario suficiente de "${r.nombre}" (disponible: ${r.stock}).`,
        });
      }

      return res.status(201).json({
        mensaje: "Pedido registrado exitosamente",
        idPedido: r.idPedido,
        total: r.total,
      });
    } catch (err) {
      console.error("Error en RF15 realizar pedido:", err.message);
      return res.status(500).json({
        error: "No fue posible registrar el pedido. Intente nuevamente.",
      });
    }
  } // cerrar realizarPedido

  //-------------------validaciones----------------------------

  static verid(valor, de) {
    if (
      (typeof valor !== "number" && typeof valor !== "string") ||
      !/^\d+$/.test(String(valor).trim()) ||
      Number(valor) < 1
    ) {
      return `El identificador ${de} no es válido.`;
    }
    return null;
  }

  static verdir(direccion) {
    if (typeof direccion !== "string") {
      return "La dirección de envío es obligatoria.";
    }
    const dirRegex = /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s.,#\/ºª\-]{5,200}$/;
    if (!dirRegex.test(direccion.trim())) {
      return "Dirección inválida. Mínimo 5 caracteres, máximo 200. Solo se permiten letras, números, espacios y caracteres como #, -, ., , , /, º, ª";
    }
    return null;
  }

  static verpago(metodoPago) {
    if (typeof metodoPago !== "string") {
      return "El método de pago es obligatorio.";
    }
    const pagoRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s\/.,\-]{3,50}$/;
    if (!pagoRegex.test(metodoPago.trim())) {
      return "Método de pago inválido (entre 3 y 50 caracteres).";
    }
    return null;
  }
}

module.exports = RealizarPedidoControlador;
