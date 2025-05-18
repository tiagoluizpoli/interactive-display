
const socket = io()
socket.on('connect', () => {

    console.log(`${socket.id} connected`);
});


socket.on('slide', (msg) => {
    console.log(msg)
    if (msg.uuid !== null) {

        const playing = document.getElementById('playing');
        playing.innerHTML = msg.name;
    }
})