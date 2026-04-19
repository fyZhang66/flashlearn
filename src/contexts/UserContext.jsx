import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';
import useError from '../hooks/useError';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export function UserProvider({ children }) {
  const [username, setUsername] = useState("");
  const [isLogged, setIsLogged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { errorMessage, setError, clearError } = useError();
  const [resetStatsFlag, setResetStatsFlag] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api.checkSession()
      .then((session) => {
        handleLogin(session.username);
      })
      .catch((err) => {
        setError(err);
        setIsLogged(false);
        setUsername("");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleLogout = () => {
    api.logout()
      .then(() => {
        setUsername("");
        setIsLogged(false);
        clearError();
        setResetStatsFlag(true);
      })
      .catch((err) => {
        setError(err);
      });
  };

  useEffect(() => {
    if (resetStatsFlag) {
      setResetStatsFlag(false);
    }
  }, [resetStatsFlag]);

  const handleLogin = (username) => {
    setUsername(username);
    setIsLogged(true);
    clearError();
    setIsLoading(false);
  };

  const value = {
    username,
    isLogged,
    isLoading,
    errorMessage,
    setError,
    clearError,
    handleLogin,
    handleLogout,
    resetStatsFlag
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export default UserContext;