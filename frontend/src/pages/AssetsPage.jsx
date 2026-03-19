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
  const [qrModal, setQrModal] = useState(null); // { name, src }
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isUser = user?.role === 'USER';

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

  const downloadQr = (name, src) => {
    const a = document.createElement('a');
    a.href = src;
    a.download = `QR-${name.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isUser ? 'My Assets' : 'Assets'}</h1>
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
                <th>Serial</th><th>Status</th><th>Assigned To</th><th>Department</th>
                <th>QR</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No assets found.</td></tr>
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
                    {a.qrCodeBase64 ? (
                      <img
                        src={a.qrCodeBase64}
                        alt="QR"
                        title="Click to enlarge"
                        style={{ width: 40, height: 40, cursor: 'pointer', display: 'block' }}
                        onClick={() => setQrModal({ name: a.name, src: a.qrCodeBase64 })}
                      />
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                    )}
                  </td>
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

      {/* QR enlarge modal */}
      {qrModal && (
        <div
          onClick={() => setQrModal(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--card-bg, #fff)', borderRadius: 12, padding: '1.5rem',
              textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', minWidth: 260,
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{qrModal.name}</p>
            <img src={qrModal.src} alt="QR Code" style={{ width: 220, height: 220 }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0 1rem' }}>
              Scan to open asset page
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => downloadQr(qrModal.name, qrModal.src)}>
                Download PNG
              </button>
              <button className="btn-secondary" onClick={() => setQrModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
