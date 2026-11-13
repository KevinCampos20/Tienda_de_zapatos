const dbService = require("../bd/Conexion");

class MisPedidosModelo {
  // Listar los pedidos del cliente, del más reciente al más antiguo (RF17).
  static async listarPedidos(idCliente) {
    const query =
      "SELECT idPedido, estado, fecha AS fechaCreacion, total " +
      "FROM pedidos WHERE idCliente = ? ORDER BY fecha DESC";

    try {
      return await dbService.query(query, [idCliente]);
    } catch (err) {
      throw new Error(`Error al listar los pedidos: ${err.message}`);
    }
  }
}

module.exports = MisPedidosModelo;
