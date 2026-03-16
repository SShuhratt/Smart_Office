import { useEffect, useMemo, useState } from 'react';
import { getAssets, getEmployees, assignAsset } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function AssignPage() {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ assetId: '', department: '', employeeId: '', notes: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const departments = useMemo(() => {
    const set = new Set(employees.map(e => e.department).filter(Boolean));
    return Array.from(set).sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (!form.department) return employees;
    return employees.filter(e => e.department === form.department);
  }, [form.department, employees]);

  useEffect(() => {
    getAssets({ status: 'REGISTERED' }).then(({ data }) => setAssets(data));
    getEmployees().then(({ data }) => setEmployees(data));
  }, []);

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm(f => {
      const next = { ...f, [field]: value };
      // keep department/employee in sync
      if (field === 'department') {
        next.employeeId = '';
      }
      if (field === 'employeeId') {
        const emp = employees.find(emp => String(emp.id) === value);
        if (emp) next.department = emp.department || '';
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setSaving(true);
    try {
      await assignAsset({ assetId: Number(form.assetId), employeeId: Number(form.employeeId), notes: form.notes });
      setSuccess('Asset successfully assigned!');
      setForm({ assetId: '', department: '', employeeId: '', notes: '' });
      getAssets({ status: 'REGISTERED' }).then(({ data }) => setAssets(data));
    } catch (err) {
      setError(err.response?.data?.error || 'Assignment failed.');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Assign Asset</h1>
      </div>

      <div className="card" style={{ maxWidth: 520 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Asset (REGISTERED only) *</label>
            <select value={form.assetId} onChange={set('assetId')} required>
              <option value="">— choose asset —</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>{a.name} {a.serialNumber ? `(${a.serialNumber})` : ''}</option>
              ))}
            </select>
            {assets.length === 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                No unassigned assets available.
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Department</label>
            <select value={form.department} onChange={set('department')}>
              <option value="">— all departments —</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Assign To Employee *</label>
            <select value={form.employeeId} onChange={set('employeeId')} required>
              <option value="">— choose employee —</option>
              {filteredEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.fullName} — {emp.department || 'No dept'}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <input value={form.notes} onChange={set('notes')} placeholder="Optional handover notes" />
          </div>

          {error && <p className="error-msg">{error}</p>}
          {success && <p style={{ color: 'var(--success)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{success}</p>}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Assigning…' : 'Assign Asset'}
          </button>
        </form>
      </div>
    </div>
  );
}
