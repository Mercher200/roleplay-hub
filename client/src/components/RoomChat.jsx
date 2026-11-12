// client/src/components/RoomChat.jsx
import { useEffect, useRef, useState } from 'react';
import { fetchMessages, sendMessage, rollDice, extractError } from '../api';
import { useAuth } from '../contexts/AuthContext';

const POLL_INTERVAL = 3000;

export default function RoomChat({ roomId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [text, setText] = useState('');
  const [dice, setDice] = useState('1d20');
  const [sending, setSending] = useState(false);
  const [rollError, setRollError] = useState(null);
  const [sendError, setSendError] = useState(null);

  // Состояние для анимации броска
  const [rollingData, setRollingData] = useState(null);

  const listRef = useRef(null);

  // ===== Загрузка истории =====
  const loadMessages = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const { data } = await fetchMessages(roomId, { limit: 100 });
      setMessages(data);
      setError(null);
    } catch (err) {
      setError(extractError(err));
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages(true);
    // Polling каждые 3 сек — в ЛР7 заменим на Socket.IO
    const timer = setInterval(() => loadMessages(false), POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [roomId]);

  // Автоскролл вниз при новых сообщениях или начале броска
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, rollingData]);

  // ===== Отправка текста =====
  const onSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSendError(null);
    setSending(true);
    try {
      await sendMessage(roomId, trimmed);
      setText('');
      await loadMessages(false);
    } catch (err) {
      setSendError(extractError(err));
    } finally {
      setSending(false);
    }
  };

  // ===== Бросок кубика с анимацией =====
  const onRoll = async (e) => {
    e.preventDefault();
    if (!dice.trim()) return;
    setRollError(null);
    setSending(true);

    // Включаем визуальную анимацию
    const tempId = `temp-${Date.now()}`;
    setRollingData({ id: tempId, dice: dice.trim(), username: user.username });

    // Прокрутка вниз к анимации
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, 50);

    try {
      const { data: newMessage } = await rollDice(roomId, dice.trim());
      
      // Искусственная задержка, чтобы анимация (1 сек) успела проиграться
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Добавляем реальное сообщение от сервера
      setMessages(prev => [...prev, newMessage]);
      setRollingData(null); // Убираем анимацию
    } catch (err) {
      setRollingData(null);
      setRollError(extractError(err));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  // ===== Рендер =====
  return (
    <div className="panel">
      <h2>💬 Чат комнаты</h2>

      {error && (
        <div className="error">
          {error}
          <button className="btn btn-small btn-secondary" style={{ marginLeft: 10 }} onClick={() => loadMessages(true)}>
            Повторить
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">⏳ Загрузка сообщений...</div>
      ) : (
        <div className="chat-list" ref={listRef}>
          {messages.length === 0 && !rollingData ? (
            <div className="empty">Сообщений пока нет. Начните первым!</div>
          ) : (
            messages.map((m) => {
              if (m.type === 'roll') {
                const r = m.rollResult;
                return (
                  <div key={m._id} className="chat-message chat-roll">
                    <div className="chat-meta">{m.username} · {formatTime(m.createdAt)}</div>
                    <div>
                      🎲 <b>{m.username}</b> бросил <code>{r.dice}</code>: [{r.rolls.join(', ')}]
                      {r.modifier !== 0 && ` ${r.modifier > 0 ? '+' : ''}${r.modifier}`} = <b>{r.total}</b>
                    </div>
                  </div>
                );
              }
              if (m.type === 'system') {
                return (
                  <div key={m._id} className="chat-system">
                    {m.text} · {formatTime(m.createdAt)}
                  </div>
                );
              }
              return (
                <div key={m._id} className="chat-message">
                  <div className="chat-meta">{m.username} · {formatTime(m.createdAt)}</div>
                  <div className="chat-text">{m.text}</div>
                </div>
              );
            })
          )}

          {/* Анимация броска (появляется на 1 секунду) */}
          {rollingData && (
            <div className="chat-message chat-roll rolling-animation">
              <div className="chat-meta">{rollingData.username} · сейчас</div>
              <div>
                🎲 <b>{rollingData.username}</b> бросает <code>{rollingData.dice}</code>...
                <span className="dice-icon">🎲</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Форма отправки текста */}
      <form className="chat-form" onSubmit={onSend}>
        {sendError && <div className="error">{sendError}</div>}
        <div className="form-row">
          <input
            placeholder="Сообщение..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
          />
          <button className="btn" type="submit" disabled={sending || !text.trim()}>Отправить</button>
        </div>
      </form>

      {/* Форма броска кубика */}
      <form className="chat-form" onSubmit={onRoll}>
        {rollError && <div className="error" style={{ marginTop: 8, marginBottom: 8 }}>{rollError}</div>}
        <div className="form-row">
          <input
            placeholder="2d6+3, d20, 1d8-1"
            value={dice}
            onChange={(e) => setDice(e.target.value)}
            style={{ maxWidth: 180 }}
          />
          <button className="btn btn-secondary" type="submit" disabled={sending}>🎲 Бросить</button>
        </div>
      </form>
    </div>
  );
}