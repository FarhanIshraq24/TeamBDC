const PHOTOS = [
  { src: '/assets/team1.jpg', caption: 'TeamBDC at 400KM Ultra 2025 Start' },
  { src: '/assets/team2.jpg', caption: 'Full Team Gathering — BDCyclists Community' },
  { src: '/assets/team3.jpg', caption: 'Training Ride — Dhaka City' },
  { src: '/assets/team4.jpg', caption: 'Post-Ride Team Photo' },
];

export default function Gallery() {
  return (
    <div className="page">
      <div style={{ background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))', padding: '80px 0 60px', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="badge badge-green" style={{ marginBottom: 12 }}>📸 Gallery</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 6vw, 5rem)', marginBottom: 16 }}>Our Journey</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>From early morning training rides to international competitions — moments that define TeamBDC.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {PHOTOS.map((photo, i) => (
              <div key={i} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'zoom-in' }}
                onClick={() => window.open(photo.src, '_blank')}>
                <div style={{ position: 'relative', paddingBottom: i % 3 === 0 ? '70%' : '60%', overflow: 'hidden' }}>
                  <img src={photo.src} alt={photo.caption}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  />
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{photo.caption}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 48, textAlign: 'center', padding: '40px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', borderStyle: 'dashed' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📷</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 8 }}>More Photos Coming</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Follow us on social media for live event updates and ride photos.</p>
            <a href="https://facebook.com/BDCyclists" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>📘 Follow on Facebook</a>
          </div>
        </div>
      </section>
    </div>
  );
}
