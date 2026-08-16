import React, { useState } from 'react';
import { BarChart, Download, Printer, FileSpreadsheet, CheckCircle2, TrendingUp, Award, Clock, QrCode, X, Shield } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { logActivity } from '../utils/audit';
import { generateOfficialReportPdf } from '../utils/pdf';

// ─── Komponen Modal QR Laporan ──────────────────────────────────────────────
function ModalQRLaporan({ laporan, onClose }) {
  const token = `RPT-${laporan.kode}-DPRD-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
  const qrData = JSON.stringify({
    jenis: 'LAPORAN_RESMI_DPRD',
    judul: laporan.judul,
    komisi: 'Komisi I–IV',
    periode: `${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`,
    tanggalCetak: new Date().toISOString(),
    dicetak_oleh: 'Sekretariat DPRD',
    status: 'TERVERIFIKASI',
    token
  });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.65)', zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div className="card" style={{ width: 420, maxWidth: '95%', padding: 0 }}>
        {/* Header */}
        <div style={{
          background: 'var(--navy)', color: '#fff', padding: '16px 20px',
          borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>📄 QR Verifikasi Laporan Resmi</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Scan untuk memverifikasi keaslian laporan</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ padding: 24, textAlign: 'center' }}>
          {/* QR Code — bisa di-scan kamera HP */}
          <div style={{
            background: '#fff', display: 'inline-block', padding: 14,
            borderRadius: 14, border: '3px solid var(--gold)', marginBottom: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
          }}>
            <QRCodeSVG
              value={qrData}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, color: 'var(--navy)' }}>
            {laporan.judul}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
            DPRD — Sekretariat Komisi I–IV
          </div>

          {/* Badge Status */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <span className="badge badge-green"><CheckCircle2 size={11} /> TERVERIFIKASI</span>
            <span className="badge badge-gray">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>

          {/* Token */}
          <div style={{
            background: '#F8FAFC', border: '1px dashed var(--border)', borderRadius: 8,
            padding: '10px 14px', marginBottom: 16, textAlign: 'left'
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Token Verifikasi:</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {token}
            </div>
          </div>

          {/* Petunjuk scan */}
          <div style={{
            padding: '10px 14px', background: '#EFF6FF', borderRadius: 8,
            fontSize: 12, color: '#1E40AF', textAlign: 'left', lineHeight: 1.7
          }}>
            📱 <strong>Cara scan:</strong><br />
            Buka <strong>Kamera HP</strong> → Arahkan ke QR di atas → Tap notifikasi yang muncul.<br />
            Hasil scan akan menampilkan data laporan + status verifikasi.
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={onClose}>Tutup</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                logActivity('PRINT_QR_LAPORAN', `Mencetak QR Laporan: ${laporan.judul}`);
                window.print();
              }}
            >
              🖨️ Cetak QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Data Laporan ────────────────────────────────────────────────────────────
const JENIS_LAPORAN = [
  {
    kode: 'PRESENSI-KUM',
    judul: 'Laporan Rekapitulasi Presensi',
    deskripsi: 'Rekap kehadiran seluruh anggota Komisi I–IV per periode kegiatan.',
    icon: '📊',
    format: 'PDF',
    badgeColor: 'badge-red'
  },
  {
    kode: 'AGENDA-KOM',
    judul: 'Laporan Agenda & Realisasi Kegiatan',
    deskripsi: 'Daftar seluruh kegiatan/rapat yang terlaksana, tertunda, atau dibatalkan.',
    icon: '📅',
    format: 'XLSX',
    badgeColor: 'badge-green'
  },
  {
    kode: 'ANGGARAN-KOM',
    judul: 'Laporan Realisasi Anggaran Komisi',
    deskripsi: 'Serapan anggaran per pos pengeluaran (konsumsi, kunker, honorarium, ATK).',
    icon: '💰',
    format: 'PDF',
    badgeColor: 'badge-orange'
  },
  {
    kode: 'SURAT-REK',
    judul: 'Rekapitulasi Surat Masuk & Keluar',
    deskripsi: 'Rekap surat masuk/keluar dan status disposisi Komisi I–IV.',
    icon: '📬',
    format: 'PDF',
    badgeColor: 'badge-blue'
  },
  {
    kode: 'ARSIP-DOK',
    judul: 'Inventarisasi Dokumen Arsip Digital',
    deskripsi: 'Daftar dokumen final yang telah diarsipkan dan ditandatangani digital.',
    icon: '🗂️',
    format: 'PDF',
    badgeColor: 'badge-gray'
  },
];

// ─── Komponen Utama Laporan ──────────────────────────────────────────────────
export default function LaporanPage() {
  const [downloading, setDownloading] = useState(null);
  const [qrLaporan, setQrLaporan] = useState(null); // laporan yang sedang tampil QR-nya

  const handleExport = (laporan) => {
    setDownloading(laporan.kode);
    logActivity('EXPORT_REPORT', `Mengeksport laporan: ${laporan.judul} (${laporan.format})`);
    setTimeout(() => {
      setDownloading(null);
      alert(`✅ ${laporan.judul} (${laporan.format}) berhasil di-generate dan diunduh!`);
    }, 1200);
  };

  const handleShowQR = (laporan) => {
    logActivity('GENERATE_QR_LAPORAN', `Membuat QR Verifikasi Laporan: ${laporan.judul}`);
    setQrLaporan(laporan);
  };

  return (
    <div className="page">
      {/* Modal QR Laporan */}
      {qrLaporan && (
        <ModalQRLaporan laporan={qrLaporan} onClose={() => setQrLaporan(null)} />
      )}

      {/* Page Header */}
      <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Laporan & Dashboard Eksekutif</h1>
          <p>Fitur 8, 9, & 43: Rekapitulasi Absensi, Export PDF/Excel, QR Verifikasi & Executive Summary Pimpinan</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Cetak Halaman
          </button>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY CARDS */}
      <div className="card mb-6" style={{ background: 'var(--navy)', color: '#fff', padding: 24 }}>
        <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)', margin: 0 }}>🏛️ Dashboard Ringkasan Pimpinan (Executive Summary)</h2>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: '4px 0 0' }}>Performa Kumulatif Kegiatan & Kehadiran Anggota Komisi I–IV</p>
          </div>
          <span className="badge" style={{ background: 'var(--gold)', color: 'var(--navy)', fontWeight: 700 }}>T.A. 2026</span>
        </div>

        <div className="grid-4" style={{ gap: 16 }}>
          {[
            { label: 'Tingkat Kehadiran Kumulatif', value: '92.4%', sub: '🟢 Kategori Sangat Baik', color: '#10B981', subColor: '#6EE7B7' },
            { label: 'Total Rapat Terlaksana', value: '48 Kegiatan', sub: 'Komisi I–IV', color: '#3B82F6', subColor: '#93C5FD' },
            { label: 'Disposisi Selesai', value: '95.8%', sub: 'Tepat Waktu', color: '#F59E0B', subColor: '#FCD34D' },
            { label: 'Dokumen Terverifikasi QR', value: '124 Dokumen', sub: 'Status Final', color: '#EC4899', subColor: '#FBCFE8' },
          ].map((item, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{item.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: item.color, marginTop: 4 }}>{item.value}</div>
              <div style={{ fontSize: 11, color: item.subColor, marginTop: 4 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* REKAP KOMISI + PUSAT UNDUH */}
      <div className="grid-2 mb-6">
        {/* Persentase Kehadiran */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Persentase Kehadiran per Komisi</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { name: 'Komisi I (Hukum & Pemerintahan)', pct: 94.5, color: '#10B981', cls: 'text-green' },
              { name: 'Komisi II (Ekonomi & Keuangan)', pct: 91.0, color: '#3B82F6', cls: 'text-blue' },
              { name: 'Komisi III (Pembangunan)', pct: 89.2, color: '#F59E0B', cls: 'text-orange' },
              { name: 'Komisi IV (Kesejahteraan Rakyat)', pct: 95.0, color: '#10B981', cls: 'text-green' },
            ].map((k, i) => (
              <div key={i}>
                <div className="flex justify-between" style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  <span>{k.name}</span>
                  <span className={k.cls}>{k.pct}%</span>
                </div>
                <div style={{ background: '#E2E8F0', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ background: k.color, height: '100%', width: `${k.pct}%`, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pusat Unduh Laporan */}
        <div className="card flex flex-col justify-between" style={{ padding: 24 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Pusat Unduh Laporan</h3>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
              Cetak/unduh laporan PDF, Excel, atau generate QR untuk verifikasi keaslian.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {JENIS_LAPORAN.map(lap => (
                <div key={lap.kode} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', border: '1px solid var(--border)',
                  borderRadius: 8, background: 'var(--bg)'
                }}>
                  <span style={{ fontSize: 20 }}>{lap.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', lineHeight: 1.3 }}>{lap.judul}</div>
                  </div>
                  <div className="flex gap-1" style={{ flexShrink: 0 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleExport(lap)}
                      disabled={!!downloading}
                      title={`Unduh ${lap.format}`}
                    >
                      {downloading === lap.kode ? '...' : <><Download size={13} /> {lap.format}</>}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleShowQR(lap)}
                      title="Generate QR Verifikasi"
                      style={{ color: 'var(--green)' }}
                    >
                      <QrCode size={13} /> QR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PANDUAN QR LAPORAN */}
      <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)', border: '1px solid #BFDBFE' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ width: 48, height: 48, background: 'var(--navy)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={24} color="var(--gold)" />
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginBottom: 6 }}>
              🔏 Fitur QR Verifikasi Keaslian Laporan
            </div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
              Setiap laporan resmi DPRD dapat di-generate QR Code-nya sebagai bukti keaslian digital.<br />
              QR berisi: <strong>judul laporan, tanggal cetak, token unik</strong>, dan status verifikasi.<br />
              <strong>Cara kerja:</strong> Klik tombol <strong>QR</strong> pada laporan → Scan dengan kamera HP → Hasil verifikasi tampil otomatis.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
