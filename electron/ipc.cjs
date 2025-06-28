const { ipcMain } = require('electron');
const Logger = require('./logger.cjs');
const { APP_VERSION, COMPUTER_NAME, OS_INFO } = require('./constants.cjs');
const { checkForUpdates } = require('./updater.cjs');

ipcMain.handle('get-app-version', () => APP_VERSION);
ipcMain.handle('get-computer-name', () => COMPUTER_NAME);
ipcMain.handle('get-os-info', () => OS_INFO);

// ipcMain.handle('save-auth', (event, authData) => {
//   AuthCache.save(authData);
// });

// ipcMain.handle('load-auth', () => {
//   return AuthCache.load();
// });

// ipcMain.handle('clear-auth', () => {
//   AuthCache.clear();
// });

ipcMain.handle('check-updates', async () => {
  await checkForUpdates();
});

ipcMain.handle('log', async (event, level, message) => {
  await Logger.log(level, message);
});
