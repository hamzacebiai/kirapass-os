import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Demo1234!', 10);

  // Agency + owner (idempotent: slug/email @unique).
  const agency = await prisma.agency.upsert({
    where: { slug: 'demo-emlak' },
    update: {},
    create: {
      name: 'Demo Emlak Ofisi',
      slug: 'demo-emlak',
      email: 'demo-agency@kirapass.com',
    },
  });

  await prisma.user.upsert({
    where: { email: 'demo@kirapass.com' },
    update: {},
    create: {
      email: 'demo@kirapass.com',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Owner',
      role: 'AGENCY_OWNER',
      agencyId: agency.id,
    },
  });

  // Child data (idempotent: marker property ile guard).
  const existing = await prisma.property.findFirst({
    where: { agencyId: agency.id, title: 'Demo Property 1' },
  });
  if (existing) {
    console.log(`Seed: agency ${agency.slug} zaten dolu — child data atlandı.`);
    return;
  }

  const p1 = await prisma.property.create({
    data: { agencyId: agency.id, title: 'Demo Property 1', addressLine: 'Sokak 1', city: 'Istanbul' },
  });
  const p2 = await prisma.property.create({
    data: { agencyId: agency.id, title: 'Demo Property 2', addressLine: 'Sokak 2', city: 'Ankara' },
  });

  const u1 = await prisma.unit.create({
    data: { agencyId: agency.id, propertyId: p1.id, name: 'Daire 1', unitNumber: '1' },
  });
  const u2 = await prisma.unit.create({
    data: { agencyId: agency.id, propertyId: p1.id, name: 'Daire 2', unitNumber: '2' },
  });
  await prisma.unit.create({
    data: { agencyId: agency.id, propertyId: p2.id, name: 'Daire 3', unitNumber: '3' },
  });
  await prisma.unit.create({
    data: { agencyId: agency.id, propertyId: p2.id, name: 'Daire 4', unitNumber: '4' },
  });

  const t1 = await prisma.tenant.create({
    data: { agencyId: agency.id, firstName: 'Ahmet', lastName: 'Yilmaz' },
  });
  const t2 = await prisma.tenant.create({
    data: { agencyId: agency.id, firstName: 'Ayse', lastName: 'Demir' },
  });

  const l1 = await prisma.lease.create({
    data: {
      agencyId: agency.id, unitId: u1.id, tenantId: t1.id,
      startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'),
      rentAmount: 10000, status: 'ACTIVE',
    },
  });
  const l2 = await prisma.lease.create({
    data: {
      agencyId: agency.id, unitId: u2.id, tenantId: t2.id,
      startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'),
      rentAmount: 12000, status: 'ACTIVE',
    },
  });

  await prisma.rentSchedule.create({
    data: { agencyId: agency.id, leaseId: l1.id, tenantId: t1.id, dueDate: new Date('2026-02-01'), amount: 10000, status: 'PENDING' },
  });
  await prisma.rentSchedule.create({
    data: { agencyId: agency.id, leaseId: l2.id, tenantId: t2.id, dueDate: new Date('2026-02-01'), amount: 12000, status: 'PENDING' },
  });

  console.log(`Seed tamamlandı: agency=${agency.slug}, owner=demo@kirapass.com / Demo1234!`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
