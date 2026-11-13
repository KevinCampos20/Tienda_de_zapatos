/*
RF-16 consultar estado del pedido (cliente) funcion consultarPedido
GET /api/pedidos/:id
Opcional: ?idCliente=1 para comprobar que el pedido es del cliente.
OJO: idCliente se recibe por query/body de forma TEMPORAL, mientras el equipo
no tenga login con token (JWT). Cuando exista, el idCliente saldrá del token.
*/
const modelo = require("../../modelo/clientes/ConsultarPedidoModelo");

class ConsultarPedidoControlador {
  static async consultarPedido(req, res) {
    const idPedido = req.params.id;
    const idCliente = ConsultarPedidoControlador.obtenerIdCliente(req);

    // ------------ validaciones ------------
    const validaciones = [
      ConsultarPedidoControlador.verid(idPedido, "del pedido"),
      // El idCliente es opcional en este RF, pero si viene debe ser válido.
      idCliente === undefined
        ? null
        : ConsultarPedidoControlador.verid(idCliente, "del cliente"),
    ];

    const error = validaciones.find((e) => e !== null);
    if (error) {
      return res.status(400).json({ error });
    }
    // ------------ fin validaciones ------------

    try {
      const r = await modelo.buscarPedido(Number(idPedido));

      // A1: el pedido no existe
      if (!r) {
        return res.status(404).json({ error: "El pedido no existe." });
      }

      // A2: el pedido pertenece a otro cliente
      if (idCliente !== undefined && Number(idCliente) !== r.pedido.idCliente) {
        return res.status(403).json({
          error: "No tienes permisos para consultar este pedido.",
        });
      }

      const productos = r.productos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        cantidad: p.cantidad,
        precioUnitario: Number(p.precioUnitario),
        subtotal: Number(p.subtotal),
      }));

      return res.status(200).json({
        idPedido: r.pedido.idPedido,
        estado: r.pedido.estado,
        fechaCreacion: r.pedido.fechaCreacion,
        productos,
        total: Number(r.pedido.total),
        direccionEnvio: r.pedido.direccionEnvio,
        metodoPago: r.pedido.metodoPago,
      });
    } catch (err) {
      console.error("Error en RF16 consultar pedido:", err.message);
      return res.status(500).json({
        error: "No fue posible consultar el pedido. Intente nuevamente.",
      });
    }
  } // cerrar consultarPedido

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

module.exports = ConsultarPedidoControlador;
