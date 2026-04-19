const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2');
const path = require('path');

// ==========================================
// 1. CONFIGURACIÓN DEL SERVIDOR Y MIDDLEWARES
// ==========================================
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Permite procesar JSON en las peticiones
app.use(express.json());
// Define la carpeta 'public' para servir archivos estáticos (HTML, CSS, JS del cliente)
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 2. CONEXIÓN A LA BASE DE DATOS (MySQL)
// ==========================================
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Panda.rojo2',
    database: 'skyduel'
});

db.connect(err => {
    if (err) {
        console.error("MYSQL ERROR:", err);
    } else {
        console.log("✅ MySQL conectado");
    }
});

// ==========================================
// 3. RUTAS DE LA API (HTTP POST/GET)
// ==========================================

// Registro de nuevos usuarios
app.post('/api/register', (req, res) => {
    const { user, pass } = req.body;
    const sql = "INSERT INTO usuarios (nombre_usuario, contrasena) VALUES (?, ?)";

    db.query(sql, [user, pass], (err) => {
        if (err) {
            console.error(err);
            return res.json({ status: "error", msg: "Error o usuario existente" });
        }
        res.json({ status: "ok" });
    });
});

// Inicio de sesión (Login)
app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    const sql = "SELECT * FROM usuarios WHERE nombre_usuario = ?";

    db.query(sql, [user], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ status: "error" });
        }
        if (results.length === 0) {
            return res.json({ status: "error", msg: "No existe" });
        }
        if (results[0].contrasena !== pass) {
            return res.json({ status: "error", msg: "Contraseña incorrecta" });
        }
        res.json({ status: "ok", user });
    });
});

// Obtener estadísticas y rangos del perfil del usuario
app.get('/api/user-stats', (req, res) => {
    const user = req.query.user;
    const sql = "SELECT nombre_usuario, rango_carrera, rango_combate, fecha_registro FROM usuarios WHERE nombre_usuario = ?";

    db.query(sql, [user], (err, results) => {
        if (err || results.length === 0) return res.json({ status: "error" });
        res.json({ status: "ok", info: results[0] });
    });
});

// ==========================================
// 4. LÓGICA DE SOCKET.IO (TIEMPO REAL)
// ==========================================

// Almacenamiento temporal en memoria
let usuariosConectados = {}; // { nombreUsuario: socketId }
let salas = {};              // { hostName: { modo, jugadores: [], max: 4 } }

