import { db } from './database-setup';
import { configTable, configValuesTable } from './schema';
import { seedStyles } from './style-targets';

const main = async () => {
  console.log('Clearing existing data...');
  await db.delete(configValuesTable);
  await db.delete(configTable);
  console.log('Seeding database...');

  // Manually seed configTable
  const [holyricsConfig] = await db.insert(configTable).values({ code: 'holyrics' }).returning();

  await db.insert(configValuesTable).values([
    { configId: holyricsConfig.id, key: 'URL', value: 'http://192.168.0.200:8092/view/text' },
    { configId: holyricsConfig.id, key: 'TIMEOUT', value: '30' },
    { configId: holyricsConfig.id, key: 'RETRY_TIME', value: '3' },
    { configId: holyricsConfig.id, key: 'POLLING_INTERVAL_MS', value: '100' },
    { configId: holyricsConfig.id, key: 'REFERENCE_SELECTOR', value: '.bible-header-custom' },
    { configId: holyricsConfig.id, key: 'TEXT_SELECTOR', value: '.bible_slide > ctt' },
    { configId: holyricsConfig.id, key: 'VERSION_SELECTOR', value: '.bible_slide > span' },
  ]);

  const [proPresenterConfig] = await db.insert(configTable).values({ code: 'pro-presenter' }).returning();

  await db.insert(configValuesTable).values([
    { configId: proPresenterConfig.id, key: 'HOST', value: '192.168.0.200' },
    { configId: proPresenterConfig.id, key: 'PORT', value: '8999' },
  ]);

  await seedStyles();

  console.log('Database seeding complete.');
};

main();
