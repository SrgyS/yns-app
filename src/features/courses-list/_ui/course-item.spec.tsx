import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CourseItem } from './course-item'

describe('course item', () => {
  it('should call delete callback', async () => {
    const onDelete = jest.fn()
    render(
      <CourseItem
        course={{
          id: '1',
          name: 'Test Course',
          description: 'Test Description',
        }}
        onDelete={onDelete}
      />
    )

    const deleteButton = screen.getByText('Удалить')
    await userEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalled()
  })
})
