// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function extractError(err) {
  if (err.response?.data?.error) return err.response.data.error;
  if (err.response?.data?.details?.length) return err.response.data.details.join('; ');
  if (err.message) return err.message;
  return 'Неизвестная ошибка';
}

// ===== Auth =====
export const login = (username, password) =>
  api.post('/auth/login', { username, password });

export const getProfile = () => api.get('/auth/profile');

// ===== Rooms =====
export const fetchRooms = () => api.get('/rooms');
export const fetchRoom = (id) => api.get(`/rooms/${id}`);
export const joinRoom = (id, payload = {}) => api.post(`/rooms/${id}/join`, payload);
export const leaveRoom = (id) => api.post(`/rooms/${id}/leave`);

// ===== Characters =====
export const fetchCharacters = (params) => api.get('/characters', { params });
export const createCharacter = (data) => api.post('/characters', data);
export const updateCharacter = (id, data) => api.put(`/characters/${id}`, data);
export const updateCharacterStats = (id, stats) => api.patch(`/characters/${id}/stats`, stats);
export const deleteCharacter = (id) => api.delete(`/characters/${id}`);

export default api;

// ===== Messages =====
export const fetchMessages = (roomId, params) => api.get(`/rooms/${roomId}/messages`, { params });
export const sendMessage = (roomId, text) => api.post(`/rooms/${roomId}/messages`, { text });
export const rollDice = (roomId, dice) => api.post(`/rooms/${roomId}/roll`, { dice });