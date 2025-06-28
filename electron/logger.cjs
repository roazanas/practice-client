const { app } = require('electron');
const WebSocket = require('ws');
const { COMPUTER_NAME, APP_VERSION, OS_INFO } = require('./constants.cjs');

class Logger {
  static async log(level, message) {
    const logEntry = {
      computer_name: COMPUTER_NAME,
      app_version: APP_VERSION,
      os_info: OS_INFO,
      log_level: level,
      message: message
    };

    // Локальное логирование
    console.log(`[${level}] ${message}`);

    // Отправка на сервер
    if (app.ws && app.ws.readyState === WebSocket.OPEN) {
      try {
        app.ws.send(JSON.stringify({
          type: 'log',
          data: logEntry
        }));
      } catch (err) {
        console.error('Failed to send log over WebSocket:', err.message);
      }
    } else {
      console.warn('WebSocket not connected. Log not sent to server.');
    }
  }

  static info(message) { this.log('INFO', message); }
  static warn(message) { this.log('WARN', message); }
  static error(message) { this.log('ERROR', message); }
}

module.exports = Logger;
