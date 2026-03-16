import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAsset } from '../api/client';

export default function AssetFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', category: '', serialNumber: '', location: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = await createAsset(form);
      navigate(`/assets/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register asset.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/assets')}>← Back</button>
          <h1 className="page-title">Register New Asset</h1>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Asset Name *</label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. Dell Latitude 5540" required />
          </div>
          <div className="form-group">
            <label>Category *</label>
            <input value={form.category} onChange={set('category')} placeholder="e.g. Laptop, Monitor, Keyboard" required />
          </div>
          <div className="form-group">
            <label>Serial Number</label>
            <input value={form.serialNumber} onChange={set('serialNumber')} placeholder="e.g. SN-2024-001" />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input value={form.location} onChange={set('location')} placeholder="e.g. Floor 3, Room 302" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="Optional notes about this asset"
              style={{ resize: 'vertical' }}
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Registering…' : 'Register Asset'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/assets')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
