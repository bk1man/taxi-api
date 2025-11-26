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
import { UserService, CreateUserDto, UpdateUserDto, LoginDto } from './user.service';
import { JwtAuthGuard } from '@/common/guards/jwt.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from './user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 用户注册
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    return {
      success: true,
      message: '注册成功',
      data: user,
    };
  }

  // 用户登录
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.userService.login(loginDto);
    return {
      success: true,
      message: '登录成功',
      data: result,
    };
  }

  // 获取当前用户信息
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req) {
    const user = await this.userService.findById(req.user.sub);
    return {
      success: true,
      message: '获取用户信息成功',
      data: user,
    };
  }

  // 更新当前用户信息
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.userService.update(req.user.sub, updateUserDto);
    return {
      success: true,
      message: '更新用户信息成功',
      data: user,
    };
  }

  // 修改密码
  @Put('password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    await this.userService.changePassword(req.user.sub, oldPassword, newPassword);
    return {
      success: true,
      message: '密码修改成功',
    };
  }

  // 获取用户列表（管理员权限）
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('role') role?: UserRole,
    @Query('status') status?: string,
  ) {
    const result = await this.userService.findAll(page, limit, role, status as any);
    return {
      success: true,
      message: '获取用户列表成功',
      data: result,
    };
  }

  // 根据ID获取用户（管理员权限）
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findById(id);
    return {
      success: true,
      message: '获取用户信息成功',
      data: user,
    };
  }

  // 更新用户（管理员权限）
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.userService.update(id, updateUserDto);
    return {
      success: true,
      message: '更新用户成功',
      data: user,
    };
  }

  // 重置密码（管理员权限）
  @Put(':id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body('password') password: string,
  ) {
    await this.userService.resetPassword(id, password);
    return {
      success: true,
      message: '密码重置成功',
    };
  }

  // 删除用户（管理员权限）
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.userService.remove(id);
    return {
      success: true,
      message: '删除用户成功',
    };
  }

  // 获取用户统计信息（管理员权限）
  @Get('stats/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getUserStats() {
    const stats = await this.userService.getUserStats();
    return {
      success: true,
      message: '获取用户统计成功',
      data: stats,
    };
  }
}