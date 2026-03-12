import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';

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
              {/* Default Nested Content inside the Outlet */}
              <Route index element={
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                  <h2 className="text-xl font-semibold text-slate-800 mb-2">Phase 3A Complete</h2>
                  <p className="text-slate-500">The Auth Context and Dashboard Shell are successfully wired. 
                  The future Data Table component will render here.</p>
                </div>
              } />
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
