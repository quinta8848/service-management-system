const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');

const allowedServiceStatuses = ['PLANNED', 'DONE', 'OVERDUE', 'CANCELED'];
const allowedServiceTypes = ['INSPECTION', 'MAINTENANCE', 'DIAGNOSTICS', 'REPAIR'];

// GET /service-events - получить все сервисные события
router.get('/', async (req, res) => {
  try {
    const { status, type } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const serviceEvents = await prisma.serviceEvent.findMany({
      where,
      include: {
        equipment: {
          include: {
            model: true,
            client: true,
          },
        },
        engineer: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    res.json(serviceEvents);
  } catch (error) {
    console.error('Ошибка при получении сервисных событий:', error);
    res.status(500).json({ error: 'Ошибка при получении сервисных событий' });
  }
});

// GET /service-events/:id - получить сервисное событие по id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный id сервисного события' });
    }

    const serviceEvent = await prisma.serviceEvent.findUnique({
      where: { id },
      include: {
        equipment: {
          include: {
            model: true,
            client: true,
          },
        },
        engineer: true,
      },
    });

    if (!serviceEvent) {
      return res.status(404).json({ error: 'Сервисное событие не найдено' });
    }

    res.json(serviceEvent);
  } catch (error) {
    console.error('Ошибка при получении сервисного события:', error);
    res.status(500).json({ error: 'Ошибка при получении сервисного события' });
  }
});

// POST /service-events - создать сервисное событие
router.post('/', async (req, res) => {
  try {
    const {
      type,
      status,
      plannedDate,
      completedDate,
      workDescription,
      result,
      equipmentId,
      engineerId,
    } = req.body || {};

    if (!type || !status || !plannedDate || !workDescription || !equipmentId) {
      return res.status(400).json({
        error: 'Обязательные поля: type, status, plannedDate, workDescription, equipmentId',
      });
    }

    if (!allowedServiceTypes.includes(type)) {
      return res.status(400).json({
        error: 'Некорректный type. Допустимые значения: INSPECTION, MAINTENANCE, DIAGNOSTICS, REPAIR',
      });
    }

    if (!allowedServiceStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Некорректный status. Допустимые значения: PLANNED, DONE, OVERDUE, CANCELED',
      });
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id: Number(equipmentId) },
    });

    if (!equipment) {
      return res.status(404).json({ error: 'Оборудование не найдено' });
    }

    if (engineerId) {
      const engineer = await prisma.user.findUnique({
        where: { id: Number(engineerId) },
      });

      if (!engineer) {
        return res.status(404).json({ error: 'Инженер не найден' });
      }
    }

    const newServiceEvent = await prisma.serviceEvent.create({
      data: {
        type,
        status,
        plannedDate: new Date(plannedDate),
        completedDate: completedDate ? new Date(completedDate) : null,
        workDescription,
        result: result || null,
        equipmentId: Number(equipmentId),
        engineerId: engineerId ? Number(engineerId) : null,
      },
      include: {
        equipment: {
          include: {
            model: true,
            client: true,
          },
        },
        engineer: true,
      },
    });

    res.status(201).json(newServiceEvent);
  } catch (error) {
    console.error('Ошибка при создании сервисного события:', error);
    res.status(500).json({ error: 'Ошибка при создании сервисного события' });
  }
});

// PUT /service-events/:id - обновить сервисное событие
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный id сервисного события' });
    }

    const {
      type,
      status,
      plannedDate,
      completedDate,
      workDescription,
      result,
      equipmentId,
      engineerId,
    } = req.body || {};

    const existingServiceEvent = await prisma.serviceEvent.findUnique({
      where: { id },
    });

    if (!existingServiceEvent) {
      return res.status(404).json({ error: 'Сервисное событие не найдено' });
    }

    if (type && !allowedServiceTypes.includes(type)) {
      return res.status(400).json({
        error: 'Некорректный type. Допустимые значения: INSPECTION, MAINTENANCE, DIAGNOSTICS, REPAIR',
      });
    }

    if (status && !allowedServiceStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Некорректный status. Допустимые значения: PLANNED, DONE, OVERDUE, CANCELED',
      });
    }

    if (equipmentId) {
      const equipment = await prisma.equipment.findUnique({
        where: { id: Number(equipmentId) },
      });

      if (!equipment) {
        return res.status(404).json({ error: 'Оборудование не найдено' });
      }
    }

    if (engineerId) {
      const engineer = await prisma.user.findUnique({
        where: { id: Number(engineerId) },
      });

      if (!engineer) {
        return res.status(404).json({ error: 'Инженер не найден' });
      }
    }

    const updatedServiceEvent = await prisma.serviceEvent.update({
      where: { id },
      data: {
        type,
        status,
        plannedDate: plannedDate ? new Date(plannedDate) : undefined,
        completedDate: completedDate ? new Date(completedDate) : null,
        workDescription,
        result: result !== undefined ? result : undefined,
        equipmentId: equipmentId ? Number(equipmentId) : undefined,
        engineerId: engineerId ? Number(engineerId) : null,
      },
      include: {
        equipment: {
          include: {
            model: true,
            client: true,
          },
        },
        engineer: true,
      },
    });

    res.json(updatedServiceEvent);
  } catch (error) {
    console.error('Ошибка при обновлении сервисного события:', error);
    res.status(500).json({ error: 'Ошибка при обновлении сервисного события' });
  }
});

// DELETE /service-events/:id - удалить сервисное событие
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный id сервисного события' });
    }

    const existingServiceEvent = await prisma.serviceEvent.findUnique({
      where: { id },
    });

    if (!existingServiceEvent) {
      return res.status(404).json({ error: 'Сервисное событие не найдено' });
    }

    await prisma.serviceEvent.delete({
      where: { id },
    });

    res.json({ message: 'Сервисное событие успешно удалено' });
  } catch (error) {
    console.error('Ошибка при удалении сервисного события:', error);
    res.status(500).json({ error: 'Ошибка при удалении сервисного события' });
  }
});

// PATCH /service-events/:id/status - изменить только статус сервисного события
router.patch('/:id/status', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный id сервисного события' });
    }

    if (!status || !allowedServiceStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Некорректный status. Допустимые значения: PLANNED, DONE, OVERDUE, CANCELED',
      });
    }

    const existingServiceEvent = await prisma.serviceEvent.findUnique({
      where: { id },
    });

    if (!existingServiceEvent) {
      return res.status(404).json({ error: 'Сервисное событие не найдено' });
    }

    const updatedServiceEvent = await prisma.serviceEvent.update({
      where: { id },
      data: { status },
      include: {
        equipment: {
          include: {
            model: true,
            client: true,
          },
        },
        engineer: true,
      },
    });

    res.json(updatedServiceEvent);
  } catch (error) {
    console.error('Ошибка при изменении статуса сервисного события:', error);
    res.status(500).json({ error: 'Ошибка при изменении статуса сервисного события' });
  }
});

module.exports = router;