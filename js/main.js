// js/main.js

export function showScreen(id) {
    // Quitar la clase active de todas las pantallas
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    // Activar la pantalla seleccionada
    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
    }

    // Cargar puntuaciones si es necesario
    if (id === 'scoreMenu') {
        loadScores('CARRERA');
    }
}

export function loadScores(filterMode = 'CARRERA') {
    const scoreBoard = document.getElementById("scoreBoard");
    const allScores = [
        { name: "GARUSHIA", mode: "COMBATE", points: 2500 },
        { name: "ACE_PILOT", mode: "CARRERA", points: 1800 }
    ];

    const filtered = allScores.filter(s => s.mode === filterMode);
    filtered.sort((a, b) => b.points - a.points);
    scoreBoard.innerHTML = "";
    filtered.forEach((s, index) => {
        scoreBoard.innerHTML += `<tr><td>${index + 1}</td><td>${s.name}</td><td>${s.points}</td></tr>`;
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText === filterMode);
    });
}

// Inicialización de música
function setRandomMenuMusic() {
    const musicPlayer = document.getElementById("bgMusic");
    const playlist = ["assets-audio/Menu1.mp3", "assets-audio/Menu2.mp3"];
    const randomIndex = Math.floor(Math.random() * playlist.length);
    musicPlayer.src = playlist[randomIndex];
    musicPlayer.load();
}

document.addEventListener("DOMContentLoaded", () => {
    setRandomMenuMusic();
    
    // Reproducir al primer clic del usuario (política de navegadores)
    document.body.addEventListener('click', () => {
        const music = document.getElementById("bgMusic");
        if (music.paused && music.src !== "") {
            music.volume = 0.4;
            music.play();
        }
    }, { once: true });
});

// HACER GLOBAL PARA EL HTML
window.showScreen = showScreen;
window.loadScores = loadScores;