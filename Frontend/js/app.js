// ============================================
// BASE DE DATOS SIMULADA DE PRODUCTOS MIMO
// ============================================
const productosMIMO = [
    {
        id: 1,
        nombre: "Zapatilla Runner Pro",
        marca: "Nike",
        categoria: "Deportivo",
        genero: "Hombre",
        talla: "40",
        precio: 120.00,
        stock: 15,
        imagen: ""
    },
    {
        id: 2,
        nombre: "Bota Urbana Classic",
        marca: "Timberland",
        categoria: "Casual",
        genero: "Hombre",
        talla: "42",
        precio: 150.00,
        stock: 8,
        imagen: "🥾"
    },
    {
        id: 3,
        nombre: "Sneaker Casual",
        marca: "Adidas",
        categoria: "Casual",
        genero: "Mujer",
        talla: "38",
        precio: 95.00,
        stock: 20,
        imagen: "👟"
    },
    {
        id: 4,
        nombre: "Tacon Elegance",
        marca: "MIMO",
        categoria: "Formal",
        genero: "Mujer",
        talla: "37",
        precio: 110.00,
        stock: 5,
        imagen: ""
    },
    {
        id: 5,
        nombre: "Zapatilla Kids Sport",
        marca: "Nike",
        categoria: "Deportivo",
        genero: "Niños",
        talla: "32",
        precio: 65.00,
        stock: 12,
        imagen: "👟"
    },
    {
        id: 6,
        nombre: "Bota Mini Explorer",
        marca: "Timberland",
        categoria: "Casual",
        genero: "Niños",
        talla: "30",
        precio: 75.00,
        stock: 10,
        imagen: "🥾"
    },
    {
        id: 7,
        nombre: "Running Air Max",
        marca: "Nike",
        categoria: "Deportivo",
        genero: "Mujer",
        talla: "39",
        precio: 135.00,
        stock: 7,
        imagen: "👟"
    },
    {
        id: 8,
        nombre: "Zapato Oxford Classic",
        marca: "MIMO",
        categoria: "Formal",
        genero: "Hombre",
        talla: "41",
        precio: 145.00,
        stock: 4,
        imagen: "👞"
    }
];

// ============================================
// ESTADO ACTUAL DE FILTROS
// ============================================
let filtrosActuales = {
    categoria: "todos",
    genero: "todos",
    talla: "todas",
    marca: "todas"
};

// ============================================
// FUNCIÓN PARA RENDERIZAR PRODUCTOS
// ============================================
function renderizarProductos(productos) {
    const grid = document.getElementById('productos-grid');
    
    if (!grid) return; // Si no estamos en index.html, salir
    
    grid.innerHTML = ''; // Limpiar grid
    
    if (productos.length === 0) {
        grid.innerHTML = '<div class="sin-resultados">😔 No hay productos que cumplan con los filtros seleccionados.</div>';
        return;
    }
    
    productos.forEach(producto => {
        const tarjeta = document.createElement('a');
        tarjeta.className = 'producto-card';
        tarjeta.href = 'detalle.html';
        tarjeta.setAttribute('aria-label', `Ver ${producto.nombre}, ${producto.marca}, $${producto.precio.toFixed(2)}`);
        tarjeta.addEventListener('click', () => localStorage.setItem('productoSeleccionado', producto.id));
        tarjeta.innerHTML = `
            <div class="producto-img" aria-hidden="true" style="font-size: 4rem;">${producto.imagen || '👟'}</div>
            <div class="producto-info">
                <h4>${producto.nombre}</h4>
                <p class="marca">${producto.marca} | ${producto.genero}</p>
                <p class="precio">$${producto.precio.toFixed(2)}</p>
            </div>
        `;
        grid.appendChild(tarjeta);
    });
}

// ============================================
// FUNCIÓN PARA FILTRAR PRODUCTOS
// ============================================
function aplicarFiltros() {
    let productosFiltrados = productosMIMO;
    
    // Filtro por género (Hombre, Mujer, Niños)
    if (filtrosActuales.genero !== "todos") {
        productosFiltrados = productosFiltrados.filter(p => p.genero === filtrosActuales.genero);
    }
    
    // Filtro por categoría
    if (filtrosActuales.categoria !== "todos") {
        productosFiltrados = productosFiltrados.filter(p => p.categoria === filtrosActuales.categoria);
    }
    
    // Filtro por talla
    if (filtrosActuales.talla !== "todas") {
        productosFiltrados = productosFiltrados.filter(p => p.talla === filtrosActuales.talla);
    }
    
    // Filtro por marca
    if (filtrosActuales.marca !== "todas") {
        productosFiltrados = productosFiltrados.filter(p => p.marca === filtrosActuales.marca);
    }
    
    renderizarProductos(productosFiltrados);
}

// ============================================
// FUNCIÓN PARA IR AL DETALLE
// ============================================
function irADetalle(idProducto) {
    // Guardar el ID en localStorage para usarlo en detalle.html
    localStorage.setItem('productoSeleccionado', idProducto);
    window.location.href = 'detalle.html';
}

