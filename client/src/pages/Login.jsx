import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 🚴`);
      if (user.role === 'superadmin') nav('/superadmin');
      else if (user.role === 'admin') nav('/admin');
      else nav('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', background: 'radial-gradient(ellipse at center, rgba(0,230,118,0.06) 0%, transparent 70%)' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="/logo.jpg" alt="TeamBDC" style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid var(--accent-green)', marginBottom: 16, boxShadow: 'var(--shadow-green)' }} />
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: 4 }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Sign in to your TeamBDC account</p>
        </div>

        <div className="card" style={{ padding: 40 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="your@email.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="••••••••" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In 🚴'}
            </button>
          </form>
          <div className="divider" />
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            New rider? <Link to="/register" style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Join the Team →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
