/* ============================================================
   Panel administrador: RF04 (crear), RF05 (modificar),
   RF06 (eliminar) y RF07 (listar productos)
   Se carga en admin-productos.html
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const {
    API,
    requerirAdmin,
    escaparHtml,
    formatearPrecio,
    mostrarMensaje,
    ocultarMensaje,
  } = window.Mimo;

  const admin = requerirAdmin();
  if (!admin) return;

  const nombreAdmin = document.getElementById("admin-nombre");
  if (nombreAdmin) {
    nombreAdmin.textContent = admin.nombre || admin.correo || "Administrador";
  }

  const cuerpoTabla = document.getElementById("tabla-productos-body");
  const contenedorForm = document.getElementById("contenedor-form-producto");
  const form = document.getElementById("form-producto");
  const btnNuevo = document.getElementById("btn-nuevo-producto");
  const btnCancelar = document.getElementById("btn-cancelar-producto");
  const mensajeAdmin = document.getElementById("mensaje-admin");
  const btnGuardar = form ? form.querySelector("button[type=submit]") : null;

  if (!cuerpoTabla || !form) return;

  const campos = {
    id: document.getElementById("prod-id"),
    nombre: document.getElementById("prod-nombre"),
    descripcion: document.getElementById("prod-descripcion"),
    categoria: document.getElementById("prod-categoria"),
    marca: document.getElementById("prod-marca"),
    talla: document.getElementById("prod-talla"),
    precio: document.getElementById("prod-precio"),
    stock: document.getElementById("prod-stock"),
    imagen: document.getElementById("prod-imagen"),
  };

  let productos = [];
  let editando = false;

  function listaDe(datos) {
    if (Array.isArray(datos)) return datos;
    if (datos && Array.isArray(datos.productos)) return datos.productos;
    return [];
  }

  /* --------------------------- Tabla --------------------------- */

  function renderTabla() {
    if (!productos.length) {
      cuerpoTabla.innerHTML =
        '<tr><td colspan="8" style="text-align:center; padding:2rem;">No hay productos activos en el catálogo.</td></tr>';
      return;
    }

    cuerpoTabla.innerHTML = productos
      .map(
        (producto) => `
        <tr data-id="${escaparHtml(producto.id)}">
          <td>
            <div style="width:56px;height:56px;background:#fff;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">
              ${
                producto.imagen
                  ? `<img src="${escaparHtml(producto.imagen)}" alt="${escaparHtml(
                      producto.nombre,
                    )}" style="width:100%;height:100%;object-fit:cover;">`
                  : "👟"
              }
            </div>
          </td>
          <td>
            <strong>${escaparHtml(producto.nombre)}</strong><br>
            <span style="font-size:.85rem;color:var(--azul-profundo);">${escaparHtml(
              producto.descripcion,
            )}</span>
          </td>
          <td>${escaparHtml(producto.marca)}</td>
          <td>${escaparHtml(producto.categoria)}</td>
          <td>${escaparHtml(producto.talla)}</td>
          <td>${formatearPrecio(producto.precio)}</td>
          <td>${escaparHtml(producto.stock)}</td>
          <td style="white-space:nowrap;">
            <button class="btn btn-secondary" data-editar style="padding: 0.4rem 0.8rem; margin-right: 0.35rem;" aria-label="Modificar ${escaparHtml(
              producto.nombre,
            )}">✏️</button>
            <button class="btn btn-danger" data-eliminar style="padding: 0.4rem 0.8rem;" aria-label="Eliminar ${escaparHtml(
              producto.nombre,
            )}">🗑️</button>
          </td>
        </tr>`,
      )
      .join("");

    cuerpoTabla.querySelectorAll("[data-editar]").forEach((boton) => {
      boton.addEventListener("click", () => {
        const id = Number(boton.closest("tr").dataset.id);
        const producto = productos.find((p) => Number(p.id) === id);
        if (producto) abrirFormulario(producto);
      });
    });

    cuerpoTabla.querySelectorAll("[data-eliminar]").forEach((boton) => {
      boton.addEventListener("click", () => {
        const id = Number(boton.closest("tr").dataset.id);
        const producto = productos.find((p) => Number(p.id) === id);
        if (producto) eliminarProducto(producto, boton);
      });
    });
  }

  async function cargar() {
    try {
      const datos = await API.get("/api/productos");
      productos = listaDe(datos);
      renderTabla();
    } catch (err) {
      cuerpoTabla.innerHTML = "";
      mostrarMensaje(mensajeAdmin, err.message);
    }
  }

  /* ------------------------- Formulario ------------------------- */

  function abrirFormulario(producto) {
    editando = Boolean(producto);
    ocultarMensaje(mensajeAdmin);

    campos.id.value = producto ? producto.id : "";
    campos.nombre.value = producto ? producto.nombre || "" : "";
    campos.descripcion.value = producto ? producto.descripcion || "" : "";
    campos.categoria.value = producto ? producto.categoria || "" : "";
    campos.marca.value = producto ? producto.marca || "" : "";
    campos.talla.value = producto ? producto.talla || "" : "";
    campos.precio.value = producto ? producto.precio || "" : "";
    campos.stock.value = producto ? producto.stock ?? "" : "";
    campos.imagen.value = producto ? producto.imagen || "" : "";

    const titulo = document.getElementById("titulo-form-producto");
    if (titulo) {
      titulo.textContent = editando ? "Modificar Producto" : "Nuevo Producto";
    }
    if (btnGuardar) {
      btnGuardar.textContent = editando ? "Guardar cambios" : "Registrar producto";
    }

    contenedorForm.hidden = false;
    contenedorForm.scrollIntoView({ behavior: "smooth", block: "start" });
    campos.nombre.focus();
  }

  function cerrarFormulario() {
    editando = false;
    form.reset();
    campos.id.value = "";
    contenedorForm.hidden = true;
  }

  function validar() {
    const nombre = campos.nombre.value.trim();
    const descripcion = campos.descripcion.value.trim();
    const categoria = campos.categoria.value.trim();
    const marca = campos.marca.value.trim();
    const talla = campos.talla.value.trim();
    const precio = Number(campos.precio.value);
    const stock = Number(campos.stock.value);
    const imagen = campos.imagen.value.trim();

    if (
      !nombre ||
      !descripcion ||
      !categoria ||
      !marca ||
      !talla ||
      campos.precio.value === "" ||
      campos.stock.value === ""
    ) {
      return "Completa todos los campos obligatorios (la imagen es opcional).";
    }
    if (!Number.isFinite(precio) || precio <= 0) {
      return "El precio debe ser un número mayor a 0.";
    }
    if (!Number.isInteger(stock) || stock < 0) {
      return "El stock debe ser un número entero mayor o igual a 0.";
    }
    if (imagen) {
      const esUrl = /^https?:\/\/[^\s]{3,500}$/.test(imagen);
      const esRutaLocal =
        !imagen.includes("..") &&
        /^(?:\.{0,2}\/)?[\w\-./]+\.(?:jpe?g|png|webp|avif|gif)$/i.test(imagen);
      if (!esUrl && !esRutaLocal) {
        return "La imagen debe ser una URL http(s) o una ruta local válida.";
      }
    }
    return null;
  }

  /* --------------------------- Eventos -------------------------- */

  if (btnNuevo) {
    btnNuevo.addEventListener("click", () => abrirFormulario(null));
  }

  if (btnCancelar) {
    btnCancelar.addEventListener("click", cerrarFormulario);
  }

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    ocultarMensaje(mensajeAdmin);

    const error = validar();
    if (error) {
      mostrarMensaje(mensajeAdmin, error);
      return;
    }

    const payload = {
      t1: campos.nombre.value.trim(),
      t2: campos.descripcion.value.trim(),
      t3: campos.categoria.value.trim(),
      t4: campos.marca.value.trim(),
      t5: campos.talla.value.trim(),
      t6: Number(campos.precio.value),
      t7: Number(campos.stock.value),
      t8: campos.imagen.value.trim() || null,
    };

    if (!editando) {
      delete payload.t8;
      if (campos.imagen.value.trim()) payload.t8 = campos.imagen.value.trim();
    }

    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.textContent = editando ? "Guardando…" : "Registrando…";
    }

    try {
      if (editando) {
        await API.put(`/api/admin/productos/${campos.id.value}`, payload);
        mostrarMensaje(mensajeAdmin, "Producto modificado correctamente.", "ok");
      } else {
        await API.post("/api/admin/productos", payload);
        mostrarMensaje(mensajeAdmin, "Producto registrado correctamente.", "ok");
      }

      cerrarFormulario();
      await cargar();
    } catch (err) {
      mostrarMensaje(mensajeAdmin, err.message);
    } finally {
      if (btnGuardar) {
        btnGuardar.disabled = false;
        btnGuardar.textContent = editando ? "Guardar cambios" : "Registrar producto";
      }
    }
  });

  async function eliminarProducto(producto, boton) {
    const confirmado = confirm(
      `¿Eliminar "${producto.nombre}" (talla ${producto.talla}) del catálogo?\n\nEl producto dejará de mostrarse a los clientes.`,
    );
    if (!confirmado) return;

    boton.disabled = true;
    ocultarMensaje(mensajeAdmin);

    try {
      await API.del(`/api/admin/productos/${producto.id}`);
      mostrarMensaje(mensajeAdmin, "Producto eliminado correctamente.", "ok");
      if (Number(campos.id.value) === Number(producto.id)) {
        cerrarFormulario();
      }
      await cargar();
    } catch (err) {
      mostrarMensaje(mensajeAdmin, err.message);
    } finally {
      boton.disabled = false;
    }
  }

  cargar();
});
