import test from 'node:test';
import assert from 'node:assert/strict';
import { isWellFormedComplaintBlobUrl } from '../lib/blob-url.ts';

const path = 'complaints/submission-123/photo.webp';
const valid = 'https://abc123.private.blob.vercel-storage.com/' + path;

test('accepts a structurally valid private Blob URL with an exact complaint pathname', () => {
  assert.equal(isWellFormedComplaintBlobUrl(valid, path), true);
  assert.equal(isWellFormedComplaintBlobUrl(valid.replace('.private.', '.public.'), path), true);
});

test('rejects misleading hosts and non-HTTPS URLs', () => {
  for (const url of [
    'https://abc123.private.blob.vercel-storage.com.attacker.example/' + path,
    'https://blob.vercel-storage.com.attacker.example/' + path,
    'https://attacker.example/' + path + '?next=blob.vercel-storage.com',
    valid.replace('https:', 'http:'),
    'https://abc123.private.blob.vercel-storage.com@attacker.example/' + path,
    'https://attacker@abc123.private.blob.vercel-storage.com/' + path,
  ]) assert.equal(isWellFormedComplaintBlobUrl(url, path), false, url);
});

test('rejects mismatched paths, query strings, fragments and invalid input', () => {
  assert.equal(isWellFormedComplaintBlobUrl(valid, 'complaints/other/photo.webp'), false);
  assert.equal(isWellFormedComplaintBlobUrl(valid + '?download=1', path), false);
  assert.equal(isWellFormedComplaintBlobUrl(valid + '#fragment', path), false);
  assert.equal(isWellFormedComplaintBlobUrl(valid, '../photo.webp'), false);
  assert.equal(isWellFormedComplaintBlobUrl(valid, 'complaints/'), false);
  assert.equal(isWellFormedComplaintBlobUrl(null, path), false);
  assert.equal(isWellFormedComplaintBlobUrl('not a url', path), false);
});


test('rejects alternate ports, embedded credentials and non-complaint prefixes', () => {
  const host = 'abc123.private.blob.vercel-storage.com';
  for (const url of [
    'https://' + host + ':8443/' + path,
    'https://user:password@' + host + '/' + path,
    'https://' + host + '/unrelated/photo.webp',
    'https://' + host + '/' + path + '?token=secret',
  ]) assert.equal(isWellFormedComplaintBlobUrl(url, path), false, url);
  assert.equal(isWellFormedComplaintBlobUrl(valid, 'other/submission-123/photo.webp'), false);
});

test('rejects invalid path values and backslash ambiguity', () => {
  for (const badPath of [null, 42, '', 'complaints/', 'complaints\\\\submission-123/photo.webp', 'complaints/submission-123/photo.webp?x=1', 'complaints/submission-123/photo.webp#fragment']) {
    assert.equal(isWellFormedComplaintBlobUrl(valid, badPath), false, String(badPath));
  }
});

test('rejects URL path normalization and encoded separators', () => {
  for (const badPath of [
    'complaints/../secret/photo.webp',
    'complaints/%2e%2e/secret/photo.webp',
    'complaints/submission-123%2fphoto.webp',
    'complaints/submission-123/%5cphoto.webp',
  ]) {
    assert.equal(isWellFormedComplaintBlobUrl(valid, badPath), false, badPath);
  }
});
