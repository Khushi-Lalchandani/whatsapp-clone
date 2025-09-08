// utils/encryptUtils.js
import CryptoJS from "crypto-js"

// 32-char secret key (AES-256)
const SECRET_KEY = "4f91b83e72a645f6c12d3a9c8f64d1a9"

export const encryptMessage = (message) => {
  try {
    return CryptoJS.AES.encrypt(message, SECRET_KEY).toString()
  } catch (error) {
    console.error("Encryption error:", error)
    return null
  }
}

export const decryptMessage = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY)
    return bytes.toString(CryptoJS.enc.Utf8) || "Decryption failed"
  } catch (error) {
    console.error("Decryption error:", error)
    return "Decryption error"
  }
}
