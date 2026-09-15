import { Redis } from '@upstash/redis';

const oldRedis = new Redis({
  url: process.env.OLD_REDIS_URL,
  token: process.env.OLD_REDIS_TOKEN,
});

const newRedis = new Redis({
  url: process.env.NEW_REDIS_URL,
  token: process.env.NEW_REDIS_TOKEN,
});

if (!process.env.OLD_REDIS_URL || !process.env.OLD_REDIS_TOKEN || !process.env.NEW_REDIS_URL || !process.env.NEW_REDIS_TOKEN) {
  console.error('❌ Variables manquantes. Configure OLD_REDIS_URL, OLD_REDIS_TOKEN, NEW_REDIS_URL et NEW_REDIS_TOKEN.');
  process.exit(1);
}

async function migratePattern(pattern) {
  let cursor = '0';
  let copied = 0;

  console.log(`\n🔎 Recherche des clés ${pattern}`);

  do {
    const [nextCursor, keys] = await oldRedis.scan(cursor, {
      match: pattern,
      count: 100,
    });
    cursor = String(nextCursor);

    for (const key of keys) {
      const value = await oldRedis.get(key);
      if (value === null) continue;

      await newRedis.set(key, value);
      copied++;
      console.log(`✅ ${key}`);
    }
  } while (cursor !== '0');

  return copied;
}

async function main() {
  console.log('🚀 Migration Redis');
  console.log('⚠️ L’ancienne base est uniquement lue et ne sera pas supprimée.');

  const users = await migratePattern('blox:user:*');
  const usernames = await migratePattern('blox:username:*');

  console.log('\n==============================');
  console.log('✅ MIGRATION TERMINÉE');
  console.log(`Users      : ${users}`);
  console.log(`Usernames  : ${usernames}`);
  console.log('==============================');
}

main().catch((error) => {
  console.error('❌ Migration échouée :', error);
  process.exit(1);
});
