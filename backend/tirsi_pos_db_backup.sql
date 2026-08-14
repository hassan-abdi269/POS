-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: tirsi_pos_db
-- ------------------------------------------------------
-- Server version	8.0.46-0ubuntu0.24.04.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alembic_version`
--

DROP TABLE IF EXISTS `alembic_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alembic_version` (
  `version_num` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`version_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alembic_version`
--

LOCK TABLES `alembic_version` WRITE;
/*!40000 ALTER TABLE `alembic_version` DISABLE KEYS */;
INSERT INTO `alembic_version` VALUES ('5e4534814508');
/*!40000 ALTER TABLE `alembic_version` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_spent` float DEFAULT NULL,
  `total_orders` int DEFAULT NULL,
  `tier` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `last_activity` datetime DEFAULT NULL,
  `shop_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_shop_email` (`shop_id`,`email`),
  CONSTRAINT `fk_customers_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'Hassan','Abdi','hassan2030abdi@gmail.com','0110676959','Bula Madina','Garissa Township','Northern Kenya','Kenya','007',58000,1,'Platinum','Active','Done','2026-07-20 08:57:26','2026-07-20 09:30:47','2026-07-20 09:30:47',1),(2,'Jamac','Muse','jamac@gmail.com','078965432','005','Mombasa','Cost','Kenya','254',0,0,'Silver','Active','','2026-07-21 07:31:55','2026-07-21 07:31:55','2026-07-21 07:31:55',1),(4,'Hassan','Abdi','hassan2030abdi@gmail.com','0110676959','Bula Madina','Garissa Township','NK','Kenya','007',290000,1,'Platinum','Active','Excellent','2026-07-22 11:15:02','2026-07-22 11:20:33','2026-07-22 11:20:33',2),(5,'Ahmed ','Khalif','ahmed@gmail.com','078965443','005','Mombasa','Cost','Kenya','254',995000,1,'Platinum','Active','hey','2026-07-25 13:33:17','2026-07-25 13:57:30','2026-07-25 13:57:30',2),(6,'ALI','MUSE','alimuse@gmail.com','00987766555','Bula Madina','Garissa Township','NK','Kenya','007',0,0,'Gold','Active','OK','2026-08-07 11:37:34','2026-08-07 11:37:34','2026-08-07 11:37:34',5);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` float NOT NULL,
  `date` date NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `receipt_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `shop_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_expenses_shop_id` (`shop_id`),
  CONSTRAINT `fk_expenses_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (1,'Laptop',60000,'2026-07-18','M-Pesa','Lp001','Paid','Delivered',NULL,1,'2026-07-18 09:11:40','2026-07-21 06:29:40',0),(2,'Lunch , BreakFast , Travel',5000,'2026-07-23','M-Pesa','done ','Paid','done',NULL,2,'2026-07-23 09:06:16','2026-07-23 09:06:16',2),(3,'jjj',80,'2026-07-24','M-Pesa','','Paid','',NULL,4,'2026-07-24 11:44:29','2026-07-24 11:44:29',4),(4,'Lunch and transport',3000,'2026-07-25','Cash','ok','Paid','ok',NULL,2,'2026-07-25 13:36:18','2026-07-25 13:36:18',2),(5,'lunch',2000,'2026-07-25','Cash','ok','Paid','ok',NULL,1,'2026-07-25 14:13:38','2026-07-25 14:13:38',1),(6,'Breakfast',200,'2026-08-07','Cash','ok','Paid','ok',NULL,5,'2026-08-07 11:35:36','2026-08-07 11:35:36',5);
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_preferences`
--

DROP TABLE IF EXISTS `notification_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `notification_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `enabled` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `shop_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_notification_preferences_shop_id` (`shop_id`),
  CONSTRAINT `fk_notification_preferences_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_preferences`
--

LOCK TABLES `notification_preferences` WRITE;
/*!40000 ALTER TABLE `notification_preferences` DISABLE KEYS */;
INSERT INTO `notification_preferences` VALUES (1,'email',1,'2026-07-21 08:33:03','2026-07-21 08:33:03',0),(2,'push',1,'2026-07-21 08:33:03','2026-07-21 08:33:03',0),(3,'sms',0,'2026-07-21 08:33:03','2026-07-21 08:33:03',0),(4,'marketing',0,'2026-07-21 08:33:03','2026-07-21 08:33:03',0),(5,'email',1,'2026-07-22 10:57:55','2026-07-22 10:57:55',2),(6,'push',1,'2026-07-22 10:57:55','2026-07-22 10:57:55',2),(7,'sms',0,'2026-07-22 10:57:55','2026-07-22 10:57:55',2),(8,'marketing',0,'2026-07-22 10:57:55','2026-07-22 10:57:55',2),(9,'email',1,'2026-07-23 15:18:17','2026-07-23 15:18:17',3),(10,'push',1,'2026-07-23 15:18:17','2026-07-23 15:18:17',3),(11,'sms',0,'2026-07-23 15:18:17','2026-07-23 15:18:17',3),(12,'marketing',0,'2026-07-23 15:18:17','2026-07-23 15:18:17',3),(13,'email',1,'2026-07-24 11:46:34','2026-07-24 11:46:34',4),(14,'push',1,'2026-07-24 11:46:34','2026-07-24 11:46:34',4),(15,'sms',0,'2026-07-24 11:46:34','2026-07-24 11:46:34',4),(16,'marketing',0,'2026-07-24 11:46:34','2026-07-24 11:46:34',4),(17,'email',1,'2026-07-25 14:19:11','2026-07-25 14:19:11',1),(18,'push',1,'2026-07-25 14:19:11','2026-07-25 14:19:11',1),(19,'sms',0,'2026-07-25 14:19:11','2026-07-25 14:19:11',1),(20,'marketing',0,'2026-07-25 14:19:11','2026-07-25 14:19:11',1),(21,'email',1,'2026-08-07 13:58:37','2026-08-07 13:58:37',5),(22,'push',1,'2026-08-07 13:58:37','2026-08-07 13:58:37',5),(23,'sms',0,'2026-08-07 13:58:37','2026-08-07 13:58:37',5),(24,'marketing',0,'2026-08-07 13:58:37','2026-08-07 13:58:37',5);
/*!40000 ALTER TABLE `notification_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status_history`
--

DROP TABLE IF EXISTS `order_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `old_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `new_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `order_status_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_history`
--

