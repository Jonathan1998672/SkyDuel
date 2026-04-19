import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, playerDrone; 
const keys = {};
let otrosJugadores = {};

const loader = new GLTFLoader();

window.init3DGame = function(jugadores) {
    const container = document.getElementById('game-canvas-container');
    if (!container) return;
    container.innerHTML = '';

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02060b);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 10, 7);
    scene.add(sunLight);

    const grid = new THREE.GridHelper(100, 50, 0x00ffff, 0x444444);
    scene.add(grid);

    loader.load('assets-modelos/dron.glb', (gltf) => {
        const droneMaster = gltf.scene;

        const escala = 6;
        const rotacionInicialY = Math.PI / 2;

        playerDrone = droneMaster.clone();
        playerDrone.scale.set(escala, escala, escala);
        playerDrone.rotation.y = rotacionInicialY; 
        scene.add(playerDrone);

        const miNombre = document.getElementById('connected-user-name').innerText;
        jugadores.forEach(p => {
            if (p.nombre !== miNombre) {
                const enemyDrone = droneMaster.clone();
                enemyDrone.scale.set(escala, escala, escala);
                enemyDrone.rotation.y = rotacionInicialY;
                scene.add(enemyDrone);
                otrosJugadores[p.nombre] = enemyDrone;
            }
        });

        animate();
    }, 
    (xhr) => { console.log((xhr.loaded / xhr.total * 100) + '% cargado'); },
    (error) => { console.error('Error al cargar el dron:', error); });

    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

    window.socket.on('jugadorMovido', (data) => {
        if (otrosJugadores[data.id]) {
            otrosJugadores[data.id].position.copy(data.pos);
            otrosJugadores[data.id].rotation.y = data.rot;
        }
    });
};

function animate() {
    requestAnimationFrame(animate);

    if (playerDrone) {
        let movido = false;
        const speed = 0.15;
        const rotationSpeed = 0.02;
        
        // Variables para la animación de inclinación
        const maxTilt = 0.4; // Qué tanto se inclina la nave (en radianes)
        let targetTilt = 0;  // El ángulo objetivo al que debe llegar

        // --- 3. Movimiento vertical (Arriba/Abajo) ---
        // Usamos Espacio para subir y Shift para bajar
        if (keys[' ']) { playerDrone.translateY(speed); movido = true; }
        if (keys['shift']) { playerDrone.translateY(-speed); movido = true; }

        // --- Movimiento estándar ---
        if (keys['w']) { playerDrone.translateZ(-speed); movido = true; }
        if (keys['s']) { playerDrone.translateZ(speed); movido = true; }
        if (keys['a']) { playerDrone.translateX(-speed); movido = true; }
        if (keys['d']) { playerDrone.translateX(speed); movido = true; }
        
        // --- 2. Rotación con animación de inclinación (Roll) ---
        if (keys['q']) { 
            playerDrone.rotation.y += rotationSpeed; 
            targetTilt = maxTilt; // Se inclina hacia la izquierda
            movido = true; 
        }
        else if (keys['e']) { 
            playerDrone.rotation.y -= rotationSpeed; 
            targetTilt = -maxTilt; // Se inclina hacia la derecha
            movido = true; 
        }

        // Aplicamos la inclinación suavemente usando la rotación Z (Roll)
        // Esto hace que la transición sea fluida y regrese a 0 cuando sueltas la tecla
        playerDrone.rotation.z += (targetTilt - playerDrone.rotation.z) * 0.1;

        // Emitimos la posición si se movió o si aún se está estabilizando de la inclinación
        if (movido || Math.abs(playerDrone.rotation.z) > 0.001) {
            window.socket.emit('actualizarPosicion', {
                pos: playerDrone.position,
                rot: playerDrone.rotation.y, 
                rotZ: playerDrone.rotation.z
            });
        }

        // --- 1. Cámara estilo cenital / inclinada ---
        // X = 0 (Centrada), Y = 15 (Más alta), Z = 6 (Más cerca de la parte trasera)
        const relativeCameraOffset = new THREE.Vector3(-1, 3, 3);
        const cameraOffset = relativeCameraOffset.applyMatrix4(playerDrone.matrixWorld);
        
        camera.position.lerp(cameraOffset, 0.1);
        camera.lookAt(playerDrone.position);
    }

    renderer.render(scene, camera);
}