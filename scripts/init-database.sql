-- 出租车电召系统数据库初始化脚本
-- 数据库名称: taxi

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `taxi` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `taxi`;

-- 用户表结构
CREATE TABLE IF NOT EXISTS `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码',
  `nickname` varchar(50) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) NOT NULL COMMENT '手机号',
  `role` varchar(20) NOT NULL DEFAULT 'passenger' COMMENT '角色: passenger/driver/admin',
  `status` varchar(20) NOT NULL DEFAULT 'active' COMMENT '状态: active/inactive/banned',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_78a916df40e02a9deb1c4b75ed` (`username`),
  UNIQUE KEY `IDX_8e1f623608093af50651bcb507` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 司机表结构
CREATE TABLE IF NOT EXISTS `driver` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '关联用户ID',
  `real_name` varchar(50) NOT NULL COMMENT '真实姓名',
  `license_number` varchar(50) NOT NULL COMMENT '驾驶证号',
  `plate_number` varchar(20) NOT NULL COMMENT '车牌号',
  `car_model` varchar(50) DEFAULT NULL COMMENT '车型',
  `car_color` varchar(20) DEFAULT NULL COMMENT '车身颜色',
  `status` varchar(20) NOT NULL DEFAULT 'offline' COMMENT '状态: offline/online/busy',
  `rating` decimal(3,2) DEFAULT '5.00' COMMENT '评分',
  `total_orders` int(11) DEFAULT '0' COMMENT '总订单数',
  `location_lat` decimal(10,8) DEFAULT NULL COMMENT '当前纬度',
  `location_lng` decimal(11,8) DEFAULT NULL COMMENT '当前经度',
  `last_location_update` datetime(6) DEFAULT NULL COMMENT '最后位置更新时间',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `REL_4b4b7f2b7b5b5b5b5b5b5b5b5` (`user_id`),
  UNIQUE KEY `IDX_4b4b7f2b7b5b5b5b5b5b5b5b5` (`license_number`),
  KEY `FK_4b4b7f2b7b5b5b5b5b5b5b5b5b` (`user_id`),
  CONSTRAINT `FK_4b4b7f2b7b5b5b5b5b5b5b5b5b` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='司机表';

