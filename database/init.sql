-- 出租车电召系统数据库初始化脚本
-- 数据库: taxi
-- 创建时间: 2024年

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS taxi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE taxi;

-- 用户表
CREATE TABLE IF NOT EXISTS `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) NOT NULL COMMENT '手机号',
  `realName` varchar(50) DEFAULT NULL COMMENT '真实姓名',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像',
  `role` enum('user','driver','admin') NOT NULL DEFAULT 'user' COMMENT '角色',
  `status` enum('active','inactive','banned') NOT NULL DEFAULT 'active' COMMENT '状态',
  `lastLoginAt` datetime DEFAULT NULL COMMENT '最后登录时间',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `phone` (`phone`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`),
  KEY `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 司机表
CREATE TABLE IF NOT EXISTS `driver` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL COMMENT '用户ID',
  `driverLicense` varchar(50) NOT NULL COMMENT '驾驶证号',
  `idCard` varchar(18) NOT NULL COMMENT '身份证号',
  `plateNumber` varchar(20) NOT NULL COMMENT '车牌号',
  `vehicleBrand` varchar(50) DEFAULT NULL COMMENT '车辆品牌',
  `vehicleModel` varchar(50) DEFAULT NULL COMMENT '车辆型号',
  `vehicleColor` varchar(20) DEFAULT NULL COMMENT '车辆颜色',
  `vehicleYear` int(4) DEFAULT NULL COMMENT '车辆年份',
  `status` enum('offline','online','busy','in_ride') NOT NULL DEFAULT 'offline' COMMENT '在线状态',
  `verifyStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT '审核状态',
  `rating` decimal(3,2) DEFAULT '0.00' COMMENT '评分',
  `totalOrders` int(11) DEFAULT '0' COMMENT '总订单数',
  `completedOrders` int(11) DEFAULT '0' COMMENT '完成订单数',
  `cancelledOrders` int(11) DEFAULT '0' COMMENT '取消订单数',
  `totalIncome` decimal(10,2) DEFAULT '0.00' COMMENT '总收入',
  `currentLatitude` decimal(10,8) DEFAULT NULL COMMENT '当前纬度',
  `currentLongitude` decimal(11,8) DEFAULT NULL COMMENT '当前经度',
  `lastLocationAt` datetime DEFAULT NULL COMMENT '最后定位时间',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`),
  UNIQUE KEY `driverLicense` (`driverLicense`),
  UNIQUE KEY `idCard` (`idCard`),
  UNIQUE KEY `plateNumber` (`plateNumber`),
  KEY `idx_status` (`status`),
  KEY `idx_verifyStatus` (`verifyStatus`),
  KEY `idx_rating` (`rating`),
  CONSTRAINT `fk_driver_user` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='司机表';

-- 订单表
CREATE TABLE IF NOT EXISTS `order` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderNo` varchar(32) NOT NULL COMMENT '订单号',
  `passengerId` int(11) NOT NULL COMMENT '乘客ID',
  `driverId` int(11) DEFAULT NULL COMMENT '司机ID',
  `orderType` enum('immediate','reserved') NOT NULL DEFAULT 'immediate' COMMENT '订单类型',
  `status` enum('pending','accepted','driver_arrived','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending' COMMENT '订单状态',
  `payStatus` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid' COMMENT '支付状态',
  `startLatitude` decimal(10,8) NOT NULL COMMENT '起点纬度',
  `startLongitude` decimal(11,8) NOT NULL COMMENT '起点经度',
  `startAddress` varchar(255) NOT NULL COMMENT '起点地址',
  `endLatitude` decimal(10,8) NOT NULL COMMENT '终点纬度',
  `endLongitude` decimal(11,8) NOT NULL COMMENT '终点经度',
  `endAddress` varchar(255) NOT NULL COMMENT '终点地址',
  `estimatedDistance` int(11) DEFAULT NULL COMMENT '预估距离（米）',
  `actualDistance` int(11) DEFAULT NULL COMMENT '实际距离（米）',
  `estimatedDuration` int(11) DEFAULT NULL COMMENT '预估时长（分钟）',
  `actualDuration` int(11) DEFAULT NULL COMMENT '实际时长（分钟）',
  `estimatedPrice` decimal(10,2) DEFAULT NULL COMMENT '预估价格',
  `actualPrice` decimal(10,2) DEFAULT NULL COMMENT '实际价格',
  `reservedAt` datetime DEFAULT NULL COMMENT '预约时间',
  `acceptedAt` datetime DEFAULT NULL COMMENT '接单时间',
  `arrivedAt` datetime DEFAULT NULL COMMENT '到达时间',
  `startedAt` datetime DEFAULT NULL COMMENT '开始时间',
  `completedAt` datetime DEFAULT NULL COMMENT '完成时间',
  `cancelledAt` datetime DEFAULT NULL COMMENT '取消时间',
  `cancelReason` varchar(255) DEFAULT NULL COMMENT '取消原因',
  `cancelBy` int(11) DEFAULT NULL COMMENT '取消人',
  `passengerRating` tinyint(1) DEFAULT NULL COMMENT '乘客评分',
  `passengerComment` text COMMENT '乘客评价',
  `driverRating` tinyint(1) DEFAULT NULL COMMENT '司机评分',
  `driverComment` text COMMENT '司机评价',
  `paymentInfo` json DEFAULT NULL COMMENT '支付信息',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `orderNo` (`orderNo`),
  KEY `idx_passengerId` (`passengerId`),
  KEY `idx_driverId` (`driverId`),
  KEY `idx_status` (`status`),
  KEY `idx_payStatus` (`payStatus`),
  KEY `idx_orderType` (`orderType`),
  KEY `idx_createdAt` (`createdAt`),
  KEY `idx_reservedAt` (`reservedAt`),
  CONSTRAINT `fk_order_passenger` FOREIGN KEY (`passengerId`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_driver` FOREIGN KEY (`driverId`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 活动表
CREATE TABLE IF NOT EXISTS `activity` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL COMMENT '用户ID',
  `type` enum('system','order','driver','passenger','payment') NOT NULL COMMENT '活动类型',
  `level` enum('info','warning','error','success') NOT NULL DEFAULT 'info' COMMENT '级别',
  `title` varchar(100) NOT NULL COMMENT '标题',
  `content` text COMMENT '内容',
  `relatedId` int(11) DEFAULT NULL COMMENT '关联ID',
  `relatedType` varchar(50) DEFAULT NULL COMMENT '关联类型',
  `metadata` json DEFAULT NULL COMMENT '元数据',
  `isRead` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已读',
  `readAt` datetime DEFAULT NULL COMMENT '阅读时间',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_userId` (`userId`),
  KEY `idx_type` (`type`),
  KEY `idx_level` (`level`),
  KEY `idx_isRead` (`isRead`),
  KEY `idx_createdAt` (`createdAt`),
  KEY `idx_related` (`relatedId`, `relatedType`),
  CONSTRAINT `fk_activity_user` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动表';

-- 插入测试数据
-- 管理员用户
INSERT INTO `user` (`username`, `password`, `email`, `phone`, `realName`, `role`, `status`) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@taxi.com', '13800138000', '管理员', 'admin', 'active');

-- 测试乘客
INSERT INTO `user` (`username`, `password`, `email`, `phone`, `realName`, `role`, `status`) VALUES
('passenger1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'passenger1@taxi.com', '13800138001', '张三', 'user', 'active'),
('passenger2', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'passenger2@taxi.com', '13800138002', '李四', 'user', 'active');

-- 测试司机
INSERT INTO `user` (`username`, `password`, `email`, `phone`, `realName`, `role`, `status`) VALUES
('driver1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver1@taxi.com', '13800138003', '王五', 'driver', 'active'),
('driver2', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver2@taxi.com', '13800138004', '赵六', 'driver', 'active');

-- 司机详细信息
INSERT INTO `driver` (`userId`, `driverLicense`, `idCard`, `plateNumber`, `vehicleBrand`, `vehicleModel`, `vehicleColor`, `vehicleYear`, `status`, `verifyStatus`, `rating`) VALUES
(4, '110101199001011234', '110101199001011234', '京A12345', '大众', '朗逸', '白色', 2020, 'online', 'approved', 4.80),
(5, '110101199002022345', '110101199002022345', '京B67890', '丰田', '卡罗拉', '黑色', 2019, 'online', 'approved', 4.90);

-- 创建索引优化查询
CREATE INDEX idx_user_phone ON user(phone);
CREATE INDEX idx_user_status ON user(status);
CREATE INDEX idx_driver_verify ON driver(verifyStatus);
CREATE INDEX idx_order_date ON order(createdAt);
CREATE INDEX idx_order_status_date ON order(status, createdAt);
CREATE INDEX idx_activity_user_read ON activity(userId, isRead);

-- 查看表结构
SHOW TABLES;

-- 查看数据
SELECT '用户表' as table_name, COUNT(*) as count FROM user
UNION ALL
SELECT '司机表' as table_name, COUNT(*) as count FROM driver
UNION ALL
SELECT '订单表' as table_name, COUNT(*) as count FROM `order`
UNION ALL
SELECT '活动表' as table_name, COUNT(*) as count FROM activity;