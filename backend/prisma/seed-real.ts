import { PrismaClient } from '@prisma/client';
import { createCipheriv, randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Simple encryption for seed data
function encrypt(text: string): string {
  const key = Buffer.from('12345678901234567890123456789012', 'utf8');
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function main() {
  console.log('Start seeding with real account data...');

  // Create a real Bluesky account for testing
  // IMPORTANT: Replace these with your actual Bluesky credentials
  const realHandle = 'your-real-handle.bsky.social'; // Replace with your actual handle
  const realDid = 'did:plc:your-real-did'; // Replace with your actual DID
  const realAppPassword = 'your-real-app-password-xxxx'; // Replace with your actual app password
  
  const encryptedPassword = encrypt(realAppPassword);

  const account = await prisma.account.create({
    data: {
      handle: realHandle,
      label: 'Real Test Account',
      did: realDid,
      displayName: 'Real Test User',
      encryptedAppPassword: encryptedPassword,
      status: 'ACTIVE',
      rateLimitPerHour: 20,
      rateLimitPerDay: 200,
    },
  });

  console.log('Created real account:', account);

  // Create a sample target list
  const targetList = await prisma.targetList.create({
    data: {
      name: 'Real Test Targets',
      description: 'Target list for real testing',
      targetsJson: JSON.stringify(['user1.bsky.social', 'user2.bsky.social', 'user3.bsky.social']),
    },
  });

  console.log('Created target list:', targetList);

  // Create a sample template
  const template = await prisma.template.create({
    data: {
      name: 'Real Test DM Template',
      description: 'Template for real testing',
      type: 'DM',
      body: 'Hello! This is a test message from the Bluesky Pro Bot.',
    },
  });

  console.log('Created template:', template);

  // Create sample settings
  const settings = await prisma.setting.create({
    data: {
      key: 'global_settings',
      value: JSON.stringify({
        botName: 'Bluesky Pro Bot',
        language: 'en',
        maxDmsPerHour: 20,
        maxDmsPerDay: 200,
        delayBetweenActions: 5,
        appPasswordEncrypted: null,
      }),
    },
  });

  console.log('Created settings:', settings);

  console.log('Real seeding finished.');
  console.log('IMPORTANT: Update the seed-real.ts file with your actual Bluesky credentials before running!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
