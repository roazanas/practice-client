const { app, BrowserWindow } = require('electron');
const path = require('path');

// Определяем isDev - проверяем, находимся ли мы в режиме разработки
const isDev = !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Убираем меню
    autoHideMenuBar: true,
  });

  // Обработка ошибок загрузки для отладки
  mainWindow.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Failed to load:', errorCode, errorDescription);
  });

  if (isDev) {
    // В режиме разработки загружаем с dev сервера
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // В продакшене загружаем собранные файлы
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading from:', indexPath); // для отладки
    mainWindow.loadFile(indexPath);
    
    // Временно включить DevTools для отладки в продакшене
    // mainWindow.webContents.openDevTools();
  }

  // Обработка готовности контента
  mainWindow.webContents.once('ready-to-show', () => {
    console.log('Window ready to show');
  });
  
  // Показываем окно сразу
  mainWindow.show();
}

// Обработчики событий приложения
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Обработка ошибок приложения
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});