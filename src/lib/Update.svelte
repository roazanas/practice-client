<script>
  let socket;
  let messages = [];
  let input = $state("");
  let updateIsReady = $state(false);

  let myVersion = "1.0.0"; // Из файла
  let hash_from = "83b67cb"; // временная затычка, потом брать из git rev-parse HEAD

  function checkUpdates(hash_from) {
    const message = JSON.stringify({ type: "check-update", hash_from });
    sendMessage(message);

    // ...
    // updateIsReady = брать из статуса в msg
    updateIsReady = true;
  }

  function installUpdates(hash_from) {
    const message = JSON.stringify({ type: "get-update", hash_from });
    sendMessage(message);
  }

  $effect(() => {
    socket = new WebSocket("ws://localhost:8000/ws");

    socket.onopen = () => {
      console.log("WebSocket connected");

      checkUpdates(hash_from);
      if (updateIsReady) {
        installUpdates(hash_from);
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

