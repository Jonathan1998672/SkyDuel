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
        const rotacionInicialY = 0;

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
        const rotationSpeed = 0.05;

        if (keys['w']) { playerDrone.translateZ(-speed); movido = true; }
        if (keys['s']) { playerDrone.translateZ(speed); movido = true; }
        if (keys['a']) { playerDrone.translateX(-speed); movido = true; }
        if (keys['d']) { playerDrone.translateX(speed); movido = true; }
        
        if (keys['q']) { playerDrone.rotation.y += rotationSpeed; movido = true; }
        if (keys['e']) { playerDrone.rotation.y -= rotationSpeed; movido = true; }

        if (movido) {
            window.socket.emit('actualizarPosicion', {
                pos: playerDrone.position,
                rot: playerDrone.rotation.y
            });
        }

        const relativeCameraOffset = new THREE.Vector3(0, 5, 10);
        const cameraOffset = relativeCameraOffset.applyMatrix4(playerDrone.matrixWorld);
        
        camera.position.lerp(cameraOffset, 0.1);
        camera.lookAt(playerDrone.position);
    }

    renderer.render(scene, camera);
}