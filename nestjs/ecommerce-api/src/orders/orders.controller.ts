import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { type AuthUser, AuthGuard } from '../auth/auth.guards.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { idParam } from '../common/validation.js';
import { OrdersService } from './orders.service.js';

// Like the cart: logged-in users only, and the user id always comes from the token.
@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  // Takes no body: the order is built from the cart. POST's default 201 fits here.
  @Post()
  checkout(@CurrentUser() user: AuthUser) {
    return this.orders.checkout(user.id);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.orders.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', { schema: idParam }) id: number,
  ) {
    return this.orders.findOne(user.id, id);
  }

  // Cancelling changes an order rather than creating one, so 200, not 201.
  @Post(':id/cancel')
  @HttpCode(200)
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', { schema: idParam }) id: number,
  ) {
    return this.orders.cancel(user.id, id);
  }
}
