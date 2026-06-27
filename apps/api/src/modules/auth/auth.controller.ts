import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAgencyDto } from './dto/register-agency.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions } from './decorators/permissions.decorator';
import { Permission } from './authz/permissions.enum';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Public
  @Post('register')
  register(@Body() dto: RegisterAgencyDto) {
    return this.authService.registerAgency(dto);
  }

  // Public
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Public — rotate access+refresh tokens.
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  // Public — revoke a refresh token.
  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UserRead)
  me(@CurrentUser() user: any) {
    return { user };
  }

  // System-admin only (permission matrix).
  @Get('admin/ping')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.SystemAdmin)
  adminPing(@CurrentUser() user: any) {
    return { ok: true, scope: 'system-admin', user };
  }
}
