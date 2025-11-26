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
import { OrderService, CreateOrderDto, AcceptOrderDto, UpdateOrderStatusDto, RateOrderDto } from './order.service';
import { JwtAuthGuard } from '@/common/guards/jwt.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/user/user.entity';
import { OrderStatus, PayStatus } from './order.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // 创建订单
  @Post()
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    // 确保是当前用户创建订单
    createOrderDto.passengerId = req.user.id;
    
    const order = await this.orderService.create(createOrderDto);
    return {
      code: 200,
      message: '订单创建成功',
      data: order,
    };
  }

  // 获取订单详情
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const order = await this.orderService.findById(+id);
    
    // 检查权限：只能查看自己的订单或管理员
    if (req.user.role !== UserRole.ADMIN && 
        order.passengerId !== req.user.id && 
        order.driverId !== req.user.id) {
      return {
        code: 403,
        message: '无权查看此订单',
      };
    }

    return {
      code: 200,
      message: '获取订单详情成功',
      data: order,
    };
  }

  // 获取我的订单列表
  @Get('my/list')
  async findMyOrders(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Request() req,
  ) {
    const result = await this.orderService.findByUserId(
      req.user.id,
      +page,
      +limit,
    );

    return {
      code: 200,
      message: '获取订单列表成功',
      data: result,
    };
  }

  // 获取司机的订单列表
  @Get('driver/list')
  async findDriverOrders(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Request() req,
  ) {
    if (req.user.role !== UserRole.DRIVER) {
      return {
        code: 403,
        message: '只有司机可以查看此列表',
      };
    }

    const result = await this.orderService.findByDriverId(
      req.user.id,
      +page,
      +limit,
    );

    return {
      code: 200,
      message: '获取司机订单列表成功',
      data: result,
    };
  }

  // 获取待接单的订单列表（司机端）
  @Get('pending/list')
  async findPendingOrders(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const result = await this.orderService.findPendingOrders(
      +page,
      +limit,
    );

    return {
      code: 200,
      message: '获取待接单列表成功',
      data: result,
    };
  }

  // 接单
  @Post(':id/accept')
  async acceptOrder(
    @Param('id') id: string,
    @Request() req,
  ) {
    if (req.user.role !== UserRole.DRIVER) {
      return {
        code: 403,
        message: '只有司机可以接单',
      };
    }

    const order = await this.orderService.acceptOrder(+id, req.user.id);
    
    return {
      code: 200,
      message: '接单成功',
      data: order,
    };
  }

  // 司机到达
  @Post(':id/arrived')
  async driverArrived(
    @Param('id') id: string,
    @Request() req,
  ) {
    const order = await this.orderService.findById(+id);
    
    // 检查权限：只有接单的司机可以操作
    if (req.user.role !== UserRole.DRIVER || order.driverId !== req.user.id) {
      return {
        code: 403,
        message: '无权操作此订单',
      };
    }

    const updatedOrder = await this.orderService.driverArrived(+id);
    
    return {
      code: 200,
      message: '已到达上车地点',
      data: updatedOrder,
    };
  }

  // 开始行程
  @Post(':id/start')
  async startTrip(
    @Param('id') id: string,
    @Request() req,
  ) {
    const order = await this.orderService.findById(+id);
    
    // 检查权限：只有接单的司机可以操作
    if (req.user.role !== UserRole.DRIVER || order.driverId !== req.user.id) {
      return {
        code: 403,
        message: '无权操作此订单',
      };
    }

    const updatedOrder = await this.orderService.startTrip(+id);
    
    return {
      code: 200,
      message: '行程已开始',
      data: updatedOrder,
    };
  }

  // 完成行程
  @Post(':id/complete')
  async completeTrip(
    @Param('id') id: string,
    @Body('actualPrice') actualPrice: number,
    @Request() req,
  ) {
    const order = await this.orderService.findById(+id);
    
    // 检查权限：只有接单的司机可以操作
    if (req.user.role !== UserRole.DRIVER || order.driverId !== req.user.id) {
      return {
        code: 403,
        message: '无权操作此订单',
      };
    }

    const updatedOrder = await this.orderService.completeTrip(+id, actualPrice);
    
    return {
      code: 200,
      message: '行程已完成',
      data: updatedOrder,
    };
  }

  // 取消订单
  @Post(':id/cancel')
  async cancelOrder(
    @Param('id') id: string,
    @Body('cancelReason') cancelReason: string,
    @Request() req,
  ) {
    const order = await this.orderService.findById(+id);
    
    // 检查权限：乘客或司机可以取消
    if (req.user.role !== UserRole.ADMIN && 
        order.passengerId !== req.user.id && 
        order.driverId !== req.user.id) {
      return {
        code: 403,
        message: '无权操作此订单',
      };
    }

    const updatedOrder = await this.orderService.cancelOrder(
      +id,
      cancelReason,
      req.user.id,
    );
    
    return {
      code: 200,
      message: '订单已取消',
      data: updatedOrder,
    };
  }

  // 支付订单
  @Post(':id/pay')
  async payOrder(
    @Param('id') id: string,
    @Body() paymentInfo: any,
    @Request() req,
  ) {
    const order = await this.orderService.findById(+id);
    
    // 检查权限：只有乘客可以支付
    if (req.user.role !== UserRole.USER || order.passengerId !== req.user.id) {
      return {
        code: 403,
        message: '无权支付此订单',
      };
    }

    const updatedOrder = await this.orderService.payOrder(+id, paymentInfo);
    
    return {
      code: 200,
      message: '支付成功',
      data: updatedOrder,
    };
  }

  // 评价订单
  @Post(':id/rate')
  async rateOrder(
    @Param('id') id: string,
    @Body() rateOrderDto: RateOrderDto,
    @Request() req,
  ) {
    const order = await this.orderService.findById(+id);
    
    // 检查权限：乘客或司机可以评价
    if (req.user.role !== UserRole.ADMIN && 
        order.passengerId !== req.user.id && 
        order.driverId !== req.user.id) {
      return {
        code: 403,
        message: '无权评价此订单',
      };
    }

    const isPassenger = order.passengerId === req.user.id;
    const updatedOrder = await this.orderService.rateOrder(
      +id,
      isPassenger,
      rateOrderDto.rating,
      rateOrderDto.comment,
    );
    
    return {
      code: 200,
      message: '评价成功',
      data: updatedOrder,
    };
  }

  // 管理员获取所有订单
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: OrderStatus,
    @Query('orderType') orderType?: string,
    @Query('payStatus') payStatus?: PayStatus,
  ) {
    const result = await this.orderService.findAll(
      +page,
      +limit,
      status,
      orderType as any,
      payStatus,
    );

    return {
      code: 200,
      message: '获取订单列表成功',
      data: result,
    };
  }

  // 获取订单统计（管理员）
  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getOrderStats() {
    const stats = await this.orderService.getOrderStats();

    return {
      code: 200,
      message: '获取订单统计成功',
      data: stats,
    };
  }
}