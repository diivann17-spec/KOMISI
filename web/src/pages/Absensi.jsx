import { Plus, Printer, QrCode, X, Search, CheckCircle2, AlertCircle, Clock, Trash2, RotateCcw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState, useMemo } from 'react';
import { DAFTAR_KOMISI } from '../constants/theme';
import { generateOfficialReportPdf } from '../utils/pdf';
import { absensiStorage, formatDate, jadwalStorage, getCurrentPosition, offlineAttendanceDB } from '../utils/storage';

const statusConfig = {
  Hadir:  { cls: 'badge-green',  label: 'Hadir' },
  Izin:   { cls: 'badge-yellow', label: 'Izin' },
  Sakit:  { cls: 'badge-orange', label: 'Sakit' },
  Absen:  { cls: 'badge-red',    label: 'Absen' },
};

export default function AbsensiPage() {
  const [absensiList, setAbsensiList] = useState([]);
  const [jadwalList, setJadwalList] = useState([]);
  const [selectedJadwal, setSelectedJadwal] = useState('Semua');
  const [filterKomisi, setFilterKomisi] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [namaAnggota, setNamaAnggota] = useState('');
  const [komisiAnggota, setKomisiAnggota] = useState('Komisi I');
  const [statusHadir, setStatusHadir] = useState('Hadir');
  const GPS_RADIUS = 100;

  const syncPendingAttendance = async () => {
    // 1. Sync pending_absensi
    const pending = await offlineAttendanceDB.getAllPending();
    for (const record of pending) {
      await absensiStorage.add(record);
    }
    await offlineAttendanceDB.clearPending();

    // 2. Sync public offline queue (sim_absensi_offline_queue)
    try {
      const publicQueue = JSON.parse(localStorage.getItem('sim_absensi_offline_queue') || '[]');
      if (publicQueue.length) {
        for (const record of publicQueue) {
          await absensiStorage.add(record);
        }
        localStorage.removeItem('sim_absensi_offline_queue');
      }
    } catch {}

    loadData();
  };

  useEffect(() => {
    syncPendingAttendance();
    window.addEventListener('online', syncPendingAttendance);
    window.addEventListener('focus', loadData);
    return () => {
      window.removeEventListener('online', syncPendingAttendance);
      window.removeEventListener('focus', loadData);
    };
  }, []);

  const loadData = () => {
    // Cek juga jika ada offline queue yang belum dipindahkan
    try {
      const publicQueue = JSON.parse(localStorage.getItem('sim_absensi_offline_queue') || '[]');
      if (publicQueue.length) {
        for (const record of publicQueue) {
          absensiStorage.add(record);
        }
        localStorage.removeItem('sim_absensi_offline_queue');
      }
    } catch {}

    setAbsensiList(absensiStorage.getAll());
    setJadwalList(jadwalStorage.getAll());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    window.addEventListener('kegiatan-data-changed', loadData);
    const interval = setInterval(loadData, 2000); // Polling 2s untuk sinkronisasi otomatis
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('kegiatan-data-changed', loadData);
      clearInterval(interval);
    };
  }, []);

  const handlePrintPdf = () => {
    if (filteredAbsensi.length === 0) return alert('Tidak ada data presensi untuk di-export.');
    generateOfficialReportPdf('LAPORAN PRESENSI ANGGOTA DPRD', filteredAbsensi, 'Laporan_Presensi_DPRD.pdf');
  };

  const handleAddAbsensi = async () => {
    if (!namaAnggota.trim()) return alert('Nama anggota wajib diisi');
    const selectedJ = jadwalList.find((j) => j.id === selectedJadwal);
    if (selectedJ && selectedJ.latitude && selectedJ.longitude) {
      try {
        const { latitude, longitude } = await getCurrentPosition();
        const toRad = (v) => (v * Math.PI) / 180;
        const R = 6371000;
        const dLat = toRad(selectedJ.latitude - latitude);
        const dLon = toRad(selectedJ.longitude - longitude);
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(latitude)) * Math.cos(toRad(selectedJ.latitude)) * Math.sin(dLon / 2) ** 2;
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (distance > GPS_RADIUS) {
          return alert(`Anda berada di luar radius ${GPS_RADIUS}m dari lokasi kegiatan.`);
        }
      } catch {
        return alert('Tidak dapat memperoleh lokasi GPS.');
      }
    }
    const record = {
      jadwalId: selectedJadwal,
      jadwalJudul: selectedJ ? selectedJ.judul : 'Kegiatan Umum',
      namaAnggota,
      komisi: komisiAnggota,
      status: statusHadir,
      waktuPresensi: new Date().toISOString(),
    };
    if (navigator.onLine) {
      await absensiStorage.add(record);
    } else {
      await offlineAttendanceDB.addPending(record);
      alert('Anda offline. Presensi akan tersinkronisasi saat kembali online.');
    }
    setNamaAnggota('');
    setShowModal(false);
    loadData();
  };

  const [trashList, setTrashList] = useState(() => {
    const saved = localStorage.getItem('sim_trash_absensi');
    return saved ? JSON.parse(saved) : [];
  });
  const [showTrashModal, setShowTrashModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('sim_trash_absensi', JSON.stringify(trashList));
  }, [trashList]);

  const handleDeleteRecord = async (id, nama) => {
    const item = absensiList.find(a => a.id === id);
    if (!item) return;
    if (confirm(`Pindahkan data presensi "${nama}" ke Tempat Sampah?`)) {
      await absensiStorage.delete(id);
      if (item.jadwalId) {
        localStorage.removeItem(`dprd_has_attended_${item.jadwalId}`);
        localStorage.removeItem(`dprd_attendee_name_${item.jadwalId}`);
      }
      setTrashList(prev => [{ ...item, deletedAt: new Date().toLocaleString('id-ID') }, ...prev]);
      loadData();
    }
  };

  const handleClearAllAttendance = async () => {
    const count = filteredAbsensi.length;
    if (count === 0) return alert('Tidak ada data kehadiran yang tampil.');
    
    if (confirm(`Pindahkan ${count} data kehadiran ke Tempat Sampah?`)) {
      const nowStr = new Date().toLocaleString('id-ID');
      const itemsToTrash = filteredAbsensi.map(item => ({ ...item, deletedAt: nowStr }));
      for (const item of filteredAbsensi) {
        await absensiStorage.delete(item.id);
        if (item.jadwalId) {
          localStorage.removeItem(`dprd_has_attended_${item.jadwalId}`);
          localStorage.removeItem(`dprd_attendee_name_${item.jadwalId}`);
        }
      }
      setTrashList(prev => [...itemsToTrash, ...prev]);
      loadData();
    }
  };

  const handleRestoreRecord = async (item) => {
    const { deletedAt, ...cleanItem } = item;
    await absensiStorage.add(cleanItem);
    setTrashList(prev => prev.filter(t => t.id !== item.id));
    loadData();
  };

  const handlePermanentDelete = (id) => {
    if (confirm('⚠️ PERINGATAN: Hapus Permanen data presensi ini? Data TIDAK DAPAT dikembalikan!')) {
      setTrashList(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleClearTrashPermanent = () => {
    if (confirm('⚠️ PERINGATAN KETAT: Kosongkan SELURUH Tempat Sampah secara Permanen?')) {
      setTrashList([]);
    }
  };

  const getLatestJadwalId = () => {
    if (!jadwalList.length) return '';
    const sorted = [...jadwalList].sort((a, b) => {
      const dd = new Date(b.tanggal || 0) - new Date(a.tanggal || 0);
      return dd !== 0 ? dd : new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    return sorted[0]?.id || '';
  };

  const qrJadwalId = selectedJadwal && selectedJadwal !== 'Semua' ? selectedJadwal : getLatestJadwalId();

  const filteredAbsensi = useMemo(() => {
    return absensiList.filter((a) => {
      // Pencocokan jadwal yang fleksibel (bisa via id, atau jadwalJudul)
      let matchJadwal = true;
      if (selectedJadwal && selectedJadwal !== 'Semua') {
        matchJadwal = a.jadwalId === selectedJadwal || 
          (a.jadwalJudul && selectedJadwal && jadwalList.find(j => j.id === selectedJadwal)?.judul === a.jadwalJudul);
      }
      
      // Pencocokan komisi yang fleksibel
      let matchKomisi = true;
      if (filterKomisi !== 'Semua') {
        matchKomisi = (a.komisi || '').trim().toLowerCase() === filterKomisi.trim().toLowerCase();
      }

      // Pencocokan pencarian nama/agenda/tamu
      const matchSearch = searchQuery
        ? (a.namaAnggota || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.jadwalJudul || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.instansi || '').toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      return matchJadwal && matchKomisi && matchSearch;
    });
  }, [absensiList, selectedJadwal, filterKomisi, searchQuery, jadwalList]);

  const stats = useMemo(() => {
    const total = filteredAbsensi.length;
    const hadir = filteredAbsensi.filter((a) => (a.status || 'Hadir') === 'Hadir').length;
    const izin  = filteredAbsensi.filter((a) => a.status === 'Izin').length;
    const sakit = filteredAbsensi.filter((a) => a.status === 'Sakit' || a.status === 'Absen').length;
    return { total, hadir, izin, sakit };
  }, [filteredAbsensi]);

  const statCards = [
    { label: 'Total Tercatat', value: stats.total, icon: <Clock size={17} />, color: 'var(--blue)', bg: 'var(--blue-s)' },
    { label: 'Hadir',          value: stats.hadir, icon: <CheckCircle2 size={17} />, color: 'var(--success)', bg: 'var(--success-s)' },
    { label: 'Izin',           value: stats.izin,  icon: <AlertCircle size={17} />, color: 'var(--warning)', bg: 'var(--warning-s)' },
    { label: 'Sakit / Lainnya',value: stats.sakit, icon: <X size={17} />,           color: 'var(--danger)',  bg: 'var(--danger-s)'  },
  ];

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Action Toolbar Row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowTrashModal(true)}
          className="btn btn-secondary btn-sm"
          style={{ position: 'relative', color: trashList.length > 0 ? 'var(--warning)' : 'var(--text-3)' }}
        >
          <Trash2 size={13} /> Tempat Sampah ({trashList.length})
        </button>
        {filteredAbsensi.length > 0 && (
          <button onClick={handleClearAllAttendance} className="btn btn-danger btn-sm" title="Pindahkan Data Kehadiran ke Tempat Sampah">
            <Trash2 size={13} /> Hapus Daftar ({filteredAbsensi.length})
          </button>
        )}
        <button onClick={handlePrintPdf} className="btn btn-secondary btn-sm">
          <Printer size={13} /> Cetak PDF
        </button>
        <button onClick={() => setShowQrModal(true)} className="btn btn-secondary btn-sm" style={{ color: 'var(--blue)', borderColor: 'var(--blue)' }}>
          <QrCode size={13} /> QR Presensi
        </button>
        {!navigator.onLine && (
          <button onClick={syncPendingAttendance} className="btn btn-warning btn-sm">
            Sync Offline
          </button>
        )}
        <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
          <Plus size={13} /> Tambah Presensi
        </button>
      </div>

      {/* ── KPI Stats (Single responsive row) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {statCards.map(({ label, value, icon, color, bg }) => (
          <div key={label} className="stat-card" style={{ padding: '12px 14px', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                {icon}
              </div>
            </div>
            <div className="stat-label" style={{ fontSize: 10 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, padding: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Cari nama atau agenda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 32, fontSize: 12, padding: '7px 10px 7px 32px' }}
            />
          </div>
          <select value={selectedJadwal} onChange={(e) => setSelectedJadwal(e.target.value)} className="form-select" style={{ fontSize: 12, padding: '7px 28px 7px 10px' }}>
            <option value="Semua">Semua Jadwal / Kegiatan</option>
            {jadwalList.map((j) => (
              <option key={j.id} value={j.id}>{j.judul} ({formatDate(j.tanggal)})</option>
            ))}
          </select>
          <select value={filterKomisi} onChange={(e) => setFilterKomisi(e.target.value)} className="form-select" style={{ fontSize: 12, padding: '7px 28px 7px 10px' }}>
            <option value="Semua">Semua Komisi (I–IV)</option>
            {DAFTAR_KOMISI.map((k) => (
              <option key={k.id} value={k.nama}>{k.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card">
        <div className="card-header" style={{ padding: '10px 16px' }}>
          <div className="card-title" style={{ fontSize: 13 }}>Daftar Kehadiran ({filteredAbsensi.length})</div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nama Anggota</th>
                <th>Komisi</th>
                <th>Kegiatan / Agenda</th>
                <th>Waktu Presensi</th>
                <th>Lokasi GPS</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center', width: 60 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAbsensi.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-4)' }}>
                    Tidak ada data presensi yang sesuai kriteria.
                  </td>
                </tr>
              ) : (
                filteredAbsensi.map((item) => {
                  const sc = statusConfig[item.status] || statusConfig.Hadir;
                  // Cek apakah ada record lain di agenda yang sama dengan deviceId yang sama
                  const isDuplicateDevice = item.deviceId && filteredAbsensi.some(other => other.id !== item.id && other.jadwalId === item.jadwalId && other.deviceId === item.deviceId);

                  return (
                    <tr key={item.id} style={isDuplicateDevice ? { background: '#FFFBEB' } : {}}>
                      <td style={{ fontWeight: 700, color: 'var(--text)' }}>
                        <div>{item.namaAnggota}</div>
                        {isDuplicateDevice && (
                          <div style={{ fontSize: 9.5, color: '#B45309', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                            <span>⚠️ Perangkat Sama (Titip Absen?)</span>
                          </div>
                        )}
                      </td>
                      <td><span className="badge badge-blue">{item.komisi}</span></td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                        {(() => {
                          if (!item.waktuPresensi) return '-';
                          try {
                            const d = new Date(item.waktuPresensi);
                            if (isNaN(d.getTime())) return item.waktuPresensi;
                            return `${d.getHours().toString().padStart(2, '0')}.${d.getMinutes().toString().padStart(2, '0')} WIB`;
                          } catch {
                            return item.waktuPresensi || '-';
                          }
                        })()}
                      </td>
                      <td style={{ minWidth: 200, maxWidth: 260, fontSize: 11 }}>
                        {(() => {
                          const coords = item.koordinatUser || (item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : null);
                          const address = item.alamatLokasi || coords || 'Tercatat di Lokasi';
                          const hasCoords = coords && coords !== 'Tidak terdeteksi' && coords.includes(',');
                          const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${coords.replace(/\s+/g, '')}` : null;

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--text)' }}>
                                <span style={{ color: 'var(--danger)', flexShrink: 0 }}>📍</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={address}>
                                  {address}
                                </span>
                              </div>
                              {hasCoords && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
                                  <span style={{ color: 'var(--text-4)', fontFamily: 'monospace' }}>
                                    {coords}
                                  </span>
                                  {mapsUrl && (
                                    <a
                                      href={mapsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: 'var(--blue)', fontWeight: 700, textDecoration: 'underline' }}
                                    >
                                      Buka Maps ↗
                                    </a>
                                  )}
                                </div>
                              )}
                              {item.deviceName && (
                                <div style={{ fontSize: 9.5, color: '#64748B', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                                  <span>📱 {item.deviceName}</span>
                                </div>
                              )}
                              {item.jarakMeter !== undefined && item.jarakMeter !== null && (
                                <div style={{ fontSize: 9.5, color: item.jarakMeter <= 500 ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                                  Radius: {item.jarakMeter}m dari lokasi agenda
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${sc.cls}`}>{sc.label}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-danger btn-icon-sm"
                          title={`Hapus presensi ${item.namaAnggota}`}
                          onClick={() => handleDeleteRecord(item.id, item.namaAnggota)}
                          style={{ margin: '0 auto' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Tambah Presensi ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div className="modal-title">Input Presensi Manual</div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setShowModal(false)}>
                <X size={17} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div className="form-group">
                <label className="form-label">Pilih Agenda / Kegiatan *</label>
                <select value={selectedJadwal} onChange={(e) => setSelectedJadwal(e.target.value)} className="form-select">
                  <option value="">-- Kegiatan Umum --</option>
                  {jadwalList.map((j) => (
                    <option key={j.id} value={j.id}>{j.judul} ({j.komisi})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nama Anggota DPRD *</label>
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap..."
                  value={namaAnggota}
                  onChange={(e) => setNamaAnggota(e.target.value)}
                  className="form-input"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Komisi</label>
                  <select value={komisiAnggota} onChange={(e) => setKomisiAnggota(e.target.value)} className="form-select">
                    {DAFTAR_KOMISI.map((k) => (
                      <option key={k.id} value={k.nama}>{k.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select value={statusHadir} onChange={(e) => setStatusHadir(e.target.value)} className="form-select">
                    <option value="Hadir">Hadir</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Absen">Absen</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ margin: '14px -20px -20px', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleAddAbsensi}>Simpan Presensi</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal QR Code ── */}
      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380, textAlign: 'center' }}>
            <div className="modal-header">
              <div className="modal-title">📱 QR Code Presensi</div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setShowQrModal(false)}>
                <X size={17} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              {qrJadwalId && jadwalList.find((j) => j.id === qrJadwalId) && (
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>
                  {jadwalList.find((j) => j.id === qrJadwalId)?.judul}
                </div>
              )}
              <div style={{
                background: '#fff', padding: 14, borderRadius: 14,
                border: '2.5px solid var(--navy)',
                boxShadow: 'var(--shadow-md)',
                display: 'inline-block',
              }}>
                <QRCodeSVG
                  value={(() => {
                    const host = window.location.host;
                    const proto = window.location.protocol;
                    return `${proto}//${host}/presensi?jadwalId=${qrJadwalId}`;
                  })()}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div style={{
                background: 'var(--surface2)', border: '1px dashed var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '10px 13px',
                width: '100%', textAlign: 'left',
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 4 }}>🔗 Link Presensi:</div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-2)', wordBreak: 'break-all', fontWeight: 700, userSelect: 'all' }}>
                  {window.location.protocol}//{window.location.host}/presensi?jadwalId={qrJadwalId}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary w-full" onClick={() => setShowQrModal(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Tempat Sampah Presensi ── */}
      {showTrashModal && (
        <div className="modal-overlay" onClick={() => setShowTrashModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--warning)' }}>
                <Trash2 size={18} /> Tempat Sampah Presensi ({trashList.length})
              </div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setShowTrashModal(false)}>
                <X size={17} />
              </button>
            </div>
            <div className="modal-body">
              {trashList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-4)' }}>
                  Tempat sampah presensi kosong.
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                      Item yang dihapus dapat <strong>Dikembalikan (Restore)</strong> atau <strong>Dihapus Permanen</strong>.
                    </span>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ fontSize: 11 }}
                      onClick={handleClearTrashPermanent}
                    >
                      Kosongkan Sampah
                    </button>
                  </div>
                  <div style={{ maxHeight: 340, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                    <table style={{ width: '100%', fontSize: 12 }}>
                      <thead style={{ background: 'var(--surface2)', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ padding: '8px 12px' }}>Nama & Komisi</th>
                          <th style={{ padding: '8px 12px' }}>Agenda</th>
                          <th style={{ padding: '8px 12px' }}>Dihapus Pada</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center' }}>Opsi Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trashList.map((item) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ fontWeight: 700, color: 'var(--text)' }}>{item.namaAnggota}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{item.komisi}</div>
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: 11 }}>
                              {item.jadwalJudul || 'Kegiatan Umum'}
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: 10.5, color: 'var(--text-3)' }}>
                              {item.deletedAt || '-'}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ color: 'var(--success)', borderColor: 'var(--success)', fontSize: 11, padding: '3px 8px' }}
                                  title="Kembalikan (Restore) data ini"
                                  onClick={() => handleRestoreRecord(item)}
                                >
                                  <RotateCcw size={12} /> Pulihkan
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  style={{ fontSize: 11, padding: '3px 8px' }}
                                  title="Hapus Permanen selamanya"
                                  onClick={() => handlePermanentDelete(item.id)}
                                >
                                  <Trash2 size={12} /> Permanen
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowTrashModal(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
