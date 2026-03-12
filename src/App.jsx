import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import ApiKeys from './pages/ApiKeys';
import Overview from './pages/Overview';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes Wrapper */}
          <Route element={<ProtectedRoute />}>
            {/* Dashboard Shell renders at /dashboard */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              {/* Default landing page resolves to Overview Action Center */}
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<Overview />} />
              {/* Raw Logs DataTable */}
              <Route path="logs" element={<Dashboard />} />
              {/* Settings Core */}
              <Route path="settings" element={<Settings />} />
              {/* API Keys Feature */}
              <Route path="keys" element={<ApiKeys />} />
            </Route>

            {/* Auto-redirect root (/) to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch-all 404 (Redirect to root/dashboard) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
