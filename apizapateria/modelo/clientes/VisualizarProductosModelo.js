const dbService = require("../bd/Conexion");

class VisualizarProductosModelo {
  // Listar el catálogo visible al cliente: solo productos 'Activo'
  // (los eliminados con el RF06 quedan 'Inactivo' y no aparecen).
  static async listarProductos() {
    const query =
      "SELECT idProducto AS id, nombre, descripcion, marca, categoria, talla, precio, stock, imagen " +
      "FROM productos WHERE estado = 'Activo' ORDER BY nombre ASC, talla ASC";

    try {
      return await dbService.query(query);
    } catch (err) {
      throw new Error(`Error al listar los productos: ${err.message}`);
    }
  }
}

module.exports = VisualizarProductosModelo;