/*
RF-05 modificar producto (admin / trabajador) funcion modificarProducto
PUT /api/admin/productos/:id
*/
const modelo = require("../../modelo/admin/ModificarProductoAdminModelo");

const MSG_INVALIDO = "Complete todos los campos obligatorios con valores válidos.";
const MSG_NO_EXISTE = "El producto seleccionado no existe.";

class ModificarProductoAdminControlador {
  static async modificarProducto(req, res) {
    const { id } = req.params;
    const {
      t1: nombre,
      t2: descripcion,
      t3: categoria,
      t4: marca,
      t5: talla,
      t6: precio,
      t7: stock,
      t8: imagen, // opcional (URL)
    } = req.body;

    // ------------ validaciones (A1: datos incompletos o inválidos) ------------
    const validaciones = [
      ModificarProductoAdminControlador.verid(id),
      ModificarProductoAdminControlador.verCampos(nombre, descripcion, categoria, marca, talla, precio, stock),
      ModificarProductoAdminControlador.vernom(nombre),
      ModificarProductoAdminControlador.verdesc(descripcion),
      ModificarProductoAdminControlador.vertexto(categoria, "categoría"),
      ModificarProductoAdminControlador.vertexto(marca, "marca"),
      ModificarProductoAdminControlador.vertalla(talla),
      ModificarProductoAdminControlador.verprecio(precio),
      ModificarProductoAdminControlador.verstock(stock),
      ModificarProductoAdminControlador.verimagen(imagen),
    ];

    const detalle = validaciones.find((e) => e !== null);
    if (detalle) {
      return res.status(400).json({ error: MSG_INVALIDO, detalle });
    }
    // ------------ fin validaciones ------------

    try {
      // A2: producto no encontrado
      const existe = await modelo.buscarPorId(Number(id));
      if (!existe) {
        return res.status(404).json({ error: MSG_NO_EXISTE });
      }

      const result = await modelo.modificarProducto(
        Number(id),
        String(nombre).trim(),
        String(descripcion).trim(),
        String(categoria).trim(),
        String(marca).trim(),
        String(talla).trim(),
        Number(precio),
        Number(stock),
        imagen ? String(imagen).trim() : null,
      );

      // El producto pudo ser eliminado justo antes del UPDATE
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: MSG_NO_EXISTE });
      }

      return res.json({ mensaje: "Producto modificado correctamente." });
    } catch (err) {
      if (err.message.includes("Duplicate entry")) {
        return res.status(409).json({
          error: "Ya existe un producto con ese nombre, marca y talla.",
        });
      }
      return res
        .status(500)
        .json({ error: "Error inesperado: " + err.message });
    }
  } // cerrar modificarProducto

  //-------------------validaciones----------------------------

  static verid(id) {
    if (!/^[1-9][0-9]{0,9}$/.test(String(id))) {
      return "El identificador del producto no es válido.";
    }
    return null;
  }

  static verCampos(nombre, descripcion, categoria, marca, talla, precio, stock) {
    const vacio = (v) => v === undefined || v === null || String(v).trim() === "";
    if (
      vacio(nombre) ||
      vacio(descripcion) ||
      vacio(categoria) ||
      vacio(marca) ||
      vacio(talla) ||
      vacio(precio) ||
      vacio(stock)
    ) {
      return "Todos los campos son obligatorios (la imagen es opcional).";
    }
    return null;
  }

  static vernom(nombre) {
    if (!/^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s.,\-]{3,100}$/.test(String(nombre).trim())) {
      return "Nombre inválido. Mínimo 3 y máximo 100 caracteres (letras, números, espacios, . , -).";
    }
    return null;
  }

  static verdesc(descripcion) {
    const len = String(descripcion).trim().length;
    if (len < 5 || len > 500) {
      return "La descripción debe tener entre 5 y 500 caracteres.";
    }
    return null;
  }

  static vertexto(valor, campo) {
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50}$/.test(String(valor).trim())) {
      return `La ${campo} debe tener entre 2 y 50 letras.`;
    }
    return null;
  }

  static vertalla(talla) {
    if (!/^[A-Za-z0-9.\-\/]{1,10}$/.test(String(talla).trim())) {
      return "La talla debe tener entre 1 y 10 caracteres (letras, números, . - /).";
    }
    return null;
  }

  static verprecio(precio) {
    const p = Number(precio);
    if (!Number.isFinite(p) || p <= 0 || p > 99999999) {
      return "El precio debe ser un número mayor a 0.";
    }
    return null;
  }

  static verstock(stock) {
    const s = Number(stock);
    if (!Number.isInteger(s) || s < 0 || s > 100000) {
      return "El stock debe ser un número entero mayor o igual a 0.";
    }
    return null;
  }

  static verimagen(imagen) {
    if (imagen === undefined || imagen === null || String(imagen).trim() === "") {
      return null; // es opcional
    }
    const valor = String(imagen).trim();
    const esUrl = /^https?:\/\/[^\s]{3,500}$/.test(valor);
    const esRutaLocal =
      !valor.includes("..") &&
      /^(?:\.{0,2}\/)?[\w\-./]+\.(?:jpe?g|png|webp|avif|gif)$/i.test(valor);
    if (!esUrl && !esRutaLocal) {
      return "La imagen debe ser una URL http(s) o una ruta local válida.";
    }
    return null;
  }
}

module.exports = ModificarProductoAdminControlador;
