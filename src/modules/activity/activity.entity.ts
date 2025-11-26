import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from '@/modules/user/user.entity';

export enum ActivityType {
  REGISTER = 'register',           // 注册
  LOGIN = 'login',                // 登录
  ORDER_CREATE = 'order_create',     // 创建订单
  ORDER_ACCEPT = 'order_accept',      // 接单
  ORDER_COMPLETE = 'order_complete',    // 完成订单
  PAYMENT_SUCCESS = 'payment_success',   // 支付成功
  RECHARGE = 'recharge',            // 充值
  WITHDRAW = 'withdraw',            // 提现
  PROFILE_UPDATE = 'profile_update',    // 资料更新
  LOCATION_UPDATE = 'location_update',   // 位置更新
  DRIVER_ONLINE = 'driver_online',     // 司机上线
  DRIVER_OFFLINE = 'driver_offline',    // 司机下线
  SYSTEM_NOTIFICATION = 'system_notification', // 系统通知
}

export enum ActivityLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, (user) => user.activities)
  user: User;

  @Column({ type: 'enum', enum: ActivityType })
  type: ActivityType;

  @Column({ type: 'enum', enum: ActivityLevel, default: ActivityLevel.INFO })
  level: ActivityLevel;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'json', nullable: true })
  data: Record<string, any>; // 相关数据

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  deviceId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'int', nullable: true })
  relatedId: number; // 关联ID（如订单ID）

  @Column({ type: 'varchar', length: 50, nullable: true })
  relatedType: string; // 关联类型

  @Column({ type: 'boolean', default: false })
  isRead: boolean; // 是否已读

  @Column({ type: 'datetime', nullable: true })
  readAt: Date; // 阅读时间

  @Column({ type: 'boolean', default: false })
  isImportant: boolean; // 是否重要

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date; // 过期时间

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 是否已过期
  get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  // 标记为已读
  markAsRead(): void {
    this.isRead = true;
    this.readAt = new Date();
  }

  // 获取活动类型中文名称
  get typeName(): string {
    const names = {
      [ActivityType.REGISTER]: '用户注册',
      [ActivityType.LOGIN]: '用户登录',
      [ActivityType.ORDER_CREATE]: '创建订单',
      [ActivityType.ORDER_ACCEPT]: '接单',
      [ActivityType.ORDER_COMPLETE]: '完成订单',
      [ActivityType.PAYMENT_SUCCESS]: '支付成功',
      [ActivityType.RECHARGE]: '账户充值',
      [ActivityType.WITHDRAW]: '账户提现',
      [ActivityType.PROFILE_UPDATE]: '资料更新',
      [ActivityType.LOCATION_UPDATE]: '位置更新',
      [ActivityType.DRIVER_ONLINE]: '司机上线',
      [ActivityType.DRIVER_OFFLINE]: '司机下线',
      [ActivityType.SYSTEM_NOTIFICATION]: '系统通知',
    };
    return names[this.type] || this.type;
  }
}