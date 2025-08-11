-- Create database (works on MySQL & MariaDB)
CREATE DATABASE IF NOT EXISTS `shelflife`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `shelflife`;

-- Table: Distributor
DROP TABLE IF EXISTS `Distributor`;

CREATE TABLE `Distributor` (
  `distributorID` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`distributorID`)
) ENGINE=InnoDB
  AUTO_INCREMENT=4
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
