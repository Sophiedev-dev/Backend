-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mar. 22 avr. 2025 à 18:14
-- Version du serveur : 10.4.28-MariaDB
-- Version de PHP : 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `bankmemo`
--

-- --------------------------------------------------------

--
-- Structure de la table `admin`
--

CREATE TABLE `admin` (
  `id_admin` int(11) NOT NULL,
  `name` varchar(256) NOT NULL,
  `surname` varchar(256) NOT NULL,
  `phonenumber` varchar(15) NOT NULL,
  `email` varchar(200) NOT NULL,
  `password` varchar(256) NOT NULL,
  `id_role` int(11) NOT NULL,
  `private_key` text DEFAULT NULL,
  `public_key` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `admin`
--

INSERT INTO `admin` (`id_admin`, `name`, `surname`, `phonenumber`, `email`, `password`, `id_role`, `private_key`, `public_key`) VALUES
(1, 'admin', 'admin', '699889988', 'admin@gmail.com', '$2b$10$cGbGJJ44.ps.WT29S4aoyOtB0/5acrHG8lXlIjaqvx/CChs7OwAve', 1, '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDbjm89DKMnGwW8\nRlO6zxd/AAkvz/wKgob63X4TOmRF2ntJnDJKEMN1vgqtF0vlrd5E7a6OOFfOiCfM\nM+mqjkvQLdhZ1H1+5bIVMwF5A74sHKtXzWODg47UFaBBmr6OpKgE/9MEYgWvcJZi\ngaa72a3sYt9Is5Sk/pcXsrRV6WdW0F/YIlmmK8hAhyJPtKaH25V0whjxrgG6AChS\n/l0a4UKMwlX4w7SEAPiP4G4z2kD8mO9ed/q+Rk/oX9CT5RHz46wjSdq4Xaqg7zCc\n90seeWxRFOTgzbIeuatIZx3dYWrNyZOptcZ5dFdl7sPEdjFeE0foN12ezrio3fxi\nMC5Z+M7TAgMBAAECggEANi2TrZDswb2dULRZ/QMVXTV5Dt9X5pAHFuiJL9182O/s\n9GEi17wDP47Bu6zAAdFBw+iS5m1o3YIjr/QvePLcKmbluGUDAslThH+toVsXFnOM\npIH+SHmySQt9HDM/Spu/ClzGiZJWrNAvi+dKaZhxnp9XUe1ehMh+KE7kyT5rTbRw\nXQLfdBjR9Hjn+M923ZsaWix10njOY1nutHzLxIS2M4UWgkRxqbtryPYW6zCeEPom\neeBIyhqD1xaoCIkTXEtzQ6lidlj8Q+89sVkAUV2mHYccIGF+8QXIrCSlseWnibEK\nRQrYfBsH5tmxkUjRAAoz16xmQwX40P7qjxYCZVAaoQKBgQD/fCGnXQBup/B0RP3H\ncGmJgOLyx5kiwVGsTdzIdiuiUqE5j/+3z/pakQUWz98DUTSjj8C9m41wnWqkTFsL\nrEN8jeS98fKlZMguvTZzKrPz7RfR9zkXYEaIXF0qqYZLWi6agZxVVxjJFbM7lWTW\neP6Djjve0QIl7Gfw7A9mtxJX1QKBgQDb/8IxYk2Ciw5o3rdiFRJO/NGJFgfwssWg\ndCNJRclGb8WlUNjyaTqD1q7EN1lADOZtDLmaTcpRTjX2aFIttL5la0cAifTzrlMt\nroL0SCUXNV28fVeTS7Qjdh4Oc/IFkHhGX4yoro3lB/W/WeWxH0jBB3k3g/cQH/Cj\nVTFoy3LIBwKBgQCqziuVwAi08lRA94sPVmlIg8G2/Ji18rcO0jOEVfTQHhwp5srY\n8hP3jrLvUGRRzG272DTMzv1dx/BvDZllEXNBB4BhOSu3RczL6rZHgsoyj1V4i6dA\nqJ4fNlkXV6UwJYe4xmRlbchlT7u3Xya+eL/35hTC38tm3UmUec3GJyj9TQKBgCpB\nmd86boDgjMf/32FrgrTBQs39+VB2Rhdnt09fpCVvWptCSClnpOGl3rO5nd77m1be\n1teYkX/EcgD+UKqOyPNaA61K0k3r8fYYSvb41Ib8rSCDQsr8A4G8MlG8W4ROF4wM\n1kugG4keWkmCzueShrrs4I+VPWNPfz0gI/lo+ocJAoGBAMyNiaTSVUJ3JS/X9xpT\njsawRbQzp1x2DfLZmd4RLVBA34hggboUA3Kr86OlJnvvP7HvJ0MUycZzPLtancA5\n2dSJ5TswqTl8XjQrRU6dYywcpmzxkd6qJFeLqaDHovqstCU0ENqjNjH+26f5GgRD\nI793WJpnivn0vFCLYQ+BEH8W\n-----END PRIVATE KEY-----\n', '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA245vPQyjJxsFvEZTus8X\nfwAJL8/8CoKG+t1+EzpkRdp7SZwyShDDdb4KrRdL5a3eRO2ujjhXzognzDPpqo5L\n0C3YWdR9fuWyFTMBeQO+LByrV81jg4OO1BWgQZq+jqSoBP/TBGIFr3CWYoGmu9mt\n7GLfSLOUpP6XF7K0VelnVtBf2CJZpivIQIciT7Smh9uVdMIY8a4BugAoUv5dGuFC\njMJV+MO0hAD4j+BuM9pA/JjvXnf6vkZP6F/Qk+UR8+OsI0nauF2qoO8wnPdLHnls\nURTk4M2yHrmrSGcd3WFqzcmTqbXGeXRXZe7DxHYxXhNH6Dddns64qN38YjAuWfjO\n0wIDAQAB\n-----END PUBLIC KEY-----\n');

-- --------------------------------------------------------

--
-- Structure de la table `app_settings`
--

CREATE TABLE `app_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `app_settings`
--

INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `created_at`, `updated_at`) VALUES
(1, 'similarity_warning_threshold', '60', '2025-03-02 18:57:35', '2025-03-05 07:29:34'),
(2, 'similarity_danger_threshold', '70', '2025-03-02 18:57:35', '2025-03-05 07:29:34');

-- --------------------------------------------------------

--
-- Structure de la table `comparison_results`
--

CREATE TABLE `comparison_results` (
  `id` int(11) NOT NULL,
  `memoire_id` int(11) NOT NULL,
  `results_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`results_json`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `comparison_results`
--

INSERT INTO `comparison_results` (`id`, `memoire_id`, `results_json`, `created_at`) VALUES
(10, 57, '[{\"id_memoire\":33,\"libelle\":\"BI\",\"similarity\":57.94},{\"id_memoire\":35,\"libelle\":\"BBL\",\"similarity\":57.94},{\"id_memoire\":37,\"libelle\":\"Gestion des Requets\",\"similarity\":57.94}]', '2025-03-16 16:19:26'),
(13, 60, '[{\"id_memoire\":57,\"libelle\":\"Architecture\",\"similarity\":65.87},{\"id_memoire\":33,\"libelle\":\"BI\",\"similarity\":54.51},{\"id_memoire\":35,\"libelle\":\"BBL\",\"similarity\":54.51},{\"id_memoire\":37,\"libelle\":\"Gestion des Requets\",\"similarity\":54.51}]', '2025-03-17 20:18:26'),
(20, 67, '[]', '2025-04-21 12:45:49');

-- --------------------------------------------------------

--
-- Structure de la table `deleted_users`
--

CREATE TABLE `deleted_users` (
  `id_etudiant` int(11) NOT NULL,
  `name` varchar(256) DEFAULT NULL,
  `surname` varchar(256) DEFAULT NULL,
  `email` varchar(256) DEFAULT NULL,
  `password` varchar(256) DEFAULT NULL,
  `phonenumber` varchar(15) DEFAULT NULL,
  `university` varchar(256) DEFAULT NULL,
  `faculty` varchar(256) DEFAULT NULL,
  `speciality` varchar(256) DEFAULT NULL,
  `id_role` int(11) DEFAULT NULL,
  `deleted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `deleted_users`
--

INSERT INTO `deleted_users` (`id_etudiant`, `name`, `surname`, `email`, `password`, `phonenumber`, `university`, `faculty`, `speciality`, `id_role`, `deleted_at`) VALUES
(11, 'DEGA', 'DEGA', 'karel@gamil.com', 'DEGA', NULL, NULL, NULL, NULL, NULL, '2025-02-13 13:28:43'),
(14, 'jj', 'jj', 'jj@gmail.com', 'jj', NULL, NULL, NULL, NULL, NULL, '2025-02-11 16:39:20'),
(20, 'jo', 'jojo', 'jojo@gmail.com', '$2b$10$ktDcjq22oOICFuI/cow6B.0qrRAWw5fxMBQI.DaYTeWnIlJ4AAcfa', NULL, NULL, NULL, NULL, NULL, '2025-02-26 22:48:55'),
(34, 'tc', 'maguy', 'toukemmaguy@gmail.com', '$2b$10$oCNzbdjbvA5gA/EcX/S.6.MRkuy7JqtZEQqlOhodqGWTsoDo6zJ8C', NULL, NULL, NULL, NULL, NULL, '2025-03-17 04:23:14');

-- --------------------------------------------------------

--
-- Structure de la table `digital_signatures`
--

CREATE TABLE `digital_signatures` (
  `id` int(11) NOT NULL,
  `id_memoire` int(11) NOT NULL,
  `id_admin` int(11) NOT NULL,
  `signature` text NOT NULL,
  `public_key` text NOT NULL,
  `signed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `digital_signatures`
--

INSERT INTO `digital_signatures` (`id`, `id_memoire`, `id_admin`, `signature`, `public_key`, `signed_at`) VALUES
(9, 30, 1, 'aLuXuIXw3ltQlveOiUH8HI2aDIDweB9XgkkYKsppUonfh2Jqwjj+CVxXTc8EiB9hwJNurmcCRCav3IiNHir7xB/6LrBlB50xrlUvA18gzl3hhWBbfuaeSjoquqYBXXsD/ZdZwwPkXIZVLUh/1L10BcUsbOorKKuENJx23641SEumYg81zO2+kJVsQ81FxKblwdAiZiodpWjtWlw33qjtCj/Q9PE+GLUzL76Q8B+TCdpwLP+KGiAZqWTTtAkwP2RMmECOKLKixrvCfwZwY86JhxniHEMu1aGQ9QdwlAvKlEdWtPnCmrcJGpdoX+CbxDDwMzoXYpNAsSfgXrBOF4tymg==', '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAttI264ksPM55Nrm/tlnZ\n4BlJYTh9Kdn5tdcMHVmU62LfC/jlFHCWPPYDzpb0y912LjYHiVHrQOdXcMn9q9RT\npKObPaeMtnbpywMaah2iYkUG5iv5sbfzL56COuy8vXIsc83Kl14wI3RmSOHCkO7l\nQuRWXrsHhqH7G8kj0Uu7rwdsZrYTpqRw0Gx1rEDRWMZ7HlRkLhBQIXcXsLWSfmUd\nfqi0zcdp/sydpNqC5xUJeMI4heEhLy8Bcfypg9b5aAucksJibmf7dTGi6y30UCon\nBwfFalRJjdGYGKDpI+MSkqeuLs8T0jlNdzIOPZPz8VtQPNs+5n3aOi6DJB1rhX0e\nuwIDAQAB\n-----END PUBLIC KEY-----\n', '2025-02-13 16:29:03'),
(11, 37, 1, 'd7DWiKAgZF3QB6k48STf0UkOS3KolmoDZyD8GvOlCIZvSbhNBq72EoAjY3y9oGjct8/0q3OvICxpH2rbI0Pb63AdMw+tODAd2a19UFXD7Q8HjYf5EbT6JGd1XPz62PfphXOA2pzOl05BeIDkH1BS6yEvIAiVLWc/qMp5HdLuM4Ahaqn7F1PVQOsABDpMPUUBu9mKlHE1ym593rzK+F7gjasDi4O7HZkzRtAEp+VM6OrhIt+FmnP+6tSGciU3BXuuGsKfAQX5k28sXP8ff342P6ZMLadBJiKqJ8dxYxNuYrsPCi2UHomtYuxAy6JytMLTA4MC/MWQhNVDjtdHeREufg==', '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoSreGlz6oD6P5nIdh+as\nRFdox4/wSQmQkIpiFLrJ5U/qsUhbOIGkxAMdoMMPO+BppBZ4xDe1LYvoJN1zKLqy\nU4voGdqFQtE+afpif02QpXt6JIhldTof9fSPYQJ7hv1N1Y9yQWXEQYw2Qvn0bBs+\njgvwT9Nr57+FhDWYikIlxgFtVMuaWjo838A3dKu0Vc+R5+2Td8p6B14yzCT4FHfD\n9yXyEr65NYdgWKjgvJbzPpjFUxNoNNAlBTzHvmfu4qVSMrUvZPKA049e9usCAFfC\nRANF9nYALDy42moWIzgVv92Ru309dvppjmpv80G3qTe7Sn4Eg6LpLnfzr1HFNASG\nOwIDAQAB\n-----END PUBLIC KEY-----\n', '2025-02-24 14:50:53'),
(12, 35, 1, 'eS/V69YV8l6wuAuDdjyL2SeqjjA47G5NWLixBW+tbjfeRUHmGEl/R5sJCkg0vyI4yxgpJzE3B1FcwB9Xfo522qyuDgkA/RHNyLkeXoUqhHaurt+pdVpOwUF5xUoJZciYQuEvlAIQf2Y+udNIFuw0CJuz4oiAyRIlEa2wAyo50J7NGY00U1NyCmKFWh/NneLm8CH4CIQchCQs+JBWeIwj669DvRf8zpGfIBL1PdwJ6zoAEMppl5xPHZcpgRJ63U7LsJpSpFfhCo5UTMRUdNq/p9WyEHM7kfweYV85jKaRVWL3eSwT6W1qAfnKWyS2m9hgPkUtvER5cCZDiU3Awju8CA==', '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6SbxjkK9/3s5AmujZPnR\nkgFlTp/iHtcDvqI4XEO1ivY8g2ZUAFVDDwW35HbKebisanEjLxoMvteqesw79FUD\n4xmwgof3+HB2s4I3Di3UTcKND3snFfnoLi0OggGOt42SwIjyN5clC5kCnhsN9cx1\nH8f5ITPS/HW2TetU2tb8/DsByrxVAOaEH7ZwCJ6sfEC0JLu3ajvfeeF5OobsGn7o\nWzPIx4DHEqICfJLKZuuwD6jyXOicsKgiSwh8CM3vDwAujh91WOWNvaJ5REjAOxNg\nxSRzmbPDRrPidpYlrXz8ewyD3OXwTAOIZnt/AnZwwUYZL/B8g+/LmgU1MFXJVSBK\nuwIDAQAB\n-----END PUBLIC KEY-----\n', '2025-02-24 21:19:59'),
(13, 46, 1, 'erRYuUTmh5CJloxZpyvmPKRW27fhBpgGzQLrJsr6RrheK011YMe4p1ttyoJWz7q8Mtnn7nknpCGuzg8H5gp5ESYVqlDa2GiMVRcFUODVYYli/j52Nl6e2HxcwFMDDhsmyosf1c2QwxHlU8gOxaduX6OGejGTwDA9WuJEmAF1it9pgZzBxFEBYFF3MStl4d/1xAYc8N1nVUCnETTj97ythhVTY9JyXutN+8sbrDzvqla78lbzIne2IsQ2A1bfOIMBzNZwa1bMFyIr4x+kawDCcMzlUAcSJgQYFKsrrlUVAerpDAXGzyrPTyYrNH0GFz1r1FWqsMokigKZDbgw3O3Y7Q==', '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA245vPQyjJxsFvEZTus8X\nfwAJL8/8CoKG+t1+EzpkRdp7SZwyShDDdb4KrRdL5a3eRO2ujjhXzognzDPpqo5L\n0C3YWdR9fuWyFTMBeQO+LByrV81jg4OO1BWgQZq+jqSoBP/TBGIFr3CWYoGmu9mt\n7GLfSLOUpP6XF7K0VelnVtBf2CJZpivIQIciT7Smh9uVdMIY8a4BugAoUv5dGuFC\njMJV+MO0hAD4j+BuM9pA/JjvXnf6vkZP6F/Qk+UR8+OsI0nauF2qoO8wnPdLHnls\nURTk4M2yHrmrSGcd3WFqzcmTqbXGeXRXZe7DxHYxXhNH6Dddns64qN38YjAuWfjO\n0wIDAQAB\n-----END PUBLIC KEY-----\n', '2025-02-26 23:39:18'),
(26, 57, 1, 'up51ofuyt/RViagKookKMO99wX/gzZjIwUeuHp1xuPP7voSwl+mdWELdokY6yMWGyV2qcEeCDIby/glnDT+amxZ0IUBkvTWyiZR9pwhCS2nmMP7A0tFPw2q81WM8osRotZ2kUYR2a4vWTPhbJzZgdJz5Sxk5YdxZT0J8cFnIQIPtwEzwaf+R5e2RtHCdOldELXZN1S3nubAhwK34MoS38XJq5GP5AqGwNYaKKEt2mS7/LKBIHEx0a9ugTpsvRb27zlEZwYqOynRwVV9B8IPK6FocGT9Gtv0Spo1WGwpLxrita4Rdr2PqydlFyHN7Ife/GsBs82c8xuM4/1vROZmvSQ==', '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA245vPQyjJxsFvEZTus8X\nfwAJL8/8CoKG+t1+EzpkRdp7SZwyShDDdb4KrRdL5a3eRO2ujjhXzognzDPpqo5L\n0C3YWdR9fuWyFTMBeQO+LByrV81jg4OO1BWgQZq+jqSoBP/TBGIFr3CWYoGmu9mt\n7GLfSLOUpP6XF7K0VelnVtBf2CJZpivIQIciT7Smh9uVdMIY8a4BugAoUv5dGuFC\njMJV+MO0hAD4j+BuM9pA/JjvXnf6vkZP6F/Qk+UR8+OsI0nauF2qoO8wnPdLHnls\nURTk4M2yHrmrSGcd3WFqzcmTqbXGeXRXZe7DxHYxXhNH6Dddns64qN38YjAuWfjO\n0wIDAQAB\n-----END PUBLIC KEY-----\n', '2025-03-16 16:21:09'),
(30, 60, 1, 'yi/RmADsIN00koP8stIe3wc1geHKgjwiTUmJDmvH1nmg7xs4khsIrml2tPLxAAm3aFSysjCEhkiwy6h6ILweGSCMYiEcFgziwykVcw3YCCUJ++SU6YMjKWDqvg4cxCBp8d0GqYkC2K58y/VJGpDlx5LYG+tKp7pombviinSRNAwt0oz3rse8ZgIeahjIdzmBYmkXWKv8nLMeMOBD9+YZ+Kj6cXGOdn514JaCxtzvTbafLmcWdYmt7MXEE4+R6ndVenJOj7nkKaV+KGFdbw3jLN+ns4Xy0hDl5GaHlzS7Ss6f8W1CZeVaEQZOgMqTTf8IG1ExfSsKUNDBXuAW4wOslQ==', '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA245vPQyjJxsFvEZTus8X\nfwAJL8/8CoKG+t1+EzpkRdp7SZwyShDDdb4KrRdL5a3eRO2ujjhXzognzDPpqo5L\n0C3YWdR9fuWyFTMBeQO+LByrV81jg4OO1BWgQZq+jqSoBP/TBGIFr3CWYoGmu9mt\n7GLfSLOUpP6XF7K0VelnVtBf2CJZpivIQIciT7Smh9uVdMIY8a4BugAoUv5dGuFC\njMJV+MO0hAD4j+BuM9pA/JjvXnf6vkZP6F/Qk+UR8+OsI0nauF2qoO8wnPdLHnls\nURTk4M2yHrmrSGcd3WFqzcmTqbXGeXRXZe7DxHYxXhNH6Dddns64qN38YjAuWfjO\n0wIDAQAB\n-----END PUBLIC KEY-----\n', '2025-04-21 12:31:59'),
(31, 60, 1, 'o7v2ezKjCrHkkoM0/6n7XoSGgR4HLBkInB0BjimsdYV8k5hmBLxcTTVW35qBIgThn7Z0BwN5Ckw0LscLvguyXAHsyK57X8tlW3Afn6yTlJ4yCB1Cy6yR4Qy7VNZKkyCIY/bIWzZnLrU5fTqYb2UdT8Mb0+l8tdKs5+Lp1N4qZSNB2wamFoTOpkDN69kzn7RorzU3X4u3H/7SCY7qKFHkbSfUh5kGINDiKW1p55/magQH3m1xy01dxYt/XhTnAFJ3A1SGtkpfIGBD87TmWB7oh46kWLQIfWfBgp2CxDWc1GzuJkhTyhDAfipzhkqJMutjlrjxr9hqxlZbRdFzEkNBrA==', '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA245vPQyjJxsFvEZTus8X\nfwAJL8/8CoKG+t1+EzpkRdp7SZwyShDDdb4KrRdL5a3eRO2ujjhXzognzDPpqo5L\n0C3YWdR9fuWyFTMBeQO+LByrV81jg4OO1BWgQZq+jqSoBP/TBGIFr3CWYoGmu9mt\n7GLfSLOUpP6XF7K0VelnVtBf2CJZpivIQIciT7Smh9uVdMIY8a4BugAoUv5dGuFC\njMJV+MO0hAD4j+BuM9pA/JjvXnf6vkZP6F/Qk+UR8+OsI0nauF2qoO8wnPdLHnls\nURTk4M2yHrmrSGcd3WFqzcmTqbXGeXRXZe7DxHYxXhNH6Dddns64qN38YjAuWfjO\n0wIDAQAB\n-----END PUBLIC KEY-----\n', '2025-04-21 12:32:11'),
(32, 60, 1, 'RMUD+2Hzzo0jML1D8qYX/6oJfzSKn+TBq8RfbtFysnkjuZU/X4+5iNChYNQRGuM8k0OanG+BQo84hKSZO/epGd45f6BXl4rLGzU/NNG3xY7ZhXjxXxghdpqCHkRCGdqegF4XCCCPiHUasOjT7a4OaAZkDWO8AYX/qISHi8ers5Xwhk0A/2tgeowguZMhu/PG9szW4CC/D+HQmaXCZgbTUTIAZQJIXIVoi+QrvFjoEI3dWMOs6bf713TnPxCH+Z+75TwmdBcPjZ29VKesDumvLnrSls0mXwrW5abgFbhnJGJ6kcexR4klmkvJbkv1Ryo0cY305FxVqWzLOn+ZVJNvog==', '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA245vPQyjJxsFvEZTus8X\nfwAJL8/8CoKG+t1+EzpkRdp7SZwyShDDdb4KrRdL5a3eRO2ujjhXzognzDPpqo5L\n0C3YWdR9fuWyFTMBeQO+LByrV81jg4OO1BWgQZq+jqSoBP/TBGIFr3CWYoGmu9mt\n7GLfSLOUpP6XF7K0VelnVtBf2CJZpivIQIciT7Smh9uVdMIY8a4BugAoUv5dGuFC\njMJV+MO0hAD4j+BuM9pA/JjvXnf6vkZP6F/Qk+UR8+OsI0nauF2qoO8wnPdLHnls\nURTk4M2yHrmrSGcd3WFqzcmTqbXGeXRXZe7DxHYxXhNH6Dddns64qN38YjAuWfjO\n0wIDAQAB\n-----END PUBLIC KEY-----\n', '2025-04-21 12:32:25'),
(33, 60, 1, 'JuOIYHk167RUdfAcdEUoGVAodYxozd+03ZzzaKOdAjdhVY9ZdQ7xN+16zsCyz+Wcdg4oxFIcLUodjCPu2ECE/hSHnHewhgNGDhCx8a1AXixNCV04UHG/GN+lOr8Wf9uWwllLW4hzbhAzDMPYuqndjfEdiez6LwW0QElvIkOV4qsaTHSlYAwF1ABCKaVie6y5ZWu98qcQZ+BTi8WL3vSklqojQtdwTAvqcEwP3mv5narOaU3F4fEWlcEt66sIu8+Zo5Moh5Dv89NqYPLqiG3TVRLiBnK1C7NBwQVrCoACPZWvrK+Zqhup0Fbnv4ADPtBuBh9/wdY6r8BhYeaJcs/2VA==', '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA245vPQyjJxsFvEZTus8X\nfwAJL8/8CoKG+t1+EzpkRdp7SZwyShDDdb4KrRdL5a3eRO2ujjhXzognzDPpqo5L\n0C3YWdR9fuWyFTMBeQO+LByrV81jg4OO1BWgQZq+jqSoBP/TBGIFr3CWYoGmu9mt\n7GLfSLOUpP6XF7K0VelnVtBf2CJZpivIQIciT7Smh9uVdMIY8a4BugAoUv5dGuFC\njMJV+MO0hAD4j+BuM9pA/JjvXnf6vkZP6F/Qk+UR8+OsI0nauF2qoO8wnPdLHnls\nURTk4M2yHrmrSGcd3WFqzcmTqbXGeXRXZe7DxHYxXhNH6Dddns64qN38YjAuWfjO\n0wIDAQAB\n-----END PUBLIC KEY-----\n', '2025-04-21 12:32:32');

-- --------------------------------------------------------

--
-- Structure de la table `etudiant`
--

CREATE TABLE `etudiant` (
  `id_etudiant` int(11) NOT NULL,
  `name` varchar(256) DEFAULT NULL,
  `surname` varchar(256) DEFAULT NULL,
  `email` varchar(256) DEFAULT NULL,
  `password` varchar(256) DEFAULT NULL,
  `phonenumber` varchar(15) DEFAULT NULL,
  `university` varchar(256) DEFAULT NULL,
  `faculty` varchar(256) DEFAULT NULL,
  `speciality` varchar(256) DEFAULT NULL,
  `id_role` int(11) DEFAULT NULL,
  `email_activated` tinyint(1) DEFAULT 0,
  `code` varchar(6) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `etudiant`
--

INSERT INTO `etudiant` (`id_etudiant`, `name`, `surname`, `email`, `password`, `phonenumber`, `university`, `faculty`, `speciality`, `id_role`, `email_activated`, `code`, `is_active`, `deleted_at`) VALUES
(1, 'admin', 'admin', 'jean@gmail.com', 'jean', '1234567890', 'Université de Douala', 'Faculté des Sciences', 'Informatique', 2, 0, '', 1, NULL),
(6, 'Mba', 'Mika', 'mikamba@gmail', 'mikamba0', NULL, NULL, NULL, NULL, NULL, 0, '', 1, NULL),
(8, 'Lontsi Sonwa', 'Russel', 'LontsiSonwa@gmail', 'ruxlsr', NULL, NULL, NULL, NULL, NULL, 0, '', 1, NULL),
(15, 'rachel', 'sam', 'sam@gmail.com', 'sam', NULL, NULL, NULL, NULL, NULL, 0, '', 1, NULL),
(16, 'hh', 'hh', 'hh@gamil.com', 'hh', NULL, NULL, NULL, NULL, NULL, 0, '', 1, NULL),
(17, 'Dega', 'Maffo', 'maffo@gamil.com', '$2b$10$AHQJ8OUuB5YEXs9SIihaDePBgQ817TKhxcpoLX8GmcL.J5ZDTQc9C', NULL, NULL, NULL, NULL, NULL, 0, NULL, 1, NULL),
(19, 'sophie', 'sos', 'soso@gmail.com', '$2b$10$lB2rHOVDZDya1e4cL.L63O2bqOipt9C1yAMvx2P4J5ncNCtYf/H8.', NULL, NULL, NULL, NULL, NULL, 0, '', 1, NULL),
(29, 'KEYCE', 'INFORMATIQUE', 'bleriaux1@gmail.com', '$2b$10$RXX0pNS68Ypp0bJe5bh1gO4BgZE8fmWANB.9RIrad.J30CTS74EdC', NULL, NULL, NULL, NULL, NULL, 1, '5J700F', 1, NULL),
(31, 'Mba', 'Sophia', 'sophiamba7@gmail.com', '$2b$10$zMrciKhwobm5WravRM7bHupzrh5xe6yGGslTaI9XA4.SEsg4/SXa2', NULL, NULL, NULL, NULL, NULL, 1, '92FFDX', 1, NULL),
(33, 'tc', 'mika', 'mbachristian58@gmail.com', '$2b$10$zxgv.k975a9M2uz2jrwtheW1MdHzlOG9LEUvUt7g0TELk9Jgo1aQG', NULL, NULL, NULL, NULL, NULL, 0, '130726', 1, NULL),
(35, 'patrick', 'Jean', 'patricknegoue197@gmail.com', '$2b$10$XgP/iMbIZapVkJ0QmT4eW.sD9vGRLyQpFLXGUeatnuhyJGMqElV9q', NULL, NULL, NULL, NULL, NULL, 1, '840526', 1, NULL),
(36, 'sophia', 'Jean', 'karelmba@gmail.com', '$2b$10$tkDa2wq.eYZ/axu.Y7MBS.w8nY0ENr6j/Vwj8ODSTPqiz0cDWpNZ6', NULL, NULL, NULL, NULL, NULL, 1, '404907', 1, NULL),
(37, 'Institut', 'Jean', 'Institut@gmail.com', '$2b$10$y5HD2aOLuqlMIBl9cKI.m.sx.AoPP3Xbx/cUNPdM2kBOpA.8/e8vm', NULL, NULL, NULL, NULL, NULL, 0, NULL, 1, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `memoire`
--

CREATE TABLE `memoire` (
  `id_memoire` int(11) NOT NULL,
  `libelle` varchar(256) NOT NULL,
  `annee` year(4) NOT NULL,
  `cycle` varchar(256) NOT NULL,
  `speciality` varchar(256) NOT NULL,
  `university` varchar(256) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `status` enum('pending','validated','rejected') DEFAULT 'pending',
  `rejection_reason` text DEFAULT NULL,
  `id_etudiant` int(11) NOT NULL,
  `validated_by` int(11) DEFAULT NULL,
  `pages_preview` varchar(500) DEFAULT NULL,
  `description` varchar(256) DEFAULT NULL,
  `consultations` int(11) DEFAULT 0,
  `date_soumission` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `file_status` enum('available','missing') DEFAULT 'available',
  `mention` enum('Passable','Bien','Tres Bien','Excellent') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `memoire`
--

INSERT INTO `memoire` (`id_memoire`, `libelle`, `annee`, `cycle`, `speciality`, `university`, `file_name`, `file_path`, `status`, `rejection_reason`, `id_etudiant`, `validated_by`, `pages_preview`, `description`, `consultations`, `date_soumission`, `updated_at`, `file_status`, `mention`) VALUES
(30, 'Gestion d\'agences', '2025', 'Bachelor', 'GL', 'UY1', 'PREMIER.pdf', 'uploads\\1739464106371-PREMIER.pdf', 'validated', NULL, 31, 1, NULL, 'Facilter la gestion des memoires ', 0, '2025-02-13 17:28:26', '2025-02-13 17:29:03', 'available', NULL),
(32, 'Gestion vol', '2025', 'Master', 'Securiter', 'UY1', 'Documents numeÌriseÌs.pdf', 'uploads\\1739546429326-Documents numeÌriseÌs.pdf', 'validated', NULL, 31, NULL, NULL, 'vol', 0, '2025-02-14 16:20:29', '2025-02-26 21:28:02', 'available', NULL),
(33, 'BI', '2025', 'Master', 'GL', 'UY1', 'avancement - Feuille 1.pdf', 'uploads\\1740400476920-avancement - Feuille 1.pdf', 'validated', NULL, 31, NULL, NULL, 'BB', 0, '2025-02-24 13:34:36', '2025-02-26 23:05:55', 'available', NULL),
(35, 'BBL', '2025', 'Master', 'GL', 'UY1', 'avancement - Feuille 1.pdf', 'uploads\\1740401199363-avancement - Feuille 1.pdf', 'validated', NULL, 31, 1, NULL, 'ss', 0, '2025-02-24 13:46:39', '2025-02-24 22:19:59', 'available', 'Excellent'),
(37, 'Gestion des Requets', '2024', 'Master', 'Reseaux', 'UY1', 'avancement - Feuille 1.pdf', 'uploads\\1740408605851-avancement - Feuille 1.pdf', 'validated', NULL, 31, 1, NULL, 'nnn', 0, '2025-02-24 15:50:05', '2025-02-24 15:50:53', 'available', 'Passable'),
(40, 'Gestion finance ', '2025', 'Master', 'Genie Logiciel', 'UY1', '', 'uploads\\memoires\\1740594573632-771447100.pdf', 'rejected', NULL, 29, NULL, NULL, 'Gerer les finance dans une PMUC plus facilement ', 0, '2025-02-26 19:29:33', '2025-02-26 23:36:32', 'available', 'Bien'),
(44, 'AntiVols', '2025', 'Bachelor', 'Genie Logiciel', 'UY1', '', 'uploads\\memoires\\1740608870314-998886832.pdf', 'validated', NULL, 31, NULL, NULL, 'vols', 0, '2025-02-26 23:27:50', '2025-02-26 23:28:12', 'available', 'Bien'),
(45, 'Architecture', '2025', 'Bachelor', 'Genie Logiciel', 'UY1', '', 'uploads\\memoires\\1740609797827-350295141.pdf', 'rejected', NULL, 31, NULL, NULL, 'bbb', 0, '2025-02-26 23:43:17', '2025-02-26 23:43:41', 'available', 'Tres Bien'),
(46, 'dd', '2025', 'Bachelor', 'Genie Logiciel', 'UY1', '', 'uploads\\memoires\\1740612704447-121258082.pdf', 'validated', NULL, 31, 1, NULL, 'dd', 0, '2025-02-27 00:31:44', '2025-02-27 00:39:18', 'available', 'Passable'),
(57, 'Architecture', '2025', 'Master', 'Genie Logiciel', 'UY1', '', 'uploads\\memoires\\1742141966295-544338246.pdf', 'validated', NULL, 29, 1, NULL, 'dd', 0, '2025-03-16 17:19:26', '2025-03-16 17:21:09', 'available', 'Bien'),
(60, 'sdfsdf', '2025', 'Bachelor', 'Genie Logiciel', 'UY1', '', 'uploads\\memoires\\1742242705212-160167417.pdf', 'validated', NULL, 29, 1, NULL, 'vv', 0, '2025-03-17 21:18:26', '2025-04-21 13:31:59', 'available', 'Bien'),
(67, 'Gestion des rendz-vous', '2025', 'Bachelor', 'Genie Logiciel', 'UY1', '', 'uploads\\memoires\\1745239549253-495319598.pdf', 'pending', NULL, 29, NULL, NULL, 'Gerer les rendez vous ', 0, '2025-04-21 13:45:49', '2025-04-21 13:45:49', 'available', 'Tres Bien');

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id_notification` int(11) NOT NULL,
  `id_etudiant` int(11) NOT NULL,
  `message` text NOT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id_notification`, `id_etudiant`, `message`, `date_creation`) VALUES
(13, 29, 'Votre mémoire \"Ubuntu\" a été rejeté pour la raison suivante : nmnm', '2025-02-07 14:18:23'),
(14, 29, 'Votre mémoire \"Ubuntu\" a été rejeté pour la raison suivante : sophia', '2025-02-07 16:19:14'),
(15, 29, 'Votre mémoire \"Ubuntu\" a été rejeté pour la raison suivante : sophia', '2025-02-07 16:19:14'),
(16, 29, 'Votre mémoire \"Ubuntu\" a été rejeté pour la raison suivante : sophia', '2025-02-07 16:19:16'),
(17, 29, 'Votre mémoire \"Ubuntu\" a été rejeté pour la raison suivante : sophia', '2025-02-07 16:19:16'),
(18, 29, 'Votre mémoire \"Ubuntu\" a été rejeté pour la raison suivante : sophia', '2025-02-07 16:19:16'),
(19, 29, 'Votre mémoire \"Ubuntu\" a été rejeté pour la raison suivante : sophia', '2025-02-07 16:19:18'),
(20, 29, 'Votre mémoire \"Ubuntu\" a été rejeté pour la raison suivante : sophia', '2025-02-07 16:19:18'),
(21, 29, 'Votre mémoire \"Ubuntu\" a été rejeté pour la raison suivante : sophia', '2025-02-07 16:19:19'),
(22, 29, 'Votre mémoire \"Ubuntu\" a été rejeté pour la raison suivante : sophia', '2025-02-07 16:19:20'),
(23, 29, 'Votre mémoire \"Ubuntu\" a été rejeté pour la raison suivante : sophia', '2025-02-07 16:19:42'),
(24, 29, 'Votre mémoire \"Ubuntu\" a été rejeté pour la raison suivante : Plagiat détecté dans le mémoire.', '2025-02-07 16:21:27'),
(25, 31, 'Votre mémoire \"Maths\" a été rejeté pour la raison suivante : plagiat', '2025-02-13 13:41:01');

-- --------------------------------------------------------

--
-- Structure de la table `role`
--

CREATE TABLE `role` (
  `id_role` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `role`
--

INSERT INTO `role` (`id_role`, `name`) VALUES
(1, 'admin'),
(2, 'etudiant');

-- --------------------------------------------------------

--
-- Structure de la table `signature`
--

CREATE TABLE `signature` (
  `id_signature` int(11) NOT NULL,
  `id_memoire` int(11) DEFAULT NULL,
  `id_admin` int(11) DEFAULT NULL,
  `date_signature` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `signatures`
--

CREATE TABLE `signatures` (
  `id_signature` int(11) NOT NULL,
  `id_memoire` int(11) NOT NULL,
  `id_admin` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id_admin`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `id_role` (`id_role`);

--
-- Index pour la table `app_settings`
--
ALTER TABLE `app_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_setting_key` (`setting_key`);

--
-- Index pour la table `comparison_results`
--
ALTER TABLE `comparison_results`
  ADD PRIMARY KEY (`id`),
  ADD KEY `memoire_id` (`memoire_id`);

--
-- Index pour la table `deleted_users`
--
ALTER TABLE `deleted_users`
  ADD PRIMARY KEY (`id_etudiant`);

--
-- Index pour la table `digital_signatures`
--
ALTER TABLE `digital_signatures`
  ADD PRIMARY KEY (`id`),
  ADD KEY `memoire_id` (`id_memoire`),
  ADD KEY `admin_id` (`id_admin`);

--
-- Index pour la table `etudiant`
--
ALTER TABLE `etudiant`
  ADD PRIMARY KEY (`id_etudiant`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `id_role` (`id_role`);

--
-- Index pour la table `memoire`
--
ALTER TABLE `memoire`
  ADD PRIMARY KEY (`id_memoire`),
  ADD KEY `validated_by` (`validated_by`),
  ADD KEY `idx_id_etudiant` (`id_etudiant`),
  ADD KEY `idx_status` (`status`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id_notification`),
  ADD KEY `id_etudiant` (`id_etudiant`);

--
-- Index pour la table `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`id_role`);

--
-- Index pour la table `signature`
--
ALTER TABLE `signature`
  ADD PRIMARY KEY (`id_signature`),
  ADD KEY `id_memoire` (`id_memoire`),
  ADD KEY `id_admin` (`id_admin`);

--
-- Index pour la table `signatures`
--
ALTER TABLE `signatures`
  ADD PRIMARY KEY (`id_signature`),
  ADD KEY `id_memoire` (`id_memoire`),
  ADD KEY `id_admin` (`id_admin`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `admin`
--
ALTER TABLE `admin`
  MODIFY `id_admin` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `app_settings`
--
ALTER TABLE `app_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `comparison_results`
--
ALTER TABLE `comparison_results`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT pour la table `digital_signatures`
--
ALTER TABLE `digital_signatures`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT pour la table `etudiant`
--
ALTER TABLE `etudiant`
  MODIFY `id_etudiant` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT pour la table `memoire`
--
ALTER TABLE `memoire`
  MODIFY `id_memoire` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id_notification` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT pour la table `role`
--
ALTER TABLE `role`
  MODIFY `id_role` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `signature`
--
ALTER TABLE `signature`
  MODIFY `id_signature` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `signatures`
--
ALTER TABLE `signatures`
  MODIFY `id_signature` int(11) NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `admin`
--
ALTER TABLE `admin`
  ADD CONSTRAINT `admin_ibfk_1` FOREIGN KEY (`id_role`) REFERENCES `role` (`id_role`) ON DELETE CASCADE;

--
-- Contraintes pour la table `comparison_results`
--
ALTER TABLE `comparison_results`
  ADD CONSTRAINT `comparison_results_ibfk_1` FOREIGN KEY (`memoire_id`) REFERENCES `memoire` (`id_memoire`) ON DELETE CASCADE;

--
-- Contraintes pour la table `digital_signatures`
--
ALTER TABLE `digital_signatures`
  ADD CONSTRAINT `digital_signatures_ibfk_1` FOREIGN KEY (`id_memoire`) REFERENCES `memoire` (`id_memoire`),
  ADD CONSTRAINT `digital_signatures_ibfk_2` FOREIGN KEY (`id_admin`) REFERENCES `admin` (`id_admin`);

--
-- Contraintes pour la table `etudiant`
--
ALTER TABLE `etudiant`
  ADD CONSTRAINT `etudiant_ibfk_1` FOREIGN KEY (`id_role`) REFERENCES `role` (`id_role`) ON DELETE CASCADE;

--
-- Contraintes pour la table `memoire`
--
ALTER TABLE `memoire`
  ADD CONSTRAINT `fk_etudiant` FOREIGN KEY (`id_etudiant`) REFERENCES `etudiant` (`id_etudiant`) ON DELETE CASCADE,
  ADD CONSTRAINT `memoire_ibfk_1` FOREIGN KEY (`id_etudiant`) REFERENCES `etudiant` (`id_etudiant`) ON DELETE CASCADE,
  ADD CONSTRAINT `memoire_ibfk_2` FOREIGN KEY (`validated_by`) REFERENCES `admin` (`id_admin`) ON DELETE SET NULL;

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`id_etudiant`) REFERENCES `etudiant` (`id_etudiant`) ON DELETE CASCADE;

--
-- Contraintes pour la table `signature`
--
ALTER TABLE `signature`
  ADD CONSTRAINT `signature_ibfk_1` FOREIGN KEY (`id_memoire`) REFERENCES `memoire` (`id_memoire`),
  ADD CONSTRAINT `signature_ibfk_2` FOREIGN KEY (`id_admin`) REFERENCES `admin` (`id_admin`);

--
-- Contraintes pour la table `signatures`
--
ALTER TABLE `signatures`
  ADD CONSTRAINT `signatures_ibfk_1` FOREIGN KEY (`id_memoire`) REFERENCES `memoire` (`id_memoire`),
  ADD CONSTRAINT `signatures_ibfk_2` FOREIGN KEY (`id_admin`) REFERENCES `admin` (`id_admin`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
