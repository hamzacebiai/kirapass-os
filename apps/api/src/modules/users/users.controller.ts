import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/authz/permissions.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // Returns ONLY the caller's agency users (auto-scoped); SYSTEM_ADMIN sees all.
  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UserRead)
  list() {
    return this.users.list();
  }
}
