import React, { useEffect } from 'react';
import { Users, MessageSquare, FolderTree } from 'lucide-react';
import Card from '../../components/common/Card';
import { useRolesStore } from '../../store/rolesStore';
import { useChannelsStore } from '../../store/channelsStore';
import { useCategoriesStore } from '../../store/categoriesStore';
import { Link } from 'react-router-dom';

const DashboardView: React.FC = () => {
  const { roles, fetchRoles } = useRolesStore();
  const { channels, fetchChannels } = useChannelsStore();
  const { categories, fetchCategories } = useCategoriesStore();

  useEffect(() => {
    fetchRoles();
    fetchChannels();
    fetchCategories();
  }, [fetchRoles, fetchChannels, fetchCategories]);

  const stats = [
    {
      title: 'Total Roles',
      value: roles.length,
      icon: <Users size={24} className="text-indigo-500" />,
      link: '/roles',
    },
    {
      title: 'Total Channels',
      value: channels.length,
      icon: <MessageSquare size={24} className="text-green-500" />,
      link: '/channels',
    },
    {
      title: 'Total Categories',
      value: categories.length,
      icon: <FolderTree size={24} className="text-orange-500" />,
      link: '/categories',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3 mb-8">
        {stats.map((stat) => (
          <Link to={stat.link} key={stat.title} className="block">
            <Card className="h-full transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div>{stat.icon}</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Recent Activity">
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Activity data will appear here
          </div>
        </Card>
        <Card title="Quick Actions">
          <div className="space-y-2">
            <Link to="/roles">
              <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                <div className="flex items-center">
                  <Users size={18} className="mr-2 text-indigo-500" />
                  <span>Manage Roles</span>
                </div>
              </button>
            </Link>
            <Link to="/channels">
              <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                <div className="flex items-center">
                  <MessageSquare size={18} className="mr-2 text-green-500" />
                  <span>Manage Channels</span>
                </div>
              </button>
            </Link>
            <Link to="/categories">
              <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
                <div className="flex items-center">
                  <FolderTree size={18} className="mr-2 text-orange-500" />
                  <span>Manage Categories</span>
                </div>
              </button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardView;