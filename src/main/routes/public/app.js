
const socket = io()
socket.on('connect', () => {

    console.log(`${socket.id} connected`);
});


socket.on('slide', (msg) => {
    console.log(msg);
    const area = document.getElementById('area');
    if (msg) {

        const title = document.getElementById('title');
        const description = document.getElementById('description');
        const qrcode = document.getElementById('qrcode');
        const banner = document.getElementById('banner');


        if (msg.qrCodeContent && !msg.qrCodeContent.startsWith('data:') && !msg.qrCodeContent.startsWith('http')) {
            qrcode.src = `data:image/png;base64,${msg.qrCodeContent}`;
        } else {
            qrcode.src = msg.qrCodeContent || '';
        }
        title.innerHTML = msg.title;
        description.innerHTML = msg.description;

        banner.src = msg.imageUrl;


        area.classList.remove('hidden');
        return;
    }
    area.classList.add('hidden');

})