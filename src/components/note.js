import React, { useState, useEffect } from "react"
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

const Note = ({ note: originalNote, onSubmitNote, disabled }) => {
  const [key, setKey] = useState()
  const [jwk, setJwk] = useState()
  const [note, setNote] = useState()

  useEffect(() => {
    const init = async () => {
      console.log("initData")

      const key = await initKey()
      const jwk = await exportAsJwk(key)

      setKey(key)
      setJwk(jwk)
    }

    init()
  }, [])

  useEffect(() => {
    const decryptNote = async () => {
      const thePlaintext = await decrypt({
        cyphertext: originalNote.cyphertext,
        iv: originalNote.iv,
        key,
      })
      setNote({
        ...originalNote,
        plaintext: thePlaintext,
      })
    }

    if (originalNote) {
      decryptNote()
    } else {
      setNote({ plaintext: "" })
    }
  }, [originalNote, key])

  const handleNoteChange = async (event) => {
    const theText = event.target.value
    const theIv = note?.iv || generateNonce()

    setNote((note) => {
      return { ...note, plaintext: theText }
    })

    const theCypherText = await encrypt({
      plaintext: theText,
      iv: theIv,
      key,
    })

    setNote((note) => {
      return { ...note, iv: theIv, cyphertext: theCypherText }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setNote((note) => {
      return { ...note, isProcessing: true }
    })

    onSubmitNote(note)
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h2>Plaintext</h2>
        <textarea
          type="text"
          name="note"
          value={note?.plaintext || ""}
          onChange={handleNoteChange}
          disabled={disabled || note.isProcessing}
        />
        <button
          type="submit"
          disabled={disabled || !note?.cyphertext || note.isProcessing}
        >
          Save note
        </button>
      </form>
      <div>
        <h2>Crypto</h2>
        <h3>Key as JSON Web Key (JWK)</h3>
        <pre>{JSON.stringify(jwk, null, 2)}</pre>
        <h3>Initialization Vector (IV)</h3>
        <code>{serializeBuffer(note?.iv)}</code>
        <h3>Cyphertext</h3>
        <code>{serializeBuffer(note?.cyphertext)}</code>
      </div>
    </>
  )
}

export default Note
