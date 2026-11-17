import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { AdminGuard, AuthGuard } from '../auth/auth.guards.js';
import { idParam } from '../common/validation.js';
import { CategoriesService } from './categories.service.js';

const categoryBody = z.object({
  name: z.string().trim().min(1).max(100),
});

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  findAll() {
    return this.categories.findAll();
  }

  @Get(':id')
  findOne(@Param('id', { schema: idParam }) id: number) {
    return this.categories.findOne(id);
  }

  // Guards run in the order listed: AuthGuard sets req.user, then AdminGuard checks its role.
  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  create(@Body({ schema: categoryBody }) body: z.infer<typeof categoryBody>) {
    return this.categories.create(body.name);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, AdminGuard)
  rename(
    @Param('id', { schema: idParam }) id: number,
    @Body({ schema: categoryBody }) body: z.infer<typeof categoryBody>,
  ) {
    return this.categories.rename(id, body.name);
  }

  // Returning nothing still sends 200 by default, so ask for 204 No Content.
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AuthGuard, AdminGuard)
  remove(@Param('id', { schema: idParam }) id: number) {
    return this.categories.remove(id);
  }
}
