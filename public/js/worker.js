console.log('Loaded service worker!');

// Listen for notification
self.addEventListener('push', ev => {
    const data = ev.data.json();
    console.log('Got push', data);
    self.registration.showNotification(data.title, {
        body: data.body,
        icon: '../assets/icons/mstile-310x310.png',
        data: {
            url: data.url
        }
    });
});

// Handle notification click
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
})