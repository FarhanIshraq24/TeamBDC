import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [orgMembers, setOrgMembers] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  // Org member form
  const [orgForm, setOrgForm] = useState({ name: '', role: 'advisor', title: '', bio: '', email: '', order: 0 });
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgPhoto, setOrgPhoto] = useState(null);
  // Achievement form
  const [achForm, setAchForm] = useState({ title: '', description: '', date: '', category: 'event', isFeatured: false });
  const [achLoading, setAchLoading] = useState(false);
  const orgFileRef = useRef();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [admins, users, org, ach] = await Promise.all([
        api.get('/users/pending?type=admin'),
        api.get('/users/all'),
        api.get('/org'),
        api.get('/achievements'),
      ]);
      setPendingAdmins(admins.data);
      setAllUsers(users.data);
      setOrgMembers(org.data);
      setAchievements(ach.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const approveAdmin = async (id, name) => {
    try {
      await api.patch(`/users/${id}/approve`);
      toast.success(`Admin ${name} approved! ✅`);
      loadAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const promoteToAdmin = async (id, name) => {
    if (!window.confirm(`Promote ${name} to Admin?`)) return;
    try {
      await api.patch(`/users/${id}/promote`);
      toast.success(`${name} promoted to Admin — pending your approval.`);
      loadAll();
    } catch { toast.error('Failed'); }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Permanently delete ${name}?`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success(`${name} deleted.`);
      loadAll();
    } catch { toast.error('Failed'); }
  };

  const addOrgMember = async (e) => {
    e.preventDefault();
    setOrgLoading(true);
    const form = new FormData();
    Object.entries(orgForm).forEach(([k, v]) => form.append(k, v));
    if (orgPhoto) form.append('photo', orgPhoto);
    try {
      await api.post('/org', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Org member added!');
      setOrgForm({ name: '', role: 'advisor', title: '', bio: '', email: '', order: 0 });
      setOrgPhoto(null);
      loadAll();
    } catch { toast.error('Failed'); }
    finally { setOrgLoading(false); }
  };

  const deleteOrgMember = async (id, name) => {
    if (!window.confirm(`Remove ${name} from org?`)) return;
    await api.delete(`/org/${id}`);
    toast.success('Removed');
    loadAll();
  };

  const addAchievement = async (e) => {
    e.preventDefault();
    setAchLoading(true);
    try {
      await api.post('/achievements', { ...achForm, riderIds: JSON.stringify([]) });
      toast.success('Achievement added!');
      setAchForm({ title: '', description: '', date: '', category: 'event', isFeatured: false });
      loadAll();
    } catch { toast.error('Failed'); }
    finally { setAchLoading(false); }
  };

  const tabs = [
    { key: 'overview', label: `Overview` },
    { key: 'admins', label: `Admin Approvals ${pendingAdmins.length > 0 ? `(${pendingAdmins.length})` : ''}` },
    { key: 'users', label: 'All Users' },
    { key: 'org', label: 'Org Members' },
    { key: 'achievements', label: 'Achievements' },
  ];

  const riders = allUsers.filter(u => u.role === 'rider');
  const admins = allUsers.filter(u => u.role === 'admin');

  return (
    <div className="page" style={{ paddingBottom: 60 }}>
      <div style={{ background: 'linear-gradient(135deg, #1a0a2e, var(--bg-primary))', padding: '40px 0 30px', borderBottom: '1px solid rgba(180,0,255,0.2)' }}>
        <div className="container">
          <span className="badge" style={{ background: 'rgba(180,0,255,0.15)', color: '#c060ff', borderColor: 'rgba(180,0,255,0.3)', marginBottom: 12 }}>Super Admin</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem' }}>Super Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Full system control — manage all users, org structure, and achievements.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', overflowX: 'auto' }}>
        <div className="container" style={{ display: 'flex', gap: 0 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              color: tab === t.key ? '#c060ff' : 'var(--text-secondary)',
              fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase',
              borderBottom: tab === t.key ? '2px solid #c060ff' : '2px solid transparent', transition: 'var(--transition)'
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="container" style={{ marginTop: 32 }}>
        {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
          <>
            {/* OVERVIEW */}
            {tab === 'overview' && (
              <div>
                <div className="grid-4" style={{ marginBottom: 32 }}>
                  {[
                    { label: 'Total Users', value: allUsers.length, color: '#c060ff' },
                    { label: 'Active Riders', value: riders.filter(r => r.isApproved).length, color: 'var(--accent-green)' },
                    { label: 'Admins', value: admins.filter(a => a.isApproved).length, color: '#00b0ff' },
                    { label: 'Org Members', value: orgMembers.length, color: 'var(--accent-gold)' },
                  ].map(s => (
                    <div key={s.label} className="stat-box">
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', color: s.color, fontWeight: 800 }}>{s.value}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
                {pendingAdmins.length > 0 && (
                  <div className="alert alert-error" style={{ marginBottom: 24 }}>
                    ⚠️ {pendingAdmins.length} admin account(s) pending your approval. <button className="btn btn-sm btn-red" style={{ marginLeft: 16 }} onClick={() => setTab('admins')}>Review Now</button>
                  </div>
                )}
                <div className="card">
                  <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>System Status</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <div>Pending riders: <strong style={{ color: 'var(--accent-red)' }}>{riders.filter(r => !r.isApproved).length}</strong></div>
                    <div>Pending admins: <strong style={{ color: 'var(--accent-red)' }}>{pendingAdmins.length}</strong></div>
                    <div>Achievements: <strong className="text-green">{achievements.length}</strong></div>
                    <div>Featured achievements: <strong className="text-green">{achievements.filter(a => a.isFeatured).length}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN APPROVALS */}
            {tab === 'admins' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Pending Admin Approvals</h2>
                {pendingAdmins.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
                    <p style={{ color: 'var(--text-secondary)' }}>No pending admin applications.</p>
                  </div>
                ) : pendingAdmins.map(admin => (
                  <div key={admin._id} className="card" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>{admin.name}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{admin.email} · {admin.city}</p>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => approveAdmin(admin._id, admin.name)}>✅ Approve Admin</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ALL USERS */}
            {tab === 'users' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>All Users ({allUsers.length})</h2>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table className="table">
                    <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Strava</th><th>Points</th><th>Actions</th></tr></thead>
                    <tbody>
                      {allUsers.map(u => (
                        <tr key={u._id}>
                          <td style={{ fontWeight: 600 }}>{u.name}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.email}</td>
                          <td><span className={`badge ${u.role === 'superadmin' ? '' : u.role === 'admin' ? 'badge-blue' : 'badge-green'}`} style={u.role === 'superadmin' ? { background: 'rgba(180,0,255,0.15)', color: '#c060ff', borderColor: 'rgba(180,0,255,0.3)' } : {}}>{u.role}</span></td>
                          <td><span className={`badge ${u.isApproved ? 'badge-green' : 'badge-red'}`}>{u.isApproved ? '✓ Approved' : '⏳ Pending'}</span></td>
                          <td>{u.stravaId ? <span className="badge badge-green">✓</span> : <span className="badge badge-red">✗</span>}</td>
                          <td style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-heading)' }}>{Math.round(u.totalPoints || 0)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {u.role === 'rider' && u.isApproved && (
                                <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }} onClick={() => promoteToAdmin(u._id, u.name)}>↑ Admin</button>
                              )}
                              {u.role !== 'superadmin' && (
                                <button className="btn btn-red btn-sm" style={{ fontSize: '0.75rem' }} onClick={() => deleteUser(u._id, u.name)}>🗑</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ORG MEMBERS */}
            {tab === 'org' && (
              <div className="grid-2" style={{ gap: 32 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Add Org Member</h2>
                  <div className="card">
                    <form onSubmit={addOrgMember}>
                      <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={orgForm.name} onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))} required /></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Role *</label>
                          <select className="form-input" value={orgForm.role} onChange={e => setOrgForm(f => ({ ...f, role: e.target.value }))}>
                            <option value="advisor">Advisor</option>
                            <option value="leader">Team Leader</option>
                            <option value="cofounder">Co-Founder</option>
                            <option value="admin">Operations</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Title</label>
                          <input className="form-input" placeholder="e.g. Chief Advisor" value={orgForm.title} onChange={e => setOrgForm(f => ({ ...f, title: e.target.value }))} />
                        </div>
                      </div>
                      <div className="form-group" style={{ marginTop: 16 }}><label className="form-label">Bio</label><textarea className="form-input" rows={3} value={orgForm.bio} onChange={e => setOrgForm(f => ({ ...f, bio: e.target.value }))} /></div>
                      <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={orgForm.email} onChange={e => setOrgForm(f => ({ ...f, email: e.target.value }))} /></div>
                      <div className="form-group">
                        <label className="form-label">Photo</label>
                        <input ref={orgFileRef} type="file" accept="image/*" className="form-input" onChange={e => setOrgPhoto(e.target.files[0])} />
                      </div>
                      <button className="btn btn-primary" type="submit" disabled={orgLoading}>{orgLoading ? 'Adding...' : '+ Add Member'}</button>
                    </form>
                  </div>
                </div>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Current Members ({orgMembers.length})</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {orgMembers.map(m => (
                      <div key={m._id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={m.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}&backgroundColor=0a0e1a&textColor=00e676`} alt={m.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{m.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.title || m.role}</div>
                        </div>
                        <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>{m.role}</span>
                        <button className="btn btn-red btn-sm" onClick={() => deleteOrgMember(m._id, m.name)}>🗑</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ACHIEVEMENTS */}
            {tab === 'achievements' && (
              <div className="grid-2" style={{ gap: 32 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Add Achievement</h2>
                  <div className="card">
                    <form onSubmit={addAchievement}>
                      <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={achForm.title} onChange={e => setAchForm(f => ({ ...f, title: e.target.value }))} required /></div>
                      <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={3} value={achForm.description} onChange={e => setAchForm(f => ({ ...f, description: e.target.value }))} /></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Date</label><input type="date" className="form-input" value={achForm.date} onChange={e => setAchForm(f => ({ ...f, date: e.target.value }))} /></div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Category</label>
                          <select className="form-input" value={achForm.category} onChange={e => setAchForm(f => ({ ...f, category: e.target.value }))}>
                            <option value="race">Race</option>
                            <option value="record">Record</option>
                            <option value="event">Event</option>
                            <option value="milestone">Milestone</option>
                          </select>
                        </div>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', cursor: 'pointer', margin: '16px 0' }}>
                        <input type="checkbox" checked={achForm.isFeatured} onChange={e => setAchForm(f => ({ ...f, isFeatured: e.target.checked }))} />
                        Feature on landing page
                      </label>
                      <button className="btn btn-primary" type="submit" disabled={achLoading}>{achLoading ? 'Adding...' : '+ Add Achievement'}</button>
                    </form>
                  </div>
                </div>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Achievements ({achievements.length})</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {achievements.map(a => (
                      <div key={a._id} className="card" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            {a.isFeatured && <span className="badge badge-gold" style={{ fontSize: '0.7rem', marginBottom: 4 }}>⭐ Featured</span>}
                            <div style={{ fontWeight: 600 }}>{a.title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.category} · {new Date(a.date).toLocaleDateString()}</div>
                          </div>
                          <button className="btn btn-red btn-sm" onClick={async () => { await api.delete(`/achievements/${a._id}`); toast.success('Deleted'); loadAll(); }}>🗑</button>
                        </div>
                      </div>
                    ))}
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
