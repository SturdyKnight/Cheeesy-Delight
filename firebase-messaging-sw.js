// firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js");

// ✅ Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyDHyrO3YK0JI1wa6I1XQtcTh8asp2p992A",
  authDomain: "cheesydelight-80a43.firebaseapp.com",
  projectId: "cheesydelight-80a43",
  messagingSenderId: "433558050592",
  appId: "1:433558050592:web:169b277e2337931475e945"
});

const messaging = firebase.messaging();

// ✅ Background Notification
messaging.onBackgroundMessage(payload => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || 'logo.png',
    data: {
      url: payload.notification.click_action || 'https://sturdyknight.github.io/kitchen.html'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ Handle Notification Click
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || 'https://sturdyknight.github.io/kitchen.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // If there's already a tab open, focus it
      for (let client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Else open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
