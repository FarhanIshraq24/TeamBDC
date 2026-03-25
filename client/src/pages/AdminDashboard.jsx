import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [pendingRiders, setPendingRiders] = useState([]);
  const [allRiders, setAllRiders] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [orgMembers, setOrgMembers] = useState([]);
  const [tab, setTab] = useState('approvals');
  const [loading, setLoading] = useState(true);
  // Screenshot OCR
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [parsedOCR, setParsedOCR] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [matchedEntries, setMatchedEntries] = useState([]);
  const [applyLoading, setApplyLoading] = useState(false);
  // Announcement form
  const [annForm, setAnnForm] = useState({ title: '', content: '', isPinned: false });
  const [annLoading, setAnnLoading] = useState(false);
  // Points recalc
  const [recalcLoading, setRecalcLoading] = useState(false);
  const fileRef = useRef();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pend, riders, anns, org] = await Promise.all([
        api.get('/users/pending'),
        api.get('/users'),
        api.get('/announcements'),
        api.get('/org'),
      ]);
      setPendingRiders(pend.data);
      setAllRiders(riders.data);
      setAnnouncements(anns.data);
      setOrgMembers(org.data);
    } catch (err) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const approveUser = async (id, name) => {
    try {
      await api.patch(`/users/${id}/approve`);
      toast.success(`${name} approved! ✅`);
      loadAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const rejectUser = async (id, name) => {
    if (!window.confirm(`Reject and remove ${name}?`)) return;
    try {
      await api.patch(`/users/${id}/reject`);
      toast.success(`${name} rejected.`);
      loadAll();
    } catch (err) { toast.error('Failed'); }
  };

  const uploadScreenshot = async () => {
    if (!screenshotFile) return;
    setOcrLoading(true);
    setParsedOCR(null);
    setMatchedEntries([]);
    const form = new FormData();
    form.append('screenshot', screenshotFile);
    try {
      const { data } = await api.post('/leaderboard/screenshot', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setParsedOCR(data);
      // Auto-match parsed names to riders
      const matched = (data.parsed || []).map(entry => {
        const riderMatch = allRiders.find(r =>
          r.name.toLowerCase().includes(entry.name.toLowerCase().split(' ')[0]) ||
          entry.name.toLowerCase().includes(r.name.toLowerCase().split(' ')[0])
        );
        return { ...entry, userId: riderMatch?._id || '', riderName: riderMatch?.name || '' };
      });
      setMatchedEntries(matched);
    } catch (err) { toast.error('OCR processing failed: ' + (err.response?.data?.message || err.message)); }
    finally { setOcrLoading(false); }
  };

  const applyOCR = async () => {
    const entries = matchedEntries.filter(e => e.userId);
    if (!entries.length) return toast.error('No matched riders to update');
    setApplyLoading(true);
    try {
      await api.post('/leaderboard/screenshot/apply', { entries });
      toast.success(`Updated ${entries.length} riders! Points recalculated. 🏆`);
      setParsedOCR(null); setMatchedEntries([]);
    } catch (err) { toast.error('Apply failed'); }
    finally { setApplyLoading(false); }
  };

  const postAnnouncement = async (e) => {
    e.preventDefault();
    setAnnLoading(true);
    try {
      await api.post('/announcements', annForm);
      toast.success('Announcement posted!');
      setAnnForm({ title: '', content: '', isPinned: false });
      loadAll();
    } catch { toast.error('Failed to post'); }
    finally { setAnnLoading(false); }
  };

  const deleteAnn = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    await api.delete(`/announcements/${id}`);
    toast.success('Deleted');
    loadAll();
  };

  const recalcPoints = async () => {
    setRecalcLoading(true);
    try {
      await api.post('/points/recalculate');
      toast.success('Points recalculated for all riders! 🏆');
    } catch { toast.error('Recalculation failed'); }
    finally { setRecalcLoading(false); }
  };

  const tabs = [
    { key: 'approvals', label: `Approvals ${pendingRiders.length > 0 ? `(${pendingRiders.length})` : ''}` },
    { key: 'screenshot', label: '📸 Screenshot OCR' },
    { key: 'riders', label: 'Riders' },
    { key: 'announcements', label: 'Announcements' },
    { key: 'tools', label: '⚙️ Tools' },
  ];

  return (
    <div className="page" style={{ paddingBottom: 60 }}>
      <div style={{ background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))', padding: '40px 0 30px', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <span className="badge badge-blue" style={{ marginBottom: 12 }}>Admin Panel</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Manage riders, approvals, announcements and leaderboard updates.</p>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            <div className="stat-box" style={{ padding: '12px 20px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--accent-red)' }}>{pendingRiders.length}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: 8 }}>Pending approvals</span>
            </div>
            <div className="stat-box" style={{ padding: '12px 20px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--accent-green)' }}>{allRiders.length}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: 8 }}>Active riders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', overflowX: 'auto' }}>
        <div className="container" style={{ display: 'flex', gap: 0 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              color: tab === t.key ? 'var(--accent-green)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase',
              borderBottom: tab === t.key ? '2px solid var(--accent-green)' : '2px solid transparent',
              transition: 'var(--transition)'
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="container" style={{ marginTop: 32 }}>
        {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
          <>
            {/* APPROVALS */}
            {tab === 'approvals' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Pending Rider Applications</h2>
                {pendingRiders.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
                    <p style={{ color: 'var(--text-secondary)' }}>No pending applications. You're all caught up!</p>
                  </div>
                ) : (
                  <div className="grid-2">
                    {pendingRiders.map(rider => (
                      <div key={rider._id} className="card">
                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                          <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rider.name)}&backgroundColor=0a0e1a&textColor=00e676`}
                            alt={rider.name}
                            style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0, border: '2px solid var(--border)' }}
                          />
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: 4 }}>{rider.name}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>📧 {rider.email}</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>📍 {rider.city || 'Not specified'} · 📞 {rider.phone || 'No phone'}</p>
                            {rider.bio && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 6, lineHeight: 1.6 }}>{rider.bio}</p>}
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 6 }}>Applied {new Date(rider.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => approveUser(rider._id, rider.name)}>✅ Approve</button>
                          <button className="btn btn-red btn-sm" onClick={() => rejectUser(rider._id, rider.name)}>❌ Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SCREENSHOT OCR */}
            {tab === 'screenshot' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 8 }}>Strava Screenshot Leaderboard Parser</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Upload a Strava segment or club leaderboard screenshot to automatically update rider distances and recalculate points.</p>
                <div className="card" style={{ marginBottom: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Upload Screenshot</h3>
                  <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '40px', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)' }}
                    onClick={() => fileRef.current.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); setScreenshotFile(e.dataTransfer.files[0]); }}>
                    {screenshotFile ? (
                      <div>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>📸</div>
                        <p style={{ color: 'var(--accent-green)' }}>{screenshotFile.name}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({(screenshotFile.size / 1024).toFixed(0)} KB)</p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '3rem', marginBottom: 8 }}>📷</div>
                        <p style={{ color: 'var(--text-secondary)' }}>Click to upload or drag & drop</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>Strava leaderboard screenshot (JPG, PNG)</p>
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setScreenshotFile(e.target.files[0])} />
                  </div>
                  {screenshotFile && (
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={uploadScreenshot} disabled={ocrLoading}>
                      {ocrLoading ? '🔍 Processing OCR...' : '🔍 Parse Screenshot'}
                    </button>
                  )}
                </div>

                {parsedOCR && (
                  <div className="card">
                    <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 8 }}>OCR Results — Match Riders</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>Match parsed names to your riders. Only matched entries will be applied.</p>
                    {matchedEntries.length === 0 ? (
                      <div className="alert alert-error">No distances could be parsed from this screenshot. Try a clearer image.</div>
                    ) : (
                      <div>
                        {matchedEntries.map((entry, i) => (
                          <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                            <div style={{ flex: '0 0 200px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                              <span className="text-green">{entry.name}</span> — <strong>{entry.distance} km</strong>
                              {entry.elevation > 0 && <span>, {entry.elevation} m</span>}
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <select className="form-input" style={{ padding: '8px 12px', flex: 1 }} value={entry.userId}
                                onChange={e => setMatchedEntries(prev => prev.map((m, j) => j === i ? { ...m, userId: e.target.value, riderName: allRiders.find(r => r._id === e.target.value)?.name || '' } : m))}>
                                <option value="">-- Select rider --</option>
                                {allRiders.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                              </select>
                              {entry.userId && <span className="badge badge-green">✓ Matched</span>}
                            </div>
                          </div>
                        ))}
                        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                          <button className="btn btn-primary" onClick={applyOCR} disabled={applyLoading || !matchedEntries.some(e => e.userId)}>
                            {applyLoading ? 'Applying...' : `✅ Apply ${matchedEntries.filter(e => e.userId).length} Updates`}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setParsedOCR(null); setMatchedEntries([]); setScreenshotFile(null); }}>Reset</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* RIDERS */}
            {tab === 'riders' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Active Riders ({allRiders.length})</h2>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table className="table">
                    <thead><tr><th>Rider</th><th>Email</th><th>City</th><th>Strava</th><th>Distance</th><th>Points</th><th>Joined</th></tr></thead>
                    <tbody>
                      {allRiders.map(r => (
                        <tr key={r._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <img src={r.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.name)}&backgroundColor=00e676&textColor=000000`} alt={r.name} style={{ width: 32, height: 32, borderRadius: '50%' }} />
                              <span style={{ fontWeight: 600 }}>{r.name}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{r.email}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{r.city || 'Dhaka'}</td>
                          <td>{r.stravaId ? <span className="badge badge-green">✓ Connected</span> : <span className="badge badge-red">✗</span>}</td>
                          <td className="text-green">{r.stats?.totalDistance?.toFixed(0) || 0} km</td>
                          <td style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-gold)' }}>{Math.round(r.totalPoints || 0)}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ANNOUNCEMENTS */}
            {tab === 'announcements' && (
              <div>
                <div className="grid-2" style={{ gap: 32 }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Post Announcement</h2>
                    <div className="card">
                      <form onSubmit={postAnnouncement}>
                        <div className="form-group">
                          <label className="form-label">Title</label>
                          <input className="form-input" placeholder="Announcement title..." value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Content</label>
                          <textarea className="form-input" rows={5} placeholder="What's happening?" value={annForm.content} onChange={e => setAnnForm(f => ({ ...f, content: e.target.value }))} required />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 16 }}>
                          <input type="checkbox" checked={annForm.isPinned} onChange={e => setAnnForm(f => ({ ...f, isPinned: e.target.checked }))} />
                          Pin this announcement
                        </label>
                        <button className="btn btn-primary" type="submit" disabled={annLoading}>{annLoading ? 'Posting...' : '📢 Post Announcement'}</button>
                      </form>
                    </div>
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Existing ({announcements.length})</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {announcements.map(ann => (
                        <div key={ann._id} className="card" style={{ padding: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div>
                              {ann.isPinned && <span className="badge badge-green" style={{ fontSize: '0.7rem', marginBottom: 4 }}>📌 Pinned</span>}
                              <h4 style={{ fontSize: '1rem' }}>{ann.title}</h4>
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>{new Date(ann.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button className="btn btn-red btn-sm" onClick={() => deleteAnn(ann._id)}>🗑</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TOOLS */}
            {tab === 'tools' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Admin Tools</h2>
                <div className="grid-2">
                  <div className="card">
                    <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 8 }}>⚡ Recalculate All Points</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>Recalculates points for ALL riders for the current month based on their Strava data. Runs automatically on the 1st of each month.</p>
                    <button className="btn btn-outline" onClick={recalcPoints} disabled={recalcLoading}>{recalcLoading ? 'Recalculating...' : '⚡ Recalculate Now'}</button>
                  </div>
                  <div className="card">
                    <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 8 }}>📊 System Info</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <div>Active Riders: <strong className="text-green">{allRiders.length}</strong></div>
                      <div>Pending Approvals: <strong style={{ color: 'var(--accent-red)' }}>{pendingRiders.length}</strong></div>
                      <div>Org Members: <strong className="text-green">{orgMembers.length}</strong></div>
                      <div>Announcements: <strong className="text-green">{announcements.length}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
