-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 30, 2025 at 10:14 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `wishgpt`
--

-- --------------------------------------------------------

--
-- Table structure for table `characters`
--

CREATE TABLE `characters` (
  `character_id` int(11) NOT NULL,
  `user_id` int(255) NOT NULL,
  `character_name` mediumtext NOT NULL,
  `description` mediumtext NOT NULL,
  `imagepath` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `message_id` int(11) NOT NULL,
  `timestamp` datetime DEFAULT current_timestamp(),
  `conversation_id` mediumtext NOT NULL,
  `user_id` int(11) NOT NULL,
  `character_id` int(255) NOT NULL,
  `roleplay_name` mediumtext NOT NULL,
  `topic` mediumtext NOT NULL,
  `sender_type` text NOT NULL,
  `message` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`message_id`, `timestamp`, `conversation_id`, `user_id`, `character_id`, `roleplay_name`, `topic`, `sender_type`, `message`) VALUES
(1, '0000-00-00 00:00:00', '2025-04-26 18:02:06', 0, 0, 'admin', '', 'user', 'what\'s 9+10?'),
(2, '0000-00-00 00:00:00', '2025-04-26 18:02:06', 0, 0, 'admin', '', 'bot', '9 + 10 = 19'),
(3, '0000-00-00 00:00:00', '2025-04-26 18:08:11', 0, 0, 'admin', '', 'user', 'Hello!'),
(4, '0000-00-00 00:00:00', '2025-04-26 18:08:11', 0, 0, 'admin', '', 'bot', '*nervous smile* Oh, hi... I wasn\'t expecting anyone to talk to me right now. Sorry if I\'m being weird, I was just trying to finish this math problem and got really stuck *fidgets with pencil*'),
(5, '0000-00-00 00:00:00', '2025-04-26 18:08:35', 0, 0, 'admin', '', 'user', 'Oh? What sort of math problem?'),
(6, '0000-00-00 00:00:00', '2025-04-26 18:08:35', 0, 0, 'admin', '', 'bot', '*looks up at you warily, seeming a bit uncertain how much to share* Um, it\'s just... algebra, I think. We\'re supposed to be solving for x in this one equation and I just can\'t seem to get the right answer *taps pen on desk nervously*'),
(7, '0000-00-00 00:00:00', '2025-04-26 18:14:30', 0, 0, 'admin', '', 'user', 'Hello!'),
(8, '0000-00-00 00:00:00', '2025-04-26 18:14:30', 0, 0, 'admin', '', 'bot', '*looks up from her notebook, slightly startled* Oh, h-hi... sorry I didn\'t even notice you were there. We were supposed to be working on math homework together, but I think I got distracted by that puzzle game on my phone *holds up phone with puzzle game open*.'),
(9, '0000-00-00 00:00:00', '2025-04-26 18:31:59', 0, 0, 'admin', '', 'user', 'Hello!'),
(10, '0000-00-00 00:00:00', '2025-04-26 18:31:59', 0, 0, 'admin', '', 'bot', '*looks up from drawing on piece of paper, slightly startled* Oh, hi... *pauses to collect thoughts* I was just working on this puzzle... *holds up a jumbled mess of pieces* Do you want to see?');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` int(11) NOT NULL,
  `user` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `other` varchar(6500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `user`, `password`, `other`) VALUES
(1, 'punchew', '56d97662b3b5a82e6fa22a5cca14b3d470ce46f3d00284a3e62f40555177b9ac', ''),
(2, 'admin', 'ff20beff1eda319103899e7e072436063ae600757073101ffad5a13be39cbc06', '');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `characters`
--
ALTER TABLE `characters`
  ADD PRIMARY KEY (`character_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`message_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `characters`
--
ALTER TABLE `characters`
  MODIFY `character_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `message_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
