/**
 * SKY DUEL - Lógica del Cliente
 * Control de UI, Socket.io y peticiones al Servidor
 */

const socket = io();

// ==========================================
// 1. REFERENCIAS A ELEMENTOS DEL DOM
// ==========================================

// Contenedores de Pantallas (Paneles)
const panels = {
    login: document.getElementById('login-panel'),
    register: document.getElementById('register-panel'),
    menu: document.getElementById('menu-panel'),
    settings: document.getElementById('settings-panel'),
    mode: document.getElementById('mode-panel'),
    lobby: document.getElementById('lobby-panel'),
    rooms: document.getElementById('rooms-panel')
};

// Campos de entrada (Inputs)
const inputs = {
    rUser: document.getElementById('rUser'),
    rPass: document.getElementById('rPass'),
    lUser: document.getElementById('lUser'),
    lPass: document.getElementById('lPass')
};

// Elementos de UI específicos
const userNameDisplay = document.getElementById('connected-user-name');
const mainButtons = document.getElementById('main-buttons');
const playSubmenu = document.getElementById('play-submenu');
const mainTitle = document.querySelector('.main-title');

// ==========================================
// 2. NAVEGACIÓN Y CONTROL DE INTERFAZ
// ==========================================

/**
 * Cambia la visibilidad entre los paneles principales
 * @param {string} panelName - Nombre de la propiedad en el objeto 'panels'
 */
function showPanel(panelName) {
    Object.values(panels).forEach(panel => panel.classList.add('hidden'));
    if (panels[panelName]) {
        panels[panelName].classList.remove('hidden');
    }

    // El título principal desaparece solo en ajustes para ahorrar espacio
    if (panelName === 'settings') {
        mainTitle.classList.add('hidden');
    } else {
        mainTitle.classList.remove('hidden');
    }
}

/**
 * Alterna entre los botones de inicio y el submenú de "Jugar"
 */
function togglePlayMenu(show) {
    if (show) {
        mainButtons.classList.add('hidden');
        playSubmenu.classList.remove('hidden');
    } else {
        mainButtons.classList.remove('hidden');
        playSubmenu.classList.add('hidden');
    }
}

/**
 * Cambia las pestañas internas de la sección de Configuración
 */
function switchTab(tabName) {
    document.querySelectorAll('.tab-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    event.currentTarget.classList.add('active');
}

// ==========================================
// 3. SISTEMA DE AUDIO
// ==========================================

/**
 * Elige aleatoriamente una pista para el menú
 */
function setRandomMenuMusic() {
    const musicPlayer = document.getElementById("bgMusic");
    const playlist = ["assets-audio/Menu1.mp3", "assets-audio/Menu2.mp3"];
    const randomIndex = Math.floor(Math.random() * playlist.length);
    musicPlayer.src = playlist[randomIndex];
    musicPlayer.load();
}

/**
 * Actualiza el volumen de la música desde el slider
 */
function updateVolume(val) {
    const music = document.getElementById("bgMusic");
    music.volume = val;
    document.getElementById('volume-value').innerText = Math.round(val * 100) + "%";
}

// Inicialización de música al cargar
document.addEventListener("DOMContentLoaded", () => {
    setRandomMenuMusic();
    
    // El audio solo puede iniciar tras la primera interacción del usuario
    document.body.addEventListener('click', () => {
        const music = document.getElementById("bgMusic");
        if (music.paused && music.src !== "") {
            music.volume = 0.4;
            music.play();
        }
    }, { once: true });
});

// ==========================================
// 4. AUTENTICACIÓN Y CUENTA (API FETCH)
// ==========================================

async function register() {
    const user = inputs.rUser.value;
    const pass = inputs.rPass.value;

    if (!user || !pass) return alert("Por favor, rellena todos los campos.");

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pass })
        });
        const data = await res.json();

        if (data.status === "ok") {
            alert("✅ Cuenta creada exitosamente.");
            inputs.rUser.value = ''; inputs.rPass.value = '';
            showPanel('login');
        } else {
            alert("❌ Error: " + data.msg);
        }
    } catch (error) {
        alert("Error de conexión con el servidor.");
    }
}

