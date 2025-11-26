import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './order.entity';
import { UserModule } from '@/modules/user/user.module';
import { DriverModule } from '@/modules/driver/driver.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    UserModule,
    DriverModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}