/**
 * Password Policies & Default Provisioning Password
 */

import bcrypt from 'bcryptjs';

export const DEFAULT_PASSWORD = 'Password123';

export async function isDefaultPasswordHash(hash: string | null | undefined): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(DEFAULT_PASSWORD, hash);
}
