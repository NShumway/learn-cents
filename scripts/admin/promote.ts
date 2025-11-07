import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteAdmin() {
  const email = process.argv[2];
  const confirm = process.argv.includes('--confirm');
  const envProd = process.argv.includes('--env=production');

  if (!email) {
    console.error('❌ Usage: npm run admin:promote <email> --confirm');
    process.exit(1);
  }

  if (!confirm) {
    console.error('❌ This is a destructive operation.');
    console.error('   Add --confirm flag to proceed:');
    console.error(`   npm run admin:promote ${email} --confirm`);
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && !envProd) {
    console.log('⚠️  Production environment detected');
    console.log('   Add --env=production flag to confirm');
    process.exit(1);
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { isAdmin: true },
      select: { id: true, email: true, isAdmin: true },
    });

    console.log('✅ User promoted to admin successfully');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Admin: ${user.isAdmin}`);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      console.error(`❌ User not found: ${email}`);
    } else {
      console.error(
        '❌ Error promoting user:',
        error instanceof Error ? error.message : String(error)
      );
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

promoteAdmin();
