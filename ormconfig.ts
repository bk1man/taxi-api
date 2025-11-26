import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '@/modules/user/user.entity';
import { Driver } from '@/modules/driver/driver.entity';
import { Order } from '@/modules/order/order.entity';
import { Activity } from '@/modules/activity/activity.entity';

export const getOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get<string>('DB_HOST', '127.0.0.1'),
  port: configService.get<number>('DB_PORT', 3306),
  username: configService.get<string>('DB_USER', 'taxi'),
  password: configService.get<string>('DB_PASS', ''),
  database: configService.get<string>('DB_NAME', 'taxi'),
  entities: [User, Driver, Order, Activity],
  synchronize: configService.get<boolean>('DB_SYNC', true),
  logging: configService.get<string>('NODE_ENV') === 'development',
  charset: 'utf8mb4',
  timezone: '+08:00',
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
  },
});

export default getOrmConfig;