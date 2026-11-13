/*
RF-09 buscar productos (cliente) funcion buscarProductos
*/
const modelo = require("../../modelo/clientes/BuscarProductosModelo");

class BuscarProductosControlador {
  static async buscarProductos(req, res) {
    const { termino } = req.query;

    // ------------ validaciones ------------
    const error = BuscarProductosControlador.vertermino(termino);
    if (error) {
      return res.status(400).json({ error });
    }
    // ------------ fin validaciones ------------

    try {
      const filas = await modelo.buscarProductos(String(termino).trim());

      // A2: sin resultados
      if (filas.length === 0) {
        return res.status(200).json({
          mensaje: "No se encontraron productos para tu búsqueda.",
          productos: [],
        });
      }

      // MySQL entrega el precio como texto ("189900.00"); lo pasamos a número.
      const productos = filas.map((p) => ({ ...p, precio: Number(p.precio) }));

      return res.status(200).json(productos);
    } catch (err) {
      console.error("Error en RF09 buscar productos:", err.message);
      return res.status(500).json({
        error: "No fue posible realizar la búsqueda. Intente nuevamente.",
      });
    }
  } // cerrar buscarProductos

  //-------------------validaciones----------------------------

  static vertermino(termino) {
    // A1: campo de búsqueda vacío (o no enviado, o enviado varias veces)
    if (typeof termino !== "string" || termino.trim() === "") {
      return "Ingrese un término de búsqueda.";
    }
    if (termino.trim().length > 100) {
      return "El término de búsqueda no puede superar los 100 caracteres.";
    }
    return null;
  }
}

module.exports = BuscarProductosControlador;