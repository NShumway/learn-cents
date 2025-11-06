import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function viewUser() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Usage: npm run user:view <email>');
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        assessments: {
          select: {
            id: true,
            createdAt: true,
            isArchived: true,
            isFlagged: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log('\n👤 User Details:\n');
    console.log(`Email: ${user.email}`);
    console.log(`ID: ${user.id}`);
    console.log(`Created: ${user.createdAt.toLocaleString()}`);
    console.log(`Updated: ${user.updatedAt.toLocaleString()}`);
    console.log(`Admin: ${user.isAdmin ? 'Yes' : 'No'}`);
    console.log(`Consent: ${user.consentStatus ? '✅ Granted' : '❌ Not granted'}`);
    if (user.consentDate) {
      console.log(`Consent Date: ${user.consentDate.toLocaleDateString()}`);
    }

    console.log(`\n📊 Assessments (${user.assessments.length}):\n`);
    user.assessments.forEach((assessment, index) => {
      console.log(`${index + 1}. ${assessment.id}`);
      console.log(`   Created: ${assessment.createdAt.toLocaleString()}`);
      console.log(`   Archived: ${assessment.isArchived ? 'Yes' : 'No'}`);
      console.log(`   Flagged: ${assessment.isFlagged ? '🚩 Yes' : 'No'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error viewing user:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

viewUser();
