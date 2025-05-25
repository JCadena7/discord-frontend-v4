import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoginView from './views/auth/LoginView';
import DashboardView from './views/dashboard/DashboardView';
import RolesView from './views/roles/RolesView';
import ChannelsView from './views/channels/ChannelsView';
import CategoriesView from './views/categories/CategoriesView';
import SettingsView from './views/settings/SettingsView';
import { useAuthStore } from './store/authStore';
import { useUiStore } from './store/uiStore';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const { theme } = useUiStore();

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardView />} />
          <Route path="roles" element={<RolesView />} />
          <Route path="channels" element={<ChannelsView />} />
          <Route path="categories" element={<CategoriesView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;