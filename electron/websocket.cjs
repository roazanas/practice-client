const { app } = require('electron');
const WebSocket = require('ws');
const Logger = require('./logger.cjs');
const { WS_URL, COMPUTER_NAME } = require('./constants.cjs');
const { checkForUpdates } = require('./updater.cjs'); // Для 'force_update'

let reconnectInterval = null;

function connectWebSocket() {
  try {
    ws = new WebSocket(WS_URL);
    app.ws = ws;

    ws.on('open', () => {
      Logger.info('WebSocket connected to server');
      
      const regMsg = JSON.stringify({ 
        type: 'register', 
        computer_name: COMPUTER_NAME 
      });
      console.log('Register message:', regMsg);
      ws.send(regMsg);

      // Если удалось подключиться, то прекращаем переподключение
      clearInterval(reconnectInterval);

      // Поддерживаем соединение с сервером, отправляя heartbeat каждые 30 сек
      setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
        }
      }, 30 * 1000);
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
            // Heartbeat 
            break;
          default:
            Logger.info(`Received unknown message type: ${message.type}`);
        }
      } catch (error) {
        Logger.error(`Error processing WebSocket message: ${error.message}`);
      }
    });

    ws.on('close', () => {
      Logger.warn('WebSocket connection closed, attempting to reconnect...');
      scheduleReconnect();
    });

    ws.on('error', (error) => {
      Logger.error(`WebSocket error: ${error.message}`);
      scheduleReconnect();
    });
  } catch (error) {
    Logger.error(`Failed to connect WebSocket: ${error.message}`);
    scheduleReconnect();
  }
}

// Вызывается в случае, если не удаётся подключиться к WebSocket
function scheduleReconnect() {
  if (reconnectInterval) return;

  reconnectInterval = setInterval(() => {
    Logger.info('Attempting to reconnect WebSocket...');
    connectWebSocket();
  }, 10 * 1000);
}

module.exports = {
  connectWebSocket
};
