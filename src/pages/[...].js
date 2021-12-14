import React, { useState, useEffect } from "react"
import { Link, navigate } from "gatsby"
import localforage from "localforage"
import "./../styles/index.css"
import {
  encrypt,
  decrypt,
  generateKey,
  generateNonce,
  exportAsJwk,
} from "../lib/crypto"
import { serializeBuffer } from "../lib/utils"
import { fetchNotes, saveNote } from "../lib/api"

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

const NotePage = (props) => {
  const selectedId = props["*"]
  const [status, setStatus] = useState("initial")
  const [key, setKey] = useState()
  const [jwk, setJwk] = useState()
  const [notes, setNotes] = useState([])
  const [note, setNote] = useState()

  useEffect(() => {
    const initData = async () => {
      console.log("initData")

      const key = await initKey()
      const jwk = await exportAsJwk(key)

      setKey(key)
      setJwk(jwk)

      setNotes(await fetchNotes())
    }

    initData()
  }, [])

  useEffect(() => {
    const initNote = async () => {
      console.log("initNote")

      const selectedNote = notes.find((note) => {
        return note.id === selectedId
      })

      if (selectedNote) {
        setNote({
          ...selectedNote,
          plaintext: await decrypt({ ...selectedNote, key }),
        })
      } else {
        setNote({
          iv: generateNonce(),
          plaintext: "",
        })
      }

      setStatus("ready")
    }

    initNote()
  }, [selectedId, notes, key])

  const handleSubmitNote = async (event) => {
    event.preventDefault(event)
    setStatus("pending")

    const { id } = await saveNote(note)

    if (id) {
      setNotes(await fetchNotes())
      navigate("/" + id)
    } else {
      setStatus("error")
    }
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
          {notes
            .sort((a, b) => (a.id > b.id ? -1 : 1))
            .map((note) => {
              const title = serializeBuffer(note.cyphertext).substring(0, 10)
              return (
                <li
                  key={note.id}
                  className={selectedId === note.id ? "selected" : ""}
                >
                  <Link to={`/${note.id}`}>
                    {title} <br />
                    <small>{note.id.substring(0, 10)}</small>
                  </Link>
                </li>
              )
            })}
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
            <h2>Plaintext</h2>
            <textarea
              type="text"
              name="note"
              value={note.plaintext}
              onChange={handleNoteChange}
              disabled={status !== "ready" || note.id}
            />
            <button type="submit" disabled={status !== "ready" || note.id}>
              Save note
            </button>
          </form>
          <div>
            <h2>Crypto</h2>
            <h3>Key as JSON Web Key (JWK)</h3>
            <pre>{JSON.stringify(jwk, null, 2)}</pre>
            <h3>Initialization Vector (IV)</h3>
            <code>{serializeBuffer(note.iv)}</code>
            <h3>Cyphertext</h3>
            <code>{serializeBuffer(note.cyphertext)}</code>
          </div>
        </>
      )}
    </main>
  )
}

export default NotePage
