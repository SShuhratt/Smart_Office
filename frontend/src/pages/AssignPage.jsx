import { useEffect, useMemo, useState } from 'react';
import { getAssets, getEmployees, assignAsset } from '../api/client';

export default function AssignPage() {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ assetId: '', department: '', employeeId: '', notes: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department).filter(Boolean));
    return Array.from(set).sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (!form.department) return employees;
    return employees.filter((e) => e.department === form.department);
  }, [form.department, employees]);

  useEffect(() => {
    getAssets({ status: 'REGISTERED' }).then(({ data }) => setAssets(data));
    getEmployees().then(({ data }) => setEmployees(data));
  }, []);

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === 'department') next.employeeId = '';
      if (field === 'employeeId') {
        const emp = employees.find((x) => String(x.id) === value);
        if (emp) next.department = emp.department || '';
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await assignAsset({
        assetId: Number(form.assetId),
        employeeId: Number(form.employeeId),
        notes: form.notes,
      });

      setSuccess('Asset successfully assigned.');
      setForm({ assetId: '', department: '', employeeId: '', notes: '' });
      getAssets({ status: 'REGISTERED' }).then(({ data }) => setAssets(data));
    } catch (err) {
      setError(err.response?.data?.error || 'Assignment failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1 className="page-title">Assign Asset</h1>
          <p className="page-subtitle">
            Allocate a registered asset to an employee with optional handover notes.
          </p>
        </div>
      </div>

      <div className="form-card form-card-narrow">
        <div className="section-head">
          <div>
            <h2 className="section-title">Assignment Form</h2>
            <p className="section-subtitle">Only assets in REGISTERED status can be assigned</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Asset *</label>
            <select value={form.assetId} onChange={set('assetId')} required>
              <option value="">— choose asset —</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} {a.serialNumber ? `(${a.serialNumber})` : ''}
                </option>
              ))}
            </select>
            {assets.length === 0 && <p className="helper-text">No unassigned assets available.</p>}
          </div>

          <div className="form-group">
            <label>Department</label>
            <select value={form.department} onChange={set('department')}>
              <option value="">— all departments —</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Assign To Employee *</label>
            <select value={form.employeeId} onChange={set('employeeId')} required>
              <option value="">— choose employee —</option>
              {filteredEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} — {emp.department || 'No dept'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              placeholder="Optional handover notes"
              rows={4}
            />
          </div>

          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Assigning...' : 'Assign Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}