import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  FolderTree, 
  Settings, 
  Menu, 
  X, 
  Moon, 
  Sun, 
  LogOut
} from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';

const Sidebar: React.FC = () => {
  const { theme, toggleTheme, sidebarOpen, toggleSidebar } = useUiStore();
  const { logout, selectedGuild } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/roles', icon: <Users size={20} />, label: 'Roles' },
    { to: '/channels', icon: <MessageSquare size={20} />, label: 'Channels' },
    { to: '/categories', icon: <FolderTree size={20} />, label: 'Categories' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  if (!selectedGuild) return null;

  return (
    <>
      <div 
        className={clsx(
          'fixed top-0 left-[72px] w-64 h-full bg-[#2B2D31] text-white z-20 transition-all duration-300 ease-in-out',
          'md:block', // Always show on desktop
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0', // Only transform on mobile
          'md:top-0', // Reset top position on desktop
          'top-16' // Start below mobile header
        )}
      >
        {/* Server Header - Only show on desktop */}
        <div className="hidden md:block px-4 py-3 border-b border-[#1E1F22]">
          <div className="flex items-center gap-3">
            {selectedGuild.icon ? (
              <img
                src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`}
                alt={selectedGuild.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-[#313338] rounded-full flex items-center justify-center">
                <span className="text-lg font-medium">{selectedGuild.name.charAt(0)}</span>
              </div>
            )}
            <h1 className="text-base font-semibold flex-1 truncate">{selectedGuild.name}</h1>
          </div>
        </div>

        <nav className="mt-4 px-2">
          <ul className="space-y-[2px]">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                      isActive
                        ? 'bg-[#404249] text-white'
                        : 'text-gray-400 hover:bg-[#35363C] hover:text-white'
                    )
                  }
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#1E1F22] bg-[#2B2D31]">
          <div className="flex justify-between items-center">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-400 hover:bg-[#35363C] hover:text-white transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 p-2 rounded-md text-gray-400 hover:bg-[#35363C] hover:text-white transition-colors"
            >
              <LogOut size={20} />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-[72px] right-0 bg-[#2B2D31] text-white z-10 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          {selectedGuild.icon ? (
            <img
              src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`}
              alt={selectedGuild.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-[#313338] rounded-full flex items-center justify-center">
              <span className="text-lg font-medium">{selectedGuild.name.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-base font-semibold truncate">{selectedGuild.name}</h1>
        </div>
        <button 
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-white transition-colors p-2"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;