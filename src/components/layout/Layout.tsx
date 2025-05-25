import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import GuildBar from './GuildBar';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';
import { Toaster } from 'react-hot-toast';

const Layout: React.FC = () => {
  const { sidebarOpen } = useUiStore();
  const { selectedGuild } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }} 
      />
      
      <GuildBar />
      
      {selectedGuild && <Sidebar />}
      
      <main
        className={clsx(
          'flex-1 transition-all duration-300',
          'md:pt-0',
          selectedGuild && 'pt-16', // Add padding top on mobile when guild is selected
          selectedGuild ? (
            sidebarOpen ? (
              'md:ml-[336px] ml-[72px]' // 72px (guild bar) + 264px (sidebar) = 336px
            ) : (
              'md:ml-[72px] ml-[72px]'
            )
          ) : (
            'ml-[72px]'
          )
        )}
      >
        <div className="container mx-auto p-4 md:p-6 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;