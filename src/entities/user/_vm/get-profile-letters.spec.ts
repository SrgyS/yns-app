import { getProfileLetters } from './get-profile-letters'

describe('get profile letters', () => {
  test('should split by .', () => {
    const res = getProfileLetters({
      email: 'igor.petrov@gmail.com',
      name: 'Igor.Petrov',
    })

    expect(res).toEqual('IP')
  })

  test('should split by -', () => {
    const res = getProfileLetters({
      email: 'igor.petrov@gmail.com',
      name: 'Igor-Petrov',
    })

    expect(res).toEqual('IP')
  })

  test('should split by _', () => {
    const res = getProfileLetters({
      email: 'igor.petrov@gmail.com',
      name: 'Igor_Petrov',
    })

    expect(res).toEqual('IP')
  })

  test('should split by space', () => {
    const res = getProfileLetters({
      email: 'igor.petrov@gmail.com',
      name: 'Igor Petrov',
    })

    expect(res).toEqual('IP')
  })

  test('should return first 2 letters if no separator', () => {
    const res = getProfileLetters({
      email: 'igor.petrov@gmail.com',
      name: 'IgorPetrov',
    })

    expect(res).toEqual('IG')
  })
  test('should return first 2 letters if no separator email', () => {
    const res = getProfileLetters({
      email: 'igorpetrov@gmail.com',
    })

    expect(res).toEqual('IG')
  })
  test('should return email if empty username', () => {
    const res = getProfileLetters({
      email: 'igorpetrov@gmail.com',
      name: '',
    })

    expect(res).toEqual('IG')
  })

  test('should work with short names', () => {
    const res = getProfileLetters({
      email: 'igorpetrov@gmail.com',
      name: 'I',
    })

    expect(res).toEqual('I')
  })
})
