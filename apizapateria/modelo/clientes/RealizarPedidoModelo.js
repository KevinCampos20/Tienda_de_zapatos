const dbService = require("../bd/Conexion");

// Estado con el que nace el pedido: el cliente lo confirma desde el checkout.
const ESTADO_INICIAL = "confirmado";

class RealizarPedidoModelo {
  // Confirmar el carrito y registrarlo como pedido (RF15).
  // Todo se hace en una transacción: si algo falla (stock, producto eliminado)
  // no se crea el pedido ni se descuenta inventario.
  // Devuelve:
  //   "CLIENTE_NO_EXISTE"      el cliente no existe o está inactivo
  //   "CARRITO_VACIO"          no hay productos para pedir
  //   "PRODUCTO_NO_DISPONIBLE" algún producto fue eliminado del catálogo (RF06)
  //   "STOCK_INSUFICIENTE"     la cantidad pedida supera el inventario
  //   "OK"                     pedido creado (idPedido y total)
  static async registrarPedido(idCliente, direccionEnvio, metodoPago) {
    try {
      return await dbService.transaccion(async (sql) => {
        // 1) Validar el cliente
        const clientes = await sql(
          "SELECT idCliente FROM clientes WHERE idCliente = ? AND estado = 'Activo'",
          [idCliente],
        );
        if (clientes.length === 0) return { resultado: "CLIENTE_NO_EXISTE" };

        // 2) Traer los ítems del carrito y bloquear producto/carrito
        const items = await sql(
          "SELECT i.idProducto, i.cantidad, i.precioUnitario, p.nombre, p.stock, p.estado " +
            "FROM carritos c " +
            "JOIN carrito_items i ON i.idCarrito = c.idCarrito " +
            "JOIN productos p ON p.idProducto = i.idProducto " +
            "WHERE c.idCliente = ? FOR UPDATE",
          [idCliente],
        );

        if (items.length === 0) return { resultado: "CARRITO_VACIO" };

        // 3) Validar TODO antes de escribir nada
        for (const item of items) {
          if (item.estado !== "Activo") {
            return { resultado: "PRODUCTO_NO_DISPONIBLE", nombre: item.nombre };
          }
          if (item.cantidad > item.stock) {
            return {
              resultado: "STOCK_INSUFICIENTE",
              nombre: item.nombre,
              stock: item.stock,
            };
          }
        }

        // 4) Total del pedido (con el precio guardado al agregar al carrito)
        const total = Number(
          items
            .reduce((acumulado, item) => {
              return acumulado + item.cantidad * Number(item.precioUnitario);
            }, 0)
            .toFixed(2),
        );

        // 5) Crear el pedido
        const pedido = await sql(
          "INSERT INTO pedidos (idCliente, estado, total, direccionEnvio, metodoPago) " +
            "VALUES (?, ?, ?, ?, ?)",
          [idCliente, ESTADO_INICIAL, total, direccionEnvio, metodoPago],
        );
        const idPedido = pedido.insertId;

        // 6) Guardar el detalle y descontar inventario
        for (const item of items) {
          await sql(
            "INSERT INTO detalle_pedidos (idPedido, idProducto, cantidad, precioUnitario) " +
              "VALUES (?, ?, ?, ?)",
            [idPedido, item.idProducto, item.cantidad, item.precioUnitario],
          );

          const descuento = await sql(
            "UPDATE productos SET stock = stock - ? WHERE idProducto = ? AND stock >= ?",
            [item.cantidad, item.idProducto, item.cantidad],
          );

          if (descuento.affectedRows !== 1) {
            throw new Error(
              `No se pudo descontar el inventario del producto ${item.nombre}.`,
            );
          }
        }

        // 7) Vaciar el carrito
        await sql(
          "DELETE FROM carrito_items WHERE idCarrito = " +
            "(SELECT idCarrito FROM carritos WHERE idCliente = ?)",
          [idCliente],
        );
        await sql("UPDATE carritos SET total = 0 WHERE idCliente = ?", [idCliente]);

        return { resultado: "OK", idPedido, total };
      });
    } catch (err) {
      throw new Error(`Error al registrar el pedido: ${err.message}`);
    }
  }
}

module.exports = RealizarPedidoModelo;
