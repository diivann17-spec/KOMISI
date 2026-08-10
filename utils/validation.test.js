const test = require('node:test');
const assert = require('node:assert/strict');
const { validateScheduleForm, validateDocumentForm } = require('./validation');

test('validateScheduleForm rejects empty title', () => {
  const result = validateScheduleForm({ judul: '   ', tanggal: '2026-08-10', waktuMulai: '09:00', waktuSelesai: '10:00', lokasi: 'Ruang Rapat' });

  assert.equal(result.isValid, false);
  assert.ok(result.errors.judul);
});

test('validateScheduleForm rejects invalid time range', () => {
  const result = validateScheduleForm({ judul: 'Rapat', tanggal: '2026-08-10', waktuMulai: '10:00', waktuSelesai: '09:00', lokasi: 'Ruang Rapat' });

  assert.equal(result.isValid, false);
  assert.ok(result.errors.waktuSelesai);
});

test('validateDocumentForm requires document name', () => {
  const result = validateDocumentForm({ namaDoc: '   ', tanggalDoc: '2026-08-10' });

  assert.equal(result.isValid, false);
  assert.ok(result.errors.namaDoc);
});
