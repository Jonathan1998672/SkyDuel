let scene, camera, renderer, cube;
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
    alert("Guardado!");
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
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({canvas});
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({color: 0x00ffff});
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const light = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(light);

    camera.position.z = 5;

    animate();
}

function animate() {
    if (!paused) {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;

        if (keys["w"]) cube.position.z -= 0.1;
        if (keys["s"]) cube.position.z += 0.1;
        if (keys["a"]) cube.position.x -= 0.1;
        if (keys["d"]) cube.position.x += 0.1;

        renderer.render(scene, camera);
    }

    animationId = requestAnimationFrame(animate);
}

document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === "Escape") pauseGame();
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
    cancelAnimationFrame(animationId);
    showScreen("mainMenu");
}