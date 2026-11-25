import type { User } from '@prisma/client';

export type AuthUserEntity = Pick<User, 'id' | 'email' | 'phone' | 'roles' | 'createdAt'>;
export type { UserRole } from '@prisma/client';
