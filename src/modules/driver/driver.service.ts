import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Driver, DriverStatus, DriverVerifyStatus } from './driver.entity';
import { User, UserRole } from '@/modules/user/user.entity';

export { DriverStatus } from './driver.entity';
import { UserService } from '@/modules/user/user.service';

export interface CreateDriverDto {
  userId: number;
  realName: string;
  idCard: string;
  phone: string;
  carModel: string;
  carColor: string;
  carPlate: string;
  licenseNumber: string;
  experience: number;
}

export interface UpdateDriverDto {
  realName?: string;
  phone?: string;
  carModel?: string;
  carColor?: string;
  carPlate?: string;
  licenseNumber?: string;
  experience?: number;
  status?: DriverStatus;
  verifyStatus?: DriverVerifyStatus;
}

export interface LocationUpdateDto {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userService: UserService,
  ) {}

  // 创建司机信息
  async create(createDriverDto: CreateDriverDto): Promise<Driver> {
    const { userId, realName, idCard, phone, carModel, carColor, carPlate, licenseNumber, experience } = createDriverDto;

    // 检查用户是否存在且为乘客角色
    const currentUser = await this.userService.findById(userId);
    if (currentUser.role !== UserRole.PASSENGER) {
      throw new BadRequestException('用户已经是司机或其他角色');
    }

    // 检查手机号是否已被其他司机使用
    const existingDriver = await this.driverRepository.findOne({ where: { user: { phone } } });
    if (existingDriver) {
      throw new ConflictException('手机号已被其他司机使用');
    }

    // 检查车牌号是否已存在
    const existingCar = await this.driverRepository.findOne({ where: { carPlate } });
    if (existingCar) {
      throw new ConflictException('车牌号已存在');
    }

    // 创建司机信息
    const driver = this.driverRepository.create({
      userId,
      licenseNumber,
      licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 默认一年后过期
      vehicleBrand: '未知品牌',
      vehicleModel: carModel || '未知型号',
      vehicleColor: carColor || '未知颜色',
      vehicleSeats: 5,
      vehicleYear: new Date().getFullYear(),
      carPlate,
      status: DriverStatus.OFFLINE,
      verifyStatus: DriverVerifyStatus.PENDING,
      rating: 5.0,
      totalOrders: 0,
      totalTrips: 0,
      completedOrders: 0,
      completedTrips: 0,
      cancelledOrders: 0,
      cancelledTrips: 0,
      totalIncome: 0,
      thisMonthIncome: 0,
      thisWeekIncome: 0,
      todayIncome: 0,
      totalEarnings: 0,
      commissionOwed: 0,
    });

    const savedDriver = await this.driverRepository.save([driver]);
    const driverData = savedDriver[0];

    // 更新用户角色为司机
    const userData = await this.userService.findById(userId);
    userData.role = UserRole.DRIVER;
    userData.realName = createDriverDto.realName;
    await this.userRepository.save([userData]);

    return driverData;
  }

  // 获取所有司机
  async findAll(
    page = 1,
    limit = 10,
    status?: DriverStatus,
    verifyStatus?: DriverVerifyStatus,
  ): Promise<{
    drivers: Driver[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.driverRepository.createQueryBuilder('driver');

    if (status) {
      queryBuilder.andWhere('driver.status = :status', { status });
    }

    if (verifyStatus) {
      queryBuilder.andWhere('driver.verifyStatus = :verifyStatus', { verifyStatus });
    }

    const [drivers, total] = await queryBuilder
      .leftJoinAndSelect('driver.user', 'user')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('driver.createdAt', 'DESC')
      .getManyAndCount();

    return {
      drivers,
      total,
      page,
      limit,
    };
  }

  // 根据ID查找司机
  async findById(id: number): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!driver) {
      throw new NotFoundException('司机不存在');
    }
    return driver;
  }

  // 根据用户ID查找司机
  async findByUserId(userId: number): Promise<Driver | null> {
    return await this.driverRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  // 更新司机信息
  async update(id: number, updateDriverDto: UpdateDriverDto): Promise<Driver> {
    const driver = await this.findById(id);

    // 如果更新手机号，检查是否已被使用
    if (updateDriverDto.phone && updateDriverDto.phone !== driver.user.phone) {
      const existingUser = await this.userService.findByPhone(updateDriverDto.phone);
      if (existingUser) {
        throw new ConflictException('手机号已被其他用户使用');
      }
    }

    // 如果更新车牌号，检查是否已存在
    if (updateDriverDto.carPlate && updateDriverDto.carPlate !== driver.carPlate) {
      const existingCar = await this.driverRepository.findOne({ 
        where: { carPlate: updateDriverDto.carPlate } 
      });
      if (existingCar) {
        throw new ConflictException('车牌号已存在');
      }
    }

    // 更新用户信息
    if (updateDriverDto.phone || updateDriverDto.realName) {
      const userUpdateData: any = {};
      if (updateDriverDto.phone) userUpdateData.phone = updateDriverDto.phone;
      if (updateDriverDto.realName) userUpdateData.realName = updateDriverDto.realName;
      await this.userService.update(driver.userId, userUpdateData);
    }

    // 更新司机信息
    const driverUpdateData = { ...updateDriverDto };
    delete driverUpdateData.phone;
    delete driverUpdateData.realName;
    Object.assign(driver, driverUpdateData);
    return await this.driverRepository.save(driver);
  }

  // 更新司机位置
  async updateLocation(driverId: number, locationUpdate: LocationUpdateDto): Promise<Driver> {
    const driver = await this.findById(driverId);

    driver.currentLatitude = locationUpdate.latitude;
    driver.currentLongitude = locationUpdate.longitude;
    driver.locationAccuracy = locationUpdate.accuracy || null;
    driver.lastLocationUpdate = new Date();

    return await this.driverRepository.save(driver);
  }

  // 更新司机状态
  async updateStatus(id: number, status: DriverStatus): Promise<Driver> {
    const driver = await this.findById(id);
    
    // 检查状态转换是否合理
    if (driver.status === DriverStatus.BUSY && status === DriverStatus.ONLINE) {
      throw new BadRequestException('行程中不能切换为在线状态');
    }

    driver.status = status;
    
    // 如果是上线状态，更新上线时间
    if (status === DriverStatus.ONLINE) {
      driver.onlineAt = new Date();
    } else if (status === DriverStatus.OFFLINE) {
      // 如果是下线状态，更新下线时间
      driver.offlineAt = new Date();
    }

    return await this.driverRepository.save(driver);
  }

  // 更新司机审核状态
  async updateVerifyStatus(id: number, verifyStatus: DriverVerifyStatus): Promise<Driver> {
    const driver = await this.findById(id);
    driver.verifyStatus = verifyStatus;
    
    // 如果审核通过，设置审核时间
    if (verifyStatus === DriverVerifyStatus.APPROVED) {
      driver.verifiedAt = new Date();
    }

    return await this.driverRepository.save(driver);
  }

  // 获取附近的在线司机
  async findNearbyDrivers(
    latitude: number,
    longitude: number,
    radiusKm = 5,
    limit = 10,
  ): Promise<Driver[]> {
    const radius = radiusKm / 6371; // 转换为弧度

    const queryBuilder = this.driverRepository
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.user', 'user')
      .where('driver.status = :status', { status: DriverStatus.ONLINE })
      .andWhere('driver.verifyStatus = :verifyStatus', { verifyStatus: DriverVerifyStatus.APPROVED })
      .andWhere(
        `(
          6371 * acos(
            cos(radians(:latitude)) * cos(radians(driver.currentLatitude)) *
            cos(radians(driver.currentLongitude) - radians(:longitude)) +
            sin(radians(:latitude)) * sin(radians(driver.currentLatitude))
          )
        ) <= :radiusKm`,
        { latitude, longitude, radiusKm },
      )
      .orderBy('driver.rating', 'DESC')
      .addOrderBy('driver.completedOrders', 'DESC')
      .limit(limit);

    return await queryBuilder.getMany();
  }

  // 更新司机评分
  async updateRating(driverId: number, newRating: number): Promise<Driver> {
    const driver = await this.findById(driverId);

    // 计算新的平均评分（简单实现）
    if (driver.totalOrders === 0) {
      driver.rating = newRating;
    } else {
      driver.rating = ((driver.rating * driver.totalOrders) + newRating) / (driver.totalOrders + 1);
    }

    return await this.driverRepository.save(driver);
  }

  // 更新司机收入
  async updateIncome(driverId: number, amount: number): Promise<Driver> {
    const driver = await this.findById(driverId);

    driver.totalIncome += amount;
    driver.thisMonthIncome += amount;
    driver.thisWeekIncome += amount;
    driver.todayIncome += amount;

    return await this.driverRepository.save(driver);
  }

  // 更新订单统计
  async updateOrderStats(driverId: number, isCompleted: boolean): Promise<Driver> {
    const driver = await this.findById(driverId);

    driver.totalOrders += 1;
    if (isCompleted) {
      driver.completedOrders += 1;
      driver.completedTrips += 1;
    } else {
      driver.cancelledOrders += 1;
      driver.cancelledTrips += 1;
    }

    return await this.driverRepository.save(driver);
  }

  // 获取司机统计信息
  async getDriverStats(): Promise<{
    totalDrivers: number;
    onlineDrivers: number;
    verifiedDrivers: number;
    pendingDrivers: number;
    avgRating: number;
  }> {
    const [
      totalDrivers,
      onlineDrivers,
      verifiedDrivers,
      pendingDrivers,
    ] = await Promise.all([
      this.driverRepository.count(),
      this.driverRepository.count({ where: { status: DriverStatus.ONLINE } }),
      this.driverRepository.count({ where: { verifyStatus: DriverVerifyStatus.APPROVED } }),
      this.driverRepository.count({ where: { verifyStatus: DriverVerifyStatus.PENDING } }),
    ]);

    // 计算平均评分
    const avgRatingResult = await this.driverRepository
      .createQueryBuilder('driver')
      .select('AVG(driver.rating)', 'avgRating')
      .where('driver.verifyStatus = :verifyStatus', { verifyStatus: DriverVerifyStatus.APPROVED })
      .getRawOne();

    const avgRating = parseFloat(avgRatingResult?.avgRating || '0');

    return {
      totalDrivers,
      onlineDrivers,
      verifiedDrivers,
      pendingDrivers,
      avgRating,
    };
  }

  // 删除司机
  async remove(id: number): Promise<void> {
    const driver = await this.findById(id);
    await this.driverRepository.remove(driver);
  }
}