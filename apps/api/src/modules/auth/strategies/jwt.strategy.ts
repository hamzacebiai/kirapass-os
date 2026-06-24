import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { getRequestContext } from '../../../common/request-context';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const ctx = getRequestContext();
    if (ctx) {
      ctx.userId = payload.sub;
      ctx.agencyId = payload.agencyId;
      ctx.role = payload.role;
    }
    return {
      userId: payload.sub,
      agencyId: payload.agencyId,
      role: payload.role,
    };
  }
}
