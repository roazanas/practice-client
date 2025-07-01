<script>
  import { push } from "svelte-spa-router";

  let login = $state('');
  let password = $state('');
  let repPassword = $state('');
  let ws;
  let reconnectInterval = null;

  // Чтобы передавать в electron-logger log сообщение, в main.cjs идёт их обработка
  function logSomething(lvl, msg) {
    // @ts-ignore
    window.electronAPI.sendLog(lvl, msg);
  }
  
  let msg = $state('');

  function userRegistration(websocket) {
    const payload = JSON.stringify({
      type: 'registration',
      login,
      password,
    });
    websocket.send(payload);
  }
  function scheduleReconnect() {
    if (reconnectInterval) return;
    reconnectInterval = setInterval(() => {
      logSomething('INFO', `Login error Attempting to reconnect WebSocket...`);
      userRegistration(ws);
    }, 10 * 1000);
  }

  function correctPass(event) {
    event.preventDefault();

    if (String(repPassword) !== String(password)) {
      msg = 'Entered passwords do not match';
      return;
    }
    else {
      msg = '';
    }

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      ws = new WebSocket('ws://localhost:8000');

      ws.onopen = () => {
        userRegistration(ws);
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'registration' && data.info === "success") {
          push('/login');
        } else if (data.type === 'registration' && data.info === "login") {
          alert('Пользователь с таким логином уже существует');
          login = '';
        }
      };

      ws.onerror = (error) => {
        logSomething('ERROR', `WebSocket error: ${error.type}`);
        scheduleReconnect();
      };

      ws.onclose = () => {
        logSomething('WARN', 'WebSocket connection closed, attempting to reconnect...');
        scheduleReconnect();
      };
    }
  }

</script>


<h1 id="reg-text">Registration form</h1>
<div class="register-form">
    <form onsubmit="{correctPass}">

        <div class="reg-label-input">
            <label for="login" class="input-label">Login</label>
            <input type="text" name="login" bind:value={login} id="login" class="input-line" minlength="3">
        </div>
        
        <div class="reg-label-input">
            <label for="reg-password" class="input-label">Password</label>
            <input type="password" name="reg-password" bind:value={password} id="reg-password" class="input-line" minlength="5">
        </div>

        <div class="reg-label-input" id="box-rep-password">
            <label for="rep-reg-password" class="input-label">Repeat password</label>
            <input type="password" name="rep-reg-password" bind:value={repPassword} id="rep-reg-password" class="input-line">
        </div>

        <button id="reg-button">Sign up</button>
    </form>
  </div>
  <b style="font-size: 24px; font-color: white;" class="info-msg">{msg}</b>


<style>
    .info-msg{
        font-size: 24px;
        color: rgb(255, 255, 255);
    }
    #reg-text{
        color: rgb(200, 141, 255);
        margin-bottom: 40px;
        text-shadow: 0px 0px 0px palevioletred;
        transition: text-shadow 0.5s ease,
                    color 0.5s ease;
    }
    #reg-text:hover{
        text-shadow: 0px 0px 5px rgb(105, 255, 82);
    }
    #reg-text:hover{
        color: rgb(156, 255, 141);
    }

    #box-rep-password{
        margin-top: -30px;
    }

    #reg-button{
        box-shadow: 0 0px 10px rgba(0, 0, 0, 0.227);
        background-color: rgba(0, 0, 0, 0.383);
        font-size: 20px;
        width: 300px;
        height: 50px;
        transition:  border-radius 0.2s ease,
                     border-color 0.2s ease;
    }

    #reg-button:hover{
        border-color: rgb(105, 255, 82);
    }
    #reg-button:hover{
        border-radius: 15px;
    }

    .reg-label-input{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start; 
        margin-bottom: 20px;
        gap: 10px;
    }

    .register-form {
        width: 450px;
        height: 600px;
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
        gap: 40px;
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

    .input-line::selection{
        background-color: rgb(183, 255, 163);
    }
</style>