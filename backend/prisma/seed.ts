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
  console.log('Start seeding...');

  // Create a sample account with proper encrypted password
  // Note: This is a placeholder. For real testing, you need a real Bluesky account
  const appPassword = 'placeholder-app-password';
  const encryptedPassword = encrypt(appPassword);

  const account = await prisma.account.create({
    data: {
      handle: 'test.bsky.social',
      label: 'Test Account',
      did: 'did:plc:testplaceholder123',
      displayName: 'Test User',
      encryptedAppPassword: encryptedPassword,
      status: 'ACTIVE',
      rateLimitPerHour: 20,
      rateLimitPerDay: 200,
    },
  });

  console.log('Created account:', account);

  // Create a sample target list
  const targetList = await prisma.targetList.create({
    data: {
      name: 'Sample Targets',
      description: 'A sample target list for testing',
      targetsJson: JSON.stringify(['user1.bsky.social', 'user2.bsky.social', 'user3.bsky.social']),
    },
  });

  console.log('Created target list:', targetList);

  // Create a sample template
  const template = await prisma.template.create({
    data: {
      name: 'Sample DM Template',
      description: 'A sample DM template for testing',
      type: 'DM',
      body: 'Hello! This is a sample message.',
    },
  });

  console.log('Created template:', template);

  // Create a sample campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Sample Campaign',
      type: 'DM',
      status: 'DRAFT',
      accountId: account.id,
      templateId: template.id,
      targetListId: targetList.id,
      maxPerHour: 10,
      maxPerDay: 100,
      targetsJson: JSON.stringify(['user1.bsky.social', 'user2.bsky.social']),
    },
  });

  console.log('Created campaign:', campaign);

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

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
