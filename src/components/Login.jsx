import { useState } from 'react';
import './Login.css';
import api from '../api';
import { useUser } from '../contexts/UserContext';
import useError from '../hooks/useError';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { handleLogin } = useUser();
  const { errorMessage, setError, clearError } = useError();

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    setSuccessMessage('');

    if (!username.trim()) {
      setError('required-username');
      return;
    }
    if (!password || password.length < 6) {
      setError('required-password');
      return;
    }

    setIsLoading(true);

    if (isCreateMode) {
      api.register(username, password)
        .then(() => {
          setSuccessMessage('Account created successfully. Please log in.');
          setIsCreateMode(false);
          setPassword('');
        })
        .catch((err) => {
          setError(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      api.login(username, password)
        .then((data) => {
          handleLogin(data.username);
        })
        .catch((err) => {
          setError(err);
          if (err.error === 'user-not-registered') {
            setIsCreateMode(true);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  const toggleMode = () => {
    setIsCreateMode(!isCreateMode);
    clearError();
    setSuccessMessage('');
  };

  return (
    <div className="login-container">
      <h2>{isCreateMode ? 'Create Account' : 'Login'}</h2>

      {errorMessage && <div className="login-error">{errorMessage}</div>}
      {successMessage && <div className="login-success">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            autoComplete="username"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete={isCreateMode ? 'new-password' : 'current-password'}
            disabled={isLoading}
          />
        </div>

        <button type="submit" className="login-button" disabled={isLoading}>
          {isLoading ? 'Processing...' : isCreateMode ? 'Create Account' : 'Login'}
        </button>
      </form>

      <div className="login-toggle">
        {isCreateMode ? (
          <p>
            Already have an account?{' '}
            <button className="toggle-link" onClick={toggleMode} disabled={isLoading}>
              Login
            </button>
          </p>
        ) : (
          <p>
            Don't have an account?{' '}
            <button className="toggle-link" onClick={toggleMode} disabled={isLoading}>
              Create one
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;
