import createError from "http-errors"
import Joi from "joi"
import { format } from "date-fns"

import OctoStorage from "./../api-services/octo-storage"

const { upsertFile, retrieveFiles } = OctoStorage()

export default async (req, res) => {
  console.log(`${req.baseUrl} - ${req.method}`)

  try {
    if (req.method === "POST") {
      await upsertHandler(req, res)
    } else if (req.method === "GET") {
      await getHandler(req, res)
    } else {
      throw createError(405, `${req.method} not allowed`)
    }
  } catch (error) {
    if (Joi.isError(error)) {
      error = createError(422, error)
    }

    let status = error.statusCode || 500
    let message = error.message

    // Something went wrong, log it
    console.error(`${status} -`, message)

    // Respond with error code and message
    res.status(status).json({
      message: error.expose ? message : `Faulty ${req.baseUrl}`,
    })
  }
}

const upsertHandler = async (req, res) => {
  // 1. Validate the data coming in
  const schema = Joi.object({
    date: Joi.date().required(),
    entry: Joi.object({
      iv: Joi.string(),
      cypher: Joi.string(),
    }).required(),
  }).required()

  const { date, entry } = await schema.validateAsync(req.body)

  // 2. Upsert github file
  const file = await upsertFile({
    filename: format(date, "yyyy-MM-dd"),
    content: JSON.stringify(entry),
  })

  res.json({ note: file, message: "Note saved/updated" })
}

const getHandler = async (req, res) => {
  // 1. No data to validate

  // 2. Retreive all file
  const files = await retrieveFiles()
  res.json({
    notes: files.map(({ filename, content }) => {
      return { date: filename, entry: content }
    }),
    message: "Retreived ",
  })
}
