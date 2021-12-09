export const encodeText = (text) => {
  return new TextEncoder().encode(text)
}

export const decodeText = (buffer) => {
  return new TextDecoder().decode(buffer)
}

export const serializeBuffer = (buffer) => {
  return String.fromCharCode(...new Int8Array(buffer))
}

export const deserializeBuffer = (bufferString) => {
  const chars = Array.from(bufferString).map((ch) => ch.charCodeAt())
  return Int8Array.from(chars).buffer
}
