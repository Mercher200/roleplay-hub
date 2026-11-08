// src/App.jsx
import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RoomsPage from './pages/RoomsPage';
import RoomPage from './pages/RoomPage';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  if (loading) return <div className="panel"><div className="loading">⏳ Загрузка...</div></div>;
  if (!user) return <LoginPage />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span className="subtitle" style={{ margin: 0 }}>👤 {user.username}</span>
        <button className="btn btn-small btn-secondary" onClick={logout}>Выйти</button>
      </div>

      {selectedRoomId ? (
        <RoomPage roomId={selectedRoomId} onBack={() => setSelectedRoomId(null)} />
      ) : (
        <RoomsPage onSelectRoom={setSelectedRoomId} />
      )}
    </div>
  );
}