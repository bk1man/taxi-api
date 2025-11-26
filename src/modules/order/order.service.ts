import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Order, OrderStatus, OrderType, PayStatus } from './order.entity';
import { UserService } from '@/modules/user/user.service';
import { DriverService } from '@/modules/driver/driver.service';
import { v4 as uuidv4 } from 'uuid';

export interface CreateOrderDto {
  passengerId: number;
  orderType?: OrderType;
  startLatitude: number;
  startLongitude: number;
  startAddress: string;
  endLatitude: number;
  endLongitude: number;
  endAddress: string;
  reservedAt?: Date;
  estimatedPrice?: number;
  remark?: string;
}

export interface AcceptOrderDto {
  driverId: number;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  cancelReason?: string;
}

export interface RateOrderDto {
  rating: number;
  comment?: string;
}

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private userService: UserService,
    private driverService: DriverService,
  ) {}

  // 创建订单
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const { passengerId, orderType = OrderType.IMMEDIATE } = createOrderDto;

    // 检查乘客是否存在
    const passenger = await this.userService.findById(passengerId);

    // 生成订单号
    const orderNo = this.generateOrderNo();

    // 创建订单
    const order = this.orderRepository.create({
      orderNo,
      ...createOrderDto,
      status: OrderStatus.PENDING,
      payStatus: PayStatus.UNPAID,
      createdAt: new Date(),
    });

    return await this.orderRepository.save(order);
  }

  // 接单
  async acceptOrder(orderId: number, driverId: number): Promise<Order> {
    const order = await this.findById(orderId);

    // 检查订单状态
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('订单状态不允许接单');
    }

    // 检查司机是否存在且已审核通过
    const driver = await this.driverService.findById(driverId);
    if (driver.verifyStatus !== 'approved') {
      throw new BadRequestException('司机未通过审核');
    }

    // 检查司机是否在线
    if (driver.status !== 'online') {
      throw new BadRequestException('司机不在线');
    }

    // 更新订单状态
    order.status = OrderStatus.ACCEPTED;
    order.driverId = driverId;
    order.acceptedAt = new Date();

    // 更新司机状态为行程中
    await this.driverService.updateStatus(driverId, 'in_ride');

    return await this.orderRepository.save(order);
  }

  // 司机到达
  async driverArrived(orderId: number): Promise<Order> {
    const order = await this.findById(orderId);

    if (order.status !== OrderStatus.ACCEPTED) {
      throw new BadRequestException('订单状态不允许此操作');
    }

    order.status = OrderStatus.DRIVER_ARRIVED;
    order.arrivedAt = new Date();

    return await this.orderRepository.save(order);
  }

  // 开始行程
  async startTrip(orderId: number): Promise<Order> {
    const order = await this.findById(orderId);

    if (order.status !== OrderStatus.DRIVER_ARRIVED) {
      throw new BadRequestException('订单状态不允许开始行程');
    }

    order.status = OrderStatus.IN_PROGRESS;
    order.startedAt = new Date();

    return await this.orderRepository.save(order);
  }

  // 完成行程
  async completeTrip(orderId: number, actualPrice: number): Promise<Order> {
    const order = await this.findById(orderId);

    if (order.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException('订单状态不允许完成行程');
    }

    order.status = OrderStatus.COMPLETED;
    order.completedAt = new Date();
    order.actualPrice = actualPrice;
    order.payStatus = PayStatus.UNPAID; // 等待支付

    // 更新司机状态为在线
    if (order.driverId) {
      await this.driverService.updateStatus(order.driverId, 'online');
      await this.driverService.updateOrderStats(order.driverId, true);
    }

    return await this.orderRepository.save(order);
  }

  // 取消订单
  async cancelOrder(orderId: number, cancelReason: string, cancelBy: number): Promise<Order> {
    const order = await this.findById(orderId);

    if (!order.canCancel) {
      throw new BadRequestException('订单状态不允许取消');
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelReason = cancelReason;
    order.cancelledAt = new Date();
    order.cancelBy = cancelBy;

    // 如果司机已接单，更新司机状态
    if (order.driverId) {
      await this.driverService.updateStatus(order.driverId, 'online');
      await this.driverService.updateOrderStats(order.driverId, false);
    }

    return await this.orderRepository.save(order);
  }

  // 支付订单
  async payOrder(orderId: number, paymentInfo: any): Promise<Order> {
    const order = await this.findById(orderId);

    if (order.payStatus !== PayStatus.UNPAID) {
      throw new BadRequestException('订单已支付或已退款');
    }

    order.payStatus = PayStatus.PAID;
    order.paymentInfo = paymentInfo;

    // 更新司机收入
    if (order.driverId) {
      await this.driverService.updateIncome(order.driverId, order.actualPrice || 0);
    }

    return await this.orderRepository.save(order);
  }

  // 评价订单
  async rateOrder(orderId: number, isPassenger: boolean, rating: number, comment?: string): Promise<Order> {
    const order = await this.findById(orderId);

    if (!order.isCompleted) {
      throw new BadRequestException('订单未完成，无法评价');
    }

    if (isPassenger) {
      order.passengerRating = rating;
      order.passengerComment = comment;
      
      // 更新司机评分
      if (order.driverId) {
        await this.driverService.updateRating(order.driverId, rating);
      }
    } else {
      order.driverRating = rating;
      order.driverComment = comment;
    }

    return await this.orderRepository.save(order);
  }

  // 根据ID查找订单
  async findById(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['passenger', 'driver'],
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    return order;
  }

  // 根据订单号查找订单
  async findByOrderNo(orderNo: string): Promise<Order | null> {
    return await this.orderRepository.findOne({
      where: { orderNo },
      relations: ['passenger', 'driver'],
    });
  }

  // 获取用户的订单列表
  async findByUserId(userId: number, page = 1, limit = 10): Promise<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [orders, total] = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.passenger', 'passenger')
      .leftJoinAndSelect('order.driver', 'driver')
      .where('order.passengerId = :userId', { userId })
      .orWhere('order.driverId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      orders,
      total,
      page,
      limit,
    };
  }

  // 获取司机的订单列表
  async findByDriverId(driverId: number, page = 1, limit = 10): Promise<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [orders, total] = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.passenger', 'passenger')
      .leftJoinAndSelect('order.driver', 'driver')
      .where('order.driverId = :driverId', { driverId })
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      orders,
      total,
      page,
      limit,
    };
  }

  // 获取待接单的订单
  async findPendingOrders(page = 1, limit = 10): Promise<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [orders, total] = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.passenger', 'passenger')
      .where('order.status = :status', { status: OrderStatus.PENDING })
      .orderBy('order.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      orders,
      total,
      page,
      limit,
    };
  }

  // 获取所有订单（管理员）
  async findAll(
    page = 1,
    limit = 10,
    status?: OrderStatus,
    orderType?: OrderType,
    payStatus?: PayStatus,
  ): Promise<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.passenger', 'passenger')
      .leftJoinAndSelect('order.driver', 'driver');

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (orderType) {
      queryBuilder.andWhere('order.orderType = :orderType', { orderType });
    }

    if (payStatus) {
      queryBuilder.andWhere('order.payStatus = :payStatus', { payStatus });
    }

    const [orders, total] = await queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      orders,
      total,
      page,
      limit,
    };
  }

  // 获取订单统计
  async getOrderStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    todayOrders: number;
    todayRevenue: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      cancelledOrders,
      todayOrders,
      todayRevenue,
    ] = await Promise.all([
      this.orderRepository.count(),
      this.orderRepository.count({ where: { status: OrderStatus.PENDING } }),
      this.orderRepository.count({ where: { status: OrderStatus.IN_PROGRESS } }),
      this.orderRepository.count({ where: { status: OrderStatus.COMPLETED } }),
      this.orderRepository.count({ where: { status: OrderStatus.CANCELLED } }),
      this.orderRepository.count({ where: { createdAt: MoreThan(today) } }),
      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.actualPrice)', 'total')
        .where('order.createdAt >= :today', { today })
        .andWhere('order.payStatus = :payStatus', { payStatus: PayStatus.PAID })
        .getRawOne()
        .then(result => parseFloat(result?.total || '0')),
    ]);

    return {
      totalOrders,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      cancelledOrders,
      todayOrders,
      todayRevenue,
    };
  }

  // 生成订单号
  private generateOrderNo(): string {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
                    (date.getMonth() + 1).toString().padStart(2, '0') +
                    date.getDate().toString().padStart(2, '0');
    const timeStr = date.getHours().toString().padStart(2, '0') +
                    date.getMinutes().toString().padStart(2, '0') +
                    date.getSeconds().toString().padStart(2, '0');
    const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
    
    return `TX${dateStr}${timeStr}${randomStr}`;
  }
}