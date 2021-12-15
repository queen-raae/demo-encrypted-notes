import axios from "axios"

import { deserializeBuffer, serializeBuffer } from "./utils"

const NOTES_ENDPOINT = "/api/notes"

const transformNote = ({ id, entry }) => {
  return {
    id: id,
    ciphertext: deserializeBuffer(entry.cipher),
    iv: deserializeBuffer(entry.iv),
  }
}

export const fetchNotes = async () => {
  const { data } = await axios.get(NOTES_ENDPOINT)
  return data.notes.map(transformNote)
}

export const saveNote = async ({ id, iv, ciphertext }) => {
  const note = {
    id: id,
    entry: {
      cipher: serializeBuffer(ciphertext),
      iv: serializeBuffer(iv),
    },
  }

  const { data } = await axios.post(NOTES_ENDPOINT, note)
  return transformNote(data.note)
}
