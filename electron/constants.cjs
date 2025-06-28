const { app } = require('electron');
const os = require('os');

// Сервер где хранятся релизы
const SERVER_URL = 'http://localhost:8000';

// Папка updates на сервере
const UPDATE_SERVER_URL = `${SERVER_URL}/updates`;

const WS_URL = 'ws://localhost:8000/ws';

const COMPUTER_NAME = os.hostname();
const APP_VERSION = require('../package.json').version;
const OS_INFO = `${os.type()} ${os.release()} ${os.arch()}`;

// Определяем isDev - проверяем, находимся ли мы в режиме разработки
const isDev = !app.isPackaged;

module.exports = {
  SERVER_URL,
  UPDATE_SERVER_URL,
  WS_URL,
  COMPUTER_NAME,
  APP_VERSION,
  OS_INFO,
  isDev,
};