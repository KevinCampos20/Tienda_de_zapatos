/*
RF-06 eliminar producto (admin / trabajador) funcion eliminarProducto
*/
const modelo = require("../../modelo/admin/EliminarProductoAdminModelo");

class EliminarProductoAdminControlador {
  static async eliminarProducto(req, res) {
    const id = req.params.id;

    // ------------ validaciones ------------
    const error = EliminarProductoAdminControlador.verid(id);
    if (error) {
      return res.status(400).json({ error });
    }
    // ------------ fin validaciones ------------

    try {
      const result = await modelo.eliminarProducto(Number(id));

      // A2: el producto no existe (o ya había sido eliminado)
      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "El producto seleccionado no existe." });
      }

      return res
        .status(200)
        .json({ mensaje: "Producto eliminado correctamente." });
    } catch (err) {
      return res
        .status(500)
        .json({ error: "Error inesperado: " + err.message });
    }
  } // cerrar eliminarProducto

  //-------------------validaciones----------------------------

  static verid(id) {
    if (!/^\d+$/.test(String(id)) || Number(id) < 1) {
      return "El identificador del producto no es válido.";
    }
    return null;
  }
}

module.exports = EliminarProductoAdminControlador;