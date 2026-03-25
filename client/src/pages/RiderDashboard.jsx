import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const chartDefaults = {
  responsive: true,
  plugins: { legend: { labels: { color: '#8892b0', font: { family: 'Inter' } } } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892b0' } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892b0' } }
  }
};

export default function RiderDashboard() {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [rides, setRides] = useState([]);
  const [stats, setStats] = useState(null);
  const [points, setPoints] = useState([]);
  const [monthlyPoints, setMonthlyPoints] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [profile, setProfile] = useState({ bio: '', phone: '', city: '', ftp: 200 });
  const [period, setPeriod] = useState('month');
  const [tab, setTab] = useState('overview');
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (searchParams.get('strava') === 'connected') toast.success('Strava connected successfully! 🚴');
    if (searchParams.get('strava') === 'error') toast.error('Strava connection failed. Please try again.');
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    setProfile({ bio: user.bio || '', phone: user.phone || '', city: user.city || '', ftp: user.stravaProfile?.ftp || 200 });
    loadData();
  }, [user, period]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [ridesRes, statsRes, pointsRes] = await Promise.all([
        api.get(`/rides/${user._id}?limit=10`),
        api.get(`/rides/${user._id}/stats?period=${period}`),
        api.get(`/points/${user._id}`)
      ]);
      setRides(ridesRes.data.rides || []);
      setStats(statsRes.data);
      setPoints(pointsRes.data || []);
      const now = new Date();
      setMonthlyPoints(pointsRes.data.find(p => p.month === now.getMonth() + 1 && p.year === now.getFullYear()) || null);
    } catch (err) {
      console.error('Load error:', err);
    }
  };

  const connectStrava = async () => {
    try {
      const { data } = await api.get('/strava/auth');
      window.location.href = data.authUrl;
    } catch { toast.error('Failed to initiate Strava connection'); }
  };

  const syncStrava = async () => {
    setSyncing(true);
    try {
      await api.post('/strava/sync');
      await refreshUser();
      await loadData();
      toast.success('Strava synced! Data updated 🚴');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed');
    } finally { setSyncing(false); }
  };

  const saveProfile = async () => {
    try {
      await api.patch(`/users/${user._id}/profile`, profile);
      await refreshUser();
      setEditProfile(false);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return;
    setUploading(true);
    const form = new FormData();
    form.append('photo', photoFile);
    try {
      await api.post(`/users/${user._id}/photo`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      setPhotoFile(null);
      toast.success('Photo updated!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  // Chart data
  const monthlyChartData = stats?.monthlyData ? {
    labels: stats.monthlyData.map(d => `${['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d._id.month]} ${String(d._id.year).slice(2)}`),
    datasets: [{
      label: 'Distance (km)',
      data: stats.monthlyData.map(d => d.distance?.toFixed(1) || 0),
      backgroundColor: 'rgba(0,230,118,0.25)',
      borderColor: 'rgba(0,230,118,0.9)',
      borderWidth: 2, borderRadius: 6, fill: true
    }]
  } : null;

  const tssChartData = stats?.monthlyData ? {
    labels: stats.monthlyData.map(d => `${['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d._id.month]}`),
    datasets: [{
      label: 'TSS (Training Load)',
      data: stats.monthlyData.map(d => d.tss?.toFixed(0) || 0),
      borderColor: '#00b0ff',
      backgroundColor: 'rgba(0,176,255,0.1)',
      tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#00b0ff'
    }]
  } : null;

  const pointsChartData = points.length > 0 ? {
    labels: points.map(p => `${['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][p.month]} ${p.year}`),
    datasets: [{
      label: 'Monthly Points',
      data: points.map(p => p.totalPoints?.toFixed(0) || 0),
      backgroundColor: 'rgba(255,214,0,0.2)',
      borderColor: 'rgba(255,214,0,0.9)',
      borderWidth: 2, borderRadius: 6, fill: true
    }]
  } : null;

  if (!user) return null;

  return (
    <div className="page" style={{ paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))', padding: '40px 0 30px', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current.click()}>
              <img
                src={user.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=00e676&textColor=000000`}
                alt={user.name}
                style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-green)', boxShadow: 'var(--shadow-green)' }}
              />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <span style={{ fontSize: '1.5rem' }}>📷</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { setPhotoFile(e.target.files[0]); }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem' }}>{user.name}</h1>
                <span className="badge badge-green">{user.role}</span>
                {user.stravaId && <span className="badge" style={{ background: 'rgba(252,112,26,0.15)', color: '#fc701a', borderColor: 'rgba(252,112,26,0.3)' }}>🟠 Strava Connected</span>}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>📍 {user.city || 'Dhaka'} &nbsp;·&nbsp; Joined {new Date(user.joinDate || user.createdAt).toLocaleDateString('en-BD', { month: 'long', year: 'numeric' })}</p>
              {user.bio && <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '0.9rem', maxWidth: 500 }}>{user.bio}</p>}
              {photoFile && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={uploadPhoto} disabled={uploading}>{uploading ? 'Uploading...' : 'Save Photo'}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPhotoFile(null)}>Cancel</button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!user.stravaId ? (
                <button onClick={connectStrava} className="btn btn-sm" style={{ background: '#fc701a', color: '#fff' }}>🟠 Connect Strava</button>
              ) : (
                <button onClick={syncStrava} disabled={syncing} className="btn btn-outline btn-sm">{syncing ? 'Syncing...' : '🔄 Sync Strava'}</button>
              )}
              <button onClick={() => setEditProfile(!editProfile)} className="btn btn-ghost btn-sm">✏️ Edit Profile</button>
            </div>
          </div>

          {editProfile && (
            <div className="card" style={{ marginTop: 24, padding: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Edit Profile</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">City</label>
                  <input className="form-input" value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">FTP (Watts) — for TSS calc</label>
                  <input type="number" className="form-input" value={profile.ftp} onChange={e => setProfile(p => ({ ...p, ftp: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 16, marginBottom: 0 }}>
                <label className="form-label">Bio</label>
                <textarea className="form-input" value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3} />
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={saveProfile}>Save Changes</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditProfile(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '24px 0' }}>
        <div className="container grid-4">
          {[
            { label: 'Total Distance', value: `${(user.stats?.totalDistance || 0).toFixed(0)} km`, icon: '🛣️' },
            { label: 'Total Rides', value: user.stats?.totalRides || 0, icon: '🚴' },
            { label: 'Elevation', value: `${(user.stats?.totalElevation || 0).toFixed(0)} m`, icon: '⛰️' },
            { label: 'Avg Speed', value: `${user.stats?.avgSpeed?.toFixed(1) || 0} km/h`, icon: '⚡' },
          ].map(s => (
            <div key={s.label} className="stat-box">
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div className="container" style={{ display: 'flex', gap: 0 }}>
          {['overview', 'performance', 'rides', 'points'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '16px 24px', background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t ? 'var(--accent-green)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.05em', borderBottom: tab === t ? '2px solid var(--accent-green)' : '2px solid transparent',
              transition: 'var(--transition)', textAlign: 'center'
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div className="container" style={{ marginTop: 32 }}>
        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div>
            {/* Monthly Points Card */}
            {monthlyPoints && (
              <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-gold)', fontSize: '0.8rem', letterSpacing: '0.1em', marginBottom: 4 }}>THIS MONTH</div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 900, color: 'var(--accent-green)' }}>{Math.round(monthlyPoints.totalPoints)} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>pts</span></div>
                  {monthlyPoints.rank && <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Rank #{monthlyPoints.rank} this month</div>}
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {[
                    ['Distance Pts', monthlyPoints.distancePoints],
                    ['TSS Pts', monthlyPoints.tssPoints],
                    ['Speed Pts', monthlyPoints.speedPoints],
                    ['Elev. Pts', monthlyPoints.elevationPoints],
                    ['Consistency', monthlyPoints.consistencyBonus],
                    ['Race Bonus', monthlyPoints.raceBonus],
                  ].map(([label, val]) => (
                    <div key={label} style={{ textAlign: 'center', minWidth: 70 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--accent-green)', fontWeight: 700 }}>{Math.round(val || 0)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fitness Metrics */}
            <div className="grid-3" style={{ marginBottom: 24 }}>
              {[
                { label: 'CTL (Fitness)', value: user.ctl?.toFixed(1) || 0, icon: '💪', color: 'var(--accent-green)', desc: 'Chronic Training Load (42-day avg)' },
                { label: 'ATL (Fatigue)', value: user.atl?.toFixed(1) || 0, icon: '😓', color: 'var(--accent-red)', desc: 'Acute Training Load (7-day avg)' },
                { label: 'TSB (Form)', value: user.tsb?.toFixed(1) || 0, icon: '🎯', color: user.tsb >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', desc: 'Training Stress Balance (CTL - ATL)' },
              ].map(m => (
                <div key={m.label} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>{m.icon}</div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, color: m.color }}>{m.value}</div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: 4 }}>{m.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{m.desc}</div>
                </div>
              ))}
            </div>

            {/* Recent Rides */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>Recent Rides</h3>
              </div>
              {rides.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>🚴</div>
                  <p>{user.stravaId ? 'No rides found. Sync your Strava.' : 'Connect Strava to see your rides.'}</p>
                  {!user.stravaId && <button onClick={connectStrava} className="btn btn-sm" style={{ background: '#fc701a', color: '#fff', marginTop: 12 }}>🟠 Connect Strava</button>}
                </div>
              ) : (
                <table className="table">
                  <thead><tr><th>Activity</th><th>Date</th><th>Distance</th><th>Duration</th><th>Elevation</th><th>Avg Speed</th><th>TSS</th></tr></thead>
                  <tbody>
                    {rides.map(ride => (
                      <tr key={ride._id}>
                        <td><span style={{ fontWeight: 600 }}>{ride.name}</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{new Date(ride.date).toLocaleDateString()}</td>
                        <td><span className="text-green">{ride.distance?.toFixed(1)} km</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{Math.floor(ride.movingTime / 3600)}h {Math.floor((ride.movingTime % 3600) / 60)}m</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{ride.elevationGain?.toFixed(0)} m</td>
                        <td>{ride.avgSpeed?.toFixed(1)} km/h</td>
                        <td><span style={{ color: '#00b0ff' }}>{ride.tss?.toFixed(0) || '-'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* PERFORMANCE TAB */}
        {tab === 'performance' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {['week','month','year','all'].map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-ghost'}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
              ))}
            </div>
            {stats && (
              <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="stat-box"><div className="stat-value">{stats.stats?.totalDistance?.toFixed(0) || 0} km</div><div className="stat-label">Distance</div></div>
                <div className="stat-box"><div className="stat-value">{stats.stats?.totalTSS?.toFixed(0) || 0}</div><div className="stat-label">Total TSS</div></div>
              </div>
            )}
            <div className="grid-2" style={{ gap: 24 }}>
              {monthlyChartData && (
                <div className="card">
                  <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Distance by Month</h3>
                  <Bar data={monthlyChartData} options={chartDefaults} />
                </div>
              )}
              {tssChartData && (
                <div className="card">
                  <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Training Load (TSS)</h3>
                  <Line data={tssChartData} options={chartDefaults} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* RIDES TAB */}
        {tab === 'rides' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)' }}>All Rides</h3>
              {user.stravaId && <button onClick={syncStrava} disabled={syncing} className="btn btn-outline btn-sm">{syncing ? 'Syncing...' : '🔄 Sync Strava'}</button>}
            </div>
            {rides.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No rides yet. Connect Strava to import your activities.</div>
            ) : (
              <table className="table">
                <thead><tr><th>Activity</th><th>Date</th><th>Distance</th><th>Duration</th><th>Elevation</th><th>Avg Speed</th><th>Avg HR</th><th>TSS</th><th>Source</th></tr></thead>
                <tbody>
                  {rides.map(r => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Date(r.date).toLocaleDateString()}</td>
                      <td className="text-green">{r.distance?.toFixed(2)} km</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{Math.floor(r.movingTime / 3600)}h {Math.floor((r.movingTime % 3600) / 60)}m</td>
                      <td>{r.elevationGain?.toFixed(0)} m</td>
                      <td>{r.avgSpeed?.toFixed(1)} km/h</td>
                      <td>{r.avgHeartRate ? `${r.avgHeartRate} bpm` : '-'}</td>
                      <td style={{ color: '#00b0ff' }}>{r.tss?.toFixed(0) || '-'}</td>
                      <td><span className={`badge ${r.source === 'strava' ? 'badge-green' : 'badge-blue'}`}>{r.source}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* POINTS TAB */}
        {tab === 'points' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>ALL TIME POINTS</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '3.5rem', fontWeight: 900, color: 'var(--accent-green)' }}>{user.totalPoints?.toFixed(0) || 0}</div>
              </div>
            </div>
            {pointsChartData && (
              <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Points History</h3>
                <Bar data={pointsChartData} options={chartDefaults} />
              </div>
            )}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)' }}>Monthly Breakdown</h3>
              </div>
              <table className="table">
                <thead><tr><th>Period</th><th>Total</th><th>Distance</th><th>TSS</th><th>Elevation</th><th>Speed</th><th>Consistency</th><th>Race</th><th>Rank</th></tr></thead>
                <tbody>
                  {points.map(p => (
                    <tr key={p._id}>
                      <td>{['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][p.month]} {p.year}</td>
                      <td><span style={{ color: 'var(--accent-green)', fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>{Math.round(p.totalPoints)}</span></td>
                      <td>{Math.round(p.distancePoints)}</td>
                      <td>{Math.round(p.tssPoints)}</td>
                      <td>{Math.round(p.elevationPoints)}</td>
                      <td>{Math.round(p.speedPoints)}</td>
                      <td>{Math.round(p.consistencyBonus)}</td>
                      <td>{Math.round(p.raceBonus)}</td>
                      <td>{p.rank ? `#${p.rank}` : '-'}</td>
                    </tr>
                  ))}
                  {points.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No points data yet. Complete rides and sync Strava.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
