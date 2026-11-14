import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { publicId, reporterToken, hashToken, toPublicGeohash } from '../lib/ids.ts';

test('public complaint IDs have the expected prefix, year and uppercase hex suffix', () => {
  const ids = Array.from({ length: 100 }, () => publicId());
  for (const id of ids) assert.match(id, new RegExp(`^JNS-${new Date().getFullYear()}-[0-9A-F]{6}$`));
  assert.equal(new Set(ids).size, ids.length);
});

test('reporter access tokens are URL-safe, 32-byte random values', () => {
  const tokens = Array.from({ length: 100 }, () => reporterToken());
  for (const token of tokens) {
    assert.match(token, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(Buffer.from(token, 'base64url').length, 32);
  }
  assert.equal(new Set(tokens).size, tokens.length);
});

test('reporter tokens are SHA-256 hashed before storage', () => {
  const token = 'test-token-not-a-secret';
  assert.equal(hashToken(token), createHash('sha256').update(token).digest('hex'));
  assert.notEqual(hashToken(token), token);
});

test('public location helper rounds coordinates and rejects missing or non-finite inputs', () => {
  assert.equal(toPublicGeohash(28.6139, 77.2090), '28.61:77.21');
  assert.equal(toPublicGeohash(0, 0), '0:0');
  assert.equal(toPublicGeohash(), null);
  assert.equal(toPublicGeohash(Number.NaN, 77), null);
  assert.equal(toPublicGeohash(28, Infinity), null);
});
