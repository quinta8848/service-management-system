const express = require('express');
const app = express();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Service Management System работает');
});

app.listen(3000, () => {
    console.log('Сервер запущен на http://localhost:3000');
});

app.get('/equipment', async (req, res) => {
    const data = await prisma.equipment.findMany();
    res.json(data);
});