LOCK TABLES `order_status_history` WRITE;
/*!40000 ALTER TABLE `order_status_history` DISABLE KEYS */;
INSERT INTO `order_status_history` VALUES (1,2,'','Pending',1,'Order created','2026-07-23 13:33:53'),(2,2,'Received','Ordered',2,'Status changed from Received to Ordered','2026-07-23 10:45:42'),(3,2,'Ordered','Cancelled',2,'Status changed from Ordered to Cancelled','2026-07-23 10:46:17'),(4,2,'Cancelled','Pending',2,'Status changed from Cancelled to Pending','2026-07-23 10:50:54'),(5,2,'Pending','Cancelled',2,'Status changed from Pending to Cancelled','2026-07-23 10:51:01'),(6,2,'Cancelled','Ordered',2,'Status changed from Cancelled to Ordered','2026-07-23 10:51:11'),(7,3,'','Pending',4,'Order created','2026-07-24 11:56:37'),(8,4,'','Pending',4,'Order created','2026-07-24 13:58:38'),(9,5,'','Pending',4,'Order created','2026-07-24 14:00:01'),(10,2,'Ordered','Received',2,'Status changed from Ordered to Received','2026-07-25 13:41:47'),(11,6,'','Pending',5,'Order created','2026-08-07 12:11:59');
/*!40000 ALTER TABLE `order_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shop_id` int NOT NULL,
  `transaction_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receipt_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` float NOT NULL,
  `plan` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_date` datetime NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,2,'TXN-20260724072952-1540','REC-20260724-0001',1500,'Standard','mobile_money','completed','Farhan Rashid','nothernken@gmail.com','07896543','2026-07-24 04:29:00','done','2026-07-24 07:29:52','2026-07-24 07:29:52'),(2,2,'TXN-20260724074854-4378','REC-20260724-0002',1500,'Standard','mobile_money','completed','Farhan Rashid','nothernken@gmail.com','07896543','2026-08-23 19:48:00','done','2026-07-24 07:48:55','2026-07-24 10:30:07'),(3,3,'TXN-20260724075021-1705','REC-20260724-0003',1500,'Premium','mobile_money','completed','ali','info@jj.com','0110676959','2026-07-24 07:49:00','ok','2026-07-24 07:50:22','2026-07-24 07:50:22'),(4,5,'TXN-20260807104407-5632','REC-20260807-0001',2481,'Basic','mobile_money','pending','Ali Mahamed','filsan@gmail.com','012987265','2026-08-07 07:43:00','ok','2026-08-07 10:44:07','2026-08-07 10:44:07');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` float NOT NULL,
  `cost` float DEFAULT NULL,
  `stock` int DEFAULT NULL,
  `image_emoji` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `stock_limit` int DEFAULT NULL,
  `supplier_id` int DEFAULT NULL,
  `shop_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `supplier_id` (`supplier_id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Wheel','WL001','Its cheep to get .',5000,4500,7,'📦','http://localhost:5000/uploads/6cc4b296a70b44e68f3b8e6b2fa9f7fc.jpg','2026-07-17 12:01:45','2026-07-22 09:02:42',1,50,NULL,1),(2,'Laptop','LP001','its quality item.',25000,24000,7,'📦','http://localhost:5000/uploads/9f02ca91710c44bcbe17e2cde6977ef7.jpg','2026-07-17 12:40:00','2026-07-22 09:03:43',1,50,NULL,1),(3,'FiberOptics','FP001','Transmit network in long distances.',3000,2900,0,'📦','http://localhost:5000/uploads/32dcd527a651442f894ba3954747ed72.webp','2026-07-18 07:31:30','2026-07-22 09:03:43',1,4,NULL,1),(4,'bg','kk','vv',600,499.97,5,'📦','','2026-07-21 06:20:55','2026-07-22 09:03:43',1,10,NULL,1),(5,'Sugar','SG001','Sugar',4000,3900,500,'📦','http://localhost:5000/uploads/8be918dfdedc46218dd27d2dcb1c0be6.jpg','2026-07-22 09:08:59','2026-07-22 09:08:59',1,100,NULL,1),(6,'Sugar','SK00','sugar',5000,4000,210,'📦','http://localhost:5000/uploads/d25265c4f17c4f4abcf614d93bef436f.jpg','2026-07-22 11:04:52','2026-07-25 13:41:47',1,80,NULL,2),(7,'ssd','sdds','',700,800,79,'📦','','2026-07-24 11:40:59','2026-07-24 11:43:45',1,15,NULL,4),(8,'BOOKS','MANUAL-20260724135837-1','Added from purchase order',100,0,0,'📦',NULL,'2026-07-24 13:58:38','2026-07-24 13:58:38',1,50,4,4),(9,'i9u9u98','MANUAL-20260724140001-1','Added from purchase order',786,0,0,'📦',NULL,'2026-07-24 14:00:01','2026-07-24 14:00:01',1,50,4,4),(10,'Laptop','MAC ','mac ijyh ash',100000,95000,90,'📦','http://localhost:5000/uploads/485452bf42be44a0a346749ca6667e9f.jpg','2026-07-25 13:47:50','2026-07-25 13:57:30',1,25,NULL,2),(11,'Lapi','L001','okijuhy',30000,29000,17,'📦','http://localhost:5000/uploads/31117c6b4b9641e2ba12775cf66de59b.jpg','2026-08-07 11:26:32','2026-08-07 11:34:46',1,5,NULL,5);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order_items`
--

DROP TABLE IF EXISTS `purchase_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_sku` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `price` float NOT NULL,
  `total` float NOT NULL,
  `received_quantity` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `shop_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  KEY `fk_purchase_order_items_shop_id` (`shop_id`),
  CONSTRAINT `fk_purchase_order_items_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`),
  CONSTRAINT `purchase_order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_items`
--

LOCK TABLES `purchase_order_items` WRITE;
/*!40000 ALTER TABLE `purchase_order_items` DISABLE KEYS */;
INSERT INTO `purchase_order_items` VALUES (1,1,1,'Wheel','WL001',1,5000,5000,0,'2026-07-21 08:23:27',0),(2,1,2,'Laptop','LP001',1,25000,25000,0,'2026-07-21 08:23:27',0),(3,2,6,'Sugar','SK00',10,5000,50000,0,'2026-07-23 09:21:08',2),(4,3,7,'ssd','sdds',2,700,1400,0,'2026-07-24 11:56:37',4),(5,4,8,'BOOKS','MANUAL-20260724135837-1',6,100,600,0,'2026-07-24 13:58:38',4),(6,5,9,'i9u9u98','MANUAL-20260724140001-1',1,786,786,0,'2026-07-24 14:00:01',4);
/*!40000 ALTER TABLE `purchase_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_id` int NOT NULL,
  `order_date` date NOT NULL,
  `subtotal` float DEFAULT NULL,
  `tax` float DEFAULT NULL,
  `discount` float DEFAULT NULL,
  `total` float NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `shop_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `supplier_id` (`supplier_id`),
  KEY `fk_purchase_orders_shop_id` (`shop_id`),
  CONSTRAINT `fk_purchase_orders_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`),
  CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES (1,'PO-20260721-0001',1,'2026-07-21',30000,4800,0,34800,'','Pending',1,'2026-07-21 08:23:27','2026-07-21 08:23:27',1),(2,'PO-02-20260723-0001',3,'2026-07-23',50000,8000,0,58000,'OK','Received',2,'2026-07-23 09:21:08','2026-07-25 13:41:47',2),(3,'PO-04-20260724-0001',4,'2026-07-24',1400,224,0,1624,'','Pending',4,'2026-07-24 11:56:37','2026-07-24 11:56:37',4),(4,'PO-04-20260724-0002',4,'2026-07-24',600,0,0,600,'','Pending',4,'2026-07-24 13:58:38','2026-07-24 13:58:38',4),(5,'PO-04-20260724-0003',4,'2026-07-24',786,0,10,776,'','Pending',4,'2026-07-24 14:00:01','2026-07-24 14:00:01',4),(6,'PO-05-20260807-0001',6,'2026-08-07',2000000,320000,0,2320000,'ok','Pending',5,'2026-08-07 12:11:59','2026-08-07 12:11:59',5);
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `return_items`
--

DROP TABLE IF EXISTS `return_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `return_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `return_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_sku` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `price` float NOT NULL,
  `refund_amount` float NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `condition` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `shop_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `return_id` (`return_id`),
  KEY `fk_return_items_shop_id` (`shop_id`),
  CONSTRAINT `fk_return_items_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`),
  CONSTRAINT `return_items_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `return_items_ibfk_2` FOREIGN KEY (`return_id`) REFERENCES `returns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `return_items_ibfk_3` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `return_items`
--

LOCK TABLES `return_items` WRITE;
/*!40000 ALTER TABLE `return_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `return_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `returns`
--

DROP TABLE IF EXISTS `returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `returns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `return_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sale_id` int NOT NULL,
  `customer_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `total` float NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `shop_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `return_number` (`return_number`),
  KEY `sale_id` (`sale_id`),
  KEY `fk_returns_shop_id` (`shop_id`),
  CONSTRAINT `fk_returns_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`),
  CONSTRAINT `returns_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `returns_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `returns`
--

LOCK TABLES `returns` WRITE;
/*!40000 ALTER TABLE `returns` DISABLE KEYS */;
/*!40000 ALTER TABLE `returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items`
--

DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_sku` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `price` float NOT NULL,
  `cost` float DEFAULT NULL,
  `discount` float DEFAULT NULL,
  `total` float NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `shop_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `sale_id` (`sale_id`),
  KEY `fk_sale_items_shop_id` (`shop_id`),
  CONSTRAINT `fk_sale_items_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`),
  CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sale_items_ibfk_2` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items`
--

LOCK TABLES `sale_items` WRITE;
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
INSERT INTO `sale_items` VALUES (1,1,2,'Laptop','LP001',40,25000,24000,0,1000000,'2026-07-18 07:54:08',0),(2,2,3,'FiberOptics','FP001',4,3000,2900,0,12000,'2026-07-18 08:50:48',0),(3,3,1,'Wheel','WL001',10,5000,4500,0,50000,'2026-07-20 09:30:47',0),(4,4,1,'Wheel','WL001',2,5000,4500,0,10000,'2026-07-21 06:27:15',0),(5,4,2,'Laptop','LP001',1,25000,24000,0,25000,'2026-07-21 06:27:15',0),(6,5,2,'Laptop','LP001',1,25000,24000,0,25000,'2026-07-21 07:10:15',0),(7,5,4,'bg','kk',1,600,499.97,0,600,'2026-07-21 07:10:15',0),(8,6,6,'Sugar','SK00',50,5000,4000,0,250000,'2026-07-22 11:20:33',2),(9,7,7,'ssd','sdds',1,700,800,0,700,'2026-07-24 11:43:45',4),(10,8,10,'Laptop','MAC ',10,100000,95000,0,1000000,'2026-07-25 13:57:30',2),(11,9,11,'Lapi','L001',3,30000,29000,0,90000,'2026-08-07 11:34:46',5);
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_payments`
--

DROP TABLE IF EXISTS `sale_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` float NOT NULL,
  `reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `shop_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sale_id` (`sale_id`),
  KEY `fk_sale_payments_shop_id` (`shop_id`),
  CONSTRAINT `fk_sale_payments_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`),
  CONSTRAINT `sale_payments_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_payments`
--

LOCK TABLES `sale_payments` WRITE;
/*!40000 ALTER TABLE `sale_payments` DISABLE KEYS */;
INSERT INTO `sale_payments` VALUES (1,1,'M-Pesa',1160000,NULL,'Completed','2026-07-18 07:54:08',1),(2,2,'PayPal',13920,NULL,'Completed','2026-07-18 08:50:48',1),(3,3,'M-Pesa',58000,NULL,'Completed','2026-07-20 09:30:47',1),(4,4,'Cash',40600,NULL,'Completed','2026-07-21 06:27:15',1),(5,5,'M-Pesa',29696,NULL,'Completed','2026-07-21 07:10:15',1),(6,6,'M-Pesa',290000,NULL,'Completed','2026-07-22 11:20:33',2),(7,7,'M-Pesa',812,NULL,'Completed','2026-07-24 11:43:45',4),(8,8,'Cash',995000,NULL,'Completed','2026-07-25 13:57:30',2),(9,9,'Cash',90000,NULL,'Completed','2026-08-07 11:34:46',5);
/*!40000 ALTER TABLE `sale_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtotal` float DEFAULT NULL,
  `tax` float DEFAULT NULL,
  `discount` float DEFAULT NULL,
  `total` float NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `customer_id` int DEFAULT NULL,
  `shop_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sale_number` (`sale_number`),
  KEY `customer_id` (`customer_id`),
  KEY `fk_sales_shop_id` (`shop_id`),
  CONSTRAINT `fk_sales_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES (1,'S-20260718-0001','Hassan Abdi','hassan2030abdi@gmail.com','0110676959','M-Pesa',1000000,160000,0,1160000,'Delivered.','Cancelled',1,'2026-07-18 07:54:08','2026-07-20 09:21:38',NULL,1),(2,'S-20260718-0002','Adow Dahir','adow@gmail.com','0797393708','PayPal',12000,1920,0,13920,'Done','Cancelled',1,'2026-07-18 08:50:48','2026-07-20 09:27:09',NULL,1),(3,'S-20260720-0001','Hassan Abdi','hassan2030abdi@gmail.com','0110676959','M-Pesa',50000,8000,0,58000,'Sales on hands.','Completed',1,'2026-07-20 09:30:47','2026-07-20 09:30:47',1,1),(4,'S-20260721-0001','','','','Cash',35000,5600,0,40600,'','Cancelled',1,'2026-07-21 06:27:15','2026-07-21 07:09:24',NULL,1),(5,'S-20260721-0002','','Ali@gmail.com','078965432','M-Pesa',25600,4096,0,29696,'','Completed',1,'2026-07-21 07:10:15','2026-07-21 07:10:15',NULL,1),(6,'S02-20260722-0001','Hassan Abdi','hassan2030abdi@gmail.com','0110676959','M-Pesa',250000,40000,0,290000,'','Completed',2,'2026-07-22 11:20:33','2026-07-22 11:20:33',4,2),(7,'S04-20260724-0001','','hassan2030abdi@gmail.com','758995544','M-Pesa',700,112,0,812,'','Completed',4,'2026-07-24 11:43:45','2026-07-24 11:43:45',NULL,4),(8,'S02-20260725-0001','Ahmed  Khalif','ahmed@gmail.com','078965443','Cash',1000000,NULL,5000,995000,'','Completed',2,'2026-07-25 13:57:30','2026-07-25 13:57:30',5,2),(9,'S05-20260807-0001','','ali@gmail.com','078965432','Cash',90000,NULL,0,90000,'','Completed',5,'2026-08-07 11:34:46','2026-08-07 11:34:46',NULL,5);
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `shop_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`),
  KEY `fk_settings_shop_id` (`shop_id`),
  CONSTRAINT `fk_settings_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'theme','light','appearance',0,'2026-07-21 08:39:23','2026-07-21 08:39:50',1),(2,'accent_color','blue-600','appearance',0,'2026-07-21 08:39:23','2026-07-21 08:39:50',1),(3,'font_size','medium','appearance',0,'2026-07-21 08:39:23','2026-07-21 08:39:50',1),(4,'store_name','al iman store','general',0,'2026-07-24 11:48:35','2026-07-24 11:48:35',4),(5,'store_email','hassan2030abdi@gmail.com','general',0,'2026-07-24 11:48:35','2026-07-24 11:48:35',4),(6,'store_phone','+254 712 345 678','general',0,'2026-07-24 11:48:35','2026-07-24 11:48:35',4),(7,'store_address','al faruq','general',0,'2026-07-24 11:48:35','2026-07-24 11:48:35',4),(8,'store_city','garissa','general',0,'2026-07-24 11:48:35','2026-07-24 11:48:35',4),(9,'store_state','garissa','general',0,'2026-07-24 11:48:35','2026-07-24 11:48:35',4),(10,'store_zip','70100','general',0,'2026-07-24 11:48:35','2026-07-24 11:48:35',4),(11,'store_country','Kenya','general',0,'2026-07-24 11:48:35','2026-07-24 11:48:35',4),(12,'timezone','Africa/Nairobi','general',0,'2026-07-24 11:48:35','2026-07-24 11:48:35',4),(13,'currency','KES','regional',0,'2026-07-24 11:48:35','2026-07-24 11:49:02',4),(14,'date_format','MM/DD/YYYY','regional',0,'2026-07-24 11:49:02','2026-07-24 11:49:02',4),(15,'time_format','24h','regional',0,'2026-07-24 11:49:02','2026-07-24 11:49:02',4),(16,'language','en','regional',0,'2026-07-24 11:49:02','2026-07-24 11:49:02',4);
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shops`
--

DROP TABLE IF EXISTS `shops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shops` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subscription` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revenue` float DEFAULT NULL,
  `users_count` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `last_active` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shops`
--

LOCK TABLES `shops` WRITE;
/*!40000 ALTER TABLE `shops` DISABLE KEYS */;
INSERT INTO `shops` VALUES (1,'KALKAL','kalkal@gmail.com','0110676959','Garissa','Hussein  Ahmed','$2b$12$NqUNajXyySyeVhwgHAf/E.grlBtFKYb6tGw.VMs5rVs8ctAoaclFq','active','basic',0,0,'2026-07-22 08:18:53','2026-07-25 14:12:53','2026-07-25 14:12:53'),(2,'NothernKen','nothernken@gmail.com','07896543','Garissa','Farhan Rashid','$2b$12$3/wW3tP.IaBADUfvoIEN2.lzOE4FBjDJUQiR.GD8T.ChwgdjZfTHe','active','standard',0,0,'2026-07-22 09:10:24','2026-07-25 13:28:15','2026-07-25 13:28:15'),(3,'al-barakat','info@jj.com','0110676959','Mandera','ali','$2b$12$EurUG8379S4A7bWVH/2vfek/KXR3uig8s1QiCB1c440qY4e32mBQm','active','premium',0,0,'2026-07-23 13:53:38','2026-07-24 06:48:23','2026-07-23 13:58:27'),(4,'al iman','aliman@gmail.com','07654332245','garissa','ali','$2b$12$YarsOm2BBkS84YuuQY3wa.j9mJ1hIyvk1GatD6cFj.KCbcXOGN7om','active','basic',0,0,'2026-07-24 11:37:52','2026-08-07 09:46:37','2026-07-24 11:39:00'),(5,'Filsan','filsan@gmail.com','012987265','Garissa','Ali Mahamed','$2b$12$gCHP7va6V5fUZe81xwCfLelEYVXVFj5mUwXSY.DbMjItELEv/bQOu','active','basic',0,0,'2026-08-07 10:24:27','2026-08-07 14:45:07','2026-08-07 14:45:07');
/*!40000 ALTER TABLE `shops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `join_date` date NOT NULL,
  `salary` float DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `performance` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tasks` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `employee_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `shop_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  UNIQUE KEY `uq_staff_shop_email` (`shop_id`,`email`),
  CONSTRAINT `fk_staff_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (1,'Khalif','Jamac','khalif@gmail.com','078967543','0047','NAIROBI','Eastern','KENYA','254','Inventory Specialist','Inventory','2026-07-10',180000,'Active','Excellent',0,'Great','EMP-2026-0001','2026-07-21 06:06:38','2026-07-21 06:06:38',0),(2,'Hassan','Abdi','hassan2030abdi@gmail.com','0110676959','Bula Madina','Garissa Township','NK','Kenya','007','Inventory Specialist','Sales','2026-07-25',1000000,'Active','Excellent',0,'ok','EMP-2-2026-0001','2026-07-25 13:39:21','2026-07-25 13:39:21',2),(6,'Hassan','Abdi','hassan2030abdii@gmail.com','0110676959','Bula Madina','Garissa Township','NK','Kenya','007','Cashier','Sales','2026-07-25',50000,'Active','Excellent',0,'ok','EMP-1-2026-0001','2026-07-25 14:19:01','2026-07-25 14:19:01',1),(11,'Hassan','Abdi','hassan2030abdi@gmail.com','0110676959','Bula Madina','Garissa Township','NK','Kenya','007','Cashier','Sales','2026-08-07',50000,'Active','Good',0,'m.a','EMP-05-0001','2026-08-07 13:43:40','2026-08-07 13:43:40',5);
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_products` int DEFAULT NULL,
  `total_orders` int DEFAULT NULL,
  `total_spent` float DEFAULT NULL,
  `rating` float DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `last_order_date` datetime DEFAULT NULL,
  `item_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shop_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_shop_email` (`shop_id`,`email`),
  CONSTRAINT `fk_suppliers_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Ahmed Ali','Hassan Abdi','hassan2030abdi@gmail.com','0110676959','Bula Madina','Garissa Township','NK','Kenya','007',0,1,0,4.8,'Active','done','2026-07-20 09:50:33','2026-07-21 08:23:27','2026-07-21 08:23:27','Laptop',0),(3,'Amazon','Hassan Abdi','hassan2030abdi@gmail.com','0110676959','Bula Madina','Garissa Township','NK','Kenya','007',0,1,0,4.8,'Active','OK','2026-07-23 09:16:34','2026-07-23 09:21:08','2026-07-23 09:21:08','',2),(4,'nknll','Hassan Abdi','hassan2030abdi@gmail.com','0110676959','Bula Madina','Garissa Township','ll','Kenya','007',0,3,0,4.9,'Active','','2026-07-24 11:55:46','2026-07-24 14:00:01','2026-07-24 14:00:01','ssd',4),(5,'AI Toolers','Khalid','Khalid@gmail.com','098765434','001','Nairobi','Central','Kenya','254',0,0,0,5,'Active','ok','2026-07-25 14:15:51','2026-07-25 14:15:51',NULL,'',1),(6,'celecon','078965443','hassan@gmail.com','0111234567','GJWW+PC5','Garissa','NK','Kenya','007',0,1,0,1.6,'Active','OK','2026-08-07 11:40:07','2026-08-07 12:11:59','2026-08-07 12:11:59','',5);
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_security`
--

DROP TABLE IF EXISTS `user_security`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_security` (
  `id` int NOT NULL AUTO_INCREMENT,
  `two_factor_auth` tinyint(1) DEFAULT NULL,
  `session_timeout` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `shop_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_user_security_shop_id` (`shop_id`),
  CONSTRAINT `fk_user_security_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_security`
--

LOCK TABLES `user_security` WRITE;
/*!40000 ALTER TABLE `user_security` DISABLE KEYS */;
INSERT INTO `user_security` VALUES (1,0,30,'2026-07-21 08:33:03','2026-07-21 08:33:03',1),(2,0,30,'2026-07-22 10:57:55','2026-07-22 10:57:55',2),(3,0,30,'2026-07-23 15:18:17','2026-07-23 15:18:17',3),(4,0,30,'2026-07-24 11:46:34','2026-07-24 11:46:34',4),(5,0,30,'2026-08-07 13:58:37','2026-08-07 13:58:37',5);
/*!40000 ALTER TABLE `user_security` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-13 16:54:31
