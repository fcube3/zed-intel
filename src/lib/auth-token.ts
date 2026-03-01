/**
 * Auth token helpers using Web Crypto API (Edge-compatible).
 * Cookie stores HMAC-SHA256(password, context) instead of raw password.
 */

const CONTEXT = 'ops-session-v1';
const ENCODER = new TextEncoder();

async function hmacSha256(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    ENCODER.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, ENCODER.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function deriveSessionToken(password: string): Promise<string> {
  return hmacSha256(password, CONTEXT);
}

export async function isValidSessionToken(
  cookieValue: string | undefined,
  password: string,
): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = await deriveSessionToken(password);
  if (cookieValue.length !== expected.length) return false;
  // Constant-time compare via XOR
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= cookieValue.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
