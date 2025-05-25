import React from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SettingsView: React.FC = () => {
  const { theme, toggleTheme } = useUiStore();
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="grid gap-6 max-w-3xl">
        <Card title="Appearance">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Theme Mode</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose between light and dark mode
              </p>
            </div>
            <Button
              onClick={toggleTheme}
              variant="secondary"
              icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>
        </Card>

        <Card title="Account">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Connected Discord Bot</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You are currently connected to a Discord bot
              </p>
            </div>
            <Button variant="danger" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Card>

        <Card title="About">
          <div className="space-y-2">
            <h3 className="font-medium">Discord Dashboard</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Version 1.0.0
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              A custom dashboard for managing Discord servers.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsView;