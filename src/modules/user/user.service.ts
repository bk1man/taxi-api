import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from './user.entity';

export interface CreateUserDto {
  phone: string;
  password: string;
  nickname?: string;
  avatar?: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  nickname?: string;
  avatar?: string;
  email?: string;
  status?: UserStatus;
}

export interface LoginDto {
  phone: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  // 创建用户
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { phone, password, nickname, avatar, role = UserRole.PASSENGER } = createUserDto;

    // 检查手机号是否已存在
    const existingUser = await this.userRepository.findOne({ where: { phone } });
    if (existingUser) {
      throw new ConflictException('手机号已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = this.userRepository.create({
      phone,
      password: hashedPassword,
      realName: nickname || `用户${phone.slice(-4)}`,
      avatar,
      role,
      status: UserStatus.ACTIVE,
    });

    return await this.userRepository.save([user])[0];
  }

  // 用户登录
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { phone, password } = loginDto;

    // 查找用户
    const user = await this.userRepository.findOne({ where: { phone } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查用户状态
    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('账户已被禁用');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('密码错误');
    }

    // 生成JWT token
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      status: user.status,
    };

    const token = this.jwtService.sign(payload);

    // 更新最后登录时间
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return {
      user,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    };
  }

  // 根据ID查找用户
  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  // 根据手机号查找用户
  async findByPhone(phone: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { phone } });
  }

  // 获取所有用户
  async findAll(page = 1, limit = 10, role?: UserRole, status?: UserStatus): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    const [users, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return {
      users,
      total,
      page,
      limit,
    };
  }

  // 更新用户信息
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // 更新用户信息
    Object.assign(user, updateUserDto);

    return await this.userRepository.save(user);
  }

  // 修改密码
  async changePassword(id: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.findById(id);

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException('原密码错误');
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    user.password = hashedNewPassword;
    await this.userRepository.save(user);
  }

  // 重置密码
  async resetPassword(id: number, newPassword: string): Promise<void> {
    const user = await this.findById(id);

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    user.password = hashedPassword;
    await this.userRepository.save(user);
  }

  // 删除用户
  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  // 统计用户数量
  async countUsers(role?: UserRole, status?: UserStatus): Promise<number> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    return await queryBuilder.getCount();
  }

  // 获取用户统计信息
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    passengerCount: number;
    driverCount: number;
    todayNewUsers: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      passengerCount,
      driverCount,
      todayNewUsers,
    ] = await Promise.all([
      this.countUsers(),
      this.countUsers(undefined, UserStatus.ACTIVE),
      this.countUsers(UserRole.PASSENGER),
      this.countUsers(UserRole.DRIVER),
      this.userRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :today', { today })
        .getCount(),
    ]);

    return {
      totalUsers,
      activeUsers,
      passengerCount,
      driverCount,
      todayNewUsers,
    };
  }
}