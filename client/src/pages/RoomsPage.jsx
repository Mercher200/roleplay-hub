// src/pages/RoomsPage.jsx
import { useEffect, useState } from 'react';
import { fetchRooms, extractError } from '../api';

export default function RoomsPage({ onSelectRoom }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchRooms()
      .then(({ data }) => setRooms(data))
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1>🏰 Комнаты</h1>
      <p className="subtitle">Активные игровые сессии</p>

      {loading && <div className="panel"><div className="loading">⏳ Загрузка...</div></div>}

      {error && (
        <div className="panel">
          <div className="error">{error}</div>
          <button className="btn" onClick={load}>Повторить</button>
        </div>
      )}

      {!loading && !error && (
        <div className="panel">
          {rooms.length === 0 ? (
            <div className="empty">Активных комнат пока нет</div>
          ) : (
            <div className="grid">
              {rooms.map((room) => (
                <div key={room.id} className="card">
                  <div className="header">
                    <h3>{room.name}</h3>
                    <span className="level-badge">
                      {room.isPrivate ? '🔒 Закрытая' : '🌐 Открытая'}
                    </span>
                  </div>
                  <div className="meta">GM: {room.gameMaster?.username ?? '—'}</div>
                  <div className="meta">Макс. игроков: {room.maxPlayers}</div>
                  <div className="meta" style={{ marginTop: 8, color: 'var(--text)' }}>
                    {room.scenario.slice(0, 100)}
                    {room.scenario.length > 100 ? '…' : ''}
                  </div>
                  <div className="controls">
                    <button className="btn" onClick={() => onSelectRoom(room.id)}>
                      Открыть
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}