/*
RF-14 eliminar del carrito (cliente) funcion eliminarProducto
DELETE /api/carrito/eliminar/:id?idCliente=1
El :id de la ruta es el id del PRODUCTO.
OJO: idCliente se recibe por query/body de forma TEMPORAL, mientras el equipo
no tenga login con token (JWT). Cuando exista, el idCliente saldrá del token.
*/
const modelo = require("../../modelo/clientes/EliminarCarritoModelo");

class EliminarCarritoControlador {
  static async eliminarProducto(req, res) {
    const idProducto = req.params.id;
    const idCliente = EliminarCarritoControlador.obtenerIdCliente(req);

    // ------------ validaciones ------------
    const validaciones = [
      EliminarCarritoControlador.verid(idCliente, "del cliente"),
      EliminarCarritoControlador.verid(idProducto, "del producto"),
    ];

    const error = validaciones.find((e) => e !== null);
    if (error) {
      return res.status(400).json({ error });
    }
    // ------------ fin validaciones ------------

    try {
      const r = await modelo.eliminarProducto(
        Number(idCliente),
        Number(idProducto),
      );

      // A1: el producto no está en el carrito del cliente
      if (r.resultado === "NO_EN_CARRITO") {
        return res
          .status(404)
          .json({ error: "El producto no se encuentra en el carrito." });
      }

      return res.status(200).json({
        mensaje: "Producto eliminado del carrito",
        totalGeneral: r.totalGeneral,
      });
    } catch (err) {
      console.error("Error en RF14 eliminar del carrito:", err.message);
      return res.status(500).json({
        error: "No fue posible eliminar el producto. Intente nuevamente.",
      });
    }
  } // cerrar eliminarProducto

  //-------------------utilidades----------------------------

  static obtenerIdCliente(req) {
    return req.query?.idCliente ?? req.body?.idCliente;
  }

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
}

module.exports = EliminarCarritoControlador;
