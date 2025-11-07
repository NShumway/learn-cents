import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        email: true,
        createdAt: true,
        consentStatus: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (admins.length === 0) {
      console.log('ℹ️  No admin users found');
      return;
    }

    console.log(`\n📋 Admin Users (${admins.length}):\n`);
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email}`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Created: ${admin.createdAt.toLocaleDateString()}`);
      console.log(`   Consent: ${admin.consentStatus ? '✅' : '❌'}`);
      console.log('');
    });
  } catch (error) {
    console.error(
      '❌ Error listing admins:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listAdmins();
