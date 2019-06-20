console.log('Loaded service worker!');

// Listen for notification
self.addEventListener('push', ev => {
    const data = ev.data.json();
    ev.waitUntil(
        // Get list of all clients of this worker
        self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function (clientList) {

            // check if there's at least one focused client
            var isFocused = clientList.some(function (client) {
                return client.focused;
            });

            if (isFocused) {
                // send notification data to focused client
                var focused = clientList.filter(obj => {
                    return obj.focused === true
                })

                return send_message_to_client(focused[0], {
                    title: data.title,
                    body: data.body
                })

            } else {
                // display browser notification
                self.registration.showNotification(data.title, {
                    body: data.body,
                    icon: '../assets/icons/mstile-310x310.png',
                    vibrate: [500, 100, 500],
                    data: {
                        url: data.url
                    }
                });
            }

        })
    )
});

// Add event listener for when the notification is clicked
self.addEventListener('notificationclick', function (event) {
    event.waitUntil(
        // Retrieve a list of the clients of this service worker.
        self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
            .then(function (clientList) {
                // If there is at least one client, focus it.
                if (clientList.length > 0) {
                    return clientList[0].focus();
                }

                // Otherwise, open a new page.
                return self.clients.openWindow(event.notification.data.url);
            })
    );
});

// sends message to specified client
function send_message_to_client(client, msg) {
    return new Promise(function (resolve, reject) {
        var msg_chan = new MessageChannel();

        msg_chan.port1.onmessage = function (event) {
            if (event.data.error) {
                reject(event.data.error);
            } else {
                resolve(event.data);
            }
        };

        client.postMessage(msg, [msg_chan.port2]);
    });
}