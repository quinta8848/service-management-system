const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /equipment - получить всё оборудование
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          inventoryNumber: {
            contains: search,
          },
        },
        {
          serialNumber: {
            contains: search,
          },
        },
      ];
    }

    const equipment = await prisma.equipment.findMany({
      where,
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
    console.error('Ошибка при получении оборудования:', error);
    res.status(500).json({ error: 'Ошибка при получении оборудования' });
  }
});

// GET /equipment/:id - получить оборудование по id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный id оборудования' });
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        model: true,
        client: true,
        repairRequests: true,
        serviceEvents: true,
      },
    });

    if (!equipment) {
      return res.status(404).json({ error: 'Оборудование не найдено' });
    }

    res.json(equipment);
  } catch (error) {
    console.error('Ошибка при получении оборудования:', error);
    res.status(500).json({ error: 'Ошибка при получении оборудования' });
  }
});

// POST /equipment - создать новую единицу оборудования
router.post('/', async (req, res) => {
  try {
    const {
      inventoryNumber,
      serialNumber,
      status,
      location,
      purchaseDate,
      commissioningDate,
      notes,
      modelId,
      clientId,
    } = req.body;

    if (!inventoryNumber || !serialNumber || !modelId) {
      return res.status(400).json({
        error: 'Обязательные поля: inventoryNumber, serialNumber, modelId',
      });
    }

    const newEquipment = await prisma.equipment.create({
      data: {
        inventoryNumber,
        serialNumber,
        status,
        location,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        commissioningDate: commissioningDate ? new Date(commissioningDate) : null,
        notes,
        modelId: Number(modelId),
        clientId: clientId ? Number(clientId) : null,
      },
      include: {
        model: true,
        client: true,
      },
    });

    res.status(201).json(newEquipment);
  } catch (error) {
    console.error('Ошибка при создании оборудования:', error);
    res.status(500).json({ error: 'Ошибка при создании оборудования' });
  }
});

// PUT /equipment/:id - обновить оборудование
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный id оборудования' });
    }

    const {
      inventoryNumber,
      serialNumber,
      status,
      location,
      purchaseDate,
      commissioningDate,
      notes,
      modelId,
      clientId,
    } = req.body;

    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!existingEquipment) {
      return res.status(404).json({ error: 'Оборудование не найдено' });
    }

    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: {
        inventoryNumber,
        serialNumber,
        status,
        location,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        commissioningDate: commissioningDate ? new Date(commissioningDate) : null,
        notes,
        modelId: modelId ? Number(modelId) : undefined,
        clientId: clientId ? Number(clientId) : null,
      },
      include: {
        model: true,
        client: true,
      },
    });

    res.json(updatedEquipment);
  } catch (error) {
    console.error('Ошибка при обновлении оборудования:', error);
    res.status(500).json({ error: 'Ошибка при обновлении оборудования' });
  }
});

// DELETE /equipment/:id - удалить оборудование
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный id оборудования' });
    }

    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        repairRequests: true,
        serviceEvents: true,
      },
    });

    if (!existingEquipment) {
      return res.status(404).json({ error: 'Оборудование не найдено' });
    }

    await prisma.$transaction([
      prisma.repairRequest.deleteMany({
        where: { equipmentId: id },
      }),
      prisma.serviceEvent.deleteMany({
        where: { equipmentId: id },
      }),
      prisma.equipment.delete({
        where: { id },
      }),
    ]);

    res.json({ message: 'Оборудование и связанные записи успешно удалены' });
  } catch (error) {
    console.error('Ошибка при удалении оборудования:', error);
    res.status(500).json({ error: 'Ошибка при удалении оборудования' });
  }
});

module.exports = router;