// ============================================
// INICIALIZACIÓN DE EVENTOS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Cargar productos al iniciar ---
    renderizarProductos(productosMIMO);
    
    // --- 2. Botones de categoría en el header (Hombre, Mujer, Niños) ---
    const botonesCategoria = document.querySelectorAll('.filtro-categoria');
    botonesCategoria.forEach(boton => {
        boton.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Quitar clase activa de todos
            botonesCategoria.forEach(b => b.classList.remove('categoria-activa'));
            
            // Agregar clase activa al clickeado
            boton.classList.add('categoria-activa');
            
            // Actualizar filtro y aplicar
            filtrosActuales.genero = boton.dataset.categoria;
            aplicarFiltros();
        });
    });
    
    // --- 3. Filtros del panel lateral ---
    const btnAplicar = document.getElementById('btn-aplicar-filtros');
    const btnLimpiar = document.getElementById('btn-limpiar-filtros');
    
    if (btnAplicar) {
        btnAplicar.addEventListener('click', () => {
            filtrosActuales.categoria = document.getElementById('filtro-categoria').value;
            filtrosActuales.talla = document.getElementById('filtro-talla').value;
            filtrosActuales.marca = document.getElementById('filtro-marca').value;
            aplicarFiltros();
        });
    }

    // Mantener los resultados sincronizados al cambiar un selector.
    ['filtro-categoria', 'filtro-talla', 'filtro-marca'].forEach(id => {
        const selector = document.getElementById(id);
        if (selector) selector.addEventListener('change', () => {
            filtrosActuales.categoria = document.getElementById('filtro-categoria').value;
            filtrosActuales.talla = document.getElementById('filtro-talla').value;
            filtrosActuales.marca = document.getElementById('filtro-marca').value;
            aplicarFiltros();
        });
    });
    
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            // Resetear valores
            document.getElementById('filtro-categoria').value = 'todos';
            document.getElementById('filtro-talla').value = 'todas';
            document.getElementById('filtro-marca').value = 'todas';
            
            filtrosActuales = {
                categoria: "todos",
                genero: "todos",
                talla: "todas",
                marca: "todas"
            };
            
            // Resetear botones del header
            botonesCategoria.forEach(b => b.classList.remove('categoria-activa'));
            botonesCategoria[0].classList.add('categoria-activa'); // "Catálogo" activo
            
            aplicarFiltros();
        });
    }
    
    // --- 4. Selector de cantidad en Detalle de Producto (RF11) ---
    const btnMas = document.getElementById('btn-mas');
    const btnMenos = document.getElementById('btn-menos');
    const cantidadSpan = document.getElementById('cantidad');
    
    if (btnMas && btnMenos && cantidadSpan) {
        let cantidad = 1;
        
        btnMas.addEventListener('click', () => {
            cantidad++;
            cantidadSpan.textContent = cantidad;
        });
        
        btnMenos.addEventListener('click', () => {
            if (cantidad > 1) {
                cantidad--;
                cantidadSpan.textContent = cantidad;
            }
        });
    }
    
    // --- 5. Cargar producto en detalle.html ---
    const detalleContainer = document.getElementById('detalle-producto');
    if (detalleContainer) {
        const idProducto = localStorage.getItem('productoSeleccionado');
        const producto = productosMIMO.find(p => p.id === parseInt(idProducto));
        
        if (producto) {
            detalleContainer.innerHTML = `
                <div style="flex: 1; background: var(--beige); border-radius: 12px; height: 400px; display: flex; align-items: center; justify-content: center; font-size: 8rem;">
                    ${producto.imagen}
                </div>
                <div style="flex: 1;">
                    <p style="color: var(--azul-profundo); font-weight: 600;">${producto.marca.toUpperCase()} | ${producto.genero}</p>
                    <h1 style="color: var(--azul-noche); margin-bottom: 1rem;">${producto.nombre}</h1>
                    <p style="font-size: 2rem; color: var(--dorado); font-weight: 700; margin-bottom: 2rem;">$${producto.precio.toFixed(2)}</p>
                    <p style="margin-bottom: 2rem; color: var(--azul-profundo);">Categoría: ${producto.categoria} | Talla: ${producto.talla} | Stock: ${producto.stock} unidades</p>
                    
                    <div class="form-group">
                        <label>Cantidad</label>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <button class="btn btn-secondary" id="btn-menos">-</button>
                            <span id="cantidad" style="font-size: 1.2rem; font-weight: bold;">1</span>
                            <button class="btn btn-secondary" id="btn-mas">+</button>
                        </div>
                    </div>
                    
                    <button class="btn btn-primary" style="width: 100%; margin-top: 1rem; font-size: 1.1rem;" onclick="alert('✅ Producto agregado al carrito')">Agregar al Carrito</button>
                </div>
            `;
            
            // Re-inicializar controles de cantidad después de renderizar
            const nuevoBtnMas = document.getElementById('btn-mas');
            const nuevoBtnMenos = document.getElementById('btn-menos');
            const nuevoCantidadSpan = document.getElementById('cantidad');
            
            if (nuevoBtnMas && nuevoBtnMenos && nuevoCantidadSpan) {
                let cantidad = 1;
                nuevoBtnMas.addEventListener('click', () => {
                    cantidad++;
                    nuevoCantidadSpan.textContent = cantidad;
                });
                nuevoBtnMenos.addEventListener('click', () => {
                    if (cantidad > 1) {
                        cantidad--;
                        nuevoCantidadSpan.textContent = cantidad;
                    }
                });
            }
        } else {
            detalleContainer.innerHTML = '<h2 style="color: var(--azul-noche);">Producto no encontrado</h2>';
        }
    }
    
    // --- 6. Confirmación para eliminar productos (RF06) ---
    const botonesEliminar = document.querySelectorAll('.btn-danger');
    botonesEliminar.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(!confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
                e.preventDefault();
            }
        });
    });
});
