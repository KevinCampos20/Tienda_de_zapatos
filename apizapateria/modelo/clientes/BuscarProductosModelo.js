const dbService = require("../bd/Conexion");

class BuscarProductosModelo {
  // Buscar productos 'Activo' cuyo nombre o marca contengan el término.
  // La base de datos ignora mayúsculas y tildes (collation utf8mb4_unicode_ci).
  static async buscarProductos(termino) {
    // Los símbolos % y _ son comodines en LIKE; se "escapan" para que se
    // busquen como texto normal y no como comodines.
    const seguro = String(termino).replace(/[\\%_]/g, "\\$&");
    const patron = `%${seguro}%`;

    const query =
      "SELECT idProducto AS id, nombre, marca, categoria, talla, precio, imagen " +
      "FROM productos " +
      "WHERE estado = 'Activo' AND (nombre LIKE ? OR marca LIKE ?) " +
      "ORDER BY nombre ASC, talla ASC";

    try {
      return await dbService.query(query, [patron, patron]);
    } catch (err) {
      throw new Error(`Error al buscar los productos: ${err.message}`);
    }
  }
}

module.exports = BuscarProductosModelo;