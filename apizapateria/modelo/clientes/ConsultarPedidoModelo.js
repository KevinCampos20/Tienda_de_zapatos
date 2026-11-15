const dbService = require("../bd/Conexion");

class ConsultarPedidoModelo {
  // Buscar un pedido con su detalle de productos (RF16).
  // Devuelve { pedido, productos } o null si el pedido no existe.
  static async buscarPedido(idPedido) {
    try {
      const pedidos = await dbService.query(
        "SELECT idPedido, idCliente, estado, fecha AS fechaCreacion, total, " +
          "direccionEnvio, metodoPago " +
          "FROM pedidos WHERE idPedido = ?",
        [idPedido],
      );

      if (pedidos.length === 0) return null;

      const productos = await dbService.query(
        "SELECT d.idProducto AS id, p.nombre, d.cantidad, d.precioUnitario, d.subtotal " +
          "FROM detalle_pedidos d " +
          "JOIN productos p ON p.idProducto = d.idProducto " +
          "WHERE d.idPedido = ? ORDER BY d.idDetalle ASC",
        [idPedido],
      );

      return { pedido: pedidos[0], productos };
    } catch (err) {
      throw new Error(`Error al consultar el pedido: ${err.message}`);
    }
  }
}

module.exports = ConsultarPedidoModelo;
