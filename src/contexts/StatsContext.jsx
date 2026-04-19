import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import api from '../api';
import { useUser } from './UserContext';
import useError from '../hooks/useError';

const defaultStats = {
  total: 0,
  unlearned: 0,
  due: 0,
};

const StatsContext = createContext();

export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
};

export function StatsProvider({ children, pollInterval = 30000 }) {
  const [stats, setStats] = useState(defaultStats);
  const [isPolling, setIsPolling] = useState(true);
  const { setError } = useError();
  const { isLogged, resetStatsFlag } = useUser();
  const intervalIdRef = useRef(null);
  
  const isLoggedRef = useRef(isLogged);
  
  useEffect(() => {
    isLoggedRef.current = isLogged;
  }, [isLogged]);
  
  function fetchStats() {
    if (!isLoggedRef.current) return;
    
    api.getCardStats()
      .then(data => {
        setStats(data);
      })
      .catch(error => {
        setError(error);
      });
  }

  useEffect(() => {
    if (resetStatsFlag) {
      setStats(defaultStats);
    }
  }, [resetStatsFlag]);

  useEffect(() => {
    if (isLogged) {
      fetchStats();
      
      if (isPolling) {
        intervalIdRef.current = setInterval(fetchStats, pollInterval);
      }
    } else {
      setStats(defaultStats);
    }
    
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [isLogged, isPolling, pollInterval]);

  const togglePolling = () => {
    setIsPolling(prev => !prev);
  };
  
  const resetStats = () => {
    setStats(defaultStats);
  };
  
  const value = {
    stats,
    setStats,
    fetchStats,
    isPolling,
    togglePolling,
    resetStats
  };
  
  return (
    <StatsContext.Provider value={value}>
      {children}
    </StatsContext.Provider>
  );
}

export default StatsContext;