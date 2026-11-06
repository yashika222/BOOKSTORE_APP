export const PASSWORD_HINT =
  'Use at least 8 characters, including one letter and one number.';

export function validatePassword(password: string): string | null {
  if (typeof password !== 'string' || password.length < 8) {
    return PASSWORD_HINT;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return PASSWORD_HINT;
  }
  if (password.length > 72) {
    return 'Password cannot be longer than 72 characters.';
  }
  return null;
}
