import { test, expect } from '@playwright/test'

test('create delete course list', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Название курса' }).click()
  await page.getByRole('textbox', { name: 'Название курса' }).fill('Test course name')
  await page.getByRole('textbox', { name: 'Описание курса' }).click()
  await page.getByRole('textbox', { name: 'Описание курса' }).fill('Test course description')

  await page.getByRole('button', { name: 'Добавить' }).click()

  await expect(page.getByText('Test course nameTest course descriptionУдалить')).toBeVisible()

  await page.getByRole('button', { name: 'Удалить' }).click()
})
