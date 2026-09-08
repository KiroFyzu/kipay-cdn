import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DrivePage from './pages/DrivePage.jsx';
import RecentPage from './pages/RecentPage.jsx';
import StarredPage from './pages/StarredPage.jsx';
import TrashPage from './pages/TrashPage.jsx';
import SharedPage from './pages/SharedPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AdminStatsPage from './pages/AdminStatsPage.jsx';
import AdminActivityPage from './pages/AdminActivityPage.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DrivePage />} />
        <Route path="recent" element={<RecentPage />} />
        <Route path="starred" element={<StarredPage />} />
        <Route path="trash" element={<TrashPage />} />
        <Route path="shared" element={<SharedPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/stats"
          element={
            <AdminRoute>
              <AdminStatsPage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/activity"
          element={
            <AdminRoute>
              <AdminActivityPage />
            </AdminRoute>
          }
        />
      </Route>
    </Routes>
  );
}
