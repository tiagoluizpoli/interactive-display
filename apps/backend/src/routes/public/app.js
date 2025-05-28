const socket = io();
socket.on('connect', () => {
  console.log(`${socket.id} connected`);
});

socket.on('slide', (currentPresentation) => {
  console.log(currentPresentation);

  const { presentation, displayEnabled } = currentPresentation;
  const area = document.getElementById('area');
  if (presentation && displayEnabled === true) {
    const title = document.getElementById('title');
    const description = document.getElementById('description');
    const qrcode = document.getElementById('qrcode');
    const banner = document.getElementById('banner');

    if (
      presentation.qrCodeContent &&
      !presentation.qrCodeContent.startsWith('data:') &&
      !presentation.qrCodeContent.startsWith('http')
    ) {
      qrcode.src = `data:image/png;base64,${presentation.qrCodeContent}`;
    } else {
      qrcode.src = presentation.qrCodeContent || '';
    }
    title.innerHTML = presentation.title;
    description.innerHTML = presentation.description;

    banner.src = presentation.imageUrl;

    area.classList.remove('hidden');
    return;
  }
  area.classList.add('hidden');
});
