// utils/presence.js
import { ref, set, onDisconnect, onValue } from "firebase/database"
import { database } from "../firebase/firebase"

let connectedListener = null

export const setupPresence = (userId, isOnline) => {
  if (!userId) {
    console.warn('setupPresence called without userId')
    return
  }

  const userStatusRef = ref(database, `/users/${userId}/status`)
  const connectedRef = ref(database, ".info/connected")

  // Clean up previous listeners if they exist
  if (connectedListener) {
    connectedListener()
    connectedListener = null
  }

  if (isOnline) {
    console.log(`Setting up presence for user: ${userId}`)
    
    // Listen to connection status
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        console.log('User connected to Firebase')
        
        const status = {
          state: "online",
          last_changed: Date.now(),
        }

        // Set online status
        set(userStatusRef, status)
          .then(() => {
            console.log('Online status set successfully')
          })
          .catch((error) => {
            console.error('Failed to set online status:', error)
          })

        // Set up offline trigger when disconnected
        onDisconnect(userStatusRef).set({
          state: "offline",
          last_changed: Date.now(),
        })
          .then(() => {
            console.log('Offline trigger set successfully')
          })
          .catch((error) => {
            console.error('Failed to set offline trigger:', error)
          })
      } else {
        console.log('User disconnected from Firebase')
      }
    })
    
    connectedListener = unsubscribe
  } else {
    console.log(`Setting offline status for user: ${userId}`)
    
    const status = {
      state: "offline",
      last_changed: Date.now(),
    }
    
    return set(userStatusRef, status)
      .then(() => {
        console.log('Offline status set successfully')
      })
      .catch((error) => {
        console.error('Failed to set offline status:', error)
      })
  }
}

// Clean up presence when user logs out or component unmounts
export const cleanupPresence = () => {
  if (connectedListener) {
    connectedListener()
    connectedListener = null
  }
}
