import {
  CheckCircle2,
  Scale,
  UserCheck,
  MapPin,
  Wifi,
  WifiOff,
  AlertTriangle,
  Clock,
  Navigation,
  RefreshCw,
  Crosshair,
  Building,
  User
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DAFTAR_KOMISI } from '../constants/theme';
import { absensiStorage, notifikasiStorage, jadwalStorage, seedMockData } from '../utils/storage';

// ─── Konstanta Konfigurasi ──────────────────────────────────────────────────
const RADIUS_METER = 500;
const OFFLINE_QUEUE_KEY = 'sim_absensi_offline_queue';

function hitungJarak(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function PresensiPublicPage() {
  const [searchParams] = useSearchParams();
  const jadwalIdParam = searchParams.get('jadwalId') || '';

  const [kegiatan, setKegiatan] = useState(null);
  const [namaAnggota, setNama] = useState('');
  const [komisi, setKomisi] = useState('Komisi I');
  const [status, setStatus] = useState('Hadir');
  const [tipeAbsen, setTipeAbsen] = useState('anggota');
  const [namaTamu, setNamaTamu] = useState('');
  const [instansiTamu, setInstansiTamu] = useState('');

  const [gpsStatus, setGpsStatus] = useState('requesting');
  const [koordinatUser, setKoordinat] = useState(null);
  const [alamatGps, setAlamatGps] = useState('');
  const [jarakMeter, setJarak] = useState(null);
  const [gpsSkipped, setGpsSkipped] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsErrorMsg, setGpsErrorMsg] = useState('');

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [offlineQueued, setOfflineQueued] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [duplikatError, setDuplikatError] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      setGpsErrorMsg('Browser atau perangkat ini tidak mendukung GPS Geolocation.');
      return;
    }

    setGpsStatus('requesting');
    setGpsErrorMsg('');

    const options = {
      enableHighAccuracy: true,
      timeout: 25000,
      maximumAge: 0
    };

    const handleSuccess = async (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setKoordinat({ lat: latitude, lng: longitude });
      setGpsAccuracy(Math.round(accuracy));
      setGpsStatus('active');

      if (kegiatan?.lat && kegiatan?.lng) {
        const j = hitungJarak(latitude, longitude, kegiatan.lat, kegiatan.lng);
        setJarak(Math.round(j));
      }

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          { headers: { 'User-Agent': 'DPRD-SIM-Kegiatan-App' } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.display_name) {
            setAlamatGps(data.display_name);
          }
        }
      } catch {
        setAlamatGps(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    };

    const handleError = (err) => {
      console.warn('GPS Geolocation Error:', err);
      if (err.code === 1) {
        setGpsStatus('denied');
        setGpsErrorMsg('Izin akses lokasi GPS ditolak. Silakan izinkan akses lokasi di browser HP Anda.');
      } else if (err.code === 2) {
        setGpsStatus('unavailable');
        setGpsErrorMsg('Posisi GPS tidak dapat diperoleh. Pastikan Lokasi/GPS HP dalam mode Akurasi Tinggi.');
      } else if (err.code === 3) {
        setGpsStatus('unavailable');
        setGpsErrorMsg('Waktu permintaan GPS habis (Timeout). Mencoba mengambil koordinat kembali...');
      } else {
        setGpsStatus('unavailable');
        setGpsErrorMsg(err.message || 'Gagal memperoleh koordinat GPS.');
      }
    };

    // Panggilan pertama secara cepat
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

    // Watch position untuk presisi lebih tinggi dan kontinu
    const watchId = navigator.geolocation.watchPosition(handleSuccess, null, options);
    return () => navigator.geolocation.clearWatch(watchId);
  }, [kegiatan]);

  const [daftarJadwal, setDaftarJadwal] = useState([]);

  useEffect(() => {
    // Pastikan data mock/seed terinisialisasi jika kosong
    seedMockData();

    const list = jadwalStorage.getAll();
    setDaftarJadwal(list);

    if (jadwalIdParam && list.length) {
      const found = list.find((j) => j.id === jadwalIdParam);
      if (found) {
        setKegiatan(found);
        if (found.komisi) setKomisi(found.komisi);
        return;
      }
    }

    if (list.length) {
      const sorted = [...list].sort(
        (a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0)
      );
      setKegiatan(sorted[0]);
      if (sorted[0]?.komisi) setKomisi(sorted[0].komisi);
    } else {
      // Fallback agenda default DPRD agar tidak pernah null
      const defaultAgenda = {
        id: 'j-default',
        judul: 'Rapat Koordinasi Komisi DPRD',
        komisi: 'Komisi I',
        waktuMulai: '09:00',
        waktuSelesai: '12:00',
        lokasi: 'Ruang Rapat Utama DPRD'
      };
      setKegiatan(defaultAgenda);
      setDaftarJadwal([defaultAgenda]);
    }
  }, [jadwalIdParam]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const syncOfflineQueue = async () => {
    try {
      const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      if (!queue.length) return;
      for (const item of queue) {
        await absensiStorage.add(item);
      }
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      setPendingSync(0);
    } catch (e) {
      console.warn('Sync offline error:', e);
    }
  };

  // Helper menghasilkan Device ID unik per perangkat/browser
  const getOrCreateDeviceId = () => {
    let deviceId = localStorage.getItem('dprd_device_fingerprint_id');
    if (!deviceId) {
      const screenRes = `${window.screen.width}x${window.screen.height}`;
      const randomStr = Math.random().toString(36).substring(2, 10);
      deviceId = `DEV-${Date.now().toString(36)}-${randomStr}-${screenRes}`;
      localStorage.setItem('dprd_device_fingerprint_id', deviceId);
    }
    return deviceId;
  };

  const getDeviceModel = () => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'Android Device';
    if (/iPad|iPhone|iPod/.test(ua)) return 'Apple iOS Device';
    if (/Windows/i.test(ua)) return 'Windows PC';
    if (/Macintosh/i.test(ua)) return 'Macintosh';
    if (/Linux/i.test(ua)) return 'Linux Device';
    return 'Web Browser';
  };

  const [deviceWarning, setDeviceWarning] = useState(null);

  const cekDuplikat = (nama) => {
    if (!kegiatan) return null;
    const existing = absensiStorage.getAll();
    const currentDeviceId = getOrCreateDeviceId();

    // 1. Cek duplikat perangkat (1 Device = 1 Absen per Agenda)
    const duplicateDevice = existing.find(
      (a) =>
        a.jadwalId === kegiatan.id &&
        (a.deviceId === currentDeviceId || localStorage.getItem(`dprd_has_attended_${kegiatan.id}`) === 'true')
    );
    if (duplicateDevice) return { type: 'DEVICE', item: duplicateDevice };

    // 2. Cek duplikat nama pada agenda yang sama
    const duplicateNama = existing.find(
      (a) =>
        a.jadwalId === kegiatan.id &&
        a.namaAnggota?.trim().toLowerCase() === nama.trim().toLowerCase()
    );
    if (duplicateNama) return { type: 'NAMA', item: duplicateNama };

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nama = tipeAbsen === 'tamu' ? namaTamu.trim() : namaAnggota.trim();
    if (!nama) return alert('Nama lengkap wajib diisi!');
    if (!kegiatan) return alert('Kegiatan tidak ditemukan atau belum dipilih!');

    if (kegiatan.lat && kegiatan.lng && jarakMeter !== null && jarakMeter > RADIUS_METER && !gpsSkipped) {
      alert(`⚠️ Anda berada ${jarakMeter}m dari lokasi (Maks: ${RADIUS_METER}m). Silakan lewati GPS jika Anda berada di lokasi.`);
      return;
    }

    const duplikatInfo = cekDuplikat(nama);
    if (duplikatInfo) {
      const nowIso = new Date().toISOString();
      const deviceName = getDeviceModel();

      if (duplikatInfo.type === 'DEVICE') {
        // Kirim Notifikasi Sistem untuk Admin / Anggota Komisi
        notifikasiStorage.add({
          id: `FRAUD-DEV-${Date.now().toString().slice(-4)}`,
          judul: '🚨 Peringatan Deteksi Percobaan Absensi Ganda (1 Perangkat 2 Scan)',
          pesan: `Perangkat (${deviceName}) yang pernah dipakai oleh "${duplikatInfo.item.namaAnggota}" dicoba untuk scan presensi atas nama "${nama}" pada kegiatan "${kegiatan.judul}".`,
          tipe: 'fraud',
          level: 'Peringatan Tinggi',
          dibaca: false,
          createdAt: nowIso,
        });

        setDeviceWarning(duplikatInfo.item);
        return;
      }

      if (duplikatInfo.type === 'NAMA') {
        notifikasiStorage.add({
          id: `FRAUD-NAME-${Date.now().toString().slice(-4)}`,
          judul: '⚠️ Percobaan Presensi Nama Duplikat',
          pesan: `Ada percobaan presensi ulang untuk nama "${nama}" di agenda "${kegiatan.judul}".`,
          tipe: 'fraud',
          level: 'Peringatan Sedang',
          dibaca: false,
          createdAt: nowIso,
        });

        setDuplikatError(true);
        return;
      }
    }

    setSubmitting(true);

    const nowIso = new Date().toISOString();
    const currentDeviceId = getOrCreateDeviceId();
    const deviceName = getDeviceModel();

    const payload = {
      jadwalId: kegiatan.id,
      jadwalJudul: kegiatan.judul,
      namaAnggota: nama,
      komisi: tipeAbsen === 'tamu' ? 'Tamu/Narasumber' : komisi,
      instansi: tipeAbsen === 'tamu' ? instansiTamu : 'DPRD',
      tipe: tipeAbsen,
      status,
      waktuPresensi: nowIso,
      gpsStatus,
      koordinatUser: koordinatUser ? `${koordinatUser.lat.toFixed(6)}, ${koordinatUser.lng.toFixed(6)}` : 'Tidak terdeteksi',
      alamatLokasi: alamatGps || (koordinatUser ? `${koordinatUser.lat.toFixed(6)}, ${koordinatUser.lng.toFixed(6)}` : 'GPS tidak aktif'),
      jarakMeter: jarakMeter || null,
      akurasiGps: gpsAccuracy ? `${gpsAccuracy} meter` : null,
      deviceId: currentDeviceId,
      deviceName: deviceName,
      deviceUserAgent: navigator.userAgent
    };

    setSubmittedData(payload);
    localStorage.setItem(`dprd_has_attended_${kegiatan.id}`, 'true');
    localStorage.setItem(`dprd_attendee_name_${kegiatan.id}`, nama);

    try {
      if (!isOnline) {
        const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
        queue.push({ ...payload, offlineQueued: true, queuedAt: nowIso });
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        setPendingSync(queue.length);
        setOfflineQueued(true);
      } else {
        await absensiStorage.add(payload);
        try {
          window.dispatchEvent(new CustomEvent('kegiatan-data-changed', { detail: { key: 'absensi' } }));
          window.dispatchEvent(new StorageEvent('storage', { key: 'absensi' }));
        } catch {}
        notifikasiStorage.add({
          judul: 'Presensi Baru Masuk',
          pesan: `${nama} (${tipeAbsen === 'tamu' ? 'Tamu' : komisi}) hadir di kegiatan "${kegiatan.judul}" [Perangkat: ${deviceName}]`,
          tipe: 'absensi',
          dibaca: false,
          createdAt: nowIso,
        });
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Submit presensi error:', err);
      alert('Terjadi kesalahan saat menyimpan presensi.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── SUKSES SCREEN ─────────────────────────────────────────────────────────
  if (submitted && submittedData) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="card" style={{ maxWidth: 480, width: '100%', padding: '28px 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-s)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', marginBottom: 6 }}>
            {offlineQueued ? 'Presensi Tersimpan (Offline)' : 'Presensi Berhasil Dikirim! ✅'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
            Data kehadiran dan koordinat GPS telah tercatat ke sistem.
          </p>

          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-3)' }}>Nama:</span>
              <span style={{ fontWeight: 800, color: 'var(--text)' }}>{submittedData.namaAnggota}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-3)' }}>Kegiatan:</span>
              <span style={{ fontWeight: 600, color: 'var(--text)', maxWidth: 220, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {submittedData.jadwalJudul}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-3)' }}>Komisi / Instansi:</span>
              <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{submittedData.komisi}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-3)' }}>Status:</span>
              <span className="badge badge-green">{submittedData.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-3)' }}>Waktu:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {new Date(submittedData.waktuPresensi).toLocaleTimeString('id-ID')} WIB
              </span>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, fontWeight: 700 }}>
                <MapPin size={12} color="var(--danger)" /> Lokasi GPS:
              </div>
              <div style={{ fontSize: 11, background: 'var(--surface)', padding: 8, borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                {submittedData.alamatLokasi}
                <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 2 }}>
                  Koordinat: {submittedData.koordinatUser}
                </div>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary w-full"
            style={{ marginTop: 20, padding: '12px 16px' }}
            onClick={() => {
              setSubmitted(false);
              setSubmittedData(null);
              setNama('');
              setNamaTamu('');
              setInstansiTamu('');
              setDuplikatError(false);
            }}
          >
            Isi Presensi Lainnya
          </button>
        </div>
      </div>
    );
  }

  // ─── FORM SCREEN ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      <div className="card" style={{ maxWidth: 480, width: '100%', padding: '24px 20px' }}>
        
        {/* Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', boxShadow: 'var(--shadow-sm)' }}>
            <Scale size={24} />
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>
            Presensi Kehadiran Kegiatan
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            Sistem Informasi Manajemen Kegiatan Komisi DPRD
          </p>
        </div>

        {/* Network & GPS Indicator */}
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 10, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, flexWrap: 'wrap', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? 'var(--success)' : 'var(--warning)' }} />
              <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            <div>
              {gpsStatus === 'active' ? (
                <span className="badge badge-green" style={{ fontSize: 10 }}>
                  <MapPin size={10} /> GPS Aktif {gpsAccuracy ? `(±${gpsAccuracy}m)` : ''}
                </span>
              ) : gpsStatus === 'requesting' ? (
                <span className="badge badge-yellow" style={{ fontSize: 10 }}>
                  <RefreshCw size={10} className="animate-spin" /> Mengambil GPS...
                </span>
              ) : (
                <button
                  type="button"
                  onClick={requestLocation}
                  className="badge badge-red"
                  style={{ cursor: 'pointer', border: 'none', fontSize: 10 }}
                >
                  <Crosshair size={10} /> Ambil Ulang GPS
                </button>
              )}
            </div>
          </div>

          {koordinatUser && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--surface)', padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Navigation size={11} /> Lokasi Terdeteksi:
              </div>
              <div style={{ color: 'var(--text-2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {alamatGps || `${koordinatUser.lat.toFixed(6)}, ${koordinatUser.lng.toFixed(6)}`}
              </div>
            </div>
          )}

          {gpsErrorMsg && (
            <div style={{ fontSize: 11, color: 'var(--danger)', background: 'var(--danger-s)', padding: '8px 10px', borderRadius: 'var(--radius-xs)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div>{gpsErrorMsg}</div>
                <button
                  type="button"
                  onClick={() => setGpsSkipped(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 700, cursor: 'pointer', padding: 0, marginTop: 2, fontSize: 10, textDecoration: 'underline' }}
                >
                  Lewati GPS &amp; lanjutkan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Event Card / Selector */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#fff',
          borderRadius: 'var(--radius)',
          padding: 14,
          marginBottom: 16,
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--gold)' }}>
              Agenda Kegiatan Terpilih
            </div>
            {daftarJadwal.length > 1 && (
              <select
                value={kegiatan?.id || ''}
                onChange={(e) => {
                  const sel = daftarJadwal.find((j) => j.id === e.target.value);
                  if (sel) {
                    setKegiatan(sel);
                    if (sel.komisi) setKomisi(sel.komisi);
                  }
                }}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  fontSize: 10.5,
                  padding: '2px 8px',
                  cursor: 'pointer'
                }}
              >
                {daftarJadwal.map((j) => (
                  <option key={j.id} value={j.id} style={{ color: '#000' }}>
                    {j.judul}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 6 }}>
            {kegiatan?.judul || 'Rapat Koordinasi Komisi DPRD'}
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94A3B8', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={11} /> {kegiatan?.waktuMulai || '09:00'} - {kegiatan?.waktuSelesai || '12:00'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={11} /> {kegiatan?.lokasi || 'Ruang Rapat Utama DPRD'}
            </span>
          </div>
        </div>

        {/* Duplicate Name Error */}
        {duplikatError && (
          <div style={{ background: 'var(--danger-s)', color: 'var(--danger)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🚫 <strong>Nama ini sudah tercatat</strong> di agenda ini.</span>
            <button type="button" onClick={() => setDuplikatError(false)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontWeight: 800, cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* Duplicate Device Warning (Deteksi Perangkat Scan 2x) */}
        {deviceWarning && (
          <div style={{ background: '#FFFBEB', border: '1.5px solid #F59E0B', color: '#92400E', padding: '12px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, marginBottom: 4, color: '#B45309' }}>
              <AlertTriangle size={15} />
              <span>DETEKSI PERANGKAT: Sudah Digunakan Scan Absen!</span>
            </div>
            <p style={{ margin: 0, lineHeight: 1.4, fontSize: 11.5 }}>
              HP/Perangkat ini sebelumnya sudah digunakan untuk absen atas nama: <strong>{deviceWarning.namaAnggota}</strong> ({deviceWarning.komisi}) pada pukul {new Date(deviceWarning.waktuPresensi).toLocaleTimeString('id-ID')} WIB.
            </p>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '4px 8px' }}
                onClick={() => setDeviceWarning(null)}
              >
                Ganti Data
              </button>
            </div>
          </div>
        )}

        {/* Form Form Presensi */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Tabs: Anggota vs Tamu */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: 'var(--surface2)', padding: 4, borderRadius: 'var(--radius-sm)' }}>
            <button
              type="button"
              onClick={() => setTipeAbsen('anggota')}
              className={`btn btn-sm ${tipeAbsen === 'anggota' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ width: '100%', fontSize: 11 }}
            >
              <Building size={12} /> Anggota DPRD
            </button>
            <button
              type="button"
              onClick={() => setTipeAbsen('tamu')}
              className={`btn btn-sm ${tipeAbsen === 'tamu' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ width: '100%', fontSize: 11 }}
            >
              <User size={12} /> Tamu / Undangan
            </button>
          </div>

          {tipeAbsen === 'anggota' ? (
            <>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Nama Lengkap Anggota DPRD *</label>
                <input
                  type="text"
                  placeholder="Contoh: H. Ahmad Fauzi, S.E."
                  value={namaAnggota}
                  onChange={(e) => {
                    setNama(e.target.value);
                    setDuplikatError(false);
                  }}
                  required
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Komisi</label>
                  <select value={komisi} onChange={(e) => setKomisi(e.target.value)} className="form-select">
                    {DAFTAR_KOMISI.map((k) => (
                      <option key={k.id} value={k.nama}>{k.nama}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-select">
                    <option value="Hadir">Hadir</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Nama Lengkap Tamu / Narasumber *</label>
                <input
                  type="text"
                  placeholder="Contoh: Dr. Ir. Budi Santoso, M.Si"
                  value={namaTamu}
                  onChange={(e) => {
                    setNamaTamu(e.target.value);
                    setDuplikatError(false);
                  }}
                  required
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Instansi / Lembaga</label>
                  <input
                    type="text"
                    placeholder="Contoh: Dinas PU"
                    value={instansiTamu}
                    onChange={(e) => setInstansiTamu(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-select">
                    <option value="Hadir">Hadir</option>
                    <option value="Izin">Izin</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full"
            style={{ padding: '12px 16px', marginTop: 6, fontSize: 13 }}
          >
            {submitting ? (
              <>
                <RefreshCw size={15} className="animate-spin" /> Memproses Presensi...
              </>
            ) : isOnline ? (
              <>
                <UserCheck size={15} /> Kirim Kehadiran Sekarang
              </>
            ) : (
              <>
                <WifiOff size={15} /> Simpan Presensi Offline
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
