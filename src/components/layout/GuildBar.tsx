import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';

const GuildBar: React.FC = () => {
  const { guilds, selectGuild, selectedGuild } = useAuthStore();
  const navigate = useNavigate();

  const handleGuildSelect = (guild: any) => {
    selectGuild(guild);
    navigate('/dashboard');
  };

  return (
    <div className="fixed left-0 top-0 h-full w-[72px] bg-[#1E1F22] flex flex-col items-center py-3 space-y-2 z-30">
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden scrollbar-hide flex flex-col items-center space-y-2">
        {/* Home Button */}
        <button
          onClick={() => navigate('/login')}
          className={clsx(
            'w-12 h-12 bg-[#313338] rounded-[16px] flex items-center justify-center hover:bg-indigo-500 hover:rounded-[12px] transition-all duration-200 shrink-0',
            !selectedGuild && 'bg-indigo-500'
          )}
        >
          <MessageSquare size={24} className="text-white" />
        </button>

        {/* Separator */}
        <div className="w-8 h-[2px] bg-[#2B2D31] rounded-full mx-auto shrink-0" />

        {/* Guild List */}
        <div className="flex flex-col items-center gap-2 w-full px-2">
          {guilds.map((guild) => (
            <button
              key={guild.id}
              onClick={() => handleGuildSelect(guild)}
              className={clsx(
                'relative w-12 h-12 group shrink-0',
                'hover:rounded-[12px] transition-all duration-200',
                selectedGuild?.id === guild.id ? 'rounded-[12px]' : 'rounded-[24px]'
              )}
            >
              {/* Guild indicator */}
              <div
                className={clsx(
                  'absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r transition-all duration-200',
                  selectedGuild?.id === guild.id ? 'h-10' : 'h-5 scale-0 group-hover:scale-100'
                )}
              />

              {guild.icon ? (
                <img
                  src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                  alt={guild.name}
                  className="w-full h-full object-cover rounded-inherit"
                />
              ) : (
                <div className="w-full h-full bg-[#313338] rounded-inherit flex items-center justify-center hover:bg-indigo-500 transition-colors">
                  <span className="text-lg font-medium text-white">
                    {guild.name.charAt(0)}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GuildBar;