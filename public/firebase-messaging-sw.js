// firebase-messaging-sw.js

// Import Firebase scripts (compat versions for service workers)
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
)
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
)

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDTwymf17u3DX7ZEtnNDSrQQyEI9NKlviM",
  authDomain: "chat-clone-476fc.firebaseapp.com",
  databaseURL: "https://chat-clone-476fc-default-rtdb.firebaseio.com",
  projectId: "chat-clone-476fc",
  storageBucket: "chat-clone-476fc.firebasestorage.app",
  messagingSenderId: "868830980940",
  appId: "1:868830980940:web:2d13480e9d09913277fde9",
  measurementId: "G-PTRKQT486Y",
})

// Get messaging instance
const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload)

  // Extract notification data
  const notification = payload.notification || {}
  const data = payload.data || {}

  // Create enhanced notification content
  let notificationTitle = notification.title || "New Message"
  let notificationBody = notification.body || "You have a new message"

  // If we have custom data, format it better
  if (data.senderName && data.message) {
    if (data.isGroup === "true" && data.groupName) {
      notificationTitle = data.groupName
      notificationBody = `${data.senderName}: ${data.message}`
    } else {
      notificationTitle = data.senderName
      notificationBody = data.message
    }
  }

  // Format message content for different types
  if (notificationBody.includes("📁") || notificationBody.includes("file:")) {
    notificationBody = `📁 ${data.senderName || "Someone"} sent a file`
  } else if (
    notificationBody.includes("🖼️") ||
    notificationBody.includes("image:")
  ) {
    notificationBody = `🖼️ ${data.senderName || "Someone"} sent an image`
  } else if (
    notificationBody.includes("🎵") ||
    notificationBody.includes("audio:")
  ) {
    notificationBody = `🎵 ${
      data.senderName || "Someone"
    } sent an audio message`
  } else if (
    notificationBody.includes("🎥") ||
    notificationBody.includes("video:")
  ) {
    notificationBody = `🎥 ${data.senderName || "Someone"} sent a video`
  }

  const notificationOptions = {
    body: notificationBody,
    icon:
      notification.icon || payload.notification?.image || "/firebase-logo.png",
    badge: "/firebase-logo.png",
    tag: data.messageId || "message", // Prevent duplicate notifications
    requireInteraction: true,
    data: {
      ...data,
      clickAction:
        data.isGroup === "true"
          ? `/chat/group/${data.groupId}`
          : `/chat/${data.chatId}`,
      messageText: notificationBody, // Store the formatted message
    }, // Pass through custom data
    actions: [
      {
        action: "open_chat",
        title: "💬 Open Chat",
      },
      {
        action: "mark_read",
        title: "✓ Mark as Read",
      },
    ],
    silent: false,
    vibrate: [200, 100, 200], // Vibration pattern for mobile
    timestamp: Date.now(),
  }

  console.log("Showing notification:", notificationTitle, notificationBody)
  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event)

  event.notification.close()

  const { action } = event
  const { data } = event.notification

  if (action === "mark_read") {
    // Handle mark as read action
    console.log("Mark as read clicked")
    return
  }

  // Default action or 'open_chat' action - open the app
  const urlToOpen =
    data.isGroup && data.groupId
      ? `/chat/group/${data.groupId}`
      : data.chatId
      ? `/chat/${data.chatId}`
      : "/chat"

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus()
          }
        }

        // If app is not open, open it
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})
