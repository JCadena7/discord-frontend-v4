import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { botApi } from '../../services/api';

const RequireBotPresent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { guildId } = useParams();
  const [botPresent, setBotPresent] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Solo proceder si hay guildId
    if (!guildId) {
      if (isMounted) {
        setLoading(false);
        setBotPresent(false);
      }
      return;
    }

    // Establecer loading solo si no está ya en loading
    if (!loading) {
      setLoading(true);
    }

    botApi.getBotStatus(guildId)
      .then(res => {
        if (isMounted) {
          setBotPresent(res.data.isInGuild);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBotPresent(false);
          setLoading(false);
        }
      });

    return () => { 
      isMounted = false; 
    };
  }, [guildId]); // Removemos 'loading' de las dependencias para evitar bucles

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full text-white">
        Cargando...
      </div>
    );
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
          <i className="fab fa-discord mr-2" />
          Continuar A Discord
        </a>
      </div>
    );
  }
  
  return <>{children}</>;
};

export default RequireBotPresent;