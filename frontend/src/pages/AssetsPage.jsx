import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssets, deleteAsset } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['', 'REGISTERED', 'ASSIGNED', 'IN_REPAIR', 'LOST', 'WRITTEN_OFF'];

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const load = () => {
    setLoading(true);
    getAssets({ search: search || undefined, status: status || undefined })
      .then(({ data }) => setAssets(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, status]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete asset "${name}"?`)) return;
    await deleteAsset(id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Assets</h1>
        {isAdmin && (
          <button className="btn-primary" onClick={() => navigate('/assets/new')}>
            + Register Asset
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <input
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ maxWidth: 200 }}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="spinner">Loading…</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Category</th>
                <th>Serial</th><th>Status</th><th>Assigned To</th><th>Department</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No assets found.</td></tr>
              ) : assets.map(a => (
                <tr key={a.id}>
                  <td style={{ color: 'var(--text-muted)' }}>#{a.id}</td>
                  <td style={{ fontWeight: 500 }}>{a.name}</td>
                  <td>{a.category}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{a.serialNumber || '—'}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>{a.activeAssignment?.employeeName || '—'}</td>
                  <td>{a.activeAssignment?.employeeDepartment || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-secondary" onClick={() => navigate(`/assets/${a.id}`)}>View</button>
                      {isAdmin && (
                        <button className="btn-danger" onClick={() => handleDelete(a.id, a.name)}>Delete</button>
                      )}
                    </div>
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
