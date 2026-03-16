import { useEffect, useState } from 'react';
import { getAuditLog } from '../api/client';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAuditLog(page)
      .then(({ data }) => { setLogs(data.content); setTotalPages(data.totalPages); })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Audit Log</h1>
      </div>

      {loading ? <div className="spinner">Loading…</div> : (
        <>
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr><th>Time</th><th>Action</th><th>Entity</th><th>Details</th><th>Performed By</th></tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No audit records.</td></tr>
                ) : logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(log.performedAt).toLocaleString()}
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'monospace', fontSize: '0.8rem', background: '#f3f4f6',
                        padding: '0.15rem 0.4rem', borderRadius: 4,
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
                    </td>
                    <td style={{ fontSize: '0.875rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details}
                    </td>
                    <td style={{ fontWeight: 500, fontSize: '0.875rem' }}>{log.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.25rem' }}>
            <button className="btn-secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Page {page + 1} of {totalPages}
            </span>
            <button className="btn-secondary" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </>
      )}
    </div>
  );
}
