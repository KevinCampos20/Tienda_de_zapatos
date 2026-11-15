/*
RF-07 visualizar productos (cliente) funcion visualizarProductos
*/
const modelo = require("../../modelo/clientes/VisualizarProductosModelo");

class VisualizarProductosControlador {
  static async visualizarProductos(req, res) {
    try {
      const filas = await modelo.listarProductos();

      // A1: catálogo vacío
      if (filas.length === 0) {
        return res.status(200).json({
          mensaje: "No hay productos disponibles en este momento.",
          productos: [],
        });
      }

      // MySQL entrega el precio como texto ("189900.00"); lo pasamos a número.
      const productos = filas.map((p) => ({ ...p, precio: Number(p.precio) }));

      return res.status(200).json(productos);
    } catch (err) {
      // A2: error al cargar el catálogo
      console.error("Error en RF07 visualizar productos:", err.message);
      return res.status(500).json({
        error: "No fue posible cargar los productos. Intente nuevamente.",
      });
    }
  } // cerrar visualizarProductos
}

module.exports = VisualizarProductosControlador;