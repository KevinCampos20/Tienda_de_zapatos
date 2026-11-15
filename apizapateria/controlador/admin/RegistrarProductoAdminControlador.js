/*
RF-04 registrar producto (admin) funcion registrarProducto
*/
const modelo = require("../../modelo/admin/RegistrarProductoAdminModelo");

class RegistrarProductoAdminControlador {
  static async registrarProducto(req, res) {
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

    // ------------ validaciones ------------
    const validaciones = [
      RegistrarProductoAdminControlador.verCampos(nombre, descripcion, categoria, marca, talla, precio, stock),
      RegistrarProductoAdminControlador.vernom(nombre),
      RegistrarProductoAdminControlador.verdesc(descripcion),
      RegistrarProductoAdminControlador.vertexto(categoria, "categoría"),
      RegistrarProductoAdminControlador.vertexto(marca, "marca"),
      RegistrarProductoAdminControlador.vertalla(talla),
      RegistrarProductoAdminControlador.verprecio(precio),
      RegistrarProductoAdminControlador.verstock(stock),
      RegistrarProductoAdminControlador.verimagen(imagen),
    ];

    const error = validaciones.find((e) => e !== null);
    if (error) {
      return res.status(400).json({ error });
    }
    // ------------ fin validaciones ------------

    try {
      const result = await modelo.registrarProducto(
        String(nombre).trim(),
        String(descripcion).trim(),
        String(categoria).trim(),
        String(marca).trim(),
        String(talla).trim(),
        Number(precio),
        Number(stock),
        imagen ? String(imagen).trim() : null,
      );
      res
        .status(201)
        .json({ mensaje: "Producto registrado con éxito", id: result.insertId });
    } catch (err) {
      if (err.message.includes("Duplicate entry")) {
        return res
          .status(409)
          .json({ error: "Ya existe un producto con ese nombre." });
      }
      return res
        .status(500)
        .json({ error: "Error inesperado: " + err.message });
    }
  } // cerrar registrarProducto

  //-------------------validaciones----------------------------

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

module.exports = RegistrarProductoAdminControlador;