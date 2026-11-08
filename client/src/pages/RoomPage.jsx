// src/pages/RoomPage.jsx
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchRoom,
  fetchCharacters,
  createCharacter,
  updateCharacterStats,
  deleteCharacter as apiDeleteCharacter,
  extractError,
} from '../api';

const EMPTY_FORM = {
  name: '', race: '', class: '',
  level: 1, hp: 10, maxHp: 10,
  strength: 10, dexterity: 10, intelligence: 10,
};

export default function RoomPage({ roomId, onBack }) {
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Поиск с debounce
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Форма добавления
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Флаг: пользователь — GM этой комнаты
  const isGM = room && user && room.gameMasterId === user.id;

  // ===== Загрузка комнаты + персонажей =====
  const loadRoom = async () => {
    setLoading(true);
    setError(null);
    try {
      const [roomRes, charsRes] = await Promise.all([
        fetchRoom(roomId),
        fetchCharacters({ roomId }),
      ]);
      setRoom(roomRes.data);
      setCharacters(charsRes.data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ===== Debounce поиска: 500 мс =====
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ===== Перезапрос персонажей при изменении поиска =====
  const firstSearch = useRef(true);
  useEffect(() => {
    if (firstSearch.current) { firstSearch.current = false; return; }
    fetchCharacters({ roomId, search: searchQuery || undefined })
      .then(({ data }) => setCharacters(data))
      .catch((err) => setError(extractError(err)));
  }, [searchQuery, roomId]);

  // ===== Оптимистичное добавление =====
  const onAdd = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim() || !form.race.trim() || !form.class.trim()) {
      setFormError('Имя, раса и класс обязательны');
      return;
    }
    if (form.hp > form.maxHp) { setFormError('HP не может превышать MaxHP'); return; }

    const tempId = `temp-${Date.now()}`;
    const optimistic = { ...form, id: tempId, roomId };
    setCharacters((prev) => [...prev, optimistic]);
    setSubmitting(true);

    try {
      const { data: created } = await createCharacter({ ...form, roomId });
      // Заменяем временный id на реальный
      setCharacters((prev) => prev.map((c) => (c.id === tempId ? created : c)));
      setForm(EMPTY_FORM);
    } catch (err) {
      // Откат
      setCharacters((prev) => prev.filter((c) => c.id !== tempId));
      setFormError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Оптимистичное удаление =====
  const onDelete = async (id) => {
    const backup = characters;
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    try {
      await apiDeleteCharacter(id);
    } catch (err) {
      setCharacters(backup);
      setError(extractError(err));
    }
  };

  // ===== Оптимистичное изменение уровня / HP =====
  const onStatsChange = async (id, patch) => {
    const backup = characters;
    setCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
    try {
      await updateCharacterStats(id, patch);
    } catch (err) {
      setCharacters(backup);
      setError(extractError(err));
    }
  };

  // ===== Рендер =====
  if (loading) {
    return <div className="panel"><div className="loading">⏳ Загрузка комнаты...</div></div>;
  }

  if (error && !room) {
    return (
      <div className="panel">
        <div className="error">{error}</div>
        <button className="btn" onClick={loadRoom}>Повторить</button>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginLeft: 8 }}>
          Назад
        </button>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-secondary btn-small" onClick={onBack}>← К комнатам</button>

      <h1 style={{ marginTop: 16 }}>{room.name}</h1>
      <p className="subtitle">
        GM: {room.gameMaster?.username} · {room.isPrivate ? '🔒 Закрытая' : '🌐 Открытая'}
      </p>
      <div className="panel">
        <div style={{ whiteSpace: 'pre-wrap' }}>{room.scenario}</div>
      </div>

      {error && (
        <div className="panel">
          <div className="error">{error}</div>
          <button className="btn" onClick={loadRoom}>Повторить</button>
        </div>
      )}

      {/* Форма добавления — только GM */}
      {isGM && (
        <form className="panel" onSubmit={onAdd}>
          <h2>➕ Добавить персонажа</h2>
          {formError && <div className="error">{formError}</div>}

          <div className="form-row">
            <input placeholder="Имя" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Раса" value={form.race} onChange={(e) => setForm({ ...form, race: e.target.value })} />
            <input placeholder="Класс" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} />
          </div>
          <div className="form-row">
            <input type="number" placeholder="Уровень" min="1" max="20" value={form.level} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })} />
            <input type="number" placeholder="HP" min="0" value={form.hp} onChange={(e) => setForm({ ...form, hp: Number(e.target.value) })} />
            <input type="number" placeholder="MaxHP" min="1" value={form.maxHp} onChange={(e) => setForm({ ...form, maxHp: Number(e.target.value) })} />
          </div>
          <div className="form-row">
            <input type="number" placeholder="СИЛ" min="1" max="20" value={form.strength} onChange={(e) => setForm({ ...form, strength: Number(e.target.value) })} />
            <input type="number" placeholder="ЛОВ" min="1" max="20" value={form.dexterity} onChange={(e) => setForm({ ...form, dexterity: Number(e.target.value) })} />
            <input type="number" placeholder="ИНТ" min="1" max="20" value={form.intelligence} onChange={(e) => setForm({ ...form, intelligence: Number(e.target.value) })} />
          </div>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Добавление...' : 'Добавить'}
          </button>
        </form>
      )}

      {/* Список персонажей */}
      <div className="panel">
        <div className="toolbar">
          <label>Поиск:</label>
          <input
            placeholder="Имя, раса, класс..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ minWidth: 240 }}
          />
          {searchInput !== searchQuery && <span style={{ color: 'var(--muted)', fontSize: 12 }}>…</span>}
        </div>

        {characters.length === 0 ? (
          <div className="empty">
            {searchQuery ? `Ничего не найдено по "${searchQuery}"` : 'В комнате пока нет персонажей'}
          </div>
        ) : (
          <div className="grid">
            {characters.map((c) => {
              const hpPercent = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));
              const hpClass = hpPercent < 25 ? 'low' : hpPercent < 60 ? 'mid' : '';
              const isTemp = typeof c.id === 'string';
              return (
                <div key={c.id} className="card" style={isTemp ? { opacity: 0.6 } : undefined}>
                  <div className="header">
                    <h3>{c.name}</h3>
                    <span className="level-badge">Ур. {c.level}</span>
                  </div>
                  <div className="meta">{c.race} · {c.class}</div>
                  <div className="stats-line">
                    <span>СИЛ {c.strength}</span>
                    <span>ЛОВ {c.dexterity}</span>
                    <span>ИНТ {c.intelligence}</span>
                  </div>
                  <div className="hp-bar"><div className={`hp-bar-fill ${hpClass}`} style={{ width: `${hpPercent}%` }} /></div>
                  <div className="meta">HP: {c.hp} / {c.maxHp}</div>

                  {isGM && !isTemp && (
                    <div className="controls">
                      <button className="btn btn-small btn-secondary"
                        onClick={() => onStatsChange(c.id, { level: Math.max(1, Math.min(20, c.level + 1)) })}>
                        +Ур
                      </button>
                      <button className="btn btn-small btn-secondary"
                        onClick={() => onStatsChange(c.id, { level: Math.max(1, c.level - 1) })}>
                        −Ур
                      </button>
                      <button className="btn btn-small btn-secondary"
                        onClick={() => onStatsChange(c.id, { hp: Math.min(c.maxHp, c.hp + 5) })}>
                        +5 HP
                      </button>
                      <button className="btn btn-small btn-secondary"
                        onClick={() => onStatsChange(c.id, { hp: Math.max(0, c.hp - 5) })}>
                        −5 HP
                      </button>
                      <button className="btn btn-small btn-danger" onClick={() => onDelete(c.id)}>
                        Удалить
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}