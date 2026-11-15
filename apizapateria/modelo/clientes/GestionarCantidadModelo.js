const dbService = require("../bd/Conexion");

class GestionarCantidadModelo {
  // Cambiar la cantidad de un producto que YA está en el carrito del cliente.
  // Todo se hace en una transacción: o se guardan todos los cambios o ninguno.
  // No toca el inventario real (productos.stock): ese solo se descuenta al
  // confirmar el pedido (RF13).
  //
  // Devuelve un objeto con el campo "resultado":
  //   "NO_EN_CARRITO"  el cliente no tiene ese producto en su carrito
  //   "NO_DISPONIBLE"  el producto fue eliminado del catálogo (RF06)
  //   "SUPERA_STOCK"   la cantidad pedida es mayor al stock disponible
  //   "OK"             cantidad actualizada (incluye el subtotal nuevo)
  static async actualizarCantidad(idCliente, idProducto, cantidad) {
    try {
      return await dbService.transaccion(async (sql) => {
        // 1) Buscar el ítem SOLO dentro del carrito de ESTE cliente
        const filas = await sql(
          "SELECT i.idItem, i.idCarrito, p.stock, p.estado " +
            "FROM carrito_items i " +
            "JOIN carritos c ON c.idCarrito = i.idCarrito " +
            "JOIN productos p ON p.idProducto = i.idProducto " +
            "WHERE c.idCliente = ? AND i.idProducto = ?",
          [idCliente, idProducto],
        );

        if (filas.length === 0) return { resultado: "NO_EN_CARRITO" };

        const item = filas[0];

        if (item.estado !== "Activo") return { resultado: "NO_DISPONIBLE" };
        if (cantidad > item.stock) return { resultado: "SUPERA_STOCK" };

        // 2) Guardar la nueva cantidad (el subtotal lo recalcula la BD solo)
        await sql("UPDATE carrito_items SET cantidad = ? WHERE idItem = ?", [
          cantidad,
          item.idItem,
        ]);

        // 3) Recalcular el total del carrito
        await sql(
          "UPDATE carritos SET total = " +
            "(SELECT COALESCE(SUM(subtotal), 0) FROM carrito_items WHERE idCarrito = ?) " +
            "WHERE idCarrito = ?",
          [item.idCarrito, item.idCarrito],
        );

        // 4) Leer el subtotal ya recalculado
        const [nuevo] = await sql(
          "SELECT subtotal FROM carrito_items WHERE idItem = ?",
          [item.idItem],
        );

        return { resultado: "OK", subtotal: Number(nuevo.subtotal) };
      });
    } catch (err) {
      throw new Error(`Error al actualizar la cantidad: ${err.message}`);
    }
  }
}

module.exports = GestionarCantidadModelo;