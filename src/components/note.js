import React, { useState, useEffect } from "react"

import {
  encrypt,
  decrypt,
  initKey,
  generateIv,
  exportAsJwk,
} from "../lib/crypto"
import { serializeBuffer } from "../lib/utils"

const Note = ({ note: originalNote, onSubmitNote }) => {
  const [key, setKey] = useState()
  const [jwk, setJwk] = useState()
  const [note, setNote] = useState()

  useEffect(() => {
    const init = async () => {
      const key = await initKey()
      const jwk = await exportAsJwk(key)

      setKey(key)
      setJwk(jwk)
    }

    init()
  }, [])

  useEffect(() => {
    if (!key) return

    const decryptOriginalNote = async () => {
      const thePlaintext = await decrypt({
        ciphertext: originalNote.ciphertext,
        iv: originalNote.iv,
        key,
      })

      setNote({
        ...originalNote,
        plaintext: thePlaintext,
      })
    }

    if (originalNote) {
      decryptOriginalNote()
    } else {
      setNote({ plaintext: "" })
    }
  }, [originalNote, key])

  const handleNoteChange = async (event) => {
    const theText = event.target.value
    const theIv = note?.iv || generateIv()

    setNote((note) => {
      return { ...note, plaintext: theText }
    })

    const theCipherText = await encrypt({
      plaintext: theText,
      iv: theIv,
      key,
    })

    setNote((note) => {
      return { ...note, iv: theIv, ciphertext: theCipherText }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setNote((note) => {
      return { ...note, isProcessing: true }
    })

    onSubmitNote(note)
  }

  if (!note) return null

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h2>Plaintext</h2>
        <textarea
          type="text"
          name="note"
          value={note?.plaintext || ""}
          onChange={handleNoteChange}
          disabled={note.isProcessing}
        />
        <button type="submit" disabled={!note?.ciphertext || note.isProcessing}>
          Save note
        </button>
      </form>
      <div>
        <h2>Crypto</h2>
        <h3>Key as JSON Web Key (JWK)</h3>
        <pre>{JSON.stringify(jwk, null, 2)}</pre>
        <h3>Initialization Vector (IV)</h3>
        <code>{serializeBuffer(note?.iv)}</code>
        <h3>Ciphertext</h3>
        <code>{serializeBuffer(note?.ciphertext)}</code>
      </div>
    </>
  )
}

export default Note
