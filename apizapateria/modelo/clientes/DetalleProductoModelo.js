const dbService = require("../bd/Conexion");

class DetalleProductoModelo {
  // Buscar la información completa de UN producto 'Activo' por su id.
  // Devuelve el producto, o null si no existe o fue eliminado (RF06).
  static async buscarPorId(idProducto) {
    const query =
      "SELECT idProducto AS id, nombre, marca, categoria, talla, precio, stock, imagen, descripcion " +
      "FROM productos WHERE idProducto = ? AND estado = 'Activo'";

    try {
      const result = await dbService.query(query, [idProducto]);
      return result.length ? result[0] : null;
    } catch (err) {
      throw new Error(`Error al consultar el producto: ${err.message}`);
    }
  }
}

module.exports = DetalleProductoModelo;