-- 订单表结构
CREATE TABLE IF NOT EXISTS `order` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) NOT NULL COMMENT '订单号',
  `passenger_id` int(11) NOT NULL COMMENT '乘客ID',
  `driver_id` int(11) DEFAULT NULL COMMENT '司机ID',
  `pickup_location` varchar(255) NOT NULL COMMENT '上车地点',
  `pickup_lat` decimal(10,8) NOT NULL COMMENT '上车纬度',
  `pickup_lng` decimal(11,8) NOT NULL COMMENT '上车经度',
  `dropoff_location` varchar(255) DEFAULT NULL COMMENT '下车地点',
  `dropoff_lat` decimal(10,8) DEFAULT NULL COMMENT '下车纬度',
  `dropoff_lng` decimal(11,8) DEFAULT NULL COMMENT '下车经度',
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT '状态: pending/accepted/picked_up/dropped_off/completed/cancelled',
  `estimated_price` decimal(10,2) DEFAULT NULL COMMENT '预估价格',
  `actual_price` decimal(10,2) DEFAULT NULL COMMENT '实际价格',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `accepted_at` datetime(6) DEFAULT NULL COMMENT '接单时间',
  `picked_up_at` datetime(6) DEFAULT NULL COMMENT '上车时间',
  `dropped_off_at` datetime(6) DEFAULT NULL COMMENT '下车时间',
  `completed_at` datetime(6) DEFAULT NULL COMMENT '完成时间',
  `cancelled_at` datetime(6) DEFAULT NULL COMMENT '取消时间',
  `cancel_reason` varchar(255) DEFAULT NULL COMMENT '取消原因',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_3d3d3d3d3d3d3d3d3d3d3d3d` (`order_number`),
  KEY `FK_3d3d3d3d3d3d3d3d3d3d3d3d3` (`passenger_id`),
  KEY `FK_3d3d3d3d3d3d3d3d3d3d3d3d4` (`driver_id`),
  CONSTRAINT `FK_3d3d3d3d3d3d3d3d3d3d3d3d3` FOREIGN KEY (`passenger_id`) REFERENCES `user` (`id`),
  CONSTRAINT `FK_3d3d3d3d3d3d3d3d3d3d3d3d4` FOREIGN KEY (`driver_id`) REFERENCES `driver` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 活动表结构
CREATE TABLE IF NOT EXISTS `activity` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL COMMENT '用户ID（可为空）',
  `driver_id` int(11) DEFAULT NULL COMMENT '司机ID（可为空）',
  `type` varchar(20) NOT NULL COMMENT '类型: system/order/driver/passenger',
  `title` varchar(100) NOT NULL COMMENT '标题',
  `content` text COMMENT '内容',
  `level` varchar(20) NOT NULL DEFAULT 'info' COMMENT '级别: info/warning/error',
  `is_read` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否已读',
  `read_at` datetime(6) DEFAULT NULL COMMENT '阅读时间',
  `related_order_id` int(11) DEFAULT NULL COMMENT '关联订单ID',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_2d2d2d2d2d2d2d2d2d2d2d2d2d` (`user_id`),
  KEY `FK_2d2d2d2d2d2d2d2d2d2d2d2d3` (`driver_id`),
  KEY `FK_2d2d2d2d2d2d2d2d2d2d2d2d4` (`related_order_id`),
  CONSTRAINT `FK_2d2d2d2d2d2d2d2d2d2d2d2d2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_2d2d2d2d2d2d2d2d2d2d2d2d3` FOREIGN KEY (`driver_id`) REFERENCES `driver` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_2d2d2d2d2d2d2d2d2d2d2d2d4` FOREIGN KEY (`related_order_id`) REFERENCES `order` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动表';

-- 插入测试数据
-- 管理员用户
INSERT INTO `user` (`username`, `password`, `nickname`, `phone`, `role`, `status`) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '管理员', '13800138000', 'admin', 'active');

-- 测试乘客
INSERT INTO `user` (`username`, `password`, `nickname`, `phone`, `role`, `status`) VALUES
('passenger1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '乘客1', '13800138001', 'passenger', 'active'),
('passenger2', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '乘客2', '13800138002', 'passenger', 'active');

-- 测试司机
INSERT INTO `user` (`username`, `password`, `nickname`, `phone`, `role`, `status`) VALUES
('driver1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '司机1', '13800138003', 'driver', 'active'),
('driver2', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '司机2', '13800138004', 'driver', 'active');

-- 司机详细信息
INSERT INTO `driver` (`user_id`, `real_name`, `license_number`, `plate_number`, `car_model`, `car_color`, `status`, `rating`) VALUES
(4, '张三', 'A123456789', '京A12345', '丰田凯美瑞', '黑色', 'offline', 4.80),
(5, '李四', 'B987654321', '京B67890', '本田雅阁', '白色', 'offline', 4.90);

-- 系统活动消息
INSERT INTO `activity` (`user_id`, `type`, `title`, `content`, `level`) VALUES
(NULL, 'system', '系统维护通知', '系统将于今晚12点进行维护，预计持续2小时', 'warning'),
(NULL, 'system', '新功能上线', '实时位置分享功能已上线，欢迎使用', 'info');

-- 创建索引优化查询
CREATE INDEX `idx_user_role` ON `user` (`role`);
CREATE INDEX `idx_user_status` ON `user` (`status`);
CREATE INDEX `idx_driver_status` ON `driver` (`status`);
CREATE INDEX `idx_order_status` ON `order` (`status`);
CREATE INDEX `idx_order_passenger` ON `order` (`passenger_id`);
CREATE INDEX `idx_order_driver` ON `order` (`driver_id`);
CREATE INDEX `idx_activity_user` ON `activity` (`user_id`);
CREATE INDEX `idx_activity_driver` ON `activity` (`driver_id`);
CREATE INDEX `idx_activity_type` ON `activity` (`type`);
CREATE INDEX `idx_activity_read` ON `activity` (`is_read`);

-- 查看表结构
SHOW TABLES;

-- 查看数据
SELECT '用户表' as table_name, COUNT(*) as count FROM `user`
UNION ALL
SELECT '司机表' as table_name, COUNT(*) as count FROM `driver`
UNION ALL
SELECT '订单表' as table_name, COUNT(*) as count FROM `order`
UNION ALL
SELECT '活动表' as table_name, COUNT(*) as count FROM `activity`;