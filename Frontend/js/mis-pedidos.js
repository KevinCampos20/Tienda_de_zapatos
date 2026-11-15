/* ============================================================
   Mis pedidos (RF17: listar, RF16: ver detalle)
   Se carga en mis-pedidos.html
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const {
    API,
    requerirCliente,
    escaparHtml,
    formatearPrecio,
    formatearFecha,
    mostrarMensaje,
    ocultarMensaje,
  } = window.Mimo;

  const cliente = requerirCliente();
  if (!cliente) return;

  const lista = document.getElementById("lista-pedidos");
  const vacio = document.getElementById("pedidos-vacio");
  const mensajeEl = document.getElementById("mensaje-pedidos");

  if (!lista) return;

  const BADGES = {
    pendiente: "badge-pendiente",
    confirmado: "badge-confirmado",
    enviado: "badge-enviado",
    entregado: "badge-entregado",
    cancelado: "badge-cancelado",
  };

  function claseBadge(estado) {
    return BADGES[String(estado || "").toLowerCase()] || "badge-pendiente";
  }

  function listaDe(datos) {
    if (Array.isArray(datos)) return datos;
    if (datos && Array.isArray(datos.pedidos)) return datos.pedidos;
    return [];
  }

  function renderDetalle(datos) {
    const productos = Array.isArray(datos.productos) ? datos.productos : [];
    const filas = productos
      .map(
        (p) => `
        <li style="display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 0.35rem;">
          <span>${escaparHtml(p.cantidad)} × ${escaparHtml(p.nombre)}</span>
          <span>${formatearPrecio(p.subtotal)}</span>
        </li>`,
      )
      .join("");

    return `
      <div class="pedido-detalle" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(11,34,57,.15);">
        <p style="margin-bottom: 0.5rem;"><strong>Dirección:</strong> ${escaparHtml(
          datos.direccionEnvio || "—",
        )}</p>
        <p style="margin-bottom: 0.5rem;"><strong>Método de pago:</strong> ${escaparHtml(
          datos.metodoPago || "—",
        )}</p>
        <p style="margin-bottom: 0.5rem;"><strong>Estado:</strong> ${escaparHtml(
          datos.estado || "—",
        )}</p>
        <ul style="list-style: none; padding: 0; margin: 0.75rem 0;">
          ${filas || '<li style="color: var(--azul-profundo);">Sin productos registrados.</li>'}
        </ul>
        <p style="text-align: right; font-weight: 700; color: var(--dorado);">
          Total: ${formatearPrecio(datos.total)}
        </p>
      </div>`;
  }

  async function alternarDetalle(boton, pedido) {
    const tarjeta = boton.closest(".pedido-card");
    const existente = tarjeta.querySelector(".pedido-detalle");

    if (existente) {
      existente.remove();
      boton.textContent = "Ver detalles";
      return;
    }

    boton.disabled = true;
    boton.textContent = "Cargando…";

    try {
      const datos = await API.get(`/api/pedidos/${pedido.idPedido}`, {
        idCliente: cliente.idCliente,
      });
      tarjeta.insertAdjacentHTML("beforeend", renderDetalle(datos));
      boton.textContent = "Ocultar detalles";
    } catch (err) {
      mostrarMensaje(mensajeEl, err.message);
      boton.textContent = "Ver detalles";
    } finally {
      boton.disabled = false;
    }
  }

  function render(pedidos) {
    if (!pedidos.length) {
      lista.innerHTML = "";
      vacio.hidden = false;
      return;
    }

    vacio.hidden = true;
    lista.innerHTML = pedidos
      .map(
        (pedido) => `
        <div class="pedido-card" data-id="${escaparHtml(pedido.idPedido)}">
          <div class="pedido-info">
            <h4>Pedido #${escaparHtml(pedido.idPedido)}</h4>
            <p>Fecha: ${formatearFecha(pedido.fechaCreacion)} · Total: ${formatearPrecio(
              pedido.total,
            )}</p>
            <div style="text-align: right; margin-top: 0.75rem;">
              <button type="button" class="btn btn-secondary" data-ver
                style="padding: 0.4rem 0.9rem;">Ver detalles</button>
            </div>
          </div>
          <div style="text-align: right;">
            <span class="badge ${claseBadge(pedido.estado)}">${escaparHtml(
              pedido.estado || "Pendiente",
            )}</span>
          </div>
        </div>`,
      )
      .join("");

    lista.querySelectorAll("[data-ver]").forEach((boton) => {
      boton.addEventListener("click", () => {
        const tarjeta = boton.closest(".pedido-card");
        const id = Number(tarjeta.dataset.id);
        const pedido = pedidos.find((p) => Number(p.idPedido) === id);
        if (pedido) alternarDetalle(boton, pedido);
      });
    });
  }

  async function cargar() {
    ocultarMensaje(mensajeEl);
    lista.innerHTML =
      '<p style="color: var(--azul-profundo); padding: 1rem 0;">Cargando pedidos…</p>';

    try {
      const datos = await API.get("/api/pedidos/mis-pedidos", {
        idCliente: cliente.idCliente,
      });
      const pedidos = listaDe(datos);
      render(pedidos);

      const nuevo = new URLSearchParams(location.search).get("nuevo");
      if (nuevo) {
        mostrarMensaje(
          mensajeEl,
          `¡Pedido #${nuevo} registrado con éxito!`,
          "ok",
        );
      }
    } catch (err) {
      lista.innerHTML = "";
      vacio.hidden = true;
      mostrarMensaje(mensajeEl, err.message);
    }
  }

  cargar();
});
