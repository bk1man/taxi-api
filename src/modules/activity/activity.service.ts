import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Activity, ActivityType, ActivityLevel } from './activity.entity';

export interface CreateActivityDto {
  userId: number;
  type: ActivityType;
  level: ActivityLevel;
  title: string;
  content: string;
  relatedId?: number;
  relatedType?: string;
  metadata?: any;
}

export interface UpdateActivityDto {
  title?: string;
  content?: string;
  level?: ActivityLevel;
  isRead?: boolean;
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
  ) {}

  // 创建活动记录
  async create(createActivityDto: CreateActivityDto): Promise<Activity> {
    const activity = this.activityRepository.create({
      ...createActivityDto,
      createdAt: new Date(),
      isRead: false,
    });

    return await this.activityRepository.save(activity);
  }

  // 获取用户的活动列表
  async findByUserId(
    userId: number,
    page = 1,
    limit = 10,
    isRead?: boolean,
  ): Promise<{
    activities: Activity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId })
      .orderBy('activity.createdAt', 'DESC');

    if (isRead !== undefined) {
      queryBuilder.andWhere('activity.isRead = :isRead', { isRead });
    }

    const [activities, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      activities,
      total,
      page,
      limit,
    };
  }

  // 获取未读活动数量
  async getUnreadCount(userId: number): Promise<number> {
    return await this.activityRepository.count({
      where: { userId, isRead: false },
    });
  }

  // 标记活动为已读
  async markAsRead(id: number, userId: number): Promise<Activity> {
    const activity = await this.activityRepository.findOne({
      where: { id, userId },
    });

    if (!activity) {
      throw new NotFoundException('活动记录不存在');
    }

    activity.isRead = true;
    activity.readAt = new Date();

    return await this.activityRepository.save(activity);
  }

  // 标记所有活动为已读
  async markAllAsRead(userId: number): Promise<void> {
    await this.activityRepository
      .createQueryBuilder()
      .update(Activity)
      .set({ isRead: true, readAt: new Date() })
      .where('userId = :userId', { userId })
      .andWhere('isRead = :isRead', { isRead: false })
      .execute();
  }

  // 删除活动记录
  async delete(id: number, userId: number): Promise<void> {
    const result = await this.activityRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('活动记录不存在');
    }
  }

  // 批量删除活动记录
  async deleteBatch(ids: number[], userId: number): Promise<void> {
    await this.activityRepository
      .createQueryBuilder()
      .delete()
      .from(Activity)
      .where('id IN (:...ids)', { ids })
      .andWhere('userId = :userId', { userId })
      .execute();
  }

  // 获取所有活动（管理员）
  async findAll(
    page = 1,
    limit = 10,
    type?: ActivityType,
    level?: ActivityLevel,
    userId?: number,
  ): Promise<{
    activities: Activity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .orderBy('activity.createdAt', 'DESC');

    if (type) {
      queryBuilder.andWhere('activity.type = :type', { type });
    }

    if (level) {
      queryBuilder.andWhere('activity.level = :level', { level });
    }

    if (userId) {
      queryBuilder.andWhere('activity.userId = :userId', { userId });
    }

    const [activities, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      activities,
      total,
      page,
      limit,
    };
  }

  // 创建系统通知
  async createSystemNotification(
    title: string,
    content: string,
    level: ActivityLevel = ActivityLevel.INFO,
  ): Promise<Activity> {
    // 系统通知的 userId 为 0，表示所有用户
    const activity = this.activityRepository.create({
      userId: 0,
      type: ActivityType.SYSTEM,
      level,
      title,
      content,
      createdAt: new Date(),
      isRead: false,
    });

    return await this.activityRepository.save(activity);
  }

  // 创建订单通知
  async createOrderNotification(
    userId: number,
    orderId: number,
    title: string,
    content: string,
    level: ActivityLevel = ActivityLevel.INFO,
  ): Promise<Activity> {
    const activity = this.activityRepository.create({
      userId,
      type: ActivityType.ORDER,
      level,
      title,
      content,
      relatedId: orderId,
      relatedType: 'order',
      createdAt: new Date(),
      isRead: false,
    });

    return await this.activityRepository.save(activity);
  }

  // 创建司机通知
  async createDriverNotification(
    userId: number,
    driverId: number,
    title: string,
    content: string,
    level: ActivityLevel = ActivityLevel.INFO,
  ): Promise<Activity> {
    const activity = this.activityRepository.create({
      userId,
      type: ActivityType.DRIVER,
      level,
      title,
      content,
      relatedId: driverId,
      relatedType: 'driver',
      createdAt: new Date(),
      isRead: false,
    });

    return await this.activityRepository.save(activity);
  }

  // 创建乘客通知
  async createPassengerNotification(
    userId: number,
    passengerId: number,
    title: string,
    content: string,
    level: ActivityLevel = ActivityLevel.INFO,
  ): Promise<Activity> {
    const activity = this.activityRepository.create({
      userId,
      type: ActivityType.PASSENGER,
      level,
      title,
      content,
      relatedId: passengerId,
      relatedType: 'passenger',
      createdAt: new Date(),
      isRead: false,
    });

    return await this.activityRepository.save(activity);
  }

  // 获取最近的活动（按时间范围）
  async getRecentActivities(
    userId: number,
    days = 7,
  ): Promise<Activity[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId })
      .orWhere('activity.userId = 0') // 系统通知
      .andWhere('activity.createdAt >= :startDate', { startDate })
      .orderBy('activity.createdAt', 'DESC')
      .getMany();
  }

  // 获取活动统计
  async getActivityStats(userId: number): Promise<{
    totalActivities: number;
    unreadCount: number;
    todayActivities: number;
    typeStats: Record<string, number>;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalActivities,
      unreadCount,
      todayActivities,
      typeStats,
    ] = await Promise.all([
      this.activityRepository.count({ where: { userId } }),
      this.activityRepository.count({ where: { userId, isRead: false } }),
      this.activityRepository.count({
        where: { userId, createdAt: MoreThan(today) },
      }),
      this.activityRepository
        .createQueryBuilder('activity')
        .select('activity.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .where('activity.userId = :userId', { userId })
        .groupBy('activity.type')
        .getRawMany()
        .then(results => {
          const stats = {};
          results.forEach(result => {
            stats[result.type] = parseInt(result.count);
          });
          return stats;
        }),
    ]);

    return {
      totalActivities,
      unreadCount,
      todayActivities,
      typeStats,
    };
  }
}