import {
    AlertTriangle,
    Calendar,
    CheckCircle, Clock,
    Compass,
    Edit3,
    ExternalLink,
    Eye,
    FileCheck,
    FileText,
    MapPin, Plus,
    Printer,
    Search,
    Send,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    arsipStorage,
    formatDate,
    jadwalStorage,
    lokusKunjunganStorage,
    suratStorage,
    userStorage
} from '../utils/storage';

const LIST_KOMISI = [
  { id: 'semua', label: 'Semua Komisi' },
  { id: 'Komisi I', label: 'Komisi I (Pemerintahan & Hukum)' },
  { id: 'Komisi II', label: 'Komisi II (Perekonomian & Keuangan)' },
  { id: 'Komisi III', label: 'Komisi III (Pembangunan & Infrastruktur)' },
  { id: 'Komisi IV', label: 'Komisi IV (Kesra & Pendidikan)' },
  { id: 'Gabungan', label: 'Pimpinan & Gabungan Komisi' },
];

const JENIS_PERJALANAN_LIST = [
  'Studi Komparasi',
  'Kunjungan Kerja',
  'Konsultasi Kementerian / Lembaga',
  'Evaluasi Lapangan & Monitoring',
];

const STATUS_BADGE = {
  'Disetujui': { bg: 'rgba(16, 185, 129, 0.15)', border: '#10B981', color: '#10B981', icon: CheckCircle, label: 'Disetujui' },
  'Diajukan': { bg: 'rgba(59, 130, 246, 0.15)', border: '#3B82F6', color: '#3B82F6', icon: Clock, label: 'Diajukan (Menunggu Verifikasi)' },
  'Draft': { bg: 'rgba(107, 114, 128, 0.15)', border: '#6B7280', color: '#6B7280', icon: Edit3, label: 'Draft Komisi' },
  'Ditolak': { bg: 'rgba(239, 68, 68, 0.15)', border: '#EF4444', color: '#EF4444', icon: ShieldAlert, label: 'Ditolak / Perlu Perbaikan' },
};

