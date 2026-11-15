const dbService = require("../bd/Conexion");

class FiltrarProductosModelo {
  // Filtrar productos 'Activo' por uno o varios criterios a la vez.
  // Solo se agregan al WHERE los filtros que el cliente envió; todos los
  // enviados deben cumplirse al mismo tiempo (AND). Sin filtros devuelve
  // todo el catálogo activo (equivale a "quitar los filtros", alternativa A2).
  static async filtrarProductos({ categoria, talla, marca, precioMin, precioMax }) {
    const condiciones = ["estado = 'Activo'"];
    const params = [];

    if (categoria !== undefined) {
      condiciones.push("categoria = ?");
      params.push(categoria);
    }
    if (talla !== undefined) {
      condiciones.push("talla = ?");
      params.push(talla);
    }
    if (marca !== undefined) {
      condiciones.push("marca = ?");
      params.push(marca);
    }
    if (precioMin !== undefined) {
      condiciones.push("precio >= ?");
      params.push(precioMin);
    }
    if (precioMax !== undefined) {
      condiciones.push("precio <= ?");
      params.push(precioMax);
    }

    const query =
      "SELECT idProducto AS id, nombre, marca, categoria, talla, precio, imagen " +
      `FROM productos WHERE ${condiciones.join(" AND ")} ` +
      "ORDER BY nombre ASC, talla ASC";

    try {
      return await dbService.query(query, params);
    } catch (err) {
      throw new Error(`Error al filtrar los productos: ${err.message}`);
    }
  }
}

module.exports = FiltrarProductosModelo;