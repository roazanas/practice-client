<script>
    let socket;
    let messages = [];
    let input = $state('');
    let updateIsReady = $state(false);

    let myVersion = "1.0.0"; // Из файла

    function CheckUpdates(version){
        const message = JSON.stringify({ key: "update", version });
        sendMessage(message);

        // ...

        updateIsReady = true;
    }

    function InstallUpdates(){
        return true;
    }

    $effect(() => {
        socket = new WebSocket("ws://localhost:8000/ws");

        socket.onopen = () => {
            console.log("WebSocket connected");

            CheckUpdates(`"version": ${myVersion}`);

            if (updateIsReady) {
                InstallUpdates();
            }

        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if ('version' in data){
                console.log("Пришла версия: ", data.version);
            }

            messages = [...messages, data];

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

    function sendMessage(msg) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            msg = input; // Temp
            socket.send(msg);
            input = '';
        }
    }

    function printMessages(){
        messages.forEach(element => {
            console.log(element);
        });
        
    }
</script>

<input bind:value={input} placeholder="Введите сообщение..." />
<button onclick={sendMessage}>Отправить</button>

<button onclick={printMessages}>Вывести сообщения в консоль</button>

<style>

</style>