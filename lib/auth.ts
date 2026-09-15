import { Redis } from '@upstash/redis';
import crypto from 'node:crypto';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const USER_PREFIX = 'blox:user:';
const SESSION_PREFIX = 'blox:session:';
const SESSION_COOKIE = 'blox_session';
const SESSION_TTL = 60 * 60 * 24 * 30;

const cleanUsername = (s: string) =>
  String(s || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
const keyUsername = (username: string) => `blox:username:${username}`;

const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString('base64url')}.${hash.toString('base64url')}`;
};

const verifyPassword = (password: string, stored: string) => {
  try {
    const [saltText, hashText] = String(stored || '').split('.');
    if (!saltText || !hashText) return false;
    const salt = Buffer.from(saltText, 'base64url');
    const expected = Buffer.from(hashText, 'base64url');
    if (!salt.length || !expected.length) return false;
    const actual = crypto.scryptSync(password, salt, expected.length);
    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
};

const validPassword = (s: string) => {
  const p = String(s || '');
  return p.length >= 6 && p.length <= 72 ? p : null;
};

export type User = {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: number;
};

export async function register(username: string, password: string) {
  const clean = cleanUsername(username);
  if (clean.length < 3) throw new Error('Pseudo invalide (3 caractères minimum).');
  const p = validPassword(password);
  if (!p) throw new Error('Mot de passe : 6 à 72 caractères.');

  const existing = await redis.get<string>(keyUsername(clean));
  if (existing) throw new Error('Ce pseudo est déjà utilisé.');

  const id = crypto.randomUUID();
  const user: User = {
    id,
    username: clean,
    passwordHash: hashPassword(p),
    createdAt: Date.now(),
  };

  const created = await redis.set(keyUsername(clean), id, { nx: true });
  if (!created) throw new Error('Ce pseudo est déjà utilisé.');

  await redis.set(USER_PREFIX + id, user);
  await redis.set(`blox:wallet:${id}`, 5000, { nx: true });
  return user;
}

export async function login(username: string, password: string) {
  const clean = cleanUsername(username);
  const id = await redis.get<string>(keyUsername(clean));
  if (!id) throw new Error('Pseudo ou mot de passe incorrect.');

  const user = await redis.get<User>(USER_PREFIX + id);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error('Pseudo ou mot de passe incorrect.');
  }

  const token = `${crypto.randomUUID()}${crypto.randomBytes(24).toString('hex')}`;
  await redis.set(SESSION_PREFIX + token, id, { ex: SESSION_TTL });
  return { user, token };
}

export async function getSession(req: Request) {
  const rawCookie = req.headers.get('cookie') || '';
  const cookie = rawCookie
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${SESSION_COOKIE}=`));

  if (!cookie) return null;

  const rawToken = cookie.slice(SESSION_COOKIE.length + 1);
  let token = rawToken;
  try {
    token = decodeURIComponent(rawToken);
  } catch {
    // Keep the raw token when a client sends a non-encoded value.
  }
  if (!token) return null;

  const id = await redis.get<string>(SESSION_PREFIX + token);
  if (!id) return null;

  const user = await redis.get<User>(USER_PREFIX + id);
  return user ? { user, token } : null;
}

export async function logout(req: Request) {
  const s = await getSession(req);
  if (s) await redis.del(SESSION_PREFIX + s.token);
}

export function sessionCookie(token: string) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
