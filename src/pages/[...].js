import React, { useState, useEffect } from "react"
import { Link } from "gatsby"
import localforage from "localforage"
import axios from "axios"
import "./../styles/index.css"
import {
  encrypt,
  decrypt,
  generateKey,
  generateNonce,
  exportAsJwk,
} from "../lib/crypto"

const NOTES_ENDPOINT = "/api/notes"
const NEW_NOTE = {
  iv: generateNonce(),
  cyphertext: "",
  plaintext: "",
}

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
    const notePromises = data.notes.map(async ({ id, entry }) => {
      return {
        id: id,
        date: id.substring(0, 10),
        plaintext: await decrypt({
          cyphertext: entry.cypher,
          key: key,
          iv: entry.iv,
        }),
        cyphertext: entry.cypher,
        iv: entry.iv,
      }
    })

    return await Promise.all(notePromises)
  } catch (error) {
    console.warn("Fetch Notes", error)
    return []
  }
}

const saveNote = async ({ id, iv, cyphertext }) => {
  try {
    const note = {
      id: id,
      entry: {
        cypher: cyphertext,
        iv: iv,
      },
    }

    await axios.post(NOTES_ENDPOINT, note)
    return true
  } catch (error) {
    console.warn("Save Note", error)
    return false
  }
}

const NotePage = (props) => {
  const id = props["*"]
  const [status, setStatus] = useState("initial")
  const [key, setKey] = useState()
  const [jwk, setJwk] = useState()
  const [notes, setNotes] = useState([])
  const [note, setNote] = useState()

  useEffect(() => {
    const initData = async () => {
      const key = await initKey()
      const jwk = await exportAsJwk(key)
      const notes = await fetchNotes(key)
      const selectedNote = notes.find((note) => {
        return note.id === id
      })

      console.log(jwk)

      setKey(key)
      setJwk(jwk)
      setNotes(notes)
      setNote(selectedNote || NEW_NOTE)
      setStatus("ready")
    }

    initData()
  }, [id])

  const handleSubmitNote = async (event) => {
    event.preventDefault(event)
    setStatus("pending")

    await saveNote(note)
    await fetchNotes()

    setStatus("ready")
  }

  const handleNoteChange = async (event) => {
    const plaintext = event.target.value

    setNote((note) => {
      return { ...note, plaintext }
    })

    const cyphertext = await encrypt({ plaintext, key, iv: note.iv })

    setNote((note) => {
      return {
        ...note,
        cyphertext,
      }
    })
  }

  return (
    <main>
      <header>
        <h1>
          <Link to="/">
            <span role="img">😎</span> <mark>Notes</mark>
          </Link>
        </h1>
        <menu>
          <ul>
            {notes
              .sort((a, b) => (a.id > b.id ? -1 : 1))
              .map(({ id, date, plaintext }) => {
                const title = plaintext.substring(0, 20)
                return (
                  <li key={id}>
                    <a href={id}>{title}</a>
                    <br></br>
                    <small>{date}</small>
                  </li>
                )
              })}
          </ul>
        </menu>
      </header>

      {status === "initial" && (
        <section>
          <p>Loading...</p>
        </section>
      )}

      {note && (
        <>
          <form onSubmit={handleSubmitNote}>
            <h2>{note.id ? "Edit note" : "New note"}</h2>
            <textarea
              type="text"
              name="note"
              value={note.plaintext}
              onChange={handleNoteChange}
            />
            <button type="submit" disabled={status === "pending"}>
              Save note
            </button>
          </form>
          <div>
            <h2>Crypto</h2>
            <h3>Key as JWK</h3>
            <pre>{JSON.stringify(jwk, null, 2)}</pre>
            <h3>IV</h3>
            <pre>{note.iv}</pre>
            <h3>Cyphertext</h3>
            <pre>{note.cyphertext}</pre>
          </div>
        </>
      )}
    </main>
  )
}

export default NotePage
