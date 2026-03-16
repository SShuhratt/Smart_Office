import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { qrLookup } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function QrScanPage() {
  const { assetId } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    qrLookup(assetId)
      .then(({ data }) => setAsset(data))
      .catch(() => setError('Asset not found.'))
      .finally(() => setLoading(false));
  }, [assetId]);

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem' }}>🏦</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>SBAMS Asset Info</h1>
        </div>

        {loading && <div className="spinner">Loading…</div>}
        {error && <div className="card" style={{ textAlign: 'center', color: 'var(--danger)' }}>{error}</div>}

        {asset && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '1.25rem' }}>{asset.name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{asset.category}</p>
              </div>
              <StatusBadge status={asset.status} />
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              {asset.serialNumber && <Row label="Serial" value={asset.serialNumber} mono />}
              {asset.location && <Row label="Location" value={asset.location} />}
              {asset.activeAssignment ? (
                <Row label="Assigned To" value={`${asset.activeAssignment.employeeName} (${asset.activeAssignment.employeeEmail})`} />
              ) : (
                <Row label="Assignment" value="Unassigned" />
              )}
              <Row label="Asset ID" value={`#${asset.id}`} />
            </div>

            {asset.description && (
              <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {asset.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.875rem', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: mono ? 'monospace' : 'inherit', fontWeight: 500 }}>{value}</span>
    </div>
  );
}
