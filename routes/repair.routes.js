const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /repair-requests - получить все заявки
router.get('/', async (req, res) => {
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
});

// GET /repair-requests/:id - получить заявку по id
router.get('/:id', async (req, res) => {
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
});

// POST /repair-requests - создать заявку
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      equipmentId,
      clientId,
      assignedEngineerId,
    } = req.body;

    if (!title || !description || !equipmentId || !clientId) {
      return res.status(400).json({
        error: 'Обязательные поля: title, description, equipmentId, clientId',
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
});

// PUT /repair-requests/:id - обновить заявку
router.put('/:id', async (req, res) => {
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
      assignedEngineerId,
    } = req.body;

    const existingRequest = await prisma.repairRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    const updatedRequest = await prisma.repairRequest.update({
      where: { id },
      data: {
        title,
        description,
        status,
        priority,
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
});

// DELETE /repair-requests/:id - удалить заявку
router.delete('/:id', async (req, res) => {
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
});

// PATCH /repair-requests/:id/status - изменить только статус заявки
router.patch('/:id/status', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный id заявки' });
    }

    const allowedStatuses = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'];

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
});

module.exports = router;