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
      .then(({ data }) => {
        setLogs(data.content);
        setTotalPages(data.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">History</p>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">
            Review system events, asset operations, and user actions across the platform.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="state-box">Loading audit log...</div>
      ) : (
        <>
          <div className="table-card">
            <div className="table-header-row">
              <div>
                <h2 className="table-title">Activity Stream</h2>
                <p className="table-subtitle">Chronological record of changes and operations</p>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                    <th>Performed By</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-row">No audit records.</div>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td className="muted-cell">{new Date(log.performedAt).toLocaleString()}</td>
                        <td>
                          <span className="audit-action-pill">{log.action}</span>
                        </td>
                        <td>
                          {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
                        </td>
                        <td className="details-cell">{log.details}</td>
                        <td className="strong-cell">{log.performedBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pagination-bar">
            <button className="btn-secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </button>
            <span className="pagination-text">
              Page {page + 1} of {totalPages}
            </span>
            <button
              className="btn-secondary"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}