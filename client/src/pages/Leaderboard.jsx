import { useState, useEffect } from 'react';
import api from '../utils/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Leaderboard() {
  const [data, setData] = useState({ leaderboard: [], month: new Date().getMonth()+1, year: new Date().getFullYear() });
  const [allTime, setAllTime] = useState([]);
  const [tab, setTab] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/points/leaderboard?month=${month}&year=${year}`),
      api.get('/points/all-time')
    ]).then(([monthly, at]) => {
      setData(monthly.data);
      setAllTime(at.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [month, year]);

  const list = tab === 'monthly' ? data.leaderboard : allTime;

  const rankColor = (rank) => {
    if (rank === 1) return 'var(--accent-gold)';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    return 'var(--text-secondary)';
  };

  return (
    <div className="page">
      <div style={{ background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)', padding: '80px 0 60px', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="badge badge-gold" style={{ marginBottom: 12 }}>🏆 Rankings</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 6vw, 5rem)', marginBottom: 16 }}>Leaderboard</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto' }}>Points based on distance, elevation, intensity (TSS), speed, race bonuses & consistency. Updated in real-time.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {/* Controls */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <button onClick={() => setTab('monthly')} className="btn btn-sm" style={{ borderRadius: 0, background: tab === 'monthly' ? 'var(--accent-green)' : 'transparent', color: tab === 'monthly' ? '#000' : 'var(--text-secondary)' }}>Monthly</button>
              <button onClick={() => setTab('alltime')} className="btn btn-sm" style={{ borderRadius: 0, background: tab === 'alltime' ? 'var(--accent-green)' : 'transparent', color: tab === 'alltime' ? '#000' : 'var(--text-secondary)' }}>All Time</button>
            </div>
            {tab === 'monthly' && (
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <select className="form-input" style={{ width: 'auto', padding: '8px 12px' }} value={month} onChange={e => setMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                </select>
                <select className="form-input" style={{ width: 'auto', padding: '8px 12px' }} value={year} onChange={e => setYear(Number(e.target.value))}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Points System Explainer */}
          <div className="card" style={{ marginBottom: 32, padding: 20 }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: 12, color: 'var(--accent-green)' }}>⚡ Points Formula</h4>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {['Distance × 2 pts/km', 'Elevation × 0.5 pts/m', 'Speed bonus × 3 per km/h above 20', 'TSS × 0.8 pts', 'Race +50 pts', 'Consistency +20/week (4+ rides)', 'Long ride +30 (>100km)'].map(f => (
                <span key={f} className="badge badge-green" style={{ fontSize: '0.75rem' }}>{f}</span>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading-screen"><div className="spinner" /></div>
          ) : list.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🚴</div>
              <p>No data for this period yet. Start riding!</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Rank</th>
                    <th>Rider</th>
                    <th>Points</th>
                    <th>Distance</th>
                    <th>Rides</th>
                    {tab === 'monthly' && <th>TSS</th>}
                    <th>Avg Speed</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((entry, i) => {
                    const rank = i + 1;
                    const user = tab === 'monthly' ? entry.userId : entry;
                    const pts = tab === 'monthly' ? entry.totalPoints : entry.totalPoints;
                    return (
                      <tr key={entry._id || user._id}>
                        <td>
                          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 800, color: rankColor(rank) }}>
                            {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : `#${rank}`}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img
                              src={user?.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'X')}&backgroundColor=00e676&textColor=000000`}
                              alt={user?.name}
                              style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div>
                              <div style={{ fontWeight: 600 }}>{user?.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.city || 'Dhaka'}</div>
                            </div>
                          </div>
                        </td>
                        <td><span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--accent-green)', fontWeight: 700 }}>{Math.round(pts || 0)}</span></td>
                        <td>{tab === 'monthly' ? `${entry.totalDistance?.toFixed(1) || 0} km` : `${user?.stats?.totalDistance?.toFixed(0) || 0} km`}</td>
                        <td>{tab === 'monthly' ? (entry.totalRides || 0) : (user?.stats?.totalRides || 0)}</td>
                        {tab === 'monthly' && <td>{entry.totalTSS?.toFixed(0) || 0}</td>}
                        <td>{tab === 'monthly' ? `${entry.avgSpeedForMonth?.toFixed(1) || 0} km/h` : `${user?.stats?.avgSpeed?.toFixed(1) || 0} km/h`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
