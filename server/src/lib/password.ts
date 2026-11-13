import bcrypt from 'bcryptjs';

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 12);
}

export function comparePassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}
