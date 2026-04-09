CREATE DATABASE sky_duel_db;
USE sky_duel_db;

-- 1. TABLA DE UISUARIOS
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    ruta_imagen VARCHAR(255) DEFAULT 'assets-pilotos/default.png',
    rango_carrera VARCHAR(30) DEFAULT 'RECLUTA',
    rango_combate VARCHAR(30) DEFAULT 'RECLUTA',
    puntos_carrera INT DEFAULT 0,
    puntos_combate INT DEFAULT 0;
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE ESTADISTICAS (Records Personales)
CREATE TABLE estadisticas_piloto (
    id_stats INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    mejor_tiempo_carrera INT,
    max_kills_combate INT DEFAULT 0,
    partidas_jugadas INT DEFAULT 0,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Tabla para los 10 mejores en Carreras (Menor tiempo)
CREATE TABLE top10_carreras (
    posicion INT PRIMARY KEY,
    id_usuario INT,
    nombre_usuario VARCHAR(50),
    mejor_tiempo INT,
    fecha_logro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- Tabla para los 10 mejores en Combate (Mas kills)
CREATE TABLE top10_combate (
    posicion INT PRIMARY KEY,
    id_usuario INT,
    nombre_usuario VARCHAR(50),
    max_kills INT,
    fecha_logro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

DELIMITER //

CREATE TRIGGER actualizar_rangos_piloto
AFTER UPDATE ON estadisticas_piloto
FOR EACH ROW
BEGIN
    UPDATE usuarios 
    SET rango_carrera = CASE 
        WHEN NEW.puntos_carrera >= 5000 THEN 'LEYENDA'
        WHEN NEW.puntos_carrera >= 2500 THEN 'ÉLITE'
        WHEN NEW.puntos_carrera >= 1000 THEN 'VETERANO'
        ELSE 'RECLUTA'
    END
    WHERE id_usuario = NEW.id_usuario;

    UPDATE usuarios 
    SET rango_combate = CASE 
        WHEN NEW.puntos_combate >= 5000 THEN 'LEYENDA'
        WHEN NEW.puntos_combate >= 2500 THEN 'ÉLITE'
        WHEN NEW.puntos_combate >= 1000 THEN 'VETERANO'
        ELSE 'RECLUTA'
    END
    WHERE id_usuario = NEW.id_usuario;
END //

DELIMITER ;

DELIMITER //

CREATE TRIGGER actualizar_top10_carreras
AFTER UPDATE ON estadisticas_piloto
FOR EACH ROW
BEGIN
    DELETE FROM top10_carreras;
    
    INSERT INTO top10_carreras (posicion, id_usuario, nombre_usuario, mejor_tiempo)
    SELECT 
        (@row_number:=@row_number + 1) AS posicion,
        e.id_usuario,
        u.nombre_usuario,
        e.mejor_tiempo_carrera
    FROM estadisticas_piloto e
    JOIN usuarios u ON e.id_usuario = u.id_usuario
    CROSS JOIN (SELECT @row_number:=0) AS t
    WHERE e.mejor_tiempo_carrera > 0
    ORDER BY e.mejor_tiempo_carrera ASC
    LIMIT 10;
END //

CREATE TRIGGER actualizar_top10_combate
AFTER UPDATE ON estadisticas_piloto
FOR EACH ROW
BEGIN
    DELETE FROM top10_combate;
    
    INSERT INTO top10_combate (posicion, id_usuario, nombre_usuario, max_kills)
    SELECT 
        (@row_number:=@row_number + 1) AS posicion,
        e.id_usuario,
        u.nombre_usuario,
        e.max_kills_combate
    FROM estadisticas_piloto e
    JOIN usuarios u ON e.id_usuario = u.id_usuario
    CROSS JOIN (SELECT @row_number:=0) AS t
    ORDER BY e.max_kills_combate DESC
    LIMIT 10;
END //

DELIMITER ;