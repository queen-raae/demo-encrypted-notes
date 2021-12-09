import {
  deserializeBuffer,
  serializeBuffer,
  encodeText,
  decodeText,
} from "./utils"

const ALGORITHM = "AES-GCM"
const KEY_LENGTH = 256

export const encrypt = async (text, key, iv) => {
  const cypherBuffer = await window.crypto.subtle.encrypt(
    { name: ALGORITHM, iv: deserializeBuffer(iv) },
    key,
    encodeText(text)
  )

  return serializeBuffer(cypherBuffer)
}

export const decrypt = async (cypher, key, iv) => {
  try {
    const textBuffer = await window.crypto.subtle.decrypt(
      { name: ALGORITHM, iv: deserializeBuffer(iv) },
      key,
      deserializeBuffer(cypher)
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

export const generateNonce = () => {
  const nonce = window.crypto.getRandomValues(new Int8Array(12))
  return serializeBuffer(nonce)
}
