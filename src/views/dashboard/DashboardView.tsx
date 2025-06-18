import React, { useEffect, useState } from 'react';
import { Users, MessageSquare, FolderTree } from 'lucide-react';
import Card from '../../components/common/Card';
import { useRolesStore } from '../../store/rolesStore';
import { useChannelsStore } from '../../store/channelsStore';
import { useServerStructureStore } from '../../store/serverStructureStore'; // Updated import
import { Link, useParams } from 'react-router-dom';
import { getBotStatus } from '../../services/botStatus';

const DashboardView: React.FC = () => {
  const { roles, fetchRoles } = useRolesStore();
  const { channels, fetchChannels } = useChannelsStore();
  // Updated to useServerStructureStore and commented out unused variables
  const { /* serverData, */ fetchServerStructure } = useServerStructureStore();
  const { guildId } = useParams();
  const [botPresent, setBotPresent] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!guildId) return;
    setLoading(true);
    getBotStatus(guildId)
      .then((data) => {
        if (isMounted) {
          setBotPresent(data.present);
        }
      })
      .catch(() => {
        if (isMounted) setBotPresent(false);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [guildId]);

  useEffect(() => {
    if (botPresent) {
      fetchRoles();
      fetchChannels();
      if (guildId) fetchServerStructure(guildId); // Updated function name
    }
    // Solo hacemos fetch si bot está presente
  }, [botPresent, fetchRoles, fetchChannels, fetchServerStructure]);

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
      // value: categories.length, // Commented out as categories is not directly available
      value: 0, // Placeholder value
      icon: <FolderTree size={24} className="text-orange-500" />,
      link: '/categories',
    },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-full text-white">Cargando...</div>;
  }

  if (botPresent === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white">
        <h2 className="text-2xl font-bold mb-4">Este servidor requiere configuración.</h2>
        <a
          href={`https://discord.com/channels/@me`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-indigo-600 rounded text-white font-semibold hover:bg-indigo-700 transition"
        >
          <i className="fab fa-discord mr-2" />Continuar A Discord
        </a>
      </div>
    );
  }

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