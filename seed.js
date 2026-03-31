const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Очистка базы...');

  await prisma.serviceEvent.deleteMany();
  await prisma.repairRequest.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.equipmentModel.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  console.log('Создание пользователей...');

  const admin = await prisma.user.create({
    data: {
      name: 'Администратор системы',
      email: 'admin@example.com',
      passwordHash: 'admin123hash',
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Менеджер по работе с клиентами',
      email: 'manager@example.com',
      passwordHash: 'manager123hash',
      role: 'MANAGER',
    },
  });

  const engineer1 = await prisma.user.create({
    data: {
      name: 'Инженер Сергей Петров',
      email: 'engineer1@example.com',
      passwordHash: 'engineer123hash',
      role: 'ENGINEER',
    },
  });

  const engineer2 = await prisma.user.create({
    data: {
      name: 'Инженер Алексей Смирнов',
      email: 'engineer2@example.com',
      passwordHash: 'engineer223hash',
      role: 'ENGINEER',
    },
  });

  console.log('Создание клиентов...');

  const client1 = await prisma.client.create({
    data: {
      companyName: 'ООО РобоТех',
      contactPerson: 'Иван Иванов',
      phone: '+7 999 111-11-11',
      email: 'robotex@example.com',
      address: 'Москва, ул. Технологическая, 15',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      companyName: 'АО ПромАвтоматика',
      contactPerson: 'Петр Соколов',
      phone: '+7 999 222-22-22',
      email: 'promauto@example.com',
      address: 'Санкт-Петербург, пр. Индустриальный, 48',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      companyName: 'ЗАО Инжиниринг Системс',
      contactPerson: 'Анна Кузнецова',
      phone: '+7 999 333-33-33',
      email: 'engsystems@example.com',
      address: 'Екатеринбург, ул. Заводская, 101',
    },
  });

  console.log('Создание моделей оборудования...');

  const model1 = await prisma.equipmentModel.create({
    data: {
      name: 'M-20iD/25',
      manufacturer: 'FANUC',
      category: 'Промышленный робот-манипулятор',
      payloadCapacity: 25,
      reach: 1831,
      description: '6-осевой промышленный робот для автоматизации производственных линий.',
    },
  });

  const model2 = await prisma.equipmentModel.create({
    data: {
      name: 'KR 10 R1100',
      manufacturer: 'KUKA',
      category: 'Компактный промышленный робот',
      payloadCapacity: 10,
      reach: 1101,
      description: 'Компактный робот для высокоточных операций.',
    },
  });

  const model3 = await prisma.equipmentModel.create({
    data: {
      name: 'IRB 120',
      manufacturer: 'ABB',
      category: 'Компактный робот',
      payloadCapacity: 3,
      reach: 580,
      description: 'Робот для сборки, тестирования и точных операций.',
    },
  });

  console.log('Создание единиц оборудования...');

  const equipment1 = await prisma.equipment.create({
    data: {
      inventoryNumber: 'INV-001',
      serialNumber: 'SN-FANUC-001',
      status: 'AVAILABLE',
      location: 'Склад №1, Москва',
      purchaseDate: new Date('2023-03-10'),
      commissioningDate: new Date('2023-03-20'),
      notes: 'Новое оборудование, готово к отгрузке.',
      modelId: model1.id,
      clientId: client1.id,
    },
  });

  const equipment2 = await prisma.equipment.create({
    data: {
      inventoryNumber: 'INV-002',
      serialNumber: 'SN-KUKA-001',
      status: 'RENTED',
      location: 'Производственный цех клиента',
      purchaseDate: new Date('2022-11-05'),
      commissioningDate: new Date('2022-11-15'),
      notes: 'Находится в аренде у клиента.',
      modelId: model2.id,
      clientId: client2.id,
    },
  });

  const equipment3 = await prisma.equipment.create({
    data: {
      inventoryNumber: 'INV-003',
      serialNumber: 'SN-ABB-001',
      status: 'BROKEN',
      location: 'Сервисный центр',
      purchaseDate: new Date('2021-07-18'),
      commissioningDate: new Date('2021-07-25'),
      notes: 'Доставлен в сервисный центр для диагностики.',
      modelId: model3.id,
      clientId: client3.id,
    },
  });

  const equipment4 = await prisma.equipment.create({
    data: {
      inventoryNumber: 'INV-004',
      serialNumber: 'SN-FANUC-002',
      status: 'IN_SERVICE',
      location: 'Сервисная зона, Москва',
      purchaseDate: new Date('2022-08-12'),
      commissioningDate: new Date('2022-08-22'),
      notes: 'Проходит плановое техническое обслуживание.',
      modelId: model1.id,
      clientId: client1.id,
    },
  });

  console.log('Создание заявок на ремонт...');

  const repair1 = await prisma.repairRequest.create({
    data: {
      title: 'Неисправность привода оси',
      description: 'Во время работы замечены рывки и нестабильное движение по оси X.',
      status: 'NEW',
      priority: 'HIGH',
      equipmentId: equipment3.id,
      clientId: client3.id,
      assignedEngineerId: engineer1.id,
    },
  });

  const repair2 = await prisma.repairRequest.create({
    data: {
      title: 'Ошибка контроллера',
      description: 'Контроллер периодически выдаёт ошибку связи с исполнительными механизмами.',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      equipmentId: equipment2.id,
      clientId: client2.id,
      assignedEngineerId: engineer2.id,
    },
  });

  const repair3 = await prisma.repairRequest.create({
    data: {
      title: 'Шум в редукторе',
      description: 'Во время цикла работы появился посторонний шум в районе редуктора.',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      equipmentId: equipment4.id,
      clientId: client1.id,
      assignedEngineerId: engineer1.id,
    },
  });

  console.log('Создание сервисных событий...');

  await prisma.serviceEvent.create({
    data: {
      type: 'MAINTENANCE',
      status: 'PLANNED',
      plannedDate: new Date('2026-04-15'),
      completedDate: null,
      workDescription: 'Плановое техническое обслуживание: проверка узлов, смазка, тестирование.',
      result: null,
      equipmentId: equipment1.id,
      engineerId: engineer1.id,
    },
  });

  await prisma.serviceEvent.create({
    data: {
      type: 'DIAGNOSTICS',
      status: 'DONE',
      plannedDate: new Date('2026-03-20'),
      completedDate: new Date('2026-03-21'),
      workDescription: 'Диагностика оборудования после жалобы на нестабильную работу.',
      result: 'Обнаружен износ соединительного кабеля, рекомендована замена.',
      equipmentId: equipment3.id,
      engineerId: engineer2.id,
    },
  });

  await prisma.serviceEvent.create({
    data: {
      type: 'REPAIR',
      status: 'DONE',
      plannedDate: new Date('2026-03-10'),
      completedDate: new Date('2026-03-12'),
      workDescription: 'Замена изношенного редуктора и повторная калибровка.',
      result: 'Работоспособность оборудования восстановлена.',
      equipmentId: equipment4.id,
      engineerId: engineer1.id,
    },
  });

  await prisma.serviceEvent.create({
    data: {
      type: 'INSPECTION',
      status: 'OVERDUE',
      plannedDate: new Date('2026-03-01'),
      completedDate: null,
      workDescription: 'Плановый осмотр перед продлением аренды.',
      result: null,
      equipmentId: equipment2.id,
      engineerId: engineer2.id,
    },
  });

  console.log('База успешно заполнена.');
  console.log({
    users: [admin.email, manager.email, engineer1.email, engineer2.email],
    clients: [client1.companyName, client2.companyName, client3.companyName],
    equipment: [
      equipment1.inventoryNumber,
      equipment2.inventoryNumber,
      equipment3.inventoryNumber,
      equipment4.inventoryNumber,
    ],
    repairRequests: [repair1.title, repair2.title, repair3.title],
  });
}

main()
  .catch((e) => {
    console.error('Ошибка при заполнении базы:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });