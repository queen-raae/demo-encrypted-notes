import React, { useRef, useState, useEffect } from "react"
import localforage from "localforage"
import axios from "axios"

import { encrypt, decrypt, generateKey, generateNonce } from "../lib/crypto"

const NOTES_ENDPOINT = "/api/notes"

const initKey = async () => {
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

const fetchNotes = async (key) => {
  try {
    const { data } = await axios.get(NOTES_ENDPOINT)
    const notePromises = data.notes.map(async (note) => {
      note.entry = await decrypt(note.entry.cypher, key, note.entry.iv)
      return note
    })
    return await Promise.all(notePromises)
  } catch (error) {
    console.warn("Fetch Notes", error)
    return []
  }
}

const saveNote = async ({ date, entry }, key) => {
  try {
    const iv = generateNonce()

    const note = {
      date: date,
      entry: {
        cypher: await encrypt(entry, key, iv),
        iv: iv,
      },
    }

    await axios.post(NOTES_ENDPOINT, note)
    return note
  } catch (error) {
    console.warn("Save Note", error)
    return false
  }
}

const IndexPage = () => {
  const [key, setKey] = useState()
  const [notes, setNotes] = useState([])
  const [saving, setSaving] = useState(false)
  const dateEl = useRef(null)
  const entryEl = useRef(null)
  const formEl = useRef(null)

  useEffect(() => {
    const initData = async () => {
      const key = await initKey()
      setKey(key)
      setNotes(await fetchNotes(key))
    }

    initData()
  }, [])

  const onSubmit = async (event) => {
    event.preventDefault(event)

    const note = {
      date: dateEl.current.value,
      entry: entryEl.current.value,
    }

    setSaving(true)
    const saved = await saveNote(note, key)
    await setNotes(await fetchNotes(key))
    setSaving(false)
    if (saved) {
      formEl.current.reset()
    }
  }

  return (
    <div>
      <form ref={formEl} onSubmit={onSubmit}>
        Date:
        <br />
        <input ref={dateEl} type="date" name="date" />
        <br />
        Notes:
        <br />
        <textarea ref={entryEl} type="text" name="entry" />
        <br />
        <button disabled={!key || saving} type="submit">
          Submit
        </button>
      </form>
      <div>
        {notes.map(({ date, entry }) => {
          return (
            <div key={date}>
              <h1>{date}</h1>
              <p>{entry}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default IndexPage
