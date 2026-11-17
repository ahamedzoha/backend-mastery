import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Product } from '../products/product.entity.js';
import { CartController } from './cart.controller.js';
import { CartItem } from './cart-item.entity.js';
import { CartService } from './cart.service.js';

@Module({
  // Product too: CartService looks up stock before adding to the cart.
  imports: [TypeOrmModule.forFeature([CartItem, Product]), AuthModule],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
