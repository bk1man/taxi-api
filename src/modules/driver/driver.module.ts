import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { Driver } from './driver.entity';
import { UserModule } from '@/modules/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Driver]),
    UserModule,
  ],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService, TypeOrmModule],
})
export class DriverModule {}