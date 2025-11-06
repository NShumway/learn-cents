import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUser() {
  const email = process.argv[2];
  const confirm = process.argv.includes('--confirm');
  const envProd = process.argv.includes('--env=production');

  if (!email) {
    console.error('❌ Usage: npm run user:delete <email> --confirm');
    process.exit(1);
  }

  if (!confirm) {
    console.error('❌ This is a destructive operation.');
    console.error('   This will permanently delete the user and ALL associated data.');
    console.error('   Add --confirm flag to proceed:');
    console.error(`   npm run user:delete ${email} --confirm`);
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && !envProd) {
    console.log('⚠️  Production environment detected');
    console.log('   Add --env=production flag to confirm');
    process.exit(1);
  }

  try {
    // Get user info before deletion
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        _count: {
          select: {
            assessments: true,
            chatHistory: true,
          },
        },
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log('\n⚠️  About to delete:');
    console.log(`   User: ${user.email}`);
    console.log(`   Assessments: ${user._count.assessments}`);
    console.log(`   Chat messages: ${user._count.chatHistory}`);
    console.log('   This action CANNOT be undone!\n');

    // Delete user (CASCADE will delete related data)
    await prisma.user.delete({
      where: { email },
    });

    console.log('✅ User and all associated data deleted successfully');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      console.error(`❌ User not found: ${email}`);
    } else {
      console.error(
        '❌ Error deleting user:',
        error instanceof Error ? error.message : String(error)
      );
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();
