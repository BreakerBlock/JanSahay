import { createHash, randomBytes } from 'crypto';
export function publicId() { return `JNS-${new Date().getFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`; }
export function reporterToken() { return randomBytes(32).toString('base64url'); }
export function hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
export function toPublicGeohash(lat?: number, lng?: number) { return Number.isFinite(lat) && Number.isFinite(lng) ? `${Math.round((lat as number) * 100) / 100}:${Math.round((lng as number) * 100) / 100}` : null; }
