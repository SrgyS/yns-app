const apiKey = process.env.KINESCOPE_API_KEY
const projectId = process.env.KINESCOPE_PROJECT_ID
const knowledgeFolderId = process.env.KINESCOPE_KNOWLEDGE_FOLDER_ID

export const kinescopeConfig = {
  apiKey,
  projectId,
  knowledgeFolderId,
}

// export function ensureKinescopeConfig(required: Array<keyof typeof kinescopeConfig> = []) {
//   const missing = required.filter(key => !kinescopeConfig[key])
//   if (missing.length > 0) {
//     throw new Error(`Kinescope config missing: ${missing.join(', ')}`)
//   }
// }
