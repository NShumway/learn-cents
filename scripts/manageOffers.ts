import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

const command = process.argv[2];

async function manageOffers() {
  const envProd = process.argv.includes('--env=production');

  if (process.env.NODE_ENV === 'production' && !envProd) {
    console.log('⚠️  Production environment detected');
    console.log('   Add --env=production flag to confirm');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'list':
        await listOffers();
        break;
      case 'create':
        await createOffer();
        break;
      case 'update':
        await updateOffer();
        break;
      case 'delete':
        await deleteOffer();
        break;
      default:
        console.error('❌ Invalid command');
        console.log('\nUsage:');
        console.log('  npm run offers:list');
        console.log('  npm run offers:create <json-file> --confirm');
        console.log('  npm run offers:update <id> <json-file> --confirm');
        console.log('  npm run offers:delete <id> --confirm');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function listOffers() {
  const offers = await prisma.partnerOffer.findMany({
    orderBy: { createdAt: 'desc' },
  });

  if (offers.length === 0) {
    console.log('ℹ️  No offers found');
    return;
  }

  console.log(`\n📋 Partner Offers (${offers.length}):\n`);
  offers.forEach((offer, index) => {
    const isActive =
      new Date(offer.activeDateStart) <= new Date() &&
      (!offer.activeDateEnd || new Date(offer.activeDateEnd) >= new Date());

    console.log(`${index + 1}. ${offer.offerName} ${isActive ? '✅' : '❌'}`);
    console.log(`   ID: ${offer.id}`);
    console.log(`   Personas: ${offer.targetedPersonas.join(', ')}`);
    console.log(
      `   Active: ${offer.activeDateStart.toLocaleDateString()} - ${offer.activeDateEnd?.toLocaleDateString() || 'No end date'}`
    );
    console.log('');
  });
}

async function createOffer() {
  const jsonFile = process.argv[3];
  const confirm = process.argv.includes('--confirm');

  if (!jsonFile) {
    console.error('❌ Usage: npm run offers:create <json-file> --confirm');
    process.exit(1);
  }

  if (!confirm) {
    console.error('❌ This is a destructive operation.');
    console.error('   Add --confirm flag to proceed:');
    console.error(`   npm run offers:create ${jsonFile} --confirm`);
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(jsonFile, 'utf-8'));

  const offer = await prisma.partnerOffer.create({
    data: {
      offerName: data.offerName,
      offerPitch: data.offerPitch,
      targetedPersonas: data.targetedPersonas,
      priorityPerPersona: data.priorityPerPersona,
      eligibilityReqs: data.eligibilityReqs,
      activeDateStart: new Date(data.activeDateStart),
      activeDateEnd: data.activeDateEnd ? new Date(data.activeDateEnd) : null,
    },
  });

  console.log('✅ Offer created successfully');
  console.log(`   ID: ${offer.id}`);
  console.log(`   Name: ${offer.offerName}`);
}

async function updateOffer() {
  const offerId = process.argv[3];
  const jsonFile = process.argv[4];
  const confirm = process.argv.includes('--confirm');

  if (!offerId || !jsonFile) {
    console.error('❌ Usage: npm run offers:update <id> <json-file> --confirm');
    process.exit(1);
  }

  if (!confirm) {
    console.error('❌ This is a destructive operation.');
    console.error('   Add --confirm flag to proceed:');
    console.error(`   npm run offers:update ${offerId} ${jsonFile} --confirm`);
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(jsonFile, 'utf-8'));

  const offer = await prisma.partnerOffer.update({
    where: { id: offerId },
    data: {
      offerName: data.offerName,
      offerPitch: data.offerPitch,
      targetedPersonas: data.targetedPersonas,
      priorityPerPersona: data.priorityPerPersona,
      eligibilityReqs: data.eligibilityReqs,
      activeDateStart: new Date(data.activeDateStart),
      activeDateEnd: data.activeDateEnd ? new Date(data.activeDateEnd) : null,
    },
  });

  console.log('✅ Offer updated successfully');
  console.log(`   ID: ${offer.id}`);
  console.log(`   Name: ${offer.offerName}`);
}

async function deleteOffer() {
  const offerId = process.argv[3];
  const confirm = process.argv.includes('--confirm');

  if (!offerId) {
    console.error('❌ Usage: npm run offers:delete <id> --confirm');
    process.exit(1);
  }

  if (!confirm) {
    console.error('❌ This is a destructive operation.');
    console.error('   Add --confirm flag to proceed:');
    console.error(`   npm run offers:delete ${offerId} --confirm`);
    process.exit(1);
  }

  const offer = await prisma.partnerOffer.delete({
    where: { id: offerId },
  });

  console.log('✅ Offer deleted successfully');
  console.log(`   ID: ${offer.id}`);
  console.log(`   Name: ${offer.offerName}`);
}

manageOffers();
