import React from "react"

const NoteLoading = () => {
  return (
    <>
      <form>
        <h2>Plaintext</h2>
        <textarea type="text" name="note" value="Loading..." disabled />
        <button type="submit" disabled>
          Save note
        </button>
      </form>
      <div>
        <h2>Crypto</h2>
      </div>
    </>
  )
}

export default NoteLoading
