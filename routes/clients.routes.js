const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /clients - получить всех клиентов
router.get('/', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        equipment: true,
        repairRequests: true,
      },
      orderBy: { id: 'asc' },
    });

    res.json(clients);
  } catch (error) {
    console.error('Ошибка при получении клиентов:', error);
    res.status(500).json({ error: 'Ошибка при получении клиентов' });
  }
});

// GET /clients/:id - получить клиента по id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный id клиента' });
    }

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        equipment: { include: { model: true } },
        repairRequests: true,
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Клиент не найден' });
    }

    res.json(client);
  } catch (error) {
    console.error('Ошибка при получении клиента:', error);
    res.status(500).json({ error: 'Ошибка при получении клиента' });
  }
});

// POST /clients - создать клиента
router.post(
  '/',
  authenticateToken,
  requireRole('ADMIN', 'MANAGER'),
  async (req, res) => {
    try {
      const { companyName, contactPerson, phone, email, address } = req.body || {};

      if (!companyName || !contactPerson) {
        return res.status(400).json({
          error: 'Обязательные поля: companyName, contactPerson',
        });
      }

      const newClient = await prisma.client.create({
        data: { companyName, contactPerson, phone, email, address },
      });

      res.status(201).json(newClient);
    } catch (error) {
      console.error('Ошибка при создании клиента:', error);
      res.status(500).json({ error: 'Ошибка при создании клиента' });
    }
  }
);

// PUT /clients/:id - обновить клиента
router.put(
  '/:id',
  authenticateToken,
  requireRole('ADMIN', 'MANAGER'),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Некорректный id клиента' });
      }

      const { companyName, contactPerson, phone, email, address } = req.body || {};

      const existingClient = await prisma.client.findUnique({ where: { id } });

      if (!existingClient) {
        return res.status(404).json({ error: 'Клиент не найден' });
      }

      const updatedClient = await prisma.client.update({
        where: { id },
        data: { companyName, contactPerson, phone, email, address },
      });

      res.json(updatedClient);
    } catch (error) {
      console.error('Ошибка при обновлении клиента:', error);
      res.status(500).json({ error: 'Ошибка при обновлении клиента' });
    }
  }
);

// DELETE /clients/:id - удалить клиента
router.delete(
  '/:id',
  authenticateToken,
  requireRole('ADMIN', 'MANAGER'),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Некорректный id клиента' });
      }

      const existingClient = await prisma.client.findUnique({
        where: { id },
        include: {
          equipment: true,
          repairRequests: true,
        },
      });

      if (!existingClient) {
        return res.status(404).json({ error: 'Клиент не найден' });
      }

      await prisma.$transaction([
        prisma.repairRequest.deleteMany({ where: { clientId: id } }),
        prisma.equipment.updateMany({
          where: { clientId: id },
          data: { clientId: null },
        }),
        prisma.client.delete({ where: { id } }),
      ]);

      res.json({ message: 'Клиент успешно удалён' });
    } catch (error) {
      console.error('Ошибка при удалении клиента:', error);
      res.status(500).json({ error: 'Ошибка при удалении клиента' });
    }
  }
);

module.exports = router;
