import axios from "axios"

import { deserializeBuffer, serializeBuffer } from "./utils"

const NOTES_ENDPOINT = "/api/notes"

export const fetchNotes = async () => {
  try {
    const { data } = await axios.get(NOTES_ENDPOINT)
    const notes = data.notes.map(({ id, entry }) => {
      return {
        id: id,
        cyphertext: deserializeBuffer(entry.cypher),
        iv: deserializeBuffer(entry.iv),
      }
    })

    return notes
  } catch (error) {
    console.warn("Fetch Notes", error)
    return []
  }
}

export const saveNote = async ({ id, iv, cyphertext }) => {
  try {
    const note = {
      id: id,
      entry: {
        cypher: serializeBuffer(cyphertext),
        iv: serializeBuffer(iv),
      },
    }

    const { data } = await axios.post(NOTES_ENDPOINT, note)
    return data.note
  } catch (error) {
    console.warn("Save Note", error)
    return {}
  }
}
