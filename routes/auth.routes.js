const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../db/prisma');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function isPasswordValid(plainPassword, storedPasswordHash) {
  if (!storedPasswordHash) return false;

  // Если в БД уже хранится bcrypt-хеш — проверяем как хеш
  if (storedPasswordHash.startsWith('$2a$') || storedPasswordHash.startsWith('$2b$')) {
    return bcrypt.compare(plainPassword, storedPasswordHash);
  }

  // Если сейчас в проекте demo-данные с обычной строкой, сравниваем напрямую
  return plainPassword === storedPasswordHash;
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Укажите email и password' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const isValid = await isPasswordValid(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Ошибка логина:', error);
    res.status(500).json({ error: 'Ошибка входа в систему' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error) {
    console.error('Ошибка получения текущего пользователя:', error);
    res.status(500).json({ error: 'Ошибка получения данных пользователя' });
  }
});

module.exports = router;