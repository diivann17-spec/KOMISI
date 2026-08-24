import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../utils/auth';
import { userStorage, seedMockData } from '../utils/storage';
import { Scale, Eye, EyeOff, LogIn, Users } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { email: 'admin@dprd.go.id', password: 'password123', displayName: 'Admin Sekretariat', role: 'admin', roleLabel: 'Admin Sistem' },
  { email: 'pimpinan@dprd.go.id', password: 'password123', displayName: 'Pimpinan DPRD', role: 'pimpinan', roleLabel: 'Pimpinan DPRD' },
  { email: 'komisi1@dprd.go.id', password: 'password123', displayName: 'Komisi 1', role: 'petugas', roleLabel: 'Petugas Komisi 1', komisiAssigned: 'Komisi I' },
  { email: 'komisi2@dprd.go.id', password: 'password123', displayName: 'Komisi 2', role: 'petugas', roleLabel: 'Petugas Komisi 2', komisiAssigned: 'Komisi II' },
  { email: 'komisi3@dprd.go.id', password: 'password123', displayName: 'Komisi 3', role: 'petugas', roleLabel: 'Petugas Komisi 3', komisiAssigned: 'Komisi III' },
  { email: 'komisi4@dprd.go.id', password: 'password123', displayName: 'Komisi 4', role: 'petugas', roleLabel: 'Petugas Komisi 4', komisiAssigned: 'Komisi IV' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Login via Firebase Auth
      const user = await loginUser(form.email.trim(), form.password);
      userStorage.setCurrentUser(user);
      seedMockData();
      navigate('/');
    } catch (err) {
      console.warn('Firebase login failed, trying fallback demo login:', err);

      // Fallback: Jika Firebase Auth belum di-seed, izinkan login lokal untuk Akun Demo Komisi 1–4
      const demoMatch = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === form.email.trim().toLowerCase() && form.password === a.password);
      if (demoMatch) {
        const fallbackUser = {
          uid: demoMatch.email,
          email: demoMatch.email,
          displayName: demoMatch.displayName,
          role: demoMatch.role,
          roleLabel: demoMatch.roleLabel,
          komisiAssigned: demoMatch.komisiAssigned || 'Komisi I'
        };
        userStorage.setCurrentUser(fallbackUser);
        seedMockData();
        navigate('/');
        return;
      }

      setError(`Login gagal: Periksa kembali email & password yang dimasukkan.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedUsers = async () => {
    if (!confirm('Fitur ini akan meregistrasikan 6 akun demo (Admin, Pimpinan, Komisi I–IV) ke Firebase Auth & Firestore. Lanjutkan?')) return;
    setLoading(true);
    let successCount = 0;
    let errors = [];
    for (const acc of DEMO_ACCOUNTS) {
      try {
        await registerUser(acc.email, acc.password, acc.displayName, acc.role);
        successCount++;
      } catch (err) {
        console.error('Failed to seed', acc.email, err);
        errors.push(`${acc.email}: ${err.message}`);
      }
    }
    setLoading(false);
    if (successCount > 0) {
      alert(`Berhasil mendaftarkan ${successCount} akun ke Firebase Auth!`);
    } else {
      alert(`Catatan: Akun Demo Komisi 1–4 tetap bisa langsung digunakan via Fallback Lokal.\n\nDetail: ${errors.join('; ')}`);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 440, padding: 32 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 60, height: 60, background: '#0F172A', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(15,23,42,.2)'
          }}>
            <Scale size={28} color="#EAB308" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4, color: 'var(--navy)' }}>
            SIM Kegiatan Komisi DPRD
          </h1>
          <p style={{ fontSize: 13, color: '#64748B' }}>
            Portal Login Pengguna Komisi I, II, III, &amp; IV DPRD
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Akun</label>
            <input
              className="form-input"
              type="email"
              placeholder="Contoh: komisi2@dprd.go.id"
              value={form.email || ''}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Masukkan password..."
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                autoComplete="current-password"
                required
                style={{ width: '100%', paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', border: 'none',
                  background: 'none', cursor: 'pointer', color: '#94A3B8',
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#FEE2E2', color: '#991B1B', padding: '10px 14px',
              borderRadius: 8, fontSize: 12.5, marginBottom: 16, fontWeight: 600
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading}
          >
            {loading ? (
              <span style={{ opacity: .7 }}>Memverifikasi Login...</span>
            ) : (
              <><LogIn size={17} /> Masuk ke Sistem</>
            )}
          </button>
        </form>

        {/* Quick Demo Accounts Selection */}
        <div style={{
          marginTop: 22, padding: '14px 16px',
          background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0',
        }}>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            🔑 PILIH AKUN DEMO KOMISI 1 – 4:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DEMO_ACCOUNTS.map(a => (
              <button
                key={a.email}
                type="button"
                onClick={() => setForm({ email: a.email, password: a.password })}
                style={{
                  textAlign: 'left', background: 'var(--surface)', border: '1px solid #E2E8F0',
                  borderRadius: 6, padding: '6px 10px', cursor: 'pointer', transition: 'all 0.12s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
                className="hover:border-blue-500"
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>{a.displayName}</div>
                  <div style={{ fontSize: 10.5, color: '#2563EB', fontFamily: 'monospace' }}>{a.email}</div>
                </div>
                <span className="badge badge-purple" style={{ fontSize: 9.5 }}>
                  {a.roleLabel.split(' ')[0]} {a.komisiAssigned || ''}
                </span>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 12, borderTop: '1px dashed #CBD5E1', paddingTop: 10 }}>
            <button
              type="button"
              onClick={handleSeedUsers}
              disabled={loading}
              style={{
                background: '#0F172A', color: 'white', border: 'none',
                borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', width: '100%'
              }}
            >
              🛠️ [DEV] Daftarkan Seluruh Akun ke Firebase Auth
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
