<script>
  import { auth } from "../store.js";
  import { push } from "svelte-spa-router";
  import Version from "./Version.svelte";
  // import WebSocket from 'ws';

  let login = "";
  let password = "";
  let ws = new WebSocket("ws://localhost:8000/ws");
  let reconnectInterval = null;

  // Чтобы передавать в electron-logger log сообщение, в main.cjs идёт их обработка
  function logSomething(lvl, msg) {
    // @ts-ignore
    window.electronAPI.sendLog(lvl, msg);
  }

  function sendLogin(websocket) {
    const payload = JSON.stringify({
      type: "auth",
      login,
      password,
    });
    websocket.send(payload);
  }

  function scheduleReconnect() {
    if (reconnectInterval) return;
    reconnectInterval = setInterval(() => {
      logSomething("INFO", "Login error Attempting to reconnect WebSocket...");
      sendLogin(ws);
    }, 10 * 1000);
  }

  function applyLogin(event) {
    event.preventDefault();

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      ws = new WebSocket("ws://localhost:8000/ws");

      ws.onopen = () => {
        sendLogin(ws);
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "auth" && data.success) {
          auth.login();
          push("/");
        } else {
          alert("Неверный логин или пароль");
        }
      };

      ws.onerror = (error) => {
        logSomething("ERROR", `WebSocket error: ${error}`);
        scheduleReconnect();
      };

      ws.onclose = () => {
        logSomething(
          "WARN",
          "WebSocket connection closed, attempting to reconnect...",
        );
        scheduleReconnect();
      };
    }
  }

  function goToRegister() {
    push("/register");
  }
</script>

<h1 id="login-text">Login form</h1>
<div class="login-form">
  <form onsubmit={applyLogin}>
    <div class="label-input">
      <label for="login" class="input-label">Login</label>
      <input
        type="text"
        name="login"
        bind:value={login}
        id="login"
        class="input-line"
      />
    </div>

    <div class="label-input">
      <label for="password" class="input-label">Password</label>
      <input
        type="password"
        name="password"
        bind:value={password}
        id="password"
        class="input-line"
      />
    </div>

    <div class="buttons-container">
      <button type="submit" id="login-button">Sign in</button>
      <button type="button" id="register-button" onclick={goToRegister}>
        Don't have an account? Sign up
      </button>
    </div>
  </form>
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
