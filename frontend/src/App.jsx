import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AssetsPage from './pages/AssetsPage';
import AssetDetailPage from './pages/AssetDetailPage';
import AssetFormPage from './pages/AssetFormPage';
import EmployeesPage from './pages/EmployeesPage';
import AssignPage from './pages/AssignPage';
import QrScanPage from './pages/QrScanPage';
import AuditPage from './pages/AuditPage';
import AuditorsPage from './pages/AuditorsPage';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/qr/:assetId" element={<QrScanPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="assets" element={<AssetsPage />} />
            <Route path="assets/new" element={<RoleRoute roles={['ADMIN']}><AssetFormPage /></RoleRoute>} />
            <Route path="assets/:id" element={<AssetDetailPage />} />
            <Route path="employees" element={<RoleRoute roles={['ADMIN', 'AUDITOR']}><EmployeesPage /></RoleRoute>} />
            <Route path="assign"    element={<RoleRoute roles={['ADMIN']}><AssignPage /></RoleRoute>} />
            <Route path="auditors"  element={<RoleRoute roles={['ADMIN']}><AuditorsPage /></RoleRoute>} />
            <Route path="audit"     element={<RoleRoute roles={['ADMIN', 'AUDITOR']}><AuditPage /></RoleRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}