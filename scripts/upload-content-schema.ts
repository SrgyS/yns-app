import 'dotenv/config'
import { compileFromFile } from 'json-schema-to-typescript'
import { promises as fsPromises } from 'fs'
import * as path from 'path'

// Функция для скачивания и сохранения файла
async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${process.env.CONTENT_TOKEN}`,
      Accept: 'application/vnd.github.v3.raw',
    },
  })

  if (!response.ok) {
    throw new Error(
      `Ошибка при загрузке ${url}: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.text()

  await fsPromises.writeFile(outputPath, data)
}

// Функция для генерации TypeScript типов из JSON схемы
async function generateTypes(
  schemaPath: string,
  outputPath: string
): Promise<void> {
  const ts = await compileFromFile(schemaPath)
  await fsPromises.writeFile(outputPath, ts)
}

// Основная функция
async function downloadAndGenerateTypes(
  schemaDir: string,
  outputDir: string
): Promise<void> {
  const schemaFiles = [
    'manifest.schema.json',
    'course.schema.json',
    'daily-plan.schema.json',
    'workout.schema.json',
    'meal-plan.schema.json',
    'recipe.schema.json',
  ]

  for (const file of schemaFiles) {
    const schemaPath = path.join(schemaDir, file)
    const outputPath = path.join(outputDir, file)

    // Скачивание файла
    await downloadFile(schemaPath, outputPath)

    // Генерация TypeScript типов
    const typesOutputPath = path.join(outputDir, file.replace('.json', '.d.ts'))
    await generateTypes(outputPath, typesOutputPath)
  }
}

// Чтение аргументов командной строки
const [schemaDir, outputDir] = process.argv.slice(2)

if (!schemaDir || !outputDir) {
  console.error(
    'Необходимо указать оба пути: путь к схемам и путь для выходных файлов'
  )
  process.exit(1)
}

downloadAndGenerateTypes(schemaDir, outputDir)
  .then(() => console.log('Схемы скачаны и типы сгенерированы!'))
  .catch(error => console.error('Произошла ошибка:', error))
