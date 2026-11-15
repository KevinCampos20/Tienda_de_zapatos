const dbService = require("../bd/Conexion");

class AgregarCarritoModelo {
  // Agregar un producto al carrito del cliente (RF13).
  // Si el producto ya estaba en el carrito se SUMA la cantidad.
  // Devuelve un objeto con el campo "resultado":
  //   "CLIENTE_NO_EXISTE" el cliente no existe o está inactivo
  //   "NO_DISPONIBLE"     el producto no existe o fue eliminado (RF06)
  //   "SIN_STOCK"         el producto está agotado
  //   "SUPERA_STOCK"      la cantidad total supera el inventario disponible
  //   "OK"                producto agregado / cantidad actualizada
  static async agregarProducto(idCliente, idProducto, cantidad) {
    try {
      return await dbService.transaccion(async (sql) => {
        // 1) Validar que el cliente exista y esté activo
        const clientes = await sql(
          "SELECT idCliente FROM clientes WHERE idCliente = ? AND estado = 'Activo'",
          [idCliente],
        );
        if (clientes.length === 0) return { resultado: "CLIENTE_NO_EXISTE" };

        // 2) Validar el producto y bloquearlo mientras dura la transacción
        const productos = await sql(
          "SELECT idProducto, nombre, precio, stock, estado " +
            "FROM productos WHERE idProducto = ? FOR UPDATE",
          [idProducto],
        );

        if (productos.length === 0 || productos[0].estado !== "Activo") {
          return { resultado: "NO_DISPONIBLE" };
        }

        const producto = productos[0];

        if (producto.stock === 0) {
          return { resultado: "SIN_STOCK" };
        }

        // 3) Obtener el carrito del cliente; si no tiene, se crea
        const carritos = await sql(
          "SELECT idCarrito FROM carritos WHERE idCliente = ? FOR UPDATE",
          [idCliente],
        );

        let idCarrito;
        if (carritos.length === 0) {
          const nuevo = await sql(
            "INSERT INTO carritos (idCliente, total) VALUES (?, 0)",
            [idCliente],
          );
          idCarrito = nuevo.insertId;
        } else {
          idCarrito = carritos[0].idCarrito;
        }

        // 4) Si el producto ya está en el carrito, se acumula la cantidad
        const items = await sql(
          "SELECT idItem, cantidad FROM carrito_items " +
            "WHERE idCarrito = ? AND idProducto = ? FOR UPDATE",
          [idCarrito, idProducto],
        );

        let cantidadFinal = cantidad;

        if (items.length > 0) {
          cantidadFinal = items[0].cantidad + cantidad;

          if (cantidadFinal > producto.stock) {
            return { resultado: "SUPERA_STOCK", stock: producto.stock };
          }

          await sql("UPDATE carrito_items SET cantidad = ? WHERE idItem = ?", [
            cantidadFinal,
            items[0].idItem,
          ]);
        } else {
          if (cantidad > producto.stock) {
            return { resultado: "SUPERA_STOCK", stock: producto.stock };
          }

          await sql(
            "INSERT INTO carrito_items (idCarrito, idProducto, cantidad, precioUnitario) " +
              "VALUES (?, ?, ?, ?)",
            [idCarrito, idProducto, cantidadFinal, producto.precio],
          );
        }

        // 5) Recalcular el total del carrito
        await sql(
          "UPDATE carritos SET total = " +
            "(SELECT COALESCE(SUM(subtotal), 0) FROM carrito_items WHERE idCarrito = ?) " +
            "WHERE idCarrito = ?",
          [idCarrito, idCarrito],
        );

        return { resultado: "OK", idCarrito, cantidad: cantidadFinal };
      });
    } catch (err) {
      throw new Error(`Error al agregar el producto al carrito: ${err.message}`);
    }
  }
}

module.exports = AgregarCarritoModelo;
