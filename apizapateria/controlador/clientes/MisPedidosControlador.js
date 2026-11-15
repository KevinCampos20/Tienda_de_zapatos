/*
RF-17 mis pedidos (cliente) funcion misPedidos
GET /api/pedidos/mis-pedidos?idCliente=1
OJO: idCliente se recibe por query/body de forma TEMPORAL, mientras el equipo
no tenga login con token (JWT). Cuando exista, el idCliente saldrá del token.
*/
const modelo = require("../../modelo/clientes/MisPedidosModelo");

class MisPedidosControlador {
  static async misPedidos(req, res) {
    const idCliente = MisPedidosControlador.obtenerIdCliente(req);

    // ------------ validaciones ------------
    const error = MisPedidosControlador.verid(idCliente, "del cliente");
    if (error) {
      return res.status(400).json({ error });
    }
    // ------------ fin validaciones ------------

    try {
      const filas = await modelo.listarPedidos(Number(idCliente));

      // A1: el cliente todavía no tiene pedidos
      if (filas.length === 0) {
        return res.status(200).json({
          mensaje: "Aún no tienes pedidos registrados.",
          pedidos: [],
        });
      }

      // MySQL entrega el total como texto; lo pasamos a número.
      const pedidos = filas.map((p) => ({
        idPedido: p.idPedido,
        estado: p.estado,
        fechaCreacion: p.fechaCreacion,
        total: Number(p.total),
      }));

      return res.status(200).json(pedidos);
    } catch (err) {
      console.error("Error en RF17 mis pedidos:", err.message);
      return res.status(500).json({
        error: "No fue posible cargar tus pedidos. Intente nuevamente.",
      });
    }
  } // cerrar misPedidos

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

module.exports = MisPedidosControlador;
