import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getReportSummary } from '../api/client';

const STATUS_COLORS = {
  REGISTERED: '#3b82f6',
  ASSIGNED: '#22c55e',
  IN_REPAIR: '#f59e0b',
  LOST: '#ef4444',
  WRITTEN_OFF: '#9ca3af',
};

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReportSummary()
      .then(({ data }) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner">Loading dashboard…</div>;
  if (!summary) return <div className="spinner">No data available.</div>;

  const statusData = Object.entries(summary.byStatus || {}).map(([name, value]) => ({ name, value }));
  const categoryData = Object.entries(summary.byCategory || {}).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Assets" value={summary.total} color="#3b82f6" />
        {statusData.map(({ name, value }) => (
          <StatCard key={name} label={name.replace('_', ' ')} value={value} color={STATUS_COLORS[name]} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Status pie */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Assets by Status</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {statusData.map(({ name }) => (
                  <Cell key={name} fill={STATUS_COLORS[name] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category bar */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Assets by Category</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}
