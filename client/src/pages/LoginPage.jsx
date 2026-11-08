// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { extractError } from '../api';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('gandalf');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="panel" style={{ maxWidth: 420, margin: '60px auto' }}>
      <h1>🎲 RolePlay Hub</h1>
      <p className="subtitle">Войдите, чтобы присоединиться к игре</p>

      {error && <div className="error">{error}</div>}

      <form onSubmit={onSubmit}>
        <div className="form-row">
          <input
            placeholder="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="form-row">
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <p className="subtitle" style={{ marginTop: 20, fontSize: 12 }}>
        Демо: <b>gandalf / password123</b> · <b>aragorn / password123</b>
      </p>
    </div>
  );
}   