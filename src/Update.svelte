<script>
    import { onMount } from "svelte";

    let socket;
    let messages = [];
    let input = $state('');

    $effect(() => {
        socket = new WebSocket("ws://localhost:8000/ws");

        socket.onopen = () => {
            console.log("WebSocket connected");
        };

        socket.onmessage = (event) => {
            messages = [...messages, event.data];
        };

        socket.onclose = () => {
            console.log("WebSocket closed");
        };

        if (!socket.CONNECTING){
            console.log();
        }

        return () => {
            socket?.close();
        };
    })


    function sendMessage() {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(input);
            input = '';
        }
    }
</script>

<h1>WebSocket Chat</h1>

<input value={input} placeholder="Введите сообщение..." />
<button onclick={sendMessage}>Отправить</button>

<style>

</style>