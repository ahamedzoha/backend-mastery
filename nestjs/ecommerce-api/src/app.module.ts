import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ObserveModule } from './observe.js';

@Module({
  imports: [
    // Keys from https://observe.nestjs.com (free tier). Left unset, nothing is sent.
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY!,
      appSecret: process.env.OBSERVE_APP_SECRET!,
      serviceId: 'nest-ecommerce-api',
    }),
    // Week 1: TypeOrmModule.forRoot({ type: 'postgres', url: process.env.DATABASE_URL, ... })
    // and the products, categories, users, cart and orders modules go here.
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
