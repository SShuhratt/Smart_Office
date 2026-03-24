import { useEffect, useMemo, useState } from 'react';
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
  const [qrModal, setQrModal] = useState(null);
  const [imgModal, setImgModal] = useState(null);

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

  useEffect(() => {
    load();
  }, [search, status]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete asset "${name}"?`)) return;
    await deleteAsset(id);
    load();
  };

  const download = (name, src, prefix) => {
    const a = document.createElement('a');
    a.href = src;
    a.download = `${prefix}-${name.replace(/\s+/g, '_')}`;
    a.click();
  };

  const stats = useMemo(() => {
    return {
      total: assets.length,
      assigned: assets.filter((a) => a.status === 'ASSIGNED').length,
      registered: assets.filter((a) => a.status === 'REGISTERED').length,
      repair: assets.filter((a) => a.status === 'IN_REPAIR').length,
    };
  }, [assets]);

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1 className="page-title">{isUser ? 'My Assets' : 'Assets'}</h1>
          <p className="page-subtitle">
            Search, review, and manage asset records, assignments, and QR/image previews.
          </p>
        </div>

        {isAdmin && (
          <button className="btn-primary" onClick={() => navigate('/assets/new')}>
            + Register Asset
          </button>
        )}
      </div>

      <section className="stats-grid compact-stats">
        <MiniStat label="Visible Assets" value={stats.total} tone="tone-blue" />
        <MiniStat label="Assigned" value={stats.assigned} tone="tone-green" />
        <MiniStat label="Registered" value={stats.registered} tone="tone-blue" />
        <MiniStat label="In Repair" value={stats.repair} tone="tone-amber" />
      </section>

      <section className="toolbar-card">
        <div className="toolbar-grid">
          <input
            placeholder="Search by asset name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s || 'All statuses'}
              </option>
            ))}
          </select>
        </div>
      </section>

      {loading ? (
        <div className="state-box">Loading assets...</div>
      ) : (
        <div className="table-card">
          <div className="table-header-row">
            <div>
              <h2 className="table-title">Asset Registry</h2>
              <p className="table-subtitle">Complete list of tracked hardware and equipment</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Serial</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Department</th>
                  <th>Image</th>
                  <th>QR</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty-row">No assets found.</div>
                    </td>
                  </tr>
                ) : (
                  assets.map((a) => (
                    <tr key={a.id}>
                      <td className="muted-cell">#{a.id}</td>
                      <td className="strong-cell">{a.name}</td>
                      <td>{a.category}</td>
                      <td className="mono-cell">{a.serialNumber || '—'}</td>
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                      <td>{a.activeAssignment?.employeeName || '—'}</td>
                      <td>{a.activeAssignment?.employeeDepartment || '—'}</td>
                      <td>
                        {a.imageBase64 ? (
                          <button
                            className="thumbnail-button"
                            onClick={() => setImgModal({ name: a.name, src: a.imageBase64 })}
                            title="Preview image"
                          >
                            <img src={a.imageBase64} alt="Asset" className="thumbnail-image" />
                          </button>
                        ) : (
                          <span className="table-dash">—</span>
                        )}
                      </td>
                      <td>
                        {a.qrCodeBase64 ? (
                          <button
                            className="thumbnail-button"
                            onClick={() => setQrModal({ name: a.name, src: a.qrCodeBase64 })}
                            title="Preview QR"
                          >
                            <img src={a.qrCodeBase64} alt="QR" className="thumbnail-image qr-thumb" />
                          </button>
                        ) : (
                          <span className="table-dash">—</span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-secondary"
                            onClick={() => navigate(`/assets/${a.id}`)}
                          >
                            View
                          </button>
                          {isAdmin && (
                            <button
                              className="btn-danger"
                              onClick={() => handleDelete(a.id, a.name)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {imgModal && (
        <ModalShell title={imgModal.name} onClose={() => setImgModal(null)}>
          <img src={imgModal.src} alt="Asset" className="preview-image-large" />
          <div className="modal-actions">
            <button
              className="btn-primary"
              onClick={() => download(imgModal.name, imgModal.src, 'IMG')}
            >
              Download
            </button>
            <button className="btn-secondary" onClick={() => setImgModal(null)}>
              Close
            </button>
          </div>
        </ModalShell>
      )}

      {qrModal && (
        <ModalShell title={qrModal.name} onClose={() => setQrModal(null)}>
          <img src={qrModal.src} alt="QR Code" className="preview-qr-large" />
          <p className="modal-helper">Scan to view asset info</p>
          <div className="modal-actions">
            <button
              className="btn-primary"
              onClick={() => download(qrModal.name, qrModal.src, 'QR')}
            >
              Download PNG
            </button>
            <button className="btn-secondary" onClick={() => setQrModal(null)}>
              Close
            </button>
          </div>
        </ModalShell>
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

function ModalShell({ title, children, onClose }) {
  return (
    <div className="app-modal-backdrop" onClick={onClose}>
      <div className="app-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="app-modal-header">
          <h3>{title}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="app-modal-body">{children}</div>
      </div>
    </div>
  );
}