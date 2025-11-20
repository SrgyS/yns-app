import { injectable } from 'inversify'
import { AdapterUser } from 'next-auth/adapters'

@injectable()
export abstract class CreateUserService {
  abstract exec(
    data: Omit<AdapterUser, 'id'> & { password: string }
  ): Promise<AdapterUser>
}
