const fs = require('fs');
const path = require('path');

const files = [
  'public/client-portal.html',
  'public/equipment.html',
  'public/clients.html',
  'public/repair-requests.html',
  'public/service-events.html',
  'public/users.html',
];

const PATCH_ID = '/* === ServiceMS layout fixes: footer + user panel === */';

const cssPatch = `

${PATCH_ID}
html,
body {
  min-height: 100%;
}

body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main,
.page,
.section,
.content,
.dashboard-page {
  flex: 1 0 auto;
}

.footer {
  margin-top: auto !important;
}

.topbar {
  overflow: hidden;
}

.topbar-inner {
  min-width: 0;
}

.logo,
.brand {
  flex-shrink: 0;
  min-width: 0;
}

.nav {
  min-width: 0;
}

.nav a,
.nav button {
  white-space: nowrap;
}

.user-panel {
  min-width: 0;
  max-width: 360px;
  overflow: hidden;
  flex-shrink: 0;
}

#userInfo,
#currentUserInfo,
.user-info {
  display: block;
  min-width: 0;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  flex-shrink: 0;
}

/* Личный кабинет клиента: сетка шапки с учетом длинного имени пользователя */
.topbar-inner {
  grid-template-columns: 200px minmax(0, 1fr) minmax(220px, 320px);
}

.user-panel #currentUserInfo,
.user-panel #userInfo {
  flex: 1 1 auto;
}

@media (max-width: 1100px) {
  .topbar {
    overflow: visible;
  }

  .topbar-inner {
    grid-template-columns: 1fr !important;
  }

  .user-panel {
    width: 100%;
    max-width: none;
    justify-content: space-between;
  }

  #userInfo,
  #currentUserInfo,
  .user-info {
    max-width: calc(100vw - 150px);
  }
}
/* === /ServiceMS layout fixes === */
`;

function patchFile(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    console.log(`SKIP: ${filePath} не найден`);
    return;
  }

  let html = fs.readFileSync(absolutePath, 'utf8');

  if (html.includes(PATCH_ID)) {
    console.log(`OK: ${filePath} уже содержит layout fixes`);
    return;
  }

  const styleCloseIndex = html.lastIndexOf('</style>');

  if (styleCloseIndex === -1) {
    console.log(`SKIP: ${filePath} — не найден </style>`);
    return;
  }

  const backupPath = `${absolutePath}.bak`;

  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, html, 'utf8');
  }

  html = html.slice(0, styleCloseIndex) + cssPatch + '\n' + html.slice(styleCloseIndex);
  fs.writeFileSync(absolutePath, html, 'utf8');

  console.log(`PATCHED: ${filePath}`);
}

console.log('Применяю правки layout для ServiceMS...');
files.forEach(patchFile);
console.log('\nГотово. Обнови страницы в браузере через Ctrl + F5.');
