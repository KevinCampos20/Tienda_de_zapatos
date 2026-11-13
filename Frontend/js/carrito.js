/* ============================================================
   Carrito (RF11: cantidades, RF12: ver, RF14: eliminar)
   Se carga en carrito.html
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const {
    API,
    requerirCliente,
    escaparHtml,
    formatearPrecio,
    imagenProducto,
    mostrarMensaje,
    ocultarMensaje,
  } = window.Mimo;

  const cliente = requerirCliente();
  if (!cliente) return;

  const lista = document.getElementById("lista-carrito");
  const resumen = document.getElementById("resumen-carrito");
  const vacio = document.getElementById("carrito-vacio");
  const subtotalEl = document.getElementById("subtotal");
  const totalEl = document.getElementById("total");
  const mensajeEl = document.getElementById("mensaje-carrito");
  const btnPagar = document.getElementById("btn-pagar");

  let productos = [];

  function render() {
    ocultarMensaje(mensajeEl);

    if (!productos.length) {
      lista.innerHTML = "";
      resumen.hidden = true;
      vacio.hidden = false;
      return;
    }

    vacio.hidden = true;
    resumen.hidden = false;

    lista.innerHTML = productos
      .map(
        (producto) => `
        <div class="carrito-item" data-id="${escaparHtml(producto.id)}">
          <div class="carrito-img" aria-hidden="true">${imagenProducto(producto)}</div>
          <div class="carrito-info">
            <h4 style="color: var(--azul-noche);">${escaparHtml(producto.nombre)}</h4>
            <p style="color: var(--azul-profundo); font-size: 0.9rem;">
              Precio unitario: ${formatearPrecio(producto.precioUnitario)}
            </p>
            <p style="color: var(--dorado); font-weight: 700;">
              ${formatearPrecio(producto.subtotal)}
            </p>
          </div>
          <div class="carrito-acciones">
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <button type="button" class="btn btn-secondary" data-accion="menos"
                style="padding: 0.3rem 0.6rem;" aria-label="Quitar una unidad de ${escaparHtml(
                  producto.nombre,
                )}">−</button>
              <span aria-live="polite">${escaparHtml(producto.cantidad)}</span>
              <button type="button" class="btn btn-secondary" data-accion="mas"
                style="padding: 0.3rem 0.6rem;" aria-label="Agregar una unidad de ${escaparHtml(
                  producto.nombre,
                )}">+</button>
            </div>
            <button type="button" class="btn btn-danger" data-accion="eliminar"
              style="padding: 0.4rem 0.6rem;" aria-label="Eliminar ${escaparHtml(
                producto.nombre,
              )} del carrito">🗑️</button>
          </div>
        </div>`,
      )
      .join("");

    const totalGeneral = productos.reduce((suma, p) => suma + Number(p.subtotal), 0);
    subtotalEl.textContent = formatearPrecio(totalGeneral);
    totalEl.textContent = formatearPrecio(totalGeneral);
  }

  function bloquear(item, bloquear) {
    item.querySelectorAll("button").forEach((boton) => {
      boton.disabled = bloquear;
    });
  }

  async function cargar() {
    try {
      const datos = await API.get("/api/carrito", { idCliente: cliente.idCliente });
      productos = Array.isArray(datos.productos) ? datos.productos : [];
      render();
    } catch (err) {
      lista.innerHTML = "";
      resumen.hidden = true;
      vacio.hidden = true;
      mostrarMensaje(mensajeEl, err.message);
    }
  }

  lista.addEventListener("click", async (evento) => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;

    const item = boton.closest(".carrito-item");
    const idProducto = Number(item.dataset.id);
    const producto = productos.find((p) => Number(p.id) === idProducto);
    if (!producto) return;

    const accion = boton.dataset.accion;

    if (accion === "eliminar") {
      const confirmado = confirm(`¿Eliminar "${producto.nombre}" del carrito?`);
      if (!confirmado) return;
    }

    if (accion === "menos" && Number(producto.cantidad) <= 1) {
      return;
    }

    bloquear(item, true);
    ocultarMensaje(mensajeEl);

    try {
      if (accion === "eliminar") {
        await API.del(`/api/carrito/eliminar/${idProducto}`, {
          idCliente: cliente.idCliente,
        });
      } else {
        const nuevaCantidad =
          accion === "mas" ? Number(producto.cantidad) + 1 : Number(producto.cantidad) - 1;

        await API.put("/api/carrito/cantidad", {
          idCliente: cliente.idCliente,
          idProducto,
          cantidad: nuevaCantidad,
        });
      }

      await cargar();
    } catch (err) {
      mostrarMensaje(mensajeEl, err.message);
      bloquear(item, false);
    }
  });

  if (btnPagar) {
    btnPagar.addEventListener("click", (evento) => {
      if (!productos.length) {
        evento.preventDefault();
        mostrarMensaje(mensajeEl, "Tu carrito está vacío. Agrega productos para continuar.");
      }
    });
  }

  cargar();
});
