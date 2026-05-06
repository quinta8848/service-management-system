const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

function checkClientAccess(req, res, next) {
  if (!req.user.clientId) {
    return res.status(403).json({
      error: 'Пользователь не привязан к клиентской организации',
    });
  }

  next();
}

// GET /client-portal/equipment
// Получить оборудование только своей организации
router.get(
  '/equipment',
  authenticateToken,
  requireRole('CLIENT'),
  checkClientAccess,
  async (req, res) => {
    try {
      const equipment = await prisma.equipment.findMany({
        where: {
          clientId: req.user.clientId,
        },
        include: {
          model: true,
          client: true,
          repairRequests: true,
          serviceEvents: true,
        },
        orderBy: {
          id: 'asc',
        },
      });

      res.json(equipment);
    } catch (error) {
      console.error('Ошибка при получении оборудования клиента:', error);
      res.status(500).json({
        error: 'Ошибка при получении оборудования клиента',
      });
    }
  }
);

// GET /client-portal/repair-requests
// Получить заявки только своей организации
router.get(
  '/repair-requests',
  authenticateToken,
  requireRole('CLIENT'),
  checkClientAccess,
  async (req, res) => {
    try {
      const repairRequests = await prisma.repairRequest.findMany({
        where: {
          clientId: req.user.clientId,
        },
        include: {
          equipment: {
            include: {
              model: true,
            },
          },
          client: true,
          assignedEngineer: true,
        },
        orderBy: {
          id: 'asc',
        },
      });

      res.json(repairRequests);
    } catch (error) {
      console.error('Ошибка при получении заявок клиента:', error);
      res.status(500).json({
        error: 'Ошибка при получении заявок клиента',
      });
    }
  }
);

// GET /client-portal/service-events
// Получить сервисные события только по оборудованию своей организации
router.get(
  '/service-events',
  authenticateToken,
  requireRole('CLIENT'),
  checkClientAccess,
  async (req, res) => {
    try {
      const serviceEvents = await prisma.serviceEvent.findMany({
        where: {
          equipment: {
            clientId: req.user.clientId,
          },
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
        orderBy: {
          id: 'asc',
        },
      });

      res.json(serviceEvents);
    } catch (error) {
      console.error('Ошибка при получении сервисных событий клиента:', error);
      res.status(500).json({
        error: 'Ошибка при получении сервисных событий клиента',
      });
    }
  }
);

// POST /client-portal/repair-requests
// Клиент создаёт заявку только по своему оборудованию
router.post(
  '/repair-requests',
  authenticateToken,
  requireRole('CLIENT'),
  checkClientAccess,
  async (req, res) => {
    try {
      const {
        title,
        description,
        priority,
        equipmentId,
      } = req.body || {};

      if (!title || !description || !equipmentId) {
        return res.status(400).json({
          error: 'Обязательные поля: title, description, equipmentId',
        });
      }

      const equipment = await prisma.equipment.findUnique({
        where: {
          id: Number(equipmentId),
        },
      });

      if (!equipment) {
        return res.status(404).json({
          error: 'Оборудование не найдено',
        });
      }

      if (equipment.clientId !== req.user.clientId) {
        return res.status(403).json({
          error: 'Нельзя создать заявку по чужому оборудованию',
        });
      }

      const repairRequest = await prisma.repairRequest.create({
        data: {
          title,
          description,
          priority: priority || 'MEDIUM',
          status: 'NEW',
          equipmentId: Number(equipmentId),
          clientId: req.user.clientId,
          assignedEngineerId: null,
        },
        include: {
          equipment: {
            include: {
              model: true,
            },
          },
          client: true,
          assignedEngineer: true,
        },
      });

      res.status(201).json(repairRequest);
    } catch (error) {
      console.error('Ошибка при создании заявки клиентом:', error);
      res.status(500).json({
        error: 'Ошибка при создании заявки клиентом',
      });
    }
  }
);

module.exports = router;