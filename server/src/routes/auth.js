// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const HttpError = require('../utils/HttpError');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      throw new HttpError(400, 'username обязателен, минимум 3 символа');
    }
    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      throw new HttpError(400, 'email обязателен и должен быть валидным');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new HttpError(400, 'password обязателен, минимум 6 символов');
    }

    const trimmedUsername = username.trim();

    const [byUsername, byEmail] = await Promise.all([
      User.findOne({ where: { username: trimmedUsername } }),
      User.findOne({ where: { email } }),
    ]);
    if (byUsername) throw new HttpError(409, 'Пользователь с таким username уже существует');
    if (byEmail) throw new HttpError(409, 'Пользователь с таким email уже существует');

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      username: trimmedUsername,
      email,
      passwordHash,
      isVerified: true, // email-верификацию включим отдельным этапом
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
    });
  } catch (e) { next(e); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new HttpError(400, 'username и password обязательны');
    }

    const user = await User.findOne({ where: { username } });
    if (!user) throw new HttpError(401, 'Неверный username или пароль');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new HttpError(401, 'Неверный username или пароль');

    if (!user.isVerified) {
      throw new HttpError(403, 'Аккаунт не подтверждён. Проверьте email.');
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      },
    });
  } catch (e) { next(e); }
});

// GET /api/auth/profile — данные текущего пользователя (защищённый)
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
    });
    if (!user) throw new HttpError(404, 'Пользователь не найден');
    res.json(user);
  } catch (e) { next(e); }
});

// PUT /api/auth/profile — обновить профиль (avatarUrl, bio)
router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) throw new HttpError(404, 'Пользователь не найден');

    const { avatarUrl, bio } = req.body;
    if (avatarUrl !== undefined && avatarUrl !== null && typeof avatarUrl !== 'string') {
      throw new HttpError(400, 'avatarUrl должен быть строкой или null');
    }
    if (bio !== undefined && bio !== null && typeof bio !== 'string') {
      throw new HttpError(400, 'bio должен быть строкой или null');
    }

    await user.update({
      avatarUrl: avatarUrl !== undefined ? avatarUrl : user.avatarUrl,
      bio: bio !== undefined ? bio : user.bio,
    });

    const { passwordHash, ...safe } = user.toJSON();
    res.json(safe);
  } catch (e) { next(e); }
});

module.exports = router;