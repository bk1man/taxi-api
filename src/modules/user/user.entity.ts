import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Order } from '@/modules/order/order.entity';
import { Activity } from '@/modules/activity/activity.entity';

export enum UserRole {
  PASSENGER = 'passenger',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  @Index()
  phone: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 100 })
  password: string;

  @Column({ length: 50 })
  realName: string;

  @Column({ length: 20, nullable: true })
  idCard: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PASSENGER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'text', nullable: true })
  avatar: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'text', nullable: true })
  deviceId: string;

  @Column({ type: 'text', nullable: true })
  pushToken: string;

  @Column({ type: 'json', nullable: true })
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lastLoginIp: string;

  @Column({ type: 'json', nullable: true })
  extra: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联订单
  @OneToMany(() => Order, (order) => order.passenger)
  passengerOrders: Order[];

  // 关联活动
  @OneToMany(() => Activity, (activity) => activity.user)
  activities: Activity[];

  // 不返回密码字段
  toJSON() {
    const { password, ...rest } = this;
    return rest;
  }
}