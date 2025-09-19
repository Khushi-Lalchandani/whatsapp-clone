import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database"
import { getMessaging, getToken, onMessage } from "firebase/messaging"

const firebaseConfig = {
  apiKey: "AIzaSyDTwymf17u3DX7ZEtnNDSrQQyEI9NKlviM",
  authDomain: "chat-clone-476fc.firebaseapp.com",
  databaseURL: "https://chat-clone-476fc-default-rtdb.firebaseio.com",
  projectId: "chat-clone-476fc",
  storageBucket: "chat-clone-476fc.firebasestorage.app",
  messagingSenderId: "868830980940",
  appId: "1:868830980940:web:2d13480e9d09913277fde9",
  measurementId: "G-PTRKQT486Y",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const database = getDatabase(app)
export const messaging = getMessaging(app)

// Register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then((registration) => {
      console.log("Service Worker registered with scope:", registration.scope)
    })
    .catch((err) => {
      console.error("Service Worker registration failed:", err)
    })
}

export const generateToken = async () => {
  const permission = await Notification.requestPermission()
  console.log("Notification permission:", permission)

  if (permission === "granted") {
    try {
      const token = await getToken(messaging, {
        vapidKey:
          "BIK82ZYONmb7_1dzl3mFhz1P0uENN3ZQqcfT5bKdEqOgEkOOb3NHgpy8VU_v5WghoM_eA8U4UJMi0O60g5XG0DM",
      })
      console.log("FCM Token:", token)

      // Store token in user's profile for server-side messaging
      if (auth.currentUser && token) {
        await storeUserToken(auth.currentUser.uid, token)
      }

      return token
    } catch (err) {
      console.error("Error getting FCM token:", err)
    }
  } else {
    console.warn("Notification permission was not granted.")
  }
}

// Store user's FCM token in database
export const storeUserToken = async (userId, token) => {
  try {
    const { ref, set } = await import("firebase/database")
    const tokenRef = ref(database, `userTokens/${userId}`)
    await set(tokenRef, {
      token: token,
      timestamp: Date.now(),
      platform: "web",
    })
    console.log("FCM token stored for user:", userId)
  } catch (error) {
    console.error("Error storing FCM token:", error)
  }
}

// Foreground messages (when app is open)
// export const onMessageListener = () =>
//   new Promise((resolve) => {
//     onMessage(messaging, (payload) => {
//       console.log("Foreground message:", payload)
//       resolve(payload)
//     })
//   })

export const listenForegroundMessages = (callback) => {
  return onMessage(messaging, (payload) => {
    console.log("Foreground message:", payload)
    if (callback) callback(payload)
  })
}
