export function handleLogin() {
    const user = document.getElementById("loginUser").value;
    const pass = document.getElementById("loginPass").value;

    if (user.trim() !== "" && pass.trim() !== "") {
        document.getElementById("currentUserName").innerText = user.toUpperCase();
        const displayUser = document.getElementById("displayUser");
        if(displayUser) displayUser.innerText = user.toUpperCase();

        document.getElementById("userDisplay").classList.remove("hidden");
        window.showScreen('mainMenu');
    } else {
        alert("¡Error de acceso! Ingresa tus credenciales.");
    }
}

export function handleRegister() {
    const user = document.getElementById("regUser").value;
    if (user) {
        alert("¡Usuario " + user + " registrado!");
        window.showScreen('authMenu');
    }
}

export function logout() {
    if(confirm("¿Estás seguro de que quieres cerrar sesión, Piloto?")) {
        document.getElementById("userDisplay").classList.add("hidden");
        document.getElementById("loginUser").value = "";
        document.getElementById("loginPass").value = "";
        window.showScreen('authMenu');
    }
}

window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;

//en el registro has que si no selecciono una imagen pues que no guarde la ruta de la imagen porque por default ya guarda la imagen default.png
//pero si selecciona una imagen entonces que la imagen seleccionada la recorte en cuadrado y lo gaurde con un tamaño de 800 x 800 con su nombre en formato .png 

//las validaciones que solo sea que no se repita el nombre de usuario y las validaciones basicas de la contraseña 