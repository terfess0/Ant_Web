-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 06-08-2026 a las 11:51:25
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `exis_ant`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estadisticas_jugador`
--

CREATE TABLE `estadisticas_jugador` (
  `id_jugador` int(11) NOT NULL,
  `puntos_totales` int(11) DEFAULT 0,
  `dulces_totales` int(11) DEFAULT 0,
  `partidas_jugadas` int(11) DEFAULT 0,
  `partidas_ganadas` int(11) DEFAULT 0,
  `fecha_ultima_partida` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_guardiana`
--

CREATE TABLE `estado_guardiana` (
  `id_estado_guardiana` int(11) NOT NULL,
  `descripcion` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estado_guardiana`
--

INSERT INTO `estado_guardiana` (`id_estado_guardiana`, `descripcion`) VALUES
(1, 'despierta'),
(2, 'durmiendo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_hormiga`
--

CREATE TABLE `estado_hormiga` (
  `id_estado_hormiga` int(11) NOT NULL,
  `descripcion` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estado_hormiga`
--

INSERT INTO `estado_hormiga` (`id_estado_hormiga`, `descripcion`) VALUES
(4, 'expulsada'),
(2, 'moviendo'),
(1, 'patrulla'),
(3, 'retorno');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_sala`
--

CREATE TABLE `estado_sala` (
  `id_estado_sala` int(11) NOT NULL,
  `descripcion` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estado_sala`
--

INSERT INTO `estado_sala` (`id_estado_sala`, `descripcion`) VALUES
(2, 'en_juego'),
(1, 'esperando'),
(3, 'finalizada'),
(4, 'llena');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `jugadores`
--

CREATE TABLE `jugadores` (
  `id_jugador` int(11) NOT NULL,
  `nombre_usuario` varchar(50) NOT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `participaciones_partida`
--

CREATE TABLE `participaciones_partida` (
  `id_participacion` int(11) NOT NULL,
  `id_partida` int(11) NOT NULL,
  `id_jugador` int(11) NOT NULL,
  `puntos_partida` int(11) DEFAULT 0,
  `dulces_obtenidos` int(11) DEFAULT 0,
  `posicion_final` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `partidas`
--

CREATE TABLE `partidas` (
  `id_partida` int(11) NOT NULL,
  `id_sala` int(11) NOT NULL,
  `fecha_inicio` datetime DEFAULT current_timestamp(),
  `fecha_fin` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `salas`
--

CREATE TABLE `salas` (
  `id_sala` int(11) NOT NULL,
  `nombre_sala` varchar(50) NOT NULL,
  `id_estado_sala` int(11) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `salas`
--

INSERT INTO `salas` (`id_sala`, `nombre_sala`, `id_estado_sala`, `fecha_creacion`) VALUES
(1, 'Concentración de Reinos', 1, '2026-08-05 23:27:44'),
(2, 'La Dulcería', 1, '2026-08-06 04:32:54'),
(3, 'El Gran Hormiguero', 1, '2026-08-06 04:32:54'),
(4, 'Camino de Azúcar', 1, '2026-08-06 04:32:54'),
(5, 'Guerra de Reinas', 1, '2026-08-06 04:32:54'),
(6, 'Túneles Oscuros', 1, '2026-08-06 04:32:54'),
(7, 'Valle de las Migajas', 1, '2026-08-06 04:32:54'),
(8, 'Montaña de Caramelo', 1, '2026-08-06 04:32:54'),
(9, 'Jardín Prohibido', 1, '2026-08-06 04:32:54'),
(10, 'El Imperio Subterráneo', 1, '2026-08-06 04:32:54'),
(11, 'Fiebre del Azúcar', 1, '2026-08-06 04:32:54');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `estadisticas_jugador`
--
ALTER TABLE `estadisticas_jugador`
  ADD PRIMARY KEY (`id_jugador`);

--
-- Indices de la tabla `estado_guardiana`
--
ALTER TABLE `estado_guardiana`
  ADD PRIMARY KEY (`id_estado_guardiana`),
  ADD UNIQUE KEY `descripcion` (`descripcion`);

--
-- Indices de la tabla `estado_hormiga`
--
ALTER TABLE `estado_hormiga`
  ADD PRIMARY KEY (`id_estado_hormiga`),
  ADD UNIQUE KEY `descripcion` (`descripcion`);

--
-- Indices de la tabla `estado_sala`
--
ALTER TABLE `estado_sala`
  ADD PRIMARY KEY (`id_estado_sala`),
  ADD UNIQUE KEY `descripcion` (`descripcion`);

--
-- Indices de la tabla `jugadores`
--
ALTER TABLE `jugadores`
  ADD PRIMARY KEY (`id_jugador`),
  ADD UNIQUE KEY `nombre_usuario` (`nombre_usuario`);

--
-- Indices de la tabla `participaciones_partida`
--
ALTER TABLE `participaciones_partida`
  ADD PRIMARY KEY (`id_participacion`),
  ADD UNIQUE KEY `uq_partida_jugador` (`id_partida`,`id_jugador`),
  ADD KEY `id_jugador` (`id_jugador`);

--
-- Indices de la tabla `partidas`
--
ALTER TABLE `partidas`
  ADD PRIMARY KEY (`id_partida`),
  ADD KEY `id_sala` (`id_sala`);

--
-- Indices de la tabla `salas`
--
ALTER TABLE `salas`
  ADD PRIMARY KEY (`id_sala`),
  ADD KEY `id_estado_sala` (`id_estado_sala`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `estado_guardiana`
--
ALTER TABLE `estado_guardiana`
  MODIFY `id_estado_guardiana` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `estado_hormiga`
--
ALTER TABLE `estado_hormiga`
  MODIFY `id_estado_hormiga` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `estado_sala`
--
ALTER TABLE `estado_sala`
  MODIFY `id_estado_sala` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `jugadores`
--
ALTER TABLE `jugadores`
  MODIFY `id_jugador` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `participaciones_partida`
--
ALTER TABLE `participaciones_partida`
  MODIFY `id_participacion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `partidas`
--
ALTER TABLE `partidas`
  MODIFY `id_partida` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `salas`
--
ALTER TABLE `salas`
  MODIFY `id_sala` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `estadisticas_jugador`
--
ALTER TABLE `estadisticas_jugador`
  ADD CONSTRAINT `estadisticas_jugador_ibfk_1` FOREIGN KEY (`id_jugador`) REFERENCES `jugadores` (`id_jugador`) ON DELETE CASCADE;

--
-- Filtros para la tabla `participaciones_partida`
--
ALTER TABLE `participaciones_partida`
  ADD CONSTRAINT `participaciones_partida_ibfk_1` FOREIGN KEY (`id_partida`) REFERENCES `partidas` (`id_partida`) ON DELETE CASCADE,
  ADD CONSTRAINT `participaciones_partida_ibfk_2` FOREIGN KEY (`id_jugador`) REFERENCES `jugadores` (`id_jugador`) ON DELETE CASCADE;

--
-- Filtros para la tabla `partidas`
--
ALTER TABLE `partidas`
  ADD CONSTRAINT `partidas_ibfk_1` FOREIGN KEY (`id_sala`) REFERENCES `salas` (`id_sala`);

--
-- Filtros para la tabla `salas`
--
ALTER TABLE `salas`
  ADD CONSTRAINT `salas_ibfk_1` FOREIGN KEY (`id_estado_sala`) REFERENCES `estado_sala` (`id_estado_sala`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
