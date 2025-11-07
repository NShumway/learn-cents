import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
        isAdmin: true,
        consentStatus: true,
        _count: {
          select: { assessments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (users.length === 0) {
      console.log('ℹ️  No users found');
      return;
    }

    console.log(`\n📋 All Users (${users.length}):\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log(`   Admin: ${user.isAdmin ? 'Yes' : 'No'}`);
      console.log(`   Consent: ${user.consentStatus ? '✅' : '❌'}`);
      console.log(`   Assessments: ${user._count.assessments}`);
      console.log('');
    });
  } catch (error) {
    console.error(
      '❌ Error listing users:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
