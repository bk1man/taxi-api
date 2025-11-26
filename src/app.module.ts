import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '@/modules/user/user.module';
import { DriverModule } from '@/modules/driver/driver.module';
import { OrderModule } from '@/modules/order/order.module';
import { ActivityModule } from '@/modules/activity/activity.module';
import { User } from '@/modules/user/user.entity';
import { Driver } from '@/modules/driver/driver.entity';
import { Order } from '@/modules/order/order.entity';
import { Activity } from '@/modules/activity/activity.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'taxi',
      entities: [User, Driver, Order, Activity],
      synchronize: true, // 开发环境使用，生产环境请关闭
      logging: process.env.NODE_ENV === 'development',
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
    UserModule,
    DriverModule,
    OrderModule,
    ActivityModule,
  ],
})
export class AppModule {}
