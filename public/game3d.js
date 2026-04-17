let scene, camera, renderer, playerCube;
const keys = {};
let otrosJugadores = {};

function init3DGame(jugadores) {
    // 1. Escena y Cámara
    const container = document.getElementById('game-canvas-container');
    container.innerHTML = '';

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02060b);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // 2. Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 3. Suelo (Grid)
    const grid = new THREE.GridHelper(100, 50, 0x00ffff, 0x444444);
    scene.add(grid);

    // 4. Crear mi cubo (Jugador Local)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: false });
    playerCube = new THREE.Mesh(geometry, material);
    scene.add(playerCube);

    // Luces básicas
    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00ffff, 2, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

    const miNombre = document.getElementById('connected-user-name').innerText;
    jugadores.forEach(p => {
        if (p.nombre !== miNombre) {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
            const cube = new THREE.Mesh(geometry, material);
            scene.add(cube);
            otrosJugadores[p.nombre] = cube;
        }
    });

    socket.on('jugadorMovido', (data) => {
        if (otrosJugadores[data.id]) {
            otrosJugadores[data.id].position.copy(data.pos);
            otrosJugadores[data.id].rotation.y = data.rot;
        }
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    if (playerCube) {
        let movido = false;
        const speed = 0.1;
        const rotationSpeed = 0.05;

        if (keys['w']) { playerCube.translateZ(-speed); movido = true; }
        if (keys['s']) { playerCube.translateZ(speed); movido = true; }
        if (keys['a']) { playerCube.translateX(-speed); movido = true; }
        if (keys['d']) { playerCube.translateX(speed); movido = true; }
        if (keys['q']) { playerCube.rotation.y += rotationSpeed; movido = true; }
        if (keys['e']) { playerCube.rotation.y -= rotationSpeed; movido = true; }

        if (movido) {
            socket.emit('actualizarPosicion', {
                pos: playerCube.position,
                rot: playerCube.rotation.y
            });
        }

        camera.position.lerp(new THREE.Vector3(
            playerCube.position.x,
            playerCube.position.y + 5,
            playerCube.position.z + 10
        ), 0.1);
    }

    renderer.render(scene, camera);
}