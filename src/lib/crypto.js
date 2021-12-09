import {
  deserializeBuffer,
  serializeBuffer,
  encodeText,
  decodeText,
} from "./utils"

const ALGORITHM = "AES-GCM"
const KEY_LENGTH = 256

export const encrypt = async ({ plaintext, key, iv }) => {
  const cypherBuffer = await window.crypto.subtle.encrypt(
    { name: ALGORITHM, iv: deserializeBuffer(iv) },
    key,
    encodeText(plaintext)
  )

  return serializeBuffer(cypherBuffer)
}

export const decrypt = async ({ cyphertext, key, iv }) => {
  try {
    const textBuffer = await window.crypto.subtle.decrypt(
      { name: ALGORITHM, iv: deserializeBuffer(iv) },
      key,
      deserializeBuffer(cyphertext)
    )

    return decodeText(textBuffer)
  } catch (error) {
    return "Bad encryption"
  }
}

export const generateKey = async () => {
  return await window.crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"]
  )
}

export const exportAsJwk = async (key) => {
  return await crypto.subtle.exportKey("jwk", key)
}

export const generateNonce = () => {
  const nonce = window.crypto.getRandomValues(new Int8Array(12))
  return serializeBuffer(nonce)
}
