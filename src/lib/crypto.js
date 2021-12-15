import { encodeText, decodeBuffer } from "./utils"
import localforage from "localforage"

export const encrypt = async ({ plaintext, key, iv }) => {
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encodeText(plaintext)
  )

  return ciphertext
}

export const decrypt = async ({ ciphertext, key, iv }) => {
  try {
    const textBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    )

    return decodeBuffer(textBuffer)
  } catch (error) {
    return "Bad encryption"
  }
}

export const generateKey = async () => {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  )
}

export const exportAsJwk = async (key) => {
  return await crypto.subtle.exportKey("jwk", key)
}

export const initKey = async () => {
  try {
    let key = await localforage.getItem("cryptokey")
    if (!key) {
      key = await generateKey()
    }
    return await localforage.setItem("cryptokey", key)
  } catch (error) {
    console.error(error)
  }
}

export const generateIv = () => {
  const nonce = window.crypto.getRandomValues(new Int8Array(12))
  return nonce
}
