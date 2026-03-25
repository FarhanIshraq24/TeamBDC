import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './Landing.css';

const TEAM_PHOTOS = [
  '/assets/team1.jpg', '/assets/team2.jpg',
  '/assets/team3.jpg', '/assets/team4.jpg',
];

const ACHIEVEMENTS = [
  { icon: '🏆', stat: '400KM', label: 'Ultra Record' },
  { icon: '🌍', stat: '10+', label: 'Int\'l Races' },
  { icon: '🚴', stat: '50+', label: 'Active Riders' },
  { icon: '⚡', stat: '2015', label: 'Est. Year' },
];

export default function Landing() {
  const [top3, setTop3] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    api.get('/leaderboard/monthly-top').then(r => setTop3(r.data)).catch(() => { });
    api.get('/announcements').then(r => setAnnouncements(r.data.slice(0, 3))).catch(() => { });
    api.get('/achievements').then(r => setAchievements(r.data)).catch(() => { });
    const t = setInterval(() => setHeroIndex(i => (i + 1) % TEAM_PHOTOS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="page landing">
      {/* ─── HERO ─── */}
      <section className="hero">
        <div className="hero-bg">
          {TEAM_PHOTOS.map((src, i) => (
            <img key={src} src={src} alt="" className={`hero-img ${i === heroIndex ? 'active' : ''}`} />
          ))}
          <div className="hero-overlay" />
        </div>
        <div className="hero-content container">
          <div className="hero-badge animate-fadeInUp"><span className="badge badge-green">🏆 Team Bangladesh Cyclist</span></div>
          <h1 className="hero-title animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <span className="text-green">TEAM</span>BDC
          </h1>
          <p className="hero-tagline animate-fadeInUp" style={{ animationDelay: '0.2s' }}>SHUT UP LEGS</p>
          <p className="hero-desc animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            Bangladesh's premier competitive amateur cycling team. Training hard, racing smart, pushing the limits of what's possible.
          </p>
          <div className="hero-actions animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <Link to="/register" className="btn btn-primary btn-lg">Join the Team</Link>
            <Link to="/leaderboard" className="btn btn-outline btn-lg">View Leaderboard</Link>
          </div>
        </div>
        <div className="hero-scroll">
          <div className="scroll-indicator"><span /><span /><span /></div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="section-sm" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container grid-4">
          {ACHIEVEMENTS.map(a => (
            <div key={a.stat} className="stat-box" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>{a.icon}</div>
              <div className="stat-value">{a.stat}</div>
              <div className="stat-label">{a.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section className="section">
        <div className="container">
          <div className="about-grid">
            <div className="about-text animate-fadeInUp">
              <span className="badge badge-green" style={{ marginBottom: 16 }}>About Us</span>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: 20 }}>
                The Competitive Wing of <span className="text-green">BDCyclists</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 16 }}>
                TeamBDC is the competitive sports wing of BDCyclists, bringing together passionate and dedicated amateur cyclists from across Bangladesh. Our mission is to train, develop, and inspire riders to reach their full potential.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 24 }}>
                Founded on the spirit of community and performance, TeamBDC focuses on structured training, participation in local and international competitions, and continuous skill development. We are more than just a team—we are a family of athletes committed to pushing boundaries.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Link to="/team" className="btn btn-outline">Meet the Team</Link>
                <Link to="/gallery" className="btn btn-ghost">Gallery</Link>
              </div>
            </div>
            <div className="about-gallery">
              {TEAM_PHOTOS.slice(0, 2).map((src, i) => (
                <img key={i} src={src} alt="TeamBDC" className={`about-photo about-photo-${i}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── MONTHLY TOP 3 ─── */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <span className="badge badge-gold" style={{ marginBottom: 12 }}>🏆 This Month</span>
            <h2>Monthly Top Riders</h2>
            <div className="accent-line" />
            <p className="subtitle" style={{ marginTop: 12 }}>Based on our rigorous points system: distance, intensity, training load & consistency</p>
          </div>
          {top3.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🚴</div>
              <p>Season starting — complete rides to appear here!</p>
            </div>
          ) : (
            <div className="top3-grid">
              {top3.map((entry, i) => (
                <div key={i} className={`top3-card rank-card-${i + 1}`}>
                  <div className="top3-rank">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                  </div>
                  <img
                    src={entry.user?.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(entry.user?.name || 'X')}&backgroundColor=00e676&textColor=000000`}
                    alt={entry.user?.name}
                    className="top3-avatar"
                  />
                  <h3 className="top3-name">{entry.user?.name}</h3>
                  <p className="top3-city">{entry.user?.city || 'Dhaka'}</p>
                  <div className="top3-points">{entry.points?.toFixed(0) || 0} <span>pts</span></div>
                  <div className="top3-stats">
                    <div><span className="text-green">{entry.distance?.toFixed(1) || 0}</span> km</div>
                    <div><span className="text-green">{entry.rides || 0}</span> rides</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/leaderboard" className="btn btn-outline">Full Leaderboard →</Link>
          </div>
        </div>
      </section>

      {/* ─── ACHIEVEMENTS ─── */}
      {achievements.filter(a => a.isFeatured).length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <span className="badge badge-red" style={{ marginBottom: 12 }}>🎖️ Achievements</span>
              <h2>Team Milestones</h2>
              <div className="accent-line" />
            </div>
            <div className="grid-2">
              {achievements.filter(a => a.isFeatured).map(ach => (
                <div key={ach._id} className="card achievement-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div className="achievement-icon">
                      {ach.category === 'race' ? '🏁' : ach.category === 'record' ? '⚡' : ach.category === 'milestone' ? '🎯' : '🏆'}
                    </div>
                    <div>
                      <span className="badge badge-red" style={{ marginBottom: 8, fontSize: '0.7rem' }}>{ach.category}</span>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: 8 }}>{ach.title}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{ach.description}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8 }}>{new Date(ach.date).toLocaleDateString('en-BD', { year: 'numeric', month: 'long' })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── ANNOUNCEMENTS ─── */}
      {announcements.length > 0 && (
        <section className="section-sm" style={{ background: 'var(--bg-secondary)' }}>
          <div className="container">
            <div className="section-header">
              <h2>📢 Latest News</h2>
              <div className="accent-line" />
            </div>
            <div className="grid-3">
              {announcements.map(ann => (
                <div key={ann._id} className="card">
                  {ann.isPinned && <span className="badge badge-green" style={{ marginBottom: 12 }}>📌 Pinned</span>}
                  <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>{ann.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7 }}>{ann.content.slice(0, 150)}...</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 12 }}>{new Date(ann.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA ─── */}
      <section className="section cta-section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: 16 }}>
            Ready to <span className="text-green">Push Your Limits?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
            Join TeamBDC and be part of Bangladesh's most dedicated cycling community. Train structured, race hard, grow together.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">Join TeamBDC Today 🚴</Link>
        </div>
      </section>
    </div>
  );
}
