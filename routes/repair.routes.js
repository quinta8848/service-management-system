const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

const allowedStatuses = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'];
const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// Все маршруты заявок требуют авторизации
router.use(authenticateToken);

// GET /repair-requests - получить все заявки
router.get(
  '/',
  requireRole('ADMIN', 'MANAGER', 'ENGINEER'),
  async (req, res) => {
    try {
      const repairRequests = await prisma.repairRequest.findMany({
        include: {
          equipment: true,
          client: true,
          assignedEngineer: true,
        },
        orderBy: {
          id: 'asc',
        },
      });

      res.json(repairRequests);
    } catch (error) {
      console.error('Ошибка при получении заявок:', error);
      res.status(500).json({ error: 'Ошибка при получении заявок' });
    }
  }
);

// GET /repair-requests/:id - получить заявку по id
router.get(
  '/:id',
  requireRole('ADMIN', 'MANAGER', 'ENGINEER'),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Некорректный id заявки' });
      }

      const repairRequest = await prisma.repairRequest.findUnique({
        where: { id },
        include: {
          equipment: true,
          client: true,
          assignedEngineer: true,
        },
      });

      if (!repairRequest) {
        return res.status(404).json({ error: 'Заявка не найдена' });
      }

      res.json(repairRequest);
    } catch (error) {
      console.error('Ошибка при получении заявки:', error);
      res.status(500).json({ error: 'Ошибка при получении заявки' });
    }
  }
);

// POST /repair-requests - создать заявку
router.post(
  '/',
  requireRole('ADMIN', 'MANAGER', 'ENGINEER'),
  async (req, res) => {
    try {
      const {
        title,
        description,
        status = 'NEW',
        priority = 'MEDIUM',
        equipmentId,
        clientId,
        assignedEngineerId,
      } = req.body || {};

      if (!title || !description || !equipmentId || !clientId) {
        return res.status(400).json({
          error: 'Обязательные поля: title, description, equipmentId, clientId',
        });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Некорректный статус. Допустимые значения: NEW, IN_PROGRESS, COMPLETED, CANCELED',
        });
      }

      if (!allowedPriorities.includes(priority)) {
        return res.status(400).json({
          error: 'Некорректный приоритет. Допустимые значения: LOW, MEDIUM, HIGH, CRITICAL',
        });
      }

      const newRepairRequest = await prisma.repairRequest.create({
        data: {
          title,
          description,
          status,
          priority,
          equipmentId: Number(equipmentId),
          clientId: Number(clientId),
          assignedEngineerId: assignedEngineerId ? Number(assignedEngineerId) : null,
        },
        include: {
          equipment: true,
          client: true,
          assignedEngineer: true,
        },
      });

      res.status(201).json(newRepairRequest);
    } catch (error) {
      console.error('Ошибка при создании заявки:', error);
      res.status(500).json({ error: 'Ошибка при создании заявки' });
    }
  }
);

// PUT /repair-requests/:id - обновить заявку
router.put(
  '/:id',
  requireRole('ADMIN', 'MANAGER', 'ENGINEER'),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Некорректный id заявки' });
      }

      const {
        title,
        description,
        status,
        priority,
        equipmentId,
        clientId,
        assignedEngineerId,
      } = req.body || {};

      const existingRequest = await prisma.repairRequest.findUnique({
        where: { id },
      });

      if (!existingRequest) {
        return res.status(404).json({ error: 'Заявка не найдена' });
      }

      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Некорректный статус. Допустимые значения: NEW, IN_PROGRESS, COMPLETED, CANCELED',
        });
      }

      if (priority && !allowedPriorities.includes(priority)) {
        return res.status(400).json({
          error: 'Некорректный приоритет. Допустимые значения: LOW, MEDIUM, HIGH, CRITICAL',
        });
      }

      const updatedRequest = await prisma.repairRequest.update({
        where: { id },
        data: {
          title,
          description,
          status,
          priority,
          equipmentId: equipmentId ? Number(equipmentId) : undefined,
          clientId: clientId ? Number(clientId) : undefined,
          assignedEngineerId: assignedEngineerId ? Number(assignedEngineerId) : null,
        },
        include: {
          equipment: true,
          client: true,
          assignedEngineer: true,
        },
      });

      res.json(updatedRequest);
    } catch (error) {
      console.error('Ошибка при обновлении заявки:', error);
      res.status(500).json({ error: 'Ошибка при обновлении заявки' });
    }
  }
);

// DELETE /repair-requests/:id - удалить заявку
router.delete(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Некорректный id заявки' });
      }

      const existingRequest = await prisma.repairRequest.findUnique({
        where: { id },
      });

      if (!existingRequest) {
        return res.status(404).json({ error: 'Заявка не найдена' });
      }

      await prisma.repairRequest.delete({
        where: { id },
      });

      res.json({ message: 'Заявка успешно удалена' });
    } catch (error) {
      console.error('Ошибка при удалении заявки:', error);
      res.status(500).json({ error: 'Ошибка при удалении заявки' });
    }
  }
);

// PATCH /repair-requests/:id/status - изменить только статус заявки
router.patch(
  '/:id/status',
  requireRole('ADMIN', 'MANAGER', 'ENGINEER'),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body || {};

      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Некорректный id заявки' });
      }

      if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Некорректный статус. Допустимые значения: NEW, IN_PROGRESS, COMPLETED, CANCELED',
        });
      }

      const existingRequest = await prisma.repairRequest.findUnique({
        where: { id },
      });

      if (!existingRequest) {
        return res.status(404).json({ error: 'Заявка не найдена' });
      }

      const updatedRequest = await prisma.repairRequest.update({
        where: { id },
        data: { status },
        include: {
          equipment: true,
          client: true,
          assignedEngineer: true,
        },
      });

      res.json(updatedRequest);
    } catch (error) {
      console.error('Ошибка при изменении статуса заявки:', error);
      res.status(500).json({ error: 'Ошибка при изменении статуса заявки' });
    }
  }
);

module.exports = router;