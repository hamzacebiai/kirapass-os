import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { TenantAuthService } from './tenant-auth.service';
import { TenantLoginDto } from './dto/tenant-login.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { TenantRefreshDto } from './dto/tenant-refresh.dto';
import { TenantJwtAuthGuard } from './guards/tenant-jwt-auth.guard';

@Controller('tenant-auth')
export class TenantAuthController {
  constructor(private readonly tenantAuth: TenantAuthService) {}

  @Post('login')
  login(@Body() dto: TenantLoginDto) {
    return this.tenantAuth.login(dto.email, dto.password);
  }

  @Post('accept-invite')
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.tenantAuth.acceptInvite(dto.token, dto.password);
  }

  @Post('refresh')
  refresh(@Body() dto: TenantRefreshDto) {
    return this.tenantAuth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(TenantJwtAuthGuard)
  logout(@Body() dto: TenantRefreshDto) {
    return this.tenantAuth.logout(dto.refreshToken);
  }
}
