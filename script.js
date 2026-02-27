import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, dron;
let keys = {}; 
let gameMode = ""; 
let animationId;
let paused = false;
let settingsOrigin = "mainMenu";

function showScreen(id) {
    if (id === 'settingsMenu' && settingsOrigin === 'gameScreen') {
        document.querySelectorAll('.screen').forEach(s => {
            if (s.id !== 'gameScreen' && s.id !== id) s.classList.remove('active');
        });
    } else {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    }

    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
    }

    if (id === 'scoreMenu') {
        loadScores('CARRERA');
    }
}

// inicio de sesion
function handleLogin() {
    const user = document.getElementById("loginUser").value;
    const pass = document.getElementById("loginPass").value;

    if (user.trim() !== "" && pass.trim() !== "") {
        document.getElementById("currentUserName").innerText = user.toUpperCase();
        const displayUser = document.getElementById("displayUser");
        if(displayUser) displayUser.innerText = user.toUpperCase();

        document.getElementById("userDisplay").classList.remove("hidden");
        showScreen('mainMenu');
    } else {
        alert("¡Error de acceso! Ingresa tus credenciales.");
    }
}

// Maneja el registro de nuevos usuarios
function handleRegister() {
    const user = document.getElementById("regUser").value;
    if (user) {
        alert("¡Usuario " + user + " registrado!");
        showScreen('authMenu');
    }
}

// Cierra la sesion actual
function logout() {
    if(confirm("¿Estás seguro de que quieres cerrar sesión, Piloto?")) {
        document.getElementById("userDisplay").classList.add("hidden");
        document.getElementById("loginUser").value = "";
        document.getElementById("loginPass").value = "";
        showScreen('authMenu');
    }
}

// Cambia entre las pestañas (Cuenta/Audio) dentro de Configuración
function showSettingsSection(sectionId) {
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(sectionId).classList.add('active');
    if(event) event.currentTarget.classList.add('active');
}

// Actualiza el volumen de la musica de fondo
function updateVolume() {
    const music = document.getElementById("bgMusic");
    const vol = document.getElementById("musicVol").value;
    music.volume = vol;
}

// Elige una cancion al azar para el menu
function setRandomMenuMusic() {
    const musicPlayer = document.getElementById("bgMusic");
    const playlist = [
        "assets-audio/Menu1.mp3",
        "assets-audio/Menu2.mp3"
    ];
    const randomIndex = Math.floor(Math.random() * playlist.length);
    musicPlayer.src = playlist[randomIndex];
    musicPlayer.load();
}

// Abre los ajustes desde el menu de pausa del juego
function openSettingsFromGame() {
    settingsOrigin = "gameScreen";
    document.body.classList.add('in-game-settings');
    document.getElementById("pauseMenu").classList.add("hidden");
    showScreen('settingsMenu');
}

// Botón Volver de Configuracion
function backFromSettings() {
    if (settingsOrigin === "gameScreen") {
        const settings = document.getElementById('settingsMenu');
        settings.classList.remove('active');
        document.body.classList.remove('in-game-settings');
        document.getElementById("pauseMenu").classList.remove("hidden");
        document.getElementById("gameCanvas").focus();
    } else {
        document.body.classList.remove('in-game-settings');
        showScreen('mainMenu');
    }
}

// Carga  de las puntuaciones de la tabla (En un futuro que los datos se carguen desde la BD)
function loadScores(filterMode = 'CARRERA') {
    const scoreBoard = document.getElementById("scoreBoard");
    
    const allScores = [
        { name: "GARUSHIA", mode: "COMBATE", points: 2500 },
        { name: "ACE_PILOT", mode: "CARRERA", points: 1800 },
        { name: "NEON_X", mode: "COMBATE", points: 1200 },
        { name: "DRONE_MASTER", mode: "CARRERA", points: 2100 }
    ];

    const filtered = allScores.filter(s => s.mode === filterMode);
    filtered.sort((a, b) => b.points - a.points);

    scoreBoard.innerHTML = "";
    filtered.forEach((s, index) => {
        const row = `
            <tr>
                <td>${index + 1}</td>
                <td>${s.name}</td>
                <td>${s.points}</td>
            </tr>
        `;
        scoreBoard.innerHTML += row;
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText === filterMode);
    });
}

// (THREE.JS)

