const dbService = require("../bd/Conexion");

class EliminarCarritoModelo {
  // Quitar un producto del carrito del cliente (RF14).
  // Devuelve:
  //   "NO_EN_CARRITO" el cliente no tiene ese producto en su carrito
  //   "OK"            producto eliminado (incluye el nuevo total del carrito)
  static async eliminarProducto(idCliente, idProducto) {
    try {
      return await dbService.transaccion(async (sql) => {
        // 1) Buscar el ítem SOLO dentro del carrito de ESTE cliente
        const filas = await sql(
          "SELECT i.idItem, i.idCarrito " +
            "FROM carrito_items i " +
            "JOIN carritos c ON c.idCarrito = i.idCarrito " +
            "WHERE c.idCliente = ? AND i.idProducto = ? FOR UPDATE",
          [idCliente, idProducto],
        );

        if (filas.length === 0) return { resultado: "NO_EN_CARRITO" };

        const item = filas[0];

        // 2) Eliminar el ítem
        await sql("DELETE FROM carrito_items WHERE idItem = ?", [item.idItem]);

        // 3) Recalcular el total del carrito
        await sql(
          "UPDATE carritos SET total = " +
            "(SELECT COALESCE(SUM(subtotal), 0) FROM carrito_items WHERE idCarrito = ?) " +
            "WHERE idCarrito = ?",
          [item.idCarrito, item.idCarrito],
        );

        // 4) Leer el total ya recalculado
        const [carrito] = await sql(
          "SELECT total FROM carritos WHERE idCarrito = ?",
          [item.idCarrito],
        );

        return { resultado: "OK", totalGeneral: Number(carrito.total) };
      });
    } catch (err) {
      throw new Error(`Error al eliminar el producto del carrito: ${err.message}`);
    }
  }
}

module.exports = EliminarCarritoModelo;
