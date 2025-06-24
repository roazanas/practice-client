<script>
    let socket;
    let messages = $state([]);
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

    // function printMessages(){
    //     messages.forEach(element => {
    //         console.log(element);
    //     });
        
    // }
</script>

<!-- <input bind:value={input} placeholder="Введите сообщение..." />
<button onclick={sendMessage}>Отправить</button>

<button onclick={printMessages}>Вывести сообщения в консоль</button> -->

<style>

</style>