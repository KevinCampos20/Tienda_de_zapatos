/*
RF-13 agregar al carrito (cliente) funcion agregarProducto
POST /api/carrito/agregar
Body (JSON): { "idCliente": 1, "idProducto": 1, "cantidad": 2 }
OJO: idCliente se recibe en el body de forma TEMPORAL, mientras el equipo no
tenga login con token (JWT). Cuando exista, el idCliente saldrá del token.
*/
const modelo = require("../../modelo/clientes/AgregarCarritoModelo");

class AgregarCarritoControlador {
  static async agregarProducto(req, res) {
    const { idCliente, idProducto, cantidad } = req.body ?? {};

    // ------------ validaciones ------------
    const validaciones = [
      AgregarCarritoControlador.verid(idCliente, "del cliente"),
      AgregarCarritoControlador.verid(idProducto, "del producto"),
      AgregarCarritoControlador.vercantidad(cantidad),
    ];

    const error = validaciones.find((e) => e !== null);
    if (error) {
      return res.status(400).json({ error });
    }
    // ------------ fin validaciones ------------

    try {
      const r = await modelo.agregarProducto(
        Number(idCliente),
        Number(idProducto),
        Number(cantidad),
      );

      if (r.resultado === "CLIENTE_NO_EXISTE") {
        return res
          .status(404)
          .json({ error: "El cliente no existe o está inactivo." });
      }

      if (r.resultado === "NO_DISPONIBLE") {
        return res
          .status(404)
          .json({ error: "El producto seleccionado no está disponible." });
      }

      // A1: producto agotado
      if (r.resultado === "SIN_STOCK") {
        return res.status(409).json({ error: "Producto agotado." });
      }

      // A2: la cantidad pedida supera el inventario (no se aplica el cambio)
      if (r.resultado === "SUPERA_STOCK") {
        return res.status(400).json({
          error: `La cantidad solicitada supera el inventario disponible (stock: ${r.stock}).`,
        });
      }

      return res.status(200).json({
        mensaje: "Producto agregado al carrito",
        idCarrito: r.idCarrito,
        cantidad: r.cantidad,
      });
    } catch (err) {
      console.error("Error en RF13 agregar al carrito:", err.message);
      return res.status(500).json({
        error: "No fue posible agregar el producto al carrito. Intente nuevamente.",
      });
    }
  } // cerrar agregarProducto

  //-------------------validaciones----------------------------

  static verid(valor, de) {
    if (
      (typeof valor !== "number" && typeof valor !== "string") ||
      !/^\d+$/.test(String(valor).trim()) ||
      Number(valor) < 1
    ) {
      return `El identificador ${de} no es válido.`;
    }
    return null;
  }

  // A3: cantidad negativa, en cero o con formato incorrecto
  static vercantidad(cantidad) {
    if (
      (typeof cantidad !== "number" && typeof cantidad !== "string") ||
      !/^\d+$/.test(String(cantidad).trim()) ||
      Number(cantidad) < 1
    ) {
      return "Ingrese una cantidad válida.";
    }
    return null;
  }
}

module.exports = AgregarCarritoControlador;
