import axios from "axios"

import { deserializeBuffer, serializeBuffer } from "./utils"

const NOTES_ENDPOINT = "/api/notes"

const transformNote = ({ id, entry }) => {
  return {
    id: id,
    cyphertext: deserializeBuffer(entry.cypher),
    iv: deserializeBuffer(entry.iv),
  }
}

export const fetchNotes = async () => {
  const { data } = await axios.get(NOTES_ENDPOINT)
  return data.notes.map(transformNote)
}

export const saveNote = async ({ id, iv, cyphertext }) => {
  const note = {
    id: id,
    entry: {
      cypher: serializeBuffer(cyphertext),
      iv: serializeBuffer(iv),
    },
  }

  const { data } = await axios.post(NOTES_ENDPOINT, note)
  return transformNote(data.note)
}
