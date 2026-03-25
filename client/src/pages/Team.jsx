import { useState, useEffect } from 'react';
import api from '../utils/api';

const ROLE_LABELS = { advisor: 'Advisor', leader: 'Team Leader', cofounder: 'Co-Founder', admin: 'Operations' };
const ROLE_ICONS = { advisor: '🎓', leader: '⭐', cofounder: '🔑', admin: '⚙️' };
const ROLE_ORDER = ['leader', 'cofounder', 'admin', 'advisor'];

export default function Team() {
  const [orgMembers, setOrgMembers] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riderSearch, setRiderSearch] = useState('');

  useEffect(() => {
    Promise.all([api.get('/org'), api.get('/users')])
      .then(([org, users]) => { setOrgMembers(org.data); setRiders(users.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grouped = ROLE_ORDER.reduce((acc, role) => {
    acc[role] = orgMembers.filter(m => m.role === role);
    return acc;
  }, {});

  const filteredRiders = riders.filter(r => r.name.toLowerCase().includes(riderSearch.toLowerCase()) || (r.city || '').toLowerCase().includes(riderSearch.toLowerCase()));

  return (
    <div className="page">
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)', padding: '80px 0 60px', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="badge badge-green" style={{ marginBottom: 12 }}>Our People</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 6vw, 5rem)', marginBottom: 16 }}>
            The <span className="text-green">TeamBDC</span> Family
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto' }}>From advisors to active riders — meet the people driving Bangladesh's cycling revolution forward.</p>
        </div>
      </div>

      {/* Org Structure */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Organizational Structure</h2>
            <div className="accent-line" />
          </div>

          {loading ? (
            <div className="loading-screen"><div className="spinner" /></div>
          ) : (
            <>
              {ROLE_ORDER.map(role => grouped[role]?.length > 0 && (
                <div key={role} style={{ marginBottom: 60 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                    <span style={{ fontSize: '1.5rem' }}>{ROLE_ICONS[role]}</span>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--accent-green)' }}>
                      {ROLE_LABELS[role]}s
                    </h3>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>
                  <div className={`grid-${Math.min(grouped[role].length, 3)}`}>
                    {grouped[role].map(member => (
                      <div key={member._id} className="card" style={{ textAlign: 'center', padding: 32 }}>
                        <img
                          src={member.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}&backgroundColor=0a0e1a&textColor=00e676`}
                          alt={member.name}
                          style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-green)', marginBottom: 16, boxShadow: 'var(--shadow-green)' }}
                        />
                        <span className="badge badge-green" style={{ marginBottom: 10 }}>{ROLE_LABELS[member.role]}</span>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: 4 }}>{member.name}</h3>
                        <p style={{ color: 'var(--accent-green)', fontSize: '0.85rem', marginBottom: 12 }}>{member.title}</p>
                        {member.bio && <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>{member.bio}</p>}
                        {(member.socialLinks?.facebook || member.socialLinks?.strava) && (
                          <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
                            {member.socialLinks.strava && <a href={member.socialLinks.strava} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>🟠 Strava</a>}
                            {member.socialLinks.facebook && <a href={member.socialLinks.facebook} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>📘 Facebook</a>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {orgMembers.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏗️</div>
                  <p>Org members will appear here once added by the super admin.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Riders */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <h2>Active Riders</h2>
            <div className="accent-line" />
          </div>
          <div style={{ maxWidth: 400, margin: '0 auto 40px' }}>
            <input type="text" className="form-input" placeholder="🔍 Search riders by name or city..." value={riderSearch} onChange={e => setRiderSearch(e.target.value)} />
          </div>
          {filteredRiders.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🚴</div>
              <p>{riderSearch ? 'No riders match your search.' : 'Riders will appear here once approved.'}</p>
            </div>
          ) : (
            <div className="grid-3">
              {filteredRiders.map(rider => (
                <div key={rider._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px' }}>
                  <img
                    src={rider.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rider.name)}&backgroundColor=00e676&textColor=000000`}
                    alt={rider.name}
                    style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border)' }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rider.name}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>📍 {rider.city || 'Dhaka'}</p>
                    <div style={{ marginTop: 6, display: 'flex', gap: 12, fontSize: '0.8rem' }}>
                      <span className="text-green">{rider.stats?.totalDistance?.toFixed(0) || 0} km</span>
                      <span style={{ color: 'var(--text-muted)' }}>{rider.stats?.totalRides || 0} rides</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
