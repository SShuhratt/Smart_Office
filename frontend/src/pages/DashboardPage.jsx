import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { getReportSummary } from '../api/client';

const STATUS_COLORS = {
  REGISTERED: '#3b82f6',
  ASSIGNED: '#22c55e',
  IN_REPAIR: '#f59e0b',
  LOST: '#ef4444',
  WRITTEN_OFF: '#94a3b8',
};

const STATUS_TONE_CLASS = {
  REGISTERED: 'tone-blue',
  ASSIGNED: 'tone-green',
  IN_REPAIR: 'tone-amber',
  LOST: 'tone-red',
  WRITTEN_OFF: 'tone-slate',
};

function formatLabel(value) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReportSummary()
      .then(({ data }) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="state-box">Loading dashboard...</div>;
  if (!summary) return <div className="state-box">No data available.</div>;

  const statusData = Object.entries(summary.byStatus || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const categoryData = Object.entries(summary.byCategory || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const topStatus =
    [...statusData].sort((a, b) => b.value - a.value)[0]?.name || 'REGISTERED';

  return (
    <div className="dashboard-page">
      <div className="page-header dashboard-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="page-title">Asset Dashboard</h1>
          <p className="page-subtitle">
            Monitor asset distribution, repair status, and category balance in one place.
          </p>
        </div>

        <div className="dashboard-header-chip">
          <span className="chip-dot" />
          Most common status: <strong>{formatLabel(topStatus)}</strong>
        </div>
      </div>

      <section className="stats-grid">
        <StatCard
          label="Total Assets"
          value={summary.total ?? 0}
          tone="tone-blue"
          helper="All tracked company assets"
        />

        {statusData.map(({ name, value }) => (
          <StatCard
            key={name}
            label={formatLabel(name)}
            value={value}
            tone={STATUS_TONE_CLASS[name] || 'tone-slate'}
            helper="Current status count"
          />
        ))}
      </section>

      <section className="dashboard-panels">
        <div className="panel-card panel-card-large">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Assets by Status</h2>
              <p className="panel-subtitle">Distribution across lifecycle states</p>
            </div>
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={108}
                  paddingAngle={3}
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${formatLabel(name)} ${Math.round(percent * 100)}%`
                  }
                >
                  {statusData.map(({ name }) => (
                    <Cell key={name} fill={STATUS_COLORS[name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, formatLabel(name)]}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel-card panel-card-large">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Assets by Category</h2>
              <p className="panel-subtitle">How inventory is spread across categories</p>
            </div>
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={categoryData} barCategoryGap={18}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, tone, helper }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        <span className="stat-card-pill" />
      </div>

      <div className="stat-card-value">{value}</div>
      <div className="stat-card-helper">{helper}</div>
    </div>
  );
}