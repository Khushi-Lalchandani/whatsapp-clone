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
  console.log(
    "[firebase-messaging-sw.js] Received background message:",
    payload
  )

  const { title, body, icon } = payload.notification

  self.registration.showNotification(title, {
    body,
    icon: icon || "/firebase-logo.png",
  })
})
