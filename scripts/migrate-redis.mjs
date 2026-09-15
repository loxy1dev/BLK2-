import fs from 'node:fs';
import { Redis } from '@upstash/redis';

// Charge automatiquement .env.migrate depuis la racine du projet.
const envPath = new URL('../.env.migrate', import.meta.url);

try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envPath);
  } else {
    const text = fs.readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] ??= value;
    }
  }
} catch {
  console.error('❌ Impossible de lire .env.migrate. Vérifie que le fichier est bien à la racine du projet.');
  process.exit(1);
}

const { OLD_REDIS_URL, OLD_REDIS_TOKEN, NEW_REDIS_URL, NEW_REDIS_TOKEN } = process.env;

if (!OLD_REDIS_URL || !OLD_REDIS_TOKEN || !NEW_REDIS_URL || !NEW_REDIS_TOKEN) {
  console.error('❌ Variables manquantes dans .env.migrate.');
  console.error('Il faut : OLD_REDIS_URL, OLD_REDIS_TOKEN, NEW_REDIS_URL et NEW_REDIS_TOKEN.');
  process.exit(1);
}

const oldRedis = new Redis({
  url: OLD_REDIS_URL,
  token: OLD_REDIS_TOKEN,
});

const newRedis = new Redis({
  url: NEW_REDIS_URL,
  token: NEW_REDIS_TOKEN,
});

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
