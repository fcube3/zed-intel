import { createHmac } from 'node:crypto';

const CONTEXT = 'ops-session-v1';

/**
 * Derive a session token from the dashboard password.
 * The cookie stores this token, not the raw password.
 * Leaking the cookie does not reveal the password,
 * and rotating the password invalidates all existing cookies.
 */
export function deriveSessionToken(password: string): string {
  return createHmac('sha256', password).update(CONTEXT).digest('hex');
}

/**
 * Verify a cookie value against the current password.
 */
export function isValidSessionToken(cookieValue: string | undefined, password: string): boolean {
  if (!cookieValue) return false;
  const expected = deriveSessionToken(password);
  // Constant-time comparison
  if (cookieValue.length !== expected.length) return false;
  const a = Buffer.from(cookieValue);
  const b = Buffer.from(expected);
  return crypto.subtle ? timingSafeEqual(a, b) : a.equals(b);
}

function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  // Node's crypto.timingSafeEqual for constant-time compare
  const { timingSafeEqual: tse } = require('node:crypto') as typeof import('node:crypto');
  return tse(a, b);
}
