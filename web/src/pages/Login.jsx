import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../utils/auth';
import { userStorage, seedMockData } from '../utils/storage';
import { Scale, Eye, EyeOff, LogIn } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { email: 'admin@dprd.go.id', password: 'password123', displayName: 'Admin Sekretariat', role: 'admin' },
  { email: 'ketua@dprd.go.id', password: 'password123', displayName: 'Ketua DPRD', role: 'pimpinan' },
  { email: 'petugas1@dprd.go.id', password: 'password123', displayName: 'Petugas Komisi I', role: 'petugas' },
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
      // Login via Firebase
      const user = await loginUser(form.email.trim(), form.password);
      
      userStorage.setCurrentUser(user);
      seedMockData();
      navigate('/');
    } catch (err) {
      console.warn('Firebase login failed, trying fallback demo login:', err);
      
      // Fallback: Jika Firebase Auth belum siap/belum di-seed, izinkan login lokal untuk Akun Demo
      const demoMatch = DEMO_ACCOUNTS.find(a => a.email === form.email.trim() && form.password === a.password);
      if (demoMatch) {
        const fallbackUser = {
          uid: demoMatch.email,
          email: demoMatch.email,
          displayName: demoMatch.displayName,
          role: demoMatch.role,
          roleLabel: demoMatch.role === 'admin' ? 'Admin Sistem' : demoMatch.role === 'pimpinan' ? 'Pimpinan DPRD' : 'Petugas Komisi'
        };
        userStorage.setCurrentUser(fallbackUser);
        seedMockData();
        navigate('/');
        return;
      }
      
      setError(`Login gagal: ${err.message || 'Periksa email & password'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedUsers = async () => {
    if (!confirm('Fitur ini akan mencoba meregistrasikan 3 akun demo ke Firebase Auth & Firestore. Lanjutkan?')) return;
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
      alert(`Berhasil mendaftarkan ${successCount} akun demo ke Firebase!`);
    } else {
      alert(`Gagal mendaftarkan ke Firebase:\n${errors.join('\n')}\n\nCatatan: Anda tetap bisa Login menggunakan Akun Demo karena fitur Fallback Lokal sudah aktif.`);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, background: '#0F172A', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(15,23,42,.2)'
          }}>
            <Scale size={28} color="#EAB308" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            SIM Kegiatan Komisi DPRD
          </h1>
          <p style={{ fontSize: 13, color: '#64748B' }}>
            Sistem Informasi Manajemen Kegiatan Komisi I–V
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="Masukkan email..."
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
              borderRadius: 8, fontSize: 13, marginBottom: 16,
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
              <span style={{ opacity: .7 }}>Memverifikasi...</span>
            ) : (
              <><LogIn size={17} /> Masuk ke Sistem</>
            )}
          </button>
        </form>

        {/* Demo hint */}
        <div style={{
          marginTop: 20, padding: '12px 14px',
          background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0',
        }}>
          <p style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 6 }}>
            AKUN DEMO:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {DEMO_ACCOUNTS.map(a => (
              <button
                key={a.email}
                type="button"
                onClick={() => setForm({ email: a.email, password: a.password })}
                style={{
                  textAlign: 'left', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 12, color: '#2563EB', padding: '2px 0',
                  fontFamily: 'monospace',
                }}
              >
                {a.email} / {a.password} — {a.displayName}
              </button>
            ))}
          </div>
          
          <div style={{ marginTop: 12, borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
            <button
              type="button"
              onClick={handleSeedUsers}
              disabled={loading}
              style={{
                background: '#0F172A', color: 'white', border: 'none',
                borderRadius: 4, padding: '4px 8px', fontSize: 11,
                cursor: 'pointer', width: '100%'
              }}
            >
              🛠️ [DEV] Register Akun Demo ke Firebase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
