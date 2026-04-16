const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');

const allowedRoles = ['ADMIN', 'MANAGER', 'ENGINEER', 'CLIENT'];

// GET /users - получить всех пользователей
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
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
    const { name, email, passwordHash, role } = req.body || {};

    if (!name || !email || !passwordHash || !role) {
      return res.status(400).json({
        error: 'Обязательные поля: name, email, passwordHash, role',
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        error: 'Некорректная роль. Допустимые значения: ADMIN, MANAGER, ENGINEER, CLIENT',
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
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

    const { name, email, passwordHash, role } = req.body || {};

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
        return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
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