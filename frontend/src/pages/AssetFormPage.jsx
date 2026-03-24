import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAsset, uploadAssetImage } from '../api/client';

export default function AssetFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', category: '', serialNumber: '', location: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      // Step 1: create asset (text fields)
      const { data } = await createAsset(form);
      // Step 2: upload image if one was selected (optional)
      if (imageFile) {
        await uploadAssetImage(data.id, imageFile);
      }
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

          <div className="form-group">
            <label>Image <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional — can be added later)</span></label>
            {imagePreview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
                />
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{imageFile?.name}</p>
                  <button type="button" className="btn-secondary" onClick={handleRemoveImage}>Remove</button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn-secondary" style={{ marginTop: '0.25rem' }} onClick={() => fileInputRef.current?.click()}>
                Choose Image
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>JPG, PNG, WEBP — max 5 MB</p>
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