io.on('connection', (socket) => {
    console.log("🟢 Conectado:", socket.id);

    // --- EVENTO: LOGIN ---
    socket.on('login', (user) => {
        // Validación para evitar sesiones duplicadas con el mismo nombre
        if (usuariosConectados[user]) {
            console.log(`🚫 Bloqueado: ${user} ya está conectado.`);
            socket.emit('loginError', 'Este piloto ya está en combate (sesión activa).');
            return;
        }

        socket.username = user;
        usuariosConectados[user] = socket.id;

        console.log(`🚀 ${user} ha entrado. Usuarios actuales:`, Object.keys(usuariosConectados));

        socket.emit('loginSuccess', user);
        io.emit('usuarios', Object.keys(usuariosConectados)); // Notifica lista global de pilotos
    });

    // --- EVENTO: CREAR SALA ---
    socket.on('crearSala', (data) => {
        const { host, modo } = data;
        if (!salas[host]) {
            salas[host] = { modo, jugadores: [{ nombre: host, listo: false }], max: 4 };
            socket.join(host);         // Crea un canal privado de socket para la sala
            socket.salaAsociada = host; // Vincula el socket a esta sala

            console.log(`🏠 Sala creada: [${host}] | Modo: ${modo}`);

            io.emit('listaSalas', salas);         // Actualiza lista para todos
            socket.emit('salaActualizada', salas[host]); // Actualiza vista del host
        }
    });

    // --- EVENTO: UNIRSE A SALA ---
    socket.on('unirseASala', (data) => {
        const { salaId, usuario } = data;
        const sala = salas[salaId];

        // Verifica si la sala existe, si hay espacio y si el usuario no está ya dentro
        if (sala && sala.jugadores.length < sala.max && !sala.jugadores.find(p => p.nombre === usuario)) {
            sala.jugadores.push({ nombre: usuario, listo: false });
            socket.join(salaId);
            socket.salaAsociada = salaId;

            console.log(`👤 [${usuario}] se unió a la sala de [${salaId}]`);
            console.log(`👥 Jugadores actuales en ${salaId}: ${sala.jugadores.join(', ')}`);

            io.emit('listaSalas', salas);
            io.to(salaId).emit('salaActualizada', sala); // Notifica solo a los de esa sala
        }
    });


    // --- EVENTO: ABANDONAR SALA ---
    socket.on('abandonarSala', () => {
        const usuario = socket.username;
        const salaId = socket.salaAsociada;

        if (salaId && salas[salaId]) {
            if (salaId === usuario) {
                // Si el que sale es el HOST: Se destruye la sala
                console.log(`🚫 Host [${usuario}] cerró la sala.`);
                delete salas[salaId];
                io.to(salaId).emit('salaCerrada');
                io.emit('listaSalas', salas);
            } else {
                // ERROR CORREGIDO AQUÍ: Filtrar comparando la propiedad .nombre
                salas[salaId].jugadores = salas[salaId].jugadores.filter(p => p.nombre !== usuario);

                socket.leave(salaId);
                console.log(`🏃 [${usuario}] salió de la sala de [${salaId}]`);

                io.to(salaId).emit('salaActualizada', salas[salaId]);
                io.emit('listaSalas', salas);
            }
            socket.salaAsociada = null;
        }
    });

    // Envía la lista de salas disponibles apenas alguien se conecta
    socket.emit('listaSalas', salas);

    // --- EVENTO: DESCONEXIÓN (Cerrar pestaña o pérdida de red) ---
    socket.on('disconnect', () => {
        if (socket.username) {
            if (socket.salaAsociada) {
                const salaId = socket.salaAsociada;
                if (salaId === socket.username) {
                    delete salas[salaId];
                    io.to(salaId).emit('salaCerrada');
                } else if (salas[salaId]) {
                    // ERROR CORREGIDO AQUÍ TAMBIÉN: Filtrar por p.nombre
                    salas[salaId].jugadores = salas[salaId].jugadores.filter(p => p.nombre !== socket.username);
                    io.to(salaId).emit('salaActualizada', salas[salaId]);
                }
                io.emit('listaSalas', salas);
            }
            delete usuariosConectados[socket.username];
            io.emit('usuarios', Object.keys(usuariosConectados));
            console.log(`🔴 ${socket.username} salió.`);
        }
    });

    // Dentro de socket.on('toggelListo', ...)
    socket.on('toggelListo', () => {
        const salaId = socket.salaAsociada;
        if (salaId && salas[salaId]) {
            const sala = salas[salaId];
            const jugador = sala.jugadores.find(p => p.nombre === socket.username);

            if (jugador) {
                jugador.listo = !jugador.listo;
                io.to(salaId).emit('salaActualizada', sala);

                // NUEVO: Verificar si todos están listos y son al menos 2
                const todosListos = sala.jugadores.every(p => p.listo === true);
                if (todosListos && sala.jugadores.length >= 2) {
                    console.log(`Lanzando juego en sala: ${salaId}`);
                    io.to(salaId).emit('iniciarJuego', sala.jugadores);
                }
            }
        }
    });

    // Dentro de io.on('connection', (socket) => { ... })
    socket.on('actualizarPosicion', (datos) => {
        const salaId = socket.salaAsociada;
        if (salaId) {
            socket.to(salaId).emit('jugadorMovido', {
                id: socket.username,
                pos: datos.pos,
                rot: datos.rot
            });
        }
    });


});

// ==========================================
// 5. INICIO DEL SERVIDOR
// ==========================================
server.listen(PORT, () => {
    console.log(`🚀 Sky Duel running on port ${PORT}`);
});