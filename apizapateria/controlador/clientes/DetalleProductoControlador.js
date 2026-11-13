/*
RF-08 ver detalle del producto (cliente) funcion verDetalle
*/
const modelo = require("../../modelo/clientes/DetalleProductoModelo");

class DetalleProductoControlador {
  static async verDetalle(req, res) {
    const id = req.params.id;

    // ------------ validaciones ------------
    const error = DetalleProductoControlador.verid(id);
    if (error) {
      return res.status(400).json({ error });
    }
    // ------------ fin validaciones ------------

    try {
      const producto = await modelo.buscarPorId(Number(id));

      // A1: el producto no existe o ya no está disponible
      if (!producto) {
        return res
          .status(404)
          .json({ error: "El producto seleccionado no está disponible." });
      }

      // MySQL entrega el precio como texto ("189900.00"); lo pasamos a número.
      const detalle = { ...producto, precio: Number(producto.precio) };

      // A2: producto agotado -> se muestra el detalle junto con el aviso
      if (detalle.stock === 0) {
        detalle.mensaje = "Producto agotado.";
      }

      return res.status(200).json(detalle);
    } catch (err) {
      console.error("Error en RF08 ver detalle:", err.message);
      return res.status(500).json({
        error: "No fue posible cargar el producto. Intente nuevamente.",
      });
    }
  } // cerrar verDetalle

  //-------------------validaciones----------------------------

  static verid(id) {
    if (!/^\d+$/.test(String(id)) || Number(id) < 1) {
      return "El identificador del producto no es válido.";
    }
    return null;
  }
}

module.exports = DetalleProductoControlador;