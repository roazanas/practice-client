<script>
// @ts-nocheck

  import { auth } from '../store.js';
  import Version from './Version.svelte';
  import { push } from 'svelte-spa-router';
  import { onMount, onDestroy } from 'svelte';

  let login = '';
  let password = '';
  let isLoading = false;
  let isConnected = false;

  // Функция логирования
  function logSomething(lvl, msg) {
    window.electronAPI.sendLog(lvl, msg);
  }

  // Обработчики событий
  function handleAuthResponse(event, data) {
    isLoading = false;
    if (data && data.success) {
      auth.login();
      push('/');
    } else {
      alert('Неверный логин или пароль');
    }
  }

  function handleConnected() {
    isConnected = true;
    logSomething('INFO', 'WebSocket connected');
  }

  function handleDisconnected() {
    isConnected = false;
    isLoading = false;
    logSomething('WARN', 'WebSocket disconnected');
  }

  function handleError(event, data) {
    isConnected = false;
    isLoading = false;
    logSomething('ERROR', `WebSocket error: ${data?.error || 'Unknown error'}`);
  }

  // Подписываемся на события при монтировании
  onMount(async () => {
    // Проверяем текущий статус подключения
    const status = await window.electronAPI.websocketStatus();
    isConnected = status.connected;

    // Подписываемся на события
    window.electronAPI.onWebSocketConnected(handleConnected);
    window.electronAPI.onWebSocketDisconnected(handleDisconnected);
    window.electronAPI.onWebSocketError(handleError);
    window.electronAPI.onAuthResponse(handleAuthResponse);
  });

  // Отписываемся при размонтировании
  onDestroy(() => {
    window.electronAPI.removeWebSocketListeners('websocket-connected');
    window.electronAPI.removeWebSocketListeners('websocket-disconnected');
    window.electronAPI.removeWebSocketListeners('websocket-error');
    window.electronAPI.removeWebSocketListeners('auth-response');
  });

  async function applyLogin(event) {
    event.preventDefault();
    
    if (!login || !password) {
      alert('Заполните все поля');
      return;
    }

    isLoading = true;

    // Отправляем запрос аутентификации через main процесс
    const result = await window.electronAPI.websocketSend({
      type: 'auth',
      login,
      password
    });

    if (!result.success) {
      isLoading = false;
      alert('Ошибка подключения к серверу');
      logSomething('ERROR', result.error || 'Failed to send auth request');
    }
    // Ответ придет через событие 'auth-response'
  }

  function goToRegister() {
    push('/register');
  }
</script>

<h1 id="login-text">Login form</h1>
<div class="login-form">
    <form onsubmit="{applyLogin}">
        <div class="label-input">
            <label for="login" class="input-label">Login</label>
            <input 
              type="text" 
              name="login" 
              bind:value={login} 
              id="login" 
              class="input-line"
              disabled={isLoading}
            >
        </div>
        
        <div class="label-input">
            <label for="password" class="input-label">Password</label>
            <input 
              type="password" 
              name="password" 
              bind:value={password} 
              id="password" 
              class="input-line"
              disabled={isLoading}
            >
        </div>

        <div class="buttons-container">
            <button type="submit" id="login-button" disabled={isLoading || !isConnected}>
              {#if isLoading}
                Авторизация...
              {:else if !isConnected}
                Подключение к серверу...
              {:else}
                Sign in
              {/if}
            </button>
            <button type="button" id="register-button" onclick="{goToRegister}" disabled={isLoading}>
                Don't have an account? Sign up
            </button>
        </div>
    </form>   
</div>

<!-- Индикатор подключения -->
<div class="connection-status" class:connected={isConnected}>
  {isConnected ? '🟢 Подключено' : '🔴 Не подключено'}
</div>

<Version />

<style>
  #login-text {
    color: rgb(200, 141, 255);
    margin-bottom: 40px;
    text-shadow: 0px 0px 0px palevioletred;
    transition:
      text-shadow 0.5s ease,
      color 0.5s ease;
  }
  #login-text:hover {
    text-shadow: 0px 0px 5px rgb(105, 255, 82);
  }
  #login-text:hover {
    color: rgb(156, 255, 141);
  }

  #login-button {
    box-shadow: 0 0px 10px rgba(0, 0, 0, 0.227);
    background-color: rgba(0, 0, 0, 0.383);
    font-size: 20px;
    width: 300px;
    height: 50px;
    transition:
      border-radius 0.2s ease,
      border-color 0.2s ease;
  }

  #login-button:hover {
    border-color: rgb(105, 255, 82);
  }
  #login-button:hover {
    border-radius: 15px;
  }

  .buttons-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
    align-items: center;
  }

  .label-input {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    margin-bottom: 20px;
    gap: 10px;
  }

  .login-form {
    width: 450px;
    height: 500px;
    margin: auto;
    background-color: rgb(216, 144, 255);
    border-radius: 40px;
    box-shadow: 0 0px 10px rgba(235, 133, 255, 0.301);

    display: flex;
    justify-content: center;
    align-items: center;
  }

  form {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .input-label {
    color: rgb(34, 34, 34);
    font-size: 30px;
    font-weight: bold;
  }

  .input-line {
    box-shadow: 0 0px 10px rgba(0, 0, 0, 0.227);
    color: rgb(40, 40, 40);
    background-color: rgb(255, 255, 255);
    font-size: 24px;
    border-radius: 20px;
    width: 300px;
    height: 50px;
    padding: 8px 12px;
    border: none;
    box-sizing: border-box;
  }

  .input-line::selection {
    background-color: rgb(183, 255, 163);
  }
</style>
