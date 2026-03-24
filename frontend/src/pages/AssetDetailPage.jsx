import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  assignAsset,
  getAsset,
  getEmployees,
  updateAssetStatus,
  returnAsset,
  uploadAssetImage,
} from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const ALL_STATUSES = ['REGISTERED', 'ASSIGNED', 'IN_REPAIR', 'LOST', 'WRITTEN_OFF'];

export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';
  const isUser = user?.role === 'USER';

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [department, setDepartment] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [imgModal, setImgModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const isOwner = asset?.activeAssignment?.employeeEmail === user?.username;
  const canManage = isAdmin || isOwner;
  const canUploadImage = isAdmin || isOwner;

  const filteredStatuses = useMemo(() => {
    if (isAdmin) return ALL_STATUSES;
    return ['REGISTERED', 'IN_REPAIR', 'LOST'].filter((s) => s !== asset?.status);
  }, [isAdmin, asset?.status]);

  const load = () => {
    setLoading(true);
    getAsset(id)
      .then(({ data }) => {
        setAsset(data);
        setNewStatus(data.status);

        if (data.activeAssignment) {
          setDepartment(data.activeAssignment.employeeDepartment || '');
          setEmployeeId(String(data.activeAssignment.employeeId || ''));
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    getEmployees().then(({ data }) => setEmployees(data));
  }, []);

  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department).filter(Boolean));
    return Array.from(set).sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (!department) return employees;
    return employees.filter((e) => e.department === department);
  }, [department, employees]);

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === asset.status) return;

    setUpdating(true);
    try {
      if (newStatus === 'ASSIGNED') {
        if (!employeeId) {
          throw new Error('Select an employee to assign.');
        }

        await assignAsset({
          assetId: Number(id),
          employeeId: Number(employeeId),
          notes: reason,
        });
      } else {
        await updateAssetStatus(id, { status: newStatus, reason });
      }

      setReason('');
      load();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleReturn = async () => {
    if (!window.confirm('Return this asset?')) return;
    await returnAsset(asset.activeAssignment.id);
    load();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploading(true);

    try {
      await uploadAssetImage(id, file);
      load();
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadImage = () => {
    if (!asset?.imageBase64) return;
    const a = document.createElement('a');
    a.href = asset.imageBase64;
    a.download = `IMG-${asset.name.replace(/\s+/g, '_')}`;
    a.click();
  };

  if (loading) return <div className="state-box">Loading asset...</div>;
  if (!asset) return <div className="state-box">Asset not found.</div>;

  return (
    <div className="content-page">
      <div className="page-header">
        <div className="header-row">
          <button className="btn-secondary" onClick={() => navigate('/assets')}>
            ← Back
          </button>
          <div>
            <p className="eyebrow">Asset Details</p>
            <div className="header-row">
              <h1 className="page-title">{asset.name}</h1>
              <StatusBadge status={asset.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="details-grid">
        <div className="details-col">
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Asset Information</h2>
                <p className="panel-subtitle">Core metadata and registration details</p>
              </div>
            </div>

            <InfoRow label="Category" value={asset.category} />
            <InfoRow label="Serial Number" value={asset.serialNumber || '—'} mono />
            <InfoRow label="Location" value={asset.location || '—'} />
            <InfoRow label="Description" value={asset.description || '—'} />
            <InfoRow label="Registered" value={fmtDate(asset.createdAt)} />
            <InfoRow label="Last Updated" value={fmtDate(asset.updatedAt)} />
          </div>

          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Current Assignment</h2>
                <p className="panel-subtitle">Who currently has this asset</p>
              </div>
            </div>

            {asset.activeAssignment ? (
              <>
                <InfoRow label="Assigned To" value={asset.activeAssignment.employeeName} />
                <InfoRow label="Email" value={asset.activeAssignment.employeeEmail} />
                <InfoRow label="Department" value={asset.activeAssignment.employeeDepartment || '—'} />
                <InfoRow label="Since" value={fmtDate(asset.activeAssignment.assignedAt)} />
                {asset.activeAssignment.notes && (
                  <InfoRow label="Notes" value={asset.activeAssignment.notes} />
                )}

                {canManage && (
                  <div className="form-actions" style={{ marginTop: 16 }}>
                    <button className="btn-danger" onClick={handleReturn}>
                      Return Asset
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="empty-text">Not currently assigned.</p>
            )}
          </div>

          {(isAdmin || (isOwner && filteredStatuses.length > 0)) && (
            <div className="panel-card">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Update Status</h2>
                  <p className="panel-subtitle">Change status or assign this asset</p>
                </div>
              </div>

              <div className="form-group">
                <label>New Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  {!isAdmin && <option value="">— select status —</option>}
                  {filteredStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {isAdmin && newStatus === 'ASSIGNED' && (
                <>
                  <div className="form-group">
                    <label>Department</label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                      <option value="">— select department —</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Employee</label>
                    <select
                      value={employeeId}
                      onChange={(e) => {
                        const eid = e.target.value;
                        setEmployeeId(eid);
                        const emp = employees.find((item) => String(item.id) === eid);
                        if (emp) setDepartment(emp.department || '');
                      }}
                    >
                      <option value="">— select employee —</option>
                      {filteredEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} — {emp.department || 'No dept'}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Reason</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Optional reason"
                />
              </div>

              <div className="form-actions">
                <button
                  className="btn-primary"
                  onClick={handleStatusUpdate}
                  disabled={
                    updating ||
                    newStatus === asset.status ||
                    (newStatus === 'ASSIGNED' && !employeeId)
                  }
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="details-col">
          <div className="panel-card center">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Asset Image</h2>
                <p className="panel-subtitle">Preview and manage uploaded image</p>
              </div>
            </div>

            {asset.imageBase64 ? (
              <>
                <img
                  src={asset.imageBase64}
                  alt="Asset"
                  className="preview-image-large"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setImgModal(true)}
                />

                <div className="form-actions" style={{ justifyContent: 'center', marginTop: 16 }}>
                  <button className="btn-secondary" onClick={downloadImage}>
                    Download
                  </button>
                  {canUploadImage && (
                    <button
                      className="btn-secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading ? 'Uploading...' : 'Replace Image'}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="empty-box">No image uploaded</div>
                {canUploadImage && (
                  <div className="form-actions" style={{ justifyContent: 'center', marginTop: 16 }}>
                    <button
                      className="btn-primary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                  </div>
                )}
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />

            {uploadError && <p className="error-msg">{uploadError}</p>}
          </div>

          <div className="panel-card center">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">QR Code</h2>
                <p className="panel-subtitle">Scan to view asset info</p>
              </div>
            </div>

            {asset.qrCodeBase64 ? (
              <img src={asset.qrCodeBase64} alt="QR Code" className="preview-qr-large" />
            ) : (
              <div className="empty-box">No QR code generated</div>
            )}
          </div>
        </div>

        {!isUser && (
          <div className="panel-card" style={{ gridColumn: '1 / -1' }}>
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Status History</h2>
                <p className="panel-subtitle">Timeline of asset status changes</p>
              </div>
            </div>

            {asset.statusHistory?.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Changed By</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asset.statusHistory.map((h) => (
                      <tr key={h.id}>
                        <td>{fmtDate(h.changedAt)}</td>
                        <td>{h.previousStatus ? <StatusBadge status={h.previousStatus} /> : '—'}</td>
                        <td><StatusBadge status={h.newStatus} /></td>
                        <td>{h.changedBy}</td>
                        <td>{h.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-text">No status changes recorded.</p>
            )}
          </div>
        )}
      </div>

      {imgModal && asset.imageBase64 && (
        <div className="app-modal-backdrop" onClick={() => setImgModal(false)}>
          <div className="app-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="app-modal-header">
              <h3>{asset.name}</h3>
              <button className="modal-close-btn" onClick={() => setImgModal(false)}>
                ×
              </button>
            </div>

            <div className="app-modal-body">
              <img
                src={asset.imageBase64}
                alt="Asset"
                className="preview-image-large"
              />

              <div className="modal-actions">
                <button className="btn-primary" onClick={downloadImage}>
                  Download
                </button>
                <button className="btn-secondary" onClick={() => setImgModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="info-row">
      <span className="info-row-label">{label}</span>
      <span className={`info-row-value ${mono ? 'mono-cell' : ''}`}>{value}</span>
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}