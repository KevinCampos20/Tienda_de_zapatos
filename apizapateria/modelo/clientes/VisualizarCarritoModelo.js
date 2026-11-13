const dbService = require("../bd/Conexion");

class VisualizarCarritoModelo {
  // Productos que el cliente tiene en su carrito (RF12).
  // Solo se muestran productos 'Activo': los eliminados con el RF06 no se
  // ofrecen para comprar, aunque sigan guardados en el carrito.
  static async obtenerCarrito(idCliente) {
    const query =
      "SELECT i.idProducto AS id, p.nombre, i.cantidad, i.precioUnitario, i.subtotal " +
      "FROM carritos c " +
      "JOIN carrito_items i ON i.idCarrito = c.idCarrito " +
      "JOIN productos p ON p.idProducto = i.idProducto " +
      "WHERE c.idCliente = ? AND p.estado = 'Activo' " +
      "ORDER BY i.fechaAgregado ASC";

    try {
      return await dbService.query(query, [idCliente]);
    } catch (err) {
      throw new Error(`Error al consultar el carrito: ${err.message}`);
    }
  }
}

module.exports = VisualizarCarritoModelo;
