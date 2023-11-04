import { promises as fsPromises } from "fs"
import * as path from "path"
import * as emojme from "emojme"

const slackTokenJson = JSON.parse(Bun.env.SLACK_TOKEN_JSON!)

const directoryPath = path.join(import.meta.dir, "emoji")

async function getFilePaths(dir: string) {
  let filePaths: string[] = []
  try {
    const files = await fsPromises.readdir(dir, { withFileTypes: true })
    for (const file of files) {
      const fullPath = path.join(dir, file.name)

      if (file.name.startsWith("_")) {
        console.log(`Skipped: ${fullPath}`)
        continue
      }

      if (file.isDirectory()) {
        filePaths.push(...(await getFilePaths(fullPath)))
      } else if (file.name.match(/\.(gif|jpg|jpeg|png)/)) {
        filePaths.push(fullPath)
      } else {
        console.info(`Skipped: ${fullPath}`)
        continue
      }
    }
  } catch (err: any) {
    console.error(`Error reading directory: ${err.message}`)
  }
  return filePaths
}

async function upload() {
  const filePaths = await getFilePaths(directoryPath)

  const emojiList = filePaths.map((filePath) => {
    const name = path.basename(filePath, path.extname(filePath))

    return {
      name,
      is_alias: 0,
      alias_for: null,
      url: filePath,
    }
  })

  const { domain, token, cookie } = slackTokenJson
  const result = await emojme.upload(domain, token, cookie, {
    src: emojiList as unknown as any,
    verbose: true,
  })

  console.info(result[domain])
}

await upload()
