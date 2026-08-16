import React, { useState, useEffect } from 'react';
import { Mail, Send, FileText, Plus, Search, Filter, CheckCircle2, Clock, AlertCircle, ArrowRight, CornerDownRight, ShieldCheck, Edit3, QrCode, Download, X, Pen } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { logActivity } from '../utils/audit';
import { userStorage } from '../utils/storage';
import { generateOfficialSuratPdf } from '../utils/pdf';

const INITIAL_SURAT_MASUK = [
  {
    id: 'SM-001',
    nomorSurat: '005/UND/DPRD/2026',
    tanggalSurat: '2026-08-10',
    tanggalDiterima: '2026-08-11',
    pengirim: 'Dinas Pemuda & Olahraga',
    tujuan: 'Komisi IV',
    perihal: 'Undangan Rapat Dengar Pendapat Evaluasi Program Olahraga',
    sifat: 'Penting',
    status: 'Diteruskan',
    disposisiCount: 1,
  },
  {
    id: 'SM-002',
    nomorSurat: '112/BPN/VIII/2026',
    tanggalSurat: '2026-08-12',
    tanggalDiterima: '2026-08-14',
    pengirim: 'Badan Pertanahan Nasional',
    tujuan: 'Komisi I',
    perihal: 'Laporan Progres Sertifikasi Tanah Aset Daerah',
    sifat: 'Segera',
    status: 'Baru',
    disposisiCount: 0,
  },
  {
    id: 'SM-003',
    nomorSurat: '088/DISKOMINFO/2026',
    tanggalSurat: '2026-08-15',
    tanggalDiterima: '2026-08-16',
    pengirim: 'Diskominfo Kab/Kota',
    tujuan: 'Komisi III',
    perihal: 'Permohonan Pengadaan Infrastruktur Jaringan Desa',
    sifat: 'Biasa',
    status: 'Diproses',
    disposisiCount: 1,
  }
];

const INITIAL_SURAT_KELUAR = [
  {
    id: 'SK-001',
    nomorSurat: '001/KOM-I/DPRD/VIII/2026',
    tanggalSurat: '2026-08-14',
    pengirimKomisi: 'Komisi I',
    tujuan: 'Bupati / Wali Kota',
    perihal: 'Rekomendasi Penataan Struktur Organisasi Perangkat Daerah',
    sifat: 'Penting',
    status: 'Ditandatangani',
    ttdBy: 'Ketua Komisi I',
    ttdAt: '2026-08-14T09:30:00',
    qrToken: 'SK001-KOM1-DPRD-2026-VALID'
  },
  {
    id: 'SK-002',
    nomorSurat: '002/KOM-III/DPRD/VIII/2026',
    tanggalSurat: '2026-08-15',
    pengirimKomisi: 'Komisi III',
    tujuan: 'Dinas Pekerjaan Umum',
    perihal: 'Pemberitahuan Kunjungan Kerja Lapangan Infrastruktur Jalan',
    sifat: 'Biasa',
    status: 'Draft',
    ttdBy: '-',
    ttdAt: null,
    qrToken: null
  }
];

const INITIAL_DISPOSISI = [
  {
    id: 'DSP-001',
    suratId: 'SM-001',
    nomorSurat: '005/UND/DPRD/2026',
    dari: 'Ketua DPRD',
    tujuan: 'Komisi IV',
    instruksi: 'Tindaklanjuti dan jadwalkan RDP dalam pekan ini.',
    deadline: '2026-08-20',
    status: 'Diproses'
  }
];

