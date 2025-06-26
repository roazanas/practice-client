<script>
  let socket;
  let messages = [];
  let input = $state("");
  let updateIsReady = $state(false);

  let myVersion = "1.0.0"; // Из файла

  function checkUpdates() {
    const message = JSON.stringify({ type: "check-update" });
    sendMessage(message);

    // ...
    // updateIsReady = брать из статуса в msg
    // updateIsReady = message.status;
  }

  function installUpdates() {
    const message = JSON.stringify({ type: "get-update" });
    sendMessage(message);
  }

  $effect(() => {
    socket = new WebSocket("ws://localhost:8000/ws");

    socket.onopen = () => {
      console.log("WebSocket connected");

      checkUpdates();
      if (updateIsReady) {
        installUpdates();
      }
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      messages = [...messages, data];
      printMessages();
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
    };

    if (!socket.CONNECTING) {
      console.log();
    }

    return () => {
      socket?.close();
    };
  });

  function sendMessage(msg) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(msg);
      input = "";
    }
  }

  function printMessages() {
    messages.forEach((element) => {
      console.log(element);
    });
  }
</script>

<button onclick={checkUpdates}>Проверить наличие обновлений</button>

<style>

</style>

