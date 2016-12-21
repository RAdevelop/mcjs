-- MySQL dump 10.16  Distrib 10.1.19-MariaDB, for osx10.11 (x86_64)
--
-- Host: mcjs    Database: mcjs
-- ------------------------------------------------------
-- Server version	10.1.19-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `album`
--

DROP TABLE IF EXISTS `album`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `album` (
  `a_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `u_id` int(11) unsigned NOT NULL,
  `a_type_id` tinyint(3) unsigned NOT NULL,
  `a_name` varchar(100) NOT NULL,
  `a_alias` varchar(100) NOT NULL,
  `a_img_cnt` smallint(5) unsigned NOT NULL DEFAULT '0',
  `a_create_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `a_update_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `a_text` varchar(255) NOT NULL,
  PRIMARY KEY (`a_id`),
  KEY `uid` (`u_id`,`a_type_id`),
  KEY `uts` (`u_id`,`a_update_ts`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `album`
--

LOCK TABLES `album` WRITE;
/*!40000 ALTER TABLE `album` DISABLE KEYS */;
INSERT INTO `album` VALUES (1,1,2,'Фотографии профиля','fotografii-profilya',11,1471983315,1481478672,'Фотографии профиля'),(2,1,3,'абв','abv',15,1471983485,1480874049,'абв'),(4,1,3,'4333xx','4333xx',13,1471983621,1481707079,'4222zzz');
/*!40000 ALTER TABLE `album` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `album_image`
--

DROP TABLE IF EXISTS `album_image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `album_image` (
  `ai_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `a_id` int(10) unsigned NOT NULL,
  `u_id` int(11) unsigned NOT NULL,
  `ai_create_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `ai_update_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `ai_latitude` decimal(10,8) DEFAULT NULL,
  `ai_longitude` decimal(11,8) DEFAULT NULL,
  `ai_text` varchar(255) NOT NULL,
  `ai_dir` varchar(255) NOT NULL,
  `ai_pos` smallint(5) unsigned NOT NULL DEFAULT '0',
  `ai_name` varchar(255) NOT NULL,
  `ai_profile` tinyint(1) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`ai_id`),
  KEY `aid_uid_pos` (`a_id`,`u_id`,`ai_pos`,`ai_update_ts`),
  KEY `aid_uid_profile` (`a_id`,`u_id`,`ai_profile`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `album_image`
--

LOCK TABLES `album_image` WRITE;
/*!40000 ALTER TABLE `album_image` DISABLE KEYS */;
INSERT INTO `album_image` VALUES (1,1,1,1471983315,1471983317,NULL,NULL,'','/user/photo/0/1/1/6512bd43d9caa6e02c990b0a82652dca',10,'_gp_2126.gallery_full_top_fullscreen.jpg',0),(2,2,1,1471983496,1471983499,NULL,NULL,'','/user/photo/0/2/2/b6d767d2f8ed5d21a44b0e5886680cb9',14,'26-dani-pedrosa-esp_gp_3449.gallery_full_top_fullscreen.jpg',0),(3,2,1,1471983496,1471983499,NULL,NULL,'','/user/photo/0/2/3/37693cfc748049e45d87b8c7d8b9aacd',13,'25-maverick-vinales-esp_gp_3613.gallery_full_top_fullscreen.jpg',0),(4,2,1,1471983496,1471983499,NULL,NULL,'','/user/photo/0/2/4/1ff1de774005f8da13f42943881c655f',12,'29-andrea-iannone-ita-46-valentino-rossi-ita_gp_3090.gallery_full_top_fullscreen.jpg',0),(8,4,1,1471983631,1471983634,NULL,NULL,'','/user/photo/0/4/8/642e92efb79421734881b53e1e1b18b6',12,'93-marc-marquez-esp_gp_4858.gallery_full_top_fullscreen.jpg',0),(9,4,1,1471983631,1471983635,NULL,NULL,'','/user/photo/0/4/9/f457c545a9ded88f18ecee47145a72c0',10,'99-jorge-lorenzo-esp_5n27532.gallery_full_top_fullscreen.jpg',0),(10,4,1,1471983631,1471983634,NULL,NULL,'','/user/photo/0/4/10/1068c6e4c8051cfd4e9ea8072e3189e2',11,'99-jorge-lorenzo-esp_gp_3592_0.gallery_full_top_fullscreen.jpg',0),(11,4,1,1471985839,1471985840,NULL,NULL,'','/user/photo/0/4/11/17d63b1625c816c22647a73e1482372b',9,'vertical.jpg',0),(12,4,1,1472020026,1472020031,NULL,NULL,'','/user/photo/0/4/12/b9228e0962a78b84f3d5d92f4faa000b',5,'25-maverick-vinales-esp_gp_3613.gallery_full_top_fullscreen.jpg',0),(13,4,1,1472020026,1472020031,NULL,NULL,'','/user/photo/0/4/13/0deb1c54814305ca9ad266f53bc82511',7,'29-andrea-iannone-ita-46-valentino-rossi-ita_gp_3090.gallery_full_top_fullscreen.jpg',0),(14,4,1,1472020026,1472020031,NULL,NULL,'','/user/photo/0/4/14/66808e327dc79d135ba18e051673d906',6,'46-valentino-rossi-ita_5n27825.gallery_full_top_fullscreen.jpg',0),(15,4,1,1472020026,1472020031,NULL,NULL,'','/user/photo/0/4/15/42e7aaa88b48137a16a1acd04ed91125',8,'45-scott-redding-eng_gp_0163.gallery_full_top_fullscreen.jpg',0),(16,4,1,1472020026,1472020031,NULL,NULL,'','/user/photo/0/4/16/8fe0093bb30d6f8c31474bd0764e6ac0',4,'26-dani-pedrosa-esp_gp_3449.gallery_full_top_fullscreen.jpg',0),(17,4,1,1472020410,1472020414,55.97101972,37.25511169,'фирса2','/user/photo/0/4/17/41ae36ecb9b3eee609d05b90c14222fb',2,'IMG_20160613_194702.jpg',0),(18,4,1,1472729714,1472729715,NULL,NULL,'zxc','/user/photo/0/4/18/d1f255a373a3cef72e03aa9d980c7eca',3,'vertical.jpg',0),(19,2,1,1473116771,1473116771,NULL,NULL,'','/user/photo/0/2/19/c0e190d8267e36708f955d7ab048990d',10,'Русский Форсаж.jpg',0),(20,1,1,1473116797,1473116804,55.97101972,37.25511169,'','/user/photo/0/1/20/da4fb5c6e93e74d3df8527599fa62642',9,'IMG_20160613_194702.jpg',0),(21,1,1,1473159422,1473159423,NULL,NULL,'','/user/photo/0/1/21/4c56ff4ce4aaf9573aa5dff913df997a',8,'motogp.jpg',0),(22,2,1,1473409631,1473409632,NULL,NULL,'alert(\"RA\");alert(\"AD\");','/user/photo/0/2/22/bcbe3365e6ac95ea2c0343a2395834dd',11,'N8AbgYhfPGI.jpg',0),(23,2,1,1473409631,1473409636,55.97101972,37.25511169,'','/user/photo/0/2/23/115f89503138416a242f40fb7d7f338e',9,'IMG_20160613_194702.jpg',0),(24,1,1,1473531121,1473531123,NULL,NULL,'','/user/photo/0/1/24/c8ffe9a587b126f152ed3d89a146b445',7,'99-jorge-lorenzo-esp_gp_3592_0.gallery_full_top_fullscreen.jpg',0),(25,2,1,1473532485,1473532488,NULL,NULL,'','/user/photo/0/2/25/d1c38a09acc34845c6be3a127a5aacaf',8,'_gp_2126.gallery_full_top_fullscreen.jpg',0),(26,2,1,1473532485,1473532488,NULL,NULL,'','/user/photo/0/2/26/9cfdf10e8fc047a44b08ed031e1f0ed1',7,'_gp_5790_e.gallery_full_top_fullscreen.jpg',0),(28,2,1,1473764363,1473764364,NULL,NULL,'','/user/photo/0/2/28/74db120f0a8e5646ef5a30154e9f6deb',6,'banda.jpg',0),(31,2,1,1473764888,1473764888,NULL,NULL,'','/user/photo/0/2/31/9b04d152845ec0a378394003c96da594',4,'vertical.jpg',0),(32,1,1,1473858657,1473858659,NULL,NULL,'','/user/photo/0/1/32/65ded5353c5ee48d0b7d48c591b8f430',6,'vetal_sega.jpg',0),(34,2,1,1473865023,1473865025,NULL,NULL,'sdf','/user/photo/0/2/34/289dff07669d7a23de0ef88d2f7129e7',5,'99-jorge-lorenzo-esp_5n27532.gallery_full_top_fullscreen.jpg',0),(35,1,1,1473865047,1473865049,NULL,NULL,'','/user/photo/0/1/35/7f1de29e6da19d22b51c68001e7e0e54',5,'46-valentino-rossi-ita_5n27825.gallery_full_top_fullscreen.jpg',0),(36,2,1,1473885968,1473885970,NULL,NULL,'','/user/photo/0/2/36/01161aaa0b6d1345dd8fe4e481144d84',2,'vetal_sega.jpg',0),(38,2,1,1476111546,1476111547,NULL,NULL,'x','/user/photo/0/2/38/ac1dd209cbcc5e5d1c6e28598e8cbbe8',3,'_gp_5790_e.gallery_full_top_fullscreen.jpg',0),(39,2,1,1480873651,1480873656,55.97101972,37.25511169,'','/user/photo/0/2/39/555d6702c950ecb729a966504af0a635',0,'IMG_20160613_194702.jpg',0),(40,2,1,1480874048,1480874049,NULL,NULL,'','/user/photo/0/2/40/335f5352088d7d9bf74191e006d8e24c',1,'motogp.jpg',0),(41,1,1,1481056857,1481056858,NULL,NULL,'','/user/photo/0/1/41/0f28b5d49b3020afeecd95b4009adf4c',4,'me.jpg',0),(43,1,1,1481472268,1481472275,55.97101972,37.25511169,'','/user/photo/0/1/43/903ce9225fca3e988c2af215d4e544d3',3,'IMG_20160613_194702.jpg',0),(45,4,1,1481473539,1481473542,NULL,NULL,'','/user/photo/0/4/45/67f7fb873eaf29526a11a9b7ac33bfac',1,'motogp.jpg',0),(46,1,1,1481477012,1481477013,NULL,NULL,'','/user/photo/0/1/46/a5e00132373a7031000fd987a3c9f87b',2,'93-marc-marquez-esp_gp_4858.gallery_full_top_fullscreen.jpg',0),(47,1,1,1481477499,1481477500,NULL,NULL,'','/user/photo/0/1/47/8d5e957f297893487bd98fa830fa6413',1,'me.jpg',0),(48,1,1,1481478671,1481478672,NULL,NULL,'','/user/photo/0/1/48/47d1e990583c9c67424d369f3414728e',0,'me.jpg',1),(49,4,1,1481707078,1481707079,NULL,NULL,'','/user/photo/0/4/49/d61e4bbd6393c9111e6526ea173a7c8b',0,'me.jpg',0);
/*!40000 ALTER TABLE `album_image` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `album_type`
--

DROP TABLE IF EXISTS `album_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `album_type` (
  `a_type_id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `a_type_name` varchar(45) NOT NULL,
  `a_type_alias` varchar(45) NOT NULL,
  PRIMARY KEY (`a_type_id`),
  UNIQUE KEY `alias` (`a_type_alias`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `album_type`
--

LOCK TABLES `album_type` WRITE;
/*!40000 ALTER TABLE `album_type` DISABLE KEYS */;
INSERT INTO `album_type` VALUES (1,'Загруженные фото','uploaded'),(2,'Фото профиля','profile'),(3,'Именованный альбом','named');
/*!40000 ALTER TABLE `album_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `controllers`
--

DROP TABLE IF EXISTS `controllers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `controllers` (
  `c_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `c_pid` smallint(5) unsigned NOT NULL DEFAULT '0',
  `c_path` varchar(255) NOT NULL,
  `c_name` varchar(100) NOT NULL,
  `c_desc` text NOT NULL,
  `c_level` tinyint(3) unsigned NOT NULL,
  `c_lk` smallint(5) unsigned NOT NULL,
  `c_rk` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`c_id`),
  UNIQUE KEY `path` (`c_path`),
  KEY `lrk_level` (`c_lk`,`c_rk`,`c_level`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8 COMMENT='храним информацию о роутерах проекта';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `controllers`
--

LOCK TABLES `controllers` WRITE;
/*!40000 ALTER TABLE `controllers` DISABLE KEYS */;
INSERT INTO `controllers` VALUES (1,0,'/admin','Админка','Админ стартовая страница',1,1,10),(4,1,'/admin/controller','Контроллеры (роутеры) сайта','Контроллеры (роутеры) сайта',2,4,5),(5,1,'/admin/menu','Меню сайта','Меню сайта',2,2,3),(6,21,'/news','Новости','Новости',2,26,27),(7,21,'/blog','Блог','Блог',2,24,25),(8,21,'/events','События','События',2,22,23),(9,21,'/chat','Чат','Чат',2,20,21),(10,21,'/mototreki','МотоТреки','МотоТреки',2,18,19),(11,21,'/motoshop','МотоСалоны','МотоСалоны',2,16,17),(12,21,'/admoto','Объявления','Объявления',2,14,15),(13,21,'/user','Пользователи','Пользователи',2,12,13),(20,1,'/admin/user/groups','Группы пользователей','Группы пользователей',2,8,9),(21,0,'/home','Главная страница','Главная страница',1,11,28),(22,1,'/admin/user','Управление пользователями','Управление пользователями',2,6,7),(23,0,'/profile','Профиль пользователя','Профиль пользователя',1,29,34),(24,23,'/profile/photo','Фотографии','Фотографии',2,30,31),(25,23,'/profile/video','Видео пользователя','Видео пользователя',2,32,33);
/*!40000 ALTER TABLE `controllers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `controllers_methods`
--

DROP TABLE IF EXISTS `controllers_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `controllers_methods` (
  `cm_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `cm_method` varchar(33) NOT NULL,
  `cm_name` varchar(100) DEFAULT NULL,
  `cm_desc` varchar(255) DEFAULT NULL,
  `c_id` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`cm_id`),
  UNIQUE KEY `c_id_method` (`c_id`,`cm_method`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `controllers_methods`
--

LOCK TABLES `controllers_methods` WRITE;
/*!40000 ALTER TABLE `controllers_methods` DISABLE KEYS */;
INSERT INTO `controllers_methods` VALUES (1,'get_index','','','1'),(2,'post_index','','','1'),(5,'get_add','','','1'),(6,'post_add','','','1'),(7,'get_edit','','','1'),(8,'post_edit','','','1'),(9,'get_index','','','21'),(10,'get_index','','','22'),(11,'post_edit','','','22'),(12,'get_index','','','5'),(13,'get_edit','','','5'),(14,'post_edit','','','5'),(15,'get_index','','','4'),(16,'get_edit','','','4'),(17,'post_edit','','','4'),(19,'get_index','','','20'),(20,'post_edit','','','20'),(21,'get_index','','','13'),(22,'get_index','','','11'),(23,'get_add','','','11'),(24,'post_add','','','11'),(25,'get_edit','','','11'),(26,'post_edit','','','11'),(27,'get_map','','','11'),(28,'get_index','','','10'),(29,'get_add','','','10'),(30,'post_add','','','10'),(31,'get_edit','','','10'),(32,'post_edit','','','10'),(33,'get_map','','','10'),(34,'get_index','','','9'),(35,'get_index','','','8'),(36,'get_add','','','8'),(37,'post_add','','','8'),(38,'get_edit','','','8'),(39,'post_edit','','','8'),(40,'get_map','','','8'),(41,'post_upload','','','8'),(42,'get_index','','','6'),(43,'get_add','','','6'),(44,'post_add','','','6'),(45,'get_edit','','','6'),(46,'post_edit','','','6'),(47,'post_upload','','','6'),(48,'get_edit','','','22'),(50,'get_edit','','','20'),(51,'get_index','','','23'),(52,'get_edit','','','23'),(53,'post_edit','','','23'),(54,'get_change','','','23'),(55,'post_ava','','','23'),(56,'get_index','','','24'),(57,'post_index','','','24'),(58,'post_upload','','','24'),(59,'get_index','','','25'),(60,'post_add','','','25'),(61,'post_index','','','25');
/*!40000 ALTER TABLE `controllers_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events_image`
--

DROP TABLE IF EXISTS `events_image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `events_image` (
  `ei_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `e_id` int(10) unsigned NOT NULL,
  `ei_create_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `ei_update_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `ei_latitude` decimal(10,8) DEFAULT NULL,
  `ei_longitude` decimal(11,8) DEFAULT NULL,
  `ei_dir` varchar(255) DEFAULT NULL,
  `ei_pos` smallint(5) unsigned NOT NULL DEFAULT '0',
  `ei_name` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`ei_id`),
  KEY `eid_pos` (`e_id`,`ei_pos`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events_image`
--

LOCK TABLES `events_image` WRITE;
/*!40000 ALTER TABLE `events_image` DISABLE KEYS */;
INSERT INTO `events_image` VALUES (8,3,1474931744,1474931745,NULL,NULL,'/events/0/3/8/a5771bce93e200c36f7cd9dfd0e5deaa',4,'Русский Форсаж.jpg'),(9,3,1481465693,1481465695,NULL,NULL,'/events/0/3/9/d67d8ab4f4c10bf22aa353e27879133c',3,'motogp.jpg'),(11,3,1481474989,1481474989,NULL,NULL,'/events/0/3/11/9dfcd5e558dfa04aaf37f137a1d9d3e5',2,'me.jpg'),(12,3,1481475365,1481475366,NULL,NULL,'/events/0/3/12/950a4152c2b4aa3ad78bdd6b366cc179',1,'N8AbgYhfPGI.jpg'),(13,3,1481475365,1481475370,55.97101972,37.25511169,'/events/0/3/13/158f3069a435b314a80bdcb024f8e422',0,'IMG_20160613_194702.jpg');
/*!40000 ALTER TABLE `events_image` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events_list`
--

DROP TABLE IF EXISTS `events_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `events_list` (
  `e_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `e_create_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `e_update_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `e_start_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `e_end_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `e_title` varchar(255) NOT NULL,
  `e_alias` varchar(255) NOT NULL,
  `e_notice` text NOT NULL,
  `e_text` text NOT NULL,
  `e_address` varchar(255) NOT NULL,
  `e_location_id` int(10) NOT NULL,
  `e_latitude` decimal(10,8) DEFAULT NULL,
  `e_longitude` decimal(11,8) DEFAULT NULL,
  `e_gps_lat` varchar(45) NOT NULL,
  `e_gps_lng` varchar(45) NOT NULL,
  `e_location_pids` varchar(100) NOT NULL,
  `u_id` int(11) unsigned NOT NULL,
  `e_img_cnt` tinyint(3) NOT NULL DEFAULT '0',
  PRIMARY KEY (`e_id`),
  KEY `ts_end_start` (`e_end_ts`,`e_start_ts`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events_list`
--

LOCK TABLES `events_list` WRITE;
/*!40000 ALTER TABLE `events_list` DISABLE KEYS */;
INSERT INTO `events_list` VALUES (3,1473787102,1481988710,1474578000,1474664400,'Финал международной мотофристайл-битвы в Москве в рамках шоу Adrenaline FMX Riders','final-megdunarodnoy-motofristayl-bitvi-v-moskve-v-ramkah-shou-adrenaline-fmx-riders','Финал международной мотофристайл- битвы в Москве в рамках шоу Adrenaline FMX RidersФинал международной мотофристайл- битвы в Москве в рамках шоу Adrenaline FMX Riders','<p>Ведущие FMX-райдеры России и Европы сойдутся в битве по мотофристайлу Adrenaline FMX Riders, которая состоится 15 августа на территории СК &laquo;Лужники&raquo; в Москве. Такое нельзя пропустить!</p>\r\n<p>Уникальное шоу и мотофристайл-битва Adrenaline FMX Riders подходит к своему завершающему третьему этапу. Мотофристайлеры из 6 стран покажут все свои возможности в финальной схватке за звание лучшего из лучших.</p>\r\n<p>В этом году любители экстремального спорта стали свидетелями новой уникальной шоу-программы Adrenaline FMX Riders, которая включает в себя состязательный элемент. Это значит, что мастера мотофристайла не только продемонстрируют умопомрачительные трюки, но также поборются за право встать на первое место подиума. Москва становится финалом мотофристайл-битвы, которая определит, кто из райдеров Германии, Франции, Испании, России, Польши и Латвии станет лучшим FMX-спортсменом шоу и получит долгожданный кубок шоу Adrenaline Rush&reg;! По сумме баллов в двух предыдущих этапах &ndash; в Санкт-Петербурге и Новосибирске &ndash; за лидерство поборются:</p>\r\n<ul class=\"images\">\r\n<li><img class=\"image\" src=\"/events/0/3/8/a5771bce93e200c36f7cd9dfd0e5deaa/512_384.jpg\" data-img-id=\"8\"></li>\r\n</ul>\r\n<p>Марк Пиньол (Испания) &ndash; 160 очковРоман Иззо (Франция) &ndash; 160 очковВладимир Ярыгин (Россия) &ndash; 120 очковНиколай Иванков (Россия)- 120 очковСудейская коллегия шоу, оценивающая мастерство исполнения основных FMX-элементов и сложнейших комбинационных прыжков, состоит из экстрим-райдеров с мировым именем: это участник X-Games Сэм Роджерс (США), Марко Пикадо (Коста-Рика), а также представитель Мотоциклетной Федерации России.</p>\r\n<p>Еще одним нововведением, которое уже оценили зрители мотофристайл-битв в Санкт-Петербурге и Новосибирске, стала абсолютно новая для России &laquo;перекрестная&raquo; площадка. Ее конструкция такова, что позволяет райдерам совершать прыжки крест-накрест &ndash; это увеличивает зрелищность шоу и количество вовлеченных зрителей, так как угол обзора всех трюков при таком расположении трамплинов и приземлений на площадке теперь приближен к максимально возможному.</p>\r\n<p>Узнать, кто же станет победителем шоу - первой российской мотофристайл-битвы Adrenaline FMX Riders, можно будет 15 августа на территории СК &laquo;Лужники&raquo;, начало в 18:00. Кроме того, поклонников легендарного шоу от Adrenaline Rush&reg; ждут выступления фристайлеров на снегоходе и квадроцикле, а также &laquo;поезд трюков&raquo; и бэкфлип-шоу.</p>\r\n<p>Adrenaline FMX Riders 15 августа в 18.00 на территории СК &laquo;Лужники&raquo;. Вход бесплатный!</p>\r\n<dl class=\"embed_content\" data-link=\"www.adme.ru/zhizn-nauka/12-produktov-kotorye-ne-stoit-davat-detyam-do-3-let-1378615/\">\r\n<dt class=\"embed_content_image\"><a href=\"https://www.adme.ru/zhizn-nauka/12-produktov-kotorye-ne-stoit-davat-detyam-do-3-let-1378615/\" target=\"_blank\"><img class=\"\" src=\"https://files4.adme.ru/files/news/part_137/1378615/preview-18121815-1200x630-99-1476714535.jpg\" data-width=\"\" data-height=\"\"></a></dt>\r\n<dd class=\"embed_content_desc_wrap\"><a href=\"https://www.adme.ru/zhizn-nauka/12-produktov-kotorye-ne-stoit-davat-detyam-do-3-let-1378615/\" target=\"_blank\">12&nbsp;продуктов, которые не&nbsp;стоит давать детям до&nbsp;3&nbsp;лет</a>Ведь здоровье закладывается еще в&nbsp;детстве.</dd>\r\n</dl>','Россия, Новгородская область, Новгородский район, деревня Божонка',346,58.49963169,31.64348893,'58&deg; 29&prime;59&Prime;N','31&deg; 38&prime;37&Prime;E','70,254,345,346',1,5);
/*!40000 ALTER TABLE `events_list` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events_locations`
--

DROP TABLE IF EXISTS `events_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `events_locations` (
  `e_id` int(10) unsigned NOT NULL,
  `l_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`e_id`,`l_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events_locations`
--

LOCK TABLES `events_locations` WRITE;
/*!40000 ALTER TABLE `events_locations` DISABLE KEYS */;
INSERT INTO `events_locations` VALUES (3,70),(3,254),(3,345),(3,346);
/*!40000 ALTER TABLE `events_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location`
--

DROP TABLE IF EXISTS `location`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `location` (
  `l_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `l_pid` int(10) unsigned NOT NULL DEFAULT '0',
  `l_level` mediumint(5) unsigned NOT NULL DEFAULT '0',
  `l_lk` int(10) unsigned NOT NULL DEFAULT '0',
  `l_rk` int(10) unsigned NOT NULL DEFAULT '0',
  `old_id` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`l_id`),
  KEY `lr_level` (`l_lk`,`l_rk`,`l_level`),
  KEY `level` (`l_level`)
) ENGINE=InnoDB AUTO_INCREMENT=358 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location`
--

LOCK TABLES `location` WRITE;
/*!40000 ALTER TABLE `location` DISABLE KEYS */;
INSERT INTO `location` VALUES (1,0,1,713,714,0),(2,0,1,711,712,0),(3,0,1,709,710,0),(4,0,1,707,708,0),(5,0,1,705,706,0),(6,0,1,703,704,0),(7,0,1,701,702,0),(8,0,1,699,700,0),(9,0,1,697,698,0),(10,0,1,695,696,0),(11,0,1,693,694,0),(12,0,1,691,692,0),(13,0,1,689,690,0),(14,0,1,687,688,0),(15,0,1,685,686,0),(16,0,1,683,684,0),(17,0,1,681,682,0),(18,0,1,679,680,0),(19,0,1,677,678,0),(20,0,1,675,676,0),(21,0,1,673,674,0),(22,0,1,671,672,0),(23,0,1,669,670,0),(24,0,1,667,668,0),(25,0,1,665,666,0),(26,0,1,663,664,0),(27,0,1,661,662,0),(28,0,1,659,660,0),(29,0,1,657,658,0),(30,0,1,655,656,0),(31,0,1,653,654,0),(32,0,1,651,652,0),(33,0,1,649,650,0),(34,0,1,647,648,0),(35,0,1,645,646,0),(36,0,1,643,644,0),(37,0,1,641,642,0),(38,0,1,639,640,0),(39,0,1,637,638,0),(40,0,1,635,636,0),(41,0,1,633,634,0),(42,0,1,631,632,0),(43,0,1,629,630,0),(44,0,1,627,628,0),(45,0,1,625,626,0),(46,0,1,623,624,0),(47,0,1,621,622,0),(48,0,1,619,620,0),(49,0,1,617,618,0),(50,0,1,615,616,0),(51,0,1,613,614,0),(52,0,1,611,612,0),(53,0,1,609,610,0),(54,0,1,607,608,0),(55,0,1,605,606,0),(56,0,1,603,604,0),(57,0,1,601,602,0),(58,0,1,599,600,0),(59,0,1,597,598,0),(60,0,1,595,596,0),(61,0,1,593,594,0),(62,0,1,591,592,0),(63,0,1,589,590,0),(64,0,1,587,588,0),(65,0,1,585,586,0),(66,0,1,583,584,0),(67,0,1,581,582,0),(68,0,1,579,580,0),(69,0,1,577,578,0),(70,0,1,277,576,0),(71,0,1,275,276,0),(72,0,1,273,274,0),(73,0,1,271,272,0),(74,0,1,269,270,0),(75,0,1,267,268,0),(76,0,1,265,266,0),(77,0,1,263,264,0),(78,0,1,261,262,0),(79,0,1,259,260,0),(80,0,1,257,258,0),(81,0,1,255,256,0),(82,0,1,253,254,0),(83,0,1,251,252,0),(84,0,1,249,250,0),(85,0,1,247,248,0),(86,0,1,245,246,0),(87,0,1,243,244,0),(88,0,1,241,242,0),(89,0,1,239,240,0),(90,0,1,237,238,0),(91,0,1,235,236,0),(92,0,1,233,234,0),(93,0,1,231,232,0),(94,0,1,229,230,0),(95,0,1,227,228,0),(96,0,1,225,226,0),(97,0,1,223,224,0),(98,0,1,221,222,0),(99,0,1,219,220,0),(100,0,1,217,218,0),(101,0,1,215,216,0),(102,0,1,213,214,0),(103,0,1,211,212,0),(104,0,1,209,210,0),(105,0,1,207,208,0),(106,0,1,205,206,0),(107,0,1,203,204,0),(108,0,1,201,202,0),(109,0,1,199,200,0),(110,0,1,197,198,0),(111,0,1,195,196,0),(112,0,1,193,194,0),(113,0,1,191,192,0),(114,0,1,189,190,0),(115,0,1,187,188,0),(116,0,1,185,186,0),(117,0,1,183,184,0),(118,0,1,181,182,0),(119,0,1,179,180,0),(120,0,1,177,178,0),(121,0,1,175,176,0),(122,0,1,173,174,0),(123,0,1,171,172,0),(124,0,1,169,170,0),(125,0,1,167,168,0),(126,0,1,165,166,0),(127,0,1,163,164,0),(128,0,1,161,162,0),(129,0,1,159,160,0),(130,0,1,157,158,0),(131,0,1,155,156,0),(132,0,1,153,154,0),(133,0,1,151,152,0),(134,0,1,149,150,0),(135,0,1,147,148,0),(136,0,1,145,146,0),(137,0,1,143,144,0),(138,0,1,141,142,0),(139,0,1,139,140,0),(140,0,1,137,138,0),(141,0,1,135,136,0),(142,0,1,133,134,0),(143,0,1,131,132,0),(144,0,1,129,130,0),(145,0,1,127,128,0),(146,0,1,125,126,0),(147,0,1,123,124,0),(148,0,1,121,122,0),(149,0,1,119,120,0),(150,0,1,117,118,0),(151,0,1,115,116,0),(152,0,1,113,114,0),(153,0,1,111,112,0),(154,0,1,109,110,0),(155,0,1,107,108,0),(156,0,1,105,106,0),(157,0,1,103,104,0),(158,0,1,101,102,0),(159,0,1,99,100,0),(160,0,1,97,98,0),(161,0,1,95,96,0),(162,0,1,93,94,0),(163,0,1,91,92,0),(164,0,1,89,90,0),(165,0,1,87,88,0),(166,0,1,85,86,0),(167,0,1,83,84,0),(168,0,1,81,82,0),(169,0,1,79,80,0),(170,0,1,77,78,0),(171,0,1,75,76,0),(172,0,1,73,74,0),(173,0,1,71,72,0),(174,0,1,69,70,0),(175,0,1,67,68,0),(176,0,1,65,66,0),(177,0,1,63,64,0),(178,0,1,61,62,0),(179,0,1,59,60,0),(180,0,1,57,58,0),(181,0,1,55,56,0),(182,0,1,53,54,0),(183,0,1,51,52,0),(184,0,1,49,50,0),(185,0,1,47,48,0),(186,0,1,45,46,0),(187,0,1,33,44,0),(188,0,1,31,32,0),(189,0,1,29,30,0),(190,0,1,27,28,0),(191,0,1,25,26,0),(192,0,1,23,24,0),(193,0,1,21,22,0),(194,0,1,19,20,0),(195,0,1,17,18,0),(196,0,1,15,16,0),(197,0,1,13,14,0),(198,0,1,11,12,0),(199,0,1,9,10,0),(200,0,1,7,8,0),(201,0,1,5,6,0),(202,0,1,3,4,0),(203,0,1,1,2,0),(204,70,2,574,575,0),(205,70,2,572,573,0),(206,70,2,570,571,0),(207,70,2,568,569,0),(208,70,2,566,567,0),(209,70,2,564,565,0),(210,70,2,562,563,0),(211,70,2,560,561,0),(212,70,2,558,559,0),(213,70,2,556,557,0),(214,70,2,554,555,0),(215,70,2,552,553,0),(216,70,2,550,551,0),(217,70,2,540,549,0),(218,70,2,538,539,0),(219,70,2,536,537,0),(220,70,2,530,535,0),(221,70,2,528,529,0),(222,70,2,526,527,0),(223,70,2,524,525,0),(224,70,2,522,523,0),(225,70,2,516,521,0),(226,70,2,514,515,0),(227,70,2,506,513,0),(228,70,2,504,505,0),(229,70,2,502,503,0),(230,70,2,500,501,0),(231,70,2,496,499,0),(232,70,2,494,495,0),(233,70,2,492,493,0),(234,70,2,490,491,0),(235,70,2,488,489,0),(236,70,2,482,487,0),(237,70,2,480,481,0),(238,70,2,478,479,0),(239,70,2,476,477,0),(240,70,2,474,475,0),(241,70,2,472,473,0),(242,70,2,470,471,0),(243,70,2,468,469,0),(244,70,2,466,467,0),(245,70,2,464,465,0),(246,70,2,462,463,0),(247,70,2,458,461,0),(248,70,2,456,457,0),(249,70,2,454,455,0),(250,70,2,452,453,0),(251,70,2,450,451,0),(252,70,2,448,449,0),(253,70,2,446,447,0),(254,70,2,434,445,0),(255,70,2,428,433,0),(256,70,2,426,427,0),(257,70,2,424,425,0),(258,70,2,382,423,0),(259,70,2,360,361,0),(260,70,2,358,359,0),(261,70,2,342,357,0),(262,70,2,340,341,0),(263,70,2,338,339,0),(264,70,2,332,337,0),(265,70,2,330,331,0),(266,70,2,328,329,0),(267,70,2,326,327,0),(268,70,2,324,325,0),(269,70,2,322,323,0),(270,70,2,320,321,0),(271,70,2,318,319,0),(272,70,2,314,315,0),(273,70,2,312,313,0),(274,70,2,310,311,0),(275,70,2,308,309,0),(276,70,2,306,307,0),(277,70,2,304,305,0),(278,70,2,362,381,0),(279,70,2,302,303,0),(280,70,2,298,299,0),(281,70,2,296,297,0),(282,70,2,294,295,0),(283,70,2,292,293,0),(284,70,2,286,291,0),(285,70,2,284,285,0),(286,70,2,282,283,0),(287,70,2,280,281,0),(288,70,2,278,279,0),(289,258,3,415,418,0),(290,258,3,403,408,0),(291,290,4,404,407,0),(292,291,5,405,406,0),(293,278,3,363,368,0),(294,293,4,366,367,0),(295,187,2,34,37,0),(296,295,3,35,36,0),(297,258,3,393,396,0),(298,258,3,401,402,0),(299,297,4,394,395,0),(300,264,3,333,336,0),(301,300,4,334,335,0),(302,258,3,409,412,0),(303,302,4,410,411,0),(304,258,3,387,392,0),(305,304,4,388,391,0),(306,305,5,389,390,0),(307,258,3,397,400,0),(308,307,4,398,399,0),(309,278,3,369,370,0),(310,289,4,416,417,0),(311,258,3,419,422,0),(312,311,4,420,421,0),(313,278,3,371,376,0),(314,313,4,372,375,0),(315,314,5,373,374,0),(316,258,3,413,414,0),(317,258,3,383,386,0),(318,317,4,384,385,0),(319,255,3,429,432,0),(320,319,4,430,431,0),(321,254,3,435,436,0),(322,247,3,459,460,0),(323,236,3,483,486,0),(324,323,4,484,485,0),(325,231,3,497,498,0),(326,227,3,507,512,0),(327,326,4,508,511,0),(328,327,5,509,510,0),(329,220,3,531,534,0),(330,329,4,532,533,0),(331,261,3,343,348,0),(332,331,4,344,347,0),(333,332,5,345,346,0),(334,261,3,349,350,0),(335,293,4,364,365,0),(336,225,3,517,520,0),(337,336,4,518,519,0),(338,261,3,351,356,0),(339,338,4,352,355,0),(340,339,5,353,354,0),(341,217,3,543,546,0),(342,341,4,544,545,0),(343,254,3,437,440,0),(344,343,4,438,439,0),(345,254,3,441,444,0),(346,345,4,442,443,0),(347,187,2,42,43,0),(348,70,2,300,301,0),(349,284,3,287,290,0),(350,349,4,288,289,0),(351,217,3,547,548,0),(352,278,3,377,380,0),(353,352,4,378,379,0),(354,187,2,38,41,0),(355,354,3,39,40,0),(356,217,3,541,542,0),(357,70,2,316,317,0);
/*!40000 ALTER TABLE `location` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location_names`
--

DROP TABLE IF EXISTS `location_names`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `location_names` (
  `l_id` int(10) unsigned NOT NULL,
  `l_pid` int(10) unsigned NOT NULL DEFAULT '0',
  `l_name` varchar(255) NOT NULL,
  `l_latitude` decimal(10,8) NOT NULL,
  `l_longitude` decimal(11,8) NOT NULL,
  `l_kind` varchar(50) NOT NULL,
  `l_full_name` varchar(255) NOT NULL,
  PRIMARY KEY (`l_id`),
  UNIQUE KEY `full_name` (`l_full_name`),
  KEY `lname` (`l_name`(30)),
  KEY `kind_name` (`l_kind`(5),`l_name`(10))
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location_names`
--

LOCK TABLES `location_names` WRITE;
/*!40000 ALTER TABLE `location_names` DISABLE KEYS */;
INSERT INTO `location_names` VALUES (1,0,'Япония',36.65332700,137.98168600,'country','Япония'),(2,0,'Ямайка',18.15779100,-77.31122300,'country','Ямайка'),(3,0,'Южный Судан',7.30607900,30.27603700,'country','Южный Судан'),(4,0,'Южно-Африканская Республика',-29.00220400,25.08029800,'country','Южно-Африканская Республика'),(5,0,'Южная Осетия',42.35115300,44.08573900,'country','Южная Осетия'),(6,0,'Южная Корея',36.45115300,127.86114000,'country','Южная Корея'),(7,0,'Эфиопия',8.62353400,39.63279000,'country','Эфиопия'),(8,0,'Эстония',58.85606900,24.80010400,'country','Эстония'),(9,0,'Эритрея',15.36214100,38.84763500,'country','Эритрея'),(10,0,'Экваториальная Гвинея',1.56636900,10.46540000,'country','Экваториальная Гвинея'),(11,0,'Эквадор',-1.46556800,-78.39720600,'country','Эквадор'),(12,0,'Шри-Ланка',7.64164300,80.69197000,'country','Шри-Ланка'),(13,0,'Швеция',62.82179200,16.73538000,'country','Швеция'),(14,0,'Швейцария',46.80020600,8.22919700,'country','Швейцария'),(15,0,'Чили',-35.29835400,-71.22794000,'country','Чили'),(16,0,'Чехия',49.73910500,15.33149300,'country','Чехия'),(17,0,'Черногория',42.78509600,19.24897400,'country','Черногория'),(18,0,'Чад',15.36828600,18.66776400,'country','Чад'),(19,0,'Центральноафриканская Республика',6.57415400,20.48547800,'country','Центральноафриканская Республика'),(20,0,'Хорватия',45.14010100,16.42804900,'country','Хорватия'),(21,0,'Французская Гвиана',3.92369700,-53.23561000,'country','Французская Гвиана'),(22,0,'Франция',46.62184100,2.45195200,'country','Франция'),(23,0,'Финляндия',64.51988700,26.28299800,'country','Финляндия'),(24,0,'Филиппины',15.94804500,121.42259100,'country','Филиппины'),(25,0,'Фиджи',-17.83540800,177.96334500,'country','Фиджи'),(26,0,'Федеративные Штаты Микронезии',6.88037400,158.22751100,'country','Федеративные Штаты Микронезии'),(27,0,'Уругвай',-32.96712100,-56.05579900,'country','Уругвай'),(28,0,'Уоллис и Футуна',-13.28501000,-176.20444400,'country','Уоллис и Футуна'),(29,0,'Украина',49.02753000,31.48277100,'country','Украина'),(30,0,'Узбекистан',41.76506600,63.15011800,'country','Узбекистан'),(31,0,'Уганда',1.27731500,32.39001500,'country','Уганда'),(32,0,'Турция',39.91129400,32.85088700,'country','Турция'),(33,0,'Туркменистан',39.19414100,59.17855000,'country','Туркменистан'),(34,0,'Тунис',34.11443900,9.57206100,'country','Тунис'),(35,0,'Тувалу',-7.96162700,178.42997500,'country','Тувалу'),(36,0,'Тринидад и Тобаго',10.42373900,-61.29652500,'country','Тринидад и Тобаго'),(37,0,'Тонга',-21.17392900,-175.19205200,'country','Тонга'),(38,0,'Того',8.53036700,0.97700800,'country','Того'),(39,0,'Тёркс и Кайкос',21.77567500,-71.75766700,'country','Тёркс и Кайкос'),(40,0,'Танзания',-6.26641200,34.81446900,'country','Танзания'),(41,0,'Тайвань',23.74898800,120.97127700,'country','Тайвань'),(42,0,'Таиланд',15.13065000,101.01779900,'country','Таиланд'),(43,0,'Таджикистан',39.04219700,70.84815000,'country','Таджикистан'),(44,0,'Сьерра-Леоне',8.54806300,-11.80521900,'country','Сьерра-Леоне'),(45,0,'Суринам',3.94444800,-56.00986800,'country','Суринам'),(46,0,'Судан',15.98989700,29.95370300,'country','Судан'),(47,0,'Сомали',5.17304600,46.20310400,'country','Сомали'),(48,0,'Соломоновы Острова',-9.62279900,160.16028200,'country','Соломоновы Острова'),(49,0,'Соединённые Штаты Америки',39.49590900,-98.98997800,'country','Соединённые Штаты Америки'),(50,0,'Словения',46.11955500,14.82175300,'country','Словения'),(51,0,'Словакия',48.70748300,19.48487200,'country','Словакия'),(52,0,'Сирия',35.01280300,38.50527000,'country','Сирия'),(53,0,'Сингапур',1.29015300,103.85199300,'locality','Сингапур, Сингапур'),(54,0,'Сербия',44.03244000,20.80548500,'country','Сербия'),(55,0,'Сент-Люсия',13.89863300,-60.96729300,'country','Сент-Люсия'),(56,0,'Сент-Китс и Невис',17.33970600,-62.76560300,'country','Сент-Китс и Невис'),(57,0,'Сент-Винсент и Гренадины',13.25147700,-61.18913200,'country','Сент-Винсент и Гренадины'),(58,0,'Сенегал',14.36017500,-14.46768200,'country','Сенегал'),(59,0,'Сен-Мартен',18.07953900,-63.06212800,'country','Сен-Мартен'),(60,0,'Сейшельские Острова',-4.67863300,55.46725000,'country','Сейшельские Острова'),(61,0,'Северная Корея',40.14473200,127.17914800,'country','Северная Корея'),(62,0,'Свазиленд',-26.56515300,31.49808700,'country','Свазиленд'),(63,0,'Саудовская Аравия',24.12415000,44.55051800,'country','Саудовская Аравия'),(64,0,'Сан-Томе и Принсипи',0.23930500,6.60205100,'country','Сан-Томе и Принсипи'),(65,0,'Сан-Марино',43.93814500,12.46349600,'country','Сан-Марино'),(66,0,'Самоа',-13.62080800,-172.44733000,'country','Самоа'),(67,0,'Сальвадор',13.73300500,-88.86650400,'country','Сальвадор'),(68,0,'Румыния',45.83944300,24.98561600,'country','Румыния'),(69,0,'Руанда',-1.99994500,29.92605300,'country','Руанда'),(70,0,'Россия',61.69865300,99.50540500,'country','Россия'),(71,0,'Республика Конго',-0.82874400,15.24135600,'country','Республика Конго'),(72,0,'Республика Гаити',18.93351000,-72.67458700,'country','Республика Гаити'),(73,0,'Пуэрто-Рико',18.22506300,-66.47890600,'country','Пуэрто-Рико'),(74,0,'Португалия',39.67991100,-7.96865800,'country','Португалия'),(75,0,'Польша',52.12902900,19.39370200,'country','Польша'),(76,0,'Перу',-9.17125000,-74.35686200,'country','Перу'),(77,0,'Парагвай',-23.24195200,-58.39275700,'country','Парагвай'),(78,0,'Папуа — Новая Гвинея',-6.61254700,144.26271500,'country','Папуа — Новая Гвинея'),(79,0,'Панама',8.53103800,-80.13449300,'country','Панама'),(80,0,'Палау',7.49914500,134.56503300,'country','Палау'),(81,0,'Пакистан',29.90354400,69.32829100,'country','Пакистан'),(82,0,'Оман',20.56961200,56.09807400,'country','Оман'),(83,0,'Объединённые Арабские Эмираты',23.90717300,54.33353100,'country','Объединённые Арабские Эмираты'),(84,0,'Норвегия',64.23891100,13.95061200,'country','Норвегия'),(85,0,'Новая Зеландия',-43.94763500,170.50286400,'country','Новая Зеландия'),(86,0,'Никарагуа',12.84412700,-85.03194700,'country','Никарагуа'),(87,0,'Нидерланды',52.24576200,5.56521600,'country','Нидерланды'),(88,0,'Нигерия',9.58523900,8.09284200,'country','Нигерия'),(89,0,'Нигер',17.42028700,9.40062700,'country','Нигер'),(90,0,'Непал',28.25913100,83.94415900,'country','Непал'),(91,0,'Науру',-0.52853300,166.93419000,'country','Науру'),(92,0,'Намибия',-22.13955100,17.22205100,'country','Намибия'),(93,0,'Мьянма',21.19231300,96.51799400,'country','Мьянма'),(94,0,'Монтсеррат',16.73917000,-62.18927100,'country','Монтсеррат'),(95,0,'Монголия',46.83469100,103.06762900,'country','Монголия'),(96,0,'Монако',43.73285400,7.41753300,'locality','Монако, Монако'),(97,0,'Молдова',47.20235600,28.46609300,'country','Молдова'),(98,0,'Мозамбик',-17.27312400,35.54746800,'country','Мозамбик'),(99,0,'Мексика',23.94129400,-102.52617000,'country','Мексика'),(100,0,'Маршалловы Острова',9.33982300,167.06702400,'country','Маршалловы Острова'),(101,0,'Мартиника',14.65321600,-61.01867700,'country','Мартиника'),(102,0,'Марокко',29.12680100,-8.87318100,'country','Марокко'),(103,0,'Мальта',35.89055400,14.43952900,'country','Мальта'),(104,0,'Мальдивы',1.91230000,73.54008700,'country','Мальдивы'),(105,0,'Мали',17.35722800,-3.52516000,'country','Мали'),(106,0,'Малайзия',3.60546000,114.71072100,'country','Малайзия'),(107,0,'Малави',-13.21396000,34.30294200,'country','Малави'),(108,0,'Македония',41.60046300,21.70089000,'country','Македония'),(109,0,'Мадагаскар',-19.38287900,46.69583900,'country','Мадагаскар'),(110,0,'Мавритания',20.25862100,-10.33139800,'country','Мавритания'),(111,0,'Маврикий',-20.28355100,57.57181400,'country','Маврикий'),(112,0,'Люксембург',49.77682200,6.09233800,'country','Люксембург'),(113,0,'Лихтенштейн',47.14127000,9.55277500,'country','Лихтенштейн'),(114,0,'Литва',55.33730700,23.88354400,'country','Литва'),(115,0,'Ливия',27.04182400,18.03081400,'country','Ливия'),(116,0,'Ливан',33.92144000,35.89342700,'country','Ливан'),(117,0,'Либерия',6.44733600,-9.31038200,'country','Либерия'),(118,0,'Лесото',-29.58232000,28.24669800,'country','Лесото'),(119,0,'Латвия',56.92693700,24.37193100,'country','Латвия'),(120,0,'Лаос',18.49549800,103.76805500,'country','Лаос'),(121,0,'Кувейт',29.33588100,47.59547500,'country','Кувейт'),(122,0,'Куба',21.61051000,-78.96027000,'country','Куба'),(123,0,'Коста-Рика',9.97482500,-84.19385400,'country','Коста-Рика'),(124,0,'Колумбия',3.90908100,-73.07386100,'country','Колумбия'),(125,0,'Китай',36.62532500,103.90326000,'country','Китай'),(126,0,'Кирибати',1.85751600,-157.65772800,'country','Кирибати'),(127,0,'Киргизия',41.46435500,74.55521900,'country','Киргизия'),(128,0,'Кипр',35.28039000,33.60174400,'country','Кипр'),(129,0,'Кения',0.60514700,37.81732200,'country','Кения'),(130,0,'Катар',25.28535300,51.19320900,'country','Катар'),(131,0,'Канада',62.53604100,-96.38835000,'country','Канада'),(132,0,'Камерун',5.69737700,12.74234200,'country','Камерун'),(133,0,'Камбоджа',12.71088700,104.91685600,'country','Камбоджа'),(134,0,'Казахстан',48.13620700,67.15355000,'country','Казахстан'),(135,0,'Кабо-Верде',15.08362800,-23.62466800,'country','Кабо-Верде'),(136,0,'Йемен',15.93471200,47.54734300,'country','Йемен'),(137,0,'Италия',43.52902700,12.16218300,'country','Италия'),(138,0,'Испания',40.38768900,-3.55738200,'country','Испания'),(139,0,'Исландия',64.98364300,-18.57708800,'country','Исландия'),(140,0,'Ирландия',53.18497900,-8.14688400,'country','Ирландия'),(141,0,'Иран',32.56425300,54.30365300,'country','Иран'),(142,0,'Ирак',33.04456800,43.77494900,'country','Ирак'),(143,0,'Иордания',31.24818300,36.78809500,'country','Иордания'),(144,0,'Индонезия',-0.20937900,114.00456400,'country','Индонезия'),(145,0,'Индия',23.03873400,79.58900900,'country','Индия'),(146,0,'Израиль',31.55230700,35.06138000,'country','Израиль'),(147,0,'Зимбабве',-19.00043000,29.87201100,'country','Зимбабве'),(148,0,'Замбия',-13.46058300,27.78805400,'country','Замбия'),(149,0,'Египет',26.50541600,29.87614300,'country','Египет'),(150,0,'Доминиканская Республика',18.89732100,-70.49993600,'country','Доминиканская Республика'),(151,0,'Доминика',15.43464900,-61.35006500,'country','Доминика'),(152,0,'Джибути',11.73226900,42.58025200,'country','Джибути'),(153,0,'Демократическая Республика Конго',-2.87970300,23.65901900,'country','Демократическая Республика Конго'),(154,0,'Дания',56.26229200,9.33637000,'country','Дания'),(155,0,'Грузия',41.66484500,43.90444100,'country','Грузия'),(156,0,'Греция',39.34744200,22.57126700,'country','Греция'),(157,0,'Гренландия',74.75581100,-41.39416200,'country','Гренландия'),(158,0,'Гренада',12.11383400,-61.68375300,'country','Гренада'),(159,0,'Гондурас',14.82381400,-86.59753900,'country','Гондурас'),(160,0,'Германия',51.12180200,10.40069400,'country','Германия'),(161,0,'Гвинея-Бисау',12.03776600,-14.95846800,'country','Гвинея-Бисау'),(162,0,'Гвинея',10.43545900,-10.93604500,'country','Гвинея'),(163,0,'Гватемала',15.69613600,-90.35707000,'country','Гватемала'),(164,0,'Гваделупа',16.20822700,-61.42187600,'country','Гваделупа'),(165,0,'Гана',7.96141200,-1.20816200,'country','Гана'),(166,0,'Гамбия',13.44706000,-15.42239400,'country','Гамбия'),(167,0,'Гайана',4.79571300,-58.97489200,'country','Гайана'),(168,0,'Габон',-0.62393000,11.78183600,'country','Габон'),(169,0,'Вьетнам',15.37703600,109.14234300,'country','Вьетнам'),(170,0,'Восточный Тимор',-8.79741400,125.94541100,'country','Восточный Тимор'),(171,0,'Венесуэла',7.15676000,-66.22328200,'country','Венесуэла'),(172,0,'Венгрия',47.16517500,19.41232400,'country','Венгрия'),(173,0,'Великобритания',53.94383200,-2.55055100,'country','Великобритания'),(174,0,'Вануату',-15.24134700,166.87275400,'country','Вануату'),(175,0,'Бутан',27.41482200,90.42622200,'country','Бутан'),(176,0,'Бурунди',-3.36645000,29.88838700,'country','Бурунди'),(177,0,'Буркина-Фасо',12.28631900,-1.74409700,'country','Буркина-Фасо'),(178,0,'Бруней',4.49689500,114.63083300,'country','Бруней'),(179,0,'Бразилия',-10.77753400,-53.06752600,'country','Бразилия'),(180,0,'Ботсвана',-22.18735500,23.81445500,'country','Ботсвана'),(181,0,'Босния и Герцеговина',44.16825200,17.78524100,'country','Босния и Герцеговина'),(182,0,'Боливия',-16.71473300,-64.65780600,'country','Боливия'),(183,0,'Болгария',42.75740600,25.23863500,'country','Болгария'),(184,0,'Бенин',9.65643300,2.33968000,'country','Бенин'),(185,0,'Бельгия',50.64117500,4.66057600,'country','Бельгия'),(186,0,'Белиз',17.20055100,-88.70706200,'country','Белиз'),(187,0,'Беларусь',53.53120500,28.03098500,'country','Беларусь'),(188,0,'Бахрейн',26.08922700,50.56277200,'country','Бахрейн'),(189,0,'Барбадос',13.17222100,-59.55641700,'country','Барбадос'),(190,0,'Бангладеш',23.80488200,90.27920400,'country','Бангладеш'),(191,0,'Багамские Острова',24.67952900,-78.05500100,'country','Багамские Острова'),(192,0,'Афганистан',33.83113700,66.02470900,'country','Афганистан'),(193,0,'Армения',40.29266400,44.93947100,'country','Армения'),(194,0,'Аргентина',-35.19543500,-65.10205000,'country','Аргентина'),(195,0,'Антигуа и Барбуда',17.07766300,-61.79870200,'country','Антигуа и Барбуда'),(196,0,'Ангола',-12.33259600,17.57329300,'country','Ангола'),(197,0,'Американское Самоа',-14.30068600,-170.71811800,'country','Американское Самоа'),(198,0,'Алжир',36.78055400,3.03901000,'locality','Алжир, Алжир'),(199,0,'Албания',41.13928300,20.06431200,'country','Албания'),(200,0,'Азербайджан',40.35995300,47.65147600,'country','Азербайджан'),(201,0,'Австрия',47.58708400,14.14127900,'country','Австрия'),(202,0,'Австралия',-25.57876800,134.35956200,'country','Австралия'),(203,0,'Абхазия',42.98918000,40.98346100,'country','Абхазия'),(204,70,'Ярославская область',57.81736100,39.10513800,'province','Россия, Ярославская область'),(205,70,'Ямало-Ненецкий автономный округ',66.08643500,80.00539700,'province','Россия, Ямало-Ненецкий автономный округ'),(206,70,'Чукотский автономный округ',65.98261300,174.43231100,'province','Россия, Чукотский автономный округ'),(207,70,'Чувашская Республика',55.49202300,47.08687500,'province','Россия, Чувашская Республика'),(208,70,'Чеченская Республика',43.30578400,45.74766700,'province','Россия, Чеченская Республика'),(209,70,'Челябинская область',54.44619900,60.39564100,'province','Россия, Челябинская область'),(210,70,'Ханты-Мансийский автономный округ',61.58891200,65.89750800,'province','Россия, Ханты-Мансийский автономный округ'),(211,70,'Хабаровский край',60.56711600,143.00892800,'province','Россия, Хабаровский край'),(212,70,'Ульяновская область',54.12261600,48.15155000,'province','Россия, Ульяновская область'),(213,70,'Удмуртская Республика',57.16678400,52.79697200,'province','Россия, Удмуртская Республика'),(214,70,'Тюменская область',62.34965100,72.60593800,'province','Россия, Тюменская область'),(215,70,'Тульская область',53.88806400,37.57569300,'province','Россия, Тульская область'),(216,70,'Томская область',58.94919300,78.63728000,'province','Россия, Томская область'),(217,70,'Тверская область',57.09303300,34.70619500,'province','Россия, Тверская область'),(218,70,'Тамбовская область',52.68086400,41.58718300,'province','Россия, Тамбовская область'),(219,70,'Ставропольский край',44.95355100,43.34452100,'province','Россия, Ставропольский край'),(220,70,'Смоленская область',54.95619200,32.99854300,'province','Россия, Смоленская область'),(221,70,'Севастополь',44.61668700,33.52543200,'locality','Россия, Севастополь'),(222,70,'Свердловская область',58.58675500,61.53076100,'province','Россия, Свердловская область'),(223,70,'Сахалинская область',50.15092600,142.75079700,'province','Россия, Сахалинская область'),(224,70,'Саратовская область',51.57852900,46.79722300,'province','Россия, Саратовская область'),(225,70,'Санкт-Петербург',59.93909500,30.31586800,'locality','Россия, Санкт-Петербург'),(226,70,'Самарская область',53.27635000,50.46330100,'province','Россия, Самарская область'),(227,70,'Рязанская область',54.33336300,40.62524000,'province','Россия, Рязанская область'),(228,70,'Ростовская область',47.72873200,41.26812800,'province','Россия, Ростовская область'),(229,70,'Республика Хакасия',53.38635700,89.89707800,'province','Россия, Республика Хакасия'),(230,70,'Республика Тыва',51.58433200,94.79308500,'province','Россия, Республика Тыва'),(231,70,'Республика Татарстан',55.35033600,50.91101300,'province','Россия, Республика Татарстан'),(232,70,'Республика Северная Осетия — Алания',43.09266900,44.26203300,'province','Россия, Республика Северная Осетия — Алания'),(233,70,'Республика Саха (Якутия)',65.06107300,119.84565200,'province','Россия, Республика Саха (Якутия)'),(234,70,'Республика Мордовия',54.24669200,45.06365400,'province','Россия, Республика Мордовия'),(235,70,'Республика Марий Эл',56.57727800,47.93676300,'province','Россия, Республика Марий Эл'),(236,70,'Республика Крым',45.28071200,34.44968100,'province','Россия, Республика Крым'),(237,70,'Республика Коми',64.12546300,54.78966900,'province','Россия, Республика Коми'),(238,70,'Республика Карелия',63.62132400,33.23260800,'province','Россия, Республика Карелия'),(239,70,'Республика Калмыкия',46.41402400,45.32570100,'province','Россия, Республика Калмыкия'),(240,70,'Республика Ингушетия',43.10359000,45.05458100,'province','Россия, Республика Ингушетия'),(241,70,'Республика Дагестан',43.11083000,46.99686400,'province','Россия, Республика Дагестан'),(242,70,'Республика Бурятия',54.54422200,112.34869900,'province','Россия, Республика Бурятия'),(243,70,'Республика Башкортостан',54.27150000,56.52553700,'province','Россия, Республика Башкортостан'),(244,70,'Республика Алтай',50.73624000,87.01545400,'province','Россия, Республика Алтай'),(245,70,'Республика Адыгея',44.42986600,40.25296900,'province','Россия, Республика Адыгея'),(246,70,'Псковская область',57.23648600,29.23691100,'province','Россия, Псковская область'),(247,70,'Приморский край',45.04198000,134.70937500,'province','Россия, Приморский край'),(248,70,'Пермский край',59.11769800,56.22567900,'province','Россия, Пермский край'),(249,70,'Пензенская область',53.18240000,44.63415100,'province','Россия, Пензенская область'),(250,70,'Орловская область',52.78145500,36.48104200,'province','Россия, Орловская область'),(251,70,'Оренбургская область',52.74352800,53.49868200,'province','Россия, Оренбургская область'),(252,70,'Омская область',56.10347200,73.34441600,'province','Россия, Омская область'),(253,70,'Новосибирская область',55.27627200,79.77023600,'province','Россия, Новосибирская область'),(254,70,'Новгородская область',58.30771500,32.49022200,'province','Россия, Новгородская область'),(255,70,'Нижегородская область',56.31276400,44.61189100,'province','Россия, Нижегородская область'),(256,70,'Ненецкий автономный округ',67.71421200,54.36506200,'province','Россия, Ненецкий автономный округ'),(257,70,'Мурманская область',67.25024400,38.31366800,'province','Россия, Мурманская область'),(258,70,'Московская область',55.81579200,37.38003100,'province','Россия, Московская область'),(259,70,'Магаданская область',62.57581500,154.03683500,'province','Россия, Магаданская область'),(260,70,'Липецкая область',52.64455400,39.14978400,'province','Россия, Липецкая область'),(261,70,'Ленинградская область',60.01835300,31.29335200,'province','Россия, Ленинградская область'),(262,70,'Курская область',51.68036900,36.10487200,'province','Россия, Курская область'),(263,70,'Курганская область',55.44834700,64.80940500,'province','Россия, Курганская область'),(264,70,'Красноярский край',67.23677900,95.96847700,'province','Россия, Красноярский край'),(265,70,'Краснодарский край',45.27236500,38.95140900,'province','Россия, Краснодарский край'),(266,70,'Костромская область',58.45600300,43.78849500,'province','Россия, Костромская область'),(267,70,'Кировская область',58.67994600,49.83036600,'province','Россия, Кировская область'),(268,70,'Кемеровская область',54.77904700,87.20736100,'province','Россия, Кемеровская область'),(269,70,'Карачаево-Черкесская Республика',43.77094700,41.75392800,'province','Россия, Карачаево-Черкесская Республика'),(270,70,'Камчатский край',61.35017900,169.78298100,'province','Россия, Камчатский край'),(271,70,'Калужская область',54.37180000,35.44518500,'province','Россия, Калужская область'),(272,70,'Калининградская область',54.75436500,21.22993000,'province','Россия, Калининградская область'),(273,70,'Кабардино-Балкарская Республика',43.49439600,43.40827400,'province','Россия, Кабардино-Балкарская Республика'),(274,70,'Иркутская область',57.10029400,106.36330500,'province','Россия, Иркутская область'),(275,70,'Ивановская область',56.98977200,41.55407100,'province','Россия, Ивановская область'),(276,70,'Забайкальский край',52.84725800,116.20042400,'province','Россия, Забайкальский край'),(277,70,'Еврейская автономная область',48.52290200,132.25761200,'province','Россия, Еврейская автономная область'),(278,70,'Москва',55.75396000,37.62039300,'locality','Россия, Москва'),(279,70,'Воронежская область',50.97089800,40.23339500,'province','Россия, Воронежская область'),(280,70,'Вологодская область',60.13898800,44.04961800,'province','Россия, Вологодская область'),(281,70,'Волгоградская область',49.61582100,44.15140600,'province','Россия, Волгоградская область'),(282,70,'Владимирская область',56.01358800,40.67916600,'province','Россия, Владимирская область'),(283,70,'Брянская область',52.90919200,33.42219700,'province','Россия, Брянская область'),(284,70,'Белгородская область',50.87223100,37.30319800,'province','Россия, Белгородская область'),(285,70,'Астраханская область',46.85146300,47.46618900,'province','Россия, Астраханская область'),(286,70,'Архангельская область',63.63751700,43.33666100,'province','Россия, Архангельская область'),(287,70,'Амурская область',53.41334100,127.72806400,'province','Россия, Амурская область'),(288,70,'Алтайский край',52.12967100,82.53001300,'province','Россия, Алтайский край'),(289,258,'Подольск',55.43117700,37.54473700,'locality','Россия, Московская область, Подольск'),(290,258,'Раменский район',55.56728000,38.22580400,'area','Россия, Московская область, Раменский район'),(291,290,'Островецкое сельское поселение',55.59190000,37.99351700,'area','Россия, Московская область, Раменский район, Островецкое сельское поселение'),(292,291,'село Верхнее Мячково',55.55066200,37.97962000,'locality','Россия, Московская область, Раменский район, Островецкое сельское поселение, село Верхнее Мячково'),(293,278,'Зеленоград',55.99189300,37.21438200,'locality','Россия, Москва, Зеленоград'),(294,293,'район Савёлки',55.98991500,37.23801600,'district','Россия, Москва, Зеленоградский административный округ, район Савёлки'),(295,187,'Брест',52.08951000,23.71202000,'locality','Беларусь, Брест'),(296,295,'Московский район',52.07844100,23.74279600,'district','Беларусь, Брест, Московский район'),(297,258,'Ленинский район',55.54765700,37.77157100,'area','Россия, Московская область, Ленинский район'),(298,258,'Люберцы',55.67649400,37.89811600,'locality','Россия, Московская область, Люберцы'),(299,297,'деревня Горки',55.50779500,37.75593100,'locality','Россия, Московская область, Ленинский район, деревня Горки'),(300,264,'Емельяновский район',56.37127600,92.55031600,'area','Россия, Красноярский край, Емельяновский район'),(301,300,'поселок Логовой',56.12568100,92.75806000,'locality','Россия, Красноярский край, Емельяновский район, поселок Логовой'),(302,258,'Солнечногорский район',56.12149600,37.05795800,'area','Россия, Московская область, Солнечногорский район'),(303,302,'деревня Брёхово',55.92990300,37.19117800,'locality','Россия, Московская область, Солнечногорский район, деревня Брёхово'),(304,258,'Красногорский район',55.82154800,37.23703700,'area','Россия, Московская область, Красногорский район'),(305,304,'Ильинское сельское поселение',55.77073000,37.20140100,'area','Россия, Московская область, Красногорский район, Ильинское сельское поселение'),(306,305,'село Петрово-Дальнее',55.75136600,37.17869100,'locality','Россия, Московская область, Красногорский район, Ильинское сельское поселение, село Петрово-Дальнее'),(307,258,'Лыткарино',55.57785600,37.90347000,'locality','Россия, Московская область, Лыткарино'),(308,307,'Детский городок ЗиЛ',55.56940800,37.96057600,'district','Россия, Московская область, Лыткарино, Детский городок ЗиЛ'),(309,278,'посёлок Внуково',55.60847500,37.29240000,'locality','Россия, Москва, посёлок Внуково'),(310,289,'микрорайон Силикатная-2',55.46916800,37.55029800,'district','Россия, Московская область, Подольск, микрорайон Силикатная-2'),(311,258,'Пушкинский район',56.10062100,37.91792400,'area','Россия, Московская область, Пушкинский район'),(312,311,'деревня Раково',56.10580200,37.76575800,'locality','Россия, Московская область, Пушкинский район, деревня Раково'),(313,278,'Северный административный округ',55.83838400,37.52576500,'district','Россия, Москва, Северный административный округ'),(314,313,'Молжаниновский район',55.93680200,37.37674300,'district','Россия, Москва, Северный административный округ, Молжаниновский район'),(315,314,'деревня Бурцево',55.94217600,37.38682200,'district','Россия, Москва, Северный административный округ, Молжаниновский район, деревня Бурцево'),(316,258,'Химки',55.88879600,37.43032800,'locality','Россия, Московская область, Химки'),(317,258,'Волоколамский район',56.00783100,35.97035900,'area','Россия, Московская область, Волоколамский район'),(318,317,'деревня Шелудьково',55.99291000,36.26381100,'locality','Россия, Московская область, Волоколамский район, деревня Шелудьково'),(319,255,'Богородский район',56.02375600,43.62064500,'area','Россия, Нижегородская область, Богородский район'),(320,319,'деревня Березовка',56.12591200,43.58028400,'locality','Россия, Нижегородская область, Богородский район, деревня Березовка'),(321,254,'Валдай',57.98019900,33.24666700,'locality','Россия, Новгородская область, Валдай'),(322,247,'Артём',43.35011600,132.15963300,'locality','Россия, Приморский край, Артём'),(323,236,'Сакский район',45.22609400,33.43113600,'area','Россия, Республика Крым, Сакский район'),(324,323,'село Суворовское',45.25276200,33.37380500,'locality','Россия, Республика Крым, Сакский район, село Суворовское'),(325,231,'Казань',55.79855100,49.10632400,'locality','Россия, Республика Татарстан, Казань'),(326,227,'Рязанский район',54.63140500,39.89460400,'area','Россия, Рязанская область, Рязанский район'),(327,326,'Семеновское сельское поселение',54.58144800,39.62214500,'area','Россия, Рязанская область, Рязанский район, Семеновское сельское поселение'),(328,327,'деревня Секиотово',54.58596600,39.63539500,'locality','Россия, Рязанская область, Рязанский район, Семеновское сельское поселение, деревня Секиотово'),(329,220,'Дорогобужский район',54.86850300,33.34570600,'area','Россия, Смоленская область, Дорогобужский район'),(330,329,'посёлок городского типа Верхнеднепровский',54.98139700,33.34496900,'locality','Россия, Смоленская область, Дорогобужский район, посёлок городского типа Верхнеднепровский'),(331,261,'Всеволожский район',60.21777600,30.67699100,'area','Россия, Ленинградская область, Всеволожский район'),(332,331,'Колтушское сельское поселение',59.90882700,30.74131000,'area','Россия, Ленинградская область, Всеволожский район, Колтушское сельское поселение'),(333,332,'деревня Токкари',59.94753600,30.64298100,'locality','Россия, Ленинградская область, Всеволожский район, Колтушское сельское поселение, деревня Токкари'),(334,261,'Луга',58.73252600,29.84917500,'locality','Россия, Ленинградская область, Луга'),(335,293,'поселок Назарьево',55.96884600,37.26023200,'district','Россия, Москва, Зеленоград, поселок Назарьево'),(336,225,'Пушкинский район',59.69667400,30.42127600,'area','Россия, Санкт-Петербург, Пушкинский район'),(337,336,'посёлок Шушары',59.80722000,30.37951400,'locality','Россия, Санкт-Петербург, Пушкинский район, посёлок Шушары'),(338,261,'Тосненский район',59.37203400,31.01756900,'area','Россия, Ленинградская область, Тосненский район'),(339,338,'Шапкинское сельское поселение',59.61111300,31.20423900,'area','Россия, Ленинградская область, Тосненский район, Шапкинское сельское поселение'),(340,339,'деревня Сиголово',59.62248200,31.18905800,'locality','Россия, Ленинградская область, Тосненский район, Шапкинское сельское поселение, деревня Сиголово'),(341,217,'Осташковский район',57.20150500,33.09327900,'area','Россия, Тверская область, Осташковский район'),(342,341,'деревня Зорино',57.16733500,33.21832500,'locality','Россия, Тверская область, Осташковский район, деревня Зорино'),(343,254,'Великий Новгород',58.52147500,31.27547500,'locality','Россия, Новгородская область, Великий Новгород'),(344,343,'микрорайон Северный',58.56581900,31.28533000,'district','Россия, Новгородская область, Великий Новгород, микрорайон Северный'),(345,254,'Новгородский район',58.51982600,31.76743800,'area','Россия, Новгородская область, Новгородский район'),(346,345,'деревня Божонка',58.49774900,31.64573400,'locality','Россия, Новгородская область, Новгородский район, деревня Божонка'),(347,187,'Минск',53.90225700,27.56183100,'locality','Беларусь, Минск'),(348,70,'Воронеж',51.66153500,39.20028700,'locality','Россия, Воронеж'),(349,284,'Белгородский район',50.42437100,36.49734600,'area','Россия, Белгородская область, Белгородский район'),(350,349,'село Беломестное',50.67814800,36.63621700,'locality','Россия, Белгородская область, Белгородский район, село Беломестное'),(351,217,'Ржев',56.26287700,34.32906500,'locality','Россия, Тверская область, Ржев'),(352,278,'Южный административный округ',55.61090600,37.68147900,'district','Россия, Москва, Южный административный округ'),(353,352,'район Нагатинский Затон',55.68284900,37.68156800,'district','Россия, Москва, Южный административный округ, район Нагатинский Затон'),(354,187,'Брест',52.08951000,23.71202000,'locality','Беларусь, город областного подчинения Брест, Брест'),(355,354,'Московский район',52.07844100,23.74279600,'district','Беларусь, город областного подчинения Брест, Брест, Московский район'),(356,217,'Зубцов',56.17614300,34.58256000,'locality','Россия, Тверская область, Зубцов'),(357,70,'Калуга',54.50701400,36.25227700,'locality','Россия, Калуга');
/*!40000 ALTER TABLE `location_names` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location_names_copy`
--

DROP TABLE IF EXISTS `location_names_copy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `location_names_copy` (
  `l_id` int(10) unsigned NOT NULL,
  `l_pid` int(10) unsigned NOT NULL DEFAULT '0',
  `l_name` varchar(255) NOT NULL,
  `l_latitude` decimal(10,8) NOT NULL,
  `l_longitude` decimal(11,8) NOT NULL,
  `l_kind` varchar(50) NOT NULL,
  `l_full_name` varchar(255) NOT NULL,
  PRIMARY KEY (`l_id`),
  UNIQUE KEY `full_name` (`l_full_name`),
  KEY `lname` (`l_name`(30))
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location_names_copy`
--

LOCK TABLES `location_names_copy` WRITE;
/*!40000 ALTER TABLE `location_names_copy` DISABLE KEYS */;
INSERT INTO `location_names_copy` VALUES (1,0,'Россия',61.69865300,99.50540500,'country','Россия'),(2,0,'Беларусь',53.53120500,28.03098500,'country','Беларусь'),(3,0,'Украина',49.02753000,31.48277100,'country','Украина'),(4,0,'Турция',39.91129400,32.85088700,'country','Турция'),(5,0,'Абхазия',42.98918000,40.98346100,'country','Абхазия'),(6,0,'Грузия',41.66484500,43.90444100,'country','Грузия'),(7,0,'Армения',40.29266400,44.93947100,'country','Армения'),(8,0,'Азербайджан',40.35995300,47.65147600,'country','Азербайджан'),(9,0,'Южная Осетия',42.35115300,44.08573900,'country','Южная Осетия'),(10,0,'Казахстан',48.13620700,67.15355000,'country','Казахстан'),(11,0,'Узбекистан',41.76506600,63.15011800,'country','Узбекистан'),(12,0,'Киргизия',41.46435500,74.55521900,'country','Киргизия'),(13,0,'Таджикистан',39.04219700,70.84815000,'country','Таджикистан'),(14,0,'Молдова',47.20235600,28.46609300,'country','Молдова'),(15,0,'Эстония',24.80010400,58.85606900,'country','Эстония'),(16,0,'Латвия',24.37193100,56.92693700,'country','Латвия'),(17,0,'Финляндия',26.28299800,64.51988700,'country','Финляндия'),(18,0,'Швеция',16.73538000,62.82179200,'country','Швеция'),(19,0,'Норвегия',13.95061200,64.23891100,'country','Норвегия'),(20,0,'Литва',23.88354400,55.33730700,'country','Литва'),(21,0,'Польша',19.39370200,52.12902900,'country','Польша'),(22,0,'Дания',9.33637000,56.26229200,'country','Дания'),(23,0,'Германия',10.40069400,51.12180200,'country','Германия'),(24,0,'Нидерланды',5.56521600,52.24576200,'country','Нидерланды'),(25,0,'Бельгия',4.66057600,50.64117500,'country','Бельгия'),(26,0,'Люксембург',6.09233800,49.77682200,'country','Люксембург'),(27,0,'Франция',2.45195200,46.62184100,'country','Франция'),(28,0,'Великобритания',-2.55055100,53.94383200,'country','Великобритания'),(29,0,'Ирландия',-8.14688400,53.18497900,'country','Ирландия'),(30,0,'Швейцария',8.22919700,46.80020600,'country','Швейцария'),(31,0,'Италия',12.16218300,43.52902700,'country','Италия'),(32,0,'Австрия',14.14127900,47.58708400,'country','Австрия'),(33,0,'Словения',14.82175300,46.11955500,'country','Словения'),(34,0,'Венгрия',19.41232400,47.16517500,'country','Венгрия'),(35,0,'Чехия',15.33149300,49.73910500,'country','Чехия'),(36,0,'Словакия',19.48487200,48.70748300,'country','Словакия'),(37,0,'Румыния',24.98561600,45.83944300,'country','Румыния'),(38,0,'Сербия',20.80548500,44.03244000,'country','Сербия'),(39,0,'Болгария',25.23863500,42.75740600,'country','Болгария'),(40,0,'Босния и Герцеговина',17.78524100,44.16825200,'country','Босния и Герцеговина'),(41,0,'Черногория',19.24897400,42.78509600,'country','Черногория'),(42,0,'Албания',20.06431200,41.13928300,'country','Албания'),(43,0,'Македония',21.70089000,41.60046300,'country','Македония'),(44,0,'Греция',22.57126700,39.34744200,'country','Греция'),(45,0,'Испания',-3.55738200,40.38768900,'country','Испания'),(46,0,'Португалия',-7.96865800,39.67991100,'country','Португалия'),(47,0,'Марокко',-8.87318100,29.12680100,'country','Марокко'),(48,0,'Тунис',9.57206100,34.11443900,'country','Тунис'),(49,0,'Ливия',18.03081400,27.04182400,'country','Ливия'),(50,0,'Египет',29.87614300,26.50541600,'country','Египет'),(51,0,'Израиль',35.06138000,31.55230700,'country','Израиль'),(52,0,'Иордания',36.78809500,31.24818300,'country','Иордания'),(53,0,'Сирия',38.50527000,35.01280300,'country','Сирия'),(54,0,'Иран',54.30365300,32.56425300,'country','Иран'),(55,0,'Ирак',43.77494900,33.04456800,'country','Ирак'),(56,0,'Афганистан',66.02470900,33.83113700,'country','Афганистан'),(57,0,'Пакистан',69.32829100,29.90354400,'country','Пакистан'),(58,0,'Туркменистан',59.17855000,39.19414100,'country','Туркменистан'),(59,0,'Китай',99.99999999,36.62532500,'country','Китай'),(60,0,'Монголия',99.99999999,46.83469100,'country','Монголия'),(61,0,'Северная Корея',99.99999999,40.14473200,'country','Северная Корея'),(62,0,'Южная Корея',99.99999999,36.45115300,'country','Южная Корея'),(63,0,'Япония',99.99999999,36.65332700,'country','Япония'),(64,0,'Филиппины',99.99999999,15.94804500,'country','Филиппины'),(65,0,'Тайвань',99.99999999,23.74898800,'country','Тайвань'),(66,0,'Вьетнам',99.99999999,15.37703600,'country','Вьетнам'),(67,0,'Лаос',99.99999999,18.49549800,'country','Лаос'),(68,0,'Таиланд',99.99999999,15.13065000,'country','Таиланд'),(69,0,'Камбоджа',99.99999999,12.71088700,'country','Камбоджа'),(70,0,'Мьянма',96.51799400,21.19231300,'country','Мьянма'),(71,0,'Малайзия',99.99999999,3.60546000,'country','Малайзия'),(72,0,'Индонезия',99.99999999,-0.20937900,'country','Индонезия'),(73,0,'Папуа — Новая Гвинея',99.99999999,-6.61254700,'country','Папуа — Новая Гвинея'),(74,0,'Австралия',99.99999999,-25.57876800,'country','Австралия'),(75,0,'Бангладеш',90.27920400,23.80488200,'country','Бангладеш'),(76,0,'Индия',79.58900900,23.03873400,'country','Индия'),(77,0,'Бутан',90.42622200,27.41482200,'country','Бутан'),(78,0,'Непал',83.94415900,28.25913100,'country','Непал'),(79,0,'Шри-Ланка',80.69197000,7.64164300,'country','Шри-Ланка'),(80,0,'Оман',56.09807400,20.56961200,'country','Оман'),(81,0,'Саудовская Аравия',44.55051800,24.12415000,'country','Саудовская Аравия'),(82,0,'Катар',51.19320900,25.28535300,'country','Катар'),(83,0,'Объединённые Арабские Эмираты',54.33353100,23.90717300,'country','Объединённые Арабские Эмираты'),(84,0,'Бахрейн',50.56277200,26.08922700,'country','Бахрейн'),(85,0,'Кувейт',47.59547500,29.33588100,'country','Кувейт'),(86,0,'Йемен',47.54734300,15.93471200,'country','Йемен'),(87,0,'Эритрея',38.84763500,15.36214100,'country','Эритрея'),(88,0,'Эфиопия',39.63279000,8.62353400,'country','Эфиопия'),(89,0,'Сомали',46.20310400,5.17304600,'country','Сомали'),(90,0,'Судан',29.95370300,15.98989700,'country','Судан'),(91,0,'Чад',18.66776400,15.36828600,'country','Чад'),(92,0,'Центральноафриканская Республика',20.48547800,6.57415400,'country','Центральноафриканская Республика'),(93,0,'Южный Судан',30.27603700,7.30607900,'country','Южный Судан'),(94,0,'Уганда',32.39001500,1.27731500,'country','Уганда'),(95,0,'Кения',37.81732200,0.60514700,'country','Кения'),(96,0,'Танзания',34.81446900,-6.26641200,'country','Танзания'),(97,0,'Демократическая Республика Конго',23.65901900,-2.87970300,'country','Демократическая Республика Конго'),(98,0,'Камерун',12.74234200,5.69737700,'country','Камерун'),(99,0,'Габон',11.78183600,-0.62393000,'country','Габон'),(100,0,'Ангола',17.57329300,-12.33259600,'country','Ангола'),(101,0,'Замбия',27.78805400,-13.46058300,'country','Замбия'),(102,0,'Зимбабве',29.87201100,-19.00043000,'country','Зимбабве'),(103,0,'Мозамбик',35.54746800,-17.27312400,'country','Мозамбик'),(104,0,'Мадагаскар',46.69583900,-19.38287900,'country','Мадагаскар'),(105,0,'Малави',34.30294200,-13.21396000,'country','Малави'),(106,0,'Ботсвана',23.81445500,-22.18735500,'country','Ботсвана'),(107,0,'Намибия',17.22205100,-22.13955100,'country','Намибия'),(108,0,'Южно-Африканская Республика',25.08029800,-29.00220400,'country','Южно-Африканская Республика'),(109,0,'Лесото',28.24669800,-29.58232000,'country','Лесото'),(110,0,'Свазиленд',31.49808700,-26.56515300,'country','Свазиленд'),(111,0,'Нигерия',8.09284200,9.58523900,'country','Нигерия'),(112,0,'Бенин',2.33968000,9.65643300,'country','Бенин'),(113,0,'Того',0.97700800,8.53036700,'country','Того'),(114,0,'Гана',-1.20816200,7.96141200,'country','Гана'),(115,0,'Буркина-Фасо',-1.74409700,12.28631900,'country','Буркина-Фасо'),(116,0,'Мали',-3.52516000,17.35722800,'country','Мали'),(117,0,'Либерия',-9.31038200,6.44733600,'country','Либерия'),(118,0,'Гвинея',-10.93604500,10.43545900,'country','Гвинея'),(119,0,'Сьерра-Леоне',-11.80521900,8.54806300,'country','Сьерра-Леоне'),(120,0,'Гвинея-Бисау',-14.95846800,12.03776600,'country','Гвинея-Бисау'),(121,0,'Сенегал',-14.46768200,14.36017500,'country','Сенегал'),(122,0,'Гамбия',-15.42239400,13.44706000,'country','Гамбия'),(123,0,'Мавритания',-10.33139800,20.25862100,'country','Мавритания'),(124,0,'Аргентина',-65.10205000,-35.19543500,'country','Аргентина'),(125,0,'Боливия',-64.65780600,-16.71473300,'country','Боливия'),(126,0,'Бразилия',-53.06752600,-10.77753400,'country','Бразилия'),(127,0,'Чили',-71.22794000,-35.29835400,'country','Чили'),(128,0,'Парагвай',-58.39275700,-23.24195200,'country','Парагвай'),(129,0,'Уругвай',-56.05579900,-32.96712100,'country','Уругвай'),(130,0,'Перу',-74.35686200,-9.17125000,'country','Перу'),(131,0,'Эквадор',-78.39720600,-1.46556800,'country','Эквадор'),(132,0,'Колумбия',-73.07386100,3.90908100,'country','Колумбия'),(133,0,'Венесуэла',-66.22328200,7.15676000,'country','Венесуэла'),(134,0,'Гайана',-58.97489200,4.79571300,'country','Гайана'),(135,0,'Суринам',-56.00986800,3.94444800,'country','Суринам'),(136,0,'Французская Гвиана',-53.23561000,3.92369700,'country','Французская Гвиана'),(137,0,'Тринидад и Тобаго',-61.29652500,10.42373900,'country','Тринидад и Тобаго'),(138,0,'Панама',-80.13449300,8.53103800,'country','Панама'),(139,0,'Коста-Рика',-84.19385400,9.97482500,'country','Коста-Рика'),(140,0,'Никарагуа',-85.03194700,12.84412700,'country','Никарагуа'),(141,0,'Гондурас',-86.59753900,14.82381400,'country','Гондурас'),(142,0,'Сальвадор',-88.86650400,13.73300500,'country','Сальвадор'),(143,0,'Гватемала',-90.35707000,15.69613600,'country','Гватемала'),(144,0,'Мексика',-99.99999999,23.94129400,'country','Мексика'),(145,0,'Белиз',-88.70706200,17.20055100,'country','Белиз'),(146,0,'Куба',-78.96027000,21.61051000,'country','Куба'),(147,0,'Доминиканская Республика',-70.49993600,18.89732100,'country','Доминиканская Республика'),(148,0,'Ямайка',-77.31122300,18.15779100,'country','Ямайка'),(149,0,'Республика Гаити',-72.67458700,18.93351000,'country','Республика Гаити'),(150,0,'Пуэрто-Рико',-66.47890600,18.22506300,'country','Пуэрто-Рико'),(151,0,'Сент-Китс и Невис',-62.76560300,17.33970600,'country','Сент-Китс и Невис'),(152,0,'Монтсеррат',-62.18927100,16.73917000,'country','Монтсеррат'),(153,0,'Антигуа и Барбуда',-61.79870200,17.07766300,'country','Антигуа и Барбуда'),(154,0,'Гваделупа',-61.42187600,16.20822700,'country','Гваделупа'),(155,0,'Доминика',-61.35006500,15.43464900,'country','Доминика'),(156,0,'Мартиника',-61.01867700,14.65321600,'country','Мартиника'),(157,0,'Сент-Люсия',-60.96729300,13.89863300,'country','Сент-Люсия'),(158,0,'Сент-Винсент и Гренадины',-61.18913200,13.25147700,'country','Сент-Винсент и Гренадины'),(159,0,'Барбадос',-59.55641700,13.17222100,'country','Барбадос'),(160,0,'Гренада',-61.68375300,12.11383400,'country','Гренада'),(161,0,'Сен-Мартен',-63.06212800,18.07953900,'country','Сен-Мартен'),(162,0,'Тёркс и Кайкос',-71.75766700,21.77567500,'country','Тёркс и Кайкос'),(163,0,'Багамские Острова',-78.05500100,24.67952900,'country','Багамские Острова'),(164,0,'Соединённые Штаты Америки',-98.98997800,39.49590900,'country','Соединённые Штаты Америки'),(165,0,'Канада',-96.38835000,62.53604100,'country','Канада'),(166,0,'Исландия',-18.57708800,64.98364300,'country','Исландия'),(167,0,'Гренландия',-41.39416200,74.75581100,'country','Гренландия'),(168,0,'Новая Зеландия',99.99999999,-43.94763500,'country','Новая Зеландия'),(169,0,'Фиджи',99.99999999,-17.83540800,'country','Фиджи'),(170,0,'Самоа',-99.99999999,-13.62080800,'country','Самоа'),(171,0,'Американское Самоа',-99.99999999,-14.30068600,'country','Американское Самоа'),(172,0,'Уоллис и Футуна',-99.99999999,-13.28501000,'country','Уоллис и Футуна'),(173,0,'Тувалу',99.99999999,-7.96162700,'country','Тувалу'),(174,0,'Науру',99.99999999,-0.52853300,'country','Науру'),(175,0,'Федеративные Штаты Микронезии',99.99999999,6.88037400,'country','Федеративные Штаты Микронезии'),(176,0,'Бруней',99.99999999,4.49689500,'country','Бруней'),(177,0,'Бурунди',29.88838700,-3.36645000,'country','Бурунди'),(178,0,'Руанда',29.92605300,-1.99994500,'country','Руанда'),(179,0,'Вануату',99.99999999,-15.24134700,'country','Вануату'),(180,0,'Восточный Тимор',99.99999999,-8.79741400,'country','Восточный Тимор'),(181,0,'Джибути',42.58025200,11.73226900,'country','Джибути'),(182,0,'Кабо-Верде',-23.62466800,15.08362800,'country','Кабо-Верде'),(183,0,'Кипр',33.60174400,35.28039000,'country','Кипр'),(184,0,'Кирибати',-99.99999999,1.85751600,'country','Кирибати'),(185,0,'Республика Конго',15.24135600,-0.82874400,'country','Республика Конго'),(186,0,'Ливан',35.89342700,33.92144000,'country','Ливан'),(187,0,'Лихтенштейн',9.55277500,47.14127000,'country','Лихтенштейн'),(188,0,'Маврикий',57.57181400,-20.28355100,'country','Маврикий'),(189,0,'Мальдивы',73.54008700,1.91230000,'country','Мальдивы'),(190,0,'Мальта',14.43952900,35.89055400,'country','Мальта'),(191,0,'Маршалловы Острова',99.99999999,9.33982300,'country','Маршалловы Острова'),(192,0,'Монако',7.41753300,43.73285400,'locality','Монако, Монако'),(193,0,'Алжир',3.03901000,36.78055400,'locality','Алжир, Алжир'),(194,0,'Нигер',9.40062700,17.42028700,'country','Нигер'),(195,0,'Палау',99.99999999,7.49914500,'country','Палау'),(196,0,'Сан-Марино',12.46349600,43.93814500,'country','Сан-Марино'),(197,0,'Сан-Томе и Принсипи',6.60205100,0.23930500,'country','Сан-Томе и Принсипи'),(198,0,'Сейшельские Острова',55.46725000,-4.67863300,'country','Сейшельские Острова'),(199,0,'Сингапур',99.99999999,1.29015300,'locality','Сингапур, Сингапур'),(200,0,'Соломоновы Острова',99.99999999,-9.62279900,'country','Соломоновы Острова'),(201,0,'Тонга',-99.99999999,-21.17392900,'country','Тонга'),(202,0,'Хорватия',16.42804900,45.14010100,'country','Хорватия'),(203,0,'Экваториальная Гвинея',10.46540000,1.56636900,'country','Экваториальная Гвинея'),(204,1,'Ярославская область',39.10513800,57.81736100,'province','Россия, Ярославская область'),(205,1,'Ямало-Ненецкий автономный округ',80.00539700,66.08643500,'province','Россия, Ямало-Ненецкий автономный округ'),(206,1,'Чукотский автономный округ',99.99999999,65.98261300,'province','Россия, Чукотский автономный округ'),(207,1,'Чувашская Республика',47.08687500,55.49202300,'province','Россия, Чувашская Республика'),(208,1,'Чеченская Республика',45.74766700,43.30578400,'province','Россия, Чеченская Республика'),(209,1,'Челябинская область',60.39564100,54.44619900,'province','Россия, Челябинская область'),(210,1,'Ханты-Мансийский автономный округ',65.89750800,61.58891200,'province','Россия, Ханты-Мансийский автономный округ'),(211,1,'Хабаровский край',99.99999999,60.56711600,'province','Россия, Хабаровский край'),(212,1,'Ульяновская область',48.15155000,54.12261600,'province','Россия, Ульяновская область'),(213,1,'Удмуртская Республика',52.79697200,57.16678400,'province','Россия, Удмуртская Республика'),(214,1,'Тюменская область',72.60593800,62.34965100,'province','Россия, Тюменская область'),(215,1,'Тульская область',37.57569300,53.88806400,'province','Россия, Тульская область'),(216,1,'Томская область',78.63728000,58.94919300,'province','Россия, Томская область'),(217,1,'Тверская область',34.70619500,57.09303300,'province','Россия, Тверская область'),(218,1,'Тамбовская область',41.58718300,52.68086400,'province','Россия, Тамбовская область'),(219,1,'Ставропольский край',43.34452100,44.95355100,'province','Россия, Ставропольский край'),(220,1,'Смоленская область',32.99854300,54.95619200,'province','Россия, Смоленская область'),(221,1,'Севастополь',33.52543200,44.61668700,'locality','Россия, Севастополь'),(222,1,'Свердловская область',61.53076100,58.58675500,'province','Россия, Свердловская область'),(223,1,'Сахалинская область',99.99999999,50.15092600,'province','Россия, Сахалинская область'),(224,1,'Саратовская область',46.79722300,51.57852900,'province','Россия, Саратовская область'),(225,1,'Санкт-Петербург',30.31586800,59.93909500,'locality','Россия, Санкт-Петербург'),(226,1,'Самарская область',50.46330100,53.27635000,'province','Россия, Самарская область'),(227,1,'Рязанская область',40.62524000,54.33336300,'province','Россия, Рязанская область'),(228,1,'Ростовская область',41.26812800,47.72873200,'province','Россия, Ростовская область'),(229,1,'Республика Хакасия',89.89707800,53.38635700,'province','Россия, Республика Хакасия'),(230,1,'Республика Тыва',94.79308500,51.58433200,'province','Россия, Республика Тыва'),(231,1,'Республика Татарстан',50.91101300,55.35033600,'province','Россия, Республика Татарстан'),(232,1,'Республика Северная Осетия — Алания',44.26203300,43.09266900,'province','Россия, Республика Северная Осетия — Алания'),(233,1,'Республика Саха (Якутия)',99.99999999,65.06107300,'province','Россия, Республика Саха (Якутия)'),(234,1,'Республика Мордовия',45.06365400,54.24669200,'province','Россия, Республика Мордовия'),(235,1,'Республика Марий Эл',47.93676300,56.57727800,'province','Россия, Республика Марий Эл'),(236,1,'Республика Крым',34.44968100,45.28071200,'province','Россия, Республика Крым'),(237,1,'Республика Коми',54.78966900,64.12546300,'province','Россия, Республика Коми'),(238,1,'Республика Карелия',33.23260800,63.62132400,'province','Россия, Республика Карелия'),(239,1,'Республика Калмыкия',45.32570100,46.41402400,'province','Россия, Республика Калмыкия'),(240,1,'Республика Ингушетия',45.05458100,43.10359000,'province','Россия, Республика Ингушетия'),(241,1,'Республика Дагестан',46.99686400,43.11083000,'province','Россия, Республика Дагестан'),(242,1,'Республика Бурятия',99.99999999,54.54422200,'province','Россия, Республика Бурятия'),(243,1,'Республика Башкортостан',56.52553700,54.27150000,'province','Россия, Республика Башкортостан'),(244,1,'Республика Алтай',87.01545400,50.73624000,'province','Россия, Республика Алтай'),(245,1,'Республика Адыгея',40.25296900,44.42986600,'province','Россия, Республика Адыгея'),(246,1,'Псковская область',29.23691100,57.23648600,'province','Россия, Псковская область'),(247,1,'Приморский край',99.99999999,45.04198000,'province','Россия, Приморский край'),(248,1,'Пермский край',56.22567900,59.11769800,'province','Россия, Пермский край'),(249,1,'Пензенская область',44.63415100,53.18240000,'province','Россия, Пензенская область'),(250,1,'Орловская область',36.48104200,52.78145500,'province','Россия, Орловская область'),(251,1,'Оренбургская область',53.49868200,52.74352800,'province','Россия, Оренбургская область'),(252,1,'Омская область',73.34441600,56.10347200,'province','Россия, Омская область'),(253,1,'Новосибирская область',79.77023600,55.27627200,'province','Россия, Новосибирская область'),(254,1,'Новгородская область',32.49022200,58.30771500,'province','Россия, Новгородская область'),(255,1,'Нижегородская область',44.61189100,56.31276400,'province','Россия, Нижегородская область'),(256,1,'Ненецкий автономный округ',54.36506200,67.71421200,'province','Россия, Ненецкий автономный округ'),(257,1,'Мурманская область',38.31366800,67.25024400,'province','Россия, Мурманская область'),(258,1,'Московская область',37.38003100,55.81579200,'province','Россия, Московская область'),(259,1,'Магаданская область',99.99999999,62.57581500,'province','Россия, Магаданская область'),(260,1,'Липецкая область',39.14978400,52.64455400,'province','Россия, Липецкая область'),(261,1,'Ленинградская область',31.29335200,60.01835300,'province','Россия, Ленинградская область'),(262,1,'Курская область',36.10487200,51.68036900,'province','Россия, Курская область'),(263,1,'Курганская область',64.80940500,55.44834700,'province','Россия, Курганская область'),(264,1,'Красноярский край',95.96847700,67.23677900,'province','Россия, Красноярский край'),(265,1,'Краснодарский край',38.95140900,45.27236500,'province','Россия, Краснодарский край'),(266,1,'Костромская область',43.78849500,58.45600300,'province','Россия, Костромская область'),(267,1,'Кировская область',49.83036600,58.67994600,'province','Россия, Кировская область'),(268,1,'Кемеровская область',87.20736100,54.77904700,'province','Россия, Кемеровская область'),(269,1,'Карачаево-Черкесская Республика',41.75392800,43.77094700,'province','Россия, Карачаево-Черкесская Республика'),(270,1,'Камчатский край',99.99999999,61.35017900,'province','Россия, Камчатский край'),(271,1,'Калужская область',35.44518500,54.37180000,'province','Россия, Калужская область'),(272,1,'Калининградская область',21.22993000,54.75436500,'province','Россия, Калининградская область'),(273,1,'Кабардино-Балкарская Республика',43.40827400,43.49439600,'province','Россия, Кабардино-Балкарская Республика'),(274,1,'Иркутская область',99.99999999,57.10029400,'province','Россия, Иркутская область'),(275,1,'Ивановская область',41.55407100,56.98977200,'province','Россия, Ивановская область'),(276,1,'Забайкальский край',99.99999999,52.84725800,'province','Россия, Забайкальский край'),(277,1,'Еврейская автономная область',99.99999999,48.52290200,'province','Россия, Еврейская автономная область'),(278,1,'Москва',37.62039300,55.75396000,'locality','Россия, Москва'),(279,1,'Воронежская область',40.23339500,50.97089800,'province','Россия, Воронежская область'),(280,1,'Вологодская область',44.04961800,60.13898800,'province','Россия, Вологодская область'),(281,1,'Волгоградская область',44.15140600,49.61582100,'province','Россия, Волгоградская область'),(282,1,'Владимирская область',40.67916600,56.01358800,'province','Россия, Владимирская область'),(283,1,'Брянская область',33.42219700,52.90919200,'province','Россия, Брянская область'),(284,1,'Белгородская область',37.30319800,50.87223100,'province','Россия, Белгородская область'),(285,1,'Астраханская область',47.46618900,46.85146300,'province','Россия, Астраханская область'),(286,1,'Архангельская область',43.33666100,63.63751700,'province','Россия, Архангельская область'),(287,1,'Амурская область',99.99999999,53.41334100,'province','Россия, Амурская область'),(288,1,'Алтайский край',82.53001300,52.12967100,'province','Россия, Алтайский край'),(289,258,'Подольск',37.54473700,55.43117700,'locality','Россия, Московская область, Подольск'),(290,258,'Раменский район',38.22580400,55.56728000,'area','Россия, Московская область, Раменский район'),(291,290,'Островецкое сельское поселение',37.99351700,55.59190000,'area','Россия, Московская область, Раменский район, Островецкое сельское поселение'),(292,291,'село Верхнее Мячково',37.97962000,55.55066200,'locality','Россия, Московская область, Раменский район, Островецкое сельское поселение, село Верхнее Мячково'),(293,278,'Зеленоград',37.21438200,55.99189300,'locality','Россия, Москва, Зеленоград'),(294,293,'район Савёлки',37.23801600,55.98991500,'district','Россия, Москва, Зеленоградский административный округ, район Савёлки'),(295,2,'Брест',23.71202000,52.08951000,'locality','Беларусь, Брест'),(296,295,'Московский район',23.74279600,52.07844100,'district','Беларусь, Брест, Московский район');
/*!40000 ALTER TABLE `location_names_copy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu`
--

DROP TABLE IF EXISTS `menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `menu` (
  `m_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `m_pid` smallint(5) unsigned NOT NULL DEFAULT '0',
  `m_path` varchar(255) NOT NULL,
  `m_name` varchar(100) NOT NULL,
  `m_title` varchar(255) NOT NULL,
  `m_h1` varchar(100) NOT NULL,
  `m_desc` text NOT NULL,
  `m_level` tinyint(3) unsigned NOT NULL,
  `m_lk` smallint(5) unsigned NOT NULL,
  `m_rk` smallint(5) unsigned NOT NULL,
  `c_id` smallint(5) unsigned NOT NULL,
  `m_type` tinyint(1) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`m_id`),
  UNIQUE KEY `m_name` (`m_name`),
  UNIQUE KEY `mpath` (`m_path`),
  KEY `cid` (`c_id`),
  KEY `lrk_level` (`m_lk`,`m_rk`,`m_level`),
  KEY `type_level` (`m_type`,`m_level`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8 COMMENT='храним информацию о меню сайта (не админка)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu`
--

LOCK TABLES `menu` WRITE;
/*!40000 ALTER TABLE `menu` DISABLE KEYS */;
INSERT INTO `menu` VALUES (1,11,'/chat','Чат','Чат','Чат','Чат',2,10,11,9,1),(2,11,'/news','Новости','Новости','Новости','Новости',2,8,9,6,1),(3,11,'/user','МотоСоседи','МотоСоседи','МотоСоседи','МотоСоседи',2,2,3,13,1),(4,11,'/blog','Блог','Блог','Блог','Блог',2,6,7,7,1),(5,11,'/events','МотоСобытия','МотоСобытия','МотоСобытия','МотоСобытия',2,12,13,8,1),(7,11,'/mototreki','МотоТреки','МотоТреки','МотоТреки','МотоТреки',2,16,17,10,1),(8,11,'/motosaloni','МотоСалоны','МотоСалоны','МотоСалоны','МотоСалоны',2,14,15,11,1),(9,11,'/admoto','Объявления','Объявления','Объявления','Объявления',2,4,5,12,1),(10,12,'/admin/user/groups','Группы пользователей','Группы пользователей','Группы пользователей','Группы пользователей',2,32,33,20,0),(11,0,'/','Главная страница','Главная страница','Главная страница','Главная страница',1,1,18,21,1),(12,0,'/admin','Админка','Админка','Админка главная страница','Админка главная страница',1,25,34,1,0),(13,12,'/admin/menu','Меню сайта','Меню сайта','Меню сайта','Меню сайта',2,26,27,5,0),(14,12,'/admin/controller','Контроллеры','Контроллеры (роутеры) сайта','Контроллеры (роутеры) сайта','Контроллеры (роутеры) сайта',2,28,29,4,0),(15,12,'/admin/user','Пользователи','Пользователи','Пользователи','Пользователи',2,30,31,22,0),(16,0,'/profile','Профиль пользователя','Профиль пользователя','Профиль пользователя','Профиль пользователя',1,19,24,23,2),(17,16,'/profile/photo','Фотографии','Фотографии','Фотографии','Фотографии',2,20,21,24,2),(18,16,'/profile/video','Видео','Видео','Видео','Видео',2,22,23,25,2);
/*!40000 ALTER TABLE `menu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `moto_track`
--

DROP TABLE IF EXISTS `moto_track`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `moto_track` (
  `mtt_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `mtt_name` varchar(255) NOT NULL DEFAULT '',
  `mtt_website` varchar(255) NOT NULL DEFAULT '',
  `mtt_address` varchar(255) NOT NULL DEFAULT '',
  `mtt_descrip` text,
  `mtt_email` varchar(255) NOT NULL DEFAULT '',
  `mtt_phones` varchar(255) NOT NULL DEFAULT '',
  `mtt_latitude` decimal(10,8) DEFAULT NULL,
  `mtt_longitude` decimal(11,8) DEFAULT NULL,
  `mtt_location_id` int(10) unsigned NOT NULL DEFAULT '0',
  `mtt_create_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `mtt_update_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `mtt_location_pids` varchar(100) NOT NULL DEFAULT '',
  `mtt_gps_lat` varchar(45) NOT NULL,
  `mtt_gps_lng` varchar(45) NOT NULL,
  PRIMARY KEY (`mtt_id`),
  UNIQUE KEY `mtt_name` (`mtt_name`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `moto_track`
--

LOCK TABLES `moto_track` WRITE;
/*!40000 ALTER TABLE `moto_track` DISABLE KEYS */;
INSERT INTO `moto_track` VALUES (1,'Автодром «Лидер»','globalracing.ru','Россия, Московская область, Подольск, Симферопольское шоссе, 42-й километр, 1к9','<p>Общие характеристики трассы:</p>\r\n<ul>\r\n<li>Открытие &ndash; осень 2004 г.</li>\r\n<li>Официальное открытие &ndash; 9 июля 2005 г.</li>\r\n<li>Длина &ndash; 1153 метра</li>\r\n<li>Максимальная ширина - 10 метров</li>\r\n<li>Минимальная ширина &ndash; 8 метров</li>\r\n<li>Общее количество поворотов - 17</li>\r\n<li>Количество правых поворотов &ndash; 9</li>\r\n<li>Количество левых поворотов &ndash; 8</li>\r\n<li>Количество гонщиков на стартовой решетке - до 34</li>\r\n<li>Количество судейских постов на трассе &ndash; 9</li>\r\n<li>Количество боксов &ndash; 14 (по 40 м.кв.)</li>\r\n<li>Покрытие &ndash; асфальт (первое покрытие 2004 г)</li>\r\n<li>Вместимость трибуны для зрителей &ndash; до 1.000 человек (4 сектора)</li>\r\n</ul>\r\n<p>Географическое расположение</p>\r\n<p>Трек расположен на 41 км автомагистрали М2 Москва-Крым (направление на Тулу). Южное направление дает некоторые преимущества. Часто, когда в Москве дождь, над треком сияет солнце.</p>\r\n<p>Инфраструктура и сервис</p>\r\n<p>Автодром построен на территории загородного клуба &laquo;Айвенго&raquo;, в уютных номерах которого вы можете с комфортом передохнуть между тренировками, остановиться на несколько дней для более основательной подготовки к соревнованиям, перекусить в кафе, ресторане, поиграть на открытой площадке в большой теннис, сходить в сауну, казино, да и вообще приятно провести время со своей семьей или друзьями, которые наверняка захотят поехать на воскресную гонку вместе с вами.</p>\r\n<p>Спортивные составляющие:</p>\r\n<ul>\r\n<li>подходит для езды на картах (спортивных и прокатных),</li>\r\n<li>минимотоциклах,</li>\r\n<li>супермотардах,</li>\r\n<li>шоссейных мотоциклах</li>\r\n<li>и автомобилях.</li>\r\n</ul>','info@globalracing.ru','+7 (495) 971-16-65; +7 (903) 977-12-40',55.39917189,37.60356793,289,1472393643,1472752055,'70,258,289','55&deg; 23&prime;57&Prime;N','37&deg; 36&prime;13&Prime;E'),(2,'АДМ Мячково','admraceway.ru','Россия, Московская область, Раменский район, Островецкое сельское поселение, село Верхнее Мячково, аэродром Мячково','<p>ADM Raceway &mdash; старейшая из ныне действующих российских гоночных трасс, построенная в соответствии с требованиями категории III FIA (фр. F&eacute;d&eacute;ration Internationale<wbr />de l&rsquo;Automobile &mdash; Международная автомобильная федерация).</p>\r\n<p>Представляет собой ровный асфальтированный участок длиной 3275 метров с 16 поворотами и несколькими скоростными прямыми, на котором можно проводить заезды как по часовой, так и против часовой стрелки. При необходимости может быть разделена на несколько <a href=\"http://admraceway.ru/configurations/\" target=\"_blank\">конфигураций</a>. Ширина дорожного полотна варьируется от 9 до 12 метров.</p>','adm@adm-raceway.ru','+7 (495) 995-95-93',55.56046900,37.98247700,292,1472394917,1473159290,'70,258,290,291,292','55&deg; 33&prime;38&Prime;N','37&deg; 58&prime;57&Prime;E'),(3,'Картодром «Фирсановка»','gbutalisman.ru','Россия, Москва, Зеленоград, поселок Назарьево','<p>Картодром &laquo;Фирсановка&raquo; находится недалеко от Москвы, км 14 по Ленинградскому шосcе от МКАД. Протяженность его примерно 1230 метров, ширина варьирует от 8 до 12 метров. Трек представляет собой трассу с множеством поворотов (5 правых и 8 левых), короткими прямыми и приятными перепадами высот, отчего катание на нем становиться интереснее и это позволит лучше прочувствовать как машина себя ведёт в поворотах и перекладках.</p>\r\n<p>Также рядом с основным треком имеется небольшая внедорожная трасса протяженностью примерно 500 метров, поэтому на картодроме &laquo;Фирсановка&raquo; Вы сможете отточить свое умение в езде как на картингах, так и на всех видах мотоциклов.</p>\r\n<p>В непосредственной близости от трассы есть заправка, автосервис и мойка, а также в 2 минутах езды имеется супермаркет.</p>','mbutalisman@mail.ru','+7 (929) 939-51-10',55.97102409,37.25512507,335,1472505185,1473240297,'70,278,293,335','55&deg; 58&prime;16&Prime;N','37&deg; 15&prime;18&Prime;E'),(4,'Картодром Альянс','','Беларусь, Брест, Московский район','','','',52.07877400,23.81501182,355,1472510358,1481992214,'187,354,355','52&deg; 4&prime;44&Prime;N','23&deg; 48&prime;54&Prime;E'),(5,'Трасса-Горки','pitbikerussia.ru','Россия, Московская область, Ленинский район, деревня Горки, Каширское шоссе','<ul>\r\n<li>Тренировки</li>\r\n<li>Соревнования</li>\r\n<li>Обучение</li>\r\n<li>Прокат (совсем скоро)</li>\r\n<li>Хранение питбайка- Ремонт</li>\r\n</ul>\r\n<p>Все это вы можете найти у нас на трассе!</p>\r\n<p><strong>День катания на трассе стоит 300 руб.</strong> Это симвалическая плата за содержание трассы!</p>\r\n<p>Ждем всех у нас на трассе!</p>\r\n<p><strong>Как проехать Своим ходом</strong></p>\r\n<p>Кто без машины от Метро Домодедовская Автобус 466 или Маршрутки 466, до Деревни Горки (Попросите остановить напротив заправки ТРАССА). Заправка будет слева от вас, а напротив нее первый поворот перед деревней направо и вам именно туда. Повернув направо и пройдя 200 метров, увидите слева шлагбаум, там находится наш мото-клуб PitbikeRussia. К самой трассе нужно пройти еще метров 50 и справа на полянке вы увидите ее!</p>','info@pitbikerussia.ru','+7 (926) 218-55-16',55.51156988,37.75512299,299,1472751231,1473801602,'70,258,297,299','55&deg; 30&prime;42&Prime;N','37&deg; 45&prime;18&Prime;E'),(6,'Курьяново','','Россия, Москва, Проектируемый проезд № 4386','<p>Трасса находиться по адресу Москва, Проектируемый пр. №4386, 1. Если ехать со стороны Марьино, то по ул. Илловайская в сторону тоннеля, далее на ж/д переезде налево. После см. карту и схему проезд между складов на берег. Для ориентира на другом берегу МИФИ. &nbsp;Трасса повыбита местами. Приемники на больших столах с колеями. Не скоростная. Парочка прямиков есть, но довольно короткие и выбитые. Общая длина на минуту пятьдесят по времени. Подьезд хороший, до самой трассы асфальтовая дорога. Есть песчаный участок для тренировки, но трасса по нему не проходит.</p>','','',55.65194060,37.68073546,278,1473103560,1473103560,'70,278','55&deg; 39&prime;7&Prime;N','37&deg; 40&prime;51&Prime;E'),(7,'Красное Кольцо','redring.info','Россия, Красноярский край, Емельяновский район, поселок Логовой','<p>Кольцевая гоночная трасса &laquo;Красное Кольцо&raquo; была построена в 2007 году, на тот момент, это была единственная полноценно действующая профессиональная трасса на территории России. Сейчас можно с уверенностью сказать, что накопленный опыт позволяет проводить различные соревнования регионального, всероссийского и даже международного масштаба на трассе в Красноярске.</p>','redringinfo@mail.ru','+7 (391) 2-777-666',56.12872973,92.73885495,301,1473192385,1476110950,'70,264,300,301','56&deg; 7&prime;43&Prime;N','92&deg; 44&prime;20&Prime;E'),(8,'Кутузовский редут','motokutuzov.ru','Россия, Московская область, Солнечногорский район, деревня Брёхово','<p>Мотокомплекс &laquo;Кутузовский Редут&raquo; &mdash; это многофункциональный мотоциклетный спортивный, технический и торговый центр, в котором сегодня создаются наилучшие условия для приобщения к мотоспорту, место для обслуживания мототехники, место где можно просто приятно и интересно провести время и совместить семейный отдых с занятиями мотокроссом и просто активным отдыхом.</p>','rustem@motokutuzov.ru','8-985-438-8838; 8-926-139-7648',55.93644080,37.19106337,303,1473193368,1473193368,'70,258,302,303','55&deg; 56&prime;11&Prime;N','37&deg; 11&prime;28&Prime;E'),(9,'Трасса-Петрово-дальнее','','Россия, Московская область, Красногорский район, Ильинское сельское поселение, село Петрово-Дальнее','','','',55.75466723,37.18102454,306,1473194298,1473194298,'70,258,304,305,306','55&deg; 45&prime;17&Prime;N','37&deg; 10&prime;52&Prime;E'),(10,'Трасса-МК-Форсаж','mcforsage.ru','Россия, Московская область, Лыткарино','<p>Мотоклуб Форсаж &ndash; динамично развивающийся, дружелюбный и открытый для общения клуб людей, чья любовь к мототехнике безусловна и безгранична. Для нас мотоцикл является не только средством передвижения, но и лучшим другом и неотъемлемой частью нашей жизни. Мы регулярно проводим соревнования по мотокроссу в нашем городе, а так же активно участвуем в мотогонках в г. Москве и Московской области, организовываем выезды на природу и пробеги по другим городам и областям.</p>','raafenkraai@gmail.com','+7 (916) 621-37-16; +7 (925) 506-72-19',55.56779580,37.95664238,307,1473194857,1473239985,'70,258,307','55&deg; 34&prime;4&Prime;N','37&deg; 57&prime;24&Prime;E'),(11,'Трасса-Торпедо','','Россия, Московская область, Люберцы, Октябрьский проспект, 202','','','',55.67633100,37.89945500,298,1473195096,1473195096,'70,258,298','55&deg; 40&prime;35&Prime;N','37&deg; 53&prime;58&Prime;E'),(12,'ВнуковоMX','vnukovomx.ru','Россия, Москва, посёлок Внуково','<p>Старейший в своей отрасли автомотоклуб &laquo;ВнуковоMX&raquo; под руководством его бессменного тренера и вдохновителя Александра Галлямова образовался в XII&mdash; XVI вв. н. э. и все это время только и делает, что занимается подготовкой спортсменов и авто-мото гонками!</p>\r\n<p>Главные задачи автомотоклуба Внуково МХ &ndash; это проведение спортивных соревнований, организация походов, путешествий и оздоровительных лагерей. Проведение различных массовых мероприятий по всей России и ближайшему зарубежью.</p>\r\n<p>На самом деле наш клуб был создан специально для истинных фанатов и любителей мотокросса, для тех, кто действительно желает научиться езде на кроссовом мотоцикле или поднять свой уже имеющийся уровень до невообразимых высот!</p>','info@vnukovomx.ru','+7 (495) 436-88-99',55.60123831,37.31243155,309,1473196044,1473196044,'70,278,309','55&deg; 36&prime;4&Prime;N','37&deg; 18&prime;45&Prime;E'),(13,'Трасса-Крылатское','','Россия, Москва, Крылатская улица, 8к1','','','',55.75877200,37.43411800,278,1473196540,1480884354,'70,278','55&deg; 45&prime;32&Prime;N','37&deg; 26&prime;3&Prime;E'),(14,'Трасса-Подольск','','Россия, Московская область, Подольск, микрорайон Силикатная-2','','','',55.47129987,37.55296417,310,1473197032,1473197032,'70,258,289,310','55&deg; 28&prime;17&Prime;N','37&deg; 33&prime;11&Prime;E'),(15,'X-Arena','x-arena.ru','Россия, Московская область, Пушкинский район, деревня Раково','','','+7 (985) 999-79-33',56.10488481,37.75581481,312,1473197992,1473197992,'70,258,311,312','56&deg; 6&prime;18&Prime;N','37&deg; 45&prime;21&Prime;E'),(16,'Трасса-Бурцево','www.xsr-moto.ru','Россия, Московская область, Химки','','xsr-moto@mail.ru','+7 (495) 721-18-04',55.95052425,37.38957822,316,1473199551,1473199776,'70,258,316','55&deg; 57&prime;2&Prime;N','37&deg; 23&prime;22&Prime;E'),(17,'Moscow Raceway','moscowraceway.ru','Россия, Московская область, Волоколамский район, деревня Шелудьково','<ul>\r\n<li>Общая площадь &nbsp;&nbsp; &nbsp;263 Га</li>\r\n<li>Площадь асфальтированного паддока &nbsp;&nbsp; &nbsp;30.000 м2</li>\r\n<li>Длина трассы &nbsp;&nbsp; &nbsp;4.070 м</li>\r\n<li>Ширина &nbsp;&nbsp; &nbsp;12 м &ndash; 21 м</li>\r\n<li>Ширина прямой &laquo;старт-финиш&raquo; &nbsp;&nbsp; &nbsp;15 м</li>\r\n<li>Повороты &nbsp;&nbsp; &nbsp;15</li>\r\n<li>Левые &nbsp;&nbsp; &nbsp;9</li>\r\n<li>Правые &nbsp;&nbsp; &nbsp;6</li>\r\n<li>Перепад высот &nbsp;&nbsp; &nbsp;22 м</li>\r\n<li>Максимальный подъем &nbsp;&nbsp; &nbsp;4,0%</li>\r\n<li>Максимальный спуск &nbsp;&nbsp; &nbsp;4,5%</li>\r\n<li>Конфигурации трассы &nbsp; &nbsp;&nbsp;</li>\r\n<li>Срезки &nbsp;&nbsp; &nbsp;5</li>\r\n<li>Варианты трассы &nbsp;&nbsp; &nbsp;17</li>\r\n</ul>\r\n<p>Скоростные характеристики</p>\r\n<ul>\r\n<li>Формула &ndash; 1</li>\r\n<ul>\r\n<li>Максимальная скорость &nbsp;&nbsp; &nbsp;311 км/ч</li>\r\n<li>Средняя скорость &nbsp;&nbsp; &nbsp;185 км/ч</li>\r\n<li>Время круга &nbsp;&nbsp; &nbsp;1:16.000</li>\r\n</ul>\r\n<li>ДТМ</li>\r\n<ul>\r\n<li>Максимальная скорость &nbsp;&nbsp; &nbsp;260 км/ч</li>\r\n<li>Средняя скорость &nbsp;&nbsp; &nbsp;147 км/ч</li>\r\n<li>Время круга &nbsp;&nbsp; &nbsp;1:35.500</li>\r\n</ul>\r\n</ul>','commerce@moscowraceway.com','+7 (495) 775-38-31',55.99364119,36.27137749,318,1473200515,1473200515,'70,258,317,318','55&deg; 59&prime;37&Prime;N','36&deg; 16&prime;17&Prime;E'),(18,'Нижегородское Кольцо','nring.ru','Россия, Нижегородская область, Богородский район, деревня Березовка','<p>Трасса длиной 3222 метра имеет семь разных конфигураций, в том числе полосу для дрег-рейсинга (805 м.), овал (617 м.), а также может делиться на тренировочную зону (1836 м.) и зону для картинга (1379 м.).</p>\r\n<p>Трехслойный асфальт уложен в соответствии с международными требованиями к трекам подобного уровня. Трасса построена в соответствии со стандартами Международной автомобильной федерации (FIA), которая позволит проводить все виды соревнований, в том числе международные, кроме Formula1. Спортсмены отзываются о треке как об интересной трассе, требующей от пилотов высокого мастерства.</p>\r\n<p>Кроме собственно спортивного трека и всего необходимого для гонок оборудования, построены паддок,крытые трибуны, позволяющие зрителям видеть все интересные участки трассы, а также парковка.</p>','info@nring.ru','+7 (831) 423-42-93; +7 (831) 429-00-77',56.12192787,43.59692945,320,1473201530,1473201530,'70,255,319,320','56&deg; 7&prime;19&Prime;N','43&deg; 35&prime;49&Prime;E'),(19,'Трасса-Валдай','','Россия, Новгородская область, Валдай','','','+7 (911) 606-57-01; +7 (921) 192-99-44',57.99957396,33.25897371,321,1473202074,1473202074,'70,254,321','57&deg; 59&prime;58&Prime;N','33&deg; 15&prime;32&Prime;E'),(20,'Приморское Кольцо','www.primring.ru','Россия, Приморский край, Артём','<p>Приморское кольцо</p>\r\n<ul>\r\n<li>Длина трассы: 3613 метров</li>\r\n<li>Ширина трассы: 12 метров, 15 метров (на старте/финише)</li>\r\n<li>Направление движения: против часовой стрелки</li>\r\n<li>Повороты: 14 (5 правых, 9 левых)</li>\r\n<li>Максимальная прямая: 534 метра (старт/финиш)</li>\r\n<li>площадь под паддок: 23.000 м2</li>\r\n</ul>\r\n<p>Pit Building</p>\r\n<ul>\r\n<li>30 боксов</li>\r\n<li>гостевая терраса над боксами (VIP)</li>\r\n<li>Здание администрации соревнований</li>\r\n<li>комната инструктажа гонщиков</li>\r\n<li>подиум победителя</li>\r\n<li>Ресторан на 200 персон</li>\r\n<li>Медиа-центр на 100 журналистов</li>\r\n<li>Медпункт</li>\r\n<li>Офис распорядителей</li>\r\n<li>Лестницы к пешеходному мосту на трибуны</li>\r\n</ul>\r\n<p>Главная трибуна, два крыла</p>\r\n<ul>\r\n<li>6400 зрителей, 3200 на каждом крыле</li>\r\n<li>Проход на верхний уровень, вход с пешеходного моста</li>\r\n<li>Первый этаж - комнаты отдыха, кафе, торговые павильоны</li>\r\n<li>Возможное расширение</li>\r\n</ul>\r\n<p>Места для зрителей</p>\r\n<ul>\r\n<li>Временные места для зрителей гонок на 20 000 человек</li>\r\n<li>Временные/постоянные места для зрителей спидвея на 10 000 человек</li>\r\n<li>Временные места для зрителей драга на 4 000 человек</li>\r\n<li>Естественные места около трассы, где только возможно</li>\r\n</ul>\r\n<p>Welcome-центр</p>\r\n<ul>\r\n<li>фан-центр, выставки, кассы</li>\r\n<li>картинг-клуб</li>\r\n<li>администрация</li>\r\n<li>мото-клуб, бистро для спортсменов и посетителей</li>\r\n</ul>','primring@sumotori.ru','+7 (423) 260‒01‒10',43.35567062,132.08317082,322,1473203272,1473203272,'70,247,322','43&deg; 21&prime;20&Prime;N','132&deg; 4&prime;59&Prime;E'),(21,'Crimea Grand Prix','crimeagp.ru','Россия, Республика Крым, Сакский район, село Суворовское','<p>Основная гоночная трасса: 4857 м.</p>\r\n<p>Боксы основной трассы с офисными помещениями:</p>\r\n<ul>\r\n<li>(2 этажа): 33 бокса, общей площадью 3007 м;</li>\r\n<li>VIP боксы: 9 шт. общей площадью 648 м;</li>\r\n<li>VIP лоджия: 18 шт. общей площадью 1820 м;</li>\r\n<li>Здания race контроля с президентской лоджией общей площадью 2040 м;</li>\r\n<li>Здание мед.центра: общая площадь 419 м;</li>\r\n<li>Здание хранения и обслуживания автомобилей картинга со смотровой площадкой: общая площадь 1600м?, высота 7м;</li>\r\n<li>Центральная трибуна на 5302 чел с 40 комментаторскими кабинами, барами и кафе;</li>\r\n<li>Дополнительные трибуны на 86 900 мест с возможностью расширения до 142 000 мест;</li>\r\n<li>Коммерческий центр для продажи автомототехники, запчастей, экипировки и тюнинга автомобилей и мотоциклов общей площадью 4100 м;</li>\r\n</ul>\r\n<p>Тоннель:</p>\r\n<ul>\r\n<li>автомобильный &ndash; протяженностью 73,5 м,</li>\r\n<li>пешеходный &ndash; 60м;</li>\r\n</ul>\r\n<p>Основная гоночная трасса</p>\r\n<ul>\r\n<li>Общая длина трека составляет 4857 м , в которую входят: 6 правых поворотов и 6 левых, расположенных по направлению движения часовой стрелки.</li>\r\n<li>Ширина трассы составляет 13 метров, а в зоне &laquo;старт-финиш&raquo; - 15 метров.</li>\r\n<li>Прямой скоростной участок - 900 м, который является самым длинным в Европе.</li>\r\n<li>Оси гоночного трека - от 15 метров над уровнем моря, самая высокая точка &ndash;33 метра над уровнем моря.</li>\r\n</ul>\r\n<p>Комбинации быстрых поворотов и прямых линий, связанных с подъемом и спуском в вертикальном расположении, допускает скоростные пределы более 300 км/час. План трека позволит зрителям видеть всю гонку и насладиться захватывающими событиями на протяжении всего соревнования. Трек &laquo;Crimea Grand Prix&raquo; соответствует всем требованиям FIM, предъявляемым к MotoGP, а также гонкам Formula 3; спортивные машины, GT (Гранд туризм). Трек строится с такими защитными устройствами, как стальные гардрейлы и подъездные дороги с обеих сторон трека, а также зоной схода, выполненной в виде комбинации гравия и асфальта.</p>\r\n<p>Различные соединения трека между его единичными сегментами, так называемые short-cuts (кратчайший путь), позволят проводить гоночные мероприятия на нескольких небольших площадях, а также использовать трек в различных вариациях. Трек &laquo;Crimea Grand Prix&raquo; с помощью шорт-катов может быть разделен на два независимых варианта трека, или три различных варианта конфигурации трассы. Short-cut 2 дает возможность добавить крюк к основному GP треку, таким образом, увеличивая трассу еще на 100 метров.</p>\r\n<p>Зона паддока расположена позади пит&ndash;здания. Во время проведения национальных и международных гоночных мероприятий грузовые автомобили будут использовать данную зону для разгрузки своего технического оборудования.</p>','kart@crimeagp.ru','+7 (978) 710-38-68',45.25671734,33.40151990,324,1473203989,1473203989,'70,236,323,324','45&deg; 15&prime;24&Prime;N','33&deg; 24&prime;5&Prime;E'),(22,'Казань-Ринг','kazanring.ru','Россия, Республика Татарстан, Казань','<p>Проект трека разработал известный архитектор гоночных трасс Герман Тильке. Вплоть до прошлого сезона года там проводились заезды любителей, дрифт-сессии и тест-драйвы. После реконструкции в 2010 году трасса получила новое название, &laquo;Казань-Ринг&raquo;, и приготовилась к проведению всероссийских и мировых чемпионатов. Трек \"Казань-Ринг\" находится на Казанской объездной дороге рядом с автодромом \"Высокая Гора\", на территории гостиничного комплекса \"Дубай\". К услугам гостей трассы &ndash; все удобства, начиная от гостевых домиков и ресторана до теннисного корта и других развлечений.</p>\r\n<ul>\r\n<li>Длина трассы: 3 450 м</li>\r\n<li>Самая длинная прямая: 832 м</li>\r\n<li>Перепад высот: 28-30 м</li>\r\n<li>Максимальная скорость: 230 км/ч</li>\r\n<li>Количество поворотов: 12</li>\r\n<li>Судейских постов: 15</li>\r\n<li>Расчетное время прохождения круга: 1 мин 14 сек</li>\r\n</ul>\r\n<p>На территории автодрома установлены боксы размером 7 х 18 м. Высота ворот со стороныпаддока &ndash; 4.2 м, со стороны питлейна &ndash; 2.8 м. Боксы не разделены перегородками.</p>','kznring@mail.ru','+7 (927) 44-66-676',55.86713641,49.25968317,325,1473205061,1473530237,'70,231,325','55&deg; 52&prime;2&Prime;N','49&deg; 15&prime;35&Prime;E'),(23,'Атрон','atrontrack.ru','Россия, Рязанская область, Рязанский район, Семеновское сельское поселение, деревня Секиотово','<p>Комплекс имеет тщательно продуманную&nbsp;и&nbsp;организованную инфраструктуру, расположенную на огромной территории в 20 гектар, что открывает неограниченные возможности для проведения не только автоспортивных соревнований, но и разнообразных развлекательных и бизнес-мероприятий, курсов экстремального вождения, шоу-программ и выставок, конференций и фестивалей, трек-дней и клубных встреч.</p>\r\n<p>На территории автокомплекса расположена гостиница и ресторан, боксы для спортивных команд и трибуны для зрителей.</p>\r\n<p>Комплекс оборудован по последнему слову техники: профессиональный хронометраж AMB, видеонаблюдение, специальные покрытия для грунтового и асфальтового треков, система безопасности отвечает всем требованиям FIA и РАФ.</p>\r\n<p>Благодаря инновационному световому оборудованию NLCO автокомплекс может успешно функционировать независимо от времени суток. Кроме того, значительно повышается комфорт вождения, так как спектр света светодиодов способствует концентрации внимания водителя, снижая зрительную нагрузку за счет отсутствия мерцания.</p>','info@atrontrack.ru','+7 (4912) 55-05-62',54.58881414,39.61630878,328,1473236179,1473236179,'70,227,326,327,328','54&deg; 35&prime;20&Prime;N','39&deg; 36&prime;59&Prime;E'),(24,'Смоленское кольцо','smolenskring.ru','Россия, Смоленская область, Дорогобужский район, посёлок городского типа Верхнеднепровский','<p>Гоночная трасса на автодроме &laquo;Смоленское кольцо&raquo; располагает всеми необходимыми элементами безопасности, которые позволяют проводить автомобильные кольцевые гонки на мировом уровне. Предусмотрены зоны безопасности, установлены заграждения из шин. Кроме того, возведены специальные ограждения там, где располагаются зрители автогонки. Для разделения зоны пит-лейна и старта-финиша используется бетонное ограждение с защитной сеткой.</p>\r\n<p>Двенадцать стационарных боксов выстроены в одну линию вдоль стартовой прямой гоночной трассы и предназначены для команд - участниц автогонок. Двухэтажные помещения имеют размеры 12 на 14 метров. На верхних этажах боксов предусмотрены комнаты для проживания технического персонала или гостей команд. Второй этаж оборудован гостевыми ложами, из которых открывается наилучший вид на стартовую прямую и гоночную трассу.</p>\r\n<ul>\r\n<li>Длина 3357м</li>\r\n<li>Ширина 12-15м</li>\r\n<li>Повороты/левые/правые 13/8/5</li>\r\n<li>Максимальная скорость (DTM) 241км/ч</li>\r\n<li>Допустимое число автомобилей на трассе:</li>\r\n<ul>\r\n<li>класс Формула/Спортпрототипы 30/32</li>\r\n<li>класс Туризм: до 2000 куб.см / до 1600 куб.см 35/38</li>\r\n</ul>\r\n</ul>','info@smolenskring.ru','+7 (985) 725-00-70',54.98758848,33.36691255,330,1473236460,1473236460,'70,220,329,330','54&deg; 59&prime;15&Prime;N','33&deg; 22&prime;1&Prime;E'),(25,'Трасса-Токкари-1','','Россия, Ленинградская область, Всеволожский район, Колтушское сельское поселение, деревня Токкари','','','',59.95024444,30.65020785,333,1473237795,1473237795,'70,261,331,332,333','59&deg; 57&prime;1&Prime;N','30&deg; 39&prime;1&Prime;E'),(26,'Трасса-Токкари-2','','Россия, Ленинградская область, Всеволожский район, Колтушское сельское поселение, деревня Токкари','','','',59.95685393,30.63104708,333,1473237919,1473237919,'70,261,331,332,333','59&deg; 57&prime;25&Prime;N','30&deg; 37&prime;52&Prime;E'),(27,'Трасса-Луга','','Россия, Ленинградская область, Луга','','','',58.74852964,29.87801344,334,1473238421,1473238421,'70,261,334','58&deg; 44&prime;55&Prime;N','29&deg; 52&prime;41&Prime;E'),(28,'Автодром СПб','autodromspb.ru','Россия, Санкт-Петербург, Пушкинский район, посёлок Шушары, Московское шоссе, 177А','<p>Шоссейно-кольцевая трасса&nbsp; &laquo;Автодром Санкт-Петербург&raquo; с высокотехнологичным асфальтовым покрытием, спроектирована в соответствии с требованиями FIA (международной федерации автоспорта) к трассам категории 2 и требованиям РАФ к шоссейно-кольцевым гоночным трассам категории 1.</p>\r\n<p>Основные характеристики</p>\r\n<ul>\r\n<li>Площадь автодрома, Га&nbsp;&nbsp; 26</li>\r\n<li>Паддок + парковка, кв.м.10000 + 10000</li>\r\n<li>Длина трассы, м</li>\r\n<ul>\r\n<li>configuration A 3019</li>\r\n<li>configuration B (short cut 1) 1820</li>\r\n<li>configuration C (short cut 2) 1260</li>\r\n</ul>\r\n<li>Направление движения по трассе против часовой стрелки</li>\r\n<li>Ширина трассы 12 м</li>\r\n<li>Ширина прямой старт - финиш 16 м</li>\r\n<li>Количество поворотов (левых+правых)</li>\r\n<ul>\r\n<li>configuration A 11 (7+4)</li>\r\n<li>configuration B (short cut 1) 7 (5+2)</li>\r\n<li>configuration C (short cut 2) 7 (4+3)</li>\r\n</ul>\r\n<li>Самый длинный прямой участок Т11 &ndash; Т1 900 м</li>\r\n<li>Максимальная скорость, км/ч - перед поворотом 1 (DTM) 260</li>\r\n<li>Продольный уклон трассы</li>\r\n<ul>\r\n<li>максимальный на подъеме 2,0%</li>\r\n<li>максимальный на спуске&nbsp; 2,0%</li>\r\n</ul>\r\n<li>Зоны безопасности (асфальтовые) 19500 кв.м.</li>\r\n</ul>','autodromspb@mail.ru','+7 (921) 570-09-50; +7 (911) 928-58-50',59.77910900,30.45442400,337,1473322947,1473322947,'70,225,336,337','59&deg; 46&prime;45&Prime;N','30&deg; 27&prime;16&Prime;E'),(29,'Мотор','cttmotor.edusite.ru','Россия, Санкт-Петербург, проспект Девятого Января, 15','','cttmotor@yandex.ru','+7 (812) 772-59-36',59.84615156,30.45066579,225,1473324027,1473324027,'70,225','59&deg; 50&prime;46&Prime;N','30&deg; 27&prime;2&Prime;E'),(30,'Трасса-Сиголово','','Россия, Ленинградская область, Тосненский район, Шапкинское сельское поселение, деревня Сиголово','','','',59.61732831,31.19064435,340,1473344323,1473435926,'70,261,338,339,340','59&deg; 37&prime;2&Prime;N','31&deg; 11&prime;26&Prime;E'),(31,'Трасса-Зорино','','Россия, Тверская область, Осташковский район, деревня Зорино','','','',57.16699943,33.20902640,342,1473344437,1473344437,'70,217,341,342','57&deg; 10&prime;1&Prime;N','33&deg; 12&prime;32&Prime;E'),(32,'АСК Вираж','ask-virazh.ru','Россия, Белгородская область, Белгородский район, село Беломестное, ул. Западная 11','<p>На территории АСК &laquo;Вираж&raquo; находится спортивная асфальтированная трасса категории А, протяженностью 1551 м. и шириной 10 м. По итогам 2013 года является лучшей скоростной трассой в России.</p>\r\n<p>Спортивный трек пригоден для спортивных соревнований, а также для любительских заездов, безопасен даже для новичков. Система телеметрии, которой оборудована трасса, позволяет контролировать свой результат. Создатели автодрома сделали все возможное, чтобы сделать эту трассу интересной как для зрителей, так и для гонщиков.</p>\r\n<p>Современная спортивная трасса обустроена в соответствии со всеми нормами безопасности, а также с требованиями FIA (международной федерации автоспорта) к трассам категории А. Трасса предназначена для обучения основам спортивного вождения автомобиля, мотоцикла и, конечно же, картинга. Асфальтовое покрытие было уложено в два слоя, благодаря чему оно отличается прочностью и в десятки раз увеличивает сцепление техники с треком.</p>','ask-virazh@mail.ru','+7 (4722) 770-888, +7-962-307-08-88',50.64974710,36.58912951,350,1478640177,1481064548,'70,284,349,350','50&deg; 38&prime;59&Prime;N','36&deg; 35&prime;21&Prime;E');
/*!40000 ALTER TABLE `moto_track` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `moto_track_locations`
--

DROP TABLE IF EXISTS `moto_track_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `moto_track_locations` (
  `mtt_id` int(10) unsigned NOT NULL,
  `l_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`l_id`,`mtt_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `moto_track_locations`
--

LOCK TABLES `moto_track_locations` WRITE;
/*!40000 ALTER TABLE `moto_track_locations` DISABLE KEYS */;
INSERT INTO `moto_track_locations` VALUES (1,70),(2,70),(3,70),(5,70),(6,70),(7,70),(8,70),(9,70),(10,70),(11,70),(12,70),(13,70),(14,70),(15,70),(16,70),(17,70),(18,70),(19,70),(20,70),(21,70),(22,70),(23,70),(24,70),(25,70),(26,70),(27,70),(28,70),(29,70),(30,70),(31,70),(32,70),(4,187),(31,217),(24,220),(28,225),(29,225),(23,227),(22,231),(21,236),(20,247),(19,254),(18,255),(1,258),(2,258),(5,258),(8,258),(9,258),(10,258),(11,258),(14,258),(15,258),(16,258),(17,258),(25,261),(26,261),(27,261),(30,261),(7,264),(3,278),(6,278),(12,278),(13,278),(32,284),(1,289),(14,289),(2,290),(2,291),(2,292),(3,293),(5,297),(11,298),(5,299),(7,300),(7,301),(8,302),(8,303),(9,304),(9,305),(9,306),(10,307),(12,309),(14,310),(15,311),(15,312),(16,316),(17,317),(17,318),(18,319),(18,320),(19,321),(20,322),(21,323),(21,324),(22,325),(23,326),(23,327),(23,328),(24,329),(24,330),(25,331),(26,331),(25,332),(26,332),(25,333),(26,333),(27,334),(3,335),(28,336),(28,337),(30,338),(30,339),(30,340),(31,341),(31,342),(32,349),(32,350),(4,354),(4,355);
/*!40000 ALTER TABLE `moto_track_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `motoshop`
--

DROP TABLE IF EXISTS `motoshop`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `motoshop` (
  `mts_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `mts_name` varchar(150) NOT NULL DEFAULT '',
  `mts_alias` varchar(255) NOT NULL,
  `mts_website` varchar(255) NOT NULL DEFAULT '',
  `mts_email` varchar(255) NOT NULL DEFAULT '',
  `mts_descrip` text,
  `mts_create_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `mts_update_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `mts_show` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `mts_u_id_add` int(11) unsigned NOT NULL,
  `mts_u_id_edit` int(11) unsigned NOT NULL,
  PRIMARY KEY (`mts_id`),
  KEY `mts_show` (`mts_show`),
  KEY `mts_name` (`mts_name`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `motoshop`
--

LOCK TABLES `motoshop` WRITE;
/*!40000 ALTER TABLE `motoshop` DISABLE KEYS */;
INSERT INTO `motoshop` VALUES (2,'MegaMoto','megamoto','megamoto.ru','moto@megamoto.ru','<p>Мегамото &ndash; один из самых популярных мотосалонов Москвы по продаже новой и б/у мототехники. Наш салон успешно работает с 2006 года. Мы специализируемся на продаже мототехники различных популярных марок - Ducati, Harley-Davidson, BigDog, Aprilia, Honda, Kawasaki, Yamaha, Suzuki, BMW которую у нас можно купить очень выгодно. Все мотоциклы полносильные и без пробега по России. Всегда в наличии новые скутера, экипировка, мотошлемы, масла, расходники, аккумуляторы и аксессуары, а также мотозапчасти и тюнинг. Вся мототехника прошла 100% таможенную очистку и предпродажную подготовку и имеют полный пакет документов для постановки на учет в ГИББД Р.Ф. Мотосалон б/у модели в Москве реализует с технической гарантией! Японский аукцион мотоциклов позволяет воплотить в реальность!</p>',1477768677,1477775884,1,0,0),(5,'MotoMir-V','motomir-v','www.motomir-v.ru','motomir1@akicompany.ru','<p>&laquo;МОТОМИР&raquo; является официальным дилером брендов Kawasaki, Arctic Cat, ABM. Осуществляет полный комплекс услуг, связанный с сервисным, гарантийным и послегарантийным обслуживанием квадроциклов Arctic Cat, ABM, Honda, Kymco, гидроциклов Kawasaki, квадроциклов и скутеров Stels, мотоциклов Kawasaki, Patron, Kymco.</p>\r\n<p>В салонах &laquo;МОТОМИР&raquo; представлен широкий модельный ряд аксессуаров, экипировки и запчастей.</p>\r\n<p>В каждом магазине-салоне постоянно действуют спецпредложения, с помощью которых у Вас есть прекрасная возможность купить модели представленных мировых брендов по выгодной цене.</p>',1477770228,1481158014,1,0,1),(6,'Mr.Moto','mrmoto','mr-moto.ru','mrmoto@mail.ru','<p>Компания Mr.Moto основана в 1998 году мотоциклистами для мотоциклистов. В мотосалоне предоставлен большой выбор мотоциклов с крупнейших японских и американских аукционов. Покупая у нас мотоцикл, Вы получаете двухнедельную гарантию без ограничения пробега, а также возможность обслуживать мотоцикл в нашем сервисе, с широкой программой скидок. В отделе запчастей и аксессуаров консультанты помогут вам подобрать необходимые запчасти, у вас не возникнет необходимости заказывать расходные материалы.</p>',1477771778,1478121383,1,0,0),(7,'ProRacing','proracing','proracing.su','service@proracing.su','<p>Мотосервис &laquo;PRORACING&raquo; - это сеть профессиональных тех-центров в Москве по обслуживанию и ремонту мотоциклов и мототехники. Наша специализация &ndash; ремонт, техническое обслуживание и покраска мотоциклов, квадроциклов, мотовездеходов, ATV и UTV, снегоходов и макси скутеров.</p>\r\n<p>Наши мото сервисы проводят все виды работ по ремонту мототехники и располагают для этого всем необходимым оборудованием: профессиональный инструмент, подъемники, компьютерный диагностический комплекс, покрасочные камеры, парк специализированных мотоэвакуаторов.</p>',1477905936,1477905936,1,0,0),(8,'Мото31','moto31','moto31.ru','sale@moto31.ru','<p>Мотомагазин &laquo;Мото31&raquo; предлагает купить в Белгороде мото-шлемы, экипировку, мотозапчасти, тюнинг на мотоцикл. В интернет-магазине &laquo;Мото31&raquo; широко представлены мотоциклы б.у. из Японии, в том числе марок: Honda, Yamaha, Kawasaki, Suzuki. Все мотоциклы, поступившие в Белгород, прошли предпродажную подготовку и готовы к эксплуатации в Белгороде и Белгородской области.</p>\r\n<p>Наш мото-салон готов предложить в Белгороде и различные виды мото-товаров. И начинающий мотоциклист и уже состоявшиеся байкеры Белгорода найдут для себя любые мотозапчасти и аксессуары на мотоцикл. Если Вы любите мотокросс и свой внедорожный мотоцикл, тоже останетесь довольны нашим ассортиментом тюнинга в Белгороде.</p>\r\n<p>В мотомагазине &laquo;Мото31&raquo; в Белгороде Вы можете купить такие товары как: мото-масла, масло в вилку, мотошины, мото-наклейки, мото-ручки, мото-сальники вилки, аккумуляторы, свечи, фильтры, смазка цепи, оригинальные запчасти для мотоциклов Honda, Suzuki, Kawasaki, Yamaha, грузики руля, зеркала, подножки. Если Вам понравилась предлагаемая нами моторезина, позвоните в наш мотомагазин в Белгороде.</p>',1478639124,1481146758,1,0,1),(9,'BikeMoto','bikemoto','bikemoto.ru','info@bikemoto.ru','<p>Сотрудники мотосалона &laquo;Байкмото&raquo; &mdash; бывшие спортсмены и просто увлеченные мотоциклами люди, в повседневной жизни эксплуатирующие мототехнику. Поэтому в &laquo;Байкмото&raquo; очень хорошо понимают нужды и потребности единомышленников-мотоциклистов.</p>\r\n<p>Мотосервис &laquo;БайкМото&raquo; предоставляет полный спектр услуг по ремонту и обслуживанию мототехники:</p>\r\n<ul>\r\n<li>хранение мотоциклов</li>\r\n<li>диагностика</li>\r\n<li>техническое обслуживание</li>\r\n<li>локальный ремонт</li>\r\n<li>предпродажная подготовка</li>\r\n<li>покраска и аэрография</li>\r\n<li>тюнинг мотоциклов</li>\r\n<li>сборка мотоциклов по индивидуальному заказу (кастомайзинг)</li>\r\n<li>и многое другое&hellip;</li>\r\n</ul>',1479243081,1479579966,1,1,1),(11,'Grancom','grancom','grancom.by','sale@grancom.by','<p>Наша миссия - лидерство на рынке продаж японкой мототехники, профессиональное представление интересов инвесторов и удовлетворение всех участников проектов от заказчиков до конечных пользователей.</p>\r\n<p>Основными направлениями деятельности компании являются:</p>\r\n<ul>\r\n<li>оптовая и розничная торговля мототехникой и запасными частями ведущих мировых производителей;</li>\r\n<li>оказание услуг и выполнение ремонтных работ японской мототехники (консультирование, диагностика, ремонт, консервация, тюнинг);</li>\r\n<li>оптовая и розничная торговля спортивной одеждой и обувью для волейбола, чирлидинга и спортивных танцев ведущих мировых производителей;</li>\r\n</ul>\r\n<p>Мы предлагаем:</p>\r\n<ul>\r\n<li>Мототехнику</li>\r\n<li>Квадроциклы</li>\r\n<li>Мотоаксессуары</li>\r\n<li>Мотоэкипировку</li>\r\n<li>Запасные части</li>\r\n<li>А так же товары для спорта и активного отдыха.</li>\r\n</ul>',1479408202,1479408202,1,1,1),(13,'SagaMoto','sagamoto','sagamoto.by','sagamoto@tut.by','',1479408532,1479408532,1,1,1),(14,'Grancom','grancom','grancom.by','sale@grancom.by','',1479408681,1481584792,1,1,1);
/*!40000 ALTER TABLE `motoshop` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `motoshop_address`
--

DROP TABLE IF EXISTS `motoshop_address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `motoshop_address` (
  `mts_address_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `mts_id` int(10) unsigned NOT NULL,
  `mts_address_website` varchar(255) NOT NULL DEFAULT '',
  `mts_address_email` varchar(255) NOT NULL DEFAULT '',
  `mts_address_phones` varchar(255) NOT NULL DEFAULT '',
  `mts_address` varchar(255) NOT NULL DEFAULT '',
  `mts_address_latitude` decimal(10,8) DEFAULT NULL,
  `mts_address_longitude` decimal(11,8) DEFAULT NULL,
  `mts_address_gps_lat` varchar(45) NOT NULL DEFAULT '',
  `mts_address_gps_lng` varchar(45) NOT NULL DEFAULT '',
  `mts_address_location_id` int(10) unsigned NOT NULL,
  `mts_address_location_pids` varchar(100) NOT NULL DEFAULT '',
  `mts_address_create_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `mts_address_update_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `mts_address_show` tinyint(1) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`mts_address_id`),
  KEY `mts_id` (`mts_id`,`mts_address_show`,`mts_address_location_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `motoshop_address`
--

LOCK TABLES `motoshop_address` WRITE;
/*!40000 ALTER TABLE `motoshop_address` DISABLE KEYS */;
INSERT INTO `motoshop_address` VALUES (2,2,'megamoto.ru','moto@megamoto.ru','+7 (495) 506-507-1','Россия, Москва, 5-я Кабельная улица, 2с1',55.73791169,37.71646322,'55&deg; 44&prime;16&Prime;N','37&deg; 42&prime;59&Prime;E',278,'70,278',1477768777,1477768777,1),(5,5,'www.motomir-v.ru','motomir1@akicompany.ru','+7 (473) 247-25-27,  +7 (473) 229-25-26, +7 (473) 229-35-27','Россия, Воронеж, улица Машиностроителей, 8',51.68200000,39.16810000,'51&deg; 40&prime;55&Prime;N','39&deg; 10&prime;5&Prime;E',348,'70,348',1477770299,1478034686,1),(6,6,'mr-moto.ru','mrmoto@mail.ru','8 (499) 181-20-28, 8 (499) 181-42-55, 8 (499) 181-29-11','Россия, Москва, улица Сергея Эйзенштейна, 1',55.82975500,37.64618400,'55&deg; 49&prime;47&Prime;N','37&deg; 38&prime;46&Prime;E',278,'70,278',1477772241,1477905763,1),(7,6,'mr-moto.ru','mrmoto@mail.ru','8 (903) 215-28-63','Россия, Москва, Неманский проезд, 4к2',55.81406700,37.39246400,'55&deg; 48&prime;51&Prime;N','37&deg; 23&prime;33&Prime;E',278,'70,278',1477772312,1478121256,1),(8,6,'mr-moto.ru','mrmoto@mail.ru','8 (909) 988-18-25, 8 (906) 778-03-26','Россия, Москва, улица Нижние Мнёвники, 110',55.76522500,37.47200000,'55&deg; 45&prime;55&Prime;N','37&deg; 28&prime;19&Prime;E',278,'70,278',1477772361,1477772361,1),(9,6,'mr-moto.ru','mrmoto@mail.ru','8 (499) 245-45-93, 8 (905) 598-31-56','Россия, Москва, Фрунзенская набережная, 16к1',55.73017700,37.59244600,'55&deg; 43&prime;49&Prime;N','37&deg; 35&prime;33&Prime;E',278,'70,278',1477772402,1477772402,1),(10,6,'mr-moto.ru','mrmoto@mail.ru','8 (964) 771-87-21','Россия, Москва, Каширское шоссе, 61к3А',55.61727100,37.71568600,'55&deg; 37&prime;2&Prime;N','37&deg; 42&prime;56&Prime;E',278,'70,278',1477772448,1477772448,1),(11,6,'mr-moto.ru','mrmoto@mail.ru','8-964-771-94-33, 8-964-636-86-71','Россия, Москва, Сколковское шоссе, 31Б',55.70613992,37.40351468,'55&deg; 42&prime;22&Prime;N','37&deg; 24&prime;13&Prime;E',278,'70,278',1477772555,1477772555,1),(12,6,'mr-moto.ru','mrmoto@mail.ru','8 (964) 771-87-54','Россия, Москва, 5-я Кабельная улица, 2с1',55.73772500,37.71682700,'55&deg; 44&prime;16&Prime;N','37&deg; 43&prime;1&Prime;E',278,'70,278',1477772607,1477772607,1),(13,7,'proracing.su','service@proracing.su','+7 (495) 401-7761','Россия, Москва, Самокатная улица, 4с13',55.75662900,37.67565700,'55&deg; 45&prime;24&Prime;N','37&deg; 40&prime;32&Prime;E',278,'70,278',1477905996,1477908343,1),(14,7,'proracing.su','service@proracing.su','+7 (495) 401-7761','Россия, Москва, Тюменский проезд, 5с2',55.80967600,37.74097400,'55&deg; 48&prime;35&Prime;N','37&deg; 44&prime;28&Prime;E',278,'70,278',1477906118,1477906168,1),(15,8,'moto31.ru','sale@moto31.ru','+7 (920) 580-77-77','Россия, Белгородская область, Белгородский район, село Беломестное, ул. Западная 11',50.64866265,36.59094169,'50&deg; 38&prime;55&Prime;N','36&deg; 35&prime;27&Prime;E',350,'70,284,349,350',1478639887,1478639887,1),(16,9,'bikemoto.ru','info@bikemoto.ru','+7 (495) 649 98 85, +7 (926) 006 49 02','Россия, Москва, Скотопрогонная улица, 35с7',55.72812900,37.69662400,'55&deg; 43&prime;41&Prime;N','37&deg; 41&prime;48&Prime;E',278,'70,278',1479243140,1479580195,1),(18,11,'grancom.by','sale@grancom.by','+375 (29) 162 93 33, +375 (29) 767 35 55','Беларусь, Минск, улица Платонова, 34',53.91216000,27.59917400,'53&deg; 54&prime;44&Prime;N','27&deg; 35&prime;57&Prime;E',347,'187,347',1479408227,1479408227,0),(20,13,'sagamoto.by','sagamoto@tut.by','+375 29 776 17 33','Беларусь, Минск, улица Тимирязева, 114к8',53.93420200,27.46065400,'53&deg; 56&prime;3&Prime;N','27&deg; 27&prime;38&Prime;E',347,'187,347',1479408567,1479409001,1),(21,14,'grancom.by','sale@grancom.by','+375 (29) 162 93 33, +375 (29) 767 35 55','Беларусь, Минск, улица Платонова, 34',53.91216000,27.59917400,'53&deg; 54&prime;44&Prime;N','27&deg; 35&prime;57&Prime;E',347,'187,347',1479408702,1481480576,1);
/*!40000 ALTER TABLE `motoshop_address` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `motoshop_address_locations`
--

DROP TABLE IF EXISTS `motoshop_address_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `motoshop_address_locations` (
  `mts_address_id` int(10) unsigned NOT NULL,
  `l_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`mts_address_id`,`l_id`),
  KEY `lid` (`l_id`,`mts_address_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `motoshop_address_locations`
--

LOCK TABLES `motoshop_address_locations` WRITE;
/*!40000 ALTER TABLE `motoshop_address_locations` DISABLE KEYS */;
INSERT INTO `motoshop_address_locations` VALUES (2,70),(2,278),(5,70),(5,348),(6,70),(6,278),(7,70),(7,278),(8,70),(8,278),(9,70),(9,278),(10,70),(10,278),(11,70),(11,278),(12,70),(12,278),(13,70),(13,278),(14,70),(14,278),(15,70),(15,284),(15,349),(15,350),(16,70),(16,278),(18,187),(18,347),(20,187),(20,347),(21,187),(21,347);
/*!40000 ALTER TABLE `motoshop_address_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `news_image`
--

DROP TABLE IF EXISTS `news_image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `news_image` (
  `ni_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `n_id` int(10) unsigned NOT NULL,
  `ni_create_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `ni_update_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `ni_latitude` decimal(10,8) DEFAULT NULL,
  `ni_longitude` decimal(11,8) DEFAULT NULL,
  `ni_dir` varchar(255) DEFAULT NULL,
  `ni_pos` smallint(5) unsigned NOT NULL DEFAULT '0',
  `ni_name` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`ni_id`),
  KEY `nid_pos` (`n_id`,`ni_pos`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `news_image`
--

LOCK TABLES `news_image` WRITE;
/*!40000 ALTER TABLE `news_image` DISABLE KEYS */;
INSERT INTO `news_image` VALUES (1,1,1476131423,1476131425,NULL,NULL,'/news/0/1/1/6512bd43d9caa6e02c990b0a82652dca',0,'motogp.jpg'),(2,4,1477422260,1477422261,NULL,NULL,'/news/0/4/2/a1d0c6e83f027327d8461063f4ac58a6',2,'_gp_2126.gallery_full_top_fullscreen.jpg'),(5,4,1481475939,1481475939,NULL,NULL,'/news/0/4/5/6c8349cc7260ae62e3b1396831a8398f',1,'me.jpg'),(6,4,1481476208,1481476209,NULL,NULL,'/news/0/4/6/d9d4f495e875a2e075a1a4a6e1b9770f',0,'vertical.jpg');
/*!40000 ALTER TABLE `news_image` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `news_list`
--

DROP TABLE IF EXISTS `news_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `news_list` (
  `n_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `n_create_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `n_update_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `n_show_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `n_title` varchar(255) NOT NULL,
  `n_alias` varchar(255) NOT NULL,
  `n_notice` text NOT NULL,
  `n_text` text NOT NULL,
  `u_id` int(11) unsigned NOT NULL,
  `n_img_cnt` tinyint(3) NOT NULL DEFAULT '0',
  `n_show` tinyint(1) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`n_id`),
  KEY `showts` (`n_show`,`n_show_ts`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `news_list`
--

LOCK TABLES `news_list` WRITE;
/*!40000 ALTER TABLE `news_list` DISABLE KEYS */;
INSERT INTO `news_list` VALUES (1,1476125613,1480702442,1476048587,'eTextTinymce','etexttinymce','eTextTinymce','<p>eTextTinymce<iframe src=\"https://rutube.ru/play/embed/8577873\" class=\"iframeVideoEmbed\" frameborder=\"0\" allowfullscreen=\"allowfullscreen\" webkitallowfullscreen=\"webkitallowfullscreen\" mozallowfullscreen=\"mozallowfullscreen\" scrolling=\"no\" data-link=\"\"></iframe></p>\r\n<ul class=\"images\">\r\n<li><img class=\"image\" src=\"/news/0/1/1/6512bd43d9caa6e02c990b0a82652dca/512_384.jpg\" data-img-id=\"1\"></li>\r\n</ul>\r\n<p><iframe src=\"https://rutube.ru/play/embed/8577873\" class=\"iframeVideoEmbed\" frameborder=\"0\" allowfullscreen=\"allowfullscreen\" webkitallowfullscreen=\"webkitallowfullscreen\" mozallowfullscreen=\"mozallowfullscreen\" scrolling=\"no\" data-link=\"https://rutube.ru/video/aa12ee0f46f4bc1bdc88b4ec3a289c09/\"></iframe></p>',1,1,1),(2,1476133593,1476221378,1476133200,'sdfsfd','sdfsfd','sdf','<p>sdf</p>',1,0,1),(3,1476133867,1476221876,1475962161,'xvbhnbn','xvbhnbn','cvbcvbcvb','<p>cvbcvbcvb</p>',1,0,1),(4,1476218080,1481985383,1476221246,'sdfsdf 3','sdfsdf-3','l;sdf,msd,f','<p>sdfsdf<iframe src=\"https://rutube.ru/play/embed/8577873\" class=\"iframeVideoEmbed\" frameborder=\"0\" allowfullscreen=\"allowfullscreen\" webkitallowfullscreen=\"webkitallowfullscreen\" mozallowfullscreen=\"mozallowfullscreen\" scrolling=\"no\" data-link=\"https://rutube.ru/video/aa12ee0f46f4bc1bdc88b4ec3a289c09/\"></iframe></p>',1,3,1),(5,1481985802,1481988375,1481985782,'новость с емейл','novost-s-emeyl','новость с емейл','<p>новость с емейл</p>',1,0,1);
/*!40000 ALTER TABLE `news_list` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_change_request`
--

DROP TABLE IF EXISTS `user_change_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_change_request` (
  `u_id` int(11) unsigned NOT NULL,
  `u_req_type` varchar(100) NOT NULL,
  `u_req_key` varchar(255) NOT NULL,
  `u_req_end_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `u_req_data` varchar(255) NOT NULL,
  PRIMARY KEY (`u_id`,`u_req_type`),
  KEY `end_ts` (`u_req_end_ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_change_request`
--

LOCK TABLES `user_change_request` WRITE;
/*!40000 ALTER TABLE `user_change_request` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_change_request` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `u_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `u_mail` varchar(255) NOT NULL,
  `u_salt` varchar(29) NOT NULL,
  `u_pass` varchar(60) NOT NULL,
  `u_date_reg` int(10) unsigned NOT NULL DEFAULT '0',
  `u_date_visit` int(10) unsigned NOT NULL DEFAULT '0',
  `u_login` varchar(20) NOT NULL,
  `u_reg` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `ug_ids` varchar(45) NOT NULL,
  PRIMARY KEY (`u_id`),
  UNIQUE KEY `mail` (`u_mail`),
  KEY `login` (`u_login`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'roalexey@yandex.ru','$2a$12$NEx59eykcG03xtnYWl1uhO','$2a$12$NEx59eykcG03xtnYWl1uhOH93DYoU.bkctUsu.9lJdcqq.B2zS.pO',1447968485,1482315902,'MotoCommunity',1,'1'),(12,'roalexey@mail.ru','$2a$12$kZC3laKG9y9dU7Xh2kVJA.','$2a$12$kZC3laKG9y9dU7Xh2kVJA.2.I7Fb5Drdk6yLwdUJFII/U1uAr5MFC',1480860847,1482272648,'RoLex',1,'3');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_data`
--

DROP TABLE IF EXISTS `users_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users_data` (
  `u_id` int(11) unsigned NOT NULL,
  `u_name` varchar(128) NOT NULL,
  `u_surname` varchar(128) NOT NULL,
  `u_sex` tinyint(1) unsigned NOT NULL DEFAULT '2',
  `u_birthday` int(10) unsigned NOT NULL DEFAULT '0',
  `u_location_id` int(10) unsigned NOT NULL DEFAULT '0',
  `u_latitude` decimal(10,8) DEFAULT NULL,
  `u_longitude` decimal(11,8) DEFAULT NULL,
  PRIMARY KEY (`u_id`),
  KEY `u_nsn` (`u_name`,`u_surname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_data`
--

LOCK TABLES `users_data` WRITE;
/*!40000 ALTER TABLE `users_data` DISABLE KEYS */;
INSERT INTO `users_data` VALUES (1,'Алексей','Романов',1,359409600,357,54.53289490,36.25665364),(12,'RoLex','RoLex',1,1480798800,353,55.67162424,37.66540588);
/*!40000 ALTER TABLE `users_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_groups`
--

DROP TABLE IF EXISTS `users_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users_groups` (
  `ug_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `ug_pid` smallint(5) unsigned NOT NULL DEFAULT '0',
  `ug_path` varchar(100) NOT NULL,
  `ug_name` varchar(255) NOT NULL,
  `ug_desc` text NOT NULL,
  `ug_level` tinyint(3) unsigned NOT NULL,
  `ug_lk` smallint(5) unsigned NOT NULL,
  `ug_rk` smallint(5) unsigned NOT NULL,
  `ug_on_register` tinyint(1) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`ug_id`),
  UNIQUE KEY `ug_name` (`ug_name`),
  UNIQUE KEY `ug_path` (`ug_path`),
  KEY `lrk_level` (`ug_lk`,`ug_rk`,`ug_level`),
  KEY `on_register` (`ug_on_register`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_groups`
--

LOCK TABLES `users_groups` WRITE;
/*!40000 ALTER TABLE `users_groups` DISABLE KEYS */;
INSERT INTO `users_groups` VALUES (1,0,'root','Супер администратор','Супер администратор',1,1,8,0),(2,1,'admin','Администратор','Администратор',2,2,7,0),(3,2,'user','Пользователь','Пользователь',3,3,6,1),(4,3,'guest','Гость','Гость',4,4,5,0);
/*!40000 ALTER TABLE `users_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_groups_rights`
--

DROP TABLE IF EXISTS `users_groups_rights`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users_groups_rights` (
  `ug_id` smallint(5) unsigned NOT NULL,
  `m_id` smallint(5) unsigned NOT NULL,
  `c_id` smallint(5) unsigned NOT NULL,
  `cm_id` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`ug_id`,`m_id`,`c_id`,`cm_id`),
  KEY `mccmug` (`m_id`,`c_id`,`cm_id`,`ug_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_groups_rights`
--

LOCK TABLES `users_groups_rights` WRITE;
/*!40000 ALTER TABLE `users_groups_rights` DISABLE KEYS */;
INSERT INTO `users_groups_rights` VALUES (1,1,9,34),(1,2,6,42),(1,2,6,43),(1,2,6,44),(1,2,6,45),(1,2,6,46),(1,2,6,47),(1,3,13,21),(1,5,8,35),(1,5,8,36),(1,5,8,37),(1,5,8,38),(1,5,8,39),(1,5,8,40),(1,5,8,41),(1,7,10,28),(1,7,10,29),(1,7,10,30),(1,7,10,31),(1,7,10,32),(1,7,10,33),(1,8,11,22),(1,8,11,23),(1,8,11,24),(1,8,11,25),(1,8,11,26),(1,8,11,27),(1,10,20,19),(1,10,20,20),(1,10,20,50),(1,11,21,9),(1,12,1,1),(1,12,1,2),(1,12,1,5),(1,12,1,6),(1,12,1,7),(1,12,1,8),(1,13,5,12),(1,13,5,13),(1,13,5,14),(1,14,4,15),(1,14,4,16),(1,14,4,17),(1,15,22,10),(1,15,22,11),(1,15,22,48),(1,16,23,51),(1,16,23,52),(1,16,23,53),(1,16,23,54),(1,16,23,55),(1,17,24,56),(1,17,24,57),(1,17,24,58),(1,18,25,59),(1,18,25,60),(1,18,25,61),(2,1,9,34),(2,2,6,42),(2,2,6,43),(2,2,6,44),(2,2,6,45),(2,2,6,46),(2,2,6,47),(2,3,13,21),(2,5,8,35),(2,5,8,36),(2,5,8,37),(2,5,8,38),(2,5,8,39),(2,5,8,40),(2,5,8,41),(2,7,10,28),(2,7,10,29),(2,7,10,30),(2,7,10,31),(2,7,10,32),(2,7,10,33),(2,8,11,22),(2,8,11,23),(2,8,11,24),(2,8,11,25),(2,8,11,26),(2,8,11,27),(2,10,20,19),(2,10,20,20),(2,10,20,50),(2,11,21,9),(2,12,1,1),(2,12,1,2),(2,12,1,5),(2,12,1,6),(2,12,1,7),(2,12,1,8),(2,13,5,12),(2,13,5,13),(2,13,5,14),(2,14,4,15),(2,14,4,16),(2,14,4,17),(2,15,22,10),(2,15,22,11),(2,15,22,48),(2,16,23,51),(2,16,23,52),(2,16,23,53),(2,16,23,54),(2,16,23,55),(2,17,24,56),(2,17,24,57),(2,17,24,58),(2,18,25,59),(2,18,25,60),(2,18,25,61),(3,1,9,34),(3,2,6,42),(3,3,13,21),(3,5,8,35),(3,5,8,40),(3,7,10,28),(3,7,10,33),(3,8,11,22),(3,8,11,27),(3,11,21,9),(3,16,23,51),(3,16,23,52),(3,16,23,53),(3,16,23,54),(3,16,23,55),(3,17,24,56),(3,17,24,57),(3,17,24,58),(3,18,25,59),(3,18,25,60),(3,18,25,61),(4,1,9,34),(4,2,6,42),(4,5,8,35),(4,5,8,40),(4,7,10,28),(4,7,10,33),(4,8,11,22),(4,8,11,27),(4,11,21,9);
/*!40000 ALTER TABLE `users_groups_rights` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_in_groups`
--

DROP TABLE IF EXISTS `users_in_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users_in_groups` (
  `u_id` int(11) unsigned NOT NULL,
  `ug_id` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`u_id`,`ug_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_in_groups`
--

LOCK TABLES `users_in_groups` WRITE;
/*!40000 ALTER TABLE `users_in_groups` DISABLE KEYS */;
INSERT INTO `users_in_groups` VALUES (1,1),(12,3);
/*!40000 ALTER TABLE `users_in_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video`
--

DROP TABLE IF EXISTS `video`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `video` (
  `v_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `va_id` int(10) unsigned NOT NULL,
  `u_id` int(11) unsigned NOT NULL,
  `v_create_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `v_update_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `v_pos` smallint(5) unsigned NOT NULL DEFAULT '0',
  `v_name` varchar(255) NOT NULL,
  `v_text` varchar(255) NOT NULL,
  `v_img` varchar(225) NOT NULL,
  PRIMARY KEY (`v_id`),
  KEY `vaid_uid_pos` (`va_id`,`u_id`,`v_pos`,`v_update_ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video`
--

LOCK TABLES `video` WRITE;
/*!40000 ALTER TABLE `video` DISABLE KEYS */;
/*!40000 ALTER TABLE `video` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video_albums`
--

DROP TABLE IF EXISTS `video_albums`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `video_albums` (
  `va_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `u_id` int(11) unsigned NOT NULL,
  `va_name` varchar(100) NOT NULL,
  `va_alias` varchar(100) NOT NULL,
  `va_text` varchar(255) NOT NULL,
  `va_cnt` smallint(5) unsigned NOT NULL DEFAULT '0',
  `va_create_ts` int(10) unsigned NOT NULL DEFAULT '0',
  `va_update_ts` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`va_id`),
  UNIQUE KEY `uid` (`u_id`,`va_name`),
  KEY `uid_ts` (`u_id`,`va_update_ts`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video_albums`
--

LOCK TABLES `video_albums` WRITE;
/*!40000 ALTER TABLE `video_albums` DISABLE KEYS */;
INSERT INTO `video_albums` VALUES (1,1,'MotoGP 2016','motogp-2016','MotoGP 2016',0,1482271546,1482271546);
/*!40000 ALTER TABLE `video_albums` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'mcjs'
--

--
-- Dumping routines for database 'mcjs'
--
/*!50003 DROP PROCEDURE IF EXISTS `album_image_delete` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `album_image_delete`(IN inUid INT(11), IN inAid INT, IN inAiId INT, OUT res INT)
BEGIN
	
    DECLARE done,aipos, ai_last, ai_cnt, ts INT DEFAULT 0;
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
    DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
    
    START TRANSACTION;
    
    SET res=0;
    SET done=0;
    
    SELECT ai_pos INTO aipos 
    FROM `album_image`
    WHERE ai_id = inAiId;
    
    #SELECT done, aipos;
    
    IF done = 0 THEN
		
        SET ts = UNIX_TIMESTAMP();
        
		DELETE FROM `album_image`
		WHERE ai_id = inAiId AND a_id = inAid AND u_id = inUid;
        
        CALL album_image_reorder(inUid, inAid);
        
        /*
		UPDATE `album_image`
		SET ai_pos = IF(ai_pos-1 <= 0, 0, ai_pos-1)
		WHERE a_id = inAid AND u_id = inUid
		AND ai_pos > aipos;
        */
		
        SELECT COUNT(ai_id) AS cnt INTO ai_cnt
        FROM `album_image`
		WHERE a_id = inAid AND u_id = inUid;
        
		UPDATE `album` SET 
        a_img_cnt = ai_cnt, 
        a_update_ts = ts
		WHERE a_id = inAid AND u_id = inUid;
        
		SET res=1;
    
		COMMIT;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `album_image_reorder` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `album_image_reorder`(IN inUid INT(11), IN inAid INT)
BEGIN
	
	DECLARE done, res, pos, aiId INT DEFAULT 0;
    
    /*Объявление курсора*/
	DECLARE getImageIds CURSOR FOR 
    SELECT ai_id
    FROM `album_image` 
    WHERE a_id = inAid AND u_id = inUid
    ORDER BY ai_pos, ai_update_ts DESC, ai_id DESC;
    
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
    DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
    
    SET done=0;
    SET pos=0;
    
    START TRANSACTION;
		/* открытие курсора */
		OPEN getImageIds;
		/*извлекаем данные */
		REPEAT
        FETCH getImageIds INTO aiId;
			#делаем нужные нам действия 
			IF NOT done THEN     
			  UPDATE `album_image` SET 
			  ai_pos = pos
			  WHERE ai_id = aiId;
			  
			  SET pos = pos + 1;
			END IF;
		UNTIL done END REPEAT;
		
		/*закрытие курсора */
		CLOSE getImageIds;
        
        SET done = 0;
        
        SELECT ai_pos INTO pos
        FROM `album_image`
        WHERE a_id = inAid AND u_id = inUid
		ORDER BY ai_pos, ai_update_ts DESC, ai_id DESC
        LIMIT 1;
        
        IF NOT done AND pos = 1 THEN
			UPDATE `album_image` SET 
			ai_pos = ai_pos-1
			WHERE a_id = inAid AND u_id = inUid;
        END IF;
        
    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `album_image_update` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `album_image_update`(IN inUid INT(11), IN inAid INT, IN inAiId INT, IN inAiLatitude DECIMAL(10,8), IN inAiLongitude DECIMAL(11,8), IN inAiText VARCHAR(255), IN inAiDir  VARCHAR(255), IN inAiName VARCHAR(255), IN inAiProfile TINYINT(1), IN inPosUpd TINYINT(1))
BEGIN
	
	DECLARE done, res, ai_cnt, ts INT DEFAULT 0;
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
    DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
    SET done=0;
    
    START TRANSACTION;
    
		SET ts = UNIX_TIMESTAMP();
        
		UPDATE `album_image` SET
			ai_pos = IF(inPosUpd = 1, 0, ai_pos),
			ai_update_ts = ts,
			ai_latitude = inAiLatitude,
			ai_longitude = inAiLongitude,
			ai_text = inAiText,
			ai_dir = IF(inAiDir != "", inAiDir, ai_dir),
			ai_name = inAiName,
            ai_profile= inAiProfile
		WHERE ai_id = inAiId AND a_id = inAid AND u_id = inUid;
        
        IF inAiProfile = 1 THEN
			UPDATE `album_image` SET
				ai_profile= 0
			WHERE ai_id != inAiId AND a_id = inAid AND u_id = inUid;
        END IF;
        
        IF inPosUpd = 1 AND done = 0 THEN
			
            SELECT COUNT(ai_id) AS cnt INTO ai_cnt
			FROM `album_image`
			WHERE a_id = inAid AND u_id = inUid;
			
			UPDATE `album` SET 
			a_img_cnt = ai_cnt, 
			a_update_ts = ts
			WHERE a_id = inAid AND u_id = inUid;
            
            CALL album_image_reorder(inUid, inAid);
            
            /*
            UPDATE `album_image` SET 
            ai_pos = ai_pos+1
            WHERE ai_id != inAiId AND a_id = inAid AND u_id = inUid;
            */
            
        END IF;
        
    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `controller_after` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `controller_after`(IN f_id INT, IN t_id INT, OUT res INT)
BEGIN
DECLARE f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev,done INT DEFAULT 0;
DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
SET res=0;
START TRANSACTION;
SET done=0;
SELECT c_lk,c_rk,c_level
INTO f_lft,f_rgt,f_lev
FROM `controllers`
WHERE c_id=f_id;
IF t_id>0 THEN
SELECT c_lk,c_rk,c_level
INTO t_lft,t_rgt,t_lev
FROM `controllers`
WHERE c_level=f_lev AND c_id=t_id;
IF NOT done THEN
SELECT c_lk,c_rk,c_level
INTO t_lft,t_rgt,t_lev
FROM `controllers`
WHERE c_level=f_lev AND c_lk>t_rgt AND c_rk>t_rgt
ORDER BY c_lk ASC
LIMIT 1;
IF done THEN
SET t_lft = t_rgt+1;
SET t_rgt = t_lft+1;
SET done=0;
END IF;
END IF;
ELSE
SELECT c_lk,c_rk,c_level
INTO t_lft,t_rgt,t_lev
FROM `controllers`
WHERE c_lk<f_lft AND c_rk>f_rgt AND c_level<f_lev
ORDER BY c_level DESC
LIMIT 1;
IF NOT done THEN
SELECT c_lk,c_rk,c_level
INTO t_lft,t_rgt,t_lev
FROM `controllers`
WHERE c_level=f_lev AND c_lk>t_lft AND c_rk<t_rgt
ORDER BY c_lk ASC
LIMIT 1;
ELSE
SET done=0;
SELECT c_lk,c_rk,c_level
INTO t_lft,t_rgt,t_lev
FROM `controllers`
WHERE c_level=f_lev
ORDER BY c_lk ASC
LIMIT 1;
END IF;
END IF;
IF NOT done THEN
SET t_rgt=t_lft;
SET t_lft=t_lft-1;
CALL `controller_relocate`(f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev-1,res);
END IF;
IF res=0 THEN
ROLLBACK;
ELSE
COMMIT;
END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `controller_create` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `controller_create`(IN inPid INT, IN inAfterId INT, IN inPath VARCHAR(255), IN inName VARCHAR(100), IN inDesc TEXT, OUT last_ins_id INT)
BEGIN
	DECLARE i_level INT DEFAULT 1;
	DECLARE i_right_key INT DEFAULT 1;
	DECLARE res INT DEFAULT 0;
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
	
	SET last_ins_id=0;
	SET res=0;
	START TRANSACTION;
	
	SELECT IF(ISNULL(MAX(c_rk)+1), 1, MAX(c_rk)+1 ) INTO i_right_key
	FROM `controllers`;
	
	INSERT INTO `controllers`
	SET 
	c_level	= i_level, 
	c_lk	= i_right_key, 
	c_rk	= i_right_key + 1,
	c_path	= inPath,
	c_name	= inName,
	c_desc  = inDesc;
	
	SELECT LAST_INSERT_ID() INTO last_ins_id;
	
	IF last_ins_id>0 THEN
		CALL controller_move(last_ins_id, inPid, res);
		IF res=1 THEN
			CALL controller_after(last_ins_id, inAfterId, res);
		END IF;	
		
		IF res=0 THEN
			ROLLBACK;
			SET last_ins_id=0;
		ELSE
			COMMIT;
		END IF;
	ELSE 
		ROLLBACK;
	END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `controller_down` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `controller_down`(IN p_id INT, OUT res INT)
BEGIN
DECLARE f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev INT DEFAULT 0;
SET res=0;
SELECT c_lk,i_c_rk,c_level
INTO f_lft,f_rgt,f_lev
FROM `controllers`
WHERE c_id=p_id;
SELECT c_lk,c_rk,c_level
INTO t_lft,t_rgt,t_lev
FROM `controllers`
WHERE c_lk<f_lft AND c_rk>f_rgt AND c_level<f_lev
ORDER BY c_level DESC
LIMIT 1;
IF t_rgt-t_lft>f_rgt-f_lft THEN
IF f_rgt+1<t_rgt THEN
SELECT c_lk,c_rk,c_level
INTO t_lft,t_rgt,t_lev
FROM `controllers`
WHERE c_level=f_lev AND c_lk>t_lft AND c_rk<t_rgt AND c_lk>f_rgt
ORDER BY c_lk ASC
LIMIT 1;
SET t_lft=t_rgt;
SET t_rgt=t_rgt+1;
ELSE
SELECT c_lk,c_rk,c_level
INTO t_lft,t_rgt,t_lev
FROM `controllers`
WHERE c_level=f_lev AND c_lk>t_lft AND c_rk<t_rgt
ORDER BY c_lk ASC
LIMIT 1;
SET t_rgt=t_lft;
SET t_lft=t_lft-1;
END IF;
CALL `controller_relocate`(f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev-1,res);
END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `controller_move` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `controller_move`(IN f_id INT, IN t_id INT, OUT res INT)
BEGIN
DECLARE f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev,done INT DEFAULT 0;
DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
SET res=0;
SET max_sp_recursion_depth=1;
START TRANSACTION;
SET done=0;
SELECT c_lk,c_rk,c_level
INTO f_lft,f_rgt,f_lev
FROM `controllers`
WHERE c_id=f_id;
IF t_id=0 THEN
SELECT IFNULL(MIN(c_lk),1)-1,IFNULL(MAX(c_rk),2)+1,0
INTO t_lft,t_rgt,t_lev
FROM `controllers`;
ELSE
SELECT c_lk,c_rk,c_level
INTO t_lft,t_rgt,t_lev
FROM `controllers`
WHERE c_id=t_id;
END IF;
IF NOT done THEN
UPDATE `controllers`
SET c_pid=t_id
WHERE c_id=f_id;
CALL `controller_relocate`(f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev,res);
END IF;
IF res=0 THEN
ROLLBACK;
ELSE
COMMIT;
END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `controller_relocate` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `controller_relocate`(IN f_lft INT, IN f_rgt INT, IN f_lev INT, IN t_lft INT, IN t_rgt INT, IN t_lev INT, OUT res INT)
BEGIN
DECLARE count_pos,mv_level,mv_pos INT DEFAULT 0;
DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
SET res=0;
START TRANSACTION;
IF f_lft<f_rgt AND t_lft<t_rgt AND (f_lft>t_rgt OR f_rgt<t_rgt) THEN
SET count_pos=f_rgt-f_lft+1;
SET mv_level=f_lev-t_lev-1;

IF f_lft>t_rgt THEN
SET mv_pos=f_lft-t_rgt+count_pos;
UPDATE `controllers`
SET
c_rk = c_rk+count_pos,
c_lk = IF(c_lk > t_lft, c_lk+count_pos, c_lk)
WHERE c_rk >= t_rgt;
UPDATE `controllers`
SET c_rk = c_rk - mv_pos
WHERE c_lk >= (f_lft + count_pos) AND c_rk <= (f_rgt + count_pos);
UPDATE `controllers`
SET
c_lk = c_lk - mv_pos,
c_level = c_level - mv_level
WHERE c_lk >= (f_lft+count_pos) AND c_rk <= (t_rgt+count_pos);
UPDATE `controllers`
SET
c_rk = c_rk - count_pos,
c_lk = IF(c_lk > (f_rgt+count_pos), c_lk - count_pos, c_lk)
WHERE c_rk > (f_rgt+count_pos);
ELSE
SET mv_pos = f_lft - t_rgt;
UPDATE `controllers`
SET
c_rk = c_rk + count_pos,
c_lk = IF(c_lk > t_lft, c_lk + count_pos, c_lk)
WHERE c_rk >= t_rgt;
UPDATE `controllers`
SET c_lk = c_lk - mv_pos
WHERE c_lk >= f_lft AND c_rk <= f_rgt;
UPDATE `controllers`
SET
c_rk = c_rk - mv_pos,
c_level = c_level - mv_level
WHERE c_lk >= t_rgt AND c_rk <= f_rgt;
UPDATE `controllers`
SET c_rk = c_rk - count_pos,
c_lk = IF(c_lk > f_rgt, c_lk - count_pos, c_lk)
WHERE c_rk>f_rgt;
END IF;
END IF;
SET res=1;
COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `controller_up` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `controller_up`(IN p_id INT, OUT res INT)
BEGIN
DECLARE f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev INT DEFAULT 0;
SET res=0;
SELECT c_lk,c_rk,c_level
INTO f_lft,f_rgt,f_lev
FROM `controllers`
WHERE c_id=p_id;
SELECT c_lk,c_rk,c_level
INTO t_lft,t_rgt,t_lev
FROM `controllers`
WHERE c_lk<f_lft AND c_rk>f_rgt AND c_level<f_lev
ORDER BY c_level DESC
LIMIT 1;
IF t_rgt-t_lft>f_rgt-f_lft THEN
IF f_lft-1>t_lft THEN
SELECT c_lk,c_rk,c_level
INTO t_lft,t_rgt,t_lev
FROM `controllers`
WHERE c_level=f_lev AND c_lk>t_lft AND c_rk<t_rgt AND c_rk<f_lft
ORDER BY c_rk DESC
LIMIT 1;
SET t_rgt=t_lft;
SET t_lft=t_lft-1;
ELSE
SELECT c_lk,c_rk,c_level
INTO t_lft,t_rgt,t_lev
FROM `controllers`
WHERE c_level=f_lev AND c_lk>t_lft AND c_rk<t_rgt
ORDER BY c_rk DESC
LIMIT 1;
SET t_lft=t_rgt;
SET t_rgt=t_rgt+1;
END IF;
CALL `controller_relocate`(f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev-1,res);
END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `controller_update` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `controller_update`(IN inId INT, IN inPid INT, IN inAftecId INT, IN inPath VARCHAR(255), IN inName VARCHAR(100), IN inDesc TEXT, OUT res INT)
BEGIN
	DECLARE cPid, cId, cLk, cRk, bIntoSelf INT DEFAULT 0;
	
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
	SET res=0;
	
	
	SELECT 
	c_lk, c_rk INTO cLk, cRk
	FROM `controllers`
	WHERE c_id = inId;
	
	
	SELECT EXISTS (
		SELECT 1 
		FROM `controllers`
		WHERE inPid IN
		(SELECT c_id 
		FROM `controllers`
		WHERE c_lk >= cLk
		AND c_rk <= cRk)
	) INTO bIntoSelf;
	
	START TRANSACTION;
	
	UPDATE `controllers`
	SET
	c_path	= inPath,
	c_name	= inName,
	c_desc	= inDesc
	WHERE c_id = inId;
	
	
	if bIntoSelf=1 THEN
		SET res = 1;
		Commit;
	ELSE
		CALL controller_move(inId, inPid, res);
		
		IF res=1 THEN
			CALL controller_after(inId, inAftecId, res);
		END IF;	
		
		IF res=0 THEN
			ROLLBACK;
		ELSE
			COMMIT;
		END IF;
	END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `events_image_delete` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `events_image_delete`(IN inEid INT, IN inEiId INT, OUT res INT)
BEGIN
	
    DECLARE done,eipos, ei_last, ei_cnt, ts INT DEFAULT 0;
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
    DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
    
    START TRANSACTION;
    
    SET res=0;
    SET done=0;
    
    SELECT ei_pos INTO eipos 
    FROM `events_image`
    WHERE ei_id = inEiId;
    
    #SELECT done, eipos;
    
    IF done = 0 THEN
		
        SET ts = UNIX_TIMESTAMP();
        
		DELETE FROM `events_image`
		WHERE ei_id = inEiId AND e_id = inEid;
        
        CALL `events_image_reorder`(inEid);
        
        SELECT COUNT(ei_id) AS cnt INTO ei_cnt
        FROM `events_image`
		WHERE e_id = inEid;
        
		UPDATE `events_list` SET 
        e_img_cnt = ei_cnt,
        e_update_ts = ts
		WHERE e_id = inEid;
        
		SET res=1;
    
		COMMIT;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `events_image_reorder` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `events_image_reorder`(IN inEid INT)
BEGIN
	
	DECLARE done, res, pos, eiId INT DEFAULT 0;
    
    /*Объявление курсора*/
	DECLARE getImageIds CURSOR FOR 
    SELECT ei_id
    FROM `events_image` 
    WHERE e_id = inEid
    ORDER BY ei_pos, ei_update_ts DESC, ei_id DESC;
    
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
    DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
    
    SET done=0;
    SET pos=0;
    
    START TRANSACTION;
		/* открытие курсора */
		OPEN getImageIds;
		/*извлекаем данные */
		REPEAT
        FETCH getImageIds INTO eiId;
			#делаем нужные нам действия 
			IF NOT done THEN     
			  UPDATE `events_image` SET 
			  ei_pos = pos
			  WHERE ei_id = eiId;
			  
			  SET pos = pos + 1;
			END IF;
		UNTIL done END REPEAT;
		
		/*закрытие курсора */
		CLOSE getImageIds;
        
        SET done = 0;
        
        SELECT ei_pos INTO pos
        FROM `events_image`
        WHERE e_id = inEid
		ORDER BY ei_pos, ei_update_ts DESC, ei_id DESC
        LIMIT 1;
        
        IF NOT done AND pos = 1 THEN
			UPDATE `events_image` SET 
			ei_pos = ei_pos-1
			WHERE e_id = inEid;
        END IF;
        
    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `events_image_update` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `events_image_update`(IN inEid INT, IN inEiId INT, IN inEiLatitude DECIMAL(10,8), IN inEiLongitude DECIMAL(11,8), IN inEidir  VARCHAR(255), IN inEiName VARCHAR(255), IN inPosUpd TINYINT(1))
BEGIN
	
	DECLARE done, res, ei_cnt, ts INT DEFAULT 0;
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
    DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
    SET done=0;
    
    START TRANSACTION;
    
		SET ts = UNIX_TIMESTAMP();
        
		UPDATE `events_image` SET
			ei_pos = IF(inPosUpd = 1, 0, ei_pos),
			ei_update_ts = ts,
			ei_latitude = inEiLatitude,
			ei_longitude = inEiLongitude,
			ei_dir = IF(inEidir != "", inEidir, ei_dir),
			ei_name = inEiName
		WHERE ei_id = inEiId AND e_id = inEid;
        
        IF inPosUpd = 1 AND done = 0 THEN
			
            SELECT COUNT(ei_id) AS cnt INTO ei_cnt
			FROM `events_image`
			WHERE e_id = inEid;
			
			UPDATE `events_list` SET 
            e_img_cnt = ei_cnt,
			e_update_ts = ts
			WHERE e_id = inEid;
            
            CALL `events_image_reorder`(inEid);
            
        END IF;
        
    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `location_after` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `location_after`(IN f_id INT, IN t_id INT, OUT res INT)
BEGIN
DECLARE f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev,done INT DEFAULT 0;
DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
SET res=0;
START TRANSACTION;
SET done=0;
SELECT l_lk,l_rk,l_level
INTO f_lft,f_rgt,f_lev
FROM `location`
WHERE l_id=f_id;
IF t_id>0 THEN
SELECT l_lk,l_rk,l_level
INTO t_lft,t_rgt,t_lev
FROM `location`
WHERE l_level=f_lev AND l_id=t_id;
IF NOT done THEN
SELECT l_lk,l_rk,l_level
INTO t_lft,t_rgt,t_lev
FROM `location`
WHERE l_level=f_lev AND l_lk>t_rgt AND l_rk>t_rgt
ORDER BY l_lk ASC
LIMIT 1;
IF done THEN
SET t_lft = t_rgt+1;
SET t_rgt = t_lft+1;
SET done=0;
END IF;
END IF;
ELSE
SELECT l_lk,l_rk,l_level
INTO t_lft,t_rgt,t_lev
FROM `location`
WHERE l_lk<f_lft AND l_rk>f_rgt AND l_level<f_lev
ORDER BY l_level DESC
LIMIT 1;
IF NOT done THEN
SELECT l_lk,l_rk,l_level
INTO t_lft,t_rgt,t_lev
FROM `location`
WHERE l_level=f_lev AND l_lk>t_lft AND l_rk<t_rgt
ORDER BY l_lk ASC
LIMIT 1;
ELSE
SET done=0;
SELECT l_lk,l_rk,l_level
INTO t_lft,t_rgt,t_lev
FROM `location`
WHERE l_level=f_lev
ORDER BY l_lk ASC
LIMIT 1;
END IF;
END IF;
IF NOT done THEN
SET t_rgt=t_lft;
SET t_lft=t_lft-1;
CALL `location_relocate`(f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev-1,res);
END IF;
IF res=0 THEN
ROLLBACK;
ELSE
COMMIT;
END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `location_alphabet` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `location_alphabet`(IN inId INT, OUT res INT)
BEGIN
	DECLARE tmpId, done, pid, afterId INT DEFAULT 0;
    
    /*Объявление курсора*/
	DECLARE getLocationIds CURSOR FOR 
    SELECT l_id #INTO tmpId1
    FROM `location_names` 
    WHERE l_pid = pid #AND l_name like "с%"
    ORDER BY l_name;
    
	DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
	
    SET done=0;
    SET res = 0;
    START TRANSACTION;
    
		SELECT l_pid INTO pid
		FROM `location`
		WHERE l_id = inId;
		
		SET done = 0;
		
		/* открытие курсора */
		OPEN getLocationIds;
		/*извлекаем данные */
		REPEAT
        FETCH getLocationIds INTO tmpId;
			#делаем нужные нам действия 
			IF NOT done THEN
				IF tmpId = inId THEN
					SET done = 1;
				ELSE 
					SET afterId = tmpId;
				END IF;
            #ELSE SET afterId = 0;
			END IF;
		UNTIL done END REPEAT;
		
		/*закрытие курсора */
		CLOSE getLocationIds;
		
        CALL `location_after`(inId, afterId, res);
        
    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `location_create` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `location_create`(IN inPid INT, IN inAfterId INT, IN inName VARCHAR(255), IN inLat DECIMAL(10,8), IN inLng DECIMAL(11,8), IN inKind VARCHAR(50), IN inFullName VARCHAR(255), OUT last_ins_id INT)
BEGIN
	DECLARE i_level INT DEFAULT 1;
	DECLARE i_right_key INT DEFAULT 1;
	DECLARE res, existsId, done INT DEFAULT 0;
	DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
	 
	SET last_ins_id=0;
	SET res=0;
	SET done=0;
		
	SELECT IFNULL(l_id, 0) INTO existsId
	FROM `location_names`
    WHERE l_full_name = inFullName;
	#WHERE l_pid = inPid AND l_name = inName;
	
	IF NOT done THEN
		SET last_ins_id = existsId;
	ELSE 
		SET done = 0;
		START TRANSACTION;
		
		
		SELECT IF(ISNULL(MAX(l_rk)+1), 1, MAX(l_rk)+1 ) INTO i_right_key
		FROM `location`;
		
		INSERT INTO `location`
		SET 
		l_level	= i_level, 
		l_lk	= i_right_key, 
		l_rk	= i_right_key + 1;
		
		SET last_ins_id = LAST_INSERT_ID();
		
		IF last_ins_id>0 THEN
			
			CALL `location_move`(last_ins_id, inPid, res);
			
            #IF res=1 THEN
			#	CALL `location_after`(last_ins_id, inAfterId, res);
			#END IF;	
			
			IF res=0 THEN
				ROLLBACK;
				SET last_ins_id=0;
			ELSE
			
				INSERT INTO `location_names` (l_id, l_pid, l_name, l_latitude, l_longitude, l_kind, l_full_name)
				VALUES(last_ins_id, inPid, inName, inLat, inLng, inKind, inFullName);
				
                CALL `location_alphabet`(last_ins_id, res);
                
                IF res=0 THEN
					ROLLBACK;
					SET last_ins_id=0;
				ELSE
					
					COMMIT;
				END IF;
                
				#COMMIT;
			END IF;
		ELSE 
			ROLLBACK;
		END IF;
	
	END IF;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `location_down` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `location_down`(IN p_id INT, OUT res INT)
BEGIN
DECLARE f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev INT DEFAULT 0;
SET res=0;
SELECT l_lk,i_l_rk,l_level
INTO f_lft,f_rgt,f_lev
FROM `location`
WHERE l_id=p_id;
SELECT l_lk,l_rk,l_level
INTO t_lft,t_rgt,t_lev
FROM `location`
WHERE l_lk<f_lft AND l_rk>f_rgt AND l_level<f_lev
ORDER BY l_level DESC
LIMIT 1;
IF t_rgt-t_lft>f_rgt-f_lft THEN
IF f_rgt+1<t_rgt THEN
SELECT l_lk,l_rk,l_level
INTO t_lft,t_rgt,t_lev
FROM `location`
WHERE l_level=f_lev AND l_lk>t_lft AND l_rk<t_rgt AND l_lk>f_rgt
ORDER BY l_lk ASC
LIMIT 1;
SET t_lft=t_rgt;
SET t_rgt=t_rgt+1;
ELSE
SELECT l_lk,l_rk,l_level
INTO t_lft,t_rgt,t_lev
FROM `location`
WHERE l_level=f_lev AND l_lk>t_lft AND l_rk<t_rgt
ORDER BY l_lk ASC
LIMIT 1;
SET t_rgt=t_lft;
SET t_lft=t_lft-1;
END IF;
CALL `location_relocate`(f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev-1,res);
END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `location_move` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `location_move`(IN f_id INT, IN t_id INT, OUT res INT)
BEGIN
  DECLARE f_lft
  , f_rgt
  , f_lev
  , t_lft
  , t_rgt
  , t_lev
  , done INT DEFAULT 0 ;
  DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done = 1 ;
  DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK ;
  SET res = 0 ;
  SET max_sp_recursion_depth = 1 ;
  
  START TRANSACTION ;
  SET done = 0 ;
  SELECT 
    l_lk
    , l_rk
    , l_level INTO f_lft
    , f_rgt
    , f_lev 
  FROM
    `location` 
  WHERE l_id = f_id ;
  
  IF t_id = 0 
  THEN 
	  SELECT 
		IFNULL(MIN(l_lk), 1) - 1
		, IFNULL(MAX(l_rk), 2) + 1
		, 0 INTO t_lft
		, t_rgt
		, t_lev 
	  FROM
		`location` ;
  ELSE 
	  SELECT 
		l_lk
		, l_rk
		, l_level INTO t_lft
		, t_rgt
		, t_lev 
	  FROM
		`location` 
	  WHERE l_id = t_id ;
  END IF ;
  IF NOT done 
  THEN 
  UPDATE 
    `location` 
  SET
    l_pid = t_id 
  WHERE l_id = f_id ;
  CALL `location_relocate` (
    f_lft
    , f_rgt
    , f_lev
    , t_lft
    , t_rgt
    , t_lev
    , res
  ) ;
  END IF ;
  IF res = 0 
  THEN ROLLBACK ;
  ELSE COMMIT ;
  END IF ;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `location_relocate` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `location_relocate`(IN f_lft INT, IN f_rgt INT, IN f_lev INT, IN t_lft INT, IN t_rgt INT, IN t_lev INT, OUT res INT)
BEGIN
DECLARE count_pos,mv_level,mv_pos INT DEFAULT 0;
DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
SET res=0;
START TRANSACTION;
IF f_lft<f_rgt AND t_lft<t_rgt AND (f_lft>t_rgt OR f_rgt<t_rgt) THEN
SET count_pos=f_rgt-f_lft+1;
SET mv_level=f_lev-t_lev-1;
IF f_lft>t_rgt THEN
SET mv_pos=f_lft-t_rgt+count_pos;
UPDATE `location`
SET
l_rk = l_rk+count_pos,
l_lk = IF(l_lk > t_lft, l_lk+count_pos, l_lk)
WHERE l_rk >= t_rgt;
UPDATE `location`
SET l_rk = l_rk - mv_pos
WHERE l_lk >= (f_lft + count_pos) AND l_rk <= (f_rgt + count_pos);
UPDATE `location`
SET
l_lk = l_lk - mv_pos,
l_level = l_level - mv_level
WHERE l_lk >= (f_lft+count_pos) AND l_rk <= (t_rgt+count_pos);
UPDATE `location`
SET
l_rk = l_rk - count_pos,
l_lk = IF(l_lk > (f_rgt+count_pos), l_lk - count_pos, l_lk)
WHERE l_rk > (f_rgt+count_pos);
ELSE
SET mv_pos = f_lft - t_rgt;
UPDATE `location`
SET
l_rk = l_rk + count_pos,
l_lk = IF(l_lk > t_lft, l_lk + count_pos, l_lk)
WHERE l_rk >= t_rgt;
UPDATE `location`
SET l_lk = l_lk - mv_pos
WHERE l_lk >= f_lft AND l_rk <= f_rgt;
UPDATE `location`
SET
l_rk = l_rk - mv_pos,
l_level = l_level - mv_level
WHERE l_lk >= t_rgt AND l_rk <= f_rgt;
UPDATE `location`
SET l_rk = l_rk - count_pos,
l_lk = IF(l_lk > f_rgt, l_lk - count_pos, l_lk)
WHERE l_rk>f_rgt;
END IF;
END IF;
SET res=1;
COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `location_up` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `location_up`(IN p_id INT, OUT res INT)
BEGIN
DECLARE f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev INT DEFAULT 0;
SET res=0;
SELECT l_lk,l_rk,l_level
INTO f_lft,f_rgt,f_lev
FROM `location`
WHERE l_id=p_id;
SELECT l_lk,l_rk,l_level
INTO t_lft,t_rgt,t_lev
FROM `location`
WHERE l_lk<f_lft AND l_rk>f_rgt AND l_level<f_lev
ORDER BY l_level DESC
LIMIT 1;
IF t_rgt-t_lft>f_rgt-f_lft THEN
IF f_lft-1>t_lft THEN
SELECT l_lk,l_rk,l_level
INTO t_lft,t_rgt,t_lev
FROM `location`
WHERE l_level=f_lev AND l_lk>t_lft AND l_rk<t_rgt AND l_rk<f_lft
ORDER BY l_rk DESC
LIMIT 1;
SET t_rgt=t_lft;
SET t_lft=t_lft-1;
ELSE
SELECT l_lk,l_rk,l_level
INTO t_lft,t_rgt,t_lev
FROM `location`
WHERE l_level=f_lev AND l_lk>t_lft AND l_rk<t_rgt
ORDER BY l_rk DESC
LIMIT 1;
SET t_lft=t_rgt;
SET t_rgt=t_rgt+1;
END IF;
CALL `location_relocate`(f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev-1,res);
END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `location_update` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `location_update`(IN inId INT, IN inPid INT, IN inAfterId INT, IN inName VARCHAR(255), IN inLat DECIMAL(10,8), IN inLng DECIMAL(11,8), IN inKind VARCHAR(50), IN inFullName VARCHAR(255), OUT res INT)
BEGIN
	DECLARE rPid, rId, rLk, rRk, bIntoSelf, existsId, done INT DEFAULT 0;
	
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
	DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
	
	SET res=0;
	SET done = 0;
	
	SELECT IFNULL(l_id, 0) INTO existsId
	FROM `location_names`
	WHERE l_id <> inId AND l_pid = inPid AND l_name = inName;
	
	
	IF NOT done THEN
		SET res = 0;	
	ELSE 
	
		
		SELECT 
		l_lk, l_rk INTO rLk, rRk
		FROM `location`
		WHERE l_id = inId;
		
		
		SELECT EXISTS (
			SELECT 1 
			FROM `location`
			WHERE inPid IN
			(
				SELECT l_id 
				FROM `location`
				WHERE l_lk >= rLk
				AND l_rk <= rRk
			)
		) INTO bIntoSelf;
		
		START TRANSACTION;
		
		UPDATE `location_names`
		SET
		l_pid = inPid,
		l_name	= inName,
		l_latitude = inLat,
		l_longitude = inLng,
		l_kind = inKind,
		l_full_name = inFullNamea
		WHERE l_id = inId;
		
		
		IF bIntoSelf=1 THEN
			SET res = 1;
			COMMIT;
		ELSE
			CALL `location_move`(inId, inPid, res);
			
			IF res=1 THEN
				CALL `location_after`(inId, inAfterId, res);
				
			END IF;	
			
			IF res=0 THEN
				ROLLBACK;
			ELSE
				COMMIT;
			END IF;
		END IF;
	END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `menu_after` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `menu_after`(IN f_id INT, IN t_id INT, OUT res INT)
BEGIN
DECLARE f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev,done INT DEFAULT 0;
DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
SET res=0;
START TRANSACTION;
SET done=0;
SELECT m_lk,m_rk,m_level
INTO f_lft,f_rgt,f_lev
FROM `menu`
WHERE m_id=f_id;
IF t_id>0 THEN
SELECT m_lk,m_rk,m_level
INTO t_lft,t_rgt,t_lev
FROM `menu`
WHERE m_level=f_lev AND m_id=t_id;
IF NOT done THEN
SELECT m_lk,m_rk,m_level
INTO t_lft,t_rgt,t_lev
FROM `menu`
WHERE m_level=f_lev AND m_lk>t_rgt AND m_rk>t_rgt
ORDER BY m_lk ASC
LIMIT 1;
IF done THEN
SET t_lft = t_rgt+1;
SET t_rgt = t_lft+1;
SET done=0;
END IF;
END IF;
ELSE
SELECT m_lk,m_rk,m_level
INTO t_lft,t_rgt,t_lev
FROM `menu`
WHERE m_lk<f_lft AND m_rk>f_rgt AND m_level<f_lev
ORDER BY m_level DESC
LIMIT 1;
IF NOT done THEN
SELECT m_lk,m_rk,m_level
INTO t_lft,t_rgt,t_lev
FROM `menu`
WHERE m_level=f_lev AND m_lk>t_lft AND m_rk<t_rgt
ORDER BY m_lk ASC
LIMIT 1;
ELSE
SET done=0;
SELECT m_lk,m_rk,m_level
INTO t_lft,t_rgt,t_lev
FROM `menu`
WHERE m_level=f_lev
ORDER BY m_lk ASC
LIMIT 1;
END IF;
END IF;
IF NOT done THEN
SET t_rgt=t_lft;
SET t_lft=t_lft-1;
CALL `menu_relocate`(f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev-1,res);
END IF;
IF res=0 THEN
ROLLBACK;
ELSE
COMMIT;
END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `menu_create` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `menu_create`(IN inMenuPid INT, IN inAfterId INT, IN inMenuPath VARCHAR(255), IN inMenuName VARCHAR(100), IN inMenuTitle TEXT, IN inMenuH1 TExt, IN inMenuDesc TEXT, IN inCId INT, IN inType INT, OUT last_ins_id INT)
BEGIN
	DECLARE i_level INT DEFAULT 1;
	DECLARE i_right_key INT DEFAULT 1;
	DECLARE res INT DEFAULT 0;
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
	 
	SET last_ins_id=0;
	SET res=0;
	START TRANSACTION;
	
	SELECT IF(ISNULL(MAX(m_rk)+1), 1, MAX(m_rk)+1 ) INTO i_right_key
	FROM `menu`;
	
	INSERT INTO `menu`
	SET 
	m_level	= i_level, 
	m_lk	= i_right_key, 
	m_rk	= i_right_key + 1,
	m_path	= inMenuPath,
	m_name	= inMenuName,
	m_title	= inMenuTitle,
	m_h1	= inMenuH1,
	m_desc  = inMenuDesc,
	c_id	= inCId,
    m_type	= inType;
	
	SELECT LAST_INSERT_ID() INTO last_ins_id;
	
	IF last_ins_id>0 THEN
		CALL menu_move(last_ins_id, inMenuPid, res);
		IF res=1 THEN
			CALL menu_after(last_ins_id, inAfterId, res);
		END IF;	
		
		IF res=0 THEN
			ROLLBACK;
			SET last_ins_id=0;
		ELSE
			COMMIT;
		END IF;
	ELSE 
		ROLLBACK;
	END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `menu_down` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `menu_down`(IN p_id INT, OUT res INT)
BEGIN
DECLARE f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev INT DEFAULT 0;
SET res=0;
SELECT m_lk,i_m_rk,m_level
INTO f_lft,f_rgt,f_lev
FROM `menu`
WHERE m_id=p_id;
SELECT m_lk,m_rk,m_level
INTO t_lft,t_rgt,t_lev
FROM `menu`
WHERE m_lk<f_lft AND m_rk>f_rgt AND m_level<f_lev
ORDER BY m_level DESC
LIMIT 1;
IF t_rgt-t_lft>f_rgt-f_lft THEN
IF f_rgt+1<t_rgt THEN
SELECT m_lk,m_rk,m_level
INTO t_lft,t_rgt,t_lev
FROM `menu`
WHERE m_level=f_lev AND m_lk>t_lft AND m_rk<t_rgt AND m_lk>f_rgt
ORDER BY m_lk ASC
LIMIT 1;
SET t_lft=t_rgt;
SET t_rgt=t_rgt+1;
ELSE
SELECT m_lk,m_rk,m_level
INTO t_lft,t_rgt,t_lev
FROM `menu`
WHERE m_level=f_lev AND m_lk>t_lft AND m_rk<t_rgt
ORDER BY m_lk ASC
LIMIT 1;
SET t_rgt=t_lft;
SET t_lft=t_lft-1;
END IF;
CALL `menu_relocate`(f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev-1,res);
END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `menu_move` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `menu_move`(IN f_id INT, IN t_id INT, OUT res INT)
BEGIN
  DECLARE f_lft
  , f_rgt
  , f_lev
  , t_lft
  , t_rgt
  , t_lev
  , done INT DEFAULT 0 ;
  DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done = 1 ;
  DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK ;
  SET res = 0 ;
  SET max_sp_recursion_depth = 1 ;
  START TRANSACTION ;
  SET done = 0 ;
  SELECT 
    m_lk
    , m_rk
    , m_level INTO f_lft
    , f_rgt
    , f_lev 
  FROM
    `menu` 
  WHERE m_id = f_id ;
  IF t_id = 0 
  THEN 
  SELECT 
    IFNULL(MIN(m_lk), 1) - 1
    , IFNULL(MAX(m_rk), 2) + 1
    , 0 INTO t_lft
    , t_rgt
    , t_lev 
  FROM
    `menu` ;
  ELSE 
  SELECT 
    m_lk
    , m_rk
    , m_level INTO t_lft
    , t_rgt
    , t_lev 
  FROM
    `menu` 
  WHERE m_id = t_id ;
  END IF ;
  IF NOT done 
  THEN 
  UPDATE 
    `menu` 
  SET
    m_pid = t_id 
  WHERE m_id = f_id ;
  CALL `menu_relocate` (
    f_lft
    , f_rgt
    , f_lev
    , t_lft
    , t_rgt
    , t_lev
    , res
  ) ;
  END IF ;
  IF res = 0 
  THEN ROLLBACK ;
  ELSE COMMIT ;
  END IF ;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `menu_relocate` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `menu_relocate`(IN f_lft INT, IN f_rgt INT, IN f_lev INT, IN t_lft INT, IN t_rgt INT, IN t_lev INT, OUT res INT)
BEGIN
DECLARE count_pos,mv_level,mv_pos INT DEFAULT 0;
DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
SET res=0;
START TRANSACTION;
IF f_lft<f_rgt AND t_lft<t_rgt AND (f_lft>t_rgt OR f_rgt<t_rgt) THEN
SET count_pos=f_rgt-f_lft+1;
SET mv_level=f_lev-t_lev-1;

IF f_lft>t_rgt THEN
SET mv_pos=f_lft-t_rgt+count_pos;
UPDATE `menu`
SET
m_rk = m_rk+count_pos,
m_lk = IF(m_lk > t_lft, m_lk+count_pos, m_lk)
WHERE m_rk >= t_rgt;
UPDATE `menu`
SET m_rk = m_rk - mv_pos
WHERE m_lk >= (f_lft + count_pos) AND m_rk <= (f_rgt + count_pos);
UPDATE `menu`
SET
m_lk = m_lk - mv_pos,
m_level = m_level - mv_level
WHERE m_lk >= (f_lft+count_pos) AND m_rk <= (t_rgt+count_pos);
UPDATE `menu`
SET
m_rk = m_rk - count_pos,
m_lk = IF(m_lk > (f_rgt+count_pos), m_lk - count_pos, m_lk)
WHERE m_rk > (f_rgt+count_pos);
ELSE
SET mv_pos = f_lft - t_rgt;
UPDATE `menu`
SET
m_rk = m_rk + count_pos,
m_lk = IF(m_lk > t_lft, m_lk + count_pos, m_lk)
WHERE m_rk >= t_rgt;
UPDATE `menu`
SET m_lk = m_lk - mv_pos
WHERE m_lk >= f_lft AND m_rk <= f_rgt;
UPDATE `menu`
SET
m_rk = m_rk - mv_pos,
m_level = m_level - mv_level
WHERE m_lk >= t_rgt AND m_rk <= f_rgt;
UPDATE `menu`
SET m_rk = m_rk - count_pos,
m_lk = IF(m_lk > f_rgt, m_lk - count_pos, m_lk)
WHERE m_rk>f_rgt;
END IF;
END IF;
SET res=1;
COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `menu_up` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `menu_up`(IN p_id INT, OUT res INT)
BEGIN
DECLARE f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev INT DEFAULT 0;
SET res=0;
SELECT m_lk,m_rk,m_level
INTO f_lft,f_rgt,f_lev
FROM `menu`
WHERE m_id=p_id;
SELECT m_lk,m_rk,m_level
INTO t_lft,t_rgt,t_lev
FROM `menu`
WHERE m_lk<f_lft AND m_rk>f_rgt AND m_level<f_lev
ORDER BY m_level DESC
LIMIT 1;
IF t_rgt-t_lft>f_rgt-f_lft THEN
IF f_lft-1>t_lft THEN
SELECT m_lk,m_rk,m_level
INTO t_lft,t_rgt,t_lev
FROM `menu`
WHERE m_level=f_lev AND m_lk>t_lft AND m_rk<t_rgt AND m_rk<f_lft
ORDER BY m_rk DESC
LIMIT 1;
SET t_rgt=t_lft;
SET t_lft=t_lft-1;
ELSE
SELECT m_lk,m_rk,m_level
INTO t_lft,t_rgt,t_lev
FROM `menu`
WHERE m_level=f_lev AND m_lk>t_lft AND m_rk<t_rgt
ORDER BY m_rk DESC
LIMIT 1;
SET t_lft=t_rgt;
SET t_rgt=t_rgt+1;
END IF;
CALL `menu_relocate`(f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev-1,res);
END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `menu_update` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `menu_update`(IN inMenuId INT, IN inMenuPid INT, IN inAfterId INT, IN inMenuPath VARCHAR(255), IN inMenuName VARCHAR(100), IN inMenuTitle TEXT, IN inMenuH1 TEXT, IN inMenuDesc TEXT, IN inCId INT, IN inType INT, OUT res INT)
BEGIN
	DECLARE rPid, rId, rLk, rRk, bIntoSelf INT DEFAULT 0;
    DECLARE isAdmin INT DEFAULT 1;
	
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
	SET res=0;
	
	
	SELECT 
	m_lk, m_rk INTO rLk, rRk
	FROM `menu`
	WHERE m_id = inMenuId;
	
	SELECT EXISTS (
		SELECT 1 
		FROM `menu`
		WHERE inMenuPid IN
		(
			SELECT m_id 
			FROM `menu`
			WHERE m_lk >= rLk
			AND m_rk <= rRk
		)
	) INTO bIntoSelf;
	
	START TRANSACTION;
	
	UPDATE `menu`
	SET
	m_path	= inMenuPath,
	m_name	= inMenuName,
	m_title	= inMenuTitle,
	m_h1	= inMenuH1,
	m_desc  = inMenuDesc,
	c_id	= inCId,
    m_type	= inType
	WHERE m_id = inMenuId;
	
	
	IF bIntoSelf=1 THEN
		SET res = 1;
		COMMIT;
	ELSE
		CALL menu_move(inMenuId, inMenuPid, res);
		
		IF res=1 THEN
			CALL menu_after(inMenuId, inAfterId, res);
			
            SELECT 
			m_is_admin INTO isAdmin
			FROM `menu`
			WHERE m_id = inMenuPid;
            
            UPDATE `menu`
			SET
			m_is_admin	= isAdmin
			WHERE m_id = inMenuId;
            
		END IF;	
		
		IF res=0 THEN
		
			ROLLBACK;
		ELSE
			COMMIT;
		END IF;
	END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `news_image_delete` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `news_image_delete`(IN inId INT, IN inImId INT, OUT res INT)
BEGIN
	
    DECLARE done,im_pos, ni_cnt, ts INT DEFAULT 0;
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
    DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
    
    START TRANSACTION;
    
    SET res=0;
    SET done=0;
    
    SELECT ni_pos INTO im_pos 
    FROM `news_image`
    WHERE ni_id = inImId;
    
    #SELECT done, im_pos;
    
    IF done = 0 THEN
		
        SET ts = UNIX_TIMESTAMP();
        
		DELETE FROM `news_image`
		WHERE ni_id = inImId AND n_id = inId;
        
        CALL `news_image_reorder`(inId);
        
        SELECT COUNT(ni_id) AS cnt INTO ni_cnt
        FROM `news_image`
		WHERE n_id = inId;
        
		UPDATE `news_list` SET 
        n_img_cnt = ni_cnt,
        n_update_ts = ts
		WHERE n_id = inId;
        
		SET res=1;
    
		COMMIT;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `news_image_reorder` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `news_image_reorder`(IN inId INT)
BEGIN
	
	DECLARE done, res, pos, niId INT DEFAULT 0;
    
    /*Объявление курсора*/
	DECLARE getImageIds CURSOR FOR 
    SELECT ni_id
    FROM `news_image` 
    WHERE n_id = inId
    ORDER BY ni_pos, ni_update_ts DESC, ni_id DESC;
    
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
    DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
    
    SET done=0;
    SET pos=0;
    
    START TRANSACTION;
		/* открытие курсора */
		OPEN getImageIds;
		/*извлекаем данные */
		REPEAT
        FETCH getImageIds INTO niId;
			#делаем нужные нам действия 
			IF NOT done THEN     
			  UPDATE `news_image` SET 
			  ni_pos = pos
			  WHERE ni_id = niId;
			  
			  SET pos = pos + 1;
			END IF;
		UNTIL done END REPEAT;
		
		/*закрытие курсора */
		CLOSE getImageIds;
        
        SET done = 0;
        
        SELECT ni_pos INTO pos
        FROM `news_image`
        WHERE n_id = inId
		ORDER BY ni_pos, ni_update_ts DESC, ni_id DESC
        LIMIT 1;
        
        IF NOT done AND pos = 1 THEN
			UPDATE `news_image` SET 
			ni_pos = ni_pos-1
			WHERE n_id = inId;
        END IF;
        
    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `news_image_update` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `news_image_update`(IN inId INT, IN inImId INT, IN inLatitude DECIMAL(10,8), IN inLongitude DECIMAL(11,8), IN inIdir  VARCHAR(255), IN inName VARCHAR(255), IN inPosUpd TINYINT(1))
BEGIN
	
	DECLARE done, res, ni_cnt, ts INT DEFAULT 0;
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
    DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
    SET done=0;
    
    START TRANSACTION;
    
		SET ts = UNIX_TIMESTAMP();
        
		UPDATE `news_image` SET
			ni_pos = IF(inPosUpd = 1, 0, ni_pos),
			ni_update_ts = ts,
			ni_latitude = inLatitude,
			ni_longitude = inLongitude,
			ni_dir = IF(inIdir != "", inIdir, ni_dir),
			ni_name = inName
		WHERE ni_id = inImId AND n_id = inId;
        
        IF inPosUpd = 1 AND done = 0 THEN
			
            SELECT COUNT(ni_id) AS cnt INTO ni_cnt
			FROM `news_image`
			WHERE n_id = inId;
			
			UPDATE `news_list` SET 
            n_img_cnt = ni_cnt,
			n_update_ts = ts
			WHERE n_id = inId;
            
            CALL `news_image_reorder`(inId);
            
        END IF;
        
    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `users_groups_after` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `users_groups_after`(IN f_id INT, IN t_id INT, OUT res INT)
BEGIN
DECLARE f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev,done INT DEFAULT 0;
DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
SET res=0;
START TRANSACTION;
SET done=0;
SELECT ug_lk,ug_rk,ug_level
INTO f_lft,f_rgt,f_lev
FROM `users_groups`
WHERE ug_id=f_id;
IF t_id>0 THEN
SELECT ug_lk,ug_rk,ug_level
INTO t_lft,t_rgt,t_lev
FROM `users_groups`
WHERE ug_level=f_lev AND ug_id=t_id;
IF NOT done THEN
SELECT ug_lk,ug_rk,ug_level
INTO t_lft,t_rgt,t_lev
FROM `users_groups`
WHERE ug_level=f_lev AND ug_lk>t_rgt AND ug_rk>t_rgt
ORDER BY ug_lk ASC
LIMIT 1;
IF done THEN
SET t_lft = t_rgt+1;
SET t_rgt = t_lft+1;
SET done=0;
END IF;
END IF;
ELSE
SELECT ug_lk,ug_rk,ug_level
INTO t_lft,t_rgt,t_lev
FROM `users_groups`
WHERE ug_lk<f_lft AND ug_rk>f_rgt AND ug_level<f_lev
ORDER BY ug_level DESC
LIMIT 1;
IF NOT done THEN
SELECT ug_lk,ug_rk,ug_level
INTO t_lft,t_rgt,t_lev
FROM `users_groups`
WHERE ug_level=f_lev AND ug_lk>t_lft AND ug_rk<t_rgt
ORDER BY ug_lk ASC
LIMIT 1;
ELSE
SET done=0;
SELECT ug_lk,ug_rk,ug_level
INTO t_lft,t_rgt,t_lev
FROM `users_groups`
WHERE ug_level=f_lev
ORDER BY ug_lk ASC
LIMIT 1;
END IF;
END IF;
IF NOT done THEN
SET t_rgt=t_lft;
SET t_lft=t_lft-1;
CALL `users_groups_relocate`(f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev-1,res);
END IF;
IF res=0 THEN
ROLLBACK;
ELSE
COMMIT;
END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `users_groups_create` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `users_groups_create`(IN inPid INT, IN inAfterId INT, IN inPath VARCHAR(255), IN inName VARCHAR(100), IN inDesc TEXT, IN inOnRegister INT, OUT last_ins_id INT)
BEGIN
	DECLARE i_level INT DEFAULT 1;
	DECLARE i_right_key INT DEFAULT 1;
	DECLARE res INT DEFAULT 0;
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
	
	SET last_ins_id=0;
	SET res=0;
	START TRANSACTION;
	
	SELECT IF(ISNULL(MAX(ug_rk)+1), 1, MAX(ug_rk)+1 ) INTO i_right_key
	FROM `users_groups`;
	
	INSERT INTO `users_groups`
	SET 
	ug_level= i_level, 
	ug_lk	= i_right_key, 
	ug_rk	= i_right_key + 1,
	ug_path	= inPath,
	ug_name	= inName,
	ug_desc = inDesc,
    ug_on_register = inOnRegister;
	
	SELECT LAST_INSERT_ID() INTO last_ins_id;
	
	IF last_ins_id>0 THEN
		CALL users_groups_move(last_ins_id, inPid, res);
		IF res=1 THEN
			CALL users_groups_after(last_ins_id, inAfterId, res);
		END IF;	
		
		IF res=0 THEN
			ROLLBACK;
			SET last_ins_id=0;
		ELSE
			COMMIT;
		END IF;
	ELSE 
		ROLLBACK;
	END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `users_groups_down` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `users_groups_down`(IN p_id INT, OUT res INT)
BEGIN
DECLARE f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev INT DEFAULT 0;
SET res=0;
SELECT ug_lk,i_ug_rk,ug_level
INTO f_lft,f_rgt,f_lev
FROM `users_groups`
WHERE ug_id=p_id;
SELECT ug_lk,ug_rk,ug_level
INTO t_lft,t_rgt,t_lev
FROM `users_groups`
WHERE ug_lk<f_lft AND ug_rk>f_rgt AND ug_level<f_lev
ORDER BY ug_level DESC
LIMIT 1;
IF t_rgt-t_lft>f_rgt-f_lft THEN
IF f_rgt+1<t_rgt THEN
SELECT ug_lk,ug_rk,ug_level
INTO t_lft,t_rgt,t_lev
FROM `users_groups`
WHERE ug_level=f_lev AND ug_lk>t_lft AND ug_rk<t_rgt AND ug_lk>f_rgt
ORDER BY ug_lk ASC
LIMIT 1;
SET t_lft=t_rgt;
SET t_rgt=t_rgt+1;
ELSE
SELECT ug_lk,ug_rk,ug_level
INTO t_lft,t_rgt,t_lev
FROM `users_groups`
WHERE ug_level=f_lev AND ug_lk>t_lft AND ug_rk<t_rgt
ORDER BY ug_lk ASC
LIMIT 1;
SET t_rgt=t_lft;
SET t_lft=t_lft-1;
END IF;
CALL `users_groups_relocate`(f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev-1,res);
END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `users_groups_move` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `users_groups_move`(IN f_id INT, IN t_id INT, OUT res INT)
BEGIN
DECLARE f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev,done INT DEFAULT 0;
DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;
DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
SET res=0;
SET max_sp_recursion_depth=1;
START TRANSACTION;
SET done=0;
SELECT ug_lk,ug_rk,ug_level
INTO f_lft,f_rgt,f_lev
FROM `users_groups`
WHERE ug_id=f_id;
IF t_id=0 THEN
SELECT IFNULL(MIN(ug_lk),1)-1,IFNULL(MAX(ug_rk),2)+1,0
INTO t_lft,t_rgt,t_lev
FROM `users_groups`;
ELSE
SELECT ug_lk,ug_rk,ug_level
INTO t_lft,t_rgt,t_lev
FROM `users_groups`
WHERE ug_id=t_id;
END IF;
IF NOT done THEN
UPDATE `users_groups`
SET ug_pid=t_id
WHERE ug_id=f_id;
CALL `users_groups_relocate`(f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev,res);
END IF;
IF res=0 THEN
ROLLBACK;
ELSE
COMMIT;
END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `users_groups_relocate` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `users_groups_relocate`(IN f_lft INT, IN f_rgt INT, IN f_lev INT, IN t_lft INT, IN t_rgt INT, IN t_lev INT, OUT res INT)
BEGIN
DECLARE count_pos,mv_level,mv_pos INT DEFAULT 0;
DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
SET res=0;
START TRANSACTION;
IF f_lft<f_rgt AND t_lft<t_rgt AND (f_lft>t_rgt OR f_rgt<t_rgt) THEN
SET count_pos=f_rgt-f_lft+1;
SET mv_level=f_lev-t_lev-1;

IF f_lft>t_rgt THEN
SET mv_pos=f_lft-t_rgt+count_pos;
UPDATE `users_groups`
SET
ug_rk = ug_rk+count_pos,
ug_lk = IF(ug_lk > t_lft, ug_lk+count_pos, ug_lk)
WHERE ug_rk >= t_rgt;
UPDATE `users_groups`
SET ug_rk = ug_rk - mv_pos
WHERE ug_lk >= (f_lft + count_pos) AND ug_rk <= (f_rgt + count_pos);
UPDATE `users_groups`
SET
ug_lk = ug_lk - mv_pos,
ug_level = ug_level - mv_level
WHERE ug_lk >= (f_lft+count_pos) AND ug_rk <= (t_rgt+count_pos);
UPDATE `users_groups`
SET
ug_rk = ug_rk - count_pos,
ug_lk = IF(ug_lk > (f_rgt+count_pos), ug_lk - count_pos, ug_lk)
WHERE ug_rk > (f_rgt+count_pos);
ELSE
SET mv_pos = f_lft - t_rgt;
UPDATE `users_groups`
SET
ug_rk = ug_rk + count_pos,
ug_lk = IF(ug_lk > t_lft, ug_lk + count_pos, ug_lk)
WHERE ug_rk >= t_rgt;
UPDATE `users_groups`
SET ug_lk = ug_lk - mv_pos
WHERE ug_lk >= f_lft AND ug_rk <= f_rgt;
UPDATE `users_groups`
SET
ug_rk = ug_rk - mv_pos,
ug_level = ug_level - mv_level
WHERE ug_lk >= t_rgt AND ug_rk <= f_rgt;
UPDATE `users_groups`
SET ug_rk = ug_rk - count_pos,
ug_lk = IF(ug_lk > f_rgt, ug_lk - count_pos, ug_lk)
WHERE ug_rk>f_rgt;
END IF;
END IF;
SET res=1;
COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `users_groups_up` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `users_groups_up`(IN p_id INT, OUT res INT)
BEGIN
DECLARE f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev INT DEFAULT 0;
SET res=0;
SELECT ug_lk,ug_rk,ug_level
INTO f_lft,f_rgt,f_lev
FROM `users_groups`
WHERE ug_id=p_id;
SELECT ug_lk,ug_rk,ug_level
INTO t_lft,t_rgt,t_lev
FROM `users_groups`
WHERE ug_lk<f_lft AND ug_rk>f_rgt AND ug_level<f_lev
ORDER BY ug_level DESC
LIMIT 1;
IF t_rgt-t_lft>f_rgt-f_lft THEN
IF f_lft-1>t_lft THEN
SELECT ug_lk,ug_rk,ug_level
INTO t_lft,t_rgt,t_lev
FROM `users_groups`
WHERE ug_level=f_lev AND ug_lk>t_lft AND ug_rk<t_rgt AND ug_rk<f_lft
ORDER BY ug_rk DESC
LIMIT 1;
SET t_rgt=t_lft;
SET t_lft=t_lft-1;
ELSE
SELECT ug_lk,ug_rk,ug_level
INTO t_lft,t_rgt,t_lev
FROM `users_groups`
WHERE ug_level=f_lev AND ug_lk>t_lft AND ug_rk<t_rgt
ORDER BY ug_rk DESC
LIMIT 1;
SET t_lft=t_rgt;
SET t_rgt=t_rgt+1;
END IF;
CALL `users_groups_relocate`(f_lft,f_rgt,f_lev,t_lft,t_rgt,t_lev-1,res);
END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `users_groups_update` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`mc`@`%` PROCEDURE `users_groups_update`(IN inId INT, IN inPid INT, IN inAftecId INT, IN inPath VARCHAR(255), IN inName VARCHAR(100), IN inDesc TEXT, IN inOnRegister INT, OUT res INT)
BEGIN
	DECLARE cPid, cId, cLk, cRk, bIntoSelf INT DEFAULT 0;
	
	DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;
	SET res=0;
	
	SELECT 
	ug_lk, ug_rk INTO cLk, cRk
	FROM `users_groups`
	WHERE ug_id = inId;
	
	SELECT EXISTS (
		SELECT 1 
		FROM `users_groups`
		WHERE inPid IN
		(SELECT ug_id 
		FROM `users_groups`
		WHERE ug_lk >= cLk
		AND ug_rk <= cRk)
	) INTO bIntoSelf;
	
	START TRANSACTION;
	
	UPDATE `users_groups`
	SET
	ug_path	= inPath,
	ug_name	= inName,
	ug_desc	= inDesc,
    ug_on_register = inOnRegister
	WHERE ug_id = inId;
	
	
	if bIntoSelf=1 THEN
		SET res = 1;
		Commit;
	ELSE
		CALL users_groups_move(inId, inPid, res);
		
		IF res=1 THEN
			CALL users_groups_after(inId, inAftecId, res);
		END IF;	
		
		IF res=0 THEN
			ROLLBACK;
		ELSE
			COMMIT;
		END IF;
	END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2016-12-21 13:26:30
