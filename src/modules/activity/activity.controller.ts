import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ActivityService, CreateActivityDto, UpdateActivityDto } from './activity.service';
import { JwtAuthGuard } from '@/common/guards/jwt.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/user/user.entity';
import { ActivityType, ActivityLevel } from './activity.entity';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  // 获取我的活动列表
  @Get('my/list')
  async findMyActivities(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('isRead') isRead?: boolean,
    @Request() req,
  ) {
    const result = await this.activityService.findByUserId(
      req.user.id,
      +page,
      +limit,
      isRead,
    );

    return {
      code: 200,
      message: '获取活动列表成功',
      data: result,
    };
  }

  // 获取未读活动数量
  @Get('my/unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.activityService.getUnreadCount(req.user.id);

    return {
      code: 200,
      message: '获取未读数量成功',
      data: { count },
    };
  }

  // 标记活动为已读
  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    const activity = await this.activityService.markAsRead(+id, req.user.id);

    return {
      code: 200,
      message: '标记已读成功',
      data: activity,
    };
  }

  // 标记所有活动为已读
  @Put('mark-all-read')
  async markAllAsRead(@Request() req) {
    await this.activityService.markAllAsRead(req.user.id);

    return {
      code: 200,
      message: '标记全部已读成功',
    };
  }

  // 获取最近的活动
  @Get('recent')
  async getRecentActivities(
    @Query('days') days = 7,
    @Request() req,
  ) {
    const activities = await this.activityService.getRecentActivities(
      req.user.id,
      +days,
    );

    return {
      code: 200,
      message: '获取最近活动成功',
      data: activities,
    };
  }

  // 获取活动统计
  @Get('stats')
  async getActivityStats(@Request() req) {
    const stats = await this.activityService.getActivityStats(req.user.id);

    return {
      code: 200,
      message: '获取活动统计成功',
      data: stats,
    };
  }

  // 删除活动记录
  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    await this.activityService.delete(+id, req.user.id);

    return {
      code: 200,
      message: '删除活动记录成功',
    };
  }

  // 批量删除活动记录
  @Delete('batch')
  async deleteBatch(@Body('ids') ids: number[], @Request() req) {
    await this.activityService.deleteBatch(ids, req.user.id);

    return {
      code: 200,
      message: '批量删除活动记录成功',
    };
  }

  // 管理员获取所有活动
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('type') type?: ActivityType,
    @Query('level') level?: ActivityLevel,
    @Query('userId') userId?: number,
  ) {
    const result = await this.activityService.findAll(
      +page,
      +limit,
      type,
      level,
      userId,
    );

    return {
      code: 200,
      message: '获取活动列表成功',
      data: result,
    };
  }

  // 管理员创建系统通知
  @Post('admin/system-notification')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createSystemNotification(
    @Body() createDto: {
      title: string;
      content: string;
      level?: ActivityLevel;
    },
  ) {
    const activity = await this.activityService.createSystemNotification(
      createDto.title,
      createDto.content,
      createDto.level,
    );

    return {
      code: 200,
      message: '创建系统通知成功',
      data: activity,
    };
  }

  // 管理员创建订单通知
  @Post('admin/order-notification')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createOrderNotification(
    @Body() createDto: {
      userId: number;
      orderId: number;
      title: string;
      content: string;
      level?: ActivityLevel;
    },
  ) {
    const activity = await this.activityService.createOrderNotification(
      createDto.userId,
      createDto.orderId,
      createDto.title,
      createDto.content,
      createDto.level,
    );

    return {
      code: 200,
      message: '创建订单通知成功',
      data: activity,
    };
  }

  // 管理员创建司机通知
  @Post('admin/driver-notification')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createDriverNotification(
    @Body() createDto: {
      userId: number;
      driverId: number;
      title: string;
      content: string;
      level?: ActivityLevel;
    },
  ) {
    const activity = await this.activityService.createDriverNotification(
      createDto.userId,
      createDto.driverId,
      createDto.title,
      createDto.content,
      createDto.level,
    );

    return {
      code: 200,
      message: '创建司机通知成功',
      data: activity,
    };
  }

  // 管理员创建乘客通知
  @Post('admin/passenger-notification')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createPassengerNotification(
    @Body() createDto: {
      userId: number;
      passengerId: number;
      title: string;
      content: string;
      level?: ActivityLevel;
    },
  ) {
    const activity = await this.activityService.createPassengerNotification(
      createDto.userId,
      createDto.passengerId,
      createDto.title,
      createDto.content,
      createDto.level,
    );

    return {
      code: 200,
      message: '创建乘客通知成功',
      data: activity,
    };
  }
}