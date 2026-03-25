import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', city: 'Dhaka', bio: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      toast.success('Registration submitted! Await admin approval. 🏆');
      nav('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', background: 'radial-gradient(ellipse at bottom right, rgba(0,230,118,0.06) 0%, transparent 60%)' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="/logo.jpg" alt="TeamBDC" style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid var(--accent-green)', marginBottom: 16, boxShadow: 'var(--shadow-green)' }} />
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: 4 }}>Join TeamBDC</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Apply to become a Team Bangladesh Cyclist</p>
        </div>

        <div className="card" style={{ padding: 40 }}>
          <div className="alert alert-info" style={{ marginBottom: 24, fontSize: '0.85rem' }}>
            📋 Your application will be reviewed by an admin before your profile goes live.
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-input" placeholder="Your full name" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">City *</label>
                <input type="text" className="form-input" placeholder="Dhaka" value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" placeholder="your@email.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Password *</label>
                <input type="password" className="form-input" placeholder="Min 8 characters" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone</label>
                <input type="tel" className="form-input" placeholder="+880..." value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Bio / Cycling Background</label>
              <textarea className="form-input" placeholder="Tell us about your cycling experience, goals..." value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application 🚴'}
            </button>
          </form>
          <div className="divider" />
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Already a member? <Link to="/login" style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Sign In →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
