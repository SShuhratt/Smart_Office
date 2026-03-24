import { useEffect, useState } from 'react';
import { getEmployees, createEmployee, deleteEmployee } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function EmployeesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', department: '', position: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getEmployees().then(({ data }) => setEmployees(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createEmployee(form);
      setForm({ fullName: '', email: '', department: '', position: '', username: '', password: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create employee.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove employee "${name}"? Their login account will also be deleted.`)) return;
    await deleteEmployee(id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Employees</h1>
        {isAdmin && !showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Employee</button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ maxWidth: 560, marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>New Employee</h2>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input value={form.fullName} onChange={set('fullName')} required />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={form.email} onChange={set('email')} required />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input value={form.department} onChange={set('department')} />
              </div>
              <div className="form-group">
                <label>Position</label>
                <input value={form.position} onChange={set('position')} />
              </div>
              <div className="form-group">
                <label>Login Username <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(defaults to email)</span></label>
                <input value={form.username} onChange={set('username')} placeholder="leave blank to use email" />
              </div>
              <div className="form-group">
                <label>Login Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(defaults to user123)</span></label>
                <input type="password" value={form.password} onChange={set('password')} placeholder="leave blank for default" />
              </div>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Employee'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="spinner">Loading…</div> : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Department</th><th>Position</th><th>Assets</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No employees found.</td></tr>
              ) : employees.map(emp => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: 500 }}>{emp.fullName}</td>
                  <td>{emp.email}</td>
                  <td>{emp.department || '—'}</td>
                  <td>{emp.position || '—'}</td>
                  <td>{emp.activeAssignments?.length > 0 ? emp.activeAssignments.map(a => a.assetName).join(', ') : '—'}</td>
                  {isAdmin && (
                    <td>
                      <button className="btn-danger" onClick={() => handleDelete(emp.id, emp.fullName)}>Remove</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}