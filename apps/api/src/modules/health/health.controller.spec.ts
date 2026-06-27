import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        // check() prisma kullanmaz; DI'yi karşılamak için mock yeterli.
        { provide: TenantPrismaService, useValue: { $queryRaw: jest.fn() } },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return status ok', () => {
    expect(controller.check()).toMatchObject({ status: 'ok' });
  });
});