// ─── KOMPONEN MODAL TTD DIGITAL DENGAN PAD GORESAN TANGAN ─────────────────
function ModalTTDSuratKeluar({ surat, user, onConfirm, onCancel }) {
  const [namaPenandatangan, setNamaPenandatangan] = useState(user?.displayName || 'Ketua Komisi');
  const [jabatan, setJabatan] = useState(user?.roleLabel || 'Pimpinan Komisi');
  const [catatan, setCatatan] = useState('');
  const [signed, setSigned] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = React.useRef(null);
  const isDrawingRef = React.useRef(false);

  // Inisialisasi canvas TTD
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1E3A8A'; // Deep blue ink
  }, []);

  const startDrawing = (e) => {
    isDrawingRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const qrData = JSON.stringify({
    jenis: 'PENGESAHAN_SURAT_DPRD',
    nomor: surat.nomorSurat,
    komisi: surat.pengirimKomisi,
    tujuan: surat.tujuan,
    perihal: surat.perihal,
    penandatangan: namaPenandatangan,
    jabatan,
    waktuTTD: new Date().toISOString(),
    status: 'SAH',
    verifikasi: `DPRD-SURAT-${surat.id}-${Date.now().toString(36).toUpperCase()}`
  });

  const handleSign = () => {
    setSigned(true);
    let signatureImage = null;
    if (canvasRef.current && hasDrawn) {
      signatureImage = canvasRef.current.toDataURL('image/png');
    }
    setTimeout(() => {
      onConfirm({ namaPenandatangan, jabatan, catatan, qrData, signatureImage });
    }, 700);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 660, maxHeight: '92vh' }}>
        {/* Header */}
        <div className="modal-header" style={{ background: 'var(--navy)', color: '#fff', borderBottom: 'none' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>✍️ Tanda Tangan Digital Pimpinan</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Pengesahan Resmi &amp; Bubuhkan TTD Digital</div>
          </div>
          <button className="btn btn-ghost btn-icon-sm" onClick={onCancel} style={{ color: '#fff' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: 20, overflowY: 'auto' }}>
          {/* Ringkasan Surat */}
          <div style={{
            border: '1.5px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 14,
            background: 'var(--surface2)', fontSize: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-3)' }}>No. Surat:</span>
              <strong style={{ color: 'var(--text)' }}>{surat.nomorSurat}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-3)' }}>Kepada:</span>
              <strong style={{ color: 'var(--blue)' }}>{surat.tujuan}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-3)' }}>Perihal:</span>
              <span style={{ fontWeight: 600, color: 'var(--text)', maxWidth: 300, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {surat.perihal}
              </span>
            </div>
          </div>

          {/* Form Identitas Penandatangan */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Nama Penandatangan *</label>
              <input
                className="form-input"
                value={namaPenandatangan}
                onChange={e => setNamaPenandatangan(e.target.value)}
                placeholder="Nama lengkap pimpinan..."
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Jabatan Pimpinan *</label>
              <input
                className="form-input"
                value={jabatan}
                onChange={e => setJabatan(e.target.value)}
                placeholder="Jabatan resmi..."
              />
            </div>
          </div>

          {/* Canvas Pad Goresan Tanda Tangan */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>
                Goreskan Tanda Tangan Anda di Bawah Ini:
              </label>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={clearCanvas}
                style={{ fontSize: 11, color: 'var(--danger)', padding: '2px 8px' }}
              >
                Hapus / Ulangi
              </button>
            </div>
            <div style={{
              background: '#FFFFFF',
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius)',
              touchAction: 'none',
              position: 'relative',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)'
            }}>
              <canvas
                ref={canvasRef}
                width={580}
                height={140}
                style={{ width: '100%', height: 140, cursor: 'crosshair', display: 'block' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none', color: 'var(--text-4)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <Pen size={14} /> Sentuh atau gunakan mouse untuk tanda tangan
                </div>
              )}
            </div>
          </div>

          {/* QR Preview & Verifikasi */}
          <div style={{
            border: '1px solid var(--border)', borderRadius: 10, padding: 10,
            display: 'flex', gap: 12, alignItems: 'center', background: 'var(--surface2)'
          }}>
            <div style={{ flexShrink: 0, background: '#fff', padding: 4, borderRadius: 6, border: '1px solid var(--border)' }}>
              <QRCodeSVG value={qrData} size={64} level="H" includeMargin={true} style={{ display: 'block' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--success)', marginBottom: 2 }}>
                🔒 Terenkripsi dengan Barcode QR Pengesahan Resmi
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', lineHeight: 1.4 }}>
                Sistem akan menyematkan QR Verifikasi dan tanda tangan ke dalam berkas surat resmi.
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Batal</button>
          <button
            className="btn btn-primary"
            onClick={handleSign}
            disabled={signed || !namaPenandatangan}
            style={{ minWidth: 170, background: signed ? 'var(--success)' : undefined }}
          >
            {signed
              ? <><CheckCircle2 size={15} /> Disahkan &amp; Tersimpan!</>
              : <><Pen size={15} /> Sahkan Surat Keluar</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── KOMPONEN MODAL QR VERIFIKASI SURAT ────────────────────────────────────
function ModalQRSurat({ surat, onClose }) {
  const qrData = surat.qrToken
    ? JSON.stringify({
        jenis: 'SURAT_KELUAR',
        nomor: surat.nomorSurat,
        komisi: surat.pengirimKomisi,
        kepada: surat.tujuan,
        perihal: surat.perihal,
        penandatangan: surat.ttdBy,
        waktuTTD: surat.ttdAt,
        status: 'SAH',
        token: surat.qrToken
      })
    : `VERIFIKASI-${surat.nomorSurat}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380, textAlign: 'center' }}>
        <div className="modal-header">
          <div className="modal-title">QR Pengesahan Resmi</div>
          <button className="btn btn-ghost btn-icon-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
            {surat.nomorSurat}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {surat.pengirimKomisi} ➔ {surat.tujuan}
          </div>

          <div style={{ background: '#fff', padding: 14, borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <QRCodeSVG value={qrData} size={180} level="H" includeMargin={true} />
          </div>

          <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={13} /> Ditandatangani oleh {surat.ttdBy}
          </div>
          {surat.ttdAt && (
            <div style={{ fontSize: 10, color: 'var(--text-4)' }}>
              Waktu: {new Date(surat.ttdAt).toLocaleString('id-ID')}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary w-full" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ─── HALAMAN UTAMA SURAT ──────────────────────────────────────────────────
export default function SuratPage() {
  const [suratMasukList, setSuratMasukList] = useState(() => {
    const saved = localStorage.getItem('sim_surat_masuk');
    return saved ? JSON.parse(saved) : INITIAL_SURAT_MASUK;
  });

  const [suratKeluarList, setSuratKeluarList] = useState(() => {
    const saved = localStorage.getItem('sim_surat_keluar');
    return saved ? JSON.parse(saved) : INITIAL_SURAT_KELUAR;
  });

  const [disposisiList, setDisposisiList] = useState(() => {
    const saved = localStorage.getItem('sim_disposisi');
    return saved ? JSON.parse(saved) : INITIAL_DISPOSISI;
  });

  const [activeTab, setActiveTab] = useState('masuk');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKomisi, setFilterKomisi] = useState('Semua');

  const [showModalMasuk, setShowModalMasuk] = useState(false);
  const [showModalKeluar, setShowModalKeluar] = useState(false);
  const [showDisposisiModal, setShowDisposisiModal] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState(null);

  const [showTTDModal, setShowTTDModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedSK, setSelectedSK] = useState(null);

  const [formSuratMasuk, setFormSuratMasuk] = useState({
    nomorSurat: '', tanggalSurat: new Date().toISOString().split('T')[0],
    pengirim: '', tujuan: 'Komisi I', perihal: '', sifat: 'Biasa'
  });

  const [formSuratKeluar, setFormSuratKeluar] = useState({
    pengirimKomisi: 'Komisi I', nomorSurat: '',
    tanggalSurat: new Date().toISOString().split('T')[0],
    tujuan: '', perihal: '', sifat: 'Biasa'
  });

  const [formDisposisi, setFormDisposisi] = useState({
    tujuan: 'Komisi I', instruksi: '', deadline: ''
  });

  useEffect(() => {
    localStorage.setItem('sim_surat_masuk', JSON.stringify(suratMasukList));
  }, [suratMasukList]);

  useEffect(() => {
    localStorage.setItem('sim_surat_keluar', JSON.stringify(suratKeluarList));
  }, [suratKeluarList]);

  useEffect(() => {
    localStorage.setItem('sim_disposisi', JSON.stringify(disposisiList));
  }, [disposisiList]);

  const handleAddSuratMasuk = (e) => {
    e.preventDefault();
    const newSurat = {
      id: `SM-${Date.now().toString().slice(-4)}`,
      ...formSuratMasuk,
      tanggalDiterima: new Date().toISOString().split('T')[0],
      status: 'Baru', disposisiCount: 0
    };
    setSuratMasukList([newSurat, ...suratMasukList]);
    logActivity('SURAT_MASUK_ADD', `Mencatat surat masuk No: ${newSurat.nomorSurat} dari ${newSurat.pengirim}`);
    setShowModalMasuk(false);
    setFormSuratMasuk({
      nomorSurat: '', tanggalSurat: new Date().toISOString().split('T')[0],
      pengirim: '', tujuan: 'Komisi I', perihal: '', sifat: 'Biasa'
    });
  };

  const handleAddSuratKeluar = (e) => {
    e.preventDefault();
    const generatedNo = formSuratKeluar.nomorSurat.trim() ||
      `00${suratKeluarList.length + 1}/${formSuratKeluar.pengirimKomisi.replace(' ', '-')}/DPRD/VIII/2026`;
    const newSurat = {
      id: `SK-${Date.now().toString().slice(-4)}`,
      ...formSuratKeluar,
      nomorSurat: generatedNo,
      status: 'Draft',
      ttdBy: '-',
      ttdAt: null,
      qrToken: null
    };
    setSuratKeluarList([newSurat, ...suratKeluarList]);
    logActivity('SURAT_KELUAR_ADD', `Menerbitkan draft surat keluar No: ${newSurat.nomorSurat}`);
    setShowModalKeluar(false);
    setFormSuratKeluar({
      pengirimKomisi: 'Komisi I', nomorSurat: '',
      tanggalSurat: new Date().toISOString().split('T')[0],
      tujuan: '', perihal: '', sifat: 'Biasa'
    });
  };

  const handleOpenTTD = (sk) => {
    setSelectedSK(sk);
    setShowTTDModal(true);
  };

  const handleConfirmTTD = ({ namaPenandatangan, jabatan, qrData, signatureImage }) => {
    setSuratKeluarList(prev => prev.map(item => {
      if (item.id === selectedSK.id) {
        return {
          ...item,
          status: 'Ditandatangani',
          ttdBy: `${namaPenandatangan} (${jabatan})`,
          ttdAt: new Date().toISOString(),
          qrToken: `SK-${selectedSK.id}-VERIFIED-${Date.now()}`,
          signatureImage: signatureImage || null
        };
      }
      return item;
    }));
    logActivity('SURAT_KELUAR_SIGN', `Penandatanganan digital surat keluar No: ${selectedSK.nomorSurat} oleh ${namaPenandatangan}`);
    setShowTTDModal(false);
    setSelectedSK(null);
  };

  const handleOpenQR = (sk) => {
    setSelectedSK(sk);
    setShowQRModal(true);
  };

  const handleAddDisposisi = (e) => {
    e.preventDefault();
    if (!selectedSurat) return;
    const newDisposisi = {
      id: `DSP-${Date.now().toString().slice(-4)}`,
      suratId: selectedSurat.id,
      nomorSurat: selectedSurat.nomorSurat,
      dari: 'Ketua / Pimpinan DPRD',
      ...formDisposisi, status: 'Belum Diproses'
    };
    setDisposisiList([newDisposisi, ...disposisiList]);
    setSuratMasukList(prev => prev.map(s => {
      if (s.id === selectedSurat.id) return { ...s, status: 'Diteruskan', disposisiCount: (s.disposisiCount || 0) + 1 };
      return s;
    }));
    logActivity('DISPOSISI_ADD', `Membuat disposisi surat No: ${selectedSurat.nomorSurat} ke ${formDisposisi.tujuan}`);
    setShowDisposisiModal(false);
    setSelectedSurat(null);
    setFormDisposisi({ tujuan: 'Komisi I', instruksi: '', deadline: '' });
  };

  const filteredSuratMasuk = suratMasukList.filter(s => {
    const matchSearch = s.nomorSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.pengirim.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKomisi = filterKomisi === 'Semua' || s.tujuan === filterKomisi;
    return matchSearch && matchKomisi;
  });

  const filteredSuratKeluar = suratKeluarList.filter(s => {
    const matchSearch = s.nomorSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.tujuan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKomisi = filterKomisi === 'Semua' || s.pengirimKomisi === filterKomisi;
    return matchSearch && matchKomisi;
  });

  const getSifatBadge = (sifat) => {
    switch (sifat) {
      case 'Penting': return <span className="badge badge-red">Penting</span>;
      case 'Segera': return <span className="badge badge-orange">Segera</span>;
      case 'Rahasia': return <span className="badge badge-purple">Rahasia</span>;
      default: return <span className="badge badge-blue">Biasa</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Baru': return <span className="badge badge-green">Baru</span>;
      case 'Diteruskan': return <span className="badge badge-orange">Diteruskan</span>;
      case 'Diproses': return <span className="badge badge-blue">Diproses</span>;
      case 'Ditandatangani': return <span className="badge badge-green">✅ Ditandatangani</span>;
      case 'Draft': return <span className="badge badge-yellow">Draft</span>;
      default: return <span className="badge badge-gray">{status}</span>;
    }
  };

  const currentUser = userStorage.getCurrentUser();

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* TTD Modal */}
      {showTTDModal && selectedSK && (
        <ModalTTDSuratKeluar
          surat={selectedSK}
          user={currentUser}
          onConfirm={handleConfirmTTD}
          onCancel={() => { setShowTTDModal(false); setSelectedSK(null); }}
        />
      )}

      {/* QR Modal */}
      {showQRModal && selectedSK && (
        <ModalQRSurat
          surat={selectedSK}
          onClose={() => { setShowQRModal(false); setSelectedSK(null); }}
        />
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Manajemen Surat Menyurat
          </h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-3)', marginTop: 3 }}>
            Pengelolaan Surat Masuk, Surat Keluar, Distribusi, &amp; Disposisi Komisi I–IV
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setShowModalKeluar(true)}>
            <Send size={15} /> Buat Surat Keluar
          </button>
          <button className="btn btn-primary" onClick={() => setShowModalMasuk(true)}>
            <Plus size={15} /> Catat Surat Masuk
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 0 }}>
        <div className="stat-card">
          <div className="stat-label">Total Surat Masuk</div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{suratMasukList.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Diterima dari Instansi / Publik</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Surat Keluar</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{suratKeluarList.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Surat Resmi Komisi I–IV</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Disposisi Aktif</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{disposisiList.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Instruksi ke Komisi</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="filter-pills" style={{ marginBottom: 0 }}>
        <button
          className={`pill${activeTab === 'masuk' ? ' active' : ''}`}
          onClick={() => setActiveTab('masuk')}
        >
          <Mail size={13} style={{ marginRight: 4 }} /> 📬 Surat Masuk ({suratMasukList.length})
        </button>
        <button
          className={`pill${activeTab === 'keluar' ? ' active' : ''}`}
          onClick={() => setActiveTab('keluar')}
        >
          <Send size={13} style={{ marginRight: 4 }} /> 📤 Surat Keluar ({suratKeluarList.length})
        </button>
        <button
          className={`pill${activeTab === 'disposisi' ? ' active' : ''}`}
          onClick={() => setActiveTab('disposisi')}
        >
          <CornerDownRight size={13} style={{ marginRight: 4 }} /> 📌 Lembar Disposisi ({disposisiList.length})
        </button>
      </div>

      {/* Controls & Filters */}
      <div className="card">
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 12, padding: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Cari nomor surat, pengirim, perihal..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select className="form-select" value={filterKomisi} onChange={e => setFilterKomisi(e.target.value)}>
              <option value="Semua">Semua Komisi</option>
              <option value="Komisi I">Komisi I</option>
              <option value="Komisi II">Komisi II</option>
              <option value="Komisi III">Komisi III</option>
              <option value="Komisi IV">Komisi IV</option>
            </select>
          </div>
        </div>
      </div>

      {/* TAB: SURAT MASUK */}
      {activeTab === 'masuk' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Daftar Surat Masuk ({filteredSuratMasuk.length})</div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>No. Surat &amp; Tanggal</th>
                  <th>Pengirim &amp; Tujuan</th>
                  <th>Perihal</th>
                  <th>Sifat</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuratMasuk.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-4)' }}>Tidak ada data surat masuk.</td></tr>
                ) : (
                  filteredSuratMasuk.map((surat) => (
                    <tr key={surat.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>{surat.nomorSurat}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Diterima: {surat.tanggalDiterima}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{surat.pengirim}</div>
                        <span className="badge badge-gray" style={{ fontSize: 10, marginTop: 2 }}>➔ {surat.tujuan}</span>
                      </td>
                      <td style={{ maxWidth: 300 }}>
                        <div style={{ fontWeight: 500, fontSize: 12, lineHeight: 1.4 }}>{surat.perihal}</div>
                      </td>
                      <td>{getSifatBadge(surat.sifat)}</td>
                      <td>{getStatusBadge(surat.status)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Unduh Lembar Surat PDF"
                            onClick={() => generateOfficialSuratPdf(surat, 'SURAT_MASUK')}
                          >
                            <Download size={13} /> PDF
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => { setSelectedSurat(surat); setShowDisposisiModal(true); }}
                          >
                            <CornerDownRight size={13} /> Disposisi
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: SURAT KELUAR */}
      {activeTab === 'keluar' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Daftar Surat Keluar ({filteredSuratKeluar.length})</div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>No. Surat &amp; Tanggal</th>
                  <th>Komisi Pengirim ➔ Kepada</th>
                  <th>Perihal Surat</th>
                  <th>Sifat</th>
                  <th>Status Pengesahan</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuratKeluar.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-4)' }}>Belum ada surat keluar yang diterbitkan.</td></tr>
                ) : (
                  filteredSuratKeluar.map((sk) => (
                    <tr key={sk.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>{sk.nomorSurat}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Tanggal: {sk.tanggalSurat}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--blue)' }}>{sk.pengirimKomisi}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>➔ {sk.tujuan}</div>
                      </td>
                      <td style={{ maxWidth: 280 }}>
                        <div style={{ fontWeight: 500, fontSize: 12, lineHeight: 1.4 }}>{sk.perihal}</div>
                      </td>
                      <td>{getSifatBadge(sk.sifat)}</td>
                      <td>
                        {getStatusBadge(sk.status)}
                        {sk.ttdBy !== '-' && <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 2, fontWeight: 600 }}>✍️ {sk.ttdBy}</div>}
                        {sk.ttdAt && <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{new Date(sk.ttdAt).toLocaleString('id-ID')}</div>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Unduh Template Dokumen PDF Resmi"
                            onClick={() => generateOfficialSuratPdf(sk, 'SURAT_KELUAR')}
                          >
                            <Download size={13} /> PDF
                          </button>
                          {sk.status === 'Draft' ? (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleOpenTTD(sk)}
                            >
                              <Pen size={13} /> TTD &amp; Sahkan
                            </button>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenQR(sk)}
                              style={{ color: 'var(--success)' }}
                            >
                              <QrCode size={13} /> QR
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: LEMBAR DISPOSISI */}
      {activeTab === 'disposisi' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Daftar Lembar Disposisi ({disposisiList.length})</div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>No. Surat Ref</th>
                  <th>Dari ➔ Tujuan</th>
                  <th>Instruksi Disposisi</th>
                  <th>Tenggat (Deadline)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {disposisiList.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-4)' }}>Belum ada disposisi surat yang diterbitkan.</td></tr>
                ) : (
                  disposisiList.map((dsp) => (
                    <tr key={dsp.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text)' }}>{dsp.nomorSurat}</td>
                      <td>
                        <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{dsp.dari}</div>
                        <div style={{ fontWeight: 700, color: 'var(--blue)' }}>➔ {dsp.tujuan}</div>
                      </td>
                      <td style={{ maxWidth: 350 }}>
                        <p style={{ margin: 0, fontSize: 12, fontStyle: 'italic', color: 'var(--text-2)' }}>"{dsp.instruksi}"</p>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning)', fontSize: 12, fontWeight: 700 }}>
                          <Clock size={13} /> {dsp.deadline}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-blue">{dsp.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH SURAT MASUK */}
      {showModalMasuk && (
        <div className="modal-overlay" onClick={() => setShowModalMasuk(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title">Catat Surat Masuk Baru</div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setShowModalMasuk(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddSuratMasuk}>
                <div className="form-group">
                  <label className="form-label">Nomor Surat</label>
                  <input type="text" className="form-input" placeholder="Contoh: 005/UND/2026" required value={formSuratMasuk.nomorSurat} onChange={e => setFormSuratMasuk({ ...formSuratMasuk, nomorSurat: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Tanggal Surat</label>
                    <input type="date" className="form-input" required value={formSuratMasuk.tanggalSurat} onChange={e => setFormSuratMasuk({ ...formSuratMasuk, tanggalSurat: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sifat Surat</label>
                    <select className="form-select" value={formSuratMasuk.sifat} onChange={e => setFormSuratMasuk({ ...formSuratMasuk, sifat: e.target.value })}>
                      <option>Biasa</option><option>Penting</option><option>Segera</option><option>Rahasia</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Pengirim</label>
                    <input type="text" className="form-input" placeholder="Instansi / Dinas" required value={formSuratMasuk.pengirim} onChange={e => setFormSuratMasuk({ ...formSuratMasuk, pengirim: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Komisi Tujuan</label>
                    <select className="form-select" value={formSuratMasuk.tujuan} onChange={e => setFormSuratMasuk({ ...formSuratMasuk, tujuan: e.target.value })}>
                      <option>Komisi I</option><option>Komisi II</option><option>Komisi III</option><option>Komisi IV</option><option value="Sekretariat">Sekretariat DPRD</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Perihal Surat</label>
                  <textarea className="form-textarea" rows={3} placeholder="Ringkasan atau perihal surat..." required value={formSuratMasuk.perihal} onChange={e => setFormSuratMasuk({ ...formSuratMasuk, perihal: e.target.value })} />
                </div>
                <div className="modal-footer" style={{ margin: '14px -20px -20px', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModalMasuk(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan Surat Masuk</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUAT SURAT KELUAR */}
      {showModalKeluar && (
        <div className="modal-overlay" onClick={() => setShowModalKeluar(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title">Buat Surat Keluar Baru</div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setShowModalKeluar(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddSuratKeluar}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Komisi Pengirim</label>
                    <select className="form-select" value={formSuratKeluar.pengirimKomisi} onChange={e => setFormSuratKeluar({ ...formSuratKeluar, pengirimKomisi: e.target.value })}>
                      <option>Komisi I</option><option>Komisi II</option><option>Komisi III</option><option>Komisi IV</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nomor Surat</label>
                    <input type="text" className="form-input" placeholder="Otomatis jika kosong" value={formSuratKeluar.nomorSurat} onChange={e => setFormSuratKeluar({ ...formSuratKeluar, nomorSurat: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Tanggal Surat</label>
                    <input type="date" className="form-input" required value={formSuratKeluar.tanggalSurat} onChange={e => setFormSuratKeluar({ ...formSuratKeluar, tanggalSurat: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sifat Surat</label>
                    <select className="form-select" value={formSuratKeluar.sifat} onChange={e => setFormSuratKeluar({ ...formSuratKeluar, sifat: e.target.value })}>
                      <option>Biasa</option><option>Penting</option><option>Segera</option><option>Rahasia</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Kepada / Tujuan Surat</label>
                  <input type="text" className="form-input" placeholder="Contoh: Bupati / Kepala Dinas PU" required value={formSuratKeluar.tujuan} onChange={e => setFormSuratKeluar({ ...formSuratKeluar, tujuan: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Perihal Surat Keluar</label>
                  <textarea className="form-textarea" rows={3} placeholder="Isi / perihal surat resmi..." required value={formSuratKeluar.perihal} onChange={e => setFormSuratKeluar({ ...formSuratKeluar, perihal: e.target.value })} />
                </div>
                <div className="modal-footer" style={{ margin: '14px -20px -20px', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModalKeluar(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan Draft</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH DISPOSISI */}
      {showDisposisiModal && selectedSurat && (
        <div className="modal-overlay" onClick={() => setShowDisposisiModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div className="modal-title">Terbitkan Disposisi</div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setShowDisposisiModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>
                Untuk Surat No: <strong style={{ color: 'var(--text)' }}>{selectedSurat.nomorSurat}</strong> ({selectedSurat.pengirim})
              </p>
              <form onSubmit={handleAddDisposisi}>
                <div className="form-group">
                  <label className="form-label">Tujuan Disposisi</label>
                  <select className="form-select" value={formDisposisi.tujuan} onChange={e => setFormDisposisi({ ...formDisposisi, tujuan: e.target.value })}>
                    <option value="Komisi I">Komisi I (Hukum &amp; Pemerintahan)</option>
                    <option value="Komisi II">Komisi II (Ekonomi &amp; Keuangan)</option>
                    <option value="Komisi III">Komisi III (Pembangunan)</option>
                    <option value="Komisi IV">Komisi IV (Kesejahteraan Rakyat)</option>
                    <option value="Sekretariat">Sekretariat</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tenggat Waktu (Deadline)</label>
                  <input type="date" className="form-input" required value={formDisposisi.deadline} onChange={e => setFormDisposisi({ ...formDisposisi, deadline: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Instruksi / Catatan Disposisi</label>
                  <textarea className="form-textarea" rows={3} placeholder="Instruksi tindak lanjut dari Pimpinan..." required value={formDisposisi.instruksi} onChange={e => setFormDisposisi({ ...formDisposisi, instruksi: e.target.value })} />
                </div>
                <div className="modal-footer" style={{ margin: '14px -20px -20px', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowDisposisiModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Kirim Disposisi</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
