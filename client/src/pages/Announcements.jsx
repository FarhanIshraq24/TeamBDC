import { useState, useEffect } from 'react';
import api from '../utils/api';
import './Announcements.css';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/announcements')
      .then(r => {
        setAnnouncements(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="page announcements-page">
      <section className="sectionHero">
        <div className="container">
          <span className="badge badge-green">📢 Updates</span>
          <h1>Team Announcements</h1>
          <p className="subtitle">Stay updated with the latest news, events, and results from TeamBDC.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading ? (
            <div className="loading-spinner">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="empty-state">No announcements yet.</div>
          ) : (
            <div className="announcements-grid">
              {announcements.map(ann => (
                <div key={ann._id} className={`announcement-card ${ann.isPinned ? 'pinned' : ''}`} onClick={() => setSelected(ann)}>
                  {ann.isPinned && <div className="pinned-badge">📌 Pinned</div>}
                  <div className="ann-date">{new Date(ann.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <h3 className="ann-title">{ann.title}</h3>
                  <p className="ann-snippet">{ann.content.slice(0, 150)}{ann.content.length > 150 ? '...' : ''}</p>
                  <button className="read-more">Read Full Flyer →</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── FLYER MODAL ─── */}
      {selected && (
        <div className="flyer-overlay" onClick={() => setSelected(null)}>
          <div className="flyer-content animate-pop" onClick={e => e.stopPropagation()}>
            <button className="close-flyer" onClick={() => setSelected(null)}>×</button>
            <div className="flyer-header">
              <img src="/logo.jpg" alt="TeamBDC" className="flyer-logo" />
              <div className="flyer-brand">
                <span className="flyer-team">TEAMBDC</span>
                <span className="flyer-slogan">SHUT UP LEGS</span>
              </div>
            </div>
            <div className="flyer-body">
              <span className="flyer-date">{new Date(selected.createdAt).toLocaleDateString()}</span>
              <h2 className="flyer-title">{selected.title}</h2>
              <div className="flyer-divider" />
              <div className="flyer-text">
                {selected.content.split('\n').map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </div>
            <div className="flyer-footer">
              <p>Official Team Announcement</p>
              <div className="flyer-dots"><span /><span /><span /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