async function login() {
    const user = inputs.lUser.value;
    const pass = inputs.lPass.value;

    if (!user || !pass) return alert("Ingresa tus credenciales.");

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pass })
        });
        const data = await res.json();

        if (data.status === "ok") {
            // Se valida por HTTP pero se entra formalmente vía Socket
            socket.emit('login', data.user);
        } else {
            alert("❌ " + data.msg);
        }
    } catch (error) {
        alert("Error de conexión con el servidor.");
    }
}

async function openSettings() {
    const user = userNameDisplay.innerText;
    showPanel('settings');

    try {
        const res = await fetch(`/api/user-stats?user=${user}`);
        const data = await res.json();

        if (data.status === "ok") {
            document.getElementById('card-name').innerText = data.info.nombre_usuario;
            document.getElementById('card-rank-race').innerText = data.info.rango_carrera;
            document.getElementById('card-rank-combat').innerText = data.info.rango_combate;
            document.getElementById('card-date').innerText = new Date(data.info.fecha_registro).toLocaleDateString();
        }
    } catch (e) {
        console.error("Error cargando perfil");
    }
}

function logout() {
    socket.emit('abandonarSala');
    socket.disconnect();
    location.reload(); 
}

// ==========================================
// 5. GESTIÓN DE SALAS Y LOBBY (SOCKET.IO)
// ==========================================

function crearSala(modo) {
    const host = userNameDisplay.innerText;
    socket.emit('crearSala', { host, modo });
    showPanel('lobby');
}

function unirse(salaId) {
    const usuario = userNameDisplay.innerText;
    socket.emit('unirseASala', { salaId, usuario });
    showPanel('lobby');
}

function salirDeLaSala() {
    socket.emit('abandonarSala');
    showPanel('menu');
}

// --- ESCUCHA DE EVENTOS DEL SERVIDOR ---

// Login exitoso
socket.on('loginSuccess', (user) => {
    userNameDisplay.innerText = user;
    showPanel('menu');
    inputs.lUser.value = ''; inputs.lPass.value = '';
});

// Error en login (usuario ya conectado)
socket.on('loginError', (msg) => {
    alert("⚠️ " + msg);
});

// Actualizar lista lateral de pilotos online
socket.on('usuarios', (lista) => {
    const container = document.getElementById('lista-usuarios');
    if (!container) return;
    container.innerHTML = '';
    lista.forEach(u => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="status-dot"></span> ${u}`;
        container.appendChild(li);
    });
});

// Actualizar tabla interna del Lobby
socket.on('salaActualizada', (sala) => {
    document.getElementById('lobby-mode-text').innerText = sala.modo;
    const list = document.getElementById('lobby-players-list');
    list.innerHTML = '';
    
    sala.jugadores.forEach((p, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${p} ${index === 0 ? '<span class="host-tag">(HOST)</span>' : ''}</td>
            <td class="ready-text">PREPARADO</td>
        `;
        list.appendChild(row);
    });
    document.getElementById('player-count').innerText = sala.jugadores.length;
});

// Actualizar lista pública de salas disponibles
socket.on('listaSalas', (salas) => {
    const container = document.getElementById('available-rooms-list');
    if (!container) return;
    container.innerHTML = '';

    Object.keys(salas).forEach(hostId => {
        const sala = salas[hostId];
        const estaLlena = sala.jugadores.length >= sala.max;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${hostId}</td>
            <td>${sala.modo}</td>
            <td>${sala.jugadores.length}/4</td>
            <td>
                <button class="btn-small" ${estaLlena ? 'disabled' : ''} 
                    onclick="unirse('${hostId}')">
                    ${estaLlena ? 'LLENO' : 'UNIRSE'}
                </button>
            </td>
        `;
        container.appendChild(row);
    });
});

// El Host cerró la sala mientras estábamos dentro
socket.on('salaCerrada', () => {
    alert("La sala ha sido cerrada por el host.");
    showPanel('menu');
});

// Limpieza al cerrar pestaña
window.addEventListener('beforeunload', () => {
    socket.disconnect();
});