import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Order } from '@/modules/order/order.entity';
import { User } from '@/modules/user/user.entity';

export enum DriverStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  BUSY = 'busy',
  REST = 'rest',
}

export enum DriverVerifyStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  userId: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({ length: 50 })
  licenseNumber: string;

  @Column({ type: 'date' })
  licenseExpiry: Date;

  @Column({ length: 50 })
  carPlate: string;

  @Column({ length: 50 })
  vehicleBrand: string;

  @Column({ length: 50 })
  vehicleModel: string;

  @Column({ length: 10 })
  vehicleColor: string;

  @Column({ type: 'int', default: 5 })
  vehicleSeats: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  vehicleYear: number;

  @Column({ type: 'text', nullable: true })
  vehicleImage: string;

  @Column({ type: 'text', nullable: true })
  licenseImage: string;

  @Column({ type: 'text', nullable: true })
  idCardImage: string;

  @Column({ type: 'enum', enum: DriverStatus, default: DriverStatus.OFFLINE })
  status: DriverStatus;

  @Column({ type: 'enum', enum: DriverVerifyStatus, default: DriverVerifyStatus.PENDING })
  verifyStatus: DriverVerifyStatus;

  @Column({ type: 'text', nullable: true })
  rejectReason: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLongitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  locationAccuracy: number;

  @Column({ length: 200, nullable: true })
  currentAddress: string;

  @Column({ type: 'datetime', nullable: true })
  lastLocationUpdate: Date;

  @Column({ type: 'datetime', nullable: true })
  onlineAt: Date;

  @Column({ type: 'datetime', nullable: true })
  offlineAt: Date;

  @Column({ type: 'datetime', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalOrders: number;

  @Column({ type: 'int', default: 0 })
  totalTrips: number;

  @Column({ type: 'int', default: 0 })
  completedOrders: number;

  @Column({ type: 'int', default: 0 })
  completedTrips: number;

  @Column({ type: 'int', default: 0 })
  cancelledOrders: number;

  @Column({ type: 'int', default: 0 })
  cancelledTrips: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  commissionOwed: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalIncome: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  thisMonthIncome: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  thisWeekIncome: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  todayIncome: number;

  @Column({ type: 'json', nullable: true })
  workHours: {
    start: string;
    end: string;
    days: number[];
  };

  @Column({ type: 'json', nullable: true })
  preferences: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  deviceId: string;

  @Column({ type: 'text', nullable: true })
  pushToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联订单
  @OneToMany(() => Order, (order) => order.driver)
  orders: Order[];

  // 计算接单率
  get acceptanceRate(): number {
    if (this.totalTrips === 0) return 100;
    return Math.round(((this.totalTrips - this.cancelledTrips) / this.totalTrips) * 100);
  }

  // 计算完成率
  get completionRate(): number {
    if (this.totalTrips === 0) return 100;
    return Math.round((this.completedOrders / this.totalTrips) * 100);
  }
}