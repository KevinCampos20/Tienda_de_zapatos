/*
RF-12 carrito de compras (cliente) funcion verCarrito
GET /api/carrito?idCliente=1
OJO: idCliente se recibe por query/body de forma TEMPORAL, mientras el equipo
no tenga login con token (JWT). Cuando exista, el idCliente saldrá del token.
*/
const modelo = require("../../modelo/clientes/VisualizarCarritoModelo");

class VisualizarCarritoControlador {
  static async verCarrito(req, res) {
    const idCliente = VisualizarCarritoControlador.obtenerIdCliente(req);

    // ------------ validaciones ------------
    const error = VisualizarCarritoControlador.verid(idCliente, "del cliente");
    if (error) {
      return res.status(400).json({ error });
    }
    // ------------ fin validaciones ------------

    try {
      const filas = await modelo.obtenerCarrito(Number(idCliente));

      // MySQL entrega los DECIMAL como texto; los pasamos a número.
      const productos = filas.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        cantidad: p.cantidad,
        precioUnitario: Number(p.precioUnitario),
        subtotal: Number(p.subtotal),
      }));

      // A1: carrito vacío
      if (productos.length === 0) {
        return res.status(200).json({
          mensaje: "Tu carrito está vacío.",
          productos: [],
          totalGeneral: 0,
        });
      }

      const totalGeneral = Number(
        productos.reduce((acumulado, p) => acumulado + p.subtotal, 0).toFixed(2),
      );

      return res.status(200).json({ productos, totalGeneral });
    } catch (err) {
      console.error("Error en RF12 carrito de compras:", err.message);
      return res.status(500).json({
        error: "No fue posible cargar el carrito. Intente nuevamente.",
      });
    }
  } // cerrar verCarrito

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

module.exports = VisualizarCarritoControlador;
