const express = require('express');

const equipmentRoutes = require('./routes/equipment.routes');
const clientsRoutes = require('./routes/clients.routes');
const repairRoutes = require('./routes/repair.routes');
const serviceRoutes = require('./routes/service.routes');
const usersRoutes = require('./routes/users.routes');
const authRoutes = require('./routes/auth.routes');
const clientPortalRoutes = require('./routes/clientPortal.routes');

const app = express();
const PORT = 8848;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.use('/equipment', equipmentRoutes);
app.use('/clients', clientsRoutes);
app.use('/repair-requests', repairRoutes);
app.use('/service-events', serviceRoutes);
app.use('/users', usersRoutes);
app.use('/auth', authRoutes);
app.use('/client-portal', clientPortalRoutes);

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});