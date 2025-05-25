import React, { useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuthStore } from '../../store/authStore';
import { DiscordGuild } from '../../types/discord';
import toast from 'react-hot-toast';

const LoginView: React.FC = () => {
  const { isAuthenticated, guilds, login, selectGuild, checkAuthStatus, handleAuthCallback } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      handleAuthCallback(code)
        .catch((error) => {
          console.error('Auth callback error:', error);
          toast.error('Authentication failed. Please try again.');
        });
    } else {
      checkAuthStatus();
    }
  }, [checkAuthStatus, handleAuthCallback, searchParams]);

  const handleGuildSelect = (guild: DiscordGuild) => {
    selectGuild(guild);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-center mb-6">
              <div className="bg-indigo-600 p-3 rounded-full">
                <MessageSquare size={32} className="text-white" />
              </div>
            </div>
            <h2 className="text-center text-2xl font-bold text-white mb-6">
              Discord Admin Dashboard
            </h2>

            {!isAuthenticated ? (
              <Button
                onClick={login}
                className="w-full"
              >
                Login with Discord
              </Button>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-4">
                  Select a Server
                </h3>
                {guilds.map((guild) => (
                  <Card
                    key={guild.id}
                    className="cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => handleGuildSelect(guild)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {guild.icon ? (
                          <img
                            src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                            alt={guild.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-lg font-medium text-white">
                              {guild.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-white">{guild.name}</h4>
                          <p className="text-sm text-gray-400">
                            {guild.owner ? 'Owner' : 'Admin'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;