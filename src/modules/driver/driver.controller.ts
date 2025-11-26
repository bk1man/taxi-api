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
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { DriverService, CreateDriverDto, UpdateDriverDto, LocationUpdateDto } from './driver.service';
import { JwtAuthGuard } from '@/common/guards/jwt.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/user/user.entity';
import { DriverStatus } from './driver.entity';

@Controller('drivers')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  // 申请成为司机
  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async apply(@Request() req, @Body() createDriverDto: CreateDriverDto) {
    // 确保用户只能为自己申请
    createDriverDto.userId = req.user.sub;
    const driver = await this.driverService.create(createDriverDto);
    return {
      success: true,
      message: '申请提交成功，请等待审核',
      data: driver,
    };
  }

  // 获取当前司机信息
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req) {
    const driver = await this.driverService.findByUserId(req.user.sub);
    if (!driver) {
      return {
        success: false,
        message: '您还不是司机',
      };
    }
    return {
      success: true,
      message: '获取司机信息成功',
      data: driver,
    };
  }

  // 更新司机信息
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Request() req, @Body() updateDriverDto: UpdateDriverDto) {
    const driver = await this.driverService.findByUserId(req.user.sub);
    if (!driver) {
      return {
        success: false,
        message: '您还不是司机',
      };
    }
    const updatedDriver = await this.driverService.update(driver.id, updateDriverDto);
    return {
      success: true,
      message: '更新司机信息成功',
      data: updatedDriver,
    };
  }

  // 更新位置
  @Put('location')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateLocation(@Request() req, @Body() locationUpdate: LocationUpdateDto) {
    const driver = await this.driverService.findByUserId(req.user.sub);
    if (!driver) {
      return {
        success: false,
        message: '您还不是司机',
      };
    }
    const updatedDriver = await this.driverService.updateLocation(driver.id, locationUpdate);
    return {
      success: true,
      message: '位置更新成功',
      data: updatedDriver,
    };
  }

  // 切换在线状态
  @Put('status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateStatus(@Request() req, @Body('status') status: DriverStatus) {
    const driver = await this.driverService.findByUserId(req.user.sub);
    if (!driver) {
      return {
        success: false,
        message: '您还不是司机',
      };
    }
    const updatedDriver = await this.driverService.updateStatus(driver.id, status);
    return {
      success: true,
      message: '状态更新成功',
      data: updatedDriver,
    };
  }

  // 获取司机列表（管理员权限）
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('status') status?: DriverStatus,
    @Query('verifyStatus') verifyStatus?: string,
  ) {
    const result = await this.driverService.findAll(page, limit, status, verifyStatus as any);
    return {
      success: true,
      message: '获取司机列表成功',
      data: result,
    };
  }

  // 根据ID获取司机（管理员权限）
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const driver = await this.driverService.findById(id);
    return {
      success: true,
      message: '获取司机信息成功',
      data: driver,
    };
  }

  // 更新司机（管理员权限）
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDriverDto: UpdateDriverDto,
  ) {
    const driver = await this.driverService.update(id, updateDriverDto);
    return {
      success: true,
      message: '更新司机成功',
      data: driver,
    };
  }

  // 审核司机（管理员权限）
  @Put(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async verifyDriver(
    @Param('id', ParseIntPipe) id: number,
    @Body('verifyStatus') verifyStatus: string,
  ) {
    const driver = await this.driverService.updateVerifyStatus(id, verifyStatus as any);
    return {
      success: true,
      message: '审核状态更新成功',
      data: driver,
    };
  }

  // 获取附近司机
  @Get('nearby/search')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findNearbyDrivers(
    @Query('latitude', ParseIntPipe) latitude: number,
    @Query('longitude', ParseIntPipe) longitude: number,
    @Query('radius', new ParseIntPipe({ optional: true })) radius = 5,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    const drivers = await this.driverService.findNearbyDrivers(latitude, longitude, radius, limit);
    return {
      success: true,
      message: '获取附近司机成功',
      data: drivers,
    };
  }

  // 获取司机统计信息（管理员权限）
  @Get('stats/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getDriverStats() {
    const stats = await this.driverService.getDriverStats();
    return {
      success: true,
      message: '获取司机统计成功',
      data: stats,
    };
  }

  // 删除司机（管理员权限）
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.driverService.remove(id);
    return {
      success: true,
      message: '删除司机成功',
    };
  }
}