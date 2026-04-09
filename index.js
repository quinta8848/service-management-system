const express = require('express');
const equipmentRoutes = require('./routes/equipment.routes');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Service Management System работает');
});

// подключаем маршруты оборудования
app.use('/equipment', equipmentRoutes);

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});