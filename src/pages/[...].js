import React from "react"
import { Link, navigate } from "gatsby"
import { useQuery, useMutation, useQueryClient } from "react-query"

import "./../styles/index.css"
import { serializeBuffer } from "../lib/utils"
import { fetchNotes, saveNote } from "../lib/api"
import Note from "../components/note"

const NotePage = (props) => {
  const selectedId = props["*"]
  // Access the client
  const queryClient = useQueryClient()

  // Queries
  const notesQuery = useQuery("fetchNotes", fetchNotes)

  // Mutations
  const notesMutation = useMutation(saveNote, {
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries("fetchNotes")
      navigate("/" + data.id)
    },
  })

  const handleSubmitNote = (note) => {
    notesMutation.mutate(note)
  }

  const notes = notesQuery.data || []
  const selectedNote = notes.find((note) => {
    return note.id === selectedId
  })

  return (
    <main>
      <header>
        <h1>
          <Link to="/">
            <span role="img">😎</span> <mark>Notes</mark>
          </Link>
        </h1>
        {notesQuery.data && (
          <menu>
            {notesQuery.data
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
        )}
      </header>

      {notesQuery.isLoading ? (
        <section>
          <p>Loading...</p>
        </section>
      ) : (
        <Note
          note={selectedNote}
          onSubmitNote={handleSubmitNote}
          disabled={selectedNote?.id || notesMutation.isLoading}
        />
      )}
    </main>
  )
}

export default NotePage
