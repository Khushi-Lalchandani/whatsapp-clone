import { toast } from "react-toastify"
import { decryptMessage } from "./encryptUtils"

const processedMessages = new Set()
let isInitialLoad = true

setTimeout(() => {
  isInitialLoad = false
}, 2000)

export const showMessageNotification = (
  senderName,
  encryptedMessage,
  messageId,
  isGroup = false
) => {
  try {
    if (isInitialLoad || processedMessages.has(messageId)) {
      processedMessages.add(messageId)
      return
    }

    processedMessages.add(messageId)

    const decryptedMessage = decryptMessage(encryptedMessage)
    const messagePreview =
      decryptedMessage.length > 50
        ? decryptedMessage.substring(0, 50) + "..."
        : decryptedMessage

    const notificationContent = isGroup
      ? `New message in ${senderName} ${messagePreview}`
      : `New message from ${senderName} ${messagePreview}`

    toast.info(notificationContent, {
      toastId: `message-${messageId}`,
      onClick: () => {},
    })
  } catch (error) {
    console.error("Error showing notification:", error)
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
