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
import { Driver } from '@/modules/driver/driver.entity';

export enum OrderStatus {
  PENDING = 'pending',           // 等待接单
  ACCEPTED = 'accepted',         // 已被接受
  DRIVER_ARRIVED = 'driver_arrived', // 司机到达
  IN_PROGRESS = 'in_progress',     // 行程中
  COMPLETED = 'completed',       // 已完成
  CANCELLED = 'cancelled',       // 已取消
  TIMEOUT = 'timeout',          // 超时
}

export enum OrderType {
  IMMEDIATE = 'immediate',      // 即时订单
  RESERVED = 'reserved',        // 预约订单
}

export enum PayStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 32, unique: true })
  @Index()
  orderNo: string;

  @Column({ type: 'int' })
  passengerId: number;

  @ManyToOne(() => User, (user) => user.passengerOrders)
  passenger: User;

  @Column({ type: 'int', nullable: true })
  driverId: number;

  @ManyToOne(() => Driver, (driver) => driver.orders)
  driver: Driver;

  @Column({ type: 'enum', enum: OrderType, default: OrderType.IMMEDIATE })
  orderType: OrderType;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'enum', enum: PayStatus, default: PayStatus.UNPAID })
  payStatus: PayStatus;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  startLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  startLongitude: number;

  @Column({ length: 200 })
  startAddress: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  endLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  endLongitude: number;

  @Column({ length: 200 })
  endAddress: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedDistance: number; // 预估距离（公里）

  @Column({ type: 'int', nullable: true })
  estimatedDuration: number; // 预估时长（分钟）

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedPrice: number; // 预估价格

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualDistance: number; // 实际距离

  @Column({ type: 'int', nullable: true })
  actualDuration: number; // 实际时长

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualPrice: number; // 实际价格

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  basePrice: number; // 起步价

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  distancePrice: number; // 里程费

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  durationPrice: number; // 时长费

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  nightPrice: number; // 夜间费

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  otherPrice: number; // 其他费用

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  couponDiscount: number; // 优惠券抵扣

  @Column({ type: 'datetime', nullable: true })
  reservedAt: Date; // 预约时间

  @Column({ type: 'datetime', nullable: true })
  acceptedAt: Date; // 接单时间

  @Column({ type: 'datetime', nullable: true })
  arrivedAt: Date; // 到达时间

  @Column({ type: 'datetime', nullable: true })
  startedAt: Date; // 开始时间

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date; // 完成时间

  @Column({ type: 'datetime', nullable: true })
  cancelledAt: Date; // 取消时间

  @Column({ type: 'varchar', length: 50, nullable: true })
  cancelReason: string; // 取消原因

  @Column({ type: 'int', nullable: true })
  cancelBy: number; // 取消人ID

  @Column({ type: 'text', nullable: true })
  remark: string; // 备注

  @Column({ type: 'json', nullable: true })
  route: Array<{
    latitude: number;
    longitude: number;
    timestamp: Date;
  }>; // 行驶轨迹

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0 })
  passengerRating: number; // 乘客评分

  @Column({ type: 'text', nullable: true })
  passengerComment: string; // 乘客评价

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0 })
  driverRating: number; // 司机评分

  @Column({ type: 'text', nullable: true })
  driverComment: string; // 司机评价

  @Column({ type: 'json', nullable: true })
  paymentInfo: {
    method: string;
    transactionId: string;
    paidAt: Date;
  }; // 支付信息

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 计算订单时长（分钟）
  get duration(): number {
    if (!this.startedAt || !this.completedAt) return 0;
    return Math.round((this.completedAt.getTime() - this.startedAt.getTime()) / 60000);
  }

  // 是否可取消
  get canCancel(): boolean {
    return ['pending', 'accepted', 'driver_arrived'].includes(this.status);
  }

  // 是否已完成
  get isCompleted(): boolean {
    return this.status === OrderStatus.COMPLETED;
  }

  // 是否已支付
  get isPaid(): boolean {
    return this.payStatus === PayStatus.PAID;
  }
}