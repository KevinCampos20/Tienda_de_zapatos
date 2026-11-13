/* ============================================================
   MIMO · Capa de conexión con el backend (RF01–RF17)
   Se carga ANTES que el script de cada página.
   ============================================================ */
(function () {
  // Cambia esta URL si el backend corre en otro host/puerto.
  const API_BASE = window.MIMO_API_BASE || "http://localhost:3333";
  const SESION_KEY = "mimoSesion";

  class ApiError extends Error {
    constructor(mensaje, status, datos) {
      super(mensaje);
      this.name = "ApiError";
      this.status = status;
      this.datos = datos;
    }
  }

  function construirUrl(ruta, query) {
    let url = API_BASE + ruta;
    if (!query) return url;

    const params = new URLSearchParams();
    Object.entries(query).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== "") {
        params.append(clave, valor);
      }
    });

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  async function pedir(ruta, opciones = {}) {
    const { method = "GET", body, query } = opciones;
    const url = construirUrl(ruta, query);

    let respuesta;
    try {
      respuesta = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new ApiError(
        "No se pudo conectar con el servidor. Verifica que el backend esté corriendo en " +
          API_BASE +
          ".",
        0,
        null,
      );
    }

    const texto = await respuesta.text();
    let datos = null;

    if (texto) {
      try {
        datos = JSON.parse(texto);
      } catch (err) {
        datos = { error: texto };
      }
    }

    if (!respuesta.ok) {
      const mensaje =
        (datos && (datos.error || datos.detalle || datos.mensaje)) ||
        `Error ${respuesta.status}. Intenta nuevamente.`;
      throw new ApiError(mensaje, respuesta.status, datos);
    }

    return datos;
  }

  const API = {
    base: API_BASE,
    get: (ruta, query) => pedir(ruta, { query }),
    post: (ruta, body) => pedir(ruta, { method: "POST", body }),
    put: (ruta, body, query) => pedir(ruta, { method: "PUT", body, query }),
    del: (ruta, query) => pedir(ruta, { method: "DELETE", query }),
  };

  /* ------------------------- Sesión ------------------------- */

  const sesion = {
    guardar(tipo, usuario) {
      localStorage.setItem(SESION_KEY, JSON.stringify({ tipo, usuario }));
    },
    obtener() {
      try {
        return JSON.parse(localStorage.getItem(SESION_KEY));
      } catch (err) {
        return null;
      }
    },
    cliente() {
      const s = sesion.obtener();
      return s && s.tipo === "cliente" ? s.usuario : null;
    },
    admin() {
      const s = sesion.obtener();
      return s && s.tipo === "admin" ? s.usuario : null;
    },
    cerrar() {
      localStorage.removeItem(SESION_KEY);
    },
  };

  function paginaActual() {
    const archivo = location.pathname.split("/").pop() || "index.html";
    return archivo + location.search;
  }

  // Devuelve el cliente logueado o redirige al login conservando el destino.
  function requerirCliente() {
    const usuario = sesion.cliente();
    if (usuario) return usuario;
    location.href = "login.html?redirect=" + encodeURIComponent(paginaActual());
    return null;
  }

  // Devuelve el admin logueado o redirige al login de administrador.
  function requerirAdmin() {
    const usuario = sesion.admin();
    if (usuario) return usuario;
    location.href =
      "admin-login.html?redirect=" + encodeURIComponent(paginaActual());
    return null;
  }

  // Lee ?redirect=... y solo acepta páginas del propio frontend.
  function destinoSeguro(porDefecto = "index.html") {
    const destino = new URLSearchParams(location.search).get("redirect");
    if (!destino) return porDefecto;
    return /^[\w\-.]+\.html(\?[^\s]*)?$/.test(destino) ? destino : porDefecto;
  }

  /* ----------------------- Utilidades ----------------------- */

  function escaparHtml(valor) {
    return String(valor === undefined || valor === null ? "" : valor)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatearPrecio(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return "$0";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(numero);
  }

  function formatearFecha(valor) {
    if (!valor) return "";
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return String(valor);
    return fecha.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  // Imagen del producto o un emoji como respaldo.
  function imagenProducto(producto) {
    if (producto && producto.imagen) {
      return `<img src="${escaparHtml(producto.imagen)}" alt="${escaparHtml(
        producto.nombre,
      )}" style="width:100%;height:100%;object-fit:contain" loading="lazy">`;
    }
    return "👟";
  }

  function mostrarMensaje(elemento, texto, tipo = "error") {
    if (!elemento) return;
    elemento.textContent = texto;
    elemento.className = tipo === "ok" ? "form-ok" : "form-error";
    elemento.style.display = "block";
  }

  function ocultarMensaje(elemento) {
    if (!elemento) return;
    elemento.textContent = "";
    elemento.style.display = "none";
  }

  // Muestra el estado de sesión en el header de cualquier página.
  function actualizarHeader() {
    const activa = sesion.obtener();

    document.querySelectorAll("[data-logout]").forEach((enlace) => {
      enlace.style.display = activa ? "" : "none";
      enlace.addEventListener("click", (evento) => {
        evento.preventDefault();
        sesion.cerrar();
        location.href = "index.html";
      });
    });

    const cuenta = document.querySelector("[data-cuenta]");
    if (cuenta && activa) {
      const usuario = activa.usuario;
      cuenta.href = activa.tipo === "admin" ? "admin-productos.html" : "mis-pedidos.html";
      cuenta.title =
        activa.tipo === "admin"
          ? `Sesión: ${usuario.nombre} (admin)`
          : `Hola, ${usuario.nombres || usuario.correo}`;
      cuenta.setAttribute("aria-label", cuenta.title);
    }
  }

  document.addEventListener("DOMContentLoaded", actualizarHeader);

  window.Mimo = {
    API,
    sesion,
    ApiError,
    requerirCliente,
    requerirAdmin,
    destinoSeguro,
    escaparHtml,
    formatearPrecio,
    formatearFecha,
    imagenProducto,
    mostrarMensaje,
    ocultarMensaje,
  };
})();
