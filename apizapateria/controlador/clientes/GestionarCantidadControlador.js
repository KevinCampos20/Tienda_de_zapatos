/*
RF-11 gestionar cantidades (cliente) funcion actualizarCantidad
Body (JSON): { "idCliente": 1, "idProducto": 1, "cantidad": 3 }
OJO: idCliente se recibe en el body de forma TEMPORAL, mientras el equipo no
tenga login con token (JWT). Cuando exista, el idCliente saldrá del token.
*/
const modelo = require("../../modelo/clientes/GestionarCantidadModelo");

class GestionarCantidadControlador {
  static async actualizarCantidad(req, res) {
    const { idCliente, idProducto, cantidad } = req.body ?? {};

    // ------------ validaciones ------------
    const validaciones = [
      GestionarCantidadControlador.verid(idCliente, "del cliente"),
      GestionarCantidadControlador.verid(idProducto, "del producto"),
      GestionarCantidadControlador.vercantidad(cantidad),
    ];

    const error = validaciones.find((e) => e !== null);
    if (error) {
      return res.status(400).json({ error });
    }
    // ------------ fin validaciones ------------

    try {
      const r = await modelo.actualizarCantidad(
        Number(idCliente),
        Number(idProducto),
        Number(cantidad),
      );

      if (r.resultado === "NO_EN_CARRITO") {
        return res
          .status(404)
          .json({ error: "El producto no se encuentra en el carrito." });
      }

      if (r.resultado === "NO_DISPONIBLE") {
        return res
          .status(404)
          .json({ error: "El producto seleccionado no está disponible." });
      }

      // A1: cantidad superior al inventario (no se aplica el cambio)
      if (r.resultado === "SUPERA_STOCK") {
        return res
          .status(400)
          .json({ error: "La cantidad ingresada supera el inventario disponible." });
      }

      return res
        .status(200)
        .json({ mensaje: "Cantidad actualizada", subtotal: r.subtotal });
    } catch (err) {
      console.error("Error en RF11 gestionar cantidades:", err.message);
      return res.status(500).json({
        error: "No fue posible actualizar la cantidad. Intente nuevamente.",
      });
    }
  } // cerrar actualizarCantidad

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

  // A2: cantidad negativa, en cero o con formato incorrecto
  static vercantidad(cantidad) {
    if (
      (typeof cantidad !== "number" && typeof cantidad !== "string") ||
      !/^\d+$/.test(String(cantidad).trim()) ||
      Number(cantidad) < 1
    ) {
      return "Ingrese una cantidad válida.";
    }
    return null;
  }
}

module.exports = GestionarCantidadControlador;