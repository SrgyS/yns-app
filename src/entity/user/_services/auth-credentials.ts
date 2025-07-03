import { injectable } from 'inversify'
import { dbClient } from '@/shared/lib/db'
import bcrypt from 'bcryptjs'
import { SharedUser } from '@/kernel/domain/user'

@injectable()
export class AuthCredentialsService {
  async validateCredentials(email: string, password: string): Promise<SharedUser | null> {
    const user = await dbClient.user.findUnique({
      where: { email }
    })

    if (!user || !user.password) {
      return null
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      image: user.image,
      emailVerified: user.emailVerified,
    }
  }
}