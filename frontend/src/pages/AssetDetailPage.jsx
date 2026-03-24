import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignAsset, getAsset, getEmployees, updateAssetStatus, returnAsset, uploadAssetImage } from '../api/client';
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
    return ['REGISTERED', 'IN_REPAIR', 'LOST'].filter(s => s !== asset?.status);
  }, [isAdmin, asset?.status]);

  const load = () => {
    setLoading(true);
    getAsset(id).then(({ data }) => {
      setAsset(data);
      setNewStatus(data.status);
      if (data.activeAssignment) {
        setDepartment(data.activeAssignment.employeeDepartment || '');
        setEmployeeId(data.activeAssignment.employeeId || '');
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { getEmployees().then(({ data }) => setEmployees(data)); }, []);

  const departments = useMemo(() => {
    const set = new Set(employees.map(e => e.department).filter(Boolean));
    return Array.from(set).sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (!department) return employees;
    return employees.filter(e => e.department === department);
  }, [department, employees]);

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === asset.status) return;
    setUpdating(true);
    try {
      if (newStatus === 'ASSIGNED') {
        if (!employeeId) throw new Error('Select an employee to assign.');
        await assignAsset({ assetId: Number(id), employeeId: Number(employeeId), notes: reason });
      } else {
        await updateAssetStatus(id, { status: newStatus, reason });
      }
      setReason('');
      load();
    } catch (err) {
      console.error(err);
    } finally { setUpdating(false); }
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

  if (loading) return <div className="spinner">Loading…</div>;
  if (!asset)  return <div className="spinner">Asset not found.</div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/assets')}>← Back</button>
          <h1 className="page-title">{asset.name}</h1>
          <StatusBadge status={asset.status} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        <div className="card">
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>Asset Details</h2>
          <InfoRow label="Category"      value={asset.category} />
          <InfoRow label="Serial Number" value={asset.serialNumber || '—'} mono />
          <InfoRow label="Location"      value={asset.location     || '—'} />
          <InfoRow label="Description"   value={asset.description  || '—'} />
          <InfoRow label="Registered"    value={fmtDate(asset.createdAt)} />
          <InfoRow label="Last Updated"  value={fmtDate(asset.updatedAt)} />
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>Asset Image</h2>
          {asset.imageBase64 ? (
            <>
              <img
                src={asset.imageBase64}
                alt="Asset"
                title="Click to enlarge"
                style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 6, cursor: 'pointer' }}
                onClick={() => setImgModal(true)}
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <button className="btn-secondary" onClick={downloadImage}>Download</button>
                {canUploadImage && (
                  <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                    {uploading ? 'Uploading…' : 'Replace Image'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{
                width: '100%', height: 160, background: 'var(--bg)', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem',
              }}>
                No image uploaded
              </div>
              {canUploadImage && (
                <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
                  {uploading ? 'Uploading…' : 'Upload Image'}
                </button>
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
          {uploadError && (
            <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{uploadError}</p>
          )}
          {canUploadImage && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              JPG, PNG, WEBP — max 5 MB
            </p>
          )}
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>QR Code</h2>
          {asset.qrCodeBase64 ? (
            <img src={asset.qrCodeBase64} alt="QR Code" style={{ width: 180, height: 180 }} />
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No QR code generated.</p>
          )}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Scan to view asset info
          </p>
        </div>

        <div className="card">
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>Current Assignment</h2>
          {asset.activeAssignment ? (
            <>
              <InfoRow label="Assigned To" value={asset.activeAssignment.employeeName} />
              <InfoRow label="Email"       value={asset.activeAssignment.employeeEmail} />
              <InfoRow label="Since"       value={fmtDate(asset.activeAssignment.assignedAt)} />
              {asset.activeAssignment.notes && <InfoRow label="Notes" value={asset.activeAssignment.notes} />}
              {canManage && (
                <button className="btn-danger" style={{ marginTop: '0.75rem' }} onClick={handleReturn}>
                  Return Asset
                </button>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Not currently assigned.</p>
          )}
        </div>

        {(isAdmin || (isOwner && filteredStatuses.length > 0)) && (
          <div className="card">
            <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>Update Status</h2>
            <div className="form-group">
              <label>New Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {!isAdmin && <option value="">— select status —</option>}
                {filteredStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {isAdmin && newStatus === 'ASSIGNED' && (
              <>
                <div className="form-group">
                  <label>Department</label>
                  <select value={department} onChange={e => setDepartment(e.target.value)}>
                    <option value="">— select department —</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Employee</label>
                  <select value={employeeId} onChange={e => {
                    const eid = e.target.value;
                    setEmployeeId(eid);
                    const emp = employees.find(emp => String(emp.id) === eid);
                    if (emp) setDepartment(emp.department || '');
                  }}>
                    <option value="">— select employee —</option>
                    {filteredEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} — {emp.department || 'No dept'}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div className="form-group">
              <label>Reason (optional)</label>
              <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Sent to repair" />
            </div>
            <button
              className="btn-primary"
              onClick={handleStatusUpdate}
              disabled={updating || newStatus === asset.status || (newStatus === 'ASSIGNED' && !employeeId)}
            >
              {updating ? 'Updating…' : 'Update Status'}
            </button>
          </div>
        )}

        {!isUser && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>Status History</h2>
            {asset.statusHistory?.length > 0 ? (
              <table>
                <thead>
                  <tr><th>Date</th><th>From</th><th>To</th><th>Changed By</th><th>Reason</th></tr>
                </thead>
                <tbody>
                  {asset.statusHistory.map(h => (
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
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No status changes recorded.</p>
            )}
          </div>
        )}
      </div>

      {imgModal && asset.imageBase64 && (
        <div
          onClick={() => setImgModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)', borderRadius: 12, padding: '1.5rem',
              textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxWidth: '90vw',
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{asset.name}</p>
            <img
              src={asset.imageBase64}
              alt="Asset"
              style={{ maxWidth: '70vw', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
              <button className="btn-primary" onClick={downloadImage}>Download</button>
              <button className="btn-secondary" onClick={() => setImgModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{label}</span>
      <span style={{ fontFamily: mono ? 'monospace' : 'inherit', fontSize: '0.875rem', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}