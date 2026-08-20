import React, { useState, useEffect, useRef } from 'react';
import { Camera, Eye, FileText, Plus, Printer, Search, Trash2, Upload, X, ShieldCheck, QrCode, Lock, CheckCircle2, FileCode, Edit3, Award, RefreshCw, AlertTriangle, Folder, FolderOpen, Download, ExternalLink } from 'lucide-react';
import WebCameraScanner from '../components/WebCameraScanner';
import { DAFTAR_KOMISI, JENIS_DOKUMEN, KOMISI_COLORS } from '../constants/theme';
import { shouldOpenInNewTab } from '../utils/arsipFiles';
import { generateOfficialReportPdf, generateScanPdfFromImage, generateOfficialArsipDocumentPdf } from '../utils/pdf';
import { arsipStorage, formatDate, notifikasiStorage, userStorage } from '../utils/storage';
import { QRCodeSVG } from 'qrcode.react';
import { logActivity } from '../utils/audit';

const EMPTY = { namaDoc: '', nomorDoc: '', tanggalDoc: '', jenisDoc: 'Surat Masuk', komisi: 'Komisi I', keterangan: '' };

export default function ArsipPage() {
  const [docs, setDocs] = useState([]);
  const [trashDocs, setTrashDocs] = useState(() => {
    const saved = localStorage.getItem('sim_trash_arsip');
    return saved ? JSON.parse(saved) : [];
  });
  const [query, setQuery] = useState('');
  const [filterKomisi, setFilter] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [verifModalDoc, setVerifModalDoc] = useState(null);
  const [viewDocModal, setViewDocModal] = useState(null); // Modal viewer inline
  const [signModalDoc, setSignModalDoc] = useState(null); // Modal Tanda Tangan Canvas
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState('Ketua Komisi');

  const fileRef = useRef();
  const sigCanvasRef = useRef(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    localStorage.setItem('sim_trash_arsip', JSON.stringify(trashDocs));
  }, [trashDocs]);

  const load = () => {
    let list = arsipStorage.getAll();
    if (query) list = list.filter(d => JSON.stringify(d).toLowerCase().includes(query.toLowerCase()));
    if (filterKomisi !== 'Semua') list = list.filter(d => d.komisi === filterKomisi);
    if (filterStatus !== 'Semua') list = list.filter(d => (d.statusFinal || 'Draft') === filterStatus);
    setDocs(list);
  };

  useEffect(() => {
    const onStorageChange = () => load();
    load();
    window.addEventListener('storage', onStorageChange);
    window.addEventListener('kegiatan-data-changed', onStorageChange);
    return () => {
      window.removeEventListener('storage', onStorageChange);
      window.removeEventListener('kegiatan-data-changed', onStorageChange);
    };
  }, [query, filterKomisi, filterStatus]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setForm(p => ({ ...p, namaDoc: p.namaDoc || f.name.replace(/\.[^.]+$/, '') })); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setForm(p => ({ ...p, namaDoc: p.namaDoc || f.name.replace(/\.[^.]+$/, '') })); }
  };

  const handleCapturedImage = (imageDataUrl) => {
    setPreviewImage(imageDataUrl);
    setShowScanner(false);
    setShowModal(true);
    setForm(p => ({ ...p, namaDoc: p.namaDoc || `Scan_Dokumen_${Date.now().toString().slice(-4)}` }));
  };

  // Helper: baca File/Blob sebagai base64 data URL
  const readFileAsDataUrl = (fileOrBlob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(fileOrBlob);
  });

  const handleSave = async () => {
    if (!form.namaDoc.trim()) return alert('Nama dokumen wajib diisi.');
    setBusy(true);

    try {
      let fileUrl = null;
      let finalFileName = file?.name || (previewImage ? 'Hasil_Scan.pdf' : null);
      let finalFileSize = file?.size;

      if (previewImage) {
        // Scan kamera → buat PDF → konversi ke base64
        const pdfData = await generateScanPdfFromImage(previewImage, form.namaDoc || 'Hasil_Scan');
        if (pdfData) {
          // pdfData.fileUrl adalah blob:// — konversi ke base64 supaya persistent
          const resp = await fetch(pdfData.fileUrl);
          const blob = await resp.blob();
          fileUrl = await readFileAsDataUrl(blob);
          finalFileName = pdfData.fileName;
          finalFileSize = pdfData.fileSize;
        }
      } else if (file) {
        // Upload file → konversi ke base64 supaya persistent setelah refresh
        fileUrl = await readFileAsDataUrl(file);
        finalFileName = file.name;
        finalFileSize = file.size;
      }

      const autoArsipNo = `ARSIP/${form.komisi.replace(' ', '-')}/${new Date().getMonth() + 1}/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;

      await arsipStorage.add({
        ...form,
        nomorDoc: form.nomorDoc || autoArsipNo,
        tanggalDoc: form.tanggalDoc || new Date().toISOString().split('T')[0],
        fileUri: fileUrl,
        fileName: finalFileName,
        fileSize: finalFileSize,
        sumber: previewImage ? 'webcam' : 'upload',
        statusFinal: 'Draft',
        versi: 'v1.0',
        ttdStatus: 'Belum Ditandatangani',
        verificationCode: `VERIF-${Date.now().toString(36).toUpperCase()}`
      });

      logActivity('ARSIP_ADD', `Menambahkan dokumen arsip: ${form.namaDoc}`);

      notifikasiStorage.add({
        judul: 'Dokumen baru ditambahkan',
        pesan: `"${form.namaDoc}" telah ditambahkan ke arsip digital.`,
        tipe: 'arsip', dibaca: false, createdAt: new Date().toISOString(),
      });
      setShowModal(false);
      setForm(EMPTY);
      setFile(null);
      setPreviewImage(null);
      load();
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan dokumen. Silakan coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteToTrash = (doc) => {
    if (doc.statusFinal === 'Final') {
      return alert('🔒 KUNCI DOKUMEN (Fitur 24): Dokumen berstatus FINAL dikunci dan tidak dapat dihapus!');
    }
    if (confirm(`Pindahkan "${doc.namaDoc}" ke Sampah Arsip?`)) {
      arsipStorage.delete(doc.id);
      setTrashDocs([ { ...doc, deletedAt: new Date().toLocaleString() }, ...trashDocs ]);
      logActivity('ARSIP_TRASH', `Memindahkan dokumen "${doc.namaDoc}" ke Sampah Arsip`);
      load();
    }
  };

  const handleRestoreFromTrash = (doc) => {
    arsipStorage.add(doc);
    setTrashDocs(prev => prev.filter(t => t.id !== doc.id));
    logActivity('ARSIP_RESTORE', `Dipulihkan dari sampah: ${doc.namaDoc}`);
    alert(`✅ Dokumen "${doc.namaDoc}" berhasil dipulihkan dari Sampah Arsip.`);
    load();
  };

  const handlePermanentDelete = (id) => {
    if (confirm('HAPUS PERMANEN: Dokumen ini akan dihapus selamanya dari sistem. Lanjutkan?')) {
      setTrashDocs(prev => prev.filter(t => t.id !== id));
      logActivity('ARSIP_PERMANENT_DELETE', `Hapus permanen dokumen dari sampah`);
    }
  };

  const openSignModal = (doc) => {
    const currentUser = userStorage.getCurrentUser() || { displayName: 'Dr. H. Bambang Yudi, S.H.', roleLabel: 'Ketua Komisi' };
    setSignerName(currentUser.displayName || 'Dr. H. Bambang Yudi, S.H.');
    setSignerRole(currentUser.roleLabel || 'Ketua Komisi');
    setSignModalDoc(doc);
    setTimeout(() => clearSignature(), 100);
  };

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const startDrawing = (e) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    isDrawing.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#1E3A8A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const handleApplySignature = async () => {
    if (!signModalDoc) return;
    if (!signerName.trim()) return alert('Nama penandatangan wajib diisi.');

    const canvas = sigCanvasRef.current;
    const sigImage = canvas ? canvas.toDataURL('image/png') : null;

    const nowStr = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const updated = {
      ...signModalDoc,
      statusFinal: 'Final',
      ttdStatus: 'Ditandatangani',
      ttdBy: signerName.trim(),
      ttdRole: signerRole || 'Pimpinan Komisi',
      ttdTime: `${nowStr} WIB`,
      ttdSignatureImage: sigImage,
      verificationCode: signModalDoc.verificationCode || `VERIF-${Date.now().toString(36).toUpperCase()}`
    };

    await arsipStorage.update(signModalDoc.id, updated);
    logActivity('ARSIP_SIGN', `Penandatanganan digital dokumen ${signModalDoc.namaDoc} oleh ${signerName}`);
    alert(`✅ Dokumen "${signModalDoc.namaDoc}" berhasil dibubuhi Tanda Tangan Digital dan berstatus FINAL & SAH!`);
    
    setPreview(updated);
    setSignModalDoc(null);
    load();
  };

  const handleSignDocument = (doc) => {
    openSignModal(doc);
  };

  // Helper convert Data URI to Blob
  const dataURItoBlob = (dataURI) => {
    try {
      const parts = dataURI.split(',');
      const byteString = atob(parts[1]);
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeString = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], { type: mimeString });
    } catch (e) {
      console.error('Error dataURItoBlob:', e);
      return null;
    }
  };

  // Buka file di modal penampil dokumen langsung di aplikasi (100% tidak blank)
  const handleViewFile = (doc) => {
    if (!doc.fileUri) {
      generateOfficialArsipDocumentPdf(doc);
      return;
    }

    let displayUrl = doc.fileUri;
    if (doc.fileUri.startsWith('data:')) {
      const blob = dataURItoBlob(doc.fileUri);
      if (blob) {
        displayUrl = URL.createObjectURL(blob);
      }
    }

    setViewDocModal({
      ...doc,
      displayUrl,
      isImage: doc.fileUri.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.fileName || ''),
      isPdf: doc.fileUri.startsWith('data:application/pdf') || /\.pdf$/i.test(doc.fileName || '')
    });
  };

  const handleDownloadDocument = (doc) => {
    // Generate PDF Resmi DPRD yang sudah dibubuhi TTD Digital & QR Code
    generateOfficialArsipDocumentPdf(doc);
  };

  const handleDownloadOriginalFile = (doc) => {
    if (doc.fileUri) {
      if (doc.fileUri.startsWith('data:')) {
        const blob = dataURItoBlob(doc.fileUri);
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = doc.fileName || `${(doc.namaDoc || 'Berkas_Asli').replace(/[/\\?%*:|"<>]/g, '_')}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
          return;
        }
      } else if (doc.fileUri.startsWith('blob:') || doc.fileUri.startsWith('http') || doc.fileUri.startsWith('/')) {
        const link = document.createElement('a');
        link.href = doc.fileUri;
        link.download = doc.fileName || `${(doc.namaDoc || 'Berkas_Asli').replace(/[/\\?%*:|"<>]/g, '_')}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
    }
    generateOfficialArsipDocumentPdf(doc);
  };

  const handleOpen = (doc) => {
    setPreview(doc);
  };

  const handlePrintReport = () => {
    if (docs.length === 0) return alert('Tidak ada data arsip untuk di-export.');
    generateOfficialReportPdf('LAPORAN REKAPITULASI ARSIP DOKUMEN DIGITAL', docs, `Laporan_Arsip_${filterKomisi}.pdf`);
  };

  return (
    <div className="page">
      <div className="page-header flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Arsip Dokumen Digital Komisi</h1>
          <p>Fitur 11–29: Repositori Dokumen, Tanda Tangan Digital, QR Keaslian, & Sampah Arsip</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setShowTrashModal(true)}>
            <Trash2 size={16} color="var(--red)" /> Sampah Arsip ({trashDocs.length})
          </button>
          <button className="btn btn-secondary" onClick={handlePrintReport}>
            <Printer size={16} /> Cetak Laporan PDF
          </button>
          <button className="btn btn-secondary" onClick={() => setShowScanner(true)}>
            <Camera size={16} /> Scan Kamera
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Tambah Dokumen
          </button>
        </div>
      </div>

      {/* FOLDER NAVIGATION (FITUR 11) */}
      <div className="mb-6">
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          📂 Direktori Folder Dokumen Komisi:
        </div>
        <div className="grid-4" style={{ gap: 12 }}>
          {['Komisi I', 'Komisi II', 'Komisi III', 'Komisi IV'].map(kom => {
            const isActive = filterKomisi === kom;
            const c = KOMISI_COLORS[kom] || { bg: '#F1F5F9', text: '#475569', accent: '#64748B' };
            const count = arsipStorage.getAll().filter(d => d.komisi === kom).length;
            return (
              <div
                key={kom}
                className="card"
                onClick={() => setFilter(isActive ? 'Semua' : kom)}
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  borderLeft: `4px solid ${c.accent}`,
                  background: isActive ? c.bg : 'var(--card)',
                  transition: 'all 0.2s'
                }}
              >
                <div className="flex items-center gap-3">
                  {isActive ? <FolderOpen size={24} color={c.accent} /> : <Folder size={24} color={c.accent} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: isActive ? c.text : 'var(--navy)' }}>📁 {kom}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{count} Dokumen Tersimpan</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
          <Search size={16} color="var(--text-3)" />
          <input
            placeholder="Cari nama, nomor arsip, nomor verifikasi..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && <button onClick={() => setQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={14} /></button>}
        </div>

        <select className="form-select" value={filterKomisi} onChange={e => setFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="Semua">Semua Komisi</option>
          {DAFTAR_KOMISI.map(k => <option key={k.id}>{k.nama}</option>)}
        </select>

        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto' }}>
          <option value="Semua">Semua Status</option>
          <option value="Draft">Draft</option>
          <option value="Final">Final (Sah)</option>
        </select>
      </div>

      {/* Docs Grid */}
      {docs.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} className="empty-state-icon" />
          <h3>Belum ada dokumen arsip</h3>
          <p>Klik "Tambah Dokumen" atau gunakan "Scan via Kamera" untuk menambahkan berkas baru.</p>
        </div>
      ) : (
        <div className="grid-docs">
          {docs.map(doc => {
            const c = KOMISI_COLORS[doc.komisi] || { bg: '#F1F5F9', text: '#475569' };
            const isFinal = doc.statusFinal === 'Final';
            return (
              <div key={doc.id} className="doc-card" onClick={() => handleOpen(doc)}>
                <div className="doc-card-icon" style={{ background: isFinal ? '#ECFDF5' : '#F1F5F9' }}>
                  {isFinal ? <ShieldCheck size={28} color="#10B981" /> : <FileText size={24} color="#64748B" />}
                  <span style={{ fontSize: 10, fontWeight: 700, color: isFinal ? '#10B981' : '#64748B' }}>
                    {isFinal ? 'FINAL' : 'DRAFT'}
                  </span>
                </div>
                <div className="doc-card-body">
                  <div className="doc-card-title flex items-center gap-1">
                    <span className="truncate">{doc.namaDoc}</span>
                    {isFinal && <Lock size={12} color="#10B981" title="Dokumen dikunci (Final)" />}
                  </div>
                  <div className="doc-card-sub">{doc.nomorDoc || '—'} · {doc.jenisDoc}</div>
                  <div className="doc-card-footer mt-2">
                    <span className="badge" style={{ background: c.bg, color: c.text }}>{doc.komisi}</span>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button className="btn btn-secondary btn-sm btn-icon" title="Lihat Detail & QR" onClick={() => handleOpen(doc)}>
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-secondary btn-sm btn-icon" title="Download / Buka File" onClick={() => handleDownloadDocument(doc)}>
                        <Download size={14} />
                      </button>
                      {!isFinal && (
                        <button className="btn btn-danger btn-sm btn-icon" title="Hapus ke Sampah" onClick={() => handleDeleteToTrash(doc)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showScanner && (
        <WebCameraScanner
          onCapture={handleCapturedImage}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Tambah Dokumen Digital</h3>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {previewImage ? (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <img src={previewImage} alt="Scan Result" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid var(--border)' }} />
                  <button className="btn btn-secondary btn-sm mt-2" onClick={() => setPreviewImage(null)}>Hapus Foto Scan</button>
                </div>
              ) : (
                <div
                  className="upload-zone mb-4"
                  style={{ padding: 20 }}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFile} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
                  <Upload size={22} />
                  <div style={{ fontSize: 13 }}>
                    {file ? <strong>{file.name}</strong> : 'Klik atau seret file dokumen'}
                  </div>
                </div>
              )}

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Nama Dokumen *</label>
                  <input className="form-input" value={form.namaDoc} onChange={e => setForm(p => ({ ...p, namaDoc: e.target.value }))} placeholder="Nama berkas..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Nomor Dokumen (Otomatis)</label>
                  <input className="form-input" value={form.nomorDoc} onChange={e => setForm(p => ({ ...p, nomorDoc: e.target.value }))} placeholder="Otomatis dibuat sistem jika kosong..." />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Jenis Dokumen</label>
                  <select className="form-select" value={form.jenisDoc} onChange={e => setForm(p => ({ ...p, jenisDoc: e.target.value }))}>
                    {JENIS_DOKUMEN.map(j => <option key={j}>{j}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Komisi</label>
                  <select className="form-select" value={form.komisi} onChange={e => setForm(p => ({ ...p, komisi: e.target.value }))}>
                    {DAFTAR_KOMISI.map(k => <option key={k.id}>{k.nama}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Keterangan</label>
                <textarea className="form-textarea" value={form.keterangan} onChange={e => setForm(p => ({ ...p, keterangan: e.target.value }))} placeholder="Keterangan tambahan..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={busy}>
                {busy ? 'Menyimpan...' : <><Plus size={15} /> Simpan Dokumen</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title">Detail & Keabsahan Dokumen</h3>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setPreview(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="flex justify-between items-center mb-3" style={{ background: preview.statusFinal === 'Final' ? '#ECFDF5' : '#FEF3C7', padding: '10px 14px', borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: preview.statusFinal === 'Final' ? '#065F46' : '#92400E' }}>
                    Status: {preview.statusFinal || 'Draft'} ({preview.versi || 'v1.0'})
                  </div>
                  <div style={{ fontSize: 11, color: preview.statusFinal === 'Final' ? '#047857' : '#B45309' }}>
                    {preview.statusFinal === 'Final' ? 'Dokumen terkunci & terverifikasi sah' : 'Dokumen masih berupa draft'}
                  </div>
                </div>
                {preview.statusFinal !== 'Final' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleSignDocument(preview)}>
                    <Edit3 size={13} /> Tanda Tangan Digital
                  </button>
                )}
              </div>

              {preview.statusFinal === 'Final' && (
                <div style={{ textAlign: 'center', background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>QR VERIFIKASI KEABSAHAN DOKUMEN</div>
                  <QRCodeSVG
                    value={JSON.stringify({
                      jenis: 'ARSIP_DOKUMEN_DPRD',
                      nama: preview.namaDoc,
                      nomorArsip: preview.nomorDoc || '-',
                      komisi: preview.komisi,
                      penandatangan: preview.ttdBy || '-',
                      waktuSah: preview.ttdTime || '-',
                      status: 'FINAL & SAH',
                      token: preview.verificationCode || 'VERIF-VALID'
                    })}
                    size={130}
                    level="H"
                    includeMargin={true}
                  />
                  <div style={{ fontSize: 11, fontFamily: 'monospace', marginTop: 8, color: 'var(--text-3)' }}>
                    Kode: {preview.verificationCode || 'VERIF-VALID'}
                  </div>
                  <button className="btn btn-secondary btn-sm mt-2" onClick={() => setVerifModalDoc(preview)}>
                    <ShieldCheck size={14} color="#10B981" /> Simulasi Scan QR Verifikasi
                  </button>
                </div>
              )}

              <table style={{ width: '100%' }}>
                <tbody>
                  {[
                    ['Nama Dokumen', preview.namaDoc],
                    ['Nomor Arsip', preview.nomorDoc || '—'],
                    ['Komisi', preview.komisi],
                    ['Penandatangan', preview.ttdBy ? `${preview.ttdBy} (${preview.ttdRole})` : 'Belum Ditandatangani'],
                    ['Waktu Sah', preview.ttdTime || '—'],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ padding: '6px 0', fontWeight: 600, fontSize: 13, color: 'var(--text-2)', width: 140 }}>{k}</td>
                      <td style={{ padding: '6px 0', fontSize: 13 }}>{v}</td>
                    </tr>
                  ))}
                  {preview.ttdSignatureImage && (
                    <tr>
                      <td style={{ padding: '6px 0', fontWeight: 600, fontSize: 13, color: 'var(--text-2)' }}>Tanda Tangan</td>
                      <td style={{ padding: '6px 0' }}>
                        <img
                          src={preview.ttdSignatureImage}
                          alt="Tanda Tangan Digital"
                          style={{ height: 48, background: '#FFF', padding: 4, borderRadius: 4, border: '1px solid var(--border)' }}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="modal-footer" style={{ flexWrap: 'wrap', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setPreview(null)}>Tutup</button>
              <button
                className="btn btn-secondary"
                onClick={() => handleViewFile(preview)}
              >
                <ExternalLink size={14} /> Buka File
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleDownloadDocument(preview)}
              >
                <Download size={14} /> {preview.fileUri ? 'Download File' : 'Download PDF Resmi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SAMPAH ARSIP / RECYCLE BIN (FITUR 28) */}
      {showTrashModal && (
        <div className="modal-overlay" onClick={() => setShowTrashModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <Trash2 size={18} color="var(--red)" /> Pengelolaan Sampah Arsip (Recycle Bin)
              </h3>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowTrashModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {trashDocs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                  Sampah arsip kosong. Belum ada dokumen yang dihapus.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Nama Dokumen</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Waktu Dihapus</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trashDocs.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{t.namaDoc}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-3)' }}>{t.deletedAt}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <div className="flex justify-end gap-1">
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Pulihkan Dokumen"
                              onClick={() => handleRestoreFromTrash(t)}
                            >
                              <RefreshCw size={12} /> Pulihkan
                            </button>
                            <button
                              className="btn btn-danger btn-sm btn-icon"
                              title="Hapus Permanen"
                              onClick={() => handlePermanentDelete(t.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowTrashModal(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFIKASI QR MODAL RESULT (FITUR 23) */}
      {verifModalDoc && (
        <div className="modal-overlay" onClick={() => setVerifModalDoc(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, textAlign: 'center' }}>
            <div style={{ background: '#ECFDF5', padding: 20, borderRadius: '50%', width: 70, height: 70, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={40} color="#10B981" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#065F46', marginBottom: 4 }}>✅ DOKUMEN TERVERIFIKASI ASLI</h2>
            <p style={{ fontSize: 12, color: '#047857', marginBottom: 16 }}>Keabsahan Tanda Tangan Digital Tercatat Resmi di Sistem DPRD</p>
            
            <div style={{ background: 'var(--bg)', padding: 14, borderRadius: 8, textAlign: 'left', fontSize: 13, marginBottom: 16 }}>
              <div><strong>Nama Dokumen:</strong> {verifModalDoc.namaDoc}</div>
              <div><strong>Nomor Arsip:</strong> {verifModalDoc.nomorDoc}</div>
              <div><strong>Komisi:</strong> {verifModalDoc.komisi}</div>
              <div><strong>Penandatangan:</strong> {verifModalDoc.ttdBy}</div>
              <div><strong>Waktu Pengesahan:</strong> {verifModalDoc.ttdTime}</div>
            </div>

            <button className="btn btn-primary w-full" onClick={() => setVerifModalDoc(null)}>
              Tutup Hasil Verifikasi
            </button>
          </div>
        </div>
      )}

      {/* MODAL IN-APP DOCUMENT VIEWER (100% BEBAS BLANK HITAM) */}
      {viewDocModal && (
        <div className="modal-overlay" onClick={() => setViewDocModal(null)} style={{ zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 840, width: '92vw', height: '88vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header flex items-center justify-between" style={{ padding: '12px 18px' }}>
              <div className="flex items-center gap-2">
                <FileText size={20} color="var(--blue)" />
                <div>
                  <h3 className="modal-title" style={{ fontSize: 15 }}>{viewDocModal.namaDoc}</h3>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{viewDocModal.nomorDoc} · {viewDocModal.komisi}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDownloadDocument(viewDocModal)}
                >
                  <Download size={14} /> Download
                </button>
                {viewDocModal.displayUrl && (
                  <a
                    href={viewDocModal.displayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    <ExternalLink size={14} /> Tab Baru
                  </a>
                )}
                <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setViewDocModal(null)}>
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ flex: 1, padding: 0, overflow: 'hidden', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {viewDocModal.isImage ? (
                <div style={{ overflow: 'auto', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                  <img
                    src={viewDocModal.displayUrl}
                    alt={viewDocModal.namaDoc}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
                  />
                </div>
              ) : (
                <iframe
                  src={viewDocModal.displayUrl}
                  title={viewDocModal.namaDoc}
                  style={{ width: '100%', height: '100%', border: 'none', background: '#FFFFFF' }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL TANDA TANGAN DIGITAL INTERAKTIF (FITUR 22) */}
      {signModalDoc && (
        <div className="modal-overlay" onClick={() => setSignModalDoc(null)} style={{ zIndex: 1100 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Edit3 size={18} color="var(--blue)" />
                <h3 className="modal-title" style={{ fontSize: 16 }}>Tanda Tangan Digital Resmi</h3>
              </div>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setSignModalDoc(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px 12px', borderRadius: 8, marginBottom: 14, fontSize: 12, color: '#1E40AF' }}>
                Dokumen: <strong>{signModalDoc.namaDoc}</strong> ({signModalDoc.komisi})
              </div>

              <div className="grid-2 mb-3">
                <div className="form-group">
                  <label className="form-label">Nama Pejabat / Pimpinan *</label>
                  <input
                    className="form-input"
                    value={signerName}
                    onChange={e => setSignerName(e.target.value)}
                    placeholder="Nama lengkap pimpinan..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Jabatan / Role</label>
                  <input
                    className="form-input"
                    value={signerRole}
                    onChange={e => setSignerRole(e.target.value)}
                    placeholder="Jabatan resmi..."
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label mb-0">Goreskan Tanda Tangan (Canvas)</label>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={clearSignature} style={{ fontSize: 11, padding: '2px 6px' }}>
                    <RefreshCw size={11} /> Bersihkan
                  </button>
                </div>
                <div style={{ border: '2px dashed var(--blue)', borderRadius: 8, overflow: 'hidden', background: '#FFFFFF', touchAction: 'none' }}>
                  <canvas
                    ref={sigCanvasRef}
                    width={440}
                    height={160}
                    style={{ width: '100%', height: 160, display: 'block', cursor: 'crosshair' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, textAlign: 'center' }}>
                  ✍️ Gunakan mouse, stylus, atau sentuhan jari pada kotak di atas.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSignModalDoc(null)}>Batal</button>
              <button className="btn btn-primary" onClick={handleApplySignature}>
                <CheckCircle2 size={15} /> Sahkan & Bubuhkan TTD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
