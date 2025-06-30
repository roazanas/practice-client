const { app, Notification, dialog } = require('electron'); //, autoUpdater
const { autoUpdater } = require('electron-updater');  // <-- вот так
const WebSocket = require('ws');
const Logger = require('./logger.cjs');
const { COMPUTER_NAME, APP_VERSION, isDev } = require('./constants.cjs');

class UpdateStatusManager {
  static async updateStatus(status, progress = 0, targetVersion = null) {
    const statusData = {
      computer_name: COMPUTER_NAME,
      current_version: APP_VERSION,
      target_version: targetVersion || APP_VERSION,
      status: status,
      progress: progress
    };

    // try {
    //   await axios.post(`${SERVER_URL}/api/update-status`, statusData);
    // } catch (error) {
    //   Logger.error(`Failed to update status: ${error.message}`);
    // }

    // Отправка через WebSocket
    if (app.ws && app.ws.readyState === WebSocket.OPEN) {
      app.ws.send(JSON.stringify({
        type: 'update_status',
        data: statusData
      }));
    }
  }
}


// События автообновления
autoUpdater.on('checking-for-update', async () => {
  Logger.info('Checking for updates...');
  await UpdateStatusManager.updateStatus('checking');
});

autoUpdater.on('update-available', async (info) => {
  Logger.info(`Update available: ${info.version}`);
  await UpdateStatusManager.updateStatus('downloading', 0, info.version);

  // Показать уведомление пользователю
  if (Notification.isSupported()) {
    new Notification({
      title: 'Обновление доступно',
      body: `Загружается версия ${info.version}...`
    }).show();
  }
});

autoUpdater.on('update-not-available', async (info) => {
  Logger.info('No updates available');
  await UpdateStatusManager.updateStatus('up_to_date');
});

autoUpdater.on('error', async (err) => {
  Logger.error(`Auto-updater error: ${err.message}`);
  await UpdateStatusManager.updateStatus('error');
});

autoUpdater.on('download-progress', async (progressObj) => {
  const percent = Math.round(progressObj.percent);
  Logger.info(`Download progress: ${percent}% (${progressObj.transferred}/${progressObj.total})`);
  await UpdateStatusManager.updateStatus('downloading', percent);
});

autoUpdater.on('update-downloaded', async (info) => {
  Logger.info(`Update downloaded: ${info.version}`);
  await UpdateStatusManager.updateStatus('installing', 100, info.version);

  // Показать диалог пользователю
  const response = await dialog.showMessageBox({
    type: 'info',
    title: 'Обновление загружено',
    message: `Версия ${info.version} готова к установке. Перезапустить приложение сейчас?`,
    buttons: ['Перезапустить', 'Позже'],
    defaultId: 0
  });

  if (response.response === 0) {
    Logger.info('User chose to restart and install update');
    autoUpdater.quitAndInstall();
  } else {
    Logger.info('User chose to install update later');
  }
});

// Проверка обновлений
async function checkForUpdates() {
  try {
    // if (isDev) {
    //   Logger.info('Development mode - skipping update check');
    //   return;
    // }

    await autoUpdater.checkForUpdatesAndNotify();
  } catch (error) {
    Logger.error(`Failed to check for updates: ${error.message}`);
  }
}

module.exports = {
  UpdateStatusManager,
  checkForUpdates
};
