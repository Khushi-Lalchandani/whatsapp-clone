import { toast } from "react-toastify"
import { decryptMessage } from "./encryptUtils"

const processedMessages = new Set()
const recentNotifications = new Map() // Track recent notifications with timestamps
let isInitialLoad = true

// Reduce initial load time to 1 second and add debugging
setTimeout(() => {
  console.log("Notifications are now active")
  isInitialLoad = false
}, 1000)

// Check if app is in foreground
export const isAppInForeground = () => {
  return !document.hidden && document.visibilityState === "visible"
}

// Show browser notification (for background)
export const showBrowserNotification = (
  title,
  body,
  icon = "/firebase-logo.png",
  data = {}
) => {
  if ("Notification" in window && Notification.permission === "granted") {
    console.log("Showing browser notification:", title, body)
    const notification = new Notification(title, {
      body,
      icon,
      badge: icon,
      tag: data.messageId || "message", // Prevent duplicate notifications
      requireInteraction: true, // Keep notification visible until user interacts
      data: data, // Store additional data for click handling
    })

    // Handle notification click
    notification.onclick = (event) => {
      event.preventDefault()
      window.focus() // Focus the window

      // Navigate to chat if data provided
      if (data.isGroup && data.groupId) {
        window.location.href = `/chat/group/${data.groupId}`
      } else if (data.chatId) {
        window.location.href = `/chat/${data.chatId}`
      }

      notification.close()
    }

    return notification
  } else {
    console.warn("Browser notifications not supported or permission denied")
    return null
  }
}

// Enhanced message formatting for notifications
const formatMessageForNotification = (message, maxLength = 100) => {
  if (!message || message.trim() === "") {
    return "New message"
  }

  // Handle different message types
  if (message.startsWith("📁") || message.includes("file:")) {
    return "📁 Sent a file"
  }
  if (message.startsWith("🖼️") || message.includes("image:")) {
    return "🖼️ Sent an image"
  }
  if (message.startsWith("🎵") || message.includes("audio:")) {
    return "🎵 Sent an audio message"
  }
  if (message.startsWith("🎥") || message.includes("video:")) {
    return "🎥 Sent a video"
  }

  // Regular text message
  const cleanMessage = message.trim()
  if (cleanMessage.length <= maxLength) {
    return cleanMessage
  }

  // Truncate at word boundary when possible
  const truncated = cleanMessage.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(" ")

  if (lastSpace > maxLength * 0.8) {
    return cleanMessage.substring(0, lastSpace) + "..."
  }

  return truncated + "..."
}

// Create custom notification content
const createNotificationContent = (
  senderName,
  message,
  isGroup,
  groupName = null
) => {
  const formattedMessage = formatMessageForNotification(message)

  if (isGroup) {
    return {
      title: groupName || "Group Chat",
      body: `${senderName}: ${formattedMessage}`,
      shortTitle: `${senderName} in ${groupName || "group"}`,
    }
  } else {
    return {
      title: senderName,
      body: formattedMessage,
      shortTitle: senderName,
    }
  }
}

