import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldOpenInNewTab } from './arsipFiles.js';

test('data URL from webcam scan should open in preview instead of new tab', () => {
  assert.equal(shouldOpenInNewTab('data:image/jpeg;base64,abc123'), false);
});

test('remote PDF or web file URL can open in a new tab', () => {
  assert.equal(shouldOpenInNewTab('https://example.com/file.pdf'), true);
  assert.equal(shouldOpenInNewTab('/files/arsip.pdf'), true);
});
