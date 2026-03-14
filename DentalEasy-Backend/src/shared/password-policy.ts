import crypto from 'crypto';
import { ValidationError } from './errors';

const minimumPasswordLength = 12;

const knownWeakPasswords = new Set([
  '123456',
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'senha',
  'senha123',
  'qwerty',
  'admin',
  'letmein',
  'welcome',
  'abc123',
  'iloveyou',
]);

const isSequential = (password: string): boolean => {
  const lowered = password.toLowerCase();
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789',
    'qwertyuiopasdfghjklzxcvbnm',
  ];

  return sequences.some(
    (sequence) => sequence.includes(lowered) || sequence.includes([...lowered].reverse().join('')),
  );
};

export const isStrongPassword = (password: string): boolean => {
  const normalized = password.trim();
  if (normalized.length < minimumPasswordLength) {
    return false;
  }

  if (knownWeakPasswords.has(normalized.toLowerCase())) {
    return false;
  }

  if (/^(.)\1+$/.test(normalized)) {
    return false;
  }

  if (isSequential(normalized)) {
    return false;
  }

  const hasUpperCase = /[A-Z]/.test(normalized);
  const hasLowerCase = /[a-z]/.test(normalized);
  const hasNumber = /[0-9]/.test(normalized);

  return hasUpperCase && hasLowerCase && hasNumber;
};

export const assertStrongPassword = (password: string): void => {
  if (!isStrongPassword(password)) {
    throw new ValidationError('Senha nao atende aos requisitos de seguranca.');
  }
};

const passwordAlphabet =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+-=';

export const generateTemporaryPassword = (length = 16): string => {
  const bytes = crypto.randomBytes(length);
  let generated = '';

  for (let index = 0; index < length; index += 1) {
    generated += passwordAlphabet[bytes[index] % passwordAlphabet.length];
  }

  if (!isStrongPassword(generated)) {
    return generateTemporaryPassword(length);
  }

  return generated;
};
