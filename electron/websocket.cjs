const { app, ipcMain } = require('electron');
const WebSocket = require('ws');
const Logger = require('./logger.cjs');
const { WS_URL, COMPUTER_NAME } = require('./constants.cjs');
const { checkForUpdates } = require('./updater.cjs');

let ws = null;
let reconnectInterval = null;
let heartbeatInterval = null;

// Функция которая триггерит все события(events) которые мы прописали в preload.cjs (ipcRenderer.on)
// Триггерит события она в ws.on('message')
function notifyRenderer(channel, data = null) {
  const allWindows = require('electron').BrowserWindow.getAllWindows();
  allWindows.forEach(window => {
    if (window && !window.isDestroyed()) {
      window.webContents.send(channel, data);
    }
  });
}

function startHeartbeat() {
  stopHeartbeat(); // Убеждаемся что предыдущий интервал очищен
  
  heartbeatInterval = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'heartbeat' }));
    }
  }, 30 * 1000);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

function scheduleReconnect() {
  if (reconnectInterval) return;
  
  reconnectInterval = setInterval(() => {
    Logger.info('Attempting to reconnect WebSocket...');
    connectWebSocket();
  }, 10 * 1000);
}

function connectWebSocket() {
  try {
    // Закрываем существующее соединение если есть
    if (ws) {
      ws.close();
      ws = null;
    }

    ws = new WebSocket(WS_URL);
    app.ws = ws;

    ws.on('open', () => {
      Logger.info('WebSocket connected to server');
     
      // Регистрируем хост
      const regMsg = JSON.stringify({
        type: 'register_host',
        computer_name: COMPUTER_NAME
      });
      console.log('Register host message:', regMsg);
      ws.send(regMsg);

      // Очищаем интервал переподключения
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }

      // Запускаем heartbeat
      startHeartbeat();

      // Уведомляем renderer процесс о подключении
      notifyRenderer('websocket-connected');
    });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'force_update':
            Logger.info('Received force update command from server');
            await checkForUpdates();
            break;

          case 'heartbeat_ack':
            break;

          case 'auth':
            notifyRenderer('auth-response', message);
            break;

          case 'registration':
            notifyRenderer('registration-response', message);
            break;

          default:
            Logger.info(`Received unknown message type: ${message.type}`);
            notifyRenderer('websocket-message', message);
        }

      } catch (error) {
        Logger.error(`Error processing WebSocket message: ${error.message}`);
      }
    });


    ws.on('close', () => {
      Logger.warn('WebSocket connection closed, attempting to reconnect...');
      stopHeartbeat();
      notifyRenderer('websocket-disconnected');
      scheduleReconnect();
    });

    ws.on('error', (error) => {
      Logger.error(`WebSocket error: ${error.message}`);
      stopHeartbeat();
      notifyRenderer('websocket-error', { error: error.message });
      scheduleReconnect();
    });

  } catch (error) {
    Logger.error(`Failed to connect WebSocket: ${error.message}`);
    scheduleReconnect();
  }
}

// IPC обработчики для взаимодействия с renderer процессом
ipcMain.handle('websocket-send', (event, data) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
    return { success: true };
  }
  return { success: false, error: 'WebSocket not connected' };
});

ipcMain.handle('websocket-status', () => {
  return {
    connected: ws && ws.readyState === WebSocket.OPEN,
    readyState: ws ? ws.readyState : WebSocket.CLOSED
  };
});

// Функция отправки сообщения (для использования в main процессе)
function sendMessage(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    return true;
  }
  return false;
}

// Закрытие соединения при выключении приложения
function disconnect() {
  stopHeartbeat();
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
}

module.exports = {
  connectWebSocket,
  scheduleReconnect,
  sendMessage,
  disconnect
};