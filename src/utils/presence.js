// utils/presence.js
import { ref, set, onDisconnect, onValue } from "firebase/database"
import { database } from "../firebase/firebase"

export const setupPresence = (userId, isOnline) => {
  const userStatusRef = ref(database, `/users/${userId}/status`)
  const connectedRef = ref(database, '.info/connected')

  if (isOnline) {
    // Set up real-time presence detection
    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        // User is connected
        const status = {
          state: "online",
          last_changed: Date.now(),
        }

        // Set user as online
        set(userStatusRef, status)

        // Set up automatic offline detection when user disconnects
        onDisconnect(userStatusRef).set({
          state: "offline",
          last_changed: Date.now(),
        })
      }
    })
  } else {
    // Manual logout - set offline immediately
    const status = {
      state: "offline",
      last_changed: Date.now(),
    }
    return set(userStatusRef, status)
  }
}
