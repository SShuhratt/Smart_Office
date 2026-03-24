import { useEffect, useState } from 'react';
import { getSystemUsers, createSystemUser, deleteSystemUser } from '../api/client';

export default function AuditorsPage() {
  const [auditors, setAuditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'AUDITOR', fullName: '', email: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getSystemUsers()
      .then(({ data }) => setAuditors(data.filter(u => u.role === 'AUDITOR')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createSystemUser({ ...form, role: 'AUDITOR' });
      setForm({ username: '', password: '', role: 'AUDITOR', fullName: '', email: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create auditor.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete auditor "${username}"?`)) return;
    await deleteSystemUser(id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Auditors</h1>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Auditor</button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ maxWidth: 560, marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>New Auditor</h2>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Full Name</label>
                <input value={form.fullName} onChange={set('fullName')} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={set('email')} />
              </div>
              <div className="form-group">
                <label>Username *</label>
                <input value={form.username} onChange={set('username')} required />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input type="password" value={form.password} onChange={set('password')} required />
              </div>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Auditor'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="spinner">Loading…</div> : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr><th>Username</th><th>Full Name</th><th>Email</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {auditors.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No auditors found.</td></tr>
              ) : auditors.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500, fontFamily: 'monospace' }}>{u.username}</td>
                  <td>{u.fullName || '—'}</td>
                  <td>{u.email || '—'}</td>
                  <td>
                    <button className="btn-danger" onClick={() => handleDelete(u.id, u.username)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}