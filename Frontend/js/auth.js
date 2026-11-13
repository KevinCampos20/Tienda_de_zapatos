/* ============================================================
   Autenticación (RF01, RF02, RF03)
   Se carga en login.html, registro.html y admin-login.html
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const { API, sesion, destinoSeguro, mostrarMensaje, ocultarMensaje } = window.Mimo;

  /* ----------------------- Login cliente ----------------------- */
  const formLogin = document.getElementById("form-login");
  if (formLogin) {
    const error = document.getElementById("form-error");
    const boton = formLogin.querySelector("button[type=submit]");

    formLogin.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      ocultarMensaje(error);

      const correo = document.getElementById("correo").value.trim();
      const contrasena = document.getElementById("contrasena").value;

      if (!correo || !contrasena) {
        mostrarMensaje(error, "Ingresa tu correo y tu contraseña.");
        return;
      }

      boton.disabled = true;
      boton.textContent = "Ingresando…";

      try {
        const datos = await API.post("/api/auth/login/cliente", {
          t1: correo,
          t2: contrasena,
        });

        sesion.guardar("cliente", datos.usuario);
        location.href = destinoSeguro("index.html");
      } catch (err) {
        mostrarMensaje(error, err.message);
        boton.disabled = false;
        boton.textContent = "Ingresar";
      }
    });
  }

  /* ------------------------ Registro RF01 ----------------------- */
  const formRegistro = document.getElementById("form-registro");
  if (formRegistro) {
    const error = document.getElementById("form-error");
    const boton = formRegistro.querySelector("button[type=submit]");

    formRegistro.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      ocultarMensaje(error);

      const tipoDocumento = document.getElementById("tipoDocumento").value;
      const numeroDocumento = document.getElementById("numeroDocumento").value.trim();
      const nombres = document.getElementById("nombre").value.trim();
      const direccion = document.getElementById("direccion").value.trim();
      const telefono = document.getElementById("telefono").value.trim();
      const correo = document.getElementById("correo").value.trim();
      const contrasena = document.getElementById("contrasena").value;
      const confirmar = document.getElementById("confirmar").value;

      // Validaciones rápidas antes de llamar al backend.
      if (!/^\d{8,10}$/.test(numeroDocumento)) {
        mostrarMensaje(error, "La identificación debe tener entre 8 y 10 dígitos.");
        return;
      }
      if (!/^\d{10}$/.test(telefono)) {
        mostrarMensaje(error, "El teléfono debe tener exactamente 10 dígitos.");
        return;
      }
      if (contrasena !== confirmar) {
        mostrarMensaje(error, "Las contraseñas no coinciden.");
        return;
      }

      boton.disabled = true;
      boton.textContent = "Creando cuenta…";

      try {
        await API.post("/api/auth/register", {
          t1: tipoDocumento,
          t2: numeroDocumento,
          t3: nombres,
          t4: direccion,
          t5: telefono,
          t6: correo,
          t7: contrasena,
        });

        mostrarMensaje(
          error,
          "Cuenta creada con éxito. Te llevamos al inicio de sesión…",
          "ok",
        );
        setTimeout(() => {
          location.href = "login.html";
        }, 1400);
      } catch (err) {
        mostrarMensaje(error, err.message);
        boton.disabled = false;
        boton.textContent = "Crear cuenta";
      }
    });
  }

  /* ------------------------ Login admin RF03 -------------------- */
  const formAdmin = document.getElementById("form-admin-login");
  if (formAdmin) {
    const error = document.getElementById("form-error");
    const boton = formAdmin.querySelector("button[type=submit]");

    formAdmin.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      ocultarMensaje(error);

      const correo = document.getElementById("admin-correo").value.trim();
      const contrasena = document.getElementById("admin-contrasena").value;

      if (!correo || !contrasena) {
        mostrarMensaje(error, "Ingresa el usuario y la contraseña.");
        return;
      }

      boton.disabled = true;
      boton.textContent = "Verificando…";

      try {
        const datos = await API.post("/api/auth/login/admin", {
          t1: correo,
          t2: contrasena,
        });

        sesion.guardar("admin", datos.usuario);
        location.href = destinoSeguro("admin-productos.html");
      } catch (err) {
        mostrarMensaje(error, err.message);
        boton.disabled = false;
        boton.textContent = "Entrar al Panel";
      }
    });
  }
});
