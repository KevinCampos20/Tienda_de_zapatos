const dbService = require("../bd/Conexion");

class EliminarProductoAdminModelo {
  // Eliminar (borrado lógico) un producto: pasa a estado 'Inactivo'.
  // Solo afecta a productos que estén 'Activo'. Si el producto no existe o
  // ya estaba eliminado, affectedRows será 0.
  static async eliminarProducto(idProducto) {
    const query =
      "UPDATE productos SET estado = 'Inactivo' WHERE idProducto = ? AND estado = 'Activo'";

    try {
      return await dbService.query(query, [idProducto]);
    } catch (err) {
      throw new Error(`Error al eliminar el producto: ${err.message}`);
    }
  }
}

module.exports = EliminarProductoAdminModelo;