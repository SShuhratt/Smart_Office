import { useEffect, useMemo, useState } from 'react';
import { getEmployees, createEmployee, deleteEmployee } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function EmployeesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    department: '',
    position: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getEmployees()
      .then(({ data }) => setEmployees(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createEmployee(form);
      setForm({
        fullName: '',
        email: '',
        department: '',
        position: '',
        username: '',
        password: '',
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create employee.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove employee "${name}"? Their login account will also be deleted.`)) return;
    await deleteEmployee(id);
    load();
  };

  const stats = useMemo(() => {
    const departments = new Set(employees.map((e) => e.department).filter(Boolean));
    const withAssets = employees.filter((e) => e.activeAssignments?.length > 0).length;

    return {
      total: employees.length,
      departments: departments.size,
      assigned: withAssets,
    };
  }, [employees]);

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">People</p>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">
            Maintain employee records and track which assets are currently assigned.
          </p>
        </div>

        {isAdmin && !showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Add Employee
          </button>
        )}
      </div>

      <section className="stats-grid compact-stats">
        <MiniStat label="Employees" value={stats.total} tone="tone-blue" />
        <MiniStat label="Departments" value={stats.departments} tone="tone-slate" />
        <MiniStat label="With Assets" value={stats.assigned} tone="tone-green" />
      </section>

      {showForm && (
        <div className="form-card">
          <div className="section-head">
            <div>
              <h2 className="section-title">New Employee</h2>
              <p className="section-subtitle">Create a staff account and employee profile</p>
            </div>
          </div>

          <form onSubmit={handleCreate}>
            <div className="form-grid form-grid-2">
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
                <label>Login Username</label>
                <input
                  value={form.username}
                  onChange={set('username')}
                  placeholder="Leave blank to use email"
                />
              </div>
              <div className="form-group">
                <label>Login Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Leave blank for default"
                />
              </div>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Add Employee'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="state-box">Loading employees...</div>
      ) : (
        <div className="table-card">
          <div className="table-header-row">
            <div>
              <h2 className="table-title">Employee Directory</h2>
              <p className="table-subtitle">People, departments, positions, and assigned assets</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Assets</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-row">No employees found.</div>
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id}>
                      <td className="strong-cell">{emp.fullName}</td>
                      <td>{emp.email}</td>
                      <td>{emp.department || '—'}</td>
                      <td>{emp.position || '—'}</td>
                      <td>
                        {emp.activeAssignments?.length > 0
                          ? emp.activeAssignments.map((a) => a.assetName).join(', ')
                          : '—'}
                      </td>
                      {isAdmin && (
                        <td>
                          <button
                            className="btn-danger"
                            onClick={() => handleDelete(emp.id, emp.fullName)}
                          >
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, tone }) {
  return (
    <div className={`mini-stat-card ${tone}`}>
      <div className="mini-stat-label">{label}</div>
      <div className="mini-stat-value">{value}</div>
    </div>
  );
}