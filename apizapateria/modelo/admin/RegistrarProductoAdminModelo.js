const dbService = require("../bd/Conexion");

class RegistrarProductoAdminModelo {
  // Insertar un nuevo producto
  static async registrarProducto(nombre, descripcion, categoria, marca, talla, precio, stock, imagen) {
    const query =
      "INSERT INTO productos (nombre, descripcion, categoria, marca, talla, precio, stock, imagen, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Activo')";

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
      ]);
    } catch (err) {
      throw new Error(`Error al registrar el producto: ${err.message}`);
    }
  }
}

module.exports = RegistrarProductoAdminModelo;