export default function LokusKunjunganPage() {
  const currentUser = userStorage.getCurrentUser();
  const [data, setData] = useState([]);

  // Filters
  const [selectedKomisi, setSelectedKomisi] = useState('semua');
  const [selectedStatus, setSelectedStatus] = useState('semua');
  const [selectedKabKota, setSelectedKabKota] = useState('semua');
  const [selectedBulan, setSelectedBulan] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  // Form State (12 Data Fields)
  const [formData, setFormData] = useState({
    topik: '',
    komisi: 'Komisi I',
    masaSesi: 'Masa Persidangan III Tahun 2026',
    jenisPerjalanan: 'Studi Komparasi',
    tanggalBerangkat: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    durasiHari: 4,
    provinsi: '',
    kabKota: '',
    instansiTujuan: '',
    alamatLokus: '',
    bidangKajian: '',
    maksudTujuan: '',
    keterangan: '',
    rombongan: '',
    koordinator: '',
    estimasiBiaya: '',
    noSuratTugas: '',
    noSPPD: '',
    lampiranKAK: '',
    lampiranUndangan: '',
    lampiranProposal: '',
    status: 'Draft',
    catatanVerifikasi: '',
  });

  const [verifyNotes, setVerifyNotes] = useState('');

  const loadData = () => {
    const list = lokusKunjunganStorage.getAll();
    setData(list);
  };

  useEffect(() => {
    loadData();
    const handleStorageUpdate = () => loadData();
    window.addEventListener('kegiatan-data-changed', handleStorageUpdate);
    return () => window.removeEventListener('kegiatan-data-changed', handleStorageUpdate);
  }, []);

  // -------------------------------------------------------------
  // DETEKSI BENTROK LOKUS OTOMATIS (Conflict Detection Engine)
  // -------------------------------------------------------------
  const getLokusConflicts = (targetItem, allData = data) => {
    if (!targetItem.instansiTujuan || !targetItem.tanggalMulai || !targetItem.tanggalSelesai) {
      return [];
    }

    const tStart = new Date(targetItem.tanggalMulai);
    const tEnd = new Date(targetItem.tanggalSelesai);
    const targetInstansi = targetItem.instansiTujuan.toLowerCase().trim();
    const targetKab = targetItem.kabKota ? targetItem.kabKota.toLowerCase().trim() : '';

    return allData.filter(item => {
      // Jangan bandingkan dengan diri sendiri
      if (item.id === targetItem.id) return false;
      // Jangan bandingkan jika komisi sama (bentrok antar-komisi lain)
      if (item.komisi === targetItem.komisi) return false;
      // Abaikan jika status ditolak
      if (item.status === 'Ditolak') return false;

      const itemInstansi = item.instansiTujuan ? item.instansiTujuan.toLowerCase().trim() : '';
      const itemKab = item.kabKota ? item.kabKota.toLowerCase().trim() : '';

      // Cek apakah instansi atau kota tujuan sama/mirip
      const sameInstansi = itemInstansi.includes(targetInstansi) || targetInstansi.includes(itemInstansi);
      const sameKab = targetKab && itemKab && (targetKab.includes(itemKab) || itemKab.includes(targetKab));

      if (!sameInstansi && !sameKab) return false;

      // Cek overlap tanggal (Overlap: start1 <= end2 && end1 >= start2)
      const iStart = new Date(item.tanggalMulai);
      const iEnd = new Date(item.tanggalSelesai);

      const isDateOverlapping = (tStart <= iEnd && tEnd >= iStart);
      return isDateOverlapping;
    });
  };

  // Filter Data
  const filteredData = data.filter(item => {
    const matchKomisi = selectedKomisi === 'semua' || item.komisi === selectedKomisi;
    const matchStatus = selectedStatus === 'semua' || item.status === selectedStatus;
    const matchKabKota = selectedKabKota === 'semua' || item.kabKota === selectedKabKota;

    let matchBulan = true;
    if (selectedBulan !== 'semua' && item.tanggalMulai) {
      const monthNum = new Date(item.tanggalMulai).getMonth() + 1;
      matchBulan = String(monthNum) === selectedBulan;
    }

    const q = searchQuery.toLowerCase();
    const matchQuery = !q ||
      item.topik?.toLowerCase().includes(q) ||
      item.instansiTujuan?.toLowerCase().includes(q) ||
      item.kabKota?.toLowerCase().includes(q) ||
      item.provinsi?.toLowerCase().includes(q) ||
      item.bidangKajian?.toLowerCase().includes(q) ||
      item.koordinator?.toLowerCase().includes(q);

    return matchKomisi && matchStatus && matchKabKota && matchBulan && matchQuery;
  });

  // Metrics KPI & Stats
  const totalBiaya = filteredData.reduce((acc, curr) => acc + (Number(curr.estimasiBiaya) || 0), 0);
  const totalDirencanakan = data.length;
  const totalMenunggu = data.filter(d => d.status === 'Diajukan').length;
  const totalDisetujui = data.filter(d => d.status === 'Disetujui').length;
  const totalDitolak = data.filter(d => d.status === 'Ditolak').length;

  // Daftar unik Kabupaten/Kota untuk filter
  const listKabKotaUnik = Array.from(new Set(data.map(d => d.kabKota).filter(Boolean)));

  const handleOpenForm = (item = null) => {
    const today = new Date().toISOString().split('T')[0];
    if (item) {
      setActiveItem(item);
      setFormData({
        topik: item.topik || '',
        komisi: item.komisi || 'Komisi I',
        masaSesi: item.masaSesi || 'Masa Persidangan III Tahun 2026',
        jenisPerjalanan: item.jenisPerjalanan || 'Studi Komparasi',
        tanggalBerangkat: item.tanggalBerangkat || today,
        tanggalMulai: item.tanggalMulai || today,
        tanggalSelesai: item.tanggalSelesai || today,
        durasiHari: item.durasiHari || 4,
        provinsi: item.provinsi || '',
        kabKota: item.kabKota || '',
        instansiTujuan: item.instansiTujuan || '',
        alamatLokus: item.alamatLokus || '',
        bidangKajian: item.bidangKajian || '',
        maksudTujuan: item.maksudTujuan || '',
        keterangan: item.keterangan || '',
        rombongan: item.rombongan || '',
        koordinator: item.koordinator || '',
        estimasiBiaya: item.estimasiBiaya || '',
        noSuratTugas: item.noSuratTugas || '',
        noSPPD: item.noSPPD || '',
        lampiranKAK: item.lampiranKAK || '',
        lampiranUndangan: item.lampiranUndangan || '',
        lampiranProposal: item.lampiranProposal || '',
        status: item?.status || 'Draft',
        catatanVerifikasi: item?.catatanVerifikasi || '',
      });
    } else {
      setActiveItem(null);
      setFormData({
        topik: '',
        komisi: selectedKomisi !== 'semua' ? selectedKomisi : 'Komisi I',
        masaSesi: 'Masa Persidangan III Tahun 2026',
        jenisPerjalanan: 'Studi Komparasi',
        tanggalBerangkat: today,
        tanggalMulai: today,
        tanggalSelesai: today,
        durasiHari: 4,
        provinsi: '',
        kabKota: '',
        instansiTujuan: '',
        alamatLokus: '',
        bidangKajian: '',
        maksudTujuan: '',
        keterangan: '',
        rombongan: '',
        koordinator: currentUser?.displayName || 'Admin / Anggota Komisi',
        estimasiBiaya: '',
        noSuratTugas: '',
        noSPPD: '',
        lampiranKAK: '',
        lampiranUndangan: '',
        lampiranProposal: '',
        status: 'Draft',
        catatanVerifikasi: '',
      });
    }
    setShowFormModal(true);
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formData.topik || !formData.kabKota || !formData.instansiTujuan) {
      alert('Mohon lengkapi Topik, Kabupaten/Kota Tujuan, dan Instansi Lokus.');
      return;
    }

    const payload = {
      ...formData,
      estimasiBiaya: Number(formData.estimasiBiaya) || 0,
      durasiHari: Number(formData.durasiHari) || 1,
    };

    // Cek konflik bentrok sebelum simpan
    const conflicts = getLokusConflicts(payload);
    if (conflicts.length > 0) {
      const conflictMsg = conflicts.map(c => `• ${c.instansiTujuan} (${c.komisi}) tanggal ${formatDate(c.tanggalMulai)} s/d ${formatDate(c.tanggalSelesai)}`).join('\n');
      if (!confirm(`⚠️ PERINGATAN BENTROK LOKUS:\nLokus instansi/kota ini sudah pernah diajukan oleh komisi lain pada tanggal yang beririsan:\n\n${conflictMsg}\n\nApakah Anda yakin tetap ingin menyimpan penentuan lokus ini?`)) {
        return;
      }
    }

    if (activeItem) {
      lokusKunjunganStorage.update(activeItem.id, payload);
    } else {
      lokusKunjunganStorage.add(payload);
    }

    setShowFormModal(false);
    loadData();
    window.dispatchEvent(new CustomEvent('new-notification', {
      detail: {
        id: Date.now(),
        judul: activeItem ? '📍 Lokus Kunjungan Diperbarui' : '📍 Penentuan Lokus Kunjungan Baru',
        pesan: `${payload.komisi} — ${payload.instansiTujuan} (${payload.kabKota})`,
      }
    }));
  };

  // Workflow Action: Ajukan Lokus
  const handleSubmitWorkflow = (item) => {
    lokusKunjunganStorage.update(item.id, {
      status: 'Diajukan',
      catatanVerifikasi: 'Diajukan ke Sekretariat & Pimpinan DPRD untuk verifikasi lokus.',
    });
    loadData();
    window.dispatchEvent(new CustomEvent('new-notification', {
      detail: {
        id: Date.now(),
        judul: '📤 Lokus Kunjungan Diajukan',
        pesan: `Pengajuan ${item.komisi} ke ${item.instansiTujuan} menunggu verifikasi.`,
      }
    }));
  };

  // Workflow Action: Verification (Setujui / Tolak)
  const handleOpenVerifyModal = (item) => {
    setActiveItem(item);
    setVerifyNotes(item.catatanVerifikasi || '');
    setShowVerifyModal(true);
  };

  const handleProcessVerify = (newStatus) => {
    if (!activeItem) return;
    lokusKunjunganStorage.update(activeItem.id, {
      status: newStatus,
      catatanVerifikasi: verifyNotes || (newStatus === 'Disetujui' ? 'Lokus kunjungan disetujui pimpinan.' : 'Pengajuan ditolak, harap lengkapi dokumen KAK.'),
    });
    setShowVerifyModal(false);
    loadData();
    window.dispatchEvent(new CustomEvent('new-notification', {
      detail: {
        id: Date.now(),
        judul: newStatus === 'Disetujui' ? '✅ Lokus Kunjungan Disetujui' : '❌ Lokus Kunjungan Perlu Perbaikan',
        pesan: `${activeItem.komisi} — ${activeItem.instansiTujuan}`,
      }
    }));
  };

  // -------------------------------------------------------------
  // INTEGRASI 1-KLIK (Teruskan ke Jadwal, Surat Tugas, & Laporan)
  // -------------------------------------------------------------
  const handleExportToJadwal = (item) => {
    const payload = {
      judul: `Kunjungan Kerja ${item.komisi}: ${item.topik}`,
      tanggal: item.tanggalMulai,
      waktuMulai: '08:00',
      waktuSelesai: '17:00',
      lokasi: `${item.instansiTujuan}, ${item.kabKota}`,
      komisi: item.komisi,
      jenisKegiatan: item.jenisPerjalanan || 'Kunjungan Kerja',
      keterangan: `Maksud & Tujuan: ${item.maksudTujuan}. Alamat Lokus: ${item.alamatLokus}`,
      status: 'aktif',
    };
    jadwalStorage.add(payload);
    alert(`✅ Berhasil dibuatkan jadwal kegiatan resmi di Modul Jadwal untuk tanggal ${formatDate(item.tanggalMulai)}!`);
  };

  const handleExportToSurat = (item) => {
    const payload = {
      noSurat: item.noSuratTugas || `090/ST-${item.komisi.replace(/\s+/g, '')}/DPRD/2026`,
      perihal: `Surat Tugas & SPPD Perjalanan Dinas Luar Kota: ${item.topik}`,
      pengirim: item.komisi,
      penerima: `${item.instansiTujuan} (${item.kabKota})`,
      tanggalSurat: new Date().toISOString().split('T')[0],
      jenisSurat: 'Surat Tugas',
      status: 'Disetujui',
      keterangan: `Anggota Rombongan: ${item.rombongan}. Estimasi Biaya SPPD: Rp ${Number(item.estimasiBiaya).toLocaleString('id-ID')}`,
    };
    suratStorage.add(payload);
    alert(`📄 Berhasil dibuatkan draft Surat Tugas & SPPD resmi di Modul Surat Menyurat!`);
  };

  const handleExportToArsip = (item) => {
    const payload = {
      judul: `Laporan Hasil Kunjungan Kerja ${item.komisi} — ${item.topik}`,
      nomorDokumen: item.noSuratTugas || `LAP-LOKUS/${item.komisi.replace(/\s+/g, '')}/2026`,
      kategori: 'Laporan Komisi',
      subKategori: 'Laporan Perjalanan Dinas Luar Kota',
      komisi: item.komisi,
      ringkasan: `Lokus Tujuan: ${item.instansiTujuan}, ${item.kabKota}. Hasil Kajian: ${item.bidangKajian}.`,
      waktuArsip: new Date().toISOString(),
    };
    arsipStorage.add(payload);
    alert(`📁 Berhasil dicatat dalam Repositori Arsip Dokumen Digital!`);
  };

  const handleDelete = (id, topik) => {
    if (confirm(`Hapus penentuan lokus kunjungan "${topik}"?`)) {
      lokusKunjunganStorage.delete(id);
      loadData();
    }
  };

  const handleViewDetail = (item) => {
    setActiveItem(item);
    setShowDetailModal(true);
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div className="page-content space-y-6">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Penentuan Lokus Kunjungan Dinas
          </h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-3)', marginTop: 3 }}>
            Workflow Penetapan &amp; Verifikasi Lokasi Kunjungan Luar Kota Komisi I–IV
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Cetak Rekap
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={16} /> Buat Lokus Baru
          </button>
        </div>
      </div>

      {/* Filter Status Workflow (Pill Navigation) */}
      <div className="filter-pills mb-4" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { value: 'semua', label: 'Semua Status', count: data.length },
          { value: 'Draft', label: 'Draft Komisi', count: data.filter(item => item.status === 'Draft').length },
          { value: 'Diajukan', label: 'Menunggu Verifikasi', count: data.filter(item => item.status === 'Diajukan').length },
          { value: 'Disetujui', label: 'Disetujui Pimpinan', count: data.filter(item => item.status === 'Disetujui').length },
          { value: 'Ditolak', label: 'Perlu Revisi', count: data.filter(item => item.status === 'Ditolak').length },
        ].map(status => (
          <button
            key={status.value}
            className={`pill${selectedStatus === status.value ? ' active' : ''}`}
            onClick={() => {
              setSelectedStatus(status.value);
              if (status.value !== 'semua') {
                setSelectedKomisi('semua');
                setSelectedBulan('semua');
                setSelectedKabKota('semua');
                setSearchQuery('');
              }
            }}
          >
            {status.label} ({status.count})
          </button>
        ))}
      </div>

      {/* Metric Stats Grid */}
      <div className="grid-4 mb-4">
        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--text-4)' }}>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>Total Direncanakan</div>
          <div style={{ fontSize: 'var(--font-xl)', fontWeight: 900, color: 'var(--text)', marginTop: 4 }}>
            {totalDirencanakan} <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', fontWeight: 500 }}>Lokus</span>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--blue)' }}>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--blue)', fontWeight: 700, textTransform: 'uppercase' }}>Menunggu Verifikasi</div>
          <div style={{ fontSize: 'var(--font-xl)', fontWeight: 900, color: 'var(--text)', marginTop: 4 }}>
            {totalMenunggu} <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', fontWeight: 500 }}>Usulan</span>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase' }}>Disetujui Pimpinan</div>
          <div style={{ fontSize: 'var(--font-xl)', fontWeight: 900, color: 'var(--text)', marginTop: 4 }}>
            {totalDisetujui} <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', fontWeight: 500 }}>Siap Jalan</span>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--danger)', fontWeight: 700, textTransform: 'uppercase' }}>Ditolak / Revisi</div>
          <div style={{ fontSize: 'var(--font-xl)', fontWeight: 900, color: 'var(--text)', marginTop: 4 }}>
            {totalDitolak} <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', fontWeight: 500 }}>Revisi</span>
          </div>
        </div>
      </div>

      {/* Filter Komisi Pills */}
      <div className="filter-pills mb-4" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {LIST_KOMISI.map(komisi => {
          const count = komisi.id === 'semua'
            ? data.length
            : data.filter(d => d.komisi === komisi.id).length;
          return (
            <button
              key={komisi.id}
              className={`pill${selectedKomisi === komisi.id ? ' active' : ''}`}
              onClick={() => setSelectedKomisi(komisi.id)}
            >
              {komisi.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Multi Filter Bar */}
      <div className="toolbar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <input
          type="text"
          className="form-input"
          placeholder="Cari topik, instansi, kota..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: 220 }}
        />

        <select
          className="form-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{ width: 180 }}
        >
          <option value="semua">Semua Status Workflow</option>
          <option value="Draft">Draft Komisi</option>
          <option value="Diajukan">Diajukan (Menunggu Verifikasi)</option>
          <option value="Disetujui">Disetujui Pimpinan</option>
          <option value="Ditolak">Ditolak / Perlu Perbaikan</option>
        </select>

        <select
          className="form-select"
          value={selectedKabKota}
          onChange={(e) => setSelectedKabKota(e.target.value)}
          style={{ width: 170 }}
        >
          <option value="semua">Semua Kab/Kota</option>
          {listKabKotaUnik.map(kab => (
            <option key={kab} value={kab}>{kab}</option>
          ))}
        </select>

        <select
          className="form-select"
          value={selectedBulan}
          onChange={(e) => setSelectedBulan(e.target.value)}
          style={{ width: 130 }}
        >
          <option value="semua">Semua Bulan</option>
          <option value="8">Agustus</option>
          <option value="9">September</option>
          <option value="10">Oktober</option>
          <option value="11">November</option>
          <option value="12">Desember</option>
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('grid')}
          >
            <Compass size={14} /> Grid
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('table')}
          >
            <FileText size={14} /> Tabel
          </button>
        </div>
      </div>

      {/* Main Content Grid / Table View */}
      {filteredData.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl border border-gray-800">
          <MapPin size={48} className="mx-auto text-gray-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-300">Belum Ada Lokus Kunjungan</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mt-1 mb-6">
            {selectedStatus === 'Draft'
              ? 'Belum ada draft lokus. Buat rencana baru untuk memulai pengajuan.'
              : searchQuery || selectedStatus !== 'semua' || selectedKomisi !== 'semua'
                ? 'Tidak ada data lokus kunjungan yang sesuai dengan filter pencarian.'
              : 'Belum ada agenda penentuan lokus kunjungan luar kota yang terdaftar.'}
          </p>
          <button
            onClick={() => handleOpenForm()}
            className="btn btn-primary"
          >
            <Plus size={16} className="mr-2" /> Buat Draft Lokus Baru
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {filteredData.map((item) => {
            const statusConfig = STATUS_BADGE[item.status] || STATUS_BADGE['Draft'];
            const StatusIcon = statusConfig.icon;
            const conflicts = getLokusConflicts(item);
            const hasConflict = conflicts.length > 0;

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  gap: 14,
                  borderColor: hasConflict ? 'var(--warning)' : undefined,
                  background: hasConflict ? 'var(--warning-s)' : undefined,
                }}
              >
                <div>
                  {/* Status & Komisi Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="badge badge-blue font-bold text-xs" style={{ padding: '4px 8px' }}>
                        {item.komisi}
                      </span>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-3)', fontWeight: 600 }}>
                        • {item.jenisPerjalanan || 'Studi Komparasi'}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 800,
                        backgroundColor: statusConfig.bg,
                        border: `1px solid ${statusConfig.border}`,
                        color: statusConfig.color,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <StatusIcon size={13} />
                      {item.status}
                    </div>
                  </div>

                  {/* WARNING ALERT BENTROK LOKUS */}
                  {hasConflict && (
                    <div style={{ padding: '8px 12px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 8, color: '#92400E', fontSize: 11, marginBottom: 10 }}>
                      <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={14} /> ⚠️ Peringatan Bentrok Lokus Ditentukan!
                      </div>
                      {conflicts.map(c => (
                        <div key={c.id} style={{ marginTop: 2, lineHeight: 1.3 }}>
                          Instansi <strong>{c.instansiTujuan}</strong> telah dijadwalkan oleh <strong>{c.komisi}</strong> ({formatDate(c.tanggalMulai)} s/d {formatDate(c.tanggalSelesai)}).
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Topik & Lokus Detail */}
                  <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 900, color: 'var(--text)', lineHeight: 1.35, marginBottom: 8 }}>
                    {item.topik}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 'var(--font-sm)', color: 'var(--text-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <MapPin size={15} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <strong style={{ color: 'var(--text)' }}>{item.instansiTujuan}</strong>
                        <div style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600 }}>{item.kabKota}, {item.provinsi}</div>
                        {item.alamatLokus && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{item.alamatLokus}</div>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)' }}>
                      <Calendar size={14} style={{ color: 'var(--blue)' }} />
                      <span>Kunjungan: {formatDate(item.tanggalMulai)} s/d {formatDate(item.tanggalSelesai)} ({item.durasiHari} Hari)</span>
                    </div>

                    {item.bidangKajian && (
                      <div style={{ fontSize: 11, background: 'var(--surface2)', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-2)', marginTop: 2 }}>
                        <strong style={{ color: 'var(--text-3)' }}>Fokus Kajian:</strong> {item.bidangKajian}
                      </div>
                    )}

                    {/* Lampiran Dokumen Kelengkapan Badge */}
                    {(item.lampiranKAK || item.lampiranUndangan || item.lampiranProposal) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {item.lampiranKAK && (
                          <span className="badge badge-blue" style={{ fontSize: 10 }}>
                            📄 KAK: {item.lampiranKAK}
                          </span>
                        )}
                        {item.lampiranUndangan && (
                          <span className="badge badge-blue" style={{ fontSize: 10 }}>
                            ✉️ Undangan: {item.lampiranUndangan}
                          </span>
                        )}
                        {item.lampiranProposal && (
                          <span className="badge badge-blue" style={{ fontSize: 10 }}>
                            📁 Proposal: {item.lampiranProposal}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow Footer Actions */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <div>
                      <span style={{ color: 'var(--text-3)' }}>Estimasi SPPD: </span>
                      <strong style={{ color: 'var(--success)', fontSize: 13 }}>{formatRupiah(item.estimasiBiaya)}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleViewDetail(item)}
                        className="btn btn-sm btn-ghost"
                        title="Lihat Rincian"
                      >
                        <Eye size={14} /> Detail
                      </button>

                      {item.status === 'Draft' && (
                        <button
                          onClick={() => handleOpenForm(item)}
                          className="btn btn-sm btn-secondary"
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(item.id, item.topik)}
                        className="btn btn-sm btn-ghost"
                        style={{ color: 'var(--danger)' }}
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* WORKFLOW STAGE ACTIONS */}
                  <div>
                    {item.status === 'Draft' && (
                      <button
                        onClick={() => handleSubmitWorkflow(item)}
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        <Send size={14} /> Ajukan Lokus ke Verifikator
                      </button>
                    )}

                    {item.status === 'Diajukan' && (
                      <button
                        onClick={() => handleOpenVerifyModal(item)}
                        className="btn btn-secondary"
                        style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--blue)', color: 'var(--blue)' }}
                      >
                        <ShieldCheck size={14} /> Verifikasi &amp; Tentukan Persetujuan
                      </button>
                    )}

                    {item.status === 'Disetujui' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                        <button
                          onClick={() => handleExportToJadwal(item)}
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: 10, padding: '4px 6px', justifyContent: 'center' }}
                          title="Teruskan ke Jadwal Kegiatan"
                        >
                          <Calendar size={11} /> +Jadwal
                        </button>
                        <button
                          onClick={() => handleExportToSurat(item)}
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: 10, padding: '4px 6px', justifyContent: 'center' }}
                          title="Buat Draft Surat Tugas & SPPD"
                        >
                          <FileText size={11} /> +Surat
                        </button>
                        <button
                          onClick={() => handleExportToArsip(item)}
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: 10, padding: '4px 6px', justifyContent: 'center' }}
                          title="Catat Laporan Hasil Kunjungan"
                        >
                          <FileCheck size={11} /> +Laporan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="glass-card rounded-xl border border-gray-800 overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold border-b border-gray-800">
              <tr>
                <th className="py-3 px-4">Komisi</th>
                <th className="py-3 px-4">Topik & Fokus Kajian</th>
                <th className="py-3 px-4">Instansi & Lokus Tujuan</th>
                <th className="py-3 px-4">Jadwal Perjalanan</th>
                <th className="py-3 px-4">Biaya SPPD</th>
                <th className="py-3 px-4">Status & Peringatan</th>
                <th className="py-3 px-4 text-right">Aksi & Integrasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredData.map((item) => {
                const statusConfig = STATUS_BADGE[item.status] || STATUS_BADGE['Draft'];
                const conflicts = getLokusConflicts(item);
                const hasConflict = conflicts.length > 0;

                return (
                  <tr key={item.id} className={`hover:bg-gray-800/40 transition-colors ${hasConflict ? 'bg-amber-950/20' : ''}`}>
                    <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                      {item.komisi}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white max-w-xs truncate">{item.topik}</div>
                      <div className="text-gray-400 max-w-xs truncate">{item.bidangKajian || item.maksudTujuan}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{item.instansiTujuan}</div>
                      <div className="text-sky-400">{item.kabKota}, {item.provinsi}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div>{formatDate(item.tanggalMulai)}</div>
                      <div className="text-gray-400">{item.durasiHari} Hari</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400 whitespace-nowrap">
                      {formatRupiah(item.estimasiBiaya)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => item.status === 'Draft' ? handleOpenForm(item) : handleViewDetail(item)}
                          className="lokus-status-button px-2.5 py-1 rounded-full text-xs font-semibold inline-block border"
                          style={{ backgroundColor: statusConfig.bg, borderColor: statusConfig.border, color: statusConfig.color }}
                          title={item.status === 'Draft' ? 'Klik untuk melanjutkan mengisi draft' : 'Klik untuk melihat detail status'}
                        >
                          {item.status}
                        </button>
                        {hasConflict && (
                          <div className="text-amber-400 font-semibold text-[11px] flex items-center gap-1">
                            <AlertTriangle size={13} /> Bentrok Lokus
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleViewDetail(item)}
                          className="btn btn-ghost p-1.5"
                          title="Detail"
                        >
                          <Eye size={15} />
                        </button>
                        {item.status === 'Disetujui' && (
                          <button
                            onClick={() => handleExportToJadwal(item)}
                            className="btn btn-secondary py-1 px-2 text-xs flex items-center gap-1"
                            title="Teruskan ke Jadwal"
                          >
                            <ExternalLink size={13} /> Jadwal
                          </button>
                        )}
                        {item.status === 'Diajukan' && (
                          <button
                            onClick={() => handleOpenVerifyModal(item)}
                            className="btn btn-primary py-1 px-2 text-xs"
                          >
                            Verifikasi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL INPUT FORM (12 DATA FIELDS) */}
      {showFormModal && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="modal" style={{ width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', padding: 24, borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Compass size={20} style={{ color: 'var(--blue)' }} />
                <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 900, color: 'var(--text)' }}>
                  {activeItem ? 'Edit Rencana Lokus Kunjungan' : 'Form Pengajuan Lokus Perjalanan Dinas'}
                </h2>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="btn btn-sm btn-ghost"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Row 1: Komisi & Jenis Perjalanan */}
              <div className="grid-3" style={{ gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Komisi Pengusul <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <select
                    value={formData.komisi}
                    onChange={(e) => setFormData({ ...formData, komisi: e.target.value })}
                    className="form-select"
                    style={{ width: '100%' }}
                  >
                    <option value="Komisi I">Komisi I (Pemerintahan)</option>
                    <option value="Komisi II">Komisi II (Perekonomian)</option>
                    <option value="Komisi III">Komisi III (Pembangunan)</option>
                    <option value="Komisi IV">Komisi IV (Kesra)</option>
                    <option value="Gabungan">Gabungan / Pimpinan DPRD</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Masa / Sesi Kegiatan
                  </label>
                  <input
                    type="text"
                    value={formData.masaSesi}
                    onChange={(e) => setFormData({ ...formData, masaSesi: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                    placeholder="Masa Persidangan III Tahun 2026"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Jenis Perjalanan Dinas
                  </label>
                  <select
                    value={formData.jenisPerjalanan}
                    onChange={(e) => setFormData({ ...formData, jenisPerjalanan: e.target.value })}
                    className="form-select"
                    style={{ width: '100%' }}
                  >
                    {JENIS_PERJALANAN_LIST.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Topik Agenda */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Topik / Agenda Kunjungan Kerja <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Studi Komparasi Optimalisasi Pelayanan Publik Digital & Smart City"
                  value={formData.topik}
                  onChange={(e) => setFormData({ ...formData, topik: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Row 3: Tanggal Berangkat & Kunjungan */}
              <div className="grid-4" style={{ gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Tanggal Berangkat
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalBerangkat}
                    onChange={(e) => setFormData({ ...formData, tanggalBerangkat: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Tanggal Mulai Lokus <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalMulai}
                    onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Tanggal Selesai <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalSelesai}
                    onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Durasi (Hari)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.durasiHari}
                    onChange={(e) => setFormData({ ...formData, durasiHari: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Row 4: Provinsi & Kab/Kota */}
              <div className="grid-2" style={{ gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Provinsi Tujuan <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jawa Barat / DKI Jakarta"
                    value={formData.provinsi}
                    onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Kabupaten / Kota Tujuan <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kota Bandung"
                    value={formData.kabKota}
                    onChange={(e) => setFormData({ ...formData, kabKota: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Row 5: Instansi Lokus & Alamat */}
              <div className="grid-2" style={{ gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Instansi / Lokus Dikunjungi <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Diskominfo Kota Bandung & DPRD Kota Bandung"
                    value={formData.instansiTujuan}
                    onChange={(e) => setFormData({ ...formData, instansiTujuan: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Alamat Lengkap Lokus
                  </label>
                  <input
                    type="text"
                    placeholder="Jl. Wastu Kencana No. 2, Bandung"
                    value={formData.alamatLokus}
                    onChange={(e) => setFormData({ ...formData, alamatLokus: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Row 6: Bidang Kajian & Koordinator */}
              <div className="grid-2" style={{ gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Bidang / Urusan yang Dikaji
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: SPBE, Tata Ruang, Pajak Daerah, Layanan Kesehatan"
                    value={formData.bidangKajian}
                    onChange={(e) => setFormData({ ...formData, bidangKajian: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Koordinator Tim Rombongan
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Ketua / Koordinator Tim"
                    value={formData.koordinator}
                    onChange={(e) => setFormData({ ...formData, koordinator: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Dasar / Maksud &amp; Tujuan Kunjungan
                </label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan latar belakang dan target rekomendasi kunjungan..."
                  value={formData.maksudTujuan}
                  onChange={(e) => setFormData({ ...formData, maksudTujuan: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', height: 'auto' }}
                />
              </div>

              {/* Row 7: Rombongan & Estimasi Biaya */}
              <div className="grid-2" style={{ gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Komposisi Rombongan Anggota Dewan &amp; Pendamping
                  </label>
                  <input
                    type="text"
                    placeholder="Ketua, Wakil, 6 Anggota Komisi I & 2 Staf Pendamping"
                    value={formData.rombongan}
                    onChange={(e) => setFormData({ ...formData, rombongan: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Estimasi Biaya Perjalanan Dinas SPPD (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="48500000"
                    value={formData.estimasiBiaya}
                    onChange={(e) => setFormData({ ...formData, estimasiBiaya: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Row 8: Surat & Keterangan */}
              <div className="grid-2" style={{ gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Nomor Surat Tugas &amp; SPPD (Jika Ada)
                  </label>
                  <input
                    type="text"
                    placeholder="090/ST-K.I/DPRD/2026"
                    value={formData.noSuratTugas}
                    onChange={(e) => setFormData({ ...formData, noSuratTugas: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Keterangan Tambahan
                  </label>
                  <input
                    type="text"
                    placeholder="Catatan akomodasi, transportasi, atau audiensi"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Section Lampiran Dokumen Resmi DPRD */}
              <div style={{ padding: 14, background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--blue)', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', marginBottom: 10 }}>
                  <FileText size={16} /> Lampiran Dokumen Kelengkapan Pengajuan (Sistem Komisi DPRD)
                </div>
                <div className="grid-3" style={{ gap: 12, fontSize: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>
                      1. Dokumen KAK / Kerangka Kerja
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) setFormData({ ...formData, lampiranKAK: file.name });
                      }}
                      style={{ fontSize: 11, color: 'var(--text-2)' }}
                    />
                    {formData.lampiranKAK && (
                      <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>📄 {formData.lampiranKAK}</div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>
                      2. Surat Undangan / Audiensi
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) setFormData({ ...formData, lampiranUndangan: file.name });
                      }}
                      style={{ fontSize: 11, color: 'var(--text-2)' }}
                    />
                    {formData.lampiranUndangan && (
                      <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>✉️ {formData.lampiranUndangan}</div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>
                      3. Proposal / Berkas Pendukung
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.zip"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) setFormData({ ...formData, lampiranProposal: file.name });
                      }}
                      style={{ fontSize: 11, color: 'var(--text-2)' }}
                    />
                    {formData.lampiranProposal && (
                      <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>📁 {formData.lampiranProposal}</div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Simpan sebagai Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VERIFIKASI / PERSETUJUAN */}
      {showVerifyModal && activeItem && (
        <div className="lokus-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="lokus-verify-card glass-card bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="lokus-verify-header flex justify-between items-center border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-sky-400" size={20} />
                <div>
                  <h3 className="text-lg font-bold text-white">Verifikasi Penentuan Lokus</h3>
                  <p>Periksa data sebelum mengambil keputusan</p>
                </div>
              </div>
              <button onClick={() => setShowVerifyModal(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="lokus-workflow-steps" aria-label="Tahapan workflow lokus">
              <div className="done"><span>1</span><small>Draft</small></div>
              <div className="done"><span>2</span><small>Diajukan</small></div>
              <div className="current"><span>3</span><small>Verifikasi</small></div>
              <div><span>4</span><small>Keputusan</small></div>
            </div>

            <div className="lokus-verify-summary">
              <div className="lokus-verify-summary-top">
                <span className="lokus-verify-status">MENUNGGU KEPUTUSAN</span>
                <span>{activeItem.komisi}</span>
              </div>
              <h4>{activeItem.topik}</h4>
              <div className="lokus-verify-meta">
                <span><MapPin size={14} /> {activeItem.instansiTujuan}</span>
                <span><Calendar size={14} /> {formatDate(activeItem.tanggalMulai)} s/d {formatDate(activeItem.tanggalSelesai)}</span>
              </div>
              <div className="lokus-verify-location">{activeItem.kabKota}, {activeItem.provinsi}</div>
            </div>

            <div className="lokus-verify-notes">
                <label>
                  Catatan Verifikator / Alasan Persetujuan/Penolakan
                </label>
                <textarea
                  rows={3}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Tuliskan alasan persetujuan atau poin revisi..."
                  className="form-textarea w-full bg-gray-800 border-gray-700 rounded-lg text-white text-xs"
                />
            </div>

            <div className="lokus-verify-actions pt-3 border-t border-gray-800 flex justify-end gap-2 text-xs">
              <button
                onClick={() => handleProcessVerify('Ditolak')}
                className="btn btn-secondary border-red-500/50 text-red-400 hover:bg-red-500/20"
              >
                <ShieldAlert size={14} className="mr-1 inline" /> Tolak / Revisi
              </button>
              <button
                onClick={() => handleProcessVerify('Disetujui')}
                className="btn btn-primary bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
              >
                <CheckCircle size={14} className="mr-1 inline" /> Disetujui Pimpinan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL LOKUS & HASIL */}
      {showDetailModal && activeItem && (
        <div className="lokus-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-start border-b border-gray-800 pb-4">
              <div>
                <span className="px-3 py-1 bg-sky-600/20 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-semibold">
                  {activeItem.komisi} • {activeItem.jenisPerjalanan}
                </span>
                <h2 className="text-xl font-bold text-white mt-2">{activeItem.topik}</h2>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
                <div>
                  <div className="text-[11px] text-gray-400 uppercase font-semibold">Instansi Lokus Tujuan</div>
                  <div className="font-bold text-white text-sm mt-0.5">{activeItem.instansiTujuan}</div>
                  <div className="text-sky-400 mt-0.5">{activeItem.kabKota}, {activeItem.provinsi}</div>
                  {activeItem.alamatLokus && <div className="text-gray-400 text-[11px] mt-1">{activeItem.alamatLokus}</div>}
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 uppercase font-semibold">Jadwal Perjalanan</div>
                  <div className="font-semibold text-white mt-0.5">
                    {formatDate(activeItem.tanggalMulai)} – {formatDate(activeItem.tanggalSelesai)}
                  </div>
                  <div className="text-gray-400 mt-0.5">Durasi: {activeItem.durasiHari} Hari Kerja</div>
                  <div className="text-gray-400 mt-0.5">Masa: {activeItem.masaSesi}</div>
                </div>
              </div>

              {activeItem.bidangKajian && (
                <div>
                  <div className="text-[11px] text-gray-400 uppercase font-semibold mb-1">Bidang / Urusan yang Dikaji</div>
                  <div className="p-2.5 bg-gray-800/40 rounded-lg border border-gray-800 text-white font-medium">
                    {activeItem.bidangKajian}
                  </div>
                </div>
              )}

              {/* Lampiran Dokumen Resmi DPRD */}
              <div>
                <div className="text-[11px] text-gray-400 uppercase font-semibold mb-1">Dokumen Kelengkapan Pengajuan (DPRD)</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">1. Dokumen KAK</div>
                    <div className="text-sky-300 font-semibold text-xs mt-0.5 truncate">
                      {activeItem.lampiranKAK ? `📄 ${activeItem.lampiranKAK}` : 'Belum diunggah'}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">2. Surat Undangan</div>
                    <div className="text-blue-300 font-semibold text-xs mt-0.5 truncate">
                      {activeItem.lampiranUndangan ? `✉️ ${activeItem.lampiranUndangan}` : 'Belum diunggah'}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">3. Proposal / Berkas</div>
                    <div className="text-indigo-300 font-semibold text-xs mt-0.5 truncate">
                      {activeItem.lampiranProposal ? `📁 ${activeItem.lampiranProposal}` : 'Belum diunggah'}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-gray-400 uppercase font-semibold mb-1">Maksud & Tujuan Perjalanan</div>
                <p className="bg-gray-800/30 p-3 rounded-lg border border-gray-800 text-gray-200 leading-relaxed">
                  {activeItem.maksudTujuan || 'Tidak ada uraian maksud kunjungan.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] text-gray-400 uppercase font-semibold">Koordinator Tim</div>
                  <div className="font-medium text-white">{activeItem.koordinator || '-'}</div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 uppercase font-semibold">Susunan Rombongan</div>
                  <div className="font-medium text-white">{activeItem.rombongan || '-'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-b border-gray-800 py-3">
                <div>
                  <div className="text-[11px] text-gray-500">Estimasi SPPD</div>
                  <div className="font-bold text-emerald-400 text-sm">{formatRupiah(activeItem.estimasiBiaya)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">No. Surat Tugas</div>
                  <div className="font-medium text-gray-200">{activeItem.noSuratTugas || '-'}</div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">No. SPPD</div>
                  <div className="font-medium text-gray-200">{activeItem.noSPPD || '-'}</div>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-gray-400 uppercase font-semibold mb-1">Catatan Verifikasi / Status</div>
                <div className="p-3 bg-sky-950/30 border border-sky-800/40 rounded-lg text-sky-200 text-xs">
                  {activeItem.catatanVerifikasi || 'Belum ada catatan verifikasi pimpinan.'}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleOpenForm(activeItem);
                }}
                className="btn btn-secondary text-xs"
              >
                <Edit3 size={14} className="mr-1 inline" /> Edit Lokus Ini
              </button>

              <button
                onClick={() => setShowDetailModal(false)}
                className="btn btn-primary text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
