import createError from "http-errors"
const { Octokit } = require("@octokit/rest")

export default ({
  githubToken = process.env.GITHUB_TOKEN,
  githubOwner = process.env.GIHUB_OWNER,
  githubRepo = process.env.GITHUB_REPO,
  basePath = process.env.BASE_PATH,
} = {}) => {
  const octokit = new Octokit({
    auth: githubToken,
  })

  const repoInfo = {
    owner: githubOwner,
    repo: githubRepo,
    path: `${basePath}`,
  }

  const upsertFile = async ({ filename, content }) => {
    const params = {
      ...repoInfo,
      path: `${repoInfo.path}/${filename}`,
      message: "Create file",
      content: Buffer.from(content, "utf8").toString("base64"),
    }

    try {
      const existingFile = await octokit.repos.getContent(params)
      params.message = "Update file"
      params.sha = existingFile.data.sha
    } catch (error) {
      // No existing file
    }

    try {
      const file = await octokit.repos.createOrUpdateFileContents(params)
      return file
    } catch (error) {
      console.warn("OctoStorage:", error.message)
      throw createError(500, error.message)
    }
  }

  const retrieveFiles = async () => {
    try {
      const { data } = await octokit.repos.getContent({
        ...repoInfo,
      })

      const filePromises = data.map(async (file) => {
        const { data } = await octokit.repos.getContent({
          ...repoInfo,
          path: file.path,
        })

        return {
          filename: file.name,
          content: JSON.parse(
            Buffer.from(data.content, data.encoding).toString("utf8")
          ),
        }
      })

      const files = await Promise.all(filePromises)
      return files
    } catch (error) {
      console.warn("OctoStorage:", error.message)

      if (error.status === 404) {
        return []
      } else {
        throw createError(500, error.message)
      }
    }
  }

  return {
    upsertFile,
    retrieveFiles,
  }
}
