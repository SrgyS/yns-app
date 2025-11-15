import { $Enums } from '@prisma/client'

export const ADMIN = {
  id: 'admin',
  email: 'admin@gmail.com',
  name: 'ADMIN',
  testPassword: '1234',
  role: $Enums.ROLE.ADMIN,
}

export const USER = {
  id: 'user',
  email: 'user@gmail.com',
  testPassword: '1234',
  role: $Enums.ROLE.USER,
  name: 'seed USER-1',
}

export const USER_2 = {
  id: 'user-2',
  email: 'user2@gmail.com',
  testPassword: '1234',
  role: $Enums.ROLE.USER,
  name: 'seed USER-2',
}
