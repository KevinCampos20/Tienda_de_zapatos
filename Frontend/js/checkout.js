/* ============================================================
   Checkout (RF15: realizar pedido)
   Se carga en checkout.html
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const {
    API,
    requerirCliente,
    formatearPrecio,
    mostrarMensaje,
    ocultarMensaje,
  } = window.Mimo;

  const cliente = requerirCliente();
  if (!cliente) return;

  const form = document.getElementById("form-checkout");
  if (!form) return;

  const direccionEl = document.getElementById("direccion");
  const ciudadEl = document.getElementById("ciudad");
  const resumenProductos = document.getElementById("resumen-productos");
  const resumenCantidad = document.getElementById("resumen-cantidad");
  const resumenEnvio = document.getElementById("resumen-envio");
  const resumenTotal = document.getElementById("resumen-total");
  const mensajeEl = document.getElementById("mensaje-checkout");
  const btnConfirmar = document.getElementById("btn-confirmar");

  let carrito = [];

  function metodoPagoSeleccionado() {
    const seleccionado = form.querySelector('input[name="pago"]:checked');
    return seleccionado ? seleccionado.value : "";
  }

  async function cargarCarrito() {
    try {
      const datos = await API.get("/api/carrito", { idCliente: cliente.idCliente });
      carrito = Array.isArray(datos.productos) ? datos.productos : [];

      if (!carrito.length) {
        resumenCantidad.textContent = "0 productos";
        resumenEnvio.textContent = "Gratis";
        resumenTotal.textContent = formatearPrecio(0);
        resumenProductos.innerHTML =
          '<li style="color: var(--azul-profundo);">Tu carrito está vacío.</li>';
        btnConfirmar.disabled = true;
        mostrarMensaje(mensajeEl, "No hay productos en el carrito. Vuelve al catálogo.");
        return;
      }

      const total = carrito.reduce((suma, p) => suma + Number(p.subtotal), 0);
      const unidades = carrito.reduce((suma, p) => suma + Number(p.cantidad), 0);

      resumenCantidad.textContent = `${unidades} ${unidades === 1 ? "producto" : "productos"}`;
      resumenEnvio.textContent = "Gratis";
      resumenTotal.textContent = formatearPrecio(total);
      resumenProductos.innerHTML = carrito
        .map(
          (p) =>
            `<li style="display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 0.4rem;">
              <span>${p.cantidad} × ${window.Mimo.escaparHtml(p.nombre)}</span>
              <span>${formatearPrecio(p.subtotal)}</span>
            </li>`,
        )
        .join("");

      if (cliente.direccion && !direccionEl.value) {
        direccionEl.value = cliente.direccion;
      }
    } catch (err) {
      btnConfirmar.disabled = true;
      mostrarMensaje(mensajeEl, err.message);
    }
  }

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    ocultarMensaje(mensajeEl);

    if (!carrito.length) {
      mostrarMensaje(mensajeEl, "Tu carrito está vacío.");
      return;
    }

    const direccion = direccionEl.value.trim();
    const ciudad = ciudadEl.value.trim();
    const metodoPago = metodoPagoSeleccionado();

    if (direccion.length < 5) {
      mostrarMensaje(mensajeEl, "Escribe una dirección de envío válida.");
      return;
    }
    if (!metodoPago) {
      mostrarMensaje(mensajeEl, "Selecciona un método de pago.");
      return;
    }

    const direccionEnvio = ciudad ? `${direccion}, ${ciudad}` : direccion;
    if (direccionEnvio.length > 200) {
      mostrarMensaje(mensajeEl, "La dirección es demasiado larga (máximo 200 caracteres).");
      return;
    }

    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "Registrando pedido…";

    try {
      const pedido = await API.post("/api/pedidos", {
        idCliente: cliente.idCliente,
        direccionEnvio,
        metodoPago,
      });

      mostrarMensaje(
        mensajeEl,
        `Pedido #${pedido.idPedido} registrado por ${formatearPrecio(
          pedido.total,
        )}. Te llevamos a tus pedidos…`,
        "ok",
      );

      setTimeout(() => {
        location.href = `mis-pedidos.html?nuevo=${encodeURIComponent(pedido.idPedido)}`;
      }, 1400);
    } catch (err) {
      mostrarMensaje(mensajeEl, err.message);
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = "Confirmar Pedido";
    }
  });

  cargarCarrito();
});