// Inicializa la interfaz de juego según el modo (Carrera o Combate)
function startGame(mode) {
    gameMode = mode;
    document.getElementById("modeText").innerText = mode.toUpperCase();
    
    const statsInfo = document.getElementById("statsInfo");
    const dynamicBar = document.getElementById("dynamicBar");
    
    if (mode === 'race') {
        statsInfo.innerText = "VUELTAS: 0/3";
        dynamicBar.src = "assets-imagenes/BarraTurbo.png";
    } else if (mode === 'combat') {
        statsInfo.innerText = "MUNICIÓN: 50";
        dynamicBar.src = "assets-imagenes/BarraVida.png";
    }

    document.getElementById("userDisplay").classList.add("hidden");
    showScreen("gameScreen");

    const music = document.getElementById("bgMusic");
    if(music) music.pause();
    
    initGame();
}

// Crea la escena 3D, cámara, luces y carga el dron 
//(Solo falta poner el escnario 3d en un futuro y el movimiento de camara por la escena)
function initGame() {
    const canvas = document.getElementById("gameCanvas");
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0535);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 8);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x47a3c0, 2);
    sunLight.position.set(5, 10, 5);
    scene.add(sunLight);

    const loader = new GLTFLoader();
    loader.load('assets-modelos/dron.glb', function (gltf) {
        dron = gltf.scene;
        dron.scale.set(6, 6, 6);
        dron.position.y = 1;
        scene.add(dron);
    });

    animate();
}

// Bucle de renderizado y fisica del dron
function animate() {
    animationId = requestAnimationFrame(animate);
    if (!paused) {
        if (dron) {
            if (keys["a"]) {
                if (dron.rotation.z <= 0.5) dron.rotation.z += 0.05;
                if (dron.position.x >= -3) dron.position.x -= 0.1;
            } else if (keys["d"]) {
                if (dron.rotation.z >= -0.5) dron.rotation.z -= 0.05;
                if (dron.position.x <= 3) dron.position.x += 0.1;
            } else {
                dron.position.x *= 0.9;
                dron.rotation.z *= 0.9;
            }

            if (keys["w"]) {
                if (dron.rotation.x <= 0.4) dron.rotation.x += 0.05;
                if (dron.position.y <= 3) dron.position.y += 0.1;
            } else if (keys["s"]) {
                if (dron.rotation.x >= -0.4) dron.rotation.x -= 0.05;
                if (dron.position.y >= -1) dron.position.y -= 0.1;
            } else {
                dron.position.y += (1 - dron.position.y) * 0.1;
                dron.rotation.x *= 0.9;
            }
        }
        renderer.render(scene, camera);
    }
}

// Detiene el movimiento del dron y muestra el menu de pausa
function pauseGame() {
    paused = true;
    document.getElementById("pauseMenu").classList.remove("hidden");
}

// Reanuda el movimiento del dron
function resumeGame() {
    paused = false;
    document.getElementById("pauseMenu").classList.add("hidden");
    document.getElementById("gameCanvas").focus();
}

// Limpia la escena 3D y regresa al menu principal
function exitGame() {
    paused = false;
    settingsOrigin = "mainMenu";
    document.body.classList.remove('in-game-settings');
    
    cancelAnimationFrame(animationId);
    if (renderer) renderer.dispose();
    
    const pauseMenu = document.getElementById("pauseMenu");
    if (pauseMenu) pauseMenu.classList.add("hidden");
    
    document.getElementById("userDisplay").classList.remove("hidden");
    showScreen("mainMenu");
}

// MANEJO DE EVENTOS (TECLADO Y VENTANA)

window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    
    if (e.key === "Tab") {
        e.preventDefault(); 
        if (paused) resumeGame(); else pauseGame();
    }
});

document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

document.addEventListener("DOMContentLoaded", () => {
    window.showScreen = showScreen;
    window.startGame = startGame;
    window.pauseGame = pauseGame;
    window.resumeGame = resumeGame;
    window.exitGame = exitGame;
    window.handleLogin = handleLogin;
    window.handleRegister = handleRegister;
    window.showSettingsSection = showSettingsSection;
    window.updateVolume = updateVolume;
    window.logout = logout;
    window.loadScores = loadScores;
    window.openSettingsFromGame = openSettingsFromGame;
    window.backFromSettings = backFromSettings;

    setRandomMenuMusic();

    document.body.addEventListener('click', () => {
        const music = document.getElementById("bgMusic");
        if (music.paused && music.src !== "") {
            music.volume = 0.4;
            music.play();
        }
    }, { once: true });
});