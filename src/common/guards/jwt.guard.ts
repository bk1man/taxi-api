import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Token未提供');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      
      // 将用户信息附加到请求对象上
      request.user = payload;
      
      // 检查是否需要验证用户状态
      const requireActive = this.reflector.get<boolean>('requireActive', context.getHandler());
      if (requireActive && !payload.isActive) {
        throw new UnauthorizedException('用户账户未激活');
      }
      
      return true;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token已过期');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token无效');
      }
      throw new UnauthorizedException(error.message || 'Token验证失败');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}