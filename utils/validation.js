export const validateScheduleForm = ({ judul, tanggal, waktuMulai, waktuSelesai, lokasi }) => {
  const errors = {};
  const trimmedJudul = judul?.trim() || '';
  const trimmedTanggal = tanggal?.trim() || '';
  const trimmedWaktuMulai = waktuMulai?.trim() || '';
  const trimmedWaktuSelesai = waktuSelesai?.trim() || '';
  const trimmedLokasi = lokasi?.trim() || '';

  if (!trimmedJudul) {
    errors.judul = 'Judul kegiatan wajib diisi.';
  }

  if (!trimmedTanggal) {
    errors.tanggal = 'Tanggal wajib diisi.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedTanggal)) {
    errors.tanggal = 'Format tanggal harus YYYY-MM-DD.';
  }

  if (!trimmedWaktuMulai) {
    errors.waktuMulai = 'Waktu mulai wajib diisi.';
  }

  if (!trimmedWaktuSelesai) {
    errors.waktuSelesai = 'Waktu selesai wajib diisi.';
  } else if (trimmedWaktuMulai && trimmedWaktuSelesai) {
    const start = Number(trimmedWaktuMulai.replace(':', ''));
    const end = Number(trimmedWaktuSelesai.replace(':', ''));
    if (end <= start) {
      errors.waktuSelesai = 'Waktu selesai harus lebih besar dari waktu mulai.';
    }
  }

  if (!trimmedLokasi) {
    errors.lokasi = 'Lokasi kegiatan wajib diisi.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateDocumentForm = ({ namaDoc, tanggalDoc }) => {
  const errors = {};
  const trimmedNama = namaDoc?.trim() || '';
  const trimmedTanggal = tanggalDoc?.trim() || '';

  if (!trimmedNama) {
    errors.namaDoc = 'Nama dokumen wajib diisi.';
  }

  if (!trimmedTanggal) {
    errors.tanggalDoc = 'Tanggal dokumen wajib diisi.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedTanggal)) {
    errors.tanggalDoc = 'Format tanggal harus YYYY-MM-DD.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
