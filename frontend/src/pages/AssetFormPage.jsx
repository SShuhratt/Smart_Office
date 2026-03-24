import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAsset, uploadAssetImage } from '../api/client';

export default function AssetFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    category: '',
    serialNumber: '',
    location: '',
    description: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

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
      const { data } = await createAsset(form);

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
    <div className="content-page">
      <div className="page-header">
        <div className="header-row">
          <button className="btn-secondary" onClick={() => navigate('/assets')}>
            ← Back
          </button>
          <div>
            <p className="eyebrow">Inventory</p>
            <h1 className="page-title">Register Asset</h1>
            <p className="page-subtitle">
              Add a new company asset with optional image upload.
            </p>
          </div>
        </div>
      </div>

      <div className="form-card form-card-wide">
        <div className="section-head">
          <div>
            <h2 className="section-title">Asset Information</h2>
            <p className="section-subtitle">
              Fill in the basic details to create a new asset record
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label>Asset Name *</label>
              <input
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Dell Latitude 5540"
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <input
                value={form.category}
                onChange={set('category')}
                placeholder="e.g. Laptop, Monitor, Keyboard"
                required
              />
            </div>

            <div className="form-group">
              <label>Serial Number</label>
              <input
                value={form.serialNumber}
                onChange={set('serialNumber')}
                placeholder="e.g. SN-2024-001"
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                value={form.location}
                onChange={set('location')}
                placeholder="e.g. Floor 3, Room 302"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={4}
              placeholder="Optional notes about this asset"
            />
          </div>

          <div className="form-group">
            <label>Asset Image</label>

            <div className="image-upload-box">
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="image-preview"
                  />
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change Image
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={handleRemoveImage}
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="helper-text">Upload JPG, PNG, or WEBP image</p>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Image
                  </button>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Registering...' : 'Register Asset'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/assets')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}