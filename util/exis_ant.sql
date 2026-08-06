-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 06-08-2026 a las 10:39:48
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

--
-- Volcado de datos para la tabla `estadisticas_jugador`
--

INSERT INTO `estadisticas_jugador` (`id_jugador`, `puntos_totales`, `dulces_totales`, `partidas_jugadas`, `partidas_ganadas`, `fecha_ultima_partida`) VALUES
(1, 0, 0, 0, 0, '2026-08-05 22:46:31'),
(2, 0, 0, 0, 0, '2026-08-05 22:53:17'),
(3, 0, 0, 0, 0, '2026-08-05 23:13:10'),
(4, 0, 0, 0, 0, '2026-08-05 23:35:16'),
(6, 80, 8, 0, 0, '2026-08-05 23:46:16'),
(10, 190, 19, 0, 0, '2026-08-06 00:41:54'),
(11, 40, 4, 0, 0, '2026-08-06 01:22:46'),
(12, 60, 6, 1, 1, '2026-08-06 01:27:43'),
(13, 0, 0, 0, 0, '2026-08-06 01:35:14'),
(14, 0, 0, 0, 0, '2026-08-06 01:36:33'),
(15, 0, 0, 1, 1, '2026-08-06 02:32:00'),
(16, 50, 5, 0, 0, '2026-08-06 02:35:28'),
(17, 20, 2, 0, 0, '2026-08-06 02:37:01'),
(18, 0, 0, 0, 0, '2026-08-06 02:40:05'),
(19, 0, 0, 0, 0, '2026-08-06 02:40:11'),
(20, 20, 2, 0, 0, '2026-08-06 02:41:47'),
(21, 20, 2, 0, 0, '2026-08-06 02:42:52'),
(22, 0, 0, 1, 1, '2026-08-06 02:45:53'),
(25, 0, 0, 0, 0, '2026-08-06 02:47:34'),
(26, 0, 0, 0, 0, '2026-08-06 02:49:20'),
(27, 0, 0, 1, 1, '2026-08-06 02:55:07'),
(28, 0, 0, 0, 0, '2026-08-06 03:00:47'),
(29, 60, 6, 1, 1, '2026-08-06 03:11:23'),
(30, 0, 0, 0, 0, '2026-08-06 03:11:48'),
(33, 70, 7, 1, 1, '2026-08-06 03:33:07');

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

--
-- Volcado de datos para la tabla `jugadores`
--

INSERT INTO `jugadores` (`id_jugador`, `nombre_usuario`, `fecha_registro`) VALUES
(1, 'zxc', '2026-08-05 22:46:31'),
(2, 'asdas', '2026-08-05 22:53:17'),
(3, 'oso6285', '2026-08-05 23:13:10'),
(4, 'gavan9', '2026-08-05 23:35:16'),
(6, 'galipiar4377', '2026-08-05 23:44:14'),
(10, 'numeros3460', '2026-08-05 23:50:19'),
(11, 'chigui6425', '2026-08-06 01:22:28'),
(12, 'gavan9938', '2026-08-06 01:24:43'),
(13, 'chigui5370', '2026-08-06 01:35:14'),
(14, 'oso4188', '2026-08-06 01:36:33'),
(15, 'numeros3494', '2026-08-06 02:29:15'),
(16, 'princesa5923', '2026-08-06 02:35:04'),
(17, 'numeros3021', '2026-08-06 02:36:48'),
(18, 'numeros8735', '2026-08-06 02:40:05'),
(19, 'numeros1304', '2026-08-06 02:40:11'),
(20, 'chigui2223', '2026-08-06 02:40:37'),
(21, 'rey3129', '2026-08-06 02:42:32'),
(22, 'gavan6737', '2026-08-06 02:43:37'),
(25, 'unitropico2919', '2026-08-06 02:47:34'),
(26, 'galipiar2546', '2026-08-06 02:49:20'),
(27, 'galipiar7548', '2026-08-06 02:49:50'),
(28, 'chigui6829', '2026-08-06 03:00:47'),
(29, 'princesa3184', '2026-08-06 03:06:08'),
(30, 'numeros2228', '2026-08-06 03:11:48'),
(33, 'oso6254', '2026-08-06 03:25:30');

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

--
-- Volcado de datos para la tabla `participaciones_partida`
--

INSERT INTO `participaciones_partida` (`id_participacion`, `id_partida`, `id_jugador`, `puntos_partida`, `dulces_obtenidos`, `posicion_final`) VALUES
(1, 1, 12, 60, 6, 1),
(2, 2, 15, 0, 0, 1),
(3, 3, 22, 0, 0, 1),
(4, 4, 27, 0, 0, 1),
(5, 5, 29, 60, 6, 1),
(6, 6, 33, 20, 2, 1);

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

--
-- Volcado de datos para la tabla `partidas`
--

INSERT INTO `partidas` (`id_partida`, `id_sala`, `fecha_inicio`, `fecha_fin`) VALUES
(1, 1, '2026-08-06 01:27:43', '2026-08-06 01:27:43'),
(2, 1, '2026-08-06 02:32:00', '2026-08-06 02:32:00'),
(3, 1, '2026-08-06 02:45:53', '2026-08-06 02:45:53'),
(4, 1, '2026-08-06 02:55:07', '2026-08-06 02:55:07'),
(5, 1, '2026-08-06 03:11:23', '2026-08-06 03:11:23'),
(6, 1, '2026-08-06 03:33:07', '2026-08-06 03:33:07');

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
(1, 'Concentración de Reinos', 3, '2026-08-05 23:27:44');

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
  MODIFY `id_jugador` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT de la tabla `participaciones_partida`
--
ALTER TABLE `participaciones_partida`
  MODIFY `id_participacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `partidas`
--
ALTER TABLE `partidas`
  MODIFY `id_partida` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `salas`
--
ALTER TABLE `salas`
  MODIFY `id_sala` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
