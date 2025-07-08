import { injectable } from 'inversify';
import { dbClient } from '@/shared/lib/db';
import { VerificationToken } from '@/kernel/domain/verification-token';


@injectable()
export class VerificationTokenService {
  async getVerificationToken(token: string): Promise<VerificationToken | null> {
    const verificationToken = await dbClient.verificationToken.findFirst({
      where: { token },
    });
    return verificationToken;
  }
}