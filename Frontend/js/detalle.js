/* ============================================================
   Detalle del producto (RF08) + agregar al carrito (RF13)
   Se carga en detalle.html?id=ID
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const {
    API,
    requerirCliente,
    escaparHtml,
    formatearPrecio,
    imagenProducto,
    mostrarMensaje,
  } = window.Mimo;

  const contenedor = document.getElementById("detalle-producto");
  if (!contenedor) return;

  function obtenerId() {
    const desdeUrl = new URLSearchParams(location.search).get("id");
    const desdeStorage = localStorage.getItem("productoSeleccionado");
    return Number(desdeUrl || desdeStorage || 0);
  }

  function mensaje(texto) {
    contenedor.innerHTML = `<div class="sin-resultados">${escaparHtml(texto)}</div>`;
  }

  function render(producto) {
    const agotado = Number(producto.stock) <= 0;

    contenedor.innerHTML = `
      <div class="detalle-img" aria-hidden="true">${imagenProducto(producto)}</div>
      <div class="detalle-info">
        <p class="detalle-marca">${escaparHtml(producto.marca)} · ${escaparHtml(
          producto.categoria,
        )}</p>
        <h1>${escaparHtml(producto.nombre)}</h1>
        <p class="detalle-precio">${formatearPrecio(producto.precio)}</p>
        <p class="detalle-desc">${escaparHtml(producto.descripcion)}</p>

        <ul class="detalle-datos">
          <li><strong>Talla:</strong> ${escaparHtml(producto.talla)}</li>
          <li><strong>Marca:</strong> ${escaparHtml(producto.marca)}</li>
          <li><strong>Disponibles:</strong> ${escaparHtml(producto.stock)} unidades</li>
        </ul>

        <div class="form-group">
          <label>Cantidad</label>
          <div class="cantidad-controles">
            <button type="button" class="btn btn-secondary" id="btn-menos" aria-label="Quitar una unidad">−</button>
            <span id="cantidad" aria-live="polite">1</span>
            <button type="button" class="btn btn-secondary" id="btn-mas" aria-label="Agregar una unidad">+</button>
          </div>
        </div>

        <button type="button" class="btn btn-primary" id="btn-agregar" style="width: 100%;">
          ${agotado ? "Producto agotado" : "Agregar al carrito"}
        </button>
        <p id="detalle-mensaje" class="form-error" role="status"></p>
        <p style="text-align: center; margin-top: 1rem;">
          <a href="carrito.html" style="color: var(--dorado); font-weight: 600;">Ver mi carrito →</a>
        </p>
      </div>`;

    const btnMas = document.getElementById("btn-mas");
    const btnMenos = document.getElementById("btn-menos");
    const cantidadSpan = document.getElementById("cantidad");
    const btnAgregar = document.getElementById("btn-agregar");
    const cajaMensaje = document.getElementById("detalle-mensaje");
    const maximo = Math.max(1, Number(producto.stock) || 0);
    let cantidad = 1;

    btnMas.addEventListener("click", () => {
      if (cantidad < maximo) {
        cantidad += 1;
        cantidadSpan.textContent = cantidad;
      }
    });

    btnMenos.addEventListener("click", () => {
      if (cantidad > 1) {
        cantidad -= 1;
        cantidadSpan.textContent = cantidad;
      }
    });

    if (agotado) {
      btnAgregar.disabled = true;
      mostrarMensaje(cajaMensaje, "Este producto está agotado por el momento.", "error");
      return;
    }

    btnAgregar.addEventListener("click", async () => {
      const cliente = requerirCliente();
      if (!cliente) return;

      btnAgregar.disabled = true;
      const textoOriginal = btnAgregar.textContent;
      btnAgregar.textContent = "Agregando…";

      try {
        await API.post("/api/carrito/agregar", {
          idCliente: cliente.idCliente,
          idProducto: producto.id,
          cantidad,
        });

        mostrarMensaje(
          cajaMensaje,
          "Producto agregado al carrito. Puedes seguir comprando o ir al carrito.",
          "ok",
        );
        btnAgregar.textContent = "Agregado ✓";
        setTimeout(() => {
          btnAgregar.textContent = textoOriginal;
          btnAgregar.disabled = false;
        }, 1500);
      } catch (err) {
        mostrarMensaje(cajaMensaje, err.message, "error");
        btnAgregar.textContent = textoOriginal;
        btnAgregar.disabled = false;
      }
    });
  }

  (async function iniciar() {
    const id = obtenerId();
    if (!id) {
      mensaje("No se seleccionó ningún producto. Vuelve al catálogo y elige uno.");
      return;
    }

    mensaje("Cargando producto…");
    try {
      const producto = await API.get(`/api/productos/${id}`);
      render(producto);
    } catch (err) {
      mensaje(err.status === 404 ? "El producto no está disponible." : err.message);
    }
  })();
});
