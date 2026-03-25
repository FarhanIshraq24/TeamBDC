import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', padding: '48px 0 24px' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <img src="/logo.jpg" alt="TeamBDC" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--accent-green)' }} />
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)' }}>TeamBDC</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7 }}>
              Team Bangladesh Cyclist — Pushing limits, representing Bangladesh, inspiring the next generation of cyclists.
            </p>
            <p style={{ marginTop: 12, color: 'var(--accent-green)', fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700 }}>
              SHUT UP LEGS 🚴
            </p>
          </div>

          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16, color: 'var(--text-primary)' }}>NAVIGATION</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['/', 'Home'], ['/team', 'Team'], ['/leaderboard', 'Leaderboard'], ['/gallery', 'Gallery']].map(([to, label]) => (
                <Link key={to} to={to} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = 'var(--accent-green)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >{label}</Link>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>CONNECT</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="https://www.strava.com/clubs/teambdc" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>🟠 Strava Club</a>
              <a href="https://facebook.com/BDCyclists" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>📘 Facebook</a>
              <a href="mailto:info@teambdc.com" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>📧 info@teambdc.com</a>
            </div>
          </div>

          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>JOIN US</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>Ready to push your limits? Become part of TeamBDC.</p>
            <Link to="/register" className="btn btn-primary btn-sm">Join the Team</Link>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>© 2026 TeamBDC. All rights reserved.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Part of the BDCyclists community 🇧🇩</p>
        </div>
      </div>
    </footer>
  );
}
