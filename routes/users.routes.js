const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireRole } = require('../middleware/auth');

const allowedRoles = ['ADMIN', 'MANAGER', 'ENGINEER', 'CLIENT'];

// Все маршруты пользователей доступны только администратору
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

// GET /users - получить всех пользователей
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    res.status(500).json({ error: 'Ошибка при получении пользователей' });
  }
});

// GET /users/:id - получить пользователя по id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный id пользователя' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
        assignedRepairRequests: true,
        serviceEvents: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    res.status(500).json({ error: 'Ошибка при получении пользователя' });
  }
});

// POST /users - создать пользователя
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, clientId } = req.body || {};

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        error: 'Обязательные поля: name, email, password, role',
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        error: 'Некорректная роль. Допустимые значения: ADMIN, MANAGER, ENGINEER, CLIENT',
      });
    }

    if (role === 'CLIENT' && !clientId) {
      return res.status(400).json({
        error: 'Для пользователя с ролью CLIENT необходимо указать clientId',
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Пользователь с таким email уже существует',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        clientId: role === 'CLIENT' ? Number(clientId) : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    res.status(500).json({ error: 'Ошибка при создании пользователя' });
  }
});

// PUT /users/:id - обновить пользователя
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный id пользователя' });
    }

    const { name, email, password, role, clientId } = req.body || {};

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        error: 'Некорректная роль. Допустимые значения: ADMIN, MANAGER, ENGINEER, CLIENT',
      });
    }

    if (email && email !== existingUser.email) {
      const emailOwner = await prisma.user.findUnique({
        where: { email },
      });

      if (emailOwner) {
        return res.status(400).json({
          error: 'Пользователь с таким email уже существует',
        });
      }
    }

    if (role === 'CLIENT' && !clientId) {
      return res.status(400).json({
        error: 'Для пользователя с ролью CLIENT необходимо указать clientId',
      });
    }

    const data = {};

    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;

    if (clientId !== undefined) {
      data.clientId = clientId ? Number(clientId) : null;
    }

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    res.status(500).json({ error: 'Ошибка при обновлении пользователя' });
  }
});

// DELETE /users/:id - удалить пользователя
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный id пользователя' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        assignedRepairRequests: true,
        serviceEvents: true,
      },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    await prisma.$transaction([
      prisma.repairRequest.updateMany({
        where: { assignedEngineerId: id },
        data: { assignedEngineerId: null },
      }),
      prisma.serviceEvent.updateMany({
        where: { engineerId: id },
        data: { engineerId: null },
      }),
      prisma.user.delete({
        where: { id },
      }),
    ]);

    res.json({ message: 'Пользователь успешно удалён' });
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    res.status(500).json({ error: 'Ошибка при удалении пользователя' });
  }
});

module.exports = router;