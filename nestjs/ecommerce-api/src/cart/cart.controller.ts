import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { type AuthUser, AuthGuard } from '../auth/auth.guards.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { idParam } from '../common/validation.js';
import { CartService } from './cart.service.js';

const quantityBody = z.object({
  quantity: z.number().int().min(1).max(99),
});

// On the class, so every cart route needs a login. The user id always comes from the token,
// never from the URL or body, so nobody can read or change someone else's cart.
@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.cart.get(user.id);
  }

  // PUT sets the quantity rather than adding to it, so sending the same request twice is harmless.
  @Put('items/:productId')
  setQuantity(
    @CurrentUser() user: AuthUser,
    @Param('productId', { schema: idParam }) productId: number,
    @Body({ schema: quantityBody }) body: z.infer<typeof quantityBody>,
  ) {
    return this.cart.setQuantity(user.id, productId, body.quantity);
  }

  @Delete('items/:productId')
  removeItem(
    @CurrentUser() user: AuthUser,
    @Param('productId', { schema: idParam }) productId: number,
  ) {
    return this.cart.removeItem(user.id, productId);
  }

  @Delete()
  clear(@CurrentUser() user: AuthUser) {
    return this.cart.clear(user.id);
  }
}
