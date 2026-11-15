/* ============================================================
   Catálogo: RF07 (listar), RF09 (buscar) y RF10 (filtrar)
   Se carga en index.html
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const { API, escaparHtml, formatearPrecio, imagenProducto } = window.Mimo;

  const grid = document.getElementById("productos-grid");
  if (!grid) return;

  const selCategoria = document.getElementById("filtro-categoria");
  const selTalla = document.getElementById("filtro-talla");
  const selMarca = document.getElementById("filtro-marca");
  const inputBuscar = document.getElementById("filtro-buscar");
  const btnAplicar = document.getElementById("btn-aplicar-filtros");
  const btnLimpiar = document.getElementById("btn-limpiar-filtros");
  const btnBuscar = document.getElementById("btn-buscar");
  const navCategorias = document.getElementById("nav-categorias");

  let productosBase = [];
  let categoriaActiva = "todos";

  /* --------------------------- Render --------------------------- */

  function listaDe(datos) {
    if (Array.isArray(datos)) return datos;
    if (datos && Array.isArray(datos.productos)) return datos.productos;
    return [];
  }

  function mensajeGrid(texto) {
    grid.innerHTML = `<div class="sin-resultados">${escaparHtml(texto)}</div>`;
  }

  function render(productos, mensajeVacio) {
    if (!productos.length) {
      mensajeGrid(mensajeVacio || "No hay productos disponibles en este momento.");
      return;
    }

    grid.innerHTML = productos
      .map(
        (producto) => `
        <a class="producto-card" href="detalle.html?id=${encodeURIComponent(
          producto.id,
        )}" aria-label="Ver ${escaparHtml(producto.nombre)}">
          <div class="producto-img" aria-hidden="true">${imagenProducto(producto)}</div>
          <div class="producto-info">
            <h4>${escaparHtml(producto.nombre)}</h4>
            <p class="marca">
              ${escaparHtml(producto.marca)} · Talla ${escaparHtml(producto.talla)}
              · ${escaparHtml(producto.categoria)}
            </p>
            <p class="precio">${formatearPrecio(producto.precio)}</p>
          </div>
        </a>`,
      )
      .join("");
  }

  /* -------------------------- Filtros --------------------------- */

  function llenarSelect(select, valores, etiquetaTodos) {
    if (!select) return;
    const anterior = select.value;
    select.innerHTML =
      `<option value="todos">${etiquetaTodos}</option>` +
      valores
        .map((valor) => `<option value="${escaparHtml(valor)}">${escaparHtml(valor)}</option>`)
        .join("");

    if (valores.includes(anterior)) select.value = anterior;
  }

  function poblarFiltros(productos) {
    const categorias = [...new Set(productos.map((p) => p.categoria).filter(Boolean))].sort();
    const tallas = [...new Set(productos.map((p) => p.talla).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b), "es", { numeric: true }),
    );
    const marcas = [...new Set(productos.map((p) => p.marca).filter(Boolean))].sort();

    llenarSelect(selCategoria, categorias, "Todos");
    llenarSelect(selTalla, tallas, "Todas");
    llenarSelect(selMarca, marcas, "Todas");
    if (selTalla) selTalla.value = "todos";
    if (selMarca) selMarca.value = "todos";
  }

  function renderNav(categorias) {
    if (!navCategorias) return;

    const opciones = [["todos", "Catálogo"], ...categorias.map((c) => [c, c])];
    navCategorias.innerHTML = opciones
      .map(
        ([valor, etiqueta]) => `
        <li>
          <a href="#" class="filtro-categoria${
            valor === categoriaActiva ? " categoria-activa" : ""
          }" data-categoria="${escaparHtml(valor)}">${escaparHtml(etiqueta)}</a>
        </li>`,
      )
      .join("");

    navCategorias.querySelectorAll(".filtro-categoria").forEach((enlace) => {
      enlace.addEventListener("click", (evento) => {
        evento.preventDefault();
        categoriaActiva = enlace.dataset.categoria;
        if (selCategoria) selCategoria.value = categoriaActiva;
        if (inputBuscar) inputBuscar.value = "";
        actualizarNavActivo();
        aplicarFiltros();
      });
    });
  }

  function actualizarNavActivo() {
    if (!navCategorias) return;
    navCategorias.querySelectorAll(".filtro-categoria").forEach((enlace) => {
      enlace.classList.toggle("categoria-activa", enlace.dataset.categoria === categoriaActiva);
    });
  }

  function queryFiltros() {
    const query = {};
    if (selCategoria && selCategoria.value !== "todos") query.categoria = selCategoria.value;
    if (selTalla && selTalla.value !== "todos") query.talla = selTalla.value;
    if (selMarca && selMarca.value !== "todos") query.marca = selMarca.value;
    return query;
  }

  async function aplicarFiltros() {
    const query = queryFiltros();

    if (!Object.keys(query).length) {
      render(productosBase);
      return;
    }

    mensajeGrid("Filtrando productos…");
    try {
      const datos = await API.get("/api/productos/filtrar", query);
      render(listaDe(datos), "No hay productos que cumplan con los filtros seleccionados.");
    } catch (err) {
      mensajeGrid(err.message);
    }
  }

  async function buscar() {
    const termino = inputBuscar ? inputBuscar.value.trim() : "";

    if (!termino) {
      if (selCategoria) selCategoria.value = "todos";
      if (selTalla) selTalla.value = "todos";
      if (selMarca) selMarca.value = "todos";
      categoriaActiva = "todos";
      actualizarNavActivo();
      render(productosBase);
      return;
    }

    mensajeGrid("Buscando…");
    try {
      const datos = await API.get("/api/productos/buscar", { termino });
      render(listaDe(datos), "No se encontraron productos para tu búsqueda.");
    } catch (err) {
      mensajeGrid(err.message);
    }
  }

  function limpiar() {
    if (selCategoria) selCategoria.value = "todos";
    if (selTalla) selTalla.value = "todos";
    if (selMarca) selMarca.value = "todos";
    if (inputBuscar) inputBuscar.value = "";
    categoriaActiva = "todos";
    actualizarNavActivo();
    render(productosBase);
  }

  /* --------------------------- Eventos -------------------------- */

  if (btnAplicar) btnAplicar.addEventListener("click", aplicarFiltros);
  if (btnLimpiar) btnLimpiar.addEventListener("click", limpiar);
  if (btnBuscar) btnBuscar.addEventListener("click", buscar);
  if (inputBuscar) {
    inputBuscar.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter") {
        evento.preventDefault();
        buscar();
      }
    });
  }

  /* -------------------------- Carga inicial --------------------- */

  (async function iniciar() {
    mensajeGrid("Cargando productos…");
    try {
      const datos = await API.get("/api/productos");
      productosBase = listaDe(datos);
      poblarFiltros(productosBase);
      renderNav([...new Set(productosBase.map((p) => p.categoria).filter(Boolean))].sort());
      render(productosBase, "No hay productos disponibles en este momento.");
    } catch (err) {
      mensajeGrid(err.message);
    }
  })();
});
