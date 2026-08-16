import { useState, useEffect } from 'react';
import { rapatStorage, notifikasiStorage, formatDate, userStorage } from '../utils/storage';
import { DAFTAR_KOMISI } from '../constants/theme';
import { MessageSquare, Plus, FileText, X, Edit, Trash2, Download, FileCode, CheckCircle2 } from 'lucide-react';
import { exportNotulenPdf, exportNotulenWord } from '../utils/pdf';

const EMPTY = {
  judul: '',
  komisi: 'Komisi I',
  tanggal: '',
  agenda: '',
  notulen: '',
  pimpinan: '',
  sekretaris: '',
  status: 'Draf',
};

export default function RapatPage() {
  const [rapatList, setRapatList] = useState([]);
  const [filterKomisi, setFilterKomisi] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [selectedRapat, setSelectedRapat] = useState(null);
  const user = userStorage.getCurrentUser();
  const isPimpinan = user?.role === 'pimpinan';

  const loadData = () => {
    let list = rapatStorage.getAll();
    if (filterKomisi !== 'Semua') {
      list = list.filter(r => r.komisi === filterKomisi);
    }
    setRapatList(list);
  };

  useEffect(loadData, [filterKomisi]);

  const handleOpenAdd = () => {
    setForm(EMPTY);
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item, e) => {
    e?.stopPropagation();
    setForm({
      judul: item.judul || item.judulRapat || '',
      komisi: item.komisi || 'Komisi I',
      tanggal: item.tanggal || '',
      agenda: item.agenda || item.agendaPembahasan || '',
      notulen: item.notulen || item.hasilPembahasan || '',
      pimpinan: item.pimpinan || '',
      sekretaris: item.sekretaris || item.petugasNotulen || '',
      status: item.status || 'Draf',
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (item, e) => {
    e?.stopPropagation();
    if (confirm(`Apakah Anda yakin ingin menghapus notulen "${item.judul || item.judulRapat}"?`)) {
      await rapatStorage.delete(item.id);
      if (selectedRapat?.id === item.id) setSelectedRapat(null);
      loadData();
    }
  };

  const handleSave = async () => {
    if (!form.judul.trim()) return alert('Judul rapat wajib diisi');
    
    if (editingId) {
      await rapatStorage.update(editingId, {
        ...form,
        tanggal: form.tanggal || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString(),
      });
      notifikasiStorage.add({
        judul: 'Notulen Rapat Diperbarui',
        pesan: `Notulen "${form.judul}" berhasil diupdate.`,
        tipe: 'rapat', dibaca: false, createdAt: new Date().toISOString(),
      });
    } else {
      await rapatStorage.add({
        ...form,
        tanggal: form.tanggal || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      });
      notifikasiStorage.add({
        judul: 'Notulen Rapat Baru',
        pesan: `Notulen "${form.judul}" telah ditambahkan.`,
        tipe: 'rapat', dibaca: false, createdAt: new Date().toISOString(),
      });
    }
    
    setShowModal(false);
    setForm(EMPTY);
    setEditingId(null);
    loadData();
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            {isPimpinan ? 'Risalah & Notulen Rapat DPRD' : 'Modul Rapat & Notulen'}
          </h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-3)', marginTop: 3 }}>
            {isPimpinan ? 'Tinjau, validasi dan unduh dokumen risalah rapat Komisi I–IV' : 'Kelola agenda rapat, risalah, notulen, dan berita acara Komisi'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Buat Notulen Rapat
        </button>
      </div>

      <div className="filter-pills mb-4">
        {['Semua', ...DAFTAR_KOMISI.map(k => k.nama)].map(f => (
          <button
            key={f}
            className={`pill${filterKomisi === f ? ' active' : ''}`}
            onClick={() => setFilterKomisi(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {rapatList.length === 0 ? (
        <div className="empty-state">
          <MessageSquare size={48} className="icon" />
          <h3>Belum ada data rapat &amp; notulen</h3>
          <p>Klik "Buat Notulen Rapat" untuk mulai mencatat hasil rapat.</p>
        </div>
      ) : (
        <div className="grid-2">
          {rapatList.map(item => (
            <div key={item.id} className="card" style={{ padding: 20 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="badge badge-purple">{item.komisi}</span>
                <div className="flex items-center gap-1">
                  <span className="badge badge-yellow">{item.status || 'Draf'}</span>
                </div>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{item.judul || item.judulRapat}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>
                <strong>Agenda:</strong> {item.agenda || item.agendaPembahasan || '—'}
              </p>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
                📅 {formatDate(item.tanggal)} · 👤 Pimpinan: {item.pimpinan || item.petugasNotulen || '—'}
              </div>

              {/* ACTION BUTTONS ROW */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  className="btn btn-secondary btn-sm flex-1"
                  onClick={() => setSelectedRapat(item)}
                >
                  <FileText size={14} /> Lihat Detail
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  title="Ekspor PDF Resmi"
                  onClick={(e) => { e.stopPropagation(); exportNotulenPdf(item); }}
                  style={{ color: '#EF4444' }}
                >
                  <Download size={14} /> PDF
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  title="Ekspor Word (DOCX)"
                  onClick={(e) => { e.stopPropagation(); exportNotulenWord(item); }}
                  style={{ color: '#2563EB' }}
                >
                  <Download size={14} /> Word
                </button>
                <button
                  className="btn btn-secondary btn-sm btn-icon"
                  title="Edit Notulen"
                  onClick={(e) => handleOpenEdit(item, e)}
                >
                  <Edit size={14} />
                </button>
                <button
                  className="btn btn-secondary btn-sm btn-icon"
                  title="Hapus Notulen"
                  style={{ color: '#EF4444' }}
                  onClick={(e) => handleDelete(item, e)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Risalah / Notulen Rapat' : 'Buat Risalah / Notulen Rapat'}</h3>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Judul Rapat *</label>
                <input
                  className="form-input"
                  placeholder="Judul atau topik pembahasan rapat..."
                  value={form.judul}
                  onChange={e => setForm(p => ({ ...p, judul: e.target.value }))}
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Komisi</label>
                  <select
                    className="form-select"
                    value={form.komisi}
                    onChange={e => setForm(p => ({ ...p, komisi: e.target.value }))}
                  >
                    {DAFTAR_KOMISI.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Rapat</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.tanggal}
                    onChange={e => setForm(p => ({ ...p, tanggal: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Pimpinan Rapat</label>
                  <input
                    className="form-input"
                    placeholder="Nama pimpinan rapat..."
                    value={form.pimpinan}
                    onChange={e => setForm(p => ({ ...p, pimpinan: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sekretaris / Notulis</label>
                  <input
                    className="form-input"
                    placeholder="Nama notulis..."
                    value={form.sekretaris}
                    onChange={e => setForm(p => ({ ...p, sekretaris: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status Dokumen</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                >
                  <option value="Draf">Draf</option>
                  <option value="Menunggu Validasi">Menunggu Validasi</option>
                  <option value="Disahkan">Disahkan</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Agenda Utama</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 60 }}
                  placeholder="Poin agenda pembahasan..."
                  value={form.agenda}
                  onChange={e => setForm(p => ({ ...p, agenda: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hasil / Notulen Rapat</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 100 }}
                  placeholder="Catatan hasil rapat & kesimpulan..."
                  value={form.notulen}
                  onChange={e => setForm(p => ({ ...p, notulen: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editingId ? 'Simpan Perubahan' : 'Simpan Notulen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRapat && (
        <div className="modal-overlay" onClick={() => setSelectedRapat(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <h3 className="modal-title">Detail Notulen Rapat</h3>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setSelectedRapat(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{selectedRapat.judul || selectedRapat.judulRapat}</h2>
              <div className="flex gap-2 mb-4">
                <span className="badge badge-purple">{selectedRapat.komisi}</span>
                <span className="badge badge-blue">{formatDate(selectedRapat.tanggal)}</span>
                <span className="badge badge-green">{selectedRapat.status || 'Sah'}</span>
              </div>
              <div className="divider" />
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                <p><strong>Pimpinan Rapat:</strong> {selectedRapat.pimpinan || selectedRapat.petugasNotulen || '-'}</p>
                <p><strong>Notulis:</strong> {selectedRapat.sekretaris || selectedRapat.petugasNotulen || '-'}</p>
                <p style={{ marginTop: 12 }}><strong>Agenda Pembahasan:</strong></p>
                <p style={{ color: 'var(--text-2)' }}>{selectedRapat.agenda || selectedRapat.agendaPembahasan || '-'}</p>
                <p style={{ marginTop: 12 }}><strong>Hasil / Kesimpulan:</strong></p>
                <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, marginTop: 4, whiteSpace: 'pre-wrap' }}>
                  {selectedRapat.notulen || selectedRapat.hasilPembahasan || 'Belum ada catatan notulen.'}
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <div className="flex gap-2">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => exportNotulenPdf(selectedRapat)}
                >
                  <Download size={14} /> Unduh PDF
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => exportNotulenWord(selectedRapat)}
                >
                  <Download size={14} /> Unduh Word (.DOC)
                </button>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedRapat(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
