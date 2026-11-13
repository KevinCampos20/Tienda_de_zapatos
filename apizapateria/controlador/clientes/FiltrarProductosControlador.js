/*
RF-10 filtrar productos (cliente) funcion filtrarProductos
Filtros opcionales por query: categoria, talla, marca, precioMin, precioMax
*/
const modelo = require("../../modelo/clientes/FiltrarProductosModelo");

class FiltrarProductosControlador {
  static async filtrarProductos(req, res) {
    const { categoria, talla, marca, precioMin, precioMax } = req.query;

    // ------------ validaciones ------------
    // Un filtro vacío ("") se considera NO enviado (así el frontend puede
    // mandar un <select> sin elegir sin que cuente como filtro).
    const validaciones = [
      FiltrarProductosControlador.vertexto(categoria, "categoría", 50),
      FiltrarProductosControlador.vertexto(talla, "talla", 10),
      FiltrarProductosControlador.vertexto(marca, "marca", 50),
      FiltrarProductosControlador.verprecio(precioMin, "mínimo"),
      FiltrarProductosControlador.verprecio(precioMax, "máximo"),
      FiltrarProductosControlador.verrango(precioMin, precioMax),
    ];

    const error = validaciones.find((e) => e !== null);
    if (error) {
      return res.status(400).json({ error });
    }
    // ------------ fin validaciones ------------

    try {
      const filas = await modelo.filtrarProductos({
        categoria: FiltrarProductosControlador.limpiar(categoria),
        talla: FiltrarProductosControlador.limpiar(talla),
        marca: FiltrarProductosControlador.limpiar(marca),
        precioMin: FiltrarProductosControlador.limpiarNumero(precioMin),
        precioMax: FiltrarProductosControlador.limpiarNumero(precioMax),
      });

      // A1: ningún producto cumple los filtros
      if (filas.length === 0) {
        return res.status(200).json({
          mensaje: "No hay productos que cumplan con los filtros seleccionados.",
          productos: [],
        });
      }

      // MySQL entrega el precio como texto ("189900.00"); lo pasamos a número.
      const productos = filas.map((p) => ({ ...p, precio: Number(p.precio) }));

      return res.status(200).json(productos);
    } catch (err) {
      console.error("Error en RF10 filtrar productos:", err.message);
      return res.status(500).json({
        error: "No fue posible filtrar los productos. Intente nuevamente.",
      });
    }
  } // cerrar filtrarProductos

  //-------------------utilidades----------------------------

  // "" o undefined -> undefined (filtro no enviado); texto -> texto sin espacios
  static limpiar(valor) {
    if (valor === undefined || String(valor).trim() === "") return undefined;
    return String(valor).trim();
  }

  static limpiarNumero(valor) {
    const limpio = FiltrarProductosControlador.limpiar(valor);
    return limpio === undefined ? undefined : Number(limpio);
  }

  //-------------------validaciones----------------------------

  static vertexto(valor, campo, maximo) {
    if (valor === undefined || valor === "") return null; // no enviado
    if (typeof valor !== "string" || valor.trim().length > maximo) {
      return `La ${campo} no es válida (debe ser un solo texto de máximo ${maximo} caracteres).`;
    }
    return null;
  }

  static verprecio(valor, tipo) {
    if (valor === undefined || valor === "") return null; // no enviado
    if (
      typeof valor !== "string" ||
      !/^\d+(\.\d+)?$/.test(valor.trim()) ||
      Number(valor) > 99999999
    ) {
      return `El precio ${tipo} debe ser un número mayor o igual a 0.`;
    }
    return null;
  }

  static verrango(precioMin, precioMax) {
    const min = FiltrarProductosControlador.limpiarNumero(precioMin);
    const max = FiltrarProductosControlador.limpiarNumero(precioMax);
    if (min !== undefined && max !== undefined && min > max) {
      return "El precio mínimo no puede ser mayor que el precio máximo.";
    }
    return null;
  }
}

module.exports = FiltrarProductosControlador;