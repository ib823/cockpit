import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const holidays = [
    // Malaysia
    { name: 'New Year', date: new Date('2025-01-01'), region: 'ABMY' },
    { name: 'Chinese New Year', date: new Date('2025-01-29'), region: 'ABMY' },
    { name: 'Chinese New Year', date: new Date('2025-01-30'), region: 'ABMY' },
    { name: 'Hari Raya Aidilfitri', date: new Date('2025-03-31'), region: 'ABMY' },
    { name: 'Hari Raya Aidilfitri', date: new Date('2025-04-01'), region: 'ABMY' },
    { name: 'Labour Day', date: new Date('2025-05-01'), region: 'ABMY' },
    { name: 'Wesak Day', date: new Date('2025-05-12'), region: 'ABMY' },
    { name: 'Agong Birthday', date: new Date('2025-06-07'), region: 'ABMY' },
    { name: 'Hari Raya Aidiladha', date: new Date('2025-06-07'), region: 'ABMY' },
    { name: 'Awal Muharram', date: new Date('2025-06-27'), region: 'ABMY' },
    { name: 'Merdeka Day', date: new Date('2025-08-31'), region: 'ABMY' },
    { name: 'Malaysia Day', date: new Date('2025-09-16'), region: 'ABMY' },
    { name: 'Prophet Muhammad Birthday', date: new Date('2025-09-05'), region: 'ABMY' },
    { name: 'Deepavali', date: new Date('2025-10-20'), region: 'ABMY' },
    { name: 'Christmas', date: new Date('2025-12-25'), region: 'ABMY' },
    
    // Singapore
    { name: 'New Year', date: new Date('2025-01-01'), region: 'ABSG' },
    { name: 'Chinese New Year', date: new Date('2025-01-29'), region: 'ABSG' },
    { name: 'Chinese New Year', date: new Date('2025-01-30'), region: 'ABSG' },
    { name: 'Good Friday', date: new Date('2025-04-18'), region: 'ABSG' },
    { name: 'Hari Raya Puasa', date: new Date('2025-03-31'), region: 'ABSG' },
    { name: 'Labour Day', date: new Date('2025-05-01'), region: 'ABSG' },
    { name: 'Vesak Day', date: new Date('2025-05-12'), region: 'ABSG' },
    { name: 'Hari Raya Haji', date: new Date('2025-06-07'), region: 'ABSG' },
    { name: 'National Day', date: new Date('2025-08-09'), region: 'ABSG' },
    { name: 'Deepavali', date: new Date('2025-10-20'), region: 'ABSG' },
    { name: 'Christmas', date: new Date('2025-12-25'), region: 'ABSG' },
    
    // Vietnam
    { name: 'New Year', date: new Date('2025-01-01'), region: 'ABVN' },
    { name: 'Tet Holiday', date: new Date('2025-01-28'), region: 'ABVN' },
    { name: 'Tet Holiday', date: new Date('2025-01-29'), region: 'ABVN' },
    { name: 'Tet Holiday', date: new Date('2025-01-30'), region: 'ABVN' },
    { name: 'Tet Holiday', date: new Date('2025-01-31'), region: 'ABVN' },
    { name: 'Hung Kings Festival', date: new Date('2025-04-18'), region: 'ABVN' },
    { name: 'Reunification Day', date: new Date('2025-04-30'), region: 'ABVN' },
    { name: 'Labour Day', date: new Date('2025-05-01'), region: 'ABVN' },
    { name: 'National Day', date: new Date('2025-09-02'), region: 'ABVN' },
  ];

  for (const holiday of holidays) {
    await prisma.holiday.upsert({
      where: { date_region: { date: holiday.date, region: holiday.region } },
      update: {},
      create: holiday,
    });
  }

  console.log(`✅ Seeded ${holidays.length} holidays`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