export const showMessageNotification = (
  senderName,
  encryptedMessage,
  messageId,
  isGroup = false,
  chatId = null,
  groupId = null,
  groupName = null
) => {
  try {
    const now = Date.now()
    const notificationKey = `${senderName}-${messageId}`

    console.log(
      `Attempting to show notification for ${senderName}, messageId: ${messageId}, isInitialLoad: ${isInitialLoad}`
    )

    if (isInitialLoad) {
      console.log("Notification blocked due to initial load")
      processedMessages.add(messageId)
      return
    }

    if (processedMessages.has(messageId)) {
      console.log("Notification blocked - message already processed")
      return
    }

    // Check for recent duplicate notifications (within 2 seconds)
    if (recentNotifications.has(notificationKey)) {
      const lastTime = recentNotifications.get(notificationKey)
      if (now - lastTime < 2000) {
        console.log("Notification blocked - duplicate within 2 seconds")
        return
      }
    }

    processedMessages.add(messageId)
    recentNotifications.set(notificationKey, now)

    // Decrypt and format the message
    const decryptedMessage = decryptMessage(encryptedMessage)
    const notificationContent = createNotificationContent(
      senderName,
      decryptedMessage,
      isGroup,
      groupName
    )

    // Check if app is in foreground or background
    const inForeground = isAppInForeground()

    console.log(`App in foreground: ${inForeground}`)
    console.log("Notification content:", notificationContent)

    if (inForeground) {
      // Show toast notification for foreground - emphasize the message content
      console.log("Showing toast notification:", notificationContent.title)
      const toastId = `msg-${messageId}-${now}`

      // Create rich toast content
      const toastContent = isGroup
        ? `💬 ${notificationContent.shortTitle}\n"${
            notificationContent.body.split(": ")[1] || notificationContent.body
          }"`
        : `💬 ${notificationContent.title}\n"${notificationContent.body}"`

      toast.info(toastContent, {
        toastId: toastId,
        onClick: () => {
          console.log("Toast notification clicked, navigating to chat...")
          if (isGroup && groupId) {
            window.location.href = `/chat/group/${groupId}`
          } else if (chatId) {
            window.location.href = `/chat/${chatId}`
          }
        },
        autoClose: 6000, // Slightly longer to read the message
        position: "top-right",
        style: {
          whiteSpace: "pre-line", // Allow line breaks in toast
        },
      })
    } else {
      // Show browser notification for background
      console.log("App in background - showing browser notification")
      showBrowserNotification(
        notificationContent.title,
        notificationContent.body,
        "/firebase-logo.png",
        {
          messageId,
          isGroup,
          chatId,
          groupId,
          senderName,
          message: decryptedMessage, // Include full message in data
        }
      )
    }

    console.log("Notification handling completed successfully")
  } catch (error) {
    console.error("Error showing notification:", error)

    // Fallback notification if decryption fails
    const fallbackContent = isGroup
      ? `New message in group from ${senderName}`
      : `New message from ${senderName}`

    if (isAppInForeground()) {
      toast.info(fallbackContent, {
        toastId: `fallback-${messageId}`,
        autoClose: 3000,
        position: "top-right",
      })
    } else {
      showBrowserNotification(
        isGroup ? "New Group Message" : "New Message",
        fallbackContent,
        "/firebase-logo.png",
        { messageId, isGroup, chatId, groupId, senderName }
      )
    }
  }
}

export const getCurrentActiveChat = () => {
  const currentPath = window.location.pathname
  if (currentPath.startsWith("/chat/group/")) {
    return {
      type: "group",
      id: currentPath.split("/chat/group/")[1],
    }
  } else if (currentPath.startsWith("/chat/") && currentPath !== "/chat") {
    return {
      type: "user",
      id: currentPath.split("/chat/")[1],
    }
  }
  return null
}

// Clean processed messages and recent notifications every 5 minutes to prevent memory issues
setInterval(() => {
  const size = processedMessages.size
  const recentSize = recentNotifications.size
  const now = Date.now()

  if (size > 100) {
    processedMessages.clear()
    console.log(`Cleared ${size} processed messages from memory`)
  }

  // Clean recent notifications older than 10 minutes
  for (const [key, timestamp] of recentNotifications.entries()) {
    if (now - timestamp > 10 * 60 * 1000) {
      recentNotifications.delete(key)
    }
  }

  if (recentSize > recentNotifications.size) {
    console.log(
      `Cleaned ${
        recentSize - recentNotifications.size
      } old recent notifications`
    )
  }
}, 5 * 60 * 1000) // 5 minutes

// Add debug function to test notifications (disabled in production)
export const testNotification = () => {
  if (import.meta.env.DEV) {
    console.log("Testing notification system...")
    toast.success(
      "Test notification - If you see this, react-toastify is working!",
      {
        position: "top-right",
        autoClose: 3000,
        toastId: `test-${Date.now()}`,
      }
    )
  }
}
