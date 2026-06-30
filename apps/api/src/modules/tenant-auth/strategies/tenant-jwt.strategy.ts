import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { getRequestContext } from '../../../common/request-context';

/**
 * Separate passport strategy ('tenant-jwt'). Same JWT_SECRET as the agency
 * strategy, but REJECTS any token whose payload.type !== 'tenant' — so an
 * agency token can never be used on tenant portal endpoints.
 */
@Injectable()
export class TenantJwtStrategy extends PassportStrategy(Strategy, 'tenant-jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  validate(payload: any) {
    if (payload?.type !== 'tenant') {
      throw new UnauthorizedException('Not a tenant token');
    }
    const ctx = getRequestContext();
    if (ctx) {
      ctx.userId = payload.sub;
      ctx.agencyId = payload.agencyId;
    }
    return {
      tenantId: payload.sub,
      agencyId: payload.agencyId,
      type: 'tenant',
    };
  }
}
