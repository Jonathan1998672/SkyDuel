import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, dron;
let keys = {};
let gameMode = "";
let animationId;
let paused = false;

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function saveSettings() {
    const name = document.getElementById("username").value;
    localStorage.setItem("username", name);
    alert("¡Configuración guardada!");
}

function startGame(mode) {
    gameMode = mode;
    document.getElementById("modeText").innerText = mode;
    showScreen("gameScreen");
    initGame();
}

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
    },
        (xhr) => { console.log((xhr.loaded / xhr.total * 100) + '% cargado'); },
        (error) => { console.error('Error al cargar el modelo:', error); });

    animate();
}

function animate() {
    animationId = requestAnimationFrame(animate);

    if (!paused) {

        if (dron) {
            if (keys["a"]) {
                if (dron.rotation.z <= 0.5) dron.rotation.z += 0.05;
                if (dron.position.x >= -3) dron.position.x -= 0.1;
            }
            else if (keys["d"]) {
                if (dron.rotation.z >= -0.5) dron.rotation.z -= 0.05;
                if (dron.position.x <= 3) dron.position.x += 0.1;
            }
            else {
                dron.position.x *= 0.9;
                dron.rotation.z *= 0.9;
            }
            if (keys["w"]) {
                if (dron.rotation.x <= 0.4) dron.rotation.x += 0.05;
                if (dron.position.y <= 3) dron.position.y += 0.1;
            }
            else if (keys["s"]) {
                if (dron.rotation.x >= -0.4) dron.rotation.x -= 0.05;
                if (dron.position.y >= -1) dron.position.y -= 0.1;
            }
            else {
                dron.position.y += (1 - dron.position.y) * 0.1;
                dron.rotation.x *= 0.9;
            }
        }

        renderer.render(scene, camera);
    }
}

window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === "Escape") {
        if (paused) resumeGame(); else pauseGame();
    }
});

document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

function pauseGame() {
    paused = true;
    document.getElementById("pauseMenu").classList.remove("hidden");
}

function resumeGame() {
    paused = false;
    document.getElementById("pauseMenu").classList.add("hidden");
}

function exitGame() {
    paused = false;
    cancelAnimationFrame(animationId);
    if (renderer) renderer.dispose();
    showScreen("mainMenu");
}

document.addEventListener("DOMContentLoaded", () => {
    window.showScreen = showScreen;
    window.startGame = startGame;
    window.saveSettings = saveSettings;
    window.pauseGame = pauseGame;
    window.resumeGame = resumeGame;
    window.exitGame = exitGame;
});