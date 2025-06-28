<script>
  let socket;
  let messages = [];
  let input = $state("");
  let updateIsReady = $state(false);

  $effect(() => {
    socket = new WebSocket("ws://localhost:8000/ws");

    socket.onopen = () => {
      console.log("WebSocket connected");

      // checkUpdates();
      if (updateIsReady) {
        // installUpdates();
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

<button onclick={printMessages}>Проверить наличие обновлений</button>

<style>

</style>

