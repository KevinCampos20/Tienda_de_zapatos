const dbService = require("../bd/Conexion");

class ModificarProductoAdminModelo {
  // Busca un producto que siga en el catálogo (RF06 usa borrado lógico:
  // un producto 'Inactivo' se considera inexistente).
  static async buscarPorId(id) {
    const query =
      "SELECT idProducto FROM productos WHERE idProducto = ? AND estado = 'Activo'";

    try {
      const result = await dbService.query(query, [id]);
      return result.length ? result[0] : null;
    } catch (err) {
      throw new Error(`Error al buscar el producto: ${err.message}`);
    }
  }

  // Actualiza los datos del producto. No toca la columna 'estado'.
  static async modificarProducto(
    id,
    nombre,
    descripcion,
    categoria,
    marca,
    talla,
    precio,
    stock,
    imagen,
  ) {
    const query = `UPDATE productos
         SET nombre = ?, descripcion = ?, categoria = ?, marca = ?,
             talla = ?, precio = ?, stock = ?, imagen = ?
       WHERE idProducto = ? AND estado = 'Activo'`;

    try {
      return await dbService.query(query, [
        nombre,
        descripcion,
        categoria,
        marca,
        talla,
        precio,
        stock,
        imagen || null,
        id,
      ]);
    } catch (err) {
      throw new Error(`Error al modificar el producto: ${err.message}`);
    }
  }
}

module.exports = ModificarProductoAdminModelo;
