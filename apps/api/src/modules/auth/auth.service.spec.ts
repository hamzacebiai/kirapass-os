import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuditService } from '../../common/audit/audit.service';

// Gerçek constructor: AuthService(JwtService, AuditService).
// Prisma, servis içinde modül-yerel new PrismaClient() — DI'ye girmez,
// bu yüzden "should be defined" testinde DB'ye dokunulmaz.
const mockJwtService = { sign: jest.fn().mockReturnValue('test-access-token') };
const mockAuditService = { log: jest.fn() };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
