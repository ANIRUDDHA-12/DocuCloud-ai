import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { session, loading } = useAuth();

  // If the AuthContext is still doing its initial mount check, wait.
  // (AuthContext actually handles this via full-screen spinner, 
  // but it's good practice to guard here just in case).
  if (loading) return null;

  // If no session exists, instantly kick to /login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Session valid — render the protected route (e.g. DashboardLayout)
  return <Outlet />;
}
