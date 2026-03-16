import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('sbams_user');
  if (stored) {
    const { token } = JSON.parse(stored);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sbams_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);

// Assets
export const getAssets = (params) => api.get('/assets', { params });
export const getAsset = (id) => api.get(`/assets/${id}`);
export const createAsset = (data) => api.post('/assets', data);
export const updateAssetStatus = (id, data) => api.put(`/assets/${id}/status`, data);
export const deleteAsset = (id) => api.delete(`/assets/${id}`);

// Assignments
export const assignAsset = (data) => api.post('/assignments', data);
export const returnAsset = (id) => api.put(`/assignments/${id}/return`);

// Employees
export const getEmployees = () => api.get('/employees');
export const getEmployee = (id) => api.get(`/employees/${id}`);
export const createEmployee = (data) => api.post('/employees', data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);

// QR
export const qrLookup = (assetId) => api.get(`/qr/${assetId}`);

// Reports
export const getReportSummary = () => api.get('/reports/summary');

// Audit
export const getAuditLog = (page = 0) => api.get('/audit', { params: { page } });
