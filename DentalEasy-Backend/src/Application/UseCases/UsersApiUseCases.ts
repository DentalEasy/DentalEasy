import { prisma } from '../../Infrastructure/Persistence';
import { ensureRole } from '../../shared/access-control';
import { UserContext } from '../../shared/types';
import { ApiUser, mapUser } from './shared-contracts';

export class UsersApiUseCases {
  async listDentists(user: UserContext): Promise<ApiUser[]> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);

    const dentists = await prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        role: 'DENTIST',
        active: true,
      },
      orderBy: { name: 'asc' },
    });

    return dentists.map((dentist) => mapUser(dentist));
  